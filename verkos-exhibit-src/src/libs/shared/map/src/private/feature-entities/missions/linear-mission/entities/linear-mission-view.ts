import { v4 } from 'uuid';
import {
  IEventType,
  ILinearMissionOptions,
  ILinearMissionView,
  IPosition,
  TakeoffMode,
  WaypointData,
} from '@map/public/contracts';
import {
  ICompositeManager,
  IFBMarker,
  IFBPolyline,
  MarkerStyle,
} from '@map/private/contracts';
import { ITakeoffPathService } from '../services';
import {
  DEFAULT_UNSELECTED_MISSION_LABEL_STYLE,
  MissionSvgUtils,
  TakeoffPathService,
} from '@map/private/feature-entities/missions/shared';
import {
  DEFAULT_SELECTED_MISSION_LABEL_STYLE,
  DEFAULT_SELECTED_PATH_STYLE,
  DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE,
  DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE,
  DEFAULT_UNSELECTED_PATH_STYLE,
  DEFAULT_UNSELECTED_TAKE_OFF_REFERENCE_POINT_STYLE,
  DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE,
} from '@map/private/feature-entities/missions/shared';

/**
 * LinearMissionView class implementing ILinearMissionView interface
 *
 * This class provides a read-only view of a linear mission with a reference point
 * and a series of waypoints connected by a path. It supports selection and visibility
 * toggling, allowing applications to display completed missions and highlight
 * selected missions.
 */
export class LinearMissionView implements ILinearMissionView {
  // Required properties from ILinearMissionView
  public readonly id: string;
  public readonly referencePoint: IPosition;
  public readonly waypoints: ReadonlyArray<WaypointData>;
  public readonly takeoffMode: TakeoffMode;
  public readonly takeoffAltitude: number;

  // Added properties to store original RLT waypoints
  private _originalRltWaypoints: ReadonlyArray<WaypointData>;
  private _convertedHaeWaypoints: WaypointData[];

  // Private properties
  private _isSelected = false;
  private _isVisible = true;
  private _compositeManager: ICompositeManager;
  private _takeoffPathService: ITakeoffPathService;

  // Composite entities
  private _referencePointMarker!: IFBMarker;
  private _waypointMarkers: IFBMarker[] = [];
  private _missionPath!: IFBPolyline;
  private _clickCallback!: () => void;
  private _missionName: string;

  /**
   * Constructor for LinearMissionView
   *
   * @param compositeManager The composite manager for creating composite entities
   * @param options Configuration options for the linear mission
   */
  constructor(
    compositeManager: ICompositeManager,
    options: ILinearMissionOptions
  ) {
    this.id = options.id || `linear-mission-view-${v4()}`;

    this._missionName = options?.name?.trim() ?? '';
    this._isVisible =
      options.isVisible !== undefined ? options.isVisible : true;
    this._isSelected = options.isSelected || false;
    this._compositeManager = compositeManager;
    this.referencePoint = { ...options.referencePoint };

    // Store original RLT waypoints
    this._originalRltWaypoints = structuredClone(options.waypoints);

    // Convert RLT waypoints to HAE
    this._convertedHaeWaypoints = this._convertWaypointsToHAE(
      structuredClone(this._originalRltWaypoints)
    );

    // Make the converted HAE waypoints available through the public property
    this.waypoints = this._convertedHaeWaypoints;

    // Initialize takeoff settings with minimum altitude enforcement
    if (options.takeoffAltitude < 2) {
      console.warn(
        'Takeoff altitude was less than 2 meters. Setting to minimum safe value of 2 meters.'
      );
      this.takeoffAltitude = 2;
    } else {
      this.takeoffAltitude = options.takeoffAltitude;
    }
    this.takeoffMode = options.takeoffMode;

    // Initialize services
    this._takeoffPathService = new TakeoffPathService();

    // Initialize the visual entities
    this._initializeEntities();
  }

  /**
   * Get whether this mission is currently selected.
   */
  public get isSelected(): boolean {
    return this._isSelected;
  }

