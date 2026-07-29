import { v4 as uuidv4 } from 'uuid';
import {
  GridMissionPlannerEventData,
  GridMissionPlannerEventType,
  IEventType,
  IGridMissionPlanner,
  IGridMissionPlannerOptions,
  IPosition,
} from '@map/public/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public/core';
import {
  ICompositeManager,
  IEvent,
  IFBMarker,
  IFBMarkerOptions,
  IFBPolygon,
  IFBPolyline,
  MapEventEmitter,
} from '@map/private/contracts';

import {
  DEFAULT_EDITING_GRID_MISSION_POLYGON_STYLE,
  DEFAULT_SELECTED_PATH_STYLE,
  DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE,
  DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE,
  EventService,
  MissionPlannerAssetPaths,
  MissionPlannerConstants,
} from '@map/private/feature-entities/missions/shared';

import { GridHelper, WaypointFE } from '../services';

enum GridMissionPlannerState {
  AWAITING_FIRST_CLICK = 'AWAITING_FIRST_CLICK',
  AWAITING_SECOND_CLICK = 'AWAITING_SECOND_CLICK',
  READY = 'READY',
}

export class GridMissionPlanner implements IGridMissionPlanner {
  public readonly id: string;
  public readonly position: IPosition;
  private readonly _compositeManager: ICompositeManager;
  // EventService for typed events
  private readonly _eventService: EventService<
    GridMissionPlannerEventType,
    GridMissionPlannerEventData
  >;
  // Keep MapEventEmitter for backward compatibility (wraps EventService)
  private readonly _eventEmitter: MapEventEmitter;
  private polygon: IFBPolygon | undefined;
  private _gridAngle = 0;
  private _gridSpacing = 15;
  private _gridAltitude = 20; // Default altitud  e
  private gridHelper: GridHelper;
  private _waypoints: WaypointFE[] = [];
  private gridMissionPolyline: IFBPolyline | undefined;
  private _takeoffPointEnabled = false;
  private _isAwaitingCustomPathClick = false;
  private _editable = true;
  private takeoffPointPolyline: IFBPolyline | undefined;
  private options: IGridMissionPlannerOptions;
  startMarker: IFBMarker | undefined;
  endMarker: IFBMarker | undefined;
  // State management for two-click flow
  private _state: GridMissionPlannerState =
    GridMissionPlannerState.AWAITING_FIRST_CLICK;
  private takeoffPointMarker: IFBMarker | undefined;
  private _takeoffPointPosition: IPosition | undefined;
  private _takeoffAltitude = 20; // Default takeoff altitude
  // Listener references for proper cleanup
  private _polygonPositionListener?: () => void;
  private _takeoffMarkerPositionListener?: (event: IEvent) => void;
  private _takeoffPolylinePositionListener?: (event: IEvent) => void;

