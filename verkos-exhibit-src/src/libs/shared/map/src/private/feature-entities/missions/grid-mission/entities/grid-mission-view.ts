import { v4 } from 'uuid';
import {
  IEventType,
  IGridMissionView,
  IGridMissionViewOptions,
  IPosition,
  TakeoffMode,
  WaypointData,
} from '@map/public/contracts';
import { MapColor } from '@map/public/core';
import {
  ICompositeManager,
  IFBMarker,
  IFBPolygon,
  IFBPolyline,
  MarkerStyle,
} from '@map/private/contracts';

import {
  ITakeoffPathService,
  MissionSvgUtils,
  TakeoffPathService,
} from '@map/private/feature-entities/missions/shared';

import {
  DEFAULT_SELECTED_MISSION_LABEL_STYLE,
  DEFAULT_SELECTED_PATH_STYLE,
  DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE,
  DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE,
  DEFAULT_SELECTED_GRID_MISSION_POLYGON_STYLE,
  DEFAULT_UNSELECTED_PATH_STYLE,
  DEFAULT_UNSELECTED_TAKE_OFF_REFERENCE_POINT_STYLE,
  DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE,
  DEFAULT_UNSELECTED_GRID_MISSION_POLYGON_STYLE,
  DEFAULT_UNSELECTED_MISSION_LABEL_STYLE,
} from '@map/private/feature-entities/missions/shared/constants';

/**
 * GridMissionView class implementing ILinearMissionView interface
 *
 * This class provides a read-only view of a grid mission with a reference point,
 * waypoints, path, and polygon visualization. It supports selection and visibility
 * toggling, allowing applications to display completed grid missions and highlight
 * selected missions. When selected, both waypoints and polygon vertices are highlighted.
 */
export class GridMissionView implements IGridMissionView {
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
  private _startMarker: IFBMarker | null = null;
  private _endMarker: IFBMarker | null = null;
  private _missionPath!: IFBPolyline;
  private _polygon!: IFBPolygon | null;
  private _polygonVertices: IPosition[] = [];
  private _clickCallback!: () => void;
  private _missionName: string;

  private _getStartMarkerImage(selected: boolean): string {
    return MissionSvgUtils.getTextedMissionMarker(
      'S',
      selected ? MapColor.BLUE_TINT : MapColor.GREY_TINT
    );
  }

  private _getEndMarkerImage(selected: boolean): string {
    return MissionSvgUtils.getTextedMissionMarker(
      'E',
      selected ? MapColor.BLUE_TINT : MapColor.GREY_TINT
    );
  }

  /**
   * Constructor for GridMissionView
   *
   * @param compositeManager The composite manager for creating composite entities
   * @param options Configuration options for the grid mission
   */
  constructor(
    compositeManager: ICompositeManager,
    options: IGridMissionViewOptions
  ) {
    this.id = options.id || `grid-mission-view-${v4()}`;
    this._missionName = options?.name?.trim() ?? '';
    this._isVisible =
      options.isVisible !== undefined ? options.isVisible : true;
    this._isSelected = options.isSelected || false;
    this._compositeManager = compositeManager;
    this.referencePoint = { ...options.referencePoint };

    if (options.polygonVertices && options.polygonVertices.length > 0) {
      this._polygonVertices = options.polygonVertices.map((v) => ({
        ...v,
      }));
    }

    this._originalRltWaypoints = structuredClone(options.waypoints);

    this._convertedHaeWaypoints = this._convertWaypointsToHAE(
      structuredClone(this._originalRltWaypoints)
    );

    this.waypoints = this._convertedHaeWaypoints;

    this.takeoffAltitude = options.takeoffAltitude;

    this.takeoffMode = options.takeoffMode;

    this._takeoffPathService = new TakeoffPathService();

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
   * When selected, the mission will use a highlighted visual style for
   * waypoints, path, and polygon.
   *
   * @param selected Whether the mission should be selected
   */
  public setSelected(selected: boolean): void {
    try {
      if (this._isSelected === selected) {
        return;
      }

      this._isSelected = selected;

      const selectedAsPrimitive = Boolean(selected);

      const refImagePath = selectedAsPrimitive
        ? structuredClone(DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE).image
        : structuredClone(DEFAULT_UNSELECTED_TAKE_OFF_REFERENCE_POINT_STYLE)
            .image;
      this._referencePointMarker.updateImage(refImagePath!);

      this._startMarker?.updateImage(
        this._getStartMarkerImage(selectedAsPrimitive)
      );
      this._endMarker?.updateImage(
        this._getEndMarkerImage(selectedAsPrimitive)
      );

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

      if (this._polygon) {
        this._polygon.setStyle(
          selectedAsPrimitive
            ? structuredClone(DEFAULT_SELECTED_GRID_MISSION_POLYGON_STYLE)
            : structuredClone(DEFAULT_UNSELECTED_GRID_MISSION_POLYGON_STYLE)
        );
      }
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

    this._referencePointMarker.setVisibility(visible);

    this._startMarker?.setVisibility(visible);
    this._endMarker?.setVisibility(visible);

    this._missionPath.setVisibility(visible);

    if (this._polygon) {
      this._polygon.setVisibility(visible);
    }
  }

  /**
   * Disposes of this mission view, removing it from the map.
   * After calling this method, the mission view is no longer usable.
   */
  public remove(): void {
    if (this._referencePointMarker) {
      this._referencePointMarker.remove();
    }

    this._startMarker?.remove();
    this._startMarker = null;
    this._endMarker?.remove();
    this._endMarker = null;

    if (this._missionPath) {
      this._missionPath.remove();
    }

    if (this._polygon) {
      this._polygon.remove();
      this._polygon = null;
    }
  }

  /**
   * Centers the map view on this mission.
   * This will adjust the camera to show the entire mission path and polygon.
   */
  public panTo(): void {
    if (this._missionPath) {
      this._missionPath.panTo();
    } else if (this._polygon) {
      this._polygon.panTo();
    }
  }

  /**
   * Event handler for mission events.
   * This allows the application to respond to only click events related to the mission.
   * @param event Event type to listen for
   * @param callback Function to call when event occurs
   */
  public onEvent(event: IEventType, callback: () => void): void {
    this._clickCallback = callback;
  }

  /**
   * Initialize the visual entities for the mission
   * (reference point marker, waypoint markers, path, and polygon)
   * @private
   */
  private _initializeEntities(): void {
    this._createReferencePointMarker();

    this._createWaypointMarkers();

    this._createMissionPath();

    if (this._polygonVertices.length > 0) {
      this._createPolygon();
    }

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
    this._startMarker?.remove();
    this._startMarker = null;
    this._endMarker?.remove();
    this._endMarker = null;

    if (this.waypoints.length === 0) {
      return;
    }

    const startWaypoint = this.waypoints[0];
    const endWaypoint = this.waypoints[this.waypoints.length - 1];

    const startMarkerStyle: MarkerStyle = {
      ...(this._isSelected
        ? structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE)
        : structuredClone(DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE)),
      image: this._getStartMarkerImage(this._isSelected),
      scale: 1.2,
    };

    this._startMarker = this._compositeManager.createFBMarker({
      position: startWaypoint.position,
      style: startMarkerStyle,
      showHeightReference: true,
      clickable: true,
      editable: false,
      hoverable: false,
      visible: this._isVisible,
    });

    // Only add END marker if it is a different waypoint position (avoid overlap on single waypoint missions).
    if (this.waypoints.length > 1) {
      const endMarkerStyle: MarkerStyle = {
        ...(this._isSelected
          ? structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE)
          : structuredClone(DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE)),
        image: this._getEndMarkerImage(this._isSelected),
        scale: 1.2,
      };

      this._endMarker = this._compositeManager.createFBMarker({
        position: endWaypoint.position,
        style: endMarkerStyle,
        showHeightReference: true,
        clickable: true,
        editable: false,
        hoverable: false,
        visible: this._isVisible,
      });
    }
  }

