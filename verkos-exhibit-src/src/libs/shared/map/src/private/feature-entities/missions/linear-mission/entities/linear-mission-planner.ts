import {
  CompletedMissionData,
  DeviceYawRouteSettingsMode,
  DroneYawActionTypes,
  IEventType,
  ILinearMissionPlanner,
  ILinearMissionPlannerOptions,
  IMapEventData,
  IMissionRouteSettings,
  IOrientation,
  IPosition,
  IRouteAltitudeSettings,
  IWaypointApproachSettings,
  IWaypointOrientation,
  LinearMissionPlannerEventData,
  LinearMissionPlannerEventType,
  LinearMissionPlannerState,
  NextWaypointApproachMode,
  TakeoffMode,
  WaypointData,
  WaypointState,
} from '@map/public/contracts';
import { DragAltitudeMode, ICompositeManager } from '@map/private/contracts';
import { v4 as uuidv4 } from 'uuid';
import {
  MarkerService,
  OrientationComputationService,
  StateService,
} from '../services';
import { calculateMidpoint } from '@map/private/utils/geometry.utils';
import {
  DebugService,
  EventService,
  MissionPlannerConstants,
  TakeoffPathService,
} from '@map/private/feature-entities/missions/shared';

// Extended position interface for future altitude format support (AGL, ASL, etc.)
interface IWaypointPosition extends IPosition {
  aglAltitude: number;
  // Future extensions can be added here:
  // aslAltitude?: number;  // Above Sea Level
  // mslAltitude?: number;  // Mean Sea Level
}

// Enhanced waypoint data with extended position information
interface WaypointDataWithExtendedPosition extends WaypointData {
  extendedPosition: IWaypointPosition;
}

/**
 * Implementation of the ILinearMissionPlanner interface for creating and managing
 * waypoint-based missions on the map.
 *
 * The LinearMissionPlanner provides functionality for:
 * - Setting and updating a reference point (mission starting position)
 * - Adding, removing, and modifying waypoints
 * - Managing waypoint selection and edit states
 * - Visualizing the mission path on the map
 * - Validating and completing mission plans
 *
 * This implementation uses several services to manage its functionality:
 * - MarkerService: Handles visual representation of waypoints and paths
 * - EventService: Manages event emission and subscription
 * - StateService: Tracks and transitions between states
 * - DebugService: Provides logging for debugging
 *
 * @class LinearMissionPlanner
 * @implements {ILinearMissionPlanner}
 * @category Feature Implementation
 * @layer Feature
 * @internal
 */
export class LinearMissionPlanner implements ILinearMissionPlanner {
  // Public readonly properties as required by the interface
  public readonly id: string;

  // Takeoff settings
  private _takeoffMode: TakeoffMode;
  private _takeoffAltitude: number;

  // Private fields for internal state management
  private _referencePoint: IPosition | null = null; // Stored in RLT coordinates
  private _waypointsData: WaypointData[] = []; // Stored in RLT coordinates
  private _isVisible = true;

  /**
   * Multi-select overlay state for waypoint markers.
   *
   * This is intentionally VISUAL ONLY and must not modify:
   * - StateService.selectedWaypointIndex
   * - StateService.editingWaypointIndex
   */
  private _multiSelectedWaypointIndices: Set<number> = new Set();

  /**
   * When true, suppress single selected/editing visuals on the map.
   * Multi-selected overlay visuals remain active.
   *
   * This is used by the client when entering multi-select mode.
   */
  private _multiWaypointEditModeEnabled = false;

  /**
   * When false, ignore ALL user-driven interactions coming from the map:
   * - map clicks (set reference / add waypoint)
   * - marker clicks (select/edit)
   * - marker drags (POSITION_CHANGED)
   * - alt-drag altitude sync events
   * - global pointer-up side effects
   *
   * Programmatic API calls (addWaypoint/removeWaypoint/...) still work.
   */
  private _userInteractionsEnabled = true;

  // Coordinate conversion context for RLT ↔ HAE transformation
  private _referenceAltitudeHAE: number | null = null; // HAE altitude of takeoff point
  private _conversionContext: {
    referenceAltitude: number;
    hasReferenceAltitude: boolean;
  } = {
    referenceAltitude: 0,
    hasReferenceAltitude: false,
  };

  // Altitude synchronization tracking
  private _altDragStartAltitude: number | null = null;

  // Distance caching for performance
  private _cachedDistance: number | null = null;
  private _distanceCacheValid = false;

  // Mission route settings for device orientation control
  private _missionRouteSettings: IMissionRouteSettings;

  // Route altitude settings for waypoint altitude control
  private _routeAltitudeSettings: IRouteAltitudeSettings;

  // Route device yaw mode for device orientation control
  private _routeDeviceYawMode: DeviceYawRouteSettingsMode;

  // Runtime orientation computation (only for editing waypoint)
  private _currentEditingOrientation: IOrientation | null = null;

  // Global event listener cleanup function
  private _globalPointerUpCleanup: (() => void) | null = null;

  /**
   * Keep Cesium keyboard focus in sync with mission planner selection.
   *
   * We intentionally focus ONLY one waypoint marker at a time (the selected waypoint).
   * This ensures that map keyboard navigation (WASD/ZC/QE) only affects the active waypoint.
   */
  private _syncKeyboardFocus(prevIndex: number, nextIndex: number): void {
    // During client-side multi-select overlay mode, suppress keyboard focus to prevent accidental moves.
    if (this._multiWaypointEditModeEnabled) {
      if (prevIndex !== -1) {
        const prevMarker = this._markerService.waypointMarkers[prevIndex];
        prevMarker?.setKeyboardFocus(false);
      }
      return;
    }

    // Clear previous focus (best-effort).
    if (prevIndex !== -1) {
      const prevMarker = this._markerService.waypointMarkers[prevIndex];
      prevMarker?.setKeyboardFocus(false);
    }

    // Apply focus to new selection.
    if (nextIndex !== -1) {
      const nextMarker = this._markerService.waypointMarkers[nextIndex];
      if (nextMarker) {
        // Ensure the selected waypoint is keyboard-controllable even if it was created while interactions were disabled.
        nextMarker.setKeyboardControllable(true);
        nextMarker.setKeyboardFocus(true);
      }
    }
  }

  // Service instances
  /**
   * Service for handling markers, polylines, and other visual elements
   * @private
   */
  private _markerService: MarkerService;

  /**
   * Service for managing event emission and subscription
   * @private
   */
  private _eventService: EventService<
    LinearMissionPlannerEventType,
    LinearMissionPlannerEventData
  >;

  /**
   * Service for tracking and managing state transitions
   * @private
   */
  private _stateService: StateService;

  /**
   * Service for debug logging
   * @private
   */
  private _debugService: DebugService;

  /**
   * Service for generating takeoff paths
   * @private
   */
  private _takeoffPathService: TakeoffPathService;

  /**
   * Service for computing waypoint orientations
   * @private
   */
  private _orientationComputationService: OrientationComputationService;

  /**
   * Creates a new LinearMissionPlanner instance.
   *
   * Initializes the required services and sets up event handlers for map interactions.
   * If options.initialReferencePoint is provided, the planner will immediately
   * transition to PLANNING state, bypassing the AWAITING_REFERENCE state.
   *
   * @param compositeManager Reference to the composite layer manager for creating and managing visual entities
   * @param options Configuration options for the mission planner
   * @internal
   */
  constructor(
    private readonly _compositeManager: ICompositeManager,
    options: ILinearMissionPlannerOptions
  ) {
    // Initialize ID (either from options or generate new UUID)
    this.id = options.id || `linear-mission-planner-${uuidv4()}`;

    // Set takeoff settings
    this._takeoffMode = options.takeoffMode;
    this._takeoffAltitude = options.takeoffAltitude;

    // Initialize route device yaw mode (mandatory)
    this._routeDeviceYawMode = options.routeDeviceYawMode;

    // Initialize mission route settings with defaults (for backward compatibility)
    this._missionRouteSettings = options.routeSettings || {
      deviceYawRouteSetting: {
        mode: options.routeDeviceYawMode,
      },
    };

    // Initialize route altitude settings (mandatory)
    this._routeAltitudeSettings = options.routeAltitudeSettings;

    // Set initial drag altitude mode based on route altitude settings
    const mapServices = this._compositeManager.mapProviderServices.mapServices;
    if (this._routeAltitudeSettings.type === 'AGL') {
      mapServices.setDragAltitudeMode(DragAltitudeMode.AGL);
    } else {
      // For RLT or any other type, use HAE (since RLT is handled at coordinate level)
      mapServices.setDragAltitudeMode(DragAltitudeMode.HAE);
    }

    // Initialize services
    this._debugService = new DebugService('LinearMissionPlanner');
    this._eventService = new EventService<
      LinearMissionPlannerEventType,
      LinearMissionPlannerEventData
    >(this._compositeManager, this.id);
    this._stateService = new StateService(this._eventService);
    this._markerService = new MarkerService(this._compositeManager);
    this._takeoffPathService = new TakeoffPathService();
    this._orientationComputationService = new OrientationComputationService(
      this._debugService
    );

    // Set up event handlers
    this._setupEventHandlers();
    this._registerAltEventHandlers();

    // Ensure existing waypoints have followRouteAltitude defaults
    this._ensureWaypointFollowRouteDefaults();

    // If reference point is provided, set it immediately (accepts RLT coordinates)
    if (options.initialReferencePoint) {
      this.setReferencePoint(options.initialReferencePoint);
    }
  }

  /**
   * Sets up event handlers for map clicks and marker position changes.
   *
   * This method registers handlers that allow:
   * - Setting reference point via map click when in AWAITING_REFERENCE state
   * - Adding waypoints via map click when in PLANNING state
   * - Monitoring marker position changes (for dragging waypoints)
   *
   * @private
   */
  private _setupEventHandlers(): void {
    // Set up map click handler
    this._eventService.registerMapClickHandler(this._handleMapClick.bind(this));

    // Register for position changes from markers
    this._markerService.registerPositionChangeCallback(
      this._handleMarkerPositionChanged.bind(this)
    );

    // Register for marker click events
    this._markerService.registerMarkerClickCallback(
      this._handleMarkerClick.bind(this)
    );

    // Set up global pointer up event listener to ensure orientation model updates
    this._setupGlobalPointerUpListener();
  }

  /**
   * Sets up global pointer up event listener for orientation model updates
   *
   * This ensures that whenever any drag operation completes, if there's a waypoint
   * in edit mode, its orientation model gets updated to reflect the current trajectory.
   * This approach is more reliable than trying to track specific position changes.
   *
   * @private
   */
  private _setupGlobalPointerUpListener(): void {
    // Get the map service for global event registration
    const mapServices = this._compositeManager.mapProviderServices;
    if (!mapServices?.mapServices) {
      this._debugService.warn(
        'Cannot set up global pointer up listener: no map services available'
      );
      return;
    }

    const mapService = mapServices.mapServices;

    // Create the event handler
    const handleGlobalPointerUp = (_event: IMapEventData) => {
      if (!this._userInteractionsEnabled) {
        return;
      }
      this._debugService.log('Global pointer up detected');

      // If there's a waypoint in edit mode, ensure its orientation is current
      const editingIndex = this._stateService.editingWaypointIndex;
      if (editingIndex !== -1) {
        this._debugService.log(
          `Updating orientation for editing waypoint ${editingIndex} after pointer up`
        );
        this._recomputeEditingWaypointOrientation();
      } else {
        this._debugService.log(
          'No waypoint in edit mode, skipping orientation update'
        );
      }
    };

    // Register global mouse up event (LEFT_UP covers mouse and pointer up events)
    try {
      mapService.onGlobalMapEvent(IEventType.LEFT_UP, handleGlobalPointerUp);
      this._debugService.log('Global LEFT_UP listener registered');

      // Store cleanup function
      this._globalPointerUpCleanup = () => {
        // Note: Most map services don't provide explicit removeEventListener
        // The cleanup will happen when the mission planner is disposed
        this._debugService.log(
          'Global pointer up listener cleanup noted for disposal'
        );
      };
    } catch (error) {
      this._debugService.warn(
        'Failed to register global pointer up listener:',
        error
      );
    }
  }

  /**
   * Registers Alt event handlers using both entity-specific and global approaches.
   *
   * This method sets up:
   * - Entity-specific event listeners on the reference point marker for ALT_PLUS_LEFT_DOWN and ALT_PLUS_LEFT_UP
   * - Global LEFT_UP event listener as fallback when entity ID is not propagated properly
   *
   * These events enable synchronized altitude changes where modifying the reference
   * point altitude via Alt + drag automatically updates all waypoint altitudes by
   * the same delta amount.
   *
   * @private
   */
  private _registerAltEventHandlers(): void {
    // Register Alt event callbacks with the MarkerService for entity-specific events
    // This handles ALT_PLUS_LEFT_DOWN and ALT_PLUS_LEFT_UP when entity ID is available
    this._markerService.registerAltEventCallbacks(
      this._handleAltMouseDownEvent.bind(this),
      this._handleAltMouseUpEvent.bind(this)
    );

    // ALSO register for global LEFT_UP events as fallback
    // This ensures altitude sync works even when entity ID is not propagated
    const mapService = this._compositeManager.mapProviderServices.mapServices;
    mapService.onGlobalMapEvent(
      IEventType.LEFT_UP,
      this._handleGlobalLeftUpEvent.bind(this)
    );
  }

  /**
   * Handles map click events based on the current state of the mission planner.
   *
   * In AWAITING_REFERENCE state, clicks set the reference point.
   * In PLANNING state, clicks add new waypoints (if not clicking on existing entities).
   *
   * Implementation details:
   * - Receives HAE coordinates from map click events
   * - Converts HAE to RLT coordinates for API consumption
   * - Filters out clicks when the planner is not visible
   * - Prevents adding waypoints when clicking on existing planner entities
   * - Applies altitude based on route altitude settings (RLT or AGL)
   *
   * @param event The map event data containing position information (in HAE coordinates)
   * @private
   */
  private _handleMapClick(event: IMapEventData): void {
    if (!this._userInteractionsEnabled) {
      return;
    }
    // Skip if no valid position or the feature is not visible
    if (!event.position || !this._isVisible) {
      return;
    }

    // Handle different states
    if (
      this._stateService.state === LinearMissionPlannerState.AWAITING_REFERENCE
    ) {
      this._debugService.log('Setting reference point from map click', {
        haePosition: event.position,
      });

      // For reference point, HAE = RLT initially (becomes the baseline)
      // Set the reference point if in AWAITING_REFERENCE state
      this.setReferencePoint(event.position);
    } else if (
      this._stateService.state === LinearMissionPlannerState.PLANNING
    ) {
      // If already planning, add a waypoint at the clicked position
      if (!event.entityId || !event.entityId.startsWith(this.id)) {
        // Handle waypoint creation asynchronously to support AGL conversion
        this._handleWaypointCreationFromMapClick(event.position);
      }
    }
  }

  /**
   * Handles waypoint creation from map click with dynamic altitude calculation.
   * This method is async to support AGL to HAE conversion when needed.
   *
   * @param clickPosition The position where the map was clicked (in HAE coordinates)
   * @private
   */
  private async _handleWaypointCreationFromMapClick(
    clickPosition: IPosition
  ): Promise<void> {
    try {
      // Calculate the appropriate HAE altitude based on route altitude settings
      const waypointHAEAltitude = await this._calculateWaypointHAEAltitude(
        clickPosition
      );

      // Create waypoint position with calculated HAE altitude
      const waypointHAEPosition: IPosition = {
        ...clickPosition,
        altitude: waypointHAEAltitude,
      };

      // Convert to RLT for internal storage and API consumption
      const waypointRLTPosition = this._convertHAEtoRLT(waypointHAEPosition);

      this._debugService.log(
        'Adding waypoint from map click with dynamic altitude',
        {
          clickPosition: clickPosition,
          routeAltitudeSettings: this._routeAltitudeSettings,
          calculatedHAEAltitude: waypointHAEAltitude,
          waypointHAEPosition: waypointHAEPosition,
          waypointRLTPosition: waypointRLTPosition,
        }
      );

      // Add the waypoint with the calculated position
      this.addWaypoint(waypointRLTPosition);
    } catch (error) {
      this._debugService.error(
        'Failed to create waypoint from map click',
        error
      );

      // Fallback: use the old behavior with a reasonable default altitude
      const fallbackRLTPosition = this._convertHAEtoRLT(clickPosition);
      const waypointRLTPosition = {
        ...fallbackRLTPosition,
        altitude: this._routeAltitudeSettings.value, // Use the route altitude value as fallback
      };

      this._debugService.log('Using fallback waypoint creation', {
        waypointRLTPosition: waypointRLTPosition,
      });

      this.addWaypoint(waypointRLTPosition);
    }
  }

  /**
   * Handles click events on markers.
   *
   * For waypoint markers, this will select the waypoint and put it into edit mode.
   *
   * @param entityId The ID of the marker that was clicked
   * @param waypointIndex The current array index (only for waypoint markers)
   * @private
   */
  private _handleMarkerClick(entityId: string, waypointIndex?: number): void {
    if (!this._userInteractionsEnabled) {
      return;
    }
    if (!entityId || !this._isVisible) {
      return;
    }

    // Handle waypoint marker clicks (we have a valid index)
    if (waypointIndex !== undefined && waypointIndex >= 0) {
      // Skip if not in planning state or the waypoint index is invalid
      if (
        this._stateService.state !== LinearMissionPlannerState.PLANNING ||
        waypointIndex < 0 ||
        waypointIndex >= this._waypointsData.length
      ) {
        return;
      }

      this._debugService.log(
        `Waypoint ${waypointIndex} clicked, selecting and entering edit mode`
      );

      // Use the passed waypointIndex directly - no parsing needed!
      // First select the waypoint (if not already selected)
      this.selectWaypoint(waypointIndex);

      // Then enter edit mode (if not already in edit mode)
      if (this._stateService.editingWaypointIndex !== waypointIndex) {
        this.enterEditMode();
      }
      return;
    }

    // Handle reference point clicks (keep existing ID-based logic for reference point)
    const referenceRegex = new RegExp(
      `^${this.id}-${MissionPlannerConstants.EntityPrefixes.REFERENCE_POINT}$`
    );
    if (entityId.match(referenceRegex)) {
      this._debugService.log('Reference point clicked');
      // Reference point clicks don't need special handling in current implementation
    }
  }