  /**
   * Get whether this mission is currently visible.
   */
  public get isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Sets the selection state of this mission.
   * When selected, the mission will use a highlighted visual style.
   *
   * @param selected Whether the mission should be selected
   */
  public setSelected(selected: boolean): void {
    try {
      // Skip if the selection state hasn't changed
      if (this._isSelected === selected) {
        return;
      }

      // Update internal state BEFORE updating the visuals
      this._isSelected = selected;

      // Ensure we're using a primitive boolean
      const selectedAsPrimitive = Boolean(selected);

      // Update reference point marker style
      const refImagePath = selectedAsPrimitive
        ? structuredClone(DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE).image
        : structuredClone(DEFAULT_UNSELECTED_TAKE_OFF_REFERENCE_POINT_STYLE)
            .image;

      this._referencePointMarker.updateImage(refImagePath!);

      // Update waypoint markers
      this._waypointMarkers.forEach((marker, index) => {
        if (selectedAsPrimitive) {
          // When selected, use dynamic SVG with waypoint number
          const waypointNumber = index + 1;
          const dynamicSvgUrl =
            MissionSvgUtils.getLinearMissionWPMarker(waypointNumber);
          marker.updateImage(dynamicSvgUrl);
        } else {
          // When not selected, use original static image
          marker.updateImage(
            structuredClone(DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE).image!
          );
        }
      });

      // Update mission path style
      this._missionPath.setStyle(
        selectedAsPrimitive
          ? structuredClone(DEFAULT_SELECTED_PATH_STYLE)
          : structuredClone(DEFAULT_UNSELECTED_PATH_STYLE)
      );

      this._missionPath.updateCenterLabelStyle(
        selectedAsPrimitive
          ? structuredClone(DEFAULT_SELECTED_MISSION_LABEL_STYLE)
          : structuredClone(DEFAULT_UNSELECTED_MISSION_LABEL_STYLE)
      );
    } catch (error) {
      console.error('Error setting mission selection state:', error);
    }
  }

  /**
   * Sets the visibility of this mission.
   *
   * @param visible Whether the mission should be visible
   */
  public setVisibility(visible: boolean): void {
    this._isVisible = visible;

    // Update visibility of all markers and polyline
    this._referencePointMarker.setVisibility(visible);

    this._waypointMarkers.forEach((marker) => {
      marker.setVisibility(visible);
    });

    this._missionPath.setVisibility(visible);
  }

  /**
   * Disposes of this mission view, removing it from the map.
   * After calling this method, the mission view is no longer usable.
   */
  public remove(): void {
    // Remove reference point marker
    if (this._referencePointMarker) {
      this._referencePointMarker.remove();
    }

    // Remove all waypoint markers
    this._waypointMarkers.forEach((marker) => {
      marker.remove();
    });
    this._waypointMarkers = [];

    // Remove mission path
    if (this._missionPath) {
      this._missionPath.remove();
    }
  }

  /**
   * Centers the map view on this mission.
   * This will adjust the camera to show the entire mission path.
   */
  public panTo(): void {
    // Use the mission path's panTo method to show the entire mission
    if (this._missionPath) {
      this._missionPath.panTo();
    }
  }

  /**
   * Event handler for mission events.
   * This allows the application to respond to only click events related to the mission.
   * @param event Event type to listen for
   * @param callback Function to call when event occurs
   */
  public onEvent(event: IEventType, callback: () => void): void {
    // Store the callback for later use
    this._clickCallback = callback;
  }

  /**
   * Initialize the visual entities for the mission
   * (reference point marker, waypoint markers, and path)
   * @private
   */
  private _initializeEntities(): void {
    // Create reference point marker
    this._createReferencePointMarker();

    // Create waypoint markers
    this._createWaypointMarkers();

    // Create mission path polyline
    this._createMissionPath();

    // Register event handlers
    this._registerEventHandlers();
  }

  /**
   * Create the reference point marker
   * @private
   */
  private _createReferencePointMarker(): void {
    this._referencePointMarker = this._compositeManager.createFBMarker({
      position: this.referencePoint,
      style: this._isSelected
        ? structuredClone(DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE)
        : structuredClone(DEFAULT_UNSELECTED_TAKE_OFF_REFERENCE_POINT_STYLE),
      showHeightReference: true,
      clickable: true,
      editable: false,
      hoverable: false,
      visible: this._isVisible,
    });
  }