  /**
   * Create the polyline representing the mission path
   * @private
   */
  private _createMissionPath(): void {
    if (this.waypoints.length === 0) {
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

    const firstWaypoint = this.waypoints[0].position;

    const takeoffPath = this._takeoffPathService.generateTakeoffPath(
      this.referencePoint,
      firstWaypoint,
      this.takeoffMode,
      this.takeoffAltitude
    );

    const waypointPositions = this.waypoints.map((wp) => wp.position);

    const allPositions =
      takeoffPath.length > 0 && waypointPositions.length > 1
        ? [...takeoffPath, ...waypointPositions.slice(1)]
        : takeoffPath.length > 0
        ? takeoffPath
        : waypointPositions;

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
   * Create the polygon representing the grid area
   * @private
   */
  private _createPolygon(): void {
    if (this._polygonVertices.length < 3) {
      // Need at least 3 vertices to create a polygon
      return;
    }

    const haeVertices = this._polygonVertices.map((vertex) => ({
      latitude: vertex.latitude,
      longitude: vertex.longitude,
      altitude: (this.referencePoint?.altitude ?? 0) + (vertex.altitude ?? 0),
    }));

    this._polygon = this._compositeManager.createFBPolygon({
      positions: haeVertices,
      style: this._isSelected
        ? structuredClone(DEFAULT_SELECTED_GRID_MISSION_POLYGON_STYLE)
        : structuredClone(DEFAULT_UNSELECTED_GRID_MISSION_POLYGON_STYLE),
      editable: false,
      showDistanceLabels: false,
      clickable: true,
    });

    this._polygon.setVisibility(this._isVisible);
  }

  /**
   * Register event handlers for markers, path, and polygon
   * @private
   */
  private _registerEventHandlers(): void {
    const refMarkerEmitter = this._referencePointMarker.getEventEmitter();
    refMarkerEmitter.addListener(IEventType.CLICK, () => {
      if (!this._isSelected) {
        this.setSelected(true);
        if (this._clickCallback) {
          this._clickCallback();
        }
      }
    });

    const startMarkerEmitter = this._startMarker?.getEventEmitter();
    startMarkerEmitter?.addListener(IEventType.CLICK, () => {
      if (!this._isSelected) {
        this.setSelected(true);
        if (this._clickCallback) {
          this._clickCallback();
        }
      }
    });

    const endMarkerEmitter = this._endMarker?.getEventEmitter();
    endMarkerEmitter?.addListener(IEventType.CLICK, () => {
      if (!this._isSelected) {
        this.setSelected(true);
        if (this._clickCallback) {
          this._clickCallback();
        }
      }
    });

    const pathEmitter = this._missionPath.getEventEmitter();
    pathEmitter.addListener(IEventType.CLICK, () => {
      if (!this._isSelected) {
        this.setSelected(true);
        if (this._clickCallback) {
          this._clickCallback();
        }
      }
    });

    if (this._polygon) {
      const polygonEmitter = this._polygon.getEventEmitter();
      polygonEmitter.addListener(IEventType.CLICK, () => {
        if (!this._isSelected) {
          this.setSelected(true);
          if (this._clickCallback) {
            this._clickCallback();
          }
        }
      });
    }
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
      const haePosition: IPosition = {
        ...waypoint.position,
        altitude:
          (this.referencePoint?.altitude ?? 0) +
          (waypoint.position?.altitude ?? 0),
      };
      return {
        ...waypoint,
        position: haePosition,
      };
    });
  }
}