  constructor(
    compositeManager: ICompositeManager,
    options: IGridMissionPlannerOptions
  ) {
    this.id = `grid-mission-planner-${uuidv4()}`;
    this.options = options;
    this.gridHelper = new GridHelper();
    this._compositeManager = compositeManager;

    // Initialize EventService
    this._eventService = new EventService<
      GridMissionPlannerEventType,
      GridMissionPlannerEventData
    >(this._compositeManager, this.id);

    // Keep MapEventEmitter for backward compatibility (wraps EventService)
    this._eventEmitter = this._eventService.getEventEmitter();

    this.position = options.position;

    // Initialize with options if provided
    if (options.gridSpacing !== undefined) {
      this._gridSpacing = options.gridSpacing;
    }
    if (options.altitude !== undefined) {
      this._gridAltitude = options.altitude;
    }
    if (options.takeoffAltitude !== undefined) {
      this._takeoffAltitude = options.takeoffAltitude;
    }

    // Check if edit mode (initial data provided)
    if (
      options.initialPolygonVertices &&
      options.initialPolygonVertices.length > 0
    ) {
      // EDIT MODE: Initialize directly from existing data
      // Set grid angle
      this._gridAngle = options.gridAngle ?? 0;

      // Create reference point marker if provided
      if (options.initialReferencePoint) {
        const haeAltitude = options.initialReferencePoint.altitude || 0;
        this._takeoffPointPosition = {
          ...options.initialReferencePoint,
          altitude: haeAltitude,
        };

        const markerPosition: IPosition = {
          ...options.initialReferencePoint,
          altitude: haeAltitude,
        };

        const markerOptions: IFBMarkerOptions = {
          id: `${this.id}-${MissionPlannerConstants.EntityPrefixes.REFERENCE_POINT}`,
          position: markerPosition,
          style: {
            ...structuredClone(DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE),
            image: MissionPlannerConstants.AssetPaths.REFERENCE_POINT,
          },
          showHeightReference: false,
          clickable: true,
          hoverable: false,
          editable: true,
          visible: true,
        };

        this.takeoffPointMarker =
          this._compositeManager.createFBMarker(markerOptions);

        // Set up marker drag handler
        this.setupTakeoffPointMarkerHandling();
      }

      // Create polygon directly from vertices (editable)
      this.polygon = this._compositeManager.createFBPolygon({
        positions: options.initialPolygonVertices,
        style: structuredClone(DEFAULT_EDITING_GRID_MISSION_POLYGON_STYLE),
        editable: true,
        clickable: true,
        hoverable: true,
        showDistanceLabels: true,
      });

      // Register polygon event handlers (auto-updates on drag)
      this.registerPolygonEventHandlers();

      // Generate grid waypoints
      this.performGridUpdate();

      // Create polyline connecting reference point to grid start if reference point exists
      if (this.takeoffPointMarker) {
        this.createOrUpdateTakeoffPointPolyline();
      }

      // Set state to READY (skip two-click flow)
      this._state = GridMissionPlannerState.READY;

      // Emit typed events for edit mode initialization
      this._eventService.emitEvent(GridMissionPlannerEventType.STATE_CHANGED, {
        eventType: GridMissionPlannerEventType.STATE_CHANGED,
        oldState: GridMissionPlannerState.AWAITING_FIRST_CLICK,
        newState: GridMissionPlannerState.READY,
      });

      // Emit grid waypoints updated event
      this._eventService.emitEvent(
        GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
        {
          eventType: GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
          gridWaypoints: this.getGridWaypointsOnly(),
          completeMissionPath: this.getCompleteMissionPath(),
          polygonVertices: this.polygon.positions,
        }
      );
    } else {
      // CREATE MODE: Keep existing two-click flow
      // Polygon and grid will be created on second click
      // State is already initialized to AWAITING_FIRST_CLICK
      this.registerEventHandlers();
    }
  }

  // Getter for grid angle
  get gridAngle(): number {
    return this._gridAngle;
  }

  // Setter for grid angle with automatic update
  set gridAngle(angle: number) {
    if (this._gridAngle !== angle) {
      const oldAngle = this._gridAngle;
      this._gridAngle = angle;
      this.performGridUpdate(); // This will emit GRID_WAYPOINTS_UPDATED

      // Emit typed event for angle change
      this._eventService.emitEvent(
        GridMissionPlannerEventType.GRID_ANGLE_CHANGED,
        {
          eventType: GridMissionPlannerEventType.GRID_ANGLE_CHANGED,
          gridAngle: angle,
        }
      );
    }
  }

  // Getter for grid spacing
  get gridSpacing(): number {
    return this._gridSpacing;
  }

  // Setter for grid spacing with automatic update
  set gridSpacing(spacing: number) {
    if (this._gridSpacing !== spacing && spacing > 0) {
      const oldSpacing = this._gridSpacing;
      this._gridSpacing = spacing;
      this.performGridUpdate(); // This will emit GRID_WAYPOINTS_UPDATED

      // Emit typed event for spacing change
      this._eventService.emitEvent(
        GridMissionPlannerEventType.GRID_SPACING_CHANGED,
        {
          eventType: GridMissionPlannerEventType.GRID_SPACING_CHANGED,
          gridSpacing: spacing,
        }
      );
    }
  }

  // Getter for grid altitude
  get gridAltitude(): number {
    return this._gridAltitude;
  }

  // Getter for custom approach enabled
  get takeoffPointEnabled(): boolean {
    return this._takeoffPointEnabled;
  }

  // Getter for awaiting custom path click
  get isAwaitingCustomPathClick(): boolean {
    return this._isAwaitingCustomPathClick;
  }

  // Getter for custom approach position count
  get takeoffPointPositionCount(): number {
    return this.takeoffPointPolyline?.positions.length || 0;
  }

  // State management getters
  get state(): string {
    return this._state;
  }

  get isAwaitingFirstClick(): boolean {
    return this._state === GridMissionPlannerState.AWAITING_FIRST_CLICK;
  }

