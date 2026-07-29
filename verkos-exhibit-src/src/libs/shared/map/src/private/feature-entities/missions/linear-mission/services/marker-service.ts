import {
  IEventType,
  IOrientation,
  IPosition,
  WaypointData,
  WaypointState,
} from '@map/public/contracts';
import { MapColor } from '@map/public/core';
import {
  ICompositeManager,
  IEvent,
  IFBMarker,
  IFBMarkerOptions,
  IFBModel,
  IFBModelOptions,
  IFBPolyline,
  IFBPolylineOptions,
  ModelAttitude,
} from '@map/private/contracts';
import {
  MissionPlannerConstants,
  MissionSvgUtils,
  TakeoffPathService,
} from '@map/private/feature-entities/missions/shared';
import {
  DEFAULT_SELECTED_ORIENTATION_MODEL_STYLE,
  DEFAULT_SELECTED_PATH_STYLE,
  DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE,
  DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE,
} from '@map/private/feature-entities/missions/shared/constants';

/**
 * Service class for handling markers in the mission planner
 * Manages reference point marker, waypoint markers, mission path and orientation model
 */
export class MarkerService {
  // Markers and visual elements
  private _referenceMarker: IFBMarker | null = null;
  private _waypointMarkers: IFBMarker[] = [];
  private _missionPath: IFBPolyline | null = null; // Legacy path (will be deprecated)
  private _takeoffPath: IFBPolyline | null = null; // Path from reference point to first waypoint
  private _waypointPath: IFBPolyline | null = null; // Path connecting all waypoints
  private _orientationModel: IFBModel | null = null;
  private _isVisible = true;

  // Position tracking for automatic path updates
  private _referencePointPosition: IPosition | null = null;
  private _waypointPositions: Map<number, IPosition> = new Map();
  private _autoUpdatePath = true;

  // Callback for position change events
  private _positionChangeCallback:
    | ((entityId: string, position: IPosition) => void)
    | null = null;

  // Callback for marker click events
  private _markerClickCallback:
    | ((entityId: string, waypointIndex?: number) => void)
    | null = null;

  /**
   * Whether user interactions (click/hover/edit/drag) are enabled for mission planner markers.
   * When disabled, markers are created as non-interactive and existing markers are updated.
   */
  private _interactionsEnabled = true;

  // Callbacks for Alt events on reference marker
  private _altDownCallback: ((entityId: string) => void) | null = null;
  private _altUpCallback: ((entityId: string) => void) | null = null;

  // Map to store event listener functions by entity ID
  private _eventListeners: Map<string, (event: IEvent) => void> = new Map();

  /**
   * Create a new MarkerService
   * @param compositeManager The composite manager used to create entities
   */
  constructor(private readonly _compositeManager: ICompositeManager) {}

  /**
   * Enable/disable interactivity for all existing mission planner markers.
   * This is used to freeze map interactions during client-side multi-select mode.
   */
  public setInteractionsEnabled(enabled: boolean): void {
    const next = Boolean(enabled);
    this._interactionsEnabled = next;

    const setMarkerInteractivity = (marker: IFBMarker | null) => {
      if (!marker) return;
      marker.setClickable(next);
      marker.setHoverable(next);
      marker.setEditable(next);
      marker.setKeyboardControllable(next);
    };

    setMarkerInteractivity(this._referenceMarker);
    this._waypointMarkers.forEach((m) => setMarkerInteractivity(m));
  }