  /**
   * Handles position changes for markers when they are moved.
   *
   * This method detects which marker changed position (reference point or waypoint)
   * and routes the event to the appropriate handler.
   *
   * Implementation details:
   * - Uses entity ID patterns to determine marker type
   * - Uses regex to extract waypoint indices from waypoint marker IDs
   *
   * @param entityId The ID of the marker that changed position
   * @param position The new position
   * @private
   */
  private _handleMarkerPositionChanged(
    entityId: string,
    position: IPosition
  ): void {
    if (!this._userInteractionsEnabled) {
      return;
    }
    if (!entityId || !position || !this._isVisible) {
      return;
    }

    // Check if it's the reference marker
    const referencePointId = `${this.id}-${MissionPlannerConstants.EntityPrefixes.REFERENCE_POINT}`;
    if (entityId === referencePointId) {
      this._handleReferenceMarkerPositionChanged(position);
      return;
    }

    // Check if it's a waypoint marker
    const waypointRegex = new RegExp(
      `^${this.id}-${MissionPlannerConstants.EntityPrefixes.WAYPOINT}-(\\d+)$`
    );
    const match = entityId.match(waypointRegex);

    if (match && match[1]) {
      const waypointIndex = parseInt(match[1], 10);
      this._handleWaypointMarkerPositionChanged(waypointIndex, position);
    }
  }

  /**
   * Handles reference marker position changes during drag.
   *
   * Implementation details:
   * - Receives HAE coordinates from map drag events
   * - Converts HAE to RLT coordinates for internal storage
   * - Updates coordinate conversion context with new HAE baseline
   * - Updates the mission path visualization
   * - Emits REFERENCE_POINT_CHANGED event (with HAE coordinates)
   * - Waypoint markers are NOT updated during drag for better UX
   * - Includes error handling and logging
   *
   * @param haePosition The new position from map (in HAE coordinates)
   * @private
   */
  private _handleReferenceMarkerPositionChanged(haePosition: IPosition): void {
    if (!this._referencePoint) return;

    try {
      // Capture previous HAE altitude BEFORE updating conversion context
      // This is needed to detect altitude changes from keyboard movement (Z/C keys)
      const previousAltitudeHAE = this._referenceAltitudeHAE || 0;

      // Update coordinate conversion context with new HAE baseline
      this._updateConversionContext(haePosition);

      // Store reference point in RLT coordinates (always altitude 0 as takeoff point)
      this._referencePoint = {
        ...haePosition,
        altitude: 0, // Reference point is always at RLT altitude 0 (takeoff point)
      };

      this._debugService.log('Reference point position changed', {
        newHAE: haePosition,
        newRLT: this._referencePoint,
        newHAEBaseline: this._referenceAltitudeHAE,
      });

      // Check if we're in Alt + drag mode
      const isAltDragInProgress = this._altDragStartAltitude !== null;

      if (isAltDragInProgress) {
        // During Alt + drag, only update reference point position internally
        // Do NOT update mission path or emit events - these will be handled by _processAltitudeSync on mouse up
        this._debugService.log(
          'Alt + drag in progress, deferring visual updates until mouse up'
        );
        return;
      }

      // Check altitude reference mode to determine update behavior (consistent with updateReferencePoint)
      const isAGLMode = this._routeAltitudeSettings.type === 'AGL';

      // Calculate altitude delta for keyboard-driven altitude changes (Z/C keys)
      // This replicates the waypoint altitude sync logic from _processAltitudeSync
      const newAltitudeHAE = this._referenceAltitudeHAE || 0;
      const altitudeDelta = newAltitudeHAE - previousAltitudeHAE;

      // If there's a significant altitude change (from keyboard Z/C keys), sync waypoint altitudes
      if (Math.abs(altitudeDelta) > 0.001 && this._waypointsData.length > 0) {
        this._debugService.log(
          'Keyboard altitude change detected, syncing waypoint altitudes',
          {
            previousAltitudeHAE,
            newAltitudeHAE,
            altitudeDelta,
            isAGLMode,
          }
        );

        if (!isAGLMode) {
          // RLT mode: update waypoint absolute positions by the same delta
          this._updateWaypointsAltitudeRelativeToReference(altitudeDelta);
        } else {
          // AGL mode: adjust RLT values to keep absolute positions unchanged
          this._waypointsData.forEach((waypoint, index) => {
            if (waypoint.position.altitude !== undefined) {
              const oldRLT = waypoint.position.altitude;
              const newRLT = oldRLT - altitudeDelta;
              waypoint.position.altitude = newRLT;

              this._debugService.log(
                `AGL mode: Updated waypoint ${index} RLT value from keyboard altitude change`,
                { oldRLT, newRLT, altitudeDelta: -altitudeDelta }
              );
            }
          });
        }
      }

      // Always update takeoff path when reference point changes (both AGL and RLT modes)
      this._updateTakeoffPath();

      if (!isAGLMode) {
        // RLT mode: update waypoint path with new HAE coordinates
        this._updateWaypointPath();
      } else {
        // AGL mode: skip waypoint path updates during regular drag to preserve terrain-relative heights
        // Note: Takeoff path is still updated above to reflect new reference point position
        this._debugService.log(
          'AGL mode: skipping waypoint path updates during drag to preserve terrain-relative heights'
        );
      }

      // Always emit reference point changed event with HAE coordinates (regardless of mode)
      this._eventService.emitEvent(
        LinearMissionPlannerEventType.REFERENCE_POINT_CHANGED,
        {
          eventType: LinearMissionPlannerEventType.REFERENCE_POINT_CHANGED,
          referencePoint: { ...haePosition }, // Emit HAE coordinates for consumers
        }
      );
    } catch (error) {
      this._debugService.error(
        'Error handling reference point position change',
        error
      );
    }
  }

  /**
   * Handles waypoint marker position changes.
   *
   * Implementation details:
   * - Receives HAE coordinates from map drag events
   * - Converts HAE to RLT coordinates for internal storage and events
   * - Updates internal waypoint position data (in RLT coordinates)
   * - Updates the mission path visualization
   * - Updates orientation model position if waypoint is in edit mode (using HAE coordinates)
   * - Emits WAYPOINT_UPDATED event (with RLT coordinates)
   * - Includes error handling and logging
   *
   * @param index The waypoint index
   * @param haePosition The new position from map (in HAE coordinates)
   * @private
   */
  private _handleWaypointMarkerPositionChanged(
    index: number,
    haePosition: IPosition
  ): void {
    if (index < 0 || index >= this._waypointsData.length) return;

    try {
      // Convert HAE position from map to RLT for internal storage
      const rltPosition = this._convertHAEtoRLT(haePosition);

      this._debugService.log(`Waypoint ${index} position changed`, {
        fromRLT: this._waypointsData[index].position,
        toHAE: haePosition,
        toRLT: rltPosition,
      });

      // Update the waypoint data with RLT coordinates
      this._waypointsData[index].position = { ...rltPosition };

      // Update the mission path (will convert RLT back to HAE internally)
      this._updateMissionPath();

      // Invalidate distance cache and emit distance change event
      this._invalidateDistanceCache();
      this._emitDistanceChangedEvent();

      // Update orientation model if this waypoint is being edited
      // Note: Orientation model needs HAE coordinates for proper positioning
      if (
        this._stateService.editingWaypointIndex === index &&
        this._markerService.orientationModel
      ) {
        // Recompute orientation when position changes for editing waypoint
        this._recomputeEditingWaypointOrientation();
      }

      // Emit waypoint updated event with RLT coordinates
      this._eventService.emitEvent(
        LinearMissionPlannerEventType.WAYPOINT_UPDATED,
        {
          waypointIndex: index,
          waypointData: { ...this._waypointsData[index] }, // RLT coordinates
        }
      );
    } catch (error) {
      this._debugService.error(
        `Error handling waypoint ${index} position change`,
        error
      );
    }
  }

  /**
   * Handles Alt + Left Down events on the reference point marker.
   *
   * This method captures the initial altitude when altitude manipulation begins,
   * which will be used later to calculate the altitude delta when Alt + Left Up occurs.
   *
   * Implementation details:
   * - Called only for the reference point marker (entity-specific event)
   * - Stores the current reference point altitude
   * - Logs the capture for debugging
   *
   * @param entityId The entity ID (will always be the reference point)
   * @private
   */
  private _handleAltMouseDownEvent(entityId: string): void {
    if (!this._userInteractionsEnabled) {
      return;
    }
    if (this._referencePoint) {
      // Capture the HAE altitude at the moment Alt + drag starts (not RLT which is always 0)
      this._altDragStartAltitude = this._referenceAltitudeHAE || 0;

      this._debugService.log('Alt + Mouse down detected on reference point', {
        initialAltitude: this._altDragStartAltitude,
      });
    }
  }

  /**
   * Handles mouse up events on the reference point marker for altitude synchronization.
   *
   * This method calculates the altitude delta and synchronizes all waypoint altitudes
   * when altitude manipulation ends. It handles both ALT_PLUS_LEFT_UP and regular LEFT_UP
   * events to ensure altitude synchronization works regardless of which event is fired.
   *
   * Implementation details:
   * - Called only for the reference point marker (entity-specific event)
   * - Only processes if we have a captured start altitude (from Alt + mouse down)
   * - Calculates altitude delta from captured start altitude
   * - Updates all waypoint altitudes if delta is significant
   * - Resets the captured altitude state
   *
   * @param entityId The entity ID (will always be the reference point)
   * @private
   */
  private _handleAltMouseUpEvent(entityId: string): void {
    if (!this._userInteractionsEnabled) {
      return;
    }
    this._processAltitudeSync('entity-specific', entityId).catch((error) => {
      console.error(
        'Failed to process altitude sync from entity event:',
        error
      );
    });
  }

  /**
   * Handles global LEFT_UP events as fallback for altitude synchronization.
   *
   * This method is called for all LEFT_UP events on the map and checks if we need
   * to process altitude synchronization when entity-specific events don't work.
   *
   * Implementation details:
   * - Called for ALL LEFT_UP events (global listener)
   * - Only processes if we have a captured start altitude (from Alt + mouse down)
   * - Uses the same altitude synchronization logic as entity-specific handler
   *
   * @param event The global map event data
   * @private
   */
  private _handleGlobalLeftUpEvent(event: IMapEventData): void {
    if (!this._userInteractionsEnabled) {
      return;
    }
    this._processAltitudeSync('global', event.entityId).catch((error) => {
      console.error(
        'Failed to process altitude sync from global event:',
        error
      );
    });
  }

  /**
   * Processes altitude synchronization logic for both entity-specific and global events.
   *
   * This centralized method handles the altitude delta calculation and waypoint updates
   * to avoid code duplication between different event handlers.
   *
   * @param source The source of the event ('entity-specific' or 'global')
   * @param entityId Optional entity ID for debugging
   * @private
   */
  private async _processAltitudeSync(
    source: string,
    entityId?: string
  ): Promise<void> {
    // Only process if we have a reference point and captured start altitude
    if (this._referencePoint && this._altDragStartAltitude !== null) {
      // Use HAE altitude for proper delta calculation (reference point RLT altitude is always 0)
      const finalAltitude = this._referenceAltitudeHAE || 0;
      const altitudeDelta = finalAltitude - this._altDragStartAltitude;

      this._debugService.log(`Mouse up detected after Alt + drag (${source})`, {
        source: source,
        entityId: entityId,
        initialAltitude: this._altDragStartAltitude,
        finalAltitude: finalAltitude,
        altitudeDelta: altitudeDelta,
      });

      // Check altitude reference mode to determine update behavior (consistent with other reference point operations)
      const isAGLMode = this._routeAltitudeSettings.type === 'AGL';

      if (!isAGLMode) {
        // RLT mode: perform altitude and path updates
        if (Math.abs(altitudeDelta) > 0.001) {
          await this._updateWaypointsAltitudeRelativeToReference(altitudeDelta);
        }

        // Handle deferred visual updates that were suppressed during Alt+drag
        this._debugService.log(
          'Processing deferred visual updates after Alt+drag'
        );

        // Always update takeoff path (was deferred during drag)
        this._updateTakeoffPath();

        // Update waypoint path (was deferred during drag)
        this._updateWaypointPath();
      } else {
        // AGL mode: update waypoint RLT values while keeping same absolute positions
        if (Math.abs(altitudeDelta) > 0.001 && this._waypointsData.length > 0) {
          this._debugService.log(
            'AGL mode: Updating waypoint RLT values after reference altitude change',
            {
              altitudeDelta: altitudeDelta,
              waypointCount: this._waypointsData.length,
            }
          );

          // Simply adjust RLT values by the altitude delta
          this._waypointsData.forEach((waypoint, index) => {
            if (waypoint.position.altitude !== undefined) {
              const oldRLT = waypoint.position.altitude;
              const newRLT = oldRLT - altitudeDelta;

              waypoint.position.altitude = newRLT;

              this._debugService.log(
                `AGL mode: Updated waypoint ${index} RLT value`,
                {
                  oldRLT: oldRLT,
                  newRLT: newRLT,
                  altitudeDelta: -altitudeDelta,
                }
              );
            }
          });
        }

        // Always update takeoff path to reflect new reference point position
        this._updateTakeoffPath();

        this._debugService.log(
          'AGL mode: Updated waypoint RLT values while preserving absolute positions'
        );
      }

      // Always emit the reference point changed event (was deferred during drag) regardless of mode
      const referencePointHAE = this._convertRLTtoHAE(this._referencePoint);
      this._eventService.emitEvent(
        LinearMissionPlannerEventType.REFERENCE_POINT_CHANGED,
        {
          eventType: LinearMissionPlannerEventType.REFERENCE_POINT_CHANGED,
          referencePoint: { ...referencePointHAE }, // Emit HAE coordinates for consumers
        }
      );

      // Reset the captured altitude
      this._altDragStartAltitude = null;
    }
  }

  // ------------------------------------------------------------
  // Interface Properties Implementation
  // ------------------------------------------------------------

  /**
   * Gets the current state of the mission planning process.
   *
   * @returns The current LinearMissionPlannerState (AWAITING_REFERENCE or PLANNING)
   * @readonly
   * @public
   */
  public get state(): LinearMissionPlannerState {
    return this._stateService.state;
  }

  /**
   * Gets the reference point for the mission.
   *
   * The reference point represents the starting position of the mission and
   * is required before waypoints can be added.
   *
   * @returns A copy of the reference point position in HAE coordinates or null if not set yet
   * @readonly
   * @public
   */
  public get referencePoint(): Readonly<IPosition> | null {
    if (!this._referencePoint) {
      return null;
    }

    // Convert RLT reference point back to HAE coordinates for consumer
    return this._convertRLTtoHAE(this._referencePoint);
  }

  /**
   * Gets the number of waypoints in the current mission plan.
   *
   * @returns The number of waypoints
   * @readonly
   * @public
   */
  public get waypointCount(): number {
    return this._waypointsData.length;
  }

  /**
   * Gets the index of the currently selected waypoint.
   *
   * @returns The index of the selected waypoint or -1 if none is selected
   * @readonly
   * @public
   */
  public get selectedWaypointIndex(): number {
    return this._stateService.selectedWaypointIndex;
  }

  /**
   * Gets the index of the waypoint currently in edit mode.
   *
   * @returns The index of the waypoint in edit mode or -1 if none is in edit mode
   * @readonly
   * @public
   */
  public get editingWaypointIndex(): number {
    return this._stateService.editingWaypointIndex;
  }

  /**
   * Gets whether the mission plan is currently visible on the map.
   *
   * @returns True if visible, false if hidden
   * @readonly
   * @public
   */
  public get isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Gets the takeoff mode for the mission.
   *
   * @returns The takeoff mode (DIRECT_ASCENT or SAFE_TAKEOFF)
   * @readonly
   * @public
   */
  public get takeoffMode(): TakeoffMode {
    return this._takeoffMode;
  }

  /**
   * Gets the safe takeoff altitude for the mission.
   *
   * @returns The safe takeoff altitude in meters
   * @readonly
   * @public
   */
  public get takeoffAltitude(): number {
    return this._takeoffAltitude;
  }

  /**
   * Gets the total distance from first waypoint to last waypoint in meters.
   *
   * Calculates the cumulative distance along the waypoint path:
   * - From waypoint 0 to waypoint 1
   * - From waypoint 1 to waypoint 2
   * - ... and so on to the last waypoint
   *
   * The calculation includes 3D distances (accounting for altitude differences).
   * Uses caching for performance optimization.
   *
   * @returns Total waypoint-to-waypoint distance in meters, or 0 if fewer than 2 waypoints
   * @readonly
   * @public
   */
  public get missionDistance(): number {
    if (!this._distanceCacheValid || this._cachedDistance === null) {
      this._cachedDistance = this._calculateMissionDistance();
      this._distanceCacheValid = true;
    }
    return this._cachedDistance;
  }

  /**
   * Gets the current mission route settings (readonly)
   * @returns A readonly copy of the current mission route settings
   * @readonly
   * @public
   */
  public get missionRouteSettings(): Readonly<IMissionRouteSettings> {
    return { ...this._missionRouteSettings };
  }

  /**
   * Gets the current route altitude settings (readonly)
   * @returns A readonly copy of the current route altitude settings
   * @readonly
   * @public
   */
  public get routeAltitudeSettings(): Readonly<IRouteAltitudeSettings> {
    return { ...this._routeAltitudeSettings };
  }

  /**
   * Gets the current route device yaw mode
   * @returns The current device yaw mode for the mission
   * @readonly
   * @public
   */
  public get routeDeviceYawMode(): DeviceYawRouteSettingsMode {
    return this._routeDeviceYawMode;
  }

  // ------------------------------------------------------------
  // State Checking Methods Implementation
  // ------------------------------------------------------------

  /**
   * Checks if the mission plan can have waypoints added.
   *
   * The mission must be in PLANNING state (have a reference point set)
   * to allow adding waypoints.
   *
   * @returns True if the mission is in a state where waypoints can be added
   * @public
   */
  public canAddWaypoints(): boolean {
    return this._stateService.canAddWaypoints();
  }

  /**
   * Checks if the mission plan can have waypoints edited.
   *
   * The mission must be in PLANNING state and have at least one waypoint
   * to allow editing waypoints.
   *
   * @returns True if the mission is in a state where waypoints can be edited
   * @public
   */
  public canEditWaypoints(): boolean {
    return this._stateService.canEditWaypoints(this._waypointsData.length);
  }