  get isAwaitingSecondClick(): boolean {
    return this._state === GridMissionPlannerState.AWAITING_SECOND_CLICK;
  }

  get isReady(): boolean {
    return this._state === GridMissionPlannerState.READY;
  }

  // Get state as string
  getState(): string {
    return this._state;
  }

  private registerEventHandlers(): void {
    // Event handlers will be registered when polygon is created in handleSecondClick
    // This method is kept for future use or can be called after polygon creation
  }

  private registerPolygonEventHandlers(): void {
    if (!this.polygon) {
      return;
    }
    // Store listener reference for cleanup
    this._polygonPositionListener = () => {
      // Emit typed event for polygon vertices change
      this._eventService.emitEvent(
        GridMissionPlannerEventType.POLYGON_VERTICES_CHANGED,
        {
          eventType: GridMissionPlannerEventType.POLYGON_VERTICES_CHANGED,
          polygonVertices: this.polygon!.positions,
        }
      );

      // This will also emit GRID_WAYPOINTS_UPDATED
      this.performGridUpdate();
    };
    this.polygon
      .getEventEmitter()
      .addListener(IEventType.POSITION_CHANGED, this._polygonPositionListener);
  }

  private removeGrid(): void {
    if (this.gridMissionPolyline) {
      this.gridMissionPolyline.remove();
      this.gridMissionPolyline = undefined;
    }
    if (this.startMarker) {
      this.startMarker.remove();
      this.startMarker = undefined;
    }
    if (this.endMarker) {
      this.endMarker.remove();
      this.endMarker = undefined;
    }
  }

  private plotGridLines(waypoints: WaypointFE[]): void {
    this.removeGrid();
    const polylinePath: IPosition[] = waypoints.map((curr) => {
      return { latitude: curr.lat, longitude: curr.lng, altitude: 400 };
    });
    this.gridMissionPolyline = this._compositeManager.createFBPolyline({
      id: `${this.id}-grid-mission-polyline`,
      positions: polylinePath,
      showDistanceLabels: false,
      style: {
        ...structuredClone(DEFAULT_SELECTED_PATH_STYLE),
        clampToGround: true,
      },
      hoverable: false,
      clickable: false,
      editable: false,
      visible: true,
    });
    if (polylinePath.length > 0) {
      this.drawStartMarker(polylinePath[0]);
      // Draw end marker if we have more than one waypoint
      if (polylinePath.length > 1) {
        this.drawEndMarker(polylinePath[polylinePath.length - 1]);
      }
    }
  }