  /**
   * Set up event handlers for a marker
   * @param marker The marker to set up event handlers for
   * @param id The marker's ID
   */
  private _setupMarkerEventHandlers(marker: IFBMarker, id: string): void {
    // Create a position change listener function
    const posListener = (event: IEvent) => {
      // The event should contain the new position
      const newPosition = event?.data?.position || marker.position;
      const entityId = event?.id;

      if (!entityId) {
        console.warn('Entity ID not found for posListener', {
          eventEntityId: entityId,
          callbackEntityId: id,
        });
      }

      // Handle position change internally first
      this._handleMarkerPositionChange(entityId, newPosition);

      // Then call the external callback if registered
      if (this._positionChangeCallback) {
        this._positionChangeCallback(entityId, newPosition);
      }
    };

    // Create a click listener function
    const clickListener = (event: IEvent) => {
      // Call the external click callback if registered
      const entityId = event?.id;
      if (this._markerClickCallback) {
        // Check if this is a waypoint marker
        if (this._waypointMarkers.includes(marker)) {
          // It's a waypoint - pass current index
          const currentIndex = this._waypointMarkers.indexOf(marker);
          this._markerClickCallback(entityId, currentIndex);
        } else {
          // It's a reference point or other marker - pass just ID
          this._markerClickCallback(entityId);
        }
      }
    };

    // Create a left-down listener function
    // This is used to ensure waypoint selection happens immediately when the user starts dragging,
    // not only on CLICK (which may never fire for a drag gesture).
    const leftDownListener = (event: IEvent) => {
      const entityId = event?.id;
      if (!this._markerClickCallback) return;

      if (this._waypointMarkers.includes(marker)) {
        const currentIndex = this._waypointMarkers.indexOf(marker);
        this._markerClickCallback(entityId, currentIndex);
      } else {
        this._markerClickCallback(entityId);
      }
    };

    // Store the listener functions for later removal
    this._eventListeners.set(`${id}-position`, posListener);
    this._eventListeners.set(`${id}-click`, clickListener);
    this._eventListeners.set(`${id}-left-down`, leftDownListener);

    // Register for position change events directly on the marker
    marker
      .getEventEmitter()
      .addListener(IEventType.POSITION_CHANGED, posListener);

    // Register for click events from the marker
    marker.getEventEmitter().addListener(IEventType.CLICK, clickListener);

    // Register for left-down events from the marker (drag start)
    marker
      .getEventEmitter()
      .addListener(IEventType.LEFT_DOWN, leftDownListener);

    // Add Alt event handling specifically for reference point marker
    if (id.includes(MissionPlannerConstants.EntityPrefixes.REFERENCE_POINT)) {
      // Create Alt down listener function
      const altDownListener = () => {
        if (this._altDownCallback) {
          this._altDownCallback(id);
        }
      };

      // Create Alt up listener function (handles both ALT_PLUS_LEFT_UP and LEFT_UP)
      const altUpListener = () => {
        if (this._altUpCallback) {
          this._altUpCallback(id);
        }
      };

      // Store the Alt listener functions for later removal
      this._eventListeners.set(`${id}-alt-down`, altDownListener);
      this._eventListeners.set(`${id}-alt-up`, altUpListener);

      // Register for Alt + Left Down events
      marker
        .getEventEmitter()
        .addListener(IEventType.ALT_PLUS_LEFT_DOWN, altDownListener);

      // Register for Alt + Left Up events
      marker
        .getEventEmitter()
        .addListener(IEventType.ALT_PLUS_LEFT_UP, altUpListener);

      // Also register for regular LEFT_UP as fallback when Alt key is released
      marker.getEventEmitter().addListener(IEventType.LEFT_UP, altUpListener);
    }
  }

  /**
   * Register a callback for position change events
   * @param callback The function to call when a marker's position changes
   */
  public registerPositionChangeCallback(
    callback: (entityId: string, position: IPosition) => void
  ): void {
    this._positionChangeCallback = callback;
  }

  /**
   * Register a callback for marker click events
   * @param callback The function to call when a marker is clicked
   *                 entityId: The ID of the clicked marker
   *                 waypointIndex: The current array index (only for waypoint markers)
   */
  public registerMarkerClickCallback(
    callback: (entityId: string, waypointIndex?: number) => void
  ): void {
    this._markerClickCallback = callback;
  }

  /**
   * Register callbacks for Alt events on the reference marker
   * @param altDownCallback The function to call when Alt + mouse down occurs on reference marker
   * @param altUpCallback The function to call when Alt + mouse up (or regular mouse up) occurs on reference marker
   */
  public registerAltEventCallbacks(
    altDownCallback: (entityId: string) => void,
    altUpCallback: (entityId: string) => void
  ): void {
    this._altDownCallback = altDownCallback;
    this._altUpCallback = altUpCallback;
  }