  /**
   * Create markers for all waypoints
   * @private
   */
  private _createWaypointMarkers(): void {
    // Clear existing waypoint markers if any
    this._waypointMarkers.forEach((marker) => marker.remove());
    this._waypointMarkers = [];

    // Create a marker for each waypoint
    this.waypoints.forEach((waypoint, index) => {
      let markerStyle: MarkerStyle;
      if (this._isSelected) {
        // When selected, use dynamic SVG with waypoint number
        const waypointNumber = index + 1;
        const dynamicSvgUrl =
          MissionSvgUtils.getLinearMissionWPMarker(waypointNumber);
        markerStyle = {
          ...structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE),
          image: dynamicSvgUrl,
        };
      } else {
        markerStyle = structuredClone(DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE);
      }

      const marker = this._compositeManager.createFBMarker({
        position: waypoint.position,
        style: markerStyle,
        showHeightReference: true,
        clickable: true,
        editable: false,
        hoverable: false,
        visible: this._isVisible,
      });

      this._waypointMarkers.push(marker);
    });
  }

  /**
   * Create the polyline representing the mission path
   * @private
   */
  private _createMissionPath(): void {
    // Check if we have any waypoints
    if (this.waypoints.length === 0) {
      // No waypoints, create an empty path
      this._missionPath = this._compositeManager.createFBPolyline({
        positions: [],
        style: this._isSelected
          ? structuredClone(DEFAULT_SELECTED_PATH_STYLE)
          : structuredClone(DEFAULT_UNSELECTED_PATH_STYLE),
        editable: false,
        hoverable: false,
        clickable: true,
        labelText: this._missionName,
        labelStyle: this._isSelected
          ? structuredClone(DEFAULT_SELECTED_MISSION_LABEL_STYLE)
          : structuredClone(DEFAULT_UNSELECTED_MISSION_LABEL_STYLE),
        visible: this._isVisible,
      });
      return;
    }

    // Get the first waypoint position
    const firstWaypoint = this.waypoints[0].position;

    // Generate a takeoff path using the TakeoffPathService
    const takeoffPath = this._takeoffPathService.generateTakeoffPath(
      this.referencePoint,
      firstWaypoint,
      this.takeoffMode,
      this.takeoffAltitude
    );

    // Get the remaining waypoint positions (excluding the first one that's part of the takeoff path)
    const waypointPositions = this.waypoints.map((wp) => wp.position);

    // Create a complete path by combining:
    // 1. The takeoff path (reference point to first waypoint with proper ascent/descent)
    // 2. The remaining waypoints (skipping the first one to avoid duplication)
    const allPositions =
      takeoffPath.length > 0 && waypointPositions.length > 1
        ? [...takeoffPath, ...waypointPositions.slice(1)]
        : takeoffPath.length > 0
        ? takeoffPath
        : waypointPositions;

    // Create the polyline with the combined path
    this._missionPath = this._compositeManager.createFBPolyline({
      positions: allPositions,
      style: this._isSelected
        ? structuredClone(DEFAULT_SELECTED_PATH_STYLE)
        : structuredClone(DEFAULT_UNSELECTED_PATH_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      labelText: this._missionName,
      labelStyle: this._isSelected
        ? structuredClone(DEFAULT_SELECTED_MISSION_LABEL_STYLE)
        : structuredClone(DEFAULT_UNSELECTED_MISSION_LABEL_STYLE),
      visible: this._isVisible,
      enableDistanceDisplay: true,
    });

    this._missionPath.setDynamicPosition(true);
  }

  /**
   * Register event handlers for markers and path
   * @private
   */
  private _registerEventHandlers(): void {
    // Register click event for reference point marker
    const refMarkerEmitter = this._referencePointMarker.getEventEmitter();
    refMarkerEmitter.addListener(IEventType.CLICK, () => {
      if (!this._isSelected) {
        this.setSelected(true);
        this._clickCallback();
      }
    });

    // Register click events for all waypoint markers
    this._waypointMarkers.forEach((marker, index) => {
      const markerEmitter = marker.getEventEmitter();
      markerEmitter.addListener(IEventType.CLICK, () => {
        if (!this._isSelected) {
          this.setSelected(true);
          this._clickCallback();
        }
      });
    });

    // Register click event for the mission path
    const pathEmitter = this._missionPath.getEventEmitter();
    pathEmitter.addListener(IEventType.CLICK, () => {
      if (!this._isSelected) {
        this.setSelected(true);
        this._clickCallback();
      }
    });
  }

  /**
   * Converts waypoints from Relative (RLT) coordinate system to
   * Height Above Ellipsoid (HAE) coordinate system using the reference point.
   *
   * @param rltWaypoints Waypoints in RLT format (relative to reference point)
   * @returns Waypoints converted to HAE format
   * @private
   */
  private _convertWaypointsToHAE(
    rltWaypoints: ReadonlyArray<WaypointData>
  ): WaypointData[] {
    return rltWaypoints.map((waypoint) => {
      // Create a new position object with converted coordinates
      const haePosition: IPosition = {
        ...waypoint.position,
        altitude:
          (this.referencePoint?.altitude ?? 0) +
          (waypoint.position?.altitude ?? 0),
      };

      // Return a new waypoint with the converted position
      return {
        ...waypoint,
        position: haePosition,
      };
    });
  }
}