  private drawStartMarker(position: IPosition): void {
    this.startMarker = this._compositeManager.createFBMarker({
      id: `${this.id}-start-marker`,
      position: position,
      style: {
        ...structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE),
        image: 'assets/grid-mission/grid_start.svg',
        heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
      },
      hoverable: false,
      clickable: false,
      editable: false,
      visible: true,
      showHeightReference: false,
    });
  }

  private drawEndMarker(position: IPosition): void {
    this.endMarker = this._compositeManager.createFBMarker({
      id: `${this.id}-end-marker`,
      position: position,
      style: {
        ...structuredClone(DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE),
        image: 'assets/grid-mission/grid_end.svg',
        heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
      },
      hoverable: false,
      clickable: false,
      editable: false,
      visible: true,
      showHeightReference: false,
    });
  }

  // Interface method to update grid angle
  updateGridAngle(angle: number): void {
    this.gridAngle = angle;
  }

  // Interface method to update grid spacing
  updateGridSpacing(spacing: number): void {
    this.gridSpacing = spacing;
  }

  // Interface method to update grid altitude
  updateGridAltitude(altitude: number): void {
    if (this._gridAltitude !== altitude && altitude > 0) {
      const oldAltitude = this._gridAltitude;
      this._gridAltitude = altitude;
      // Regenerate waypoints with new altitude if grid already exists
      if (this.polygon) {
        this.performGridUpdate(); // This will emit GRID_WAYPOINTS_UPDATED
      }

      // Emit typed event for altitude change
      this._eventService.emitEvent(
        GridMissionPlannerEventType.GRID_ALTITUDE_CHANGED,
        {
          eventType: GridMissionPlannerEventType.GRID_ALTITUDE_CHANGED,
          gridAltitude: altitude,
        }
      );
    }
  }

  // Interface method to update takeoff altitude
  async updateTakeoffAltitude(altitude: number): Promise<void> {
    if (this._takeoffAltitude !== altitude && altitude > 0) {
      this._takeoffAltitude = altitude;
      // Don't update marker position - it stays at HAE
      // The altitude setting is just for the mission configuration
    }
  }

  // Interface method to update grid with multiple options
  updateGrid(options?: Partial<IGridMissionPlannerOptions>): void {
    if (options) {
      // Update spacing if provided
      if (options.gridSpacing !== undefined && options.gridSpacing > 0) {
        this._gridSpacing = options.gridSpacing;
      }
    }
    // Perform the actual grid update
    this.performGridUpdate();
  }

  // Set visibility of the grid mission planner
  setVisibility(visible: boolean): void {
    // Set polygon visibility
    if (this.polygon) {
      this.polygon.setVisibility(visible);
    }

    // Set grid polyline visibility
    if (this.gridMissionPolyline) {
      this.gridMissionPolyline.setVisibility(visible);
    }

    // Set takeoff point polyline visibility
    if (this.takeoffPointPolyline) {
      this.takeoffPointPolyline.setVisibility(visible);
    }

    // Set grid start marker visibility
    if (this.startMarker) {
      this.startMarker.setVisibility(visible);
    }

    // Set grid end marker visibility
    if (this.endMarker) {
      this.endMarker.setVisibility(visible);
    }

    // Set takeoff point marker visibility (new two-click flow)
    if (this.takeoffPointMarker) {
      this.takeoffPointMarker.setVisibility(visible);
    }
  }

  // Set editability of the polygon boundary
  setEditable(editable: boolean): void {
    this._editable = editable;

    if (this.polygon) {
      this.polygon.setEditable(editable);
    }

    // Note: takeoffPointPolyline is always non-editable and should not be modified here

    // Set editability of the takeoff point marker (new two-click flow)
    if (this.takeoffPointMarker) {
      this.takeoffPointMarker.setEditable(editable);
    }
  }

  // Set takeoff point enabled state (old flow - kept for backward compatibility)
  // Note: The new two-click flow uses handleFirstClick/handleSecondClick instead
  setTakeoffPoint(enabled: boolean): void {
    if (this._takeoffPointEnabled !== enabled) {
      this._takeoffPointEnabled = enabled;

      if (enabled) {
        // Only allow takeoff point if the grid is editable
        if (this._editable) {
          // Clean up any existing takeoff point
          this.cleanupTakeoffPoint();
          // Set flag to indicate we're waiting for a click
          this._isAwaitingCustomPathClick = true;
        } else {
          // If not editable, don't enable takeoff point
          this._takeoffPointEnabled = false;
          console.warn('Cannot enable takeoff point when grid is not editable');
        }
      } else {
        // Disable takeoff point mode
        this.cleanupTakeoffPoint();
        this._isAwaitingCustomPathClick = false;
        // Revert to standard grid pattern
        this.performGridUpdate();
      }
    }
  }

  // Handle takeoff point click from map (old flow - kept for backward compatibility)
  // Note: The new two-click flow uses handleFirstClick/handleSecondClick instead
  handleTakeoffPointClick(position: IPosition): void {
    if (!this._isAwaitingCustomPathClick || this._waypoints.length === 0) {
      return;
    }

    // Get the grid start position
    const gridStart = this.getGridStartPosition();
    if (!gridStart) {
      return;
    }

    // Create the takeoff point polyline
    this.createTakeoffPointPolyline(position, gridStart);

    // Reset the awaiting click flag
    this._isAwaitingCustomPathClick = false;
  }

  // Handle first click - place start marker
  handleFirstClick(position: IPosition): void {
    // Check if we're in the correct state
    if (this._state !== GridMissionPlannerState.AWAITING_FIRST_CLICK) {
      return;
    }

    // Get HAE altitude from map position (terrain height at that location)
    const haeAltitude = position.altitude || 0;

    // Store HAE only in internal position
    this._takeoffPointPosition = {
      ...position,
      altitude: haeAltitude, // Store just HAE
    };

    // Use HAE for marker display (simple absolute value, not HAE + takeoffAltitude)
    const markerPosition: IPosition = {
      ...position,
      altitude: haeAltitude, // Display at HAE
    };

    // Create marker at clicked position using reference point SVG (same as linear mission planner)
    this.takeoffPointMarker = this._compositeManager.createFBMarker({
      position: markerPosition,
      style: {
        ...structuredClone(DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE),
        image: MissionPlannerAssetPaths.REFERENCE_POINT,
      },
      editable: true,
      hoverable: false,
      clickable: true,
      visible: true,
      showHeightReference: false,
    });

    // Set up marker drag handler to update polyline when marker moves
    this.setupTakeoffPointMarkerHandling();

    // Update state to awaiting second click
    this._state = GridMissionPlannerState.AWAITING_SECOND_CLICK;

    // Emit typed events
    this._eventService.emitEvent(
      GridMissionPlannerEventType.TAKEOFF_POINT_ADDED,
      {
        eventType: GridMissionPlannerEventType.TAKEOFF_POINT_ADDED,
        takeoffPoint: this._takeoffPointPosition,
      }
    );

    this._eventService.emitEvent(GridMissionPlannerEventType.STATE_CHANGED, {
      eventType: GridMissionPlannerEventType.STATE_CHANGED,
      oldState: GridMissionPlannerState.AWAITING_FIRST_CLICK,
      newState: GridMissionPlannerState.AWAITING_SECOND_CLICK,
    });
  }

  // Handle second click - create grid and polyline
  handleSecondClick(position: IPosition): void {
    // Check if we're in the correct state
    if (this._state !== GridMissionPlannerState.AWAITING_SECOND_CLICK) {
      return;
    }

    // Verify that the start marker exists
    if (!this.takeoffPointMarker) {
      console.warn('Cannot create grid: start marker does not exist');
      return;
    }

    // Create polygon at clicked position
    const radius = 25;
    this.polygon = this._compositeManager.createFBPolygonFromCenter({
      position: position,
      style: {
        ...structuredClone(DEFAULT_EDITING_GRID_MISSION_POLYGON_STYLE),
        fillColor: MapColor.GREEN_TINT,
        outlineColor: MapColor.GREEN_TINT,
      },
      radius: radius,
      editable: true,
      clickable: true,
      hoverable: true,
      showDistanceLabels: true,
    });

    // Register polygon event handlers
    this.registerPolygonEventHandlers();

    // Generate grid waypoints
    this.performGridUpdate();

    // Create polyline connecting start marker to grid start
    this.createOrUpdateTakeoffPointPolyline();

    // Update state to ready
    this._state = GridMissionPlannerState.READY;

    // Emit typed events
    this._eventService.emitEvent(GridMissionPlannerEventType.POLYGON_CREATED, {
      eventType: GridMissionPlannerEventType.POLYGON_CREATED,
      polygonVertices: this.polygon.positions,
    });

    this._eventService.emitEvent(GridMissionPlannerEventType.STATE_CHANGED, {
      eventType: GridMissionPlannerEventType.STATE_CHANGED,
      oldState: GridMissionPlannerState.AWAITING_SECOND_CLICK,
      newState: GridMissionPlannerState.READY,
    });
  }

  // Get event emitter for listening to updates (backward compatibility)
  getEventEmitter(): MapEventEmitter {
    return this._eventEmitter.getListenOnlyInstance();
  }

  // Typed event methods (NEW)
  onEvent(
    eventType: GridMissionPlannerEventType,
    callback: (data: GridMissionPlannerEventData) => void
  ): void {
    this._eventService.onEvent(eventType, callback);
  }

  offEvent(
    eventType: GridMissionPlannerEventType,
    callback: (data: GridMissionPlannerEventData) => void
  ): void {
    this._eventService.offEvent(eventType, callback);
  }

  // Get the complete mission path including custom approach
  getPolygonVertices(): IPosition[] {
    return this.polygon?.positions || [];
  }

  /**
   * Get grid waypoints only (excluding takeoff/reference point)
   * Used for calculating area, flight length, and image count
   * @returns Array of grid waypoint positions
   */
  getGridWaypointsOnly(): IPosition[] {
    return this._waypoints.map((waypoint) => ({
      latitude: waypoint.lat,
      longitude: waypoint.lng,
      altitude: waypoint.alt,
    }));
  }

  getCompleteMissionPath(): IPosition[] {
    const missionPath: IPosition[] = [];

    // Add takeoff point marker position (new two-click flow)
    if (this.takeoffPointMarker && this._takeoffPointPosition) {
      // Return stored HAE position
      missionPath.push({
        latitude: this._takeoffPointPosition.latitude,
        longitude: this._takeoffPointPosition.longitude,
        altitude: this._takeoffPointPosition.altitude || 0, // HAE only
      });
    }

    // Add approach path positions from old takeoff point flow (backward compatibility)
    // Excluding the last one to avoid duplication with grid start
    if (this.takeoffPointPolyline && !this.takeoffPointMarker) {
      const approachPositions = this.takeoffPointPolyline.positions;
      if (approachPositions.length > 0) {
        // Add all positions except the last one (which connects to grid start)
        missionPath.push(...approachPositions.slice(0, -1));
      }
    }

    // Add grid waypoints
    this._waypoints.forEach((waypoint) => {
      missionPath.push({
        latitude: waypoint.lat,
        longitude: waypoint.lng,
        altitude: waypoint.alt,
      });
    });

    return missionPath;
  }

  // Internal method that actually updates the grid
  private performGridUpdate(): void {
    // Return early if polygon doesn't exist yet (grid not created)
    if (!this.polygon) {
      return;
    }
    const position = this.polygon.positions;
    this.gridHelper.gridAngle = this._gridAngle;
    this.gridHelper.gridSpacing = this._gridSpacing;
    this.gridHelper.polypath = [...position];
    const waypoints = this.gridHelper.generateWaypoints(this._gridAltitude);
    this._waypoints = [...waypoints];

    // Create or update takeoff point polyline if start marker exists
    if (this.takeoffPointMarker && this._waypoints.length > 0) {
      this.createOrUpdateTakeoffPointPolyline();
    }

    // Update takeoff point endpoint if polyline exists (for backward compatibility)
    if (this.takeoffPointPolyline && this._waypoints.length > 0) {
      this.updateApproachEndpoint();
    }

    this.plotGridLines(this._waypoints);

    // Emit typed event after waypoints are updated so hooks can recalculate metrics
    this._eventService.emitEvent(
      GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
      {
        eventType: GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
        gridWaypoints: this.getGridWaypointsOnly(),
        completeMissionPath: this.getCompleteMissionPath(),
        polygonVertices: this.polygon.positions,
      }
    );
  }

  // Get the starting position of the grid
  private getGridStartPosition(): IPosition | undefined {
    if (this._waypoints.length === 0) {
      return undefined;
    }

    return {
      latitude: this._waypoints[0].lat,
      longitude: this._waypoints[0].lng,
      altitude: this._waypoints[0].alt,
    };
  }

  /**
   * Generate a simple vertical-then-horizontal takeoff path
   * Creates a 3-point path: takeoff point → vertical up to grid altitude → horizontal to grid start
   *
   * @param takeoffPoint The takeoff point position (x, y, z)
   * @param gridStart The grid start position (x', y', z')
   * @returns Array of 3 positions: [takeoff point, vertical ascent point, grid start]
   */
  private generateSimpleTakeoffPath(
    takeoffPoint: IPosition,
    gridStart: IPosition
  ): IPosition[] {
    // Point 1: Takeoff point at its original altitude
    const point1: IPosition = { ...takeoffPoint };

    // Point 2: Directly above takeoff point at grid start altitude (vertical ascent)
    const point2: IPosition = {
      latitude: takeoffPoint.latitude,
      longitude: takeoffPoint.longitude,
      altitude: gridStart.altitude || 400,
    };

    // Point 3: Grid start point (horizontal move)
    const point3: IPosition = { ...gridStart };

    return [point1, point2, point3];
  }

  // Create the takeoff point polyline
  private createTakeoffPointPolyline(
    startPos: IPosition,
    gridStart: IPosition
  ): void {
    // Generate 3-point path: takeoff → vertical up → horizontal to grid
    const takeoffPath = this.generateSimpleTakeoffPath(startPos, gridStart);

    // Create the approach polyline (non-editable)
    this.takeoffPointPolyline = this._compositeManager.createFBPolyline({
      id: `${this.id}-takeoff-point-polyline`,
      positions: takeoffPath,
      editable: false,
      style: {
        ...structuredClone(DEFAULT_SELECTED_PATH_STYLE),
        clampToGround: true,
      },
      hoverable: false,
      clickable: false,
      showDistanceLabels: false,
      visible: true,
    });

    // Enable dynamic positioning for automatic updates
    this.takeoffPointPolyline.setDynamicPosition(true);

    // Forward events from the takeoff point polyline
    this.forwardTakeoffPointEvents();

    // Emit typed event for custom approach creation
    // This will trigger grid waypoints update since the takeoff path affects the mission
    this._eventService.emitEvent(
      GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
      {
        eventType: GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
        gridWaypoints: this.getGridWaypointsOnly(),
        completeMissionPath: this.getCompleteMissionPath(),
        polygonVertices: this.polygon?.positions,
      }
    );
  }

  // Create or update the custom approach polyline connecting start marker to grid start
  private createOrUpdateTakeoffPointPolyline(): void {
    // Check if both marker and grid exist
    if (!this.takeoffPointMarker) {
      return;
    }

    const gridStart = this.getGridStartPosition();
    if (!gridStart) {
      return;
    }

    const startPos = this.takeoffPointMarker.position;

    // Generate 3-point path: takeoff → vertical up → horizontal to grid
    const takeoffPath = this.generateSimpleTakeoffPath(startPos, gridStart);

    if (!this.takeoffPointPolyline) {
      // Create new polyline (non-editable)
      this.takeoffPointPolyline = this._compositeManager.createFBPolyline({
        id: `${this.id}-takeoff-point-polyline`,
        positions: takeoffPath,
        editable: false,
        style: {
          ...structuredClone(DEFAULT_SELECTED_PATH_STYLE),
          clampToGround: true,
        },
        hoverable: false,
        clickable: false,
        showDistanceLabels: false,
      });

      // Enable dynamic positioning for automatic updates
      this.takeoffPointPolyline.setDynamicPosition(true);

      // Forward events from the takeoff point polyline
      this.forwardTakeoffPointEvents();
    } else {
      // Update existing polyline with regenerated path
      this.takeoffPointPolyline.setPositions(takeoffPath);
    }
  }

  // Update the approach polyline endpoint when grid changes
  private updateApproachEndpoint(): void {
    if (!this.takeoffPointPolyline || !this.takeoffPointMarker) {
      return;
    }

    const newGridStart = this.getGridStartPosition();
    if (!newGridStart) {
      return;
    }

    const startPos = this.takeoffPointMarker.position;

    // Regenerate full path with new grid start position
    const takeoffPath = this.generateSimpleTakeoffPath(startPos, newGridStart);
    this.takeoffPointPolyline.setPositions(takeoffPath);
  }

  // Setup handler for takeoff point marker drag events
  private setupTakeoffPointMarkerHandling(): void {
    if (!this.takeoffPointMarker) {
      return;
    }

    const markerEmitter = this.takeoffPointMarker.getEventEmitter();

    // Store listener reference for cleanup
    this._takeoffMarkerPositionListener = async (_event: IEvent) => {
      if (!this.takeoffPointMarker) {
        return;
      }

      // Get the current marker position (lat/lng from drag)
      const currentMarkerPosition = this.takeoffPointMarker.position;

      // Get terrain height (HAE) at the new location
      const mapServices =
        this._compositeManager.mapProviderServices.mapServices;
      const haeAltitude = await mapServices.getTerrainHeightMostSampled({
        latitude: currentMarkerPosition.latitude,
        longitude: currentMarkerPosition.longitude,
        altitude: 0,
      });

      // Store HAE only in internal position
      this._takeoffPointPosition = {
        latitude: currentMarkerPosition.latitude,
        longitude: currentMarkerPosition.longitude,
        altitude: haeAltitude, // Store just HAE
      };

      // Update marker position to display at HAE (simple absolute value)
      const updatedPosition: IPosition = {
        ...currentMarkerPosition,
        altitude: haeAltitude, // Display at HAE
      };

      // Update marker position
      this.takeoffPointMarker.updatePosition(updatedPosition);

      // Update polyline start point if polyline exists
      if (this.takeoffPointPolyline) {
        this.updateTakeoffPointPolylineStart();
      }

      // Emit typed event for marker position change
      this._eventService.emitEvent(
        GridMissionPlannerEventType.TAKEOFF_POINT_CHANGED,
        {
          eventType: GridMissionPlannerEventType.TAKEOFF_POINT_CHANGED,
          takeoffPoint: this._takeoffPointPosition,
        }
      );
    };

    // Listen for position changes (when marker is dragged)
    markerEmitter.addListener(
      IEventType.POSITION_CHANGED,
      this._takeoffMarkerPositionListener
    );
  }

  // Update the start point of the takeoff point polyline
  private updateTakeoffPointPolylineStart(): void {
    if (!this.takeoffPointPolyline || !this.takeoffPointMarker) {
      return;
    }

    const gridStart = this.getGridStartPosition();
    if (!gridStart) {
      return;
    }

    const newStartPos = this.takeoffPointMarker.position;

    // Regenerate full path with new start position
    const takeoffPath = this.generateSimpleTakeoffPath(newStartPos, gridStart);
    this.takeoffPointPolyline.setPositions(takeoffPath);
  }

  // Forward events from takeoff point polyline to main event emitter
  private forwardTakeoffPointEvents(): void {
    if (!this.takeoffPointPolyline) {
      return;
    }

    const approachEmitter = this.takeoffPointPolyline.getEventEmitter();

    // Store listener reference for cleanup
    this._takeoffPolylinePositionListener = (_event: IEvent) => {
      if (!this.takeoffPointPolyline) {
        return;
      }

      // Emit typed event for takeoff point polyline update
      this._eventService.emitEvent(
        GridMissionPlannerEventType.TAKEOFF_POINT_CHANGED,
        {
          eventType: GridMissionPlannerEventType.TAKEOFF_POINT_CHANGED,
          takeoffPoint: this._takeoffPointPosition,
        }
      );
    };

    // Forward position changed events
    approachEmitter.addListener(
      IEventType.POSITION_CHANGED,
      this._takeoffPolylinePositionListener
    );
  }

  // Clean up takeoff point resources
  private cleanupTakeoffPoint(): void {
    if (this.takeoffPointPolyline) {
      this.takeoffPointPolyline.remove();
      this.takeoffPointPolyline = undefined;
    }

    // Emit typed event for takeoff point removal
    // This will trigger grid waypoints update since takeoff point affects the mission
    this._eventService.emitEvent(
      GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
      {
        eventType: GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED,
        gridWaypoints: this.getGridWaypointsOnly(),
        completeMissionPath: this.getCompleteMissionPath(),
        polygonVertices: this.polygon?.positions,
      }
    );
  }

  /**
   * Cleans up all event listeners to prevent ghost behavior.
   *
   * This method removes all event listeners that were registered during initialization
   * to ensure the mission planner instance doesn't continue responding to events
   * after being cancelled.
   *
   * @private
   */
  private _cleanupEventListeners(): void {
    // Remove polygon listener
    if (this.polygon && this._polygonPositionListener) {
      const polygonEmitter = this.polygon.getEventEmitter();
      polygonEmitter.removeListener(
        IEventType.POSITION_CHANGED,
        this._polygonPositionListener
      );
      this._polygonPositionListener = undefined;
    }

    // Remove takeoff point marker listener
    if (this.takeoffPointMarker && this._takeoffMarkerPositionListener) {
      const markerEmitter = this.takeoffPointMarker.getEventEmitter();
      markerEmitter.removeListener(
        IEventType.POSITION_CHANGED,
        this._takeoffMarkerPositionListener
      );
      this._takeoffMarkerPositionListener = undefined;
    }

    // Remove takeoff point polyline listener
    if (this.takeoffPointPolyline && this._takeoffPolylinePositionListener) {
      const polylineEmitter = this.takeoffPointPolyline.getEventEmitter();
      polylineEmitter.removeListener(
        IEventType.POSITION_CHANGED,
        this._takeoffPolylinePositionListener
      );
      this._takeoffPolylinePositionListener = undefined;
    }
  }

  /**
   * Cleans up all entities and resets state.
   *
   * Called when cancelling the mission planner.
   * Removes all visual entities from the map and resets internal state.
   *
   * @private
   */
  private _cleanupEntities(): void {
    // Clean up takeoff point polyline (old flow)
    this.cleanupTakeoffPoint();

    // Clean up takeoff point marker (new two-click flow)
    if (this.takeoffPointMarker) {
      this.takeoffPointMarker.remove();
      this.takeoffPointMarker = undefined;
    }
    this._takeoffPointPosition = undefined;

    // Clean up grid lines and main polyline (uses existing method)
    this.removeGrid();

    // Clean up polygon
    if (this.polygon) {
      this.polygon.remove();
      this.polygon = undefined;
    }
  }

  cancelMission(): void {
    // FIRST: Clean up event listeners to prevent ghost behavior
    this._cleanupEventListeners();

    // THEN: Clean up entities and reset state
    this._cleanupEntities();

    // FINALLY: Reset state
    this._state = GridMissionPlannerState.AWAITING_FIRST_CLICK;

    // Emit typed event for mission cancellation
    this._eventService.emitEvent(
      GridMissionPlannerEventType.MISSION_CANCELLED,
      {
        eventType: GridMissionPlannerEventType.MISSION_CANCELLED,
      }
    );
  }
}