  /**
   * Create a reference point marker
   * @param id The parent entity ID
   * @param position The position for the marker
   * @returns The created marker
   */
  public createReferenceMarker(id: string, position: IPosition): IFBMarker {
    const markerOptions: IFBMarkerOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.REFERENCE_POINT}`,
      position: position,
      style: {
        ...structuredClone(DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE),
        image: MissionPlannerConstants.AssetPaths.REFERENCE_POINT,
      },
      showHeightReference: true,
      clickable: this._interactionsEnabled,
      hoverable: this._interactionsEnabled,
      editable: this._interactionsEnabled,
      visible: this._isVisible,
      isKeyboardControllable: this._interactionsEnabled,
    };

    this._referenceMarker =
      this._compositeManager.createFBMarker(markerOptions);

    // Track reference point position
    this._referencePointPosition = { ...position };

    // Set up position change event handler
    this._setupMarkerEventHandlers(
      this._referenceMarker,
      this._referenceMarker.id
    );

    return this._referenceMarker;
  }

  /**
   * Create a mission path polyline
   * @param id The parent entity ID
   * @param positions The initial positions for the polyline
   * @returns The created polyline
   * @deprecated Use createTakeoffPath and createWaypointPath instead
   */
  public createMissionPath(id: string, positions: IPosition[]): IFBPolyline {
    // Get reference point and waypoints from positions
    const referencePoint = positions.length > 0 ? positions[0] : null;
    const waypointPositions = positions.length > 1 ? positions.slice(1) : [];

    // Create the mission path (only for waypoints)
    const polylineOptions: IFBPolylineOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.MISSION_PATH}`,
      positions: waypointPositions, // Only include waypoint positions, not reference point
      style: {
        ...structuredClone(DEFAULT_SELECTED_PATH_STYLE),
        color: MapColor.BLUE,
        width: MissionPlannerConstants.Config.DEFAULT_PATH_WIDTH,
      },
      clickable: false,
      hoverable: false,
      editable: false,
      visible: this._isVisible,
      enableDistanceDisplay: false,
    };

    this._missionPath =
      this._compositeManager.createFBPolyline(polylineOptions);
    this._missionPath.setDynamicPosition(true);

    // Also create separate takeoff and waypoint paths for the new implementation
    if (referencePoint) {
      // Create takeoff path from reference point to first waypoint (if exists)
      const takeoffPositions =
        waypointPositions.length > 0
          ? [referencePoint, waypointPositions[0]]
          : [referencePoint];
      this.createTakeoffPath(id, takeoffPositions);
    } else {
      this.createTakeoffPath(id, []);
    }

    // Create waypoint path (only connecting waypoints)
    this.createWaypointPath(id, waypointPositions);

    return this._missionPath;
  }

  /**
   * Create a takeoff path polyline (from reference point to first waypoint)
   * @param id The parent entity ID
   * @param positions The initial positions for the polyline
   * @returns The created polyline
   */
  public createTakeoffPath(id: string, positions: IPosition[]): IFBPolyline {
    // If the takeoff path already exists, remove it
    if (this._takeoffPath) {
      this._takeoffPath.remove();
    }

    const polylineOptions: IFBPolylineOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.TAKEOFF_PATH}`,
      positions: positions,
      style: {
        ...structuredClone(DEFAULT_SELECTED_PATH_STYLE),
        color: MapColor.BLUE,
        width: MissionPlannerConstants.Config.DEFAULT_PATH_WIDTH,
      },
      clickable: false,
      hoverable: false,
      editable: false,
      visible: this._isVisible,
      enableDistanceDisplay: false,
    };

    this._takeoffPath =
      this._compositeManager.createFBPolyline(polylineOptions);
    this._takeoffPath.setDynamicPosition(true);
    return this._takeoffPath;
  }

  /**
   * Create a waypoint path polyline (connecting all waypoints)
   * @param id The parent entity ID
   * @param positions The initial positions for the polyline
   * @returns The created polyline
   */
  public createWaypointPath(id: string, positions: IPosition[]): IFBPolyline {
    // If the waypoint path already exists, remove it
    if (this._waypointPath) {
      this._waypointPath.remove();
    }

    const polylineOptions: IFBPolylineOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.WAYPOINT_PATH}`,
      positions: positions,
      style: {
        ...structuredClone(DEFAULT_SELECTED_PATH_STYLE),
        color: MapColor.BLUE,
        width: MissionPlannerConstants.Config.DEFAULT_PATH_WIDTH,
      },
      clickable: false,
      hoverable: false,
      editable: false,
      visible: this._isVisible,
      enableDistanceDisplay: false,
    };

    this._waypointPath =
      this._compositeManager.createFBPolyline(polylineOptions);
    this._waypointPath.setDynamicPosition(true);
    return this._waypointPath;
  }

  /**
   * Create a waypoint marker
   * @param id The parent entity ID
   * @param position The position for the marker
   * @param index The waypoint index
   * @returns The created marker
   */
  public createWaypointMarker(
    id: string,
    position: IPosition,
    index: number
  ): IFBMarker {
    // Generate dynamic SVG with waypoint number
    const waypointNumber = index + 1;
    const svgUrl =
      MissionSvgUtils.getLinearMissionPlannerWPMarker(waypointNumber);

    const markerOptions: IFBMarkerOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.WAYPOINT}-${index}`,
      position: position,
      style: {
        ...structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE),
        image: svgUrl,
        scale: MissionPlannerConstants.Config.DEFAULT_MARKER_SCALE,
      },
      showHeightReference: true,
      clickable: this._interactionsEnabled,
      hoverable: this._interactionsEnabled,
      editable: this._interactionsEnabled,
      visible: this._isVisible,
      isKeyboardControllable: this._interactionsEnabled,
    };

    const marker = this._compositeManager.createFBMarker(markerOptions);
    // Track waypoint position
    this._waypointPositions.set(index, { ...position });

    // Set up position change event handler
    this._setupMarkerEventHandlers(marker, marker.id);

    this._waypointMarkers.push(marker);

    // Update the mission path with the new waypoint
    this._updateMissionPathFromStoredPositions();

    return marker;
  }

  /**
   * Insert a waypoint marker at a specific index
   * @param id The parent entity ID
   * @param position The position for the marker
   * @param index The index to insert at
   * @returns The created marker
   */
  public insertWaypointMarker(
    id: string,
    position: IPosition,
    index: number
  ): IFBMarker {
    // Generate dynamic SVG with waypoint number
    const waypointNumber = index + 1;
    const svgUrl =
      MissionSvgUtils.getLinearMissionPlannerWPMarker(waypointNumber);

    const markerOptions: IFBMarkerOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.WAYPOINT}-${index}`,
      position: position,
      style: {
        ...structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE),
        image: svgUrl,
        scale: MissionPlannerConstants.Config.DEFAULT_MARKER_SCALE,
      },
      showHeightReference: true,
      clickable: this._interactionsEnabled,
      hoverable: this._interactionsEnabled,
      editable: this._interactionsEnabled,
      visible: this._isVisible,
      isKeyboardControllable: this._interactionsEnabled,
    };

    const marker = this._compositeManager.createFBMarker(markerOptions);

    // Set up position change event handler
    this._setupMarkerEventHandlers(marker, marker.id);

    this._waypointMarkers.splice(index, 0, marker);

    // Update stored positions for all waypoints
    // First shift existing positions at and after index
    for (let i = this._waypointMarkers.length - 1; i > index; i--) {
      const prevPos = this._waypointPositions.get(i - 1);
      if (prevPos) {
        this._waypointPositions.set(i, { ...prevPos });
      }
    }

    // Add new position
    this._waypointPositions.set(index, { ...position });

    // Update marker IDs for all subsequent waypoints
    this.updateWaypointIds(id, index + 1);

    // Update all waypoint numbers for markers from insertion point onwards
    this._updateWaypointNumbers(index);

    // Update the mission path with the new waypoint
    this._updateMissionPathFromStoredPositions();

    return marker;
  }

  /**
   * Create or reuse orientation model for editing waypoint orientation
   * @param id The parent entity ID
   * @param waypoint The waypoint data containing position and properties
   * @param computedOrientation The runtime-computed orientation for the model
   * @returns The created or updated model
   */
  public ensureOrientationModel(
    id: string,
    waypoint: WaypointData,
    computedOrientation: IOrientation
  ): IFBModel {
    if (this._orientationModel) {
      // Update the existing model with current waypoint data and computed orientation
      this.updateOrientationModel(waypoint.position, computedOrientation);
      return this._orientationModel;
    }

    // Use computed orientation for initial attitude (not hardcoded values)
    const initialAttitude = {
      yaw: computedOrientation.heading,
      pitch: computedOrientation.pitch,
      roll: computedOrientation.roll,
    };

    const modelOptions: IFBModelOptions = {
      id: `${id}-${MissionPlannerConstants.EntityPrefixes.ORIENTATION_MODEL}`,
      position: waypoint.position,
      style: {
        ...structuredClone(DEFAULT_SELECTED_ORIENTATION_MODEL_STYLE),
        modelUri: MissionPlannerConstants.AssetPaths.ORIENTATION_MODEL,
      },
      attitude: initialAttitude, // Use computed orientation instead of hardcoded values
      visible: this._isVisible,
      clickable: false,
      hoverable: false,
      editable: false,
      showHeightReference: false,
      isKeyboardControllable: false,
    };

    this._orientationModel = this._compositeManager.createFBModel(modelOptions);
    this._orientationModel.setAttitude({
      yaw: 90,
      pitch: 90,
    });

    // Ensure the orientation model is positioned correctly
    this._orientationModel.updatePosition(waypoint.position);

    // Apply the computed orientation to the model
    this.updateOrientationModel(waypoint.position, computedOrientation);

    return this._orientationModel;
  }

  /**
   * Update the orientation model position and attitude
   * @param position The new position
   * @param orientation Optional new orientation
   */
  public updateOrientationModel(
    position: IPosition,
    orientation?: IOrientation
  ): void {
    if (!this._orientationModel) {
      return;
    }

    // Update position
    this._orientationModel.updatePosition(position);

    // Update orientation if available
    if (orientation) {
      // Ensure we're passing a valid orientation object
      const validOrientation: ModelAttitude = {
        yaw: orientation.heading || 0,
        pitch: orientation.pitch || 0,
        roll: orientation.roll || 0,
      };

      this._orientationModel.setAttitude(validOrientation);
    }

    // Ensure both the orientation model and waypoint markers are visible
    this._orientationModel.setVisibility(this._isVisible);
  }

  /**
   * Update a waypoint's visual state (normal, selected, editing)
   * @param index The index of the waypoint to update
   * @param state The new state for the waypoint
   */
  public updateWaypointState(index: number, state: WaypointState): void {
    if (index < 0 || index >= this._waypointMarkers.length) {
      return; // Invalid index
    }

    const marker = this._waypointMarkers[index];
    const waypointNumber = index + 1;

    // Generate dynamic SVG based on state and waypoint number
    let svgUrl: string;
    switch (state) {
      case WaypointState.NORMAL:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerWPMarker(waypointNumber);
        break;
      case WaypointState.SELECTED:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerSelectedWPMarker(
            waypointNumber
          );
        break;
      case WaypointState.EDITING:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerEditWPMarker(waypointNumber);
        break;
      default:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerWPMarker(waypointNumber);
    }

    // Update marker appearance with the dynamic SVG
    marker.updateImage(svgUrl);

    // Ensure the marker is always visible
    marker.setVisibility(true);
  }

  /**
   * Update the mission path polyline with current waypoint positions
   * @param referencePoint The reference point position
   * @param waypointPositions Array of waypoint positions
   */
  public updateMissionPath(
    referencePoint: IPosition,
    waypointPositions: IPosition[],
    takeoffMode?: any, // Using 'any' here since we don't want to import TakeoffMode enum
    takeoffAltitude?: number
  ): void {
    if (!this._missionPath) {
      return;
    }

    // Update tracked positions
    if (referencePoint) {
      this._referencePointPosition = { ...referencePoint };
    }

    // Update tracked waypoint positions if provided
    if (waypointPositions && waypointPositions.length > 0) {
      // Clear existing positions
      this._waypointPositions.clear();

      // Add new positions
      waypointPositions.forEach((position, index) => {
        this._waypointPositions.set(index, { ...position });
      });
    }

    // Use stored positions to update the path
    this._updateMissionPathFromStoredPositions(takeoffMode, takeoffAltitude);
  }

  /**
   * Updates only the takeoff path
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position (null if no waypoints)
   * @param takeoffMode The takeoff mode
   * @param takeoffAltitude The takeoff altitude
   */
  public updateTakeoffPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition | null,
    takeoffMode?: any,
    takeoffAltitude?: number
  ): void {
    // Update tracked reference point position
    this._referencePointPosition = { ...referencePoint };

    // Update only the takeoff path
    if (this._takeoffPath) {
      if (!firstWaypoint) {
        // If no first waypoint, takeoff path is just the reference point
        this._takeoffPath.setPositions([referencePoint]);
      } else {
        // Generate takeoff path from reference point to first waypoint
        if (takeoffMode === undefined || takeoffAltitude === undefined) {
          // Simple direct path
          this._takeoffPath.setPositions([referencePoint, firstWaypoint]);
        } else {
          // Generate complex takeoff path using TakeoffPathService
          try {
            const takeoffPathService = new TakeoffPathService();
            const takeoffPath = takeoffPathService.generateTakeoffPath(
              referencePoint,
              firstWaypoint,
              takeoffMode,
              takeoffAltitude
            );
            this._takeoffPath.setPositions(takeoffPath);
          } catch (error) {
            // Fall back to direct path if generation fails
            console.error('Error generating takeoff path', error);
            this._takeoffPath.setPositions([referencePoint, firstWaypoint]);
          }
        }
      }
    }
  }

  /**
   * Updates only the waypoint path
   * @param waypointPositions Array of waypoint positions
   */
  public updateWaypointPath(waypointPositions: IPosition[]): void {
    // Update tracked waypoint positions
    this._waypointPositions.clear();
    waypointPositions.forEach((position, index) => {
      this._waypointPositions.set(index, { ...position });
    });

    // Update waypoint path (connecting only waypoints, not including reference point)
    if (this._waypointPath) {
      this._waypointPath.setPositions(waypointPositions);
    }

    // Also update the legacy mission path for backward compatibility
    if (this._missionPath) {
      this._missionPath.setPositions(waypointPositions);
    }
  }

  /**
   * Remove a waypoint marker
   * @param id The parent entity ID
   * @param index The index of the waypoint to remove
   */
  public removeWaypointMarker(id: string, index: number): void {
    if (index < 0 || index >= this._waypointMarkers.length) {
      return;
    }

    // Get the marker before removing it
    const marker = this._waypointMarkers[index];
    const markerId = marker.id;

    this._eventListeners.delete(`${markerId}-position`);
    this._eventListeners.delete(`${markerId}-click`);
    this._eventListeners.delete(`${markerId}-left-down`);

    // Remove and dispose waypoint marker
    marker.remove();
    this._waypointMarkers.splice(index, 1);

    const markersToRebind = this._waypointMarkers
      .slice(index)
      .map((m) => ({ marker: m, oldId: m.id }));

    // Update stored positions for waypoints
    // Remove the position at the current index
    this._waypointPositions.delete(index);

    // Shift all subsequent positions down by one
    for (let i = index; i < this._waypointMarkers.length; i++) {
      const nextPos = this._waypointPositions.get(i + 1);
      if (nextPos) {
        this._waypointPositions.set(i, nextPos);
        this._waypointPositions.delete(i + 1);
      }
    }

    // Update marker IDs for all subsequent waypoints
    this.updateWaypointIds(id, index);

    // Update all waypoint numbers for markers from removal point onwards
    this._updateWaypointNumbers(index);

    for (let i = index; i < this._waypointMarkers.length; i++) {
      const { oldId } = markersToRebind[i - index];

      this._eventListeners.delete(`${oldId}-click`);
      this._eventListeners.delete(`${oldId}-position`);
      this._eventListeners.delete(`${oldId}-left-down`);
    }

    // Update the mission path
    this._updateMissionPathFromStoredPositions();
  }

  /**
   * Update waypoint marker IDs starting from the specified index
   * @param parentId The parent entity ID
   * @param startIndex The index to start updating from
   */
  private updateWaypointIds(parentId: string, startIndex: number): void {
    for (let i = startIndex; i < this._waypointMarkers.length; i++) {
      this._waypointMarkers[
        i
      ].id = `${parentId}-${MissionPlannerConstants.EntityPrefixes.WAYPOINT}-${i}`;
    }
  }

  /**
   * Update waypoint numbers (SVGs) for all markers starting from the specified index
   * @param startIndex The index to start updating from
   */
  private _updateWaypointNumbers(startIndex: number): void {
    for (let i = startIndex; i < this._waypointMarkers.length; i++) {
      this._updateWaypointNumber(i);
    }
  }

  /**
   * Update the waypoint number (SVG) for a specific marker while preserving its current state
   * @param index The waypoint index to update
   */
  private _updateWaypointNumber(index: number): void {
    if (index < 0 || index >= this._waypointMarkers.length) {
      return;
    }

    const marker = this._waypointMarkers[index];
    const waypointNumber = index + 1;

    // Determine current state by checking the current image URL
    // Since we can't easily get the current state, we'll use normal state as default
    // In a real implementation, you might want to track state separately
    const currentState = this._getWaypointState(index);

    let svgUrl: string;
    switch (currentState) {
      case WaypointState.SELECTED:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerSelectedWPMarker(
            waypointNumber
          );
        break;
      case WaypointState.EDITING:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerEditWPMarker(waypointNumber);
        break;
      case WaypointState.NORMAL:
      default:
        svgUrl =
          MissionSvgUtils.getLinearMissionPlannerWPMarker(waypointNumber);
    }

    marker.updateImage(svgUrl);
  }

  /**
   * Get the current state of a waypoint marker
   * Note: This is a simplified implementation. In a more robust system,
   * you might want to track waypoint states explicitly.
   * @param index The waypoint index
   * @returns The current waypoint state
   */
  private _getWaypointState(_index: number): WaypointState {
    // For now, return NORMAL as default
    // In practice, you might want to track this state elsewhere
    // or determine it from the current image URL
    return WaypointState.NORMAL;
  }

  /**
   * Set the visibility of all mission elements
   * @param visible Whether the elements should be visible
   */
  public setVisibility(visible: boolean): void {
    this._isVisible = visible;

    // Update visibility of all entities
    if (this._referenceMarker) {
      this._referenceMarker.setVisibility(visible);
    }

    for (const marker of this._waypointMarkers) {
      marker.setVisibility(visible);
    }

    // Update visibility of all path entities
    if (this._missionPath) {
      this._missionPath.setVisibility(visible);
    }

    if (this._takeoffPath) {
      this._takeoffPath.setVisibility(visible);
    }

    if (this._waypointPath) {
      this._waypointPath.setVisibility(visible);
    }

    if (this._orientationModel) {
      this._orientationModel.setVisibility(visible);
    }
  }

  /**
   * Get the reference marker
   */
  public get referenceMarker(): IFBMarker | null {
    return this._referenceMarker;
  }

  /**
   * Get the mission path
   */
  public get missionPath(): IFBPolyline | null {
    return this._missionPath;
  }

  /**
   * Get the takeoff path
   */
  public get takeoffPath(): IFBPolyline | null {
    return this._takeoffPath;
  }

  /**
   * Get the waypoint path
   */
  public get waypointPath(): IFBPolyline | null {
    return this._waypointPath;
  }

  /**
   * Get the orientation model
   */
  public get orientationModel(): IFBModel | null {
    return this._orientationModel;
  }

  /**
   * Get the waypoint markers
   */
  public get waypointMarkers(): IFBMarker[] {
    return this._waypointMarkers;
  }

  /**
   * Get the visibility state
   */
  public get isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Handle marker position changes internally
   * @param entityId The ID of the marker that changed position
   * @param position The new position
   */
  private _handleMarkerPositionChange(
    entityId: string,
    position: IPosition
  ): void {
    if (!entityId || !position) {
      return;
    }

    // Check if it's the reference marker
    const referencePointSuffix =
      MissionPlannerConstants.EntityPrefixes.REFERENCE_POINT;
    if (entityId.endsWith(`-${referencePointSuffix}`)) {
      // Update stored reference point position
      this._referencePointPosition = { ...position };

      // Update the mission path if auto-update is enabled
      if (this._autoUpdatePath) {
        this._updateMissionPathFromStoredPositions();
      }

      return;
    }

    // Check if it's a waypoint marker
    const waypointRegex = new RegExp(
      `${MissionPlannerConstants.EntityPrefixes.WAYPOINT}-(\\d+)$`
    );
    const match = entityId.match(waypointRegex);

    if (match && match[1]) {
      const waypointIndex = parseInt(match[1], 10);

      // Update the stored waypoint position
      this._waypointPositions.set(waypointIndex, { ...position });

      // Update the mission path if auto-update is enabled
      if (this._autoUpdatePath) {
        this._updateMissionPathFromStoredPositions();
      }
    }
  }

  /**
   * Update the mission path using the stored positions
   */
  private _updateMissionPathFromStoredPositions(
    takeoffMode?: any,
    takeoffAltitude?: number
  ): void {
    // Skip if reference point is not set or mission path doesn't exist
    if (!this._referencePointPosition || !this._missionPath) {
      return;
    }

    // Get all waypoint positions in order
    const waypointPositions: IPosition[] = [];
    for (let i = 0; i < this._waypointMarkers.length; i++) {
      const position = this._waypointPositions.get(i);
      if (position) {
        waypointPositions.push(position);
      }
    }

    // Check if we have a valid first waypoint for takeoff path
    const hasFirstWaypoint = waypointPositions.length > 0;

    // Update the legacy mission path
    // Only include waypoint positions in the mission path, not the reference point
    this._missionPath.setPositions(waypointPositions);

    // If we don't have a first waypoint, we can't generate a complete takeoff path
    if (!hasFirstWaypoint) {
      // If we have takeoff and waypoint paths already, update them appropriately
      if (this._takeoffPath) {
        // Takeoff path should just be the reference point if there's no first waypoint
        this._takeoffPath.setPositions([this._referencePointPosition]);
      }
      if (this._waypointPath) {
        // Waypoint path should be empty if there are no waypoints
        this._waypointPath.setPositions([]);
      }
      return;
    }

    // We have a first waypoint and can create separate paths
    const firstWaypoint = waypointPositions[0];

    // Update takeoff path (from reference point to first waypoint)
    if (this._takeoffPath) {
      // Create a simple path from reference to first waypoint if takeoff parameters aren't provided
      if (takeoffMode === undefined || takeoffAltitude === undefined) {
        this._takeoffPath.setPositions([
          this._referencePointPosition,
          firstWaypoint,
        ]);
      } else {
        // Import TakeoffPathService to generate the path (a bit unusual to do this here,
        // but we want to avoid circular dependencies)
        try {
          // We need to dynamically import the TakeoffPathService
          // In a real implementation, we'd have the LinearMissionPlanner pass in the generated path
          // But for simplicity, we're creating it here
          const takeoffPathService = new TakeoffPathService();

          // Generate the takeoff path based on the provided parameters
          const takeoffPath = takeoffPathService.generateTakeoffPath(
            this._referencePointPosition,
            firstWaypoint,
            takeoffMode,
            takeoffAltitude
          );

          // Update the takeoff path with the generated positions
          this._takeoffPath.setPositions(takeoffPath);
        } catch (error) {
          // If anything goes wrong, fall back to direct path
          console.error('Error generating takeoff path', error);
          this._takeoffPath.setPositions([
            this._referencePointPosition,
            firstWaypoint,
          ]);
        }
      }
    }

    // Update waypoint path (connecting only waypoints, not including reference point)
    if (this._waypointPath) {
      // waypointPositions already excludes the reference point, so we use it directly
      this._waypointPath.setPositions(waypointPositions);
    }
  }

  /**
   * Set whether the mission path should automatically update when marker positions change
   * @param autoUpdate Whether to auto-update the path
   */
  public setAutoUpdatePath(autoUpdate: boolean): void {
    this._autoUpdatePath = autoUpdate;
  }

  /**
   * Clean up all entities
   */
  public cleanupEntities(): void {
    // Clean up reference point marker
    if (this._referenceMarker) {
      // Remove event listeners properly
      const refMarkerId = this._referenceMarker.id;

      this._eventListeners.delete(`${refMarkerId}-position`);
      this._eventListeners.delete(`${refMarkerId}-click`);
      this._eventListeners.delete(`${refMarkerId}-alt-down`);
      this._eventListeners.delete(`${refMarkerId}-alt-up`);

      this._referenceMarker.remove();
      this._referenceMarker = null;
    }

    // Clean up all waypoint markers
    for (const marker of this._waypointMarkers) {
      // Remove event listeners properly
      const markerId = marker.id;

      this._eventListeners.delete(`${markerId}-position`);
      this._eventListeners.delete(`${markerId}-click`);

      marker.remove();
    }
    this._waypointMarkers = [];

    // Clean up mission path
    if (this._missionPath) {
      this._missionPath.remove();
      this._missionPath = null;
    }

    // Clean up takeoff path
    if (this._takeoffPath) {
      this._takeoffPath.remove();
      this._takeoffPath = null;
    }

    // Clean up waypoint path
    if (this._waypointPath) {
      this._waypointPath.remove();
      this._waypointPath = null;
    }

    // Clean up orientation model
    if (this._orientationModel) {
      this._orientationModel.remove();
      this._orientationModel = null;
    }

    // Clear position tracking data
    this._referencePointPosition = null;
    this._waypointPositions.clear();

    // Clear callback and listener references
    this._positionChangeCallback = null;
    this._markerClickCallback = null;
    this._eventListeners.clear();
  }
}