  // ------------------------------------------------------------
  // Waypoint Access Methods Implementation
  // ------------------------------------------------------------

  /**
   * Gets information about all waypoints in the mission plan.
   *
   * Implementation details:
   * - Returns a deep copy of the waypoint data to prevent direct modification
   * - Uses map() to ensure each waypoint is a distinct object
   *
   * @returns Array of waypoint data objects
   * @public
   */
  public getWaypoints(): WaypointData[] {
    return this._waypointsData.map((data) => ({ ...data }));
  }

  /**
   * Gets information about a specific waypoint in the plan.
   *
   * Implementation details:
   * - Validates the index is within bounds
   * - Returns a deep copy of the waypoint data to prevent direct modification
   *
   * @param index The index of the waypoint
   * @returns Waypoint data if found, undefined if index is invalid
   * @public
   */
  public getWaypoint(index: number): WaypointData | undefined {
    if (index < 0 || index >= this._waypointsData.length) {
      return undefined;
    }
    return { ...this._waypointsData[index] };
  }

  // ------------------------------------------------------------
  // Reference Point Methods Implementation
  // ------------------------------------------------------------

  /**
   * Sets the reference point for the mission plan.
   *
   * Implementation details:
   * - Accepts HAE coordinates as input (establishes the baseline for conversions)
   * - Stores reference point internally as RLT coordinates (always altitude 0)
   * - Sets up coordinate conversion context for future waypoints
   * - Validates the mission is in AWAITING_REFERENCE state
   * - Creates a reference point marker via MarkerService (using HAE)
   * - Transitions to PLANNING state via StateService
   * - Creates an empty mission path visualization
   * - Emits REFERENCE_POINT_ADDED event (with HAE coordinates)
   *
   * @param position The position to set as reference (in HAE coordinates - establishes baseline)
   * @throws Error if mission is not in AWAITING_REFERENCE state
   * @public
   */
  public setReferencePoint(position: IPosition): void {
    if (
      this._stateService.state !== LinearMissionPlannerState.AWAITING_REFERENCE
    ) {
      throw new Error(
        'Reference point can only be set in AWAITING_REFERENCE state'
      );
    }

    // For reference point, the input position becomes the HAE baseline
    const haePosition = { ...position };

    // Set up coordinate conversion context first
    this._updateConversionContext(haePosition);

    // Store reference point in RLT coordinates (altitude 0 since it's the takeoff point)
    this._referencePoint = {
      ...position,
      altitude: 0, // Reference point is always at RLT altitude 0 (takeoff point)
    };

    // Create reference point marker with HAE coordinates
    this._markerService.createReferenceMarker(this.id, haePosition);

    // Transition to PLANNING state
    this._stateService.transitionToState(LinearMissionPlannerState.PLANNING);

    // Create empty mission path with HAE coordinates
    this._markerService.createMissionPath(this.id, [haePosition]);

    // Emit reference point added event with HAE coordinates
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.REFERENCE_POINT_ADDED,
      {
        eventType: LinearMissionPlannerEventType.REFERENCE_POINT_ADDED,
        referencePoint: { ...haePosition }, // Emit HAE coordinates for consumers
      }
    );
  }

  /**
   * Updates the reference point position.
   *
   * Implementation details:
   * - Accepts HAE coordinates as input (to establish new baseline)
   * - Stores reference point internally as RLT coordinates (always altitude 0)
   * - Updates coordinate conversion context for future operations
   * - In RLT mode: Updates all waypoint markers and mission path (waypoints maintain relative altitude to takeoff)
   * - In AGL mode: Skips waypoint/path updates (waypoints maintain height above ground level)
   * - Emits REFERENCE_POINT_CHANGED event (with HAE coordinates)
   *
   * @param position The new position for the reference point (in HAE coordinates - establishes new baseline)
   * @public
   */
  public updateReferencePoint(position: IPosition): void {
    // The input position represents the new HAE baseline
    const haePosition = { ...position };

    // Update coordinate conversion context with new baseline first
    this._updateConversionContext(haePosition);

    // Store reference point in RLT coordinates (always altitude 0 as takeoff point)
    this._referencePoint = {
      ...position,
      altitude: 0, // Reference point is always at RLT altitude 0 (takeoff point)
    };

    // Update reference marker position with HAE coordinates
    const marker = this._markerService.referenceMarker;
    if (marker) {
      marker.updatePosition(haePosition);
    }

    // Check altitude reference mode to determine update behavior
    const isAGLMode = this._routeAltitudeSettings.type === 'AGL';

    if (!isAGLMode) {
      // RLT mode: perform full updates
      // Update waypoint markers with new HAE coordinates based on updated baseline FIRST
      // (waypoint RLT coordinates remain unchanged, but their HAE representation changes)
      this._updateWaypointMarkersAfterReferenceChange();

      // Update takeoff path AFTER waypoint markers are updated (so it uses correct positions)
      this._updateTakeoffPath();

      // Update waypoint path with new HAE coordinates
      this._updateWaypointPath();

      // Update editing waypoint orientation if first waypoint is affected
      if (this._stateService.editingWaypointIndex === 0) {
        // First waypoint orientation depends on reference point
        this._recomputeEditingWaypointOrientation();
        this._debugService.log(
          'Updated editing waypoint orientation after reference point change'
        );
      }
    } else {
      // AGL mode: skip waypoint altitude updates and waypoint path updates
      // Waypoints should maintain their height above ground level
      // Only update takeoff path to reflect new reference point position
      this._updateTakeoffPath();

      this._debugService.log(
        'AGL mode: skipping waypoint altitude and waypoint path updates to preserve terrain-relative heights'
      );
    }

    // Emit reference point changed event with HAE coordinates (always emit regardless of mode)
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.REFERENCE_POINT_CHANGED,
      {
        eventType: LinearMissionPlannerEventType.REFERENCE_POINT_CHANGED,
        referencePoint: { ...haePosition }, // Emit HAE coordinates for consumers
      }
    );
  }

  /**
   * Updates mission-level route settings
   * Triggers recomputation of editing waypoint orientation if applicable
   *
   * @param routeSettings New route settings configuration
   * @throws Error if mission is not in PLANNING state
   * @public
   */
  public updateMissionRouteSettings(
    routeSettings: IMissionRouteSettings
  ): void {
    // if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
    //   throw new Error('Route settings can only be updated in PLANNING state');
    // }

    // Update new field from old interface (for backward compatibility)
    this._routeDeviceYawMode = routeSettings.deviceYawRouteSetting.mode;

    // Update old field for consistency
    this._missionRouteSettings = { ...routeSettings };

    // Recompute orientation for currently editing waypoint
    this._recomputeEditingWaypointOrientation();

    // Emit route settings changed event
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED,
      {
        routeSettings: { ...routeSettings },
      }
    );
  }

  /**
   * Updates route altitude settings
   *
   * This method allows changing the altitude type and value for new waypoints.
   * Existing waypoints are not affected by this change.
   * Emits a ROUTE_SETTINGS_CHANGED event.
   *
   * @param altitudeSettings New altitude settings configuration
   * @throws Error if mission is not in PLANNING state
   * @public
   */
  public async updateRouteAltitudeSettings(
    altitudeSettings: IRouteAltitudeSettings
  ): Promise<void> {
    // if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
    //   throw new Error(
    //     'Route altitude settings can only be updated in PLANNING state'
    //   );
    // }

    // Detect if this is a type change (AGL ↔ RLT)
    const previousSettings = { ...this._routeAltitudeSettings };
    const typeChanged = previousSettings.type !== altitudeSettings.type;
    const valueChanged = previousSettings.value !== altitudeSettings.value;

    // Use onlyTypeChanged parameter if provided, otherwise compute from actual changes
    const effectiveTypeChanged =
      altitudeSettings.onlyTypeChanged !== undefined
        ? altitudeSettings.onlyTypeChanged && typeChanged
        : typeChanged;

    this._routeAltitudeSettings = { ...altitudeSettings };

    // Set drag altitude mode based on altitude settings
    const mapServices = this._compositeManager.mapProviderServices.mapServices;
    if (altitudeSettings.type === 'AGL') {
      mapServices.setDragAltitudeMode(DragAltitudeMode.AGL);
    } else {
      // For RLT or any other type, use HAE (since RLT is handled at coordinate level)
      mapServices.setDragAltitudeMode(DragAltitudeMode.HAE);
    }

    this._debugService.log('Route altitude settings updated', {
      previousSettings,
      newSettings: this._routeAltitudeSettings,
      typeChanged,
      valueChanged,
      onlyTypeChanged: altitudeSettings.onlyTypeChanged,
      effectiveTypeChanged,
    });

    // Update existing waypoints if there are any
    if (!altitudeSettings?.onlyTypeChanged && this._waypointsData.length > 0) {
      await this._updateExistingWaypointsForAltitudeSettingsChange(
        previousSettings,
        altitudeSettings,
        effectiveTypeChanged
      );
    }

    // If only type changed, disable follow route settings for all waypoints
    // This ensures waypoints maintain their current values when type changes
    if (altitudeSettings?.onlyTypeChanged && this._waypointsData.length > 0) {
      this._disableFollowRouteForAllWaypoints();
    }

    // Emit route settings changed event with altitude settings
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED,
      {
        routeAltitudeSettings: { ...altitudeSettings },
      }
    );
  }

  /**
   * Updates the route device yaw mode for the mission.
   *
   * This method changes how device orientation is computed for all waypoints:
   * - ALONG_ROUTE: Each waypoint looks in direction from previous point to current point
   * - LOCK_YAW_AXIS: All waypoints use reference point → first waypoint angle
   * - MANUAL: Same as LOCK_YAW_AXIS for now (placeholder for future manual control)
   *
   * @param mode New device yaw mode
   * @throws Error if mission is not in PLANNING state
   * @public
   */
  public updateRouteDeviceYawMode(mode: DeviceYawRouteSettingsMode): void {
    // if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
    //   throw new Error(
    //     'Route device yaw mode can only be updated in PLANNING state'
    //   );
    // }

    this._routeDeviceYawMode = mode;

    // Keep backward compatibility - sync old interface
    this._missionRouteSettings.deviceYawRouteSetting.mode = mode;

    // Recompute orientation for currently editing waypoint
    this._recomputeEditingWaypointOrientation();

    // Emit route settings changed event (for backward compatibility)
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED,
      {
        routeSettings: { ...this._missionRouteSettings },
      }
    );

    this._debugService.log('Route device yaw mode updated', {
      newMode: mode,
    });
  }

  // ------------------------------------------------------------
  // Waypoint Management Methods Implementation
  // ------------------------------------------------------------

  /**
   * Adds a waypoint to the mission plan.
   *
   * Implementation details:
   * - Accepts RLT coordinates as input (user-provided)
   * - Stores waypoint data internally in RLT coordinates
   * - Converts to HAE coordinates for map entity creation
   * - Validates the mission is in PLANNING state
   * - Creates a deep copy of the waypoint data to avoid reference issues
   * - Creates a waypoint marker via MarkerService (using HAE coordinates)
   * - Updates the mission path visualization
   * - Automatically selects the new waypoint
   * - Emits WAYPOINT_ADDED event (with RLT coordinates)
   *
   * @param position The position of the new waypoint (in RLT coordinates)
   * @param properties Optional properties for the waypoint
   * @returns The index of the newly added waypoint
   * @throws Error if mission is not in PLANNING state
   * @public
   */
  public addWaypoint(
    position: IPosition,
    properties?: Partial<WaypointData>
  ): number {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be added in PLANNING state');
    }

    // Create waypoint data with RLT coordinates
    const waypointData: WaypointData = {
      position: { ...position }, // Store in RLT coordinates
      orientation: properties?.orientation
        ? { ...properties.orientation }
        : undefined, // Will be computed after waypoint is added to array
      properties: properties?.properties
        ? { ...properties.properties }
        : undefined,
      followRouteAltitude: properties?.followRouteAltitude ?? true, // Default to true
      deviceYawAction: properties?.deviceYawAction
        ? { ...properties.deviceYawAction }
        : undefined,
      approachSettings: properties?.approachSettings
        ? { ...properties.approachSettings }
        : {
            followRoute: true,
            nextWaypointApproachMode: this._mapRouteSettingToApproachMode(
              this._routeDeviceYawMode
            ),
          }, // Default approach settings
    };

    // Add waypoint data to array (stored in RLT)
    this._waypointsData.push(waypointData);
    const newIndex = this._waypointsData.length - 1;

    // Note: Orientation is computed at runtime and not stored in waypoint data
    // This ensures clean separation between waypoint position data and computed orientation

    this._debugService.log(`Added waypoint ${newIndex}`, {
      position: waypointData.position,
      routeMode: this._routeDeviceYawMode,
    });

    // Convert to HAE coordinates for map marker creation
    const haePosition = this._convertRLTtoHAE(waypointData.position);

    this._debugService.log(`Adding waypoint ${newIndex}`, {
      rltPosition: waypointData.position,
      haePosition: haePosition,
    });

    // Create waypoint marker with HAE coordinates
    this._markerService.createWaypointMarker(this.id, haePosition, newIndex);

    // Update mission path (will convert RLT to HAE internally)
    this._updateMissionPath();

    // Select the new waypoint
    this.selectWaypoint(newIndex);

    // Automatically enter edit mode for the newly added waypoint
    this.enterEditMode();

    // Invalidate distance cache and emit distance change event
    this._invalidateDistanceCache();
    this._emitDistanceChangedEvent();

    // Emit waypoint added event with RLT coordinates
    this._eventService.emitEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, {
      waypointIndex: newIndex,
      waypointData: { ...waypointData }, // RLT coordinates
    });

    return newIndex;
  }

  /**
   * Inserts a waypoint at a specific index in the mission plan.
   *
   * Implementation details:
   * - Accepts RLT coordinates as input (user-provided)
   * - Stores waypoint data internally in RLT coordinates
   * - Converts to HAE coordinates for map entity creation
   * - Validates the mission is in PLANNING state
   * - Validates the index is within allowed bounds
   * - Creates a deep copy of the waypoint data
   * - Inserts the waypoint marker via MarkerService (using HAE coordinates)
   * - Updates selection and editing indices if affected
   * - Updates the mission path visualization
   * - Selects the new waypoint
   * - Emits WAYPOINT_ADDED event (with RLT coordinates)
   *
   * @param index The index to insert the waypoint at
   * @param position The position of the new waypoint (in RLT coordinates)
   * @param properties Optional properties for the waypoint
   * @returns The index of the newly inserted waypoint
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   * @public
   */
  public insertWaypoint(
    index: number,
    position: IPosition,
    properties?: Partial<WaypointData>
  ): number {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be inserted in PLANNING state');
    }

    if (index < 0 || index > this._waypointsData.length) {
      throw new Error(`Invalid insertion index: ${index}`);
    }

    // Create waypoint data with RLT coordinates
    const waypointData: WaypointData = {
      position: { ...position }, // Store in RLT coordinates
      orientation: properties?.orientation
        ? { ...properties.orientation }
        : undefined,
      properties: properties?.properties
        ? { ...properties.properties }
        : undefined,
      followRouteAltitude: properties?.followRouteAltitude ?? true, // Default to true
      deviceYawAction: properties?.deviceYawAction
        ? { ...properties.deviceYawAction }
        : undefined,
      approachSettings: properties?.approachSettings
        ? { ...properties.approachSettings }
        : {
            followRoute: true,
            nextWaypointApproachMode: this._mapRouteSettingToApproachMode(
              this._routeDeviceYawMode
            ),
          }, // Default approach settings
    };

    // Insert waypoint data at specified index (stored in RLT)
    this._waypointsData.splice(index, 0, waypointData);

    // Note: Orientation is computed at runtime and not stored in waypoint data
    // This ensures clean separation between waypoint position data and computed orientation

    this._debugService.log(`Inserted waypoint at index ${index}`, {
      position: waypointData.position,
      routeMode: this._routeDeviceYawMode,
    });

    // Convert to HAE coordinates for map marker creation
    const haePosition = this._convertRLTtoHAE(waypointData.position);

    this._debugService.log(`Inserting waypoint at index ${index}`, {
      rltPosition: waypointData.position,
      haePosition: haePosition,
    });

    // Create waypoint marker with HAE coordinates
    this._markerService.insertWaypointMarker(this.id, haePosition, index);

    // Update selection and editing indices if affected
    if (this._stateService.selectedWaypointIndex >= index) {
      this._stateService.selectedWaypointIndex++;
    }

    if (this._stateService.editingWaypointIndex >= index) {
      this._stateService.editingWaypointIndex++;
    }

    // Keep multi-selected overlay indices consistent after insertion
    this._shiftMultiSelectedAfterInsertion(index);

    // Note: Orientation recomputation is handled at runtime
    // No need to store computed orientations in waypoint data
    this._debugService.log(
      `Waypoint inserted. Orientations will be computed at runtime for route mode: ${this._routeDeviceYawMode}`
    );

    // Update mission path (will convert RLT to HAE internally)
    this._updateMissionPath();

    // Select the new waypoint
    this.selectWaypoint(index);

    // Marker renumbering during insert resets marker images back to NORMAL.
    // Re-apply selection/edit/multi-select visuals.
    this._reapplySelectionOverlays();

    // Invalidate distance cache and emit distance change event
    this._invalidateDistanceCache();
    this._emitDistanceChangedEvent();

    // Emit waypoint added event with RLT coordinates
    this._eventService.emitEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, {
      waypointIndex: index,
      waypointData: { ...waypointData }, // RLT coordinates
    });

    return index;
  }

  public addWaypointBefore(waypointIndex: number): number {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be inserted in PLANNING state');
    }

    // Strict rule: "before" inserts only between two existing waypoints.
    // - Requires at least 2 waypoints
    // - Cannot insert before the first waypoint (index 0)
    if (this._waypointsData.length <= 1) {
      throw new Error(
        'Cannot insert waypoint before: at least 2 waypoints are required'
      );
    }

    if (waypointIndex < 1 || waypointIndex >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${waypointIndex}`);
    }

    const current = this._waypointsData[waypointIndex]?.position;
    if (!current) {
      throw new Error(`Waypoint not found at index: ${waypointIndex}`);
    }

    // Previous waypoint must exist due to the index constraint above.
    const prev = this._waypointsData[waypointIndex - 1]?.position;

    if (!prev) {
      throw new Error(
        `Previous waypoint not found at index: ${waypointIndex - 1}`
      );
    }

    const midpoint = calculateMidpoint(prev, current);
    return this.insertWaypoint(waypointIndex, midpoint);
  }

  public addWaypointAfter(waypointIndex: number): number {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be inserted in PLANNING state');
    }

    // Strict rule: "after" inserts only between two existing waypoints.
    // - Requires at least 2 waypoints
    // - Cannot insert after the last waypoint
    if (this._waypointsData.length <= 1) {
      throw new Error(
        'Cannot insert waypoint after: at least 2 waypoints are required'
      );
    }

    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length - 1) {
      throw new Error(`Invalid waypoint index: ${waypointIndex}`);
    }

    const current = this._waypointsData[waypointIndex]?.position;
    if (!current) {
      throw new Error(`Waypoint not found at index: ${waypointIndex}`);
    }

    const insertIndex = waypointIndex + 1;

    const next = this._waypointsData[waypointIndex + 1]?.position;
    if (!next) {
      throw new Error(`Next waypoint not found at index: ${waypointIndex + 1}`);
    }

    const midpoint = calculateMidpoint(current, next);
    return this.insertWaypoint(insertIndex, midpoint);
  }

  /**
   * Removes a waypoint by index from the mission plan.
   *
   * Implementation details:
   * - Validates the mission is in PLANNING state
   * - Validates the index is within bounds
   * - Stores a copy of the removed waypoint for event data
   * - Exits edit mode if removing the waypoint being edited
   * - Removes the waypoint marker via MarkerService
   * - Updates selection and editing indices if affected
   * - Updates the mission path visualization
   * - Emits WAYPOINT_REMOVED event
   *
   * @param index The index of the waypoint to remove
   * @returns True if the waypoint was removed, false otherwise
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   * @public
   */
  public removeWaypoint(index: number): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be removed in PLANNING state');
    }

    if (index < 0 || index >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${index}`);
    }

    // Store waypoint data for event
    const removedWaypoint = { ...this._waypointsData[index] };

    // Exit edit mode if removing the waypoint being edited
    if (this._stateService.editingWaypointIndex === index) {
      this.exitEditMode();
    }

    // If the waypoint is currently selected, clear keyboard focus BEFORE removing the marker.
    if (this._stateService.selectedWaypointIndex === index) {
      const marker = this._markerService.waypointMarkers[index];
      marker?.setKeyboardFocus(false);
    }

    // Remove waypoint data
    this._waypointsData.splice(index, 1);

    // Remove waypoint marker
    this._markerService.removeWaypointMarker(this.id, index);

    // Keep multi-selected overlay indices consistent after removal
    this._shiftMultiSelectedAfterRemoval(index);

    // Update selection indices
    if (this._stateService.editingWaypointIndex === index) {
      this._stateService.editingWaypointIndex = -1;
    } else if (this._stateService.editingWaypointIndex > index) {
      this._stateService.editingWaypointIndex--;
    }

    if (this._stateService.selectedWaypointIndex === index) {
      // Select previous waypoint or 0th waypoint (if any left).
      // IMPORTANT: Use `selectWaypoint` so the newly selected waypoint is also put into edit mode
      // (consistent with normal selection UX) and the frontend receives WAYPOINT_SELECTED.
      const newIndex =
        index > 0 ? index - 1 : this._waypointsData.length > 0 ? 0 : -1;

      if (newIndex >= 0) {
        this.selectWaypoint(newIndex);
      } else {
        this._stateService.selectedWaypointIndex = -1;
      }
    } else if (this._stateService.selectedWaypointIndex > index) {
      this._stateService.selectedWaypointIndex--;
    }

    // Note: Orientation recomputation is handled at runtime
    // No need to store computed orientations in waypoint data after removal
    this._debugService.log(
      `Waypoint removed. Orientations will be computed at runtime for route mode: ${this._routeDeviceYawMode}`
    );

    // Update editing waypoint orientation if one is being edited
    if (this._stateService.editingWaypointIndex !== -1) {
      this._debugService.log(
        `Updating orientation for editing waypoint ${this._stateService.editingWaypointIndex} after waypoint removal`
      );
      this._recomputeEditingWaypointOrientation();
    }

    // Update mission path
    this._updateMissionPath();

    // Marker renumbering during remove resets marker images back to NORMAL.
    // Re-apply selection/edit/multi-select visuals.
    this._reapplySelectionOverlays();

    // Invalidate distance cache and emit distance change event
    this._invalidateDistanceCache();
    this._emitDistanceChangedEvent();

    // Emit waypoint removed event
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_REMOVED,
      {
        waypointIndex: index,
        waypointData: removedWaypoint,
      }
    );

    return true;
  }

  /**
   * Updates a waypoint's position and/or properties in the mission plan.
   *
   * Implementation details:
   * - Accepts RLT coordinates as input for position updates
   * - Stores waypoint data internally in RLT coordinates
   * - Converts to HAE coordinates for map entity updates
   * - Validates the mission is in PLANNING state
   * - Validates the index is within bounds
   * - Selectively updates only the properties that are provided
   * - Updates waypoint marker position if position changed (using HAE coordinates)
   * - Updates orientation model if the waypoint is in edit mode
   * - Updates the mission path visualization if position changed
   * - Emits WAYPOINT_UPDATED event (with RLT coordinates)
   *
   * @param index The index of the waypoint to update
   * @param properties The properties to update (position in RLT coordinates, only specified properties will be changed)
   * @returns True if the waypoint was updated, false otherwise
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   * @public
   */
  public updateWaypoint(
    index: number,
    properties: Partial<WaypointData>
  ): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be updated in PLANNING state');
    }

    if (index < 0 || index >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${index}`);
    }

    const waypoint = this._waypointsData[index];
    const positionChanged = properties.position !== undefined;
    const orientationChanged = properties.orientation !== undefined;

    // Update position if provided (store in RLT, convert to HAE for map)
    if (positionChanged && properties.position) {
      // Store position in RLT coordinates
      waypoint.position = { ...properties.position };

      // Convert to HAE coordinates for map marker update
      const haePosition = this._convertRLTtoHAE(waypoint.position);

      this._debugService.log(`Updating waypoint ${index} position`, {
        rltPosition: waypoint.position,
        haePosition: haePosition,
      });

      const markers = this._markerService.waypointMarkers;
      if (index < markers.length) {
        markers[index].updatePosition(haePosition);
      }

      // Update orientation model position if this waypoint is being edited
      if (
        this._stateService.editingWaypointIndex === index &&
        this._markerService.orientationModel
      ) {
        this._debugService.log(
          'Updating orientation model position for edited waypoint',
          {
            rltPosition: waypoint.position,
            haePosition: haePosition,
          }
        );

        // NEW: Recompute orientation when position changes for editing waypoint
        this._recomputeEditingWaypointOrientation();
      }
    }

    // Update orientation if provided (maintained for backward compatibility)
    if (orientationChanged) {
      waypoint.orientation = properties.orientation
        ? { ...properties.orientation }
        : undefined;

      // Update orientation model if this waypoint is being edited
      // Note: We use computed orientation if available, otherwise fall back to stored orientation
      if (
        this._stateService.editingWaypointIndex === index &&
        this._markerService.orientationModel
      ) {
        const orientationToUse =
          this._currentEditingOrientation || waypoint.orientation;

        // Convert position to HAE for orientation model update
        const haePosition = this._convertRLTtoHAE(waypoint.position);

        this._debugService.log('Updating orientation model with orientation', {
          rltPosition: waypoint.position,
          haePosition: haePosition,
          orientation: orientationToUse,
          usingComputed: !!this._currentEditingOrientation,
        });

        this._markerService.updateOrientationModel(
          haePosition,
          orientationToUse
        );
      }
    }

    // Update additional properties if provided
    if (properties.properties !== undefined) {
      waypoint.properties = { ...properties.properties };
    }

    // Update mission path if position changed (will convert RLT to HAE internally)
    if (positionChanged) {
      // Note: Orientation computation is handled at runtime
      // No need to store computed orientations in waypoint data after position update
      this._debugService.log(
        `Waypoint ${index} position updated. Orientations will be computed at runtime for route mode: ${this._routeDeviceYawMode}`
      );

      this._updateMissionPath();

      // Note: Orientation updates for editing waypoints are now handled by global pointer up events
      // This ensures orientation is updated regardless of how the position change occurred

      // Invalidate distance cache and emit distance change event for position changes
      this._invalidateDistanceCache();
      this._emitDistanceChangedEvent();
    }

    return true;
  }

  // ------------------------------------------------------------
  // Selection and Editing Methods Implementation
  // ------------------------------------------------------------

  /**
   * Compute the visual state of a waypoint marker, given:
   * - Editing waypoint (highest priority)
   * - Single selected waypoint
   * - Multi-selected overlay
   *
   * NOTE: This must never mutate business state (selected/editing indices).
   */
  private _getWaypointVisualState(index: number): WaypointState {
    if (this._multiWaypointEditModeEnabled) {
      return this._multiSelectedWaypointIndices.has(index)
        ? WaypointState.SELECTED
        : WaypointState.NORMAL;
    }

    if (this._stateService.editingWaypointIndex === index) {
      return WaypointState.EDITING;
    }
    if (this._stateService.selectedWaypointIndex === index) {
      return WaypointState.SELECTED;
    }
    if (this._multiSelectedWaypointIndices.has(index)) {
      return WaypointState.SELECTED;
    }
    return WaypointState.NORMAL;
  }

  private _applyWaypointVisualState(index: number): void {
    if (index < 0 || index >= this._waypointsData.length) return;
    this._markerService.updateWaypointState(
      index,
      this._getWaypointVisualState(index)
    );
  }

  /**
   * Re-applies marker visuals for any indices that may have been reset to NORMAL
   * by marker renumbering/recreation (insert/remove/reorder).
   */
  private _reapplySelectionOverlays(): void {
    // Apply editing + selected first (higher priority)
    if (this._stateService.editingWaypointIndex !== -1) {
      this._applyWaypointVisualState(this._stateService.editingWaypointIndex);
    }
    if (this._stateService.selectedWaypointIndex !== -1) {
      this._applyWaypointVisualState(this._stateService.selectedWaypointIndex);
    }
    // Apply overlay for all multi-selected indices
    this._multiSelectedWaypointIndices.forEach((idx) => {
      this._applyWaypointVisualState(idx);
    });
  }

  private _shiftMultiSelectedAfterInsertion(atIndex: number): void {
    if (this._multiSelectedWaypointIndices.size === 0) return;
    const next = new Set<number>();
    this._multiSelectedWaypointIndices.forEach((idx) => {
      next.add(idx >= atIndex ? idx + 1 : idx);
    });
    this._multiSelectedWaypointIndices = next;
  }

  private _shiftMultiSelectedAfterRemoval(atIndex: number): void {
    if (this._multiSelectedWaypointIndices.size === 0) return;
    const next = new Set<number>();
    this._multiSelectedWaypointIndices.forEach((idx) => {
      if (idx === atIndex) return; // removed
      next.add(idx > atIndex ? idx - 1 : idx);
    });
    this._multiSelectedWaypointIndices = next;
  }

  private _reindexMultiSelectedForReorder(
    fromIndex: number,
    toIndex: number
  ): void {
    if (this._multiSelectedWaypointIndices.size === 0) return;
    const next = new Set<number>();
    this._multiSelectedWaypointIndices.forEach((idx) => {
      if (idx === fromIndex) {
        next.add(toIndex);
        return;
      }
      if (fromIndex < toIndex) {
        // Items between (fromIndex, toIndex] shift left by 1
        if (idx > fromIndex && idx <= toIndex) {
          next.add(idx - 1);
          return;
        }
      } else {
        // Items between [toIndex, fromIndex) shift right by 1
        if (idx >= toIndex && idx < fromIndex) {
          next.add(idx + 1);
          return;
        }
      }
      next.add(idx);
    });
    this._multiSelectedWaypointIndices = next;
  }

  /**
   * Selects a waypoint by index in the mission plan.
   *
   * Implementation details:
   * - Validates the index is within bounds
   * - Skips unnecessary updates if already selected
   * - Exits edit mode if active
   * - Updates previous selection state via MarkerService
   * - Updates the selected waypoint state via StateService and MarkerService
   * - Emits WAYPOINT_SELECTED event
   *
   * @param index The index of the waypoint to select
   * @returns True if the waypoint was selected, false otherwise
   * @throws Error if index is out of bounds
   * @public
   */
  public selectWaypoint(index: number): boolean {
    if (index < 0 || index >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${index}`);
    }

    // If already selected, do nothing
    if (this._stateService.selectedWaypointIndex === index) {
      return true;
    }

    // Exit edit mode if active
    if (this._stateService.editingWaypointIndex !== -1) {
      this.exitEditMode();
    }

    // Capture previous selection BEFORE changing it
    const prevIndex = this._stateService.selectedWaypointIndex;

    // Set new selection FIRST so that the previous index no longer has "selected" priority
    this._stateService.selectedWaypointIndex = index;

    // Update previous selection visuals (may still be multi-selected)
    if (prevIndex !== -1) {
      this._applyWaypointVisualState(prevIndex);
    }

    // Update new selection visuals
    this._applyWaypointVisualState(index);

    // Sync Cesium keyboard focus to selected waypoint
    this._syncKeyboardFocus(prevIndex, index);

    // Emit waypoint selected event
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_SELECTED,
      {
        waypointIndex: index,
        waypointData: { ...this._waypointsData[index] },
      }
    );

    //TODO: Need to be removed after the keyboard navigation is implemented
    this.enterEditMode();

    return true;
  }

  // ------------------------------------------------------------
  // Multi-select overlay (visual only)
  // ------------------------------------------------------------

  public setMultiSelectedWaypoints(indices: number[]): void {
    const next = new Set<number>();

    // Sanitize input: unique, finite integers, in range
    for (const raw of indices ?? []) {
      const idx = Number(raw);
      if (!Number.isFinite(idx)) continue;
      const intIdx = Math.trunc(idx);
      if (intIdx < 0 || intIdx >= this._waypointsData.length) continue;
      next.add(intIdx);
    }

    // Compute symmetric diff to update only affected markers
    const changed: number[] = [];
    this._multiSelectedWaypointIndices.forEach((idx) => {
      if (!next.has(idx)) changed.push(idx);
    });
    next.forEach((idx) => {
      if (!this._multiSelectedWaypointIndices.has(idx)) changed.push(idx);
    });

    this._multiSelectedWaypointIndices = next;

    // Update visuals for changed indices (do not emit events, do not pan)
    changed.forEach((idx) => this._applyWaypointVisualState(idx));
  }

  public clearMultiSelectedWaypoints(): void {
    if (this._multiSelectedWaypointIndices.size === 0) return;
    const toUpdate = Array.from(this._multiSelectedWaypointIndices);
    this._multiSelectedWaypointIndices.clear();
    toUpdate.forEach((idx) => this._applyWaypointVisualState(idx));
  }

  public getMultiSelectedWaypoints(): number[] {
    return Array.from(this._multiSelectedWaypointIndices).sort((a, b) => a - b);
  }

  public setMultiWaypointEditMode(enabled: boolean): void {
    const next = Boolean(enabled);
    if (this._multiWaypointEditModeEnabled === next) return;
    this._multiWaypointEditModeEnabled = next;

    // Multi-select overlay is visual-only; suppress single-waypoint keyboard focus while enabled.
    // When disabling, restore focus to the waypoint that is actually being edited (preferred), otherwise selected.
    const selectedIndex = this._stateService.selectedWaypointIndex;
    const editingIndex = this._stateService.editingWaypointIndex;
    const focusIndex = editingIndex !== -1 ? editingIndex : selectedIndex;

    if (next) {
      if (focusIndex !== -1) {
        this._syncKeyboardFocus(focusIndex, -1);
      }
    } else {
      if (focusIndex !== -1) {
        this._syncKeyboardFocus(-1, focusIndex);
      }
    }

    // Hide orientation model when entering multi-waypoint edit mode (visual only)
    const orientationModel = this._markerService.orientationModel;
    if (orientationModel) {
      orientationModel.setVisibility(
        !next && this._stateService.editingWaypointIndex !== -1
      );
    }

    // Recompute marker visuals under the new mode
    this._reapplySelectionOverlays();

    // If we just disabled multi-waypoint edit mode and an editing waypoint exists,
    // ensure the orientation model is up to date and visible again.
    if (
      !next &&
      this._stateService.editingWaypointIndex !== -1 &&
      this._referencePoint
    ) {
      const editIndex = this._stateService.editingWaypointIndex;
      const runtimeOrientation = this.computeWaypointOrientation(editIndex);
      this._currentEditingOrientation = runtimeOrientation;

      const haePosition = this._convertRLTtoHAE(
        this._waypointsData[editIndex].position
      );

      this._markerService.ensureOrientationModel(
        this.id,
        {
          position: haePosition,
          properties: this._waypointsData[editIndex].properties,
        } as WaypointData,
        runtimeOrientation
      );
    }
  }

  public getMultiWaypointEditMode(): boolean {
    return this._multiWaypointEditModeEnabled;
  }

  public setUserInteractionsEnabled(enabled: boolean): void {
    const next = Boolean(enabled);
    if (this._userInteractionsEnabled === next) return;
    this._userInteractionsEnabled = next;

    // Disable marker click/drag at the source (map click is guarded separately)
    this._markerService.setInteractionsEnabled(next);

    // If we just re-enabled interactions, restore focus to the active waypoint (editing preferred).
    if (next && !this._multiWaypointEditModeEnabled) {
      const editingIndex = this._stateService.editingWaypointIndex;
      const selectedIndex = this._stateService.selectedWaypointIndex;
      const focusIndex = editingIndex !== -1 ? editingIndex : selectedIndex;
      if (focusIndex !== -1) {
        this._syncKeyboardFocus(-1, focusIndex);
      }
    }
  }

  public getUserInteractionsEnabled(): boolean {
    return this._userInteractionsEnabled;
  }

  /**
   * Puts the currently selected waypoint into edit mode.
   *
   * Implementation details:
   * - Validates the mission is in PLANNING state
   * - Checks that a waypoint is selected
   * - Skips redundant operations if the waypoint is already in edit mode
   * - Updates waypoint state to EDITING via MarkerService
   * - Creates or updates orientation model to allow orientation editing
   * - Emits WAYPOINT_EDIT_STARTED event
   *
   * @returns True if the waypoint was put into edit mode, false if no waypoint is selected
   * @throws Error if mission is not in PLANNING state
   * @public
   */
  public enterEditMode(): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Edit mode can only be entered in PLANNING state');
    }

    if (this._stateService.selectedWaypointIndex === -1) {
      return false; // No waypoint selected
    }

    // If already in edit mode, do nothing
    if (
      this._stateService.editingWaypointIndex ===
      this._stateService.selectedWaypointIndex
    ) {
      return true;
    }

    // Set editing index to selected index
    const editIndex = this._stateService.selectedWaypointIndex;
    this._stateService.editingWaypointIndex = editIndex;

    // Ensure keyboard focus remains on the editing waypoint (in case edit mode is entered programmatically).
    this._syncKeyboardFocus(-1, editIndex);

    // Update waypoint state to EDITING - this ensures the waypoint marker
    // remains visible with the appropriate editing style
    this._markerService.updateWaypointState(editIndex, WaypointState.EDITING);

    // Create or update orientation model with computed orientation
    if (this._referencePoint) {
      // Compute orientation at runtime for editing waypoint
      const runtimeOrientation = this.computeWaypointOrientation(editIndex);

      this._currentEditingOrientation = runtimeOrientation;

      // Convert waypoint position to HAE for orientation model
      const haePosition = this._convertRLTtoHAE(
        this._waypointsData[editIndex].position
      );

      // Create/update the orientation model with runtime-computed orientation
      // Pass computed orientation explicitly instead of expecting it in waypoint data
      this._markerService.ensureOrientationModel(
        this.id,
        {
          position: haePosition, // Use HAE coordinates for map positioning
          properties: this._waypointsData[editIndex].properties,
          // No orientation in waypoint data - passed separately
        } as WaypointData,
        runtimeOrientation
      ); // Pass computed orientation explicitly

      // UPDATED: Force the waypoint marker to be visible, with a small delay to ensure
      // it happens after all rendering updates from the orientation model
      const markers = this._markerService.waypointMarkers;
      if (editIndex < markers.length) {
        markers[editIndex].setVisibility(true);
        this._debugService.log(
          `Explicitly set visibility for waypoint ${editIndex} marker`
        );
      }
    }

    // Emit waypoint edit started event
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_EDIT_STARTED,
      {
        waypointIndex: editIndex,
        waypointData: { ...this._waypointsData[editIndex] },
      }
    );

    return true;
  }

  /**
   * Exits edit mode for the currently editing waypoint.
   *
   * Implementation details:
   * - Checks if a waypoint is in edit mode
   * - Updates waypoint state to SELECTED via MarkerService
   * - Hides the orientation model
   * - Emits WAYPOINT_EDIT_ENDED event
   * - Clears the editing index in StateService
   *
   * @returns True if edit mode was exited, false if no waypoint was in edit mode
   * @public
   */
  public exitEditMode(): boolean {
    const editIndex = this._stateService.editingWaypointIndex;
    if (editIndex === -1) {
      return false; // Not in edit mode
    }

    // Hide orientation model
    const orientationModel = this._markerService.orientationModel;
    if (orientationModel) {
      orientationModel.setVisibility(false);
    }

    // Emit waypoint edit ended event before clearing the index
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_EDIT_ENDED,
      {
        waypointIndex: editIndex,
        waypointData: { ...this._waypointsData[editIndex] },
      }
    );

    // Clear editing index
    this._stateService.editingWaypointIndex = -1;

    // Clear computed orientation when exiting edit mode
    this._currentEditingOrientation = null;

    // Restore waypoint marker visuals based on current selection + multi-select overlay
    this._applyWaypointVisualState(editIndex);

    return true;
  }

  /**
   * Updates whether a waypoint should follow route altitude settings.
   * When changed from false to true, updates the waypoint altitude to match current route settings.
   * This is a form-driven action, so no events are emitted.
   *
   * @param index The index of the waypoint to update
   * @param followRoute Whether the waypoint should follow route altitude settings
   * @returns Promise<boolean> True if the setting was updated successfully
   */
  public async updateWaypointFollowRoute(
    index: number,
    followRoute: boolean
  ): Promise<boolean> {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error(
        'Waypoint follow route setting can only be updated in PLANNING state'
      );
    }

    if (index < 0 || index >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${index}`);
    }

    const waypoint = this._waypointsData[index];
    const previousFollowRoute = waypoint.followRouteAltitude !== false;

    // Update the setting
    waypoint.followRouteAltitude = followRoute;

    this._debugService.log('Updated waypoint follow route setting', {
      index,
      previousFollowRoute,
      newFollowRoute: followRoute,
    });

    // If changed from false to true, update altitude to match current route settings
    if (!previousFollowRoute && followRoute) {
      await this._updateWaypointToFollowRouteSettings(index);
    }

    // NO EVENT EMISSION - This is a form-driven change
    // The form controls this setting and doesn't need to be notified

    return true;
  }

  /**
   * Updates a single waypoint's altitude to match current route altitude settings.
   * Used when a waypoint is changed from independent to following route settings.
   * No events emitted as this is part of a form-driven operation.
   *
   * @param index The index of the waypoint to update
   * @private
   */
  private async _updateWaypointToFollowRouteSettings(
    index: number
  ): Promise<void> {
    const waypoint = this._waypointsData[index];
    const currentHAEPosition = this._convertRLTtoHAE(waypoint.position);

    // Calculate new altitude based on current route settings
    const newHAEAltitude = await this._calculateWaypointHAEAltitude(
      currentHAEPosition
    );
    waypoint.position.altitude =
      newHAEAltitude - (this._referenceAltitudeHAE || 0);

    // Update visual marker
    const markers = this._markerService.waypointMarkers;
    if (index < markers.length) {
      const haePosition = this._convertRLTtoHAE(waypoint.position);
      markers[index].updatePosition(haePosition);
    }

    // Update orientation model if this waypoint is in edit mode
    if (
      this._stateService.editingWaypointIndex === index &&
      this._markerService.orientationModel
    ) {
      const haePosition = this._convertRLTtoHAE(waypoint.position);
      // Compute orientation at runtime instead of using stored orientation
      const runtimeOrientation = this.computeWaypointOrientation(index);
      this._markerService.updateOrientationModel(
        haePosition,
        runtimeOrientation
      );
    }

    // Update mission path as waypoint position changed
    this._updateMissionPath();

    this._debugService.log(
      `Updated waypoint ${index} altitude to follow route settings`,
      {
        rltPosition: waypoint.position,
        haePosition: this._convertRLTtoHAE(waypoint.position),
      }
    );
  }

  // ------------------------------------------------------------
  // Mission Management Methods Implementation
  // ------------------------------------------------------------

  /**
   * Reorders a waypoint to a new position in the sequence.
   *
   * Implementation details:
   * - Validates the mission is in PLANNING state
   * - Validates both indices are within bounds
   * - Skips unnecessary operations if indices are the same
   * - Moves waypoint data in the internal array
   * - Recreates all waypoint markers to reflect the new order
   * - Updates selection and editing indices if affected
   * - Updates orientation model position if necessary
   * - Updates the mission path visualization
   * - Emits WAYPOINT_UPDATED event
   *
   * @param fromIndex The current index of the waypoint
   * @param toIndex The target index for the waypoint
   * @returns True if the waypoint was reordered, false otherwise
   * @throws Error if either index is out of bounds or mission is not in PLANNING state
   * @public
   */
  public reorderWaypoint(fromIndex: number, toIndex: number): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error('Waypoints can only be reordered in PLANNING state');
    }

    if (
      fromIndex < 0 ||
      fromIndex >= this._waypointsData.length ||
      toIndex < 0 ||
      toIndex >= this._waypointsData.length
    ) {
      throw new Error(
        `Invalid index: fromIndex=${fromIndex}, toIndex=${toIndex}`
      );
    }

    if (fromIndex === toIndex) {
      return true; // No change needed
    }

    // Move waypoint data
    const waypointData = this._waypointsData[fromIndex];
    this._waypointsData.splice(fromIndex, 1);
    this._waypointsData.splice(toIndex, 0, waypointData);

    // Keep multi-selected overlay indices consistent after reordering
    this._reindexMultiSelectedForReorder(fromIndex, toIndex);

    // Since we're manually handling the reordering, we need to delete and recreate
    // the waypoint markers in their new order
    const markers = this._markerService.waypointMarkers;

    // Create a copy of the markers array
    const markersCopy = [...markers];

    // Remove all markers
    for (let i = 0; i < markersCopy.length; i++) {
      this._markerService.removeWaypointMarker(this.id, 0); // Always remove at index 0
    }

    // Recreate markers in the new order
    for (let i = 0; i < this._waypointsData.length; i++) {
      const haePosition = this._convertRLTtoHAE(
        this._waypointsData[i].position
      );
      this._markerService.createWaypointMarker(this.id, haePosition, i);
    }

    // Update selection and editing indices
    if (this._stateService.selectedWaypointIndex === fromIndex) {
      this._stateService.selectedWaypointIndex = toIndex;
      this._markerService.updateWaypointState(toIndex, WaypointState.SELECTED);
    } else if (
      this._stateService.selectedWaypointIndex > fromIndex &&
      this._stateService.selectedWaypointIndex <= toIndex
    ) {
      this._stateService.selectedWaypointIndex--;
    } else if (
      this._stateService.selectedWaypointIndex < fromIndex &&
      this._stateService.selectedWaypointIndex >= toIndex
    ) {
      this._stateService.selectedWaypointIndex++;
    }

    if (this._stateService.editingWaypointIndex === fromIndex) {
      this._stateService.editingWaypointIndex = toIndex;
      this._markerService.updateWaypointState(toIndex, WaypointState.EDITING);

      // Update orientation model position if exists
      const waypoint = this._waypointsData[toIndex];
      // Compute orientation at runtime instead of using stored orientation
      const runtimeOrientation = this.computeWaypointOrientation(toIndex);
      const haePosition = this._convertRLTtoHAE(waypoint.position);
      this._markerService.updateOrientationModel(
        haePosition,
        runtimeOrientation
      );
    } else if (
      this._stateService.editingWaypointIndex > fromIndex &&
      this._stateService.editingWaypointIndex <= toIndex
    ) {
      this._stateService.editingWaypointIndex--;
    } else if (
      this._stateService.editingWaypointIndex < fromIndex &&
      this._stateService.editingWaypointIndex >= toIndex
    ) {
      this._stateService.editingWaypointIndex++;
    }

    // Note: Orientation computation is handled at runtime
    // No need to store computed orientations in waypoint data after reordering
    this._debugService.log(
      `Waypoints reordered. Orientations will be computed at runtime for route mode: ${this._routeDeviceYawMode}`
    );

    // Update mission path
    this._updateMissionPath();

    // Markers were recreated above (defaulting to NORMAL). Re-apply selection/edit/multi-select visuals.
    this._reapplySelectionOverlays();

    // Restore keyboard focus to the active waypoint after marker recreation.
    // Prefer the editing waypoint (if any), otherwise the selected waypoint.
    if (!this._multiWaypointEditModeEnabled) {
      const editingIndex = this._stateService.editingWaypointIndex;
      const selectedIndex = this._stateService.selectedWaypointIndex;
      const focusIndex = editingIndex !== -1 ? editingIndex : selectedIndex;
      if (focusIndex !== -1) {
        this._syncKeyboardFocus(-1, focusIndex);
      }
    }

    // Invalidate distance cache and emit distance change event
    this._invalidateDistanceCache();
    this._emitDistanceChangedEvent();

    // Emit waypoint reordered event (for clients to keep their ordered list in sync)
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_REORDERED,
      {
        fromWaypointIndex: fromIndex,
        toWaypointIndex: toIndex,
        waypointIndex: toIndex,
        waypointData: { ...waypointData },
      }
    );

    return true;
  }

  /**
   * Sets the visibility of the mission plan on the map.
   *
   * Implementation details:
   * - Skips unnecessary updates if visibility is unchanged
   * - Updates all visual entities' visibility via MarkerService
   * - Emits MISSION_VISIBILITY_CHANGED event
   *
   * @param visible Whether the mission plan should be visible
   * @public
   */
  public setVisibility(visible: boolean): void {
    if (this._isVisible === visible) {
      return; // No change
    }

    this._isVisible = visible;

    // Update visibility of all entities
    this._markerService.setVisibility(visible);

    // Emit visibility changed event
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.MISSION_VISIBILITY_CHANGED,
      {
        eventType: LinearMissionPlannerEventType.MISSION_VISIBILITY_CHANGED,
      }
    );
  }

  /**
   * Set or update the takeoff mode for the mission.
   *
   * Implementation details:
   * - Validates the mission is in PLANNING state
   * - Updates the takeoff mode setting
   *
   * @param mode The takeoff mode to use (DIRECT_ASCENT or SAFE_TAKEOFF)
   * @throws Error if mission is not in PLANNING state
   * @public
   */
  public setTakeoffMode(mode: TakeoffMode): void {
    // if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
    //   throw new Error('Takeoff mode can only be updated in PLANNING state');
    // }

    this._takeoffMode = mode;

    // Update the mission path with the new takeoff mode
    this._updateMissionPath();

    // Emit an event to notify listeners that takeoff settings have changed
    // We reuse the WAYPOINT_UPDATED event type since there's no specific event for takeoff settings
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_UPDATED,
      {
        eventType: LinearMissionPlannerEventType.WAYPOINT_UPDATED,
        waypointIndex: -1, // -1 indicates this is not a specific waypoint update
      }
    );
  }

  /**
   * Set or update the safe takeoff altitude for the mission.
   * This setting is especially relevant when using SAFE_TAKEOFF mode.
   *
   * Implementation details:
   * - Validates the mission is in PLANNING state
   * - Validates the altitude is positive
   * - Updates the takeoff altitude setting
   *
   * @param altitude The safe takeoff altitude in meters
   * @throws Error if mission is not in PLANNING state or altitude is negative
   * @public
   */
  public setTakeoffAltitude(altitude: number): void {
    // if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
    //   throw new Error('Takeoff altitude can only be updated in PLANNING state');
    // }

    if (altitude < 0) {
      throw new Error('Takeoff altitude must be a positive number');
    }

    // Ensure the takeoff altitude is at least 2 meters
    if (altitude < 2) {
      console.warn(
        'Takeoff altitude was less than 2 meters. Setting to minimum safe value of 2 meters.'
      );
      altitude = 2;
    }

    this._takeoffAltitude = altitude;

    // Update the mission path with the new takeoff altitude
    this._updateMissionPath();

    // Emit an event to notify listeners that takeoff settings have changed
    // We reuse the WAYPOINT_UPDATED event type since there's no specific event for takeoff settings
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINT_UPDATED,
      {
        eventType: LinearMissionPlannerEventType.WAYPOINT_UPDATED,
        waypointIndex: -1, // -1 indicates this is not a specific waypoint update
      }
    );
  }

  /**
   * Completes the mission planning process and returns the final mission data.
   *
   * Implementation details:
   * - Validates the mission has required elements (reference point, min waypoints)
   * - Emits MISSION_VALIDATION_FAILED event if validation fails
   * - Exits edit mode if active
   * - Creates a deep copy of mission data to return (reference point in HAE, waypoints in RLT)
   * - Cleans up all visual entities
   * - Resets internal state
   *
   * @returns The completed mission data containing reference point (HAE) and waypoints (RLT)
   * @throws Error if mission is not in PLANNING state or has fewer than 2 waypoints
   * @public
   */
  public completeMission(): CompletedMissionData {
    // Validate mission
    const validationErrors = this._validateMission();
    if (validationErrors.length > 0) {
      this._eventService.emitEvent(
        LinearMissionPlannerEventType.MISSION_VALIDATION_FAILED,
        {
          validationErrors,
        }
      );
      throw new Error(
        `Mission validation failed: ${validationErrors.join(', ')}`
      );
    }

    // Exit edit mode if active
    if (this._stateService.editingWaypointIndex !== -1) {
      this.exitEditMode();
    }

    // Create completed mission data
    // Reference point in HAE coordinates (takeoff baseline), waypoints in RLT coordinates
    const missionData: CompletedMissionData = {
      referencePoint: this._convertRLTtoHAE(this._referencePoint as IPosition), // HAE coordinates (takeoff baseline)
      waypoints: this._waypointsData.map((wp) => ({ ...wp })), // RLT coordinates (relative to takeoff)
      takeoffMode: this._takeoffMode,
      takeoffAltitude: this._takeoffAltitude,
    };

    this._debugService.log(
      'Mission completed with reference point (HAE) and waypoints (RLT)',
      {
        referencePoint: missionData.referencePoint,
        waypointCount: missionData.waypoints.length,
        takeoffMode: missionData.takeoffMode,
        takeoffAltitude: missionData.takeoffAltitude,
        conversionContext: this._conversionContext,
      }
    );

    // Clean up event listeners and entities, reset state
    this._cleanupEventListeners();
    this._cleanup();

    return missionData;
  }

  /**
   * Cancels mission planning without saving.
   *
   * Implementation details:
   * - Cleans up all event listeners to prevent ghost behavior
   * - Cleans up all visual entities
   * - Resets internal state
   * - Emits MISSION_CANCELLED event
   *
   * @public
   */
  public cancelMission(): void {
    // FIRST: Clean up event listeners to prevent ghost behavior
    this._cleanupEventListeners();

    // THEN: Clean up entities and reset state
    this._cleanup();

    // FINALLY: Emit mission cancelled event
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.MISSION_CANCELLED,
      {
        eventType: LinearMissionPlannerEventType.MISSION_CANCELLED,
      }
    );
  }

  // ------------------------------------------------------------
  // Event Handling Methods Implementation
  // ------------------------------------------------------------

  /**
   * Registers an event handler for mission planning events.
   *
   * Implementation details:
   * - Delegates to EventService for registration handling
   *
   * @param eventType The type of event to listen for
   * @param callback The callback function to execute when the event occurs
   * @public
   */
  public onEvent(
    eventType: LinearMissionPlannerEventType,
    callback: (data: LinearMissionPlannerEventData) => void
  ): void {
    this._eventService.onEvent(eventType, callback);
  }

  /**
   * Unregisters an event handler.
   *
   * Implementation details:
   * - Delegates to EventService for unregistration handling
   *
   * @param eventType The type of event to stop listening for
   * @param callback The callback function to remove
   * @public
   */
  public offEvent(
    eventType: LinearMissionPlannerEventType,
    callback: (data: LinearMissionPlannerEventData) => void
  ): void {
    this._eventService.offEvent(eventType, callback);
  }

  /**
   * Pans the camera to a specific waypoint by waypoint number.
   *
   * Implementation details:
   * - Converts waypoint number (1-based) to waypoint index (0-based)
   * - Validates the waypoint number is within valid range
   * - Uses the waypoint marker's panTo method to pan to the waypoint
   * - Returns false if waypoint number is invalid or no waypoints exist
   *
   * @param waypointNumber The waypoint number (1-based) to pan to
   * @returns True if the operation was successful, false if waypoint number is invalid
   * @public
   */
  public panToWaypoint(waypointIndex: number): boolean {
    // Validate waypoint number
    if (waypointIndex < 0 || waypointIndex > this._waypointsData.length - 1) {
      this._debugService.log(
        `Invalid waypoint index: ${waypointIndex}. Valid index: 0-${
          this._waypointsData.length - 1
        }`
      );
      return false;
    }

    // Get the waypoint marker from the marker service
    const waypointMarkers = this._markerService.waypointMarkers;
    const waypointMarker = waypointMarkers[waypointIndex];
    if (!waypointMarker) {
      this._debugService.error(
        `Waypoint marker ${waypointIndex} is null or undefined`
      );
      return false;
    }

    try {
      waypointMarker.setViewTo();
      return true;
    } catch (error) {
      this._debugService.error(
        `Failed to pan to waypoint ${waypointIndex}:`,
        error
      );
      return false;
    }
  }

  /**
   * Pans the camera to the entire mission path.
   * This provides an overview of the complete mission route.
   * If no waypoints exist, pans to the reference marker instead.
   *
   * @returns True if the operation was successful, false if no mission elements exist
   *
   * @example
   * ```typescript
   * // Pan to show the entire mission
   * const success = missionPlanner.panToMission();
   * if (success) {
   *   console.log('Camera panned to mission overview');
   * } else {
   *   // No mission elements to pan to
   * }
   * ```
   */
  public panToMission(): boolean {
    // Check if we have waypoints
    if (this._waypointsData.length === 0) {
      this._debugService.log(
        'No waypoints exist, trying to pan to reference marker'
      );

      // Try to pan to reference marker if no waypoints
      if (!this._referencePoint) {
        this._debugService.log(
          'No reference point exists, cannot pan to mission'
        );
        return false;
      }

      // Get the reference marker from the marker service
      const referenceMarker = this._markerService.referenceMarker;
      if (!referenceMarker) {
        this._debugService.error('Reference marker is null or undefined');
        return false;
      }

      try {
        referenceMarker.panTo();
        return true;
      } catch (error) {
        this._debugService.error('Failed to pan to reference marker:', error);
        return false;
      }
    }

    // Get the mission path from the marker service
    const missionPath = this._markerService.missionPath;
    if (!missionPath) {
      this._debugService.error('Mission path is null or undefined');
      return false;
    }

    // Check if mission path has positions
    if (missionPath.positions.length === 0) {
      this._debugService.log(
        'Mission path has no positions, cannot pan to mission'
      );
      return false;
    }

    try {
      missionPath.panTo();
      return true;
    } catch (error) {
      this._debugService.error('Failed to pan to mission:', error);
      return false;
    }
  }

  /**
   * Cleans up all resources associated with this mission planner.
   *
   * Implementation details:
   * - Removes all event listeners
   * - Removes all visual entities from the map
   * - Resets internal state
   *
   * Note: This method reuses the same cleanup logic as cancelMission()
   * to ensure consistent cleanup behavior.
   *
   * @public
   */
  public dispose(): void {
    // Clean up global pointer up listener
    if (this._globalPointerUpCleanup) {
      this._globalPointerUpCleanup();
      this._globalPointerUpCleanup = null;
    }

    // Clean up event listeners to prevent ghost behavior
    this._cleanupEventListeners();

    // Clean up entities and reset state
    this._cleanup();
  }

  // ------------------------------------------------------------
  // Extended Position Support Methods (AGL, future ASL, etc.)
  // ------------------------------------------------------------

  /**
   * Gets all waypoints with extended position information including AGL altitudes.
   *
   * This method converts internal RLT waypoint positions to HAE coordinates,
   * then uses terrain sampling to calculate additional altitude formats (currently AGL).
   * Future extensions will include ASL (Above Sea Level) and other altitude references.
   *
   * @returns Promise resolving to array of waypoint data with extended position information
   * @throws Error if terrain sampling fails or no waypoints exist
   * @public
   */
  public async getWaypointsWithExtendedPosition(): Promise<
    WaypointDataWithExtendedPosition[]
  > {
    if (this._waypointsData.length === 0) {
      return [];
    }

    try {
      // Convert all RLT waypoint positions to HAE coordinates for terrain sampling
      const haePositions = this._waypointsData.map((waypoint) =>
        this._convertRLTtoHAE(waypoint.position)
      );

      this._debugService.log(
        'Calculating extended position data for all waypoints',
        {
          waypointCount: this._waypointsData.length,
          haePositions: haePositions,
        }
      );

      // Get terrain heights for all positions in batch
      const mapServices =
        this._compositeManager.mapProviderServices.mapServices;
      const groundElevations = await mapServices.getSampleTerrainHeights(
        haePositions
      );

      // Calculate extended position information for each waypoint
      const waypointsWithExtendedPosition: WaypointDataWithExtendedPosition[] =
        this._waypointsData.map((waypoint, index) => {
          const haeAltitude = haePositions[index].altitude || 0;
          const groundElevation = groundElevations[index];
          const aglAltitude = haeAltitude - groundElevation;

          this._debugService.log(
            `Waypoint ${index} extended position calculation`,
            {
              rltAltitude: waypoint.position.altitude,
              haeAltitude: haeAltitude,
              groundElevation: groundElevation,
              aglAltitude: aglAltitude,
            }
          );

          // Create extended position with current altitude formats
          const extendedPosition: IWaypointPosition = {
            ...waypoint.position,
            aglAltitude: aglAltitude,
            // Future altitude formats will be added here:
            // aslAltitude: calculateASL(haeAltitude),
          };

          return {
            ...waypoint,
            extendedPosition: extendedPosition,
          };
        });

      return waypointsWithExtendedPosition;
    } catch (error) {
      this._debugService.error(
        'Failed to calculate extended position data for waypoints',
        error
      );
      throw new Error(
        `Failed to calculate extended position data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Gets extended position information for a specific waypoint, including AGL altitude.
   *
   * This method converts the waypoint's RLT position to HAE coordinates,
   * then uses terrain sampling to calculate additional altitude formats (currently AGL).
   * Future extensions will include ASL (Above Sea Level) and other altitude references.
   *
   * @param index The index of the waypoint to get extended position for
   * @returns Promise resolving to the extended position information
   * @throws Error if index is invalid or terrain sampling fails
   * @public
   */
  public async getWaypointExtendedPosition(
    index: number
  ): Promise<WaypointDataWithExtendedPosition | null> {
    if (index < 0 || index >= this._waypointsData.length) {
      return null;
    }

    try {
      const waypoint = this._waypointsData[index];

      // Convert RLT position to HAE for terrain sampling
      const haePosition = this._convertRLTtoHAE(waypoint.position);

      this._debugService.log(
        `Calculating extended position for waypoint ${index}`,
        {
          rltPosition: waypoint.position,
          haePosition: haePosition,
        }
      );

      // Get terrain height for this position
      const mapServices =
        this._compositeManager.mapProviderServices.mapServices;
      const groundElevation = await mapServices.getTerrainHeightMostSampled(
        haePosition
      );

      const haeAltitude = haePosition.altitude || 0;
      const aglAltitude = haeAltitude - groundElevation;

      this._debugService.log(`Waypoint ${index} extended position result`, {
        haeAltitude: haeAltitude,
        groundElevation: groundElevation,
        aglAltitude: aglAltitude,
      });

      // Create extended position with current altitude formats
      const extendedPosition: IWaypointPosition = {
        ...waypoint.position,
        altitude:
          parseFloat(
            waypoint.position.altitude
              ? waypoint.position.altitude.toFixed(2)
              : '0.00'
          ) || 0, // Convert to 2 decimal precision to match waypoint.position.altitude
        aglAltitude: parseFloat(aglAltitude.toFixed(2)),
        // Future altitude formats will be added here:
        // aslAltitude: calculateASL(haeAltitude),
      };

      // Return full waypoint data with extended position
      return {
        ...waypoint,
        extendedPosition: extendedPosition,
      };
    } catch (error) {
      this._debugService.error(
        `Failed to calculate extended position for waypoint ${index}`,
        error
      );
      return null;
    }
  }

  /**
   * Gets extended position information for the mission reference point, including AGL altitude.
   *
   * This method converts the reference point's RLT position to HAE coordinates,
   * then uses terrain sampling to calculate additional altitude formats (currently AGL).
   * Future extensions will include ASL (Above Sea Level) and other altitude references.
   *
   * @returns Promise resolving to the reference point extended position information
   * @throws Error if no reference point is set or terrain sampling fails
   * @public
   */
  public async getReferencePointExtendedPosition(): Promise<IWaypointPosition> {
    if (!this._referencePoint) {
      throw new Error('No reference point set');
    }

    try {
      // Convert RLT reference point to HAE for terrain sampling
      const haePosition = this._convertRLTtoHAE(this._referencePoint);

      this._debugService.log(
        'Calculating extended position for reference point',
        {
          rltPosition: this._referencePoint,
          haePosition: haePosition,
        }
      );

      // Get terrain height for reference point position
      const mapServices =
        this._compositeManager.mapProviderServices.mapServices;
      const groundElevation = await mapServices.getTerrainHeightMostSampled(
        haePosition
      );

      const haeAltitude = haePosition.altitude || 0;
      const aglAltitude = haeAltitude - groundElevation;

      this._debugService.log('Reference point extended position result', {
        haeAltitude: haeAltitude,
        groundElevation: groundElevation,
        aglAltitude: aglAltitude,
      });

      // Create extended position with current altitude formats
      const extendedPosition: IWaypointPosition = {
        ...this._referencePoint,
        aglAltitude: aglAltitude,
        // Future altitude formats will be added here:
        // aslAltitude: calculateASL(haeAltitude),
      };

      return extendedPosition;
    } catch (error) {
      this._debugService.error(
        'Failed to calculate extended position for reference point',
        error
      );
      throw new Error(
        `Failed to calculate reference point extended position: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // ------------------------------------------------------------
  // Convenience Methods for Specific Altitude Formats
  // ------------------------------------------------------------

  /**
   * Convenience method to get AGL altitude for a specific waypoint.
   * This is a wrapper around getWaypointExtendedPosition for backward compatibility
   * and ease of use when only AGL is needed.
   *
   * @param index The index of the waypoint
   * @returns Promise resolving to the AGL altitude in meters
   * @public
   */
  public async getWaypointAGLAltitude(index: number): Promise<number | null> {
    const extendedPosition = await this.getWaypointExtendedPosition(index);
    return extendedPosition?.extendedPosition?.aglAltitude || null;
  }

  /**
   * Convenience method to get AGL altitude for the reference point.
   * This is a wrapper around getReferencePointExtendedPosition for backward compatibility
   * and ease of use when only AGL is needed.
   *
   * @returns Promise resolving to the reference point AGL altitude in meters
   * @public
   */
  public async getReferencePointAGL(): Promise<number> {
    const extendedPosition = await this.getReferencePointExtendedPosition();
    return extendedPosition.aglAltitude;
  }

  // ------------------------------------------------------------
  // Terrain and Altitude Conversion Helper Methods
  // ------------------------------------------------------------

  /**
   * Converts AGL (Above Ground Level) altitude to HAE (Height Above Ellipsoid) at a specific location.
   * This method integrates with terrain data to get ground elevation.
   *
   * @param position The geographic position (lat/lng)
   * @param aglAltitude The AGL altitude in meters
   * @returns Promise resolving to HAE altitude in meters
   * @private
   */
  private async _convertAGLtoHAE(
    position: IPosition,
    aglAltitude: number
  ): Promise<number> {
    try {
      // Get ground elevation at this lat/long from terrain service
      const mapServices =
        this._compositeManager.mapProviderServices.mapServices;
      const groundElevation = await mapServices.getTerrainHeightMostSampled(
        position
      );

      // HAE = Ground Elevation + AGL altitude
      const haeAltitude = groundElevation + aglAltitude;

      this._debugService.log('Converted AGL to HAE', {
        position: {
          latitude: position.latitude,
          longitude: position.longitude,
        },
        aglAltitude: aglAltitude,
        groundElevation: groundElevation,
        haeAltitude: haeAltitude,
      });

      return haeAltitude;
    } catch (error) {
      this._debugService.error(
        'Failed to convert AGL to HAE, using AGL value as HAE',
        error
      );
      // Fallback: use AGL value as HAE if terrain service fails
      return aglAltitude;
    }
  }

  /**
   * Gets ground elevation at a specific geographic location.
   * This method would integrate with your terrain data service.
   *
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @returns Promise resolving to ground elevation in meters above ellipsoid
   * @private
   */
  private async _getGroundElevation(
    latitude: number,
    longitude: number
  ): Promise<number> {
    // TODO: Integrate with actual terrain service
    // For now, return 0 as placeholder to maintain existing behavior
    // In a real implementation, this would query a terrain service like:
    // - Cesium World Terrain
    // - Mapbox Terrain API
    // - Custom terrain service

    this._debugService.log(
      'Getting ground elevation (placeholder implementation)',
      {
        latitude: latitude,
        longitude: longitude,
        elevation: 0,
      }
    );

    return Promise.resolve(0);
  }

  /**
   * Calculates the appropriate HAE altitude for a new waypoint based on route altitude settings.
   *
   * @param position The geographic position where the waypoint will be placed
   * @returns Promise resolving to HAE altitude in meters
   * @private
   */
  private async _calculateWaypointHAEAltitude(
    position: IPosition
  ): Promise<number> {
    if (this._routeAltitudeSettings.type === 'AGL') {
      // For AGL: convert AGL value to HAE at this specific location
      return await this._convertAGLtoHAE(
        position,
        this._routeAltitudeSettings.value
      );
    } else {
      // For RLT: add route altitude to reference point HAE
      const referenceHAE = this._referenceAltitudeHAE || 0;
      return referenceHAE + this._routeAltitudeSettings.value;
    }
  }

  /**
   * Ensures all waypoints have the followRouteAltitude property with appropriate defaults.
   * This handles migration for existing waypoints that may not have this property.
   *
   * @private
   */
  private _ensureWaypointFollowRouteDefaults(): void {
    this._waypointsData.forEach((waypoint, index) => {
      if (waypoint.followRouteAltitude === undefined) {
        waypoint.followRouteAltitude = true; // Default for existing waypoints
        this._debugService.log(
          `Set default followRouteAltitude=true for waypoint ${index}`
        );
      }
    });
  }

  /**
   * Disables follow route settings for all waypoints.
   * This is used when only the altitude type changes to ensure waypoints maintain their current values.
   *
   * @private
   */
  private _disableFollowRouteForAllWaypoints(): void {
    this._waypointsData.forEach((waypoint, index) => {
      // Disable follow route altitude setting
      waypoint.followRouteAltitude = false;

      // Disable follow route approach setting
      if (waypoint.approachSettings) {
        waypoint.approachSettings.followRoute = false;
      } else {
        // Create approach settings with follow route disabled
        waypoint.approachSettings = {
          followRoute: false,
          nextWaypointApproachMode: this._mapRouteSettingToApproachMode(
            this._routeDeviceYawMode
          ),
        };
      }

      this._debugService.log(
        `Disabled follow route settings for waypoint ${index} (onlyTypeChanged=true)`
      );
    });
  }

  // ------------------------------------------------------------
  // Coordinate Conversion Helper Methods
  // ------------------------------------------------------------

  /**
   * Converts RLT (Relative to Launch/Takeoff) position to HAE (Height Above Ellipsoid) for map entity creation.
   *
   * @param rltPosition Position in RLT coordinates
   * @returns Position in HAE coordinates for map rendering
   * @private
   */
  private _convertRLTtoHAE(rltPosition: IPosition): IPosition {
    if (!this._conversionContext.hasReferenceAltitude) {
      // No conversion possible yet, return as-is
      return { ...rltPosition };
    }

    return {
      ...rltPosition,
      altitude:
        rltPosition.altitude !== undefined
          ? rltPosition.altitude + this._conversionContext.referenceAltitude
          : undefined,
    };
  }

  /**
   * Converts HAE (Height Above Ellipsoid) position from map to RLT (Relative to Launch/Takeoff) for external interface.
   *
   * @param haePosition Position in HAE coordinates from map
   * @returns Position in RLT coordinates for UI consumption
   * @private
   */
  private _convertHAEtoRLT(haePosition: IPosition): IPosition {
    if (!this._conversionContext.hasReferenceAltitude) {
      // No conversion possible yet, return as-is
      return { ...haePosition };
    }

    return {
      ...haePosition,
      altitude:
        haePosition.altitude !== undefined
          ? haePosition.altitude - this._conversionContext.referenceAltitude
          : undefined,
    };
  }

  /**
   * Updates the conversion context when reference point is set.
   * The reference point altitude in HAE becomes the baseline for RLT conversions.
   *
   * @param referencePointHAE Reference point position in HAE coordinates
   * @private
   */
  private _updateConversionContext(referencePointHAE: IPosition): void {
    this._referenceAltitudeHAE = referencePointHAE.altitude || 0;
    this._conversionContext = {
      referenceAltitude: this._referenceAltitudeHAE,
      hasReferenceAltitude: true,
    };

    this._debugService.log('Updated coordinate conversion context', {
      referenceAltitudeHAE: this._referenceAltitudeHAE,
      hasReferenceAltitude: this._conversionContext.hasReferenceAltitude,
    });
  }

  /**
   * Updates all waypoint markers with new HAE coordinates after reference point change.
   * This is called when the reference point altitude changes, requiring all waypoint
   * markers to be updated with new HAE coordinates (while their RLT coordinates remain unchanged).
   *
   * @private
   */
  private _updateWaypointMarkersAfterReferenceChange(): void {
    const markers = this._markerService.waypointMarkers;

    this._waypointsData.forEach((waypoint, index) => {
      if (index < markers.length) {
        // Convert RLT waypoint position to new HAE coordinates
        const haePosition = this._convertRLTtoHAE(waypoint.position);

        this._debugService.log(
          `Updating waypoint ${index} marker after reference change`,
          {
            rltPosition: waypoint.position,
            newHAEPosition: haePosition,
          }
        );

        // Update marker position with new HAE coordinates
        markers[index].updatePosition(haePosition);

        // Update orientation model if this waypoint is in edit mode
        if (
          this._stateService.editingWaypointIndex === index &&
          this._markerService.orientationModel
        ) {
          // Compute orientation at runtime instead of using stored orientation
          const runtimeOrientation = this.computeWaypointOrientation(index);
          this._markerService.updateOrientationModel(
            haePosition,
            runtimeOrientation
          );
        }
      }
    });
  }

  // ------------------------------------------------------------
  // Private Helper Methods
  // ------------------------------------------------------------

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
    // Clean up global LEFT_UP event listener
    const mapService = this._compositeManager.mapProviderServices.mapServices;
    mapService.offGlobalMapEvent(
      IEventType.LEFT_UP,
      this._handleGlobalLeftUpEvent.bind(this)
    );

    // Clean up event service (this handles map click handlers and other event subscriptions)
    this._eventService.dispose();
  }

  /**
   * Cleans up all entities and resets state.
   *
   * Called when completing, cancelling, or disposing the mission planner.
   * Removes all visual entities from the map and resets internal state.
   *
   * @private
   */
  private _cleanup(): void {
    // Clean up all entities
    this._markerService.cleanupEntities();

    // Reset internal state
    this._referencePoint = null;
    this._waypointsData = [];
    this._stateService.reset();

    // Reset coordinate conversion context
    this._referenceAltitudeHAE = null;
    this._conversionContext = {
      referenceAltitude: 0,
      hasReferenceAltitude: false,
    };

    // Reset altitude synchronization tracking
    this._altDragStartAltitude = null;

    // Reset distance cache
    this._cachedDistance = null;
    this._distanceCacheValid = false;

    // Reset runtime orientation computation
    this._currentEditingOrientation = null;

    // Reset drag altitude mode to default HAE
    const mapServices = this._compositeManager.mapProviderServices.mapServices;
    mapServices.setDragAltitudeMode(DragAltitudeMode.HAE);
  }

  /**
   * Updates the mission path polyline with current waypoint positions.
   *
   * Implementation details:
   * - Converts RLT waypoint positions to HAE coordinates for map rendering
   * - Uses TakeoffPathService to generate realistic takeoff paths (with HAE coordinates)
   * - Delegates to MarkerService to update the visual path (using HAE coordinates)
   * - Ensures map displays correct absolute altitudes while maintaining RLT logic internally
   *
   * @private
   */
  /**
   * Updates only the takeoff path (always called when reference point changes)
   * @private
   */
  private _updateTakeoffPath(): void {
    if (!this._referencePoint) {
      return;
    }

    // Convert RLT positions to HAE coordinates for map rendering
    const referencePointHAE = this._convertRLTtoHAE(this._referencePoint);

    this._debugService.log('Updating takeoff path with HAE coordinates', {
      referencePointRLT: this._referencePoint,
      referencePointHAE: referencePointHAE,
      waypointCount: this._waypointsData.length,
      conversionContext: this._conversionContext,
    });

    // Update takeoff path if we have at least one waypoint
    let firstWaypointHAE: IPosition | null = null;
    if (this._waypointsData.length > 0) {
      // Get the actual position from the first waypoint marker (which has correct coordinates)
      const waypointMarkers = this._markerService.waypointMarkers;
      if (waypointMarkers.length > 0 && waypointMarkers[0]) {
        // Use the marker's actual position (already in HAE coordinates)
        firstWaypointHAE = waypointMarkers[0].position;
      } else {
        // Fallback to converting RLT coordinates (for cases where marker doesn't exist yet)
        firstWaypointHAE = this._convertRLTtoHAE(
          this._waypointsData[0].position
        );
      }
    }

    // Update only the takeoff path in MarkerService
    this._markerService.updateTakeoffPath(
      referencePointHAE,
      firstWaypointHAE,
      this._takeoffMode,
      this._takeoffAltitude
    );

    if (firstWaypointHAE) {
      this._debugService.log('Updated takeoff path with HAE coordinates', {
        referencePointRLT: this._referencePoint,
        referencePointHAE: referencePointHAE,
        firstWaypointHAE: firstWaypointHAE,
        takeoffMode: this._takeoffMode,
        takeoffAltitude: this._takeoffAltitude,
      });
    }
  }

  /**
   * Updates only the waypoint path (only called in RLT mode when reference point changes)
   * @private
   */
  private _updateWaypointPath(): void {
    if (!this._referencePoint) {
      return;
    }

    // Convert waypoint RLT positions to HAE coordinates for map rendering
    const waypointPositionsHAE = this._waypointsData.map((wp) =>
      this._convertRLTtoHAE(wp.position)
    );

    this._debugService.log('Updating waypoint path with HAE coordinates', {
      waypointCount: this._waypointsData.length,
      conversionContext: this._conversionContext,
    });

    // Update only the waypoint path in MarkerService
    this._markerService.updateWaypointPath(waypointPositionsHAE);
  }

  /**
   * Updates both takeoff path and waypoint path (used for non-reference-point updates)
   * @private
   */
  private _updateMissionPath(): void {
    if (!this._referencePoint) {
      return;
    }

    // Convert RLT positions to HAE coordinates for map rendering
    const referencePointHAE = this._convertRLTtoHAE(this._referencePoint);
    const waypointPositionsHAE = this._waypointsData.map((wp) =>
      this._convertRLTtoHAE(wp.position)
    );

    this._debugService.log('Updating mission path with HAE coordinates', {
      referencePointRLT: this._referencePoint,
      referencePointHAE: referencePointHAE,
      waypointCount: this._waypointsData.length,
      conversionContext: this._conversionContext,
    });

    // Generate takeoff path if we have at least one waypoint (using HAE coordinates)
    if (waypointPositionsHAE.length > 0) {
      const firstWaypointHAE = waypointPositionsHAE[0];

      // Generate custom takeoff path using the TakeoffPathService with HAE coordinates
      // Note: takeoffAltitude is relative offset and can be used directly
      const takeoffPath = this._takeoffPathService.generateTakeoffPath(
        referencePointHAE,
        firstWaypointHAE,
        this._takeoffMode,
        this._takeoffAltitude
      );

      this._debugService.log('Generated takeoff path with HAE coordinates', {
        referencePointRLT: this._referencePoint,
        referencePointHAE: referencePointHAE,
        firstWaypointHAE: firstWaypointHAE,
        takeoffMode: this._takeoffMode,
        takeoffAltitude: this._takeoffAltitude,
        pathPoints: takeoffPath.length,
      });
    }

    // The MarkerService will handle tracking positions and updating the path with HAE coordinates
    this._markerService.updateMissionPath(
      referencePointHAE,
      waypointPositionsHAE,
      this._takeoffMode,
      this._takeoffAltitude
    );
  }

  /**
   * Updates all waypoint altitudes relative to a reference point altitude change on mouse up.
   *
   * This method is called when the reference point's altitude change is completed (Alt + drag + mouse up),
   * and synchronizes all waypoint altitudes by the same delta to maintain relative positioning.
   *
   * Implementation details:
   * - Works entirely in RLT coordinate space (waypoint RLT altitudes remain unchanged)
   * - Updates visual markers with new HAE coordinates (only on mouse up for better UX)
   * - Updates orientation model if a waypoint is in edit mode (using HAE coordinates)
   * - Updates the mission path to reflect new altitudes
   * - Emits bulk WAYPOINTS_ALTITUDE_UPDATED event for efficient store updates
   *
   * @param altitudeDelta The altitude change amount in HAE space (positive for increase, negative for decrease)
   * @private
   */
  private async _updateWaypointsAltitudeRelativeToReference(
    altitudeDelta: number
  ): Promise<void> {
    this._debugService.log(
      `Updating waypoint markers after reference altitude change by ${altitudeDelta}m in HAE space`
    );

    // Note: In RLT coordinate system, waypoint altitudes relative to takeoff remain the same
    // Only the HAE representation changes based on the new conversion context
    this._waypointsData.forEach((waypoint, index) => {
      if (waypoint.position.altitude !== undefined) {
        // Waypoint RLT altitude remains unchanged
        const rltAltitude = waypoint.position.altitude;

        // Convert to new HAE coordinates using updated conversion context
        const haePosition = this._convertRLTtoHAE(waypoint.position);

        this._debugService.log(
          `Waypoint ${index} - RLT altitude unchanged: ${rltAltitude}m, HAE position updated`,
          {
            rltPosition: waypoint.position,
            haePosition: haePosition,
          }
        );

        // Update the visual marker with new HAE coordinates
        const markers = this._markerService.waypointMarkers;
        if (index < markers.length) {
          markers[index].updatePosition(haePosition);
        }

        // Update orientation model if this waypoint is in edit mode (using HAE coordinates)
        if (
          this._stateService.editingWaypointIndex === index &&
          this._markerService.orientationModel
        ) {
          // Compute orientation at runtime instead of using stored orientation
          const runtimeOrientation = this.computeWaypointOrientation(index);
          this._markerService.updateOrientationModel(
            haePosition,
            runtimeOrientation
          );
        }

        // Note: Individual waypoint update events are not emitted here
        // The bulk WAYPOINTS_ALTITUDE_UPDATED event below handles all updates efficiently
      }
    });

    // Update mission path to reflect new HAE coordinates
    this._updateMissionPath();

    // Emit bulk waypoints altitude updated event with extended position data
    // This allows application store to batch update all waypoint positions efficiently
    const waypointsWithExtendedPosition =
      await this.getWaypointsWithExtendedPosition();
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.WAYPOINTS_ALTITUDE_UPDATED,
      {
        waypointsWithExtendedPosition,
      }
    );

    this._debugService.log(
      `Emitted WAYPOINTS_ALTITUDE_UPDATED event with ${waypointsWithExtendedPosition.length} waypoints after reference altitude change`
    );
  }

  /**
   * Updates all existing waypoints when altitude settings change.
   * Handles both type changes (AGL ↔ RLT) and value changes within the same type.
   *
   * @param previousSettings Previous altitude settings
   * @param newSettings New altitude settings
   * @param typeChanged Whether the altitude type changed
   * @private
   */
  private async _updateExistingWaypointsForAltitudeSettingsChange(
    previousSettings: IRouteAltitudeSettings,
    newSettings: IRouteAltitudeSettings,
    typeChanged: boolean
  ): Promise<void> {
    try {
      // Filter waypoints that follow route altitude settings
      const waypointsToUpdate = this._waypointsData.filter(
        (waypoint) => waypoint.followRouteAltitude !== false
      );

      if (waypointsToUpdate.length === 0) {
        this._debugService.log(
          'No waypoints follow route altitude settings, skipping update'
        );
        return;
      }

      this._debugService.log(
        'Updating waypoints that follow route altitude settings',
        {
          totalWaypoints: this._waypointsData.length,
          waypointsToUpdate: waypointsToUpdate.length,
          previousSettings,
          newSettings,
          typeChanged,
        }
      );

      if (typeChanged) {
        // Type change requires terrain sampling for AGL calculations
        await this._handleAltitudeTypeChange(previousSettings, newSettings);
      } else {
        // Same type, just value change - simpler altitude offset calculation
        await this._handleAltitudeValueChange(previousSettings, newSettings);
      }

      // Update visual markers with new HAE coordinates
      this._updateWaypointMarkersAfterAltitudeChange();

      // Update mission path visualization
      this._updateMissionPath();

      // Update orientation model if a waypoint is in edit mode and follows route settings
      if (this._stateService.editingWaypointIndex !== -1) {
        const editIndex = this._stateService.editingWaypointIndex;
        const waypoint = this._waypointsData[editIndex];

        // Only update if this waypoint follows route settings
        if (waypoint.followRouteAltitude !== false) {
          const haePosition = this._convertRLTtoHAE(waypoint.position);

          // Compute orientation at runtime instead of using stored orientation
          const runtimeOrientation = this.computeWaypointOrientation(editIndex);
          this._markerService.updateOrientationModel(
            haePosition,
            runtimeOrientation
          );
        }
      }

      // NO EVENT EMISSION - This is a form-driven change

      this._debugService.log(
        'Successfully updated all waypoints for altitude settings change'
      );
    } catch (error) {
      this._debugService.error(
        'Failed to update waypoints for altitude settings change',
        error
      );
      throw new Error(
        `Failed to update waypoints for altitude settings change: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handles altitude type changes (AGL ↔ RLT) by recalculating waypoint altitudes.
   * This requires terrain sampling when converting from/to AGL.
   *
   * @param previousSettings Previous altitude settings
   * @param newSettings New altitude settings
   * @private
   */
  private async _handleAltitudeTypeChange(
    _previousSettings: IRouteAltitudeSettings,
    newSettings: IRouteAltitudeSettings
  ): Promise<void> {
    // Get waypoints that follow route settings
    const waypointsToUpdate = this._waypointsData
      .map((waypoint, index) => ({ waypoint, index }))
      .filter(({ waypoint }) => waypoint.followRouteAltitude !== false);

    if (waypointsToUpdate.length === 0) return;

    // Get current HAE positions for terrain sampling (only for waypoints that follow route)
    const currentHAEPositions = waypointsToUpdate.map(({ waypoint }) =>
      this._convertRLTtoHAE(waypoint.position)
    );

    if (newSettings.type === 'AGL') {
      // Converting TO AGL: Calculate new HAE altitudes based on AGL value
      const newHAEAltitudes = await Promise.all(
        currentHAEPositions.map((position) =>
          this._convertAGLtoHAE(position, newSettings.value)
        )
      );

      // Update waypoint RLT altitudes (only for waypoints that follow route)
      waypointsToUpdate.forEach(({ waypoint }, arrayIndex) => {
        const newHAEAltitude = newHAEAltitudes[arrayIndex];
        waypoint.position.altitude =
          newHAEAltitude - (this._referenceAltitudeHAE || 0);
      });
    } else {
      // Converting TO RLT: Simply use the new RLT value (only for waypoints that follow route)
      waypointsToUpdate.forEach(({ waypoint }) => {
        waypoint.position.altitude = newSettings.value;
      });
    }
  }

  /**
   * Handles altitude value changes within the same type.
   * This is simpler as it only requires offset calculations.
   *
   * @param previousSettings Previous altitude settings
   * @param newSettings New altitude settings
   * @private
   */
  private async _handleAltitudeValueChange(
    _previousSettings: IRouteAltitudeSettings,
    newSettings: IRouteAltitudeSettings
  ): Promise<void> {
    // Get waypoints that follow route settings
    const waypointsToUpdate = this._waypointsData.filter(
      (waypoint) => waypoint.followRouteAltitude !== false
    );

    if (waypointsToUpdate.length === 0) return;

    if (newSettings.type === 'RLT') {
      // RLT value change: Simple assignment (only for waypoints that follow route)
      waypointsToUpdate.forEach((waypoint) => {
        waypoint.position.altitude = newSettings.value;
      });
    } else {
      // AGL value change: Recalculate HAE altitudes (only for waypoints that follow route)
      const currentHAEPositions = waypointsToUpdate.map((waypoint) =>
        this._convertRLTtoHAE(waypoint.position)
      );

      const newHAEAltitudes = await Promise.all(
        currentHAEPositions.map((position) =>
          this._convertAGLtoHAE(position, newSettings.value)
        )
      );

      waypointsToUpdate.forEach((waypoint, index) => {
        const newHAEAltitude = newHAEAltitudes[index];
        waypoint.position.altitude =
          newHAEAltitude - (this._referenceAltitudeHAE || 0);
      });
    }
  }

  /**
   * Updates waypoint markers with new HAE coordinates after altitude settings change.
   * Only updates markers for waypoints that follow route altitude settings.
   *
   * @private
   */
  private _updateWaypointMarkersAfterAltitudeChange(): void {
    const markers = this._markerService.waypointMarkers;

    this._waypointsData.forEach((waypoint, index) => {
      // Only update markers for waypoints that follow route settings
      if (waypoint.followRouteAltitude !== false && index < markers.length) {
        const haePosition = this._convertRLTtoHAE(waypoint.position);

        this._debugService.log(
          `Updating waypoint ${index} marker after altitude settings change`,
          {
            rltPosition: waypoint.position,
            haePosition: haePosition,
            followsRoute: true,
          }
        );

        markers[index].updatePosition(haePosition);
      } else if (index < markers.length) {
        this._debugService.log(
          `Skipping waypoint ${index} marker update (doesn't follow route)`,
          {
            followsRoute: false,
          }
        );
      }
    });
  }

  /**
   * Validates the mission to ensure it meets requirements.
   *
   * Checks for:
   * - Presence of reference point
   * - Minimum required number of waypoints
   * - Correct mission state
   *
   * @returns Array of validation error messages, empty if valid
   * @private
   */
  private _validateMission(): string[] {
    const errors: string[] = [];

    // Check for reference point
    if (!this._referencePoint) {
      errors.push('No reference point set');
    }

    // Check for minimum number of waypoints
    if (
      this._waypointsData.length <
      MissionPlannerConstants.Validation.MINIMUM_WAYPOINTS
    ) {
      errors.push(
        `Mission must have at least ${MissionPlannerConstants.Validation.MINIMUM_WAYPOINTS} waypoints`
      );
    }

    // Check if state is correct
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      errors.push('Mission must be in PLANNING state to complete');
    }

    return errors;
  }

  /**
   * Calculates the total distance from first waypoint to last waypoint.
   *
   * @returns Total distance in meters, or 0 if fewer than 2 waypoints exist
   * @private
   */
  private _calculateMissionDistance(): number {
    if (this._waypointsData.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    const waypointPositions = this._waypointsData.map((wp) => wp.position);

    // Calculate distances between consecutive waypoints
    for (let i = 1; i < waypointPositions.length; i++) {
      totalDistance +=
        this._compositeManager.mapProviderServices.mapServices.calculateDistanceInMeters(
          waypointPositions[i - 1],
          waypointPositions[i]
        );
    }

    return totalDistance;
  }

  /**
   * Invalidates the distance cache when waypoints change.
   * @private
   */
  private _invalidateDistanceCache(): void {
    this._distanceCacheValid = false;
  }

  /**
   * Emits mission distance changed event after waypoint operations.
   * @private
   */
  private _emitDistanceChangedEvent(): void {
    this._eventService.emitEvent(
      LinearMissionPlannerEventType.MISSION_DISTANCE_CHANGED,
      {
        eventType: LinearMissionPlannerEventType.MISSION_DISTANCE_CHANGED,
        missionDistance: this.missionDistance,
      }
    );
  }

  // ------------------------------------------------------------
  // Orientation Computation Methods
  // ------------------------------------------------------------

  /**
   * Computes device yaw based on mission route settings mode
   * @param index Waypoint index to compute yaw for
   * @returns Device yaw in degrees
   * @private
   */
  private _computeDeviceYaw(index: number): number {
    if (!this._referencePoint) {
      this._debugService.warn(
        'No reference point available for device yaw computation'
      );
      return 0;
    }

    return this._orientationComputationService.computeDeviceYaw(
      index,
      this._waypointsData,
      this._referencePoint,
      this._routeDeviceYawMode
    );
  }

  /**
   * Computes base device yaw without considering deviceYawAction values
   * This is used to get the underlying flight path direction before any user-defined offsets
   * @param index Waypoint index to compute base yaw for
   * @returns Base device yaw in degrees (without deviceYawAction offset)
   * @public
   */
  public computeBaseDeviceYaw(index: number): number {
    if (!this._referencePoint) {
      this._debugService.warn(
        'No reference point available for base device yaw computation'
      );
      return 0;
    }

    // Create a temporary copy of waypoints data without deviceYawAction for the target waypoint
    const waypointsDataCopy = [...this._waypointsData];
    const originalDeviceYawAction = waypointsDataCopy[index].deviceYawAction;

    // Temporarily remove deviceYawAction to get base computation
    waypointsDataCopy[index] = {
      ...waypointsDataCopy[index],
      deviceYawAction: undefined,
    };

    const baseDeviceYaw = this._orientationComputationService.computeDeviceYaw(
      index,
      waypointsDataCopy,
      this._referencePoint,
      this._routeDeviceYawMode
    );

    // Restore the original deviceYawAction (though we're working with a copy)
    waypointsDataCopy[index].deviceYawAction = originalDeviceYawAction;

    return baseDeviceYaw;
  }

  // ------------------------------------------------------------
  // DEPRECATED: Orientation computation methods moved to OrientationComputationService
  // These methods are kept commented for reference but are no longer used
  // ------------------------------------------------------------

  /*
  private _computeAlongRouteYaw(index: number): number {
    // MOVED TO OrientationComputationService
  }

  private _computeLockYawAxisYaw(): number {
    // MOVED TO OrientationComputationService
  }

  private _computeManualYaw(): number {
    // MOVED TO OrientationComputationService
  }

  private _calculateHeadingBetweenPositions(from: IPosition, to: IPosition): number {
    // MOVED TO OrientationComputationService
  }
  */

  /**
   * Normalizes yaw value to -180 to 180 degree range
   * @param yaw Yaw value in degrees
   * @returns Normalized yaw in degrees
   * @private
   */
  private _normalizeYaw(yaw: number): number {
    return ((((yaw + 180) % 360) + 360) % 360) - 180;
  }

  // NOTE: _validateYawValue method removed - validation is now handled in the API methods

  /**
   * Recomputes orientation for currently editing waypoint
   * Called when route settings change or waypoint position updates
   * @private
   */
  private _recomputeEditingWaypointOrientation(): void {
    const editingIndex = this._stateService.editingWaypointIndex;
    this._debugService.log(
      `_recomputeEditingWaypointOrientation: editingIndex=${editingIndex}`
    );

    if (editingIndex !== -1) {
      // Compute new orientation
      const newOrientation = this.computeWaypointOrientation(editingIndex);
      this._currentEditingOrientation = newOrientation;

      this._debugService.log(
        `🧭 Computed new orientation for waypoint ${editingIndex}: heading=${newOrientation.heading}, pitch=${newOrientation.pitch}, roll=${newOrientation.roll}`
      );

      // Update orientation model if it exists (using HAE coordinates)
      if (this._markerService.orientationModel) {
        // In AGL mode, preserve the current waypoint marker position to avoid altitude changes
        // In RLT mode, convert from RLT coordinates to get updated HAE position
        const isAGLMode = this._routeAltitudeSettings.type === 'AGL';
        let haePosition: IPosition;

        if (isAGLMode) {
          // AGL mode: Use the existing waypoint marker position to preserve altitude
          const waypointMarkers = this._markerService.waypointMarkers;
          if (
            waypointMarkers.length > editingIndex &&
            waypointMarkers[editingIndex]
          ) {
            haePosition = waypointMarkers[editingIndex].position;
            this._debugService.log(
              `AGL mode: Using existing waypoint marker position for orientation model: lat=${haePosition.latitude}, lon=${haePosition.longitude}, alt=${haePosition.altitude}`
            );
          } else {
            // Fallback: use conversion (shouldn't happen in normal cases)
            haePosition = this._convertRLTtoHAE(
              this._waypointsData[editingIndex].position
            );
            this._debugService.warn(
              'AGL mode: Waypoint marker not found, falling back to RLT conversion'
            );
          }
        } else {
          // RLT mode: Convert from RLT coordinates to get updated HAE position
          haePosition = this._convertRLTtoHAE(
            this._waypointsData[editingIndex].position
          );
          this._debugService.log(
            `RLT mode: Converting RLT to HAE position for orientation model: lat=${haePosition.latitude}, lon=${haePosition.longitude}, alt=${haePosition.altitude}`
          );
        }

        this._markerService.updateOrientationModel(
          haePosition, // Use HAE coordinates for map positioning
          this._currentEditingOrientation
        );

        this._debugService.log('Orientation model updated successfully');
      } else {
        this._debugService.warn('No orientation model available to update');
      }
    } else {
      this._debugService.log(
        'No waypoint in edit mode, cannot recompute orientation'
      );
    }
  }

  // NOTE: _updateEditingWaypointOrientationIfAffected method removed
  // This is now handled by global pointer up events
  /*
  private _updateEditingWaypointOrientationIfAffected(
    changedWaypointIndex: number
  ): void {
    const editingIndex = this._stateService.editingWaypointIndex;

    this._debugService.log(
      `_updateEditingWaypointOrientationIfAffected: changedIndex=${changedWaypointIndex}, editingIndex=${editingIndex}, mode=${this._routeDeviceYawMode}`
    );

    // No waypoint in edit mode
    if (editingIndex === -1) {
      this._debugService.log(
        'No waypoint in edit mode, skipping orientation update'
      );
      return;
    }

    // The editing waypoint itself was moved - already handled by existing logic
    if (editingIndex === changedWaypointIndex) {
      this._debugService.log(
        'Editing waypoint itself was moved, orientation already updated'
      );
      return;
    }

    // Check if the change affects the editing waypoint's orientation
    const shouldUpdate = this._doesPositionChangeAffectEditingWaypoint(
      changedWaypointIndex,
      editingIndex
    );
    this._debugService.log(
      `Impact analysis: changedIndex=${changedWaypointIndex}, editingIndex=${editingIndex}, shouldUpdate=${shouldUpdate}`
    );

    if (shouldUpdate) {
      this._debugService.log(
        `Waypoint ${changedWaypointIndex} position change affects editing waypoint ${editingIndex}, updating orientation`
      );

      // Recompute and update orientation for editing waypoint
      this._recomputeEditingWaypointOrientation();
    } else {
      this._debugService.log(
        `Waypoint ${changedWaypointIndex} position change does not affect editing waypoint ${editingIndex}`
      );
    }
  }
  */

  /**
   * Computes orientation for a specific waypoint on-demand
   * Uses NEW extended properties, ignores legacy properties
   * @param index Waypoint index to compute orientation for
   * @returns Computed orientation with both legacy and new properties
   * @public
   */
  /**
   * Computes standard orientation for waypoint (for orientation model display)
   * Maps computed deviceYaw to heading property for proper map display
   *
   * @param index Waypoint index to compute orientation for
   * @returns Clean IOrientation with computed heading for orientation model
   * @public
   */
  public computeWaypointOrientation(index: number): IOrientation {
    if (index < 0 || index >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${index}`);
    }

    if (!this._referencePoint) {
      // Return default orientation if no reference point
      return { heading: 0, pitch: 0, roll: 0 };
    }

    return this._orientationComputationService.computeWaypointOrientation(
      index,
      this._waypointsData,
      this._referencePoint,
      this._routeDeviceYawMode
    );
  }

  /**
   * Computes mission-specific waypoint orientation data for runtime use
   * Returns waypoint-specific computed values without storing them
   *
   * @param index Waypoint index to compute orientation data for
   * @returns Runtime-computed waypoint orientation data
   * @public
   */
  public computeWaypointOrientationData(index: number): IWaypointOrientation {
    if (index < 0 || index >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${index}`);
    }

    if (!this._referencePoint) {
      // Return default orientation data if no reference point
      return {
        deviceYaw: 0,
        gimbalYaw: 0,
        gimbalTilt: 0,
      };
    }

    const deviceYaw = this._orientationComputationService.computeDeviceYaw(
      index,
      this._waypointsData,
      this._referencePoint,
      this._routeDeviceYawMode
    );

    return {
      deviceYaw: deviceYaw,
      gimbalYaw: 0, // Default/placeholder for future enhancement
      gimbalTilt: 0, // Default/placeholder for future enhancement
    };
  }

  // ------------------------------------------------------------
  // Device Yaw Action Management Methods
  // ------------------------------------------------------------

  /**
   * Updates the device yaw action for a specific waypoint
   * This sets a custom yaw angle for the waypoint, overriding mission-level route settings
   *
   * @param waypointIndex The index of the waypoint to update
   * @param angleWithNorth The yaw angle in degrees (range: -180 to 180)
   * @returns True if the update was successful
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   * @public
   */
  public updateDeviceYawActionValue(
    waypointIndex: number,
    value: number,
    type: DroneYawActionTypes
  ): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error(
        'Device yaw action can only be updated in PLANNING state'
      );
    }

    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${waypointIndex}`);
    }

    // Validate value range
    if (value < -180 || value > 180) {
      throw new Error('Value must be between -180 and 180 degrees');
    }

    // Calculate final angle with north based on type
    let angleWithNorth: number;

    if (type === DroneYawActionTypes.NORTH) {
      // For NORTH type, use value directly
      angleWithNorth = value;
    } else if (type === DroneYawActionTypes.FLIGHT_PATH) {
      // For FLIGHT_PATH type, add to base flight path orientation (without existing deviceYawAction)
      try {
        const baseDeviceYaw = this.computeBaseDeviceYaw(waypointIndex);
        angleWithNorth = baseDeviceYaw + value;

        // Normalize to -180 to 180 range
        angleWithNorth = ((angleWithNorth + 180) % 360) - 180;
      } catch (error) {
        console.warn(
          `Failed to compute base orientation for waypoint ${waypointIndex}, using raw value:`,
          error
        );
        angleWithNorth = value;
      }
    } else {
      // Fallback for unknown types
      angleWithNorth = value;
    }

    // Update waypoint with device yaw action
    this._waypointsData[waypointIndex].deviceYawAction = {
      value: value,
      type: type,
    };

    this._debugService.log(
      `Updated device yaw action for waypoint ${waypointIndex}`,
      {
        inputValue: value,
        inputType: type,
        computedAngleWithNorth: angleWithNorth,
        normalizedAngle: this._normalizeYaw(angleWithNorth),
      }
    );

    // Recompute orientation if this waypoint is currently being edited
    if (this._stateService.editingWaypointIndex === waypointIndex) {
      this._recomputeEditingWaypointOrientation();
    }

    return true;
  }

  /**
   * Removes the device yaw action from a specific waypoint
   * The waypoint will then follow the mission-level route device yaw mode
   *
   * @param waypointIndex The index of the waypoint to clear
   * @returns True if the action was removed
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   * @public
   */
  public clearDeviceYawAction(waypointIndex: number): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error(
        'Device yaw action can only be cleared in PLANNING state'
      );
    }

    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${waypointIndex}`);
    }

    // Remove device yaw action
    delete this._waypointsData[waypointIndex].deviceYawAction;

    this._debugService.log(
      `Cleared device yaw action for waypoint ${waypointIndex}`
    );

    // Recompute orientation if this waypoint is currently being edited
    if (this._stateService.editingWaypointIndex === waypointIndex) {
      this._recomputeEditingWaypointOrientation();
    }

    return true;
  }

  /**
   * Checks if a waypoint has a specific device yaw action set
   *
   * @param waypointIndex The index of the waypoint to check
   * @returns True if the waypoint has a device yaw action, false otherwise
   * @public
   */
  public hasDeviceYawAction(waypointIndex: number): boolean {
    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      return false;
    }
    return !!this._waypointsData[waypointIndex].deviceYawAction;
  }

  /**
   * Updates whether a waypoint follows route approach settings or uses custom approach mode
   * @param waypointIndex Index of the waypoint to update
   * @param followRoute Whether to follow mission route approach settings
   * @returns True if update was successful
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   * @public
   */
  public updateWaypointApproachFollowRoute(
    waypointIndex: number,
    followRoute: boolean
  ): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error(
        'Waypoint approach follow route can only be updated in PLANNING state'
      );
    }

    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${waypointIndex}`);
    }

    // Get current approach settings or create defaults
    const currentSettings =
      this._getEffectiveWaypointApproachSettings(waypointIndex);

    // Update follow route setting
    const updatedSettings: IWaypointApproachSettings = {
      ...currentSettings,
      followRoute: followRoute,
      // If switching to custom mode and no mode is set, use default
      nextWaypointApproachMode:
        !followRoute && !currentSettings.nextWaypointApproachMode
          ? this._mapRouteSettingToApproachMode(this._routeDeviceYawMode)
          : currentSettings.nextWaypointApproachMode,
    };

    // Store updated settings
    this._waypointsData[waypointIndex].approachSettings = updatedSettings;

    this._debugService.log(
      `Updated approach follow route for waypoint ${waypointIndex}`,
      {
        followRoute,
        approachMode: updatedSettings.nextWaypointApproachMode,
      }
    );

    // Recompute orientation if this waypoint is currently being edited
    if (this._stateService.editingWaypointIndex === waypointIndex) {
      this._recomputeEditingWaypointOrientation();
    }

    return true;
  }

  /**
   * Updates the next waypoint approach mode (only relevant when followRoute = false)
   * @param waypointIndex Index of the waypoint to update
   * @param mode Custom approach mode to use
   * @returns True if update was successful
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   * @public
   */
  public updateWaypointApproachMode(
    waypointIndex: number,
    mode: NextWaypointApproachMode
  ): boolean {
    if (this._stateService.state !== LinearMissionPlannerState.PLANNING) {
      throw new Error(
        'Waypoint approach mode can only be updated in PLANNING state'
      );
    }

    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      throw new Error(`Invalid waypoint index: ${waypointIndex}`);
    }

    // Get current approach settings or create defaults
    const currentSettings =
      this._getEffectiveWaypointApproachSettings(waypointIndex);

    // Update approach mode
    const updatedSettings: IWaypointApproachSettings = {
      ...currentSettings,
      nextWaypointApproachMode: mode,
    };

    // Store updated settings
    this._waypointsData[waypointIndex].approachSettings = updatedSettings;

    this._debugService.log(
      `Updated approach mode for waypoint ${waypointIndex}`,
      {
        mode,
        followRoute: updatedSettings.followRoute,
      }
    );

    // Recompute orientation if this waypoint is currently being edited
    if (this._stateService.editingWaypointIndex === waypointIndex) {
      this._recomputeEditingWaypointOrientation();
    }

    return true;
  }

  /**
   * Gets the approach settings for a waypoint
   * @param waypointIndex Index of the waypoint
   * @returns Approach settings or null if waypoint doesn't exist
   * @public
   */
  public getWaypointApproachSettings(
    waypointIndex: number
  ): IWaypointApproachSettings | null {
    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      return null;
    }

    return this._getEffectiveWaypointApproachSettings(waypointIndex);
  }

  /**
   * Checks if waypoint follows route settings
   * @param waypointIndex Index of the waypoint
   * @returns True if waypoint follows route settings
   * @public
   */
  public isWaypointFollowingRoute(waypointIndex: number): boolean {
    if (waypointIndex < 0 || waypointIndex >= this._waypointsData.length) {
      return true; // Default behavior
    }

    const settings = this._getEffectiveWaypointApproachSettings(waypointIndex);
    return settings.followRoute;
  }

  /**
   * Gets effective approach settings for a waypoint with defaults
   * @private
   */
  private _getEffectiveWaypointApproachSettings(
    waypointIndex: number
  ): IWaypointApproachSettings {
    const waypoint = this._waypointsData[waypointIndex];

    // Return stored settings if they exist
    if (waypoint.approachSettings) {
      // Fill in missing nextWaypointApproachMode if needed
      if (
        !waypoint.approachSettings.followRoute &&
        !waypoint.approachSettings.nextWaypointApproachMode
      ) {
        return {
          ...waypoint.approachSettings,
          nextWaypointApproachMode: this._mapRouteSettingToApproachMode(
            this._routeDeviceYawMode
          ),
        };
      }
      return waypoint.approachSettings;
    }

    // Return defaults
    return {
      followRoute: true,
      nextWaypointApproachMode: this._mapRouteSettingToApproachMode(
        this._routeDeviceYawMode
      ),
    };
  }

  /**
   * Maps route setting to equivalent approach mode
   * @private
   */
  private _mapRouteSettingToApproachMode(
    routeMode: DeviceYawRouteSettingsMode
  ): NextWaypointApproachMode {
    switch (routeMode) {
      case DeviceYawRouteSettingsMode.ALONG_ROUTE:
        return NextWaypointApproachMode.ALONG_ROUTE;
      case DeviceYawRouteSettingsMode.LOCK_YAW_AXIS:
        return NextWaypointApproachMode.LOCK_YAW_AXIS;
      case DeviceYawRouteSettingsMode.MANUAL:
        return NextWaypointApproachMode.MANUAL;
      default:
        return NextWaypointApproachMode.ALONG_ROUTE;
    }
  }
}
