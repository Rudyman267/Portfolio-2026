import { IOrientation, IPosition } from '@map/public/contracts/base';

/**
 * Enum for drone yaw action types
 */
export enum DroneYawActionTypes {
  FLIGHT_PATH = 'FLIGHT_PATH',
  NORTH = 'NORTH',
}

/**
 * Defines the route settings modes for device yaw control
 *
 * @enum {string}
 * @category Mission Planning
 * @public
 */
export enum DeviceYawRouteSettingsMode {
  /**
   * Automatically calculate heading based on route trajectory
   * Uses 2D vector between waypoints to determine orientation
   */
  ALONG_ROUTE = 'along_route',

  /**
   * Maintain a consistent yaw across waypoints
   * Initial yaw derived from reference point to first waypoint
   * Persists until explicitly changed via mode switch
   */
  LOCK_YAW_AXIS = 'lock_yaw_axis',

  /**
   * Allows manual specification of device yaw
   * Future enhancement - currently behaves same as LOCK_YAW_AXIS
   */
  MANUAL = 'manual',
}

/**
 * Next waypoint approach modes for per-waypoint control
 * Used when waypoint does not follow mission route settings
 *
 * @enum {string}
 * @category Mission Planning
 * @public
 */
export enum NextWaypointApproachMode {
  /**
   * Calculate heading based on route trajectory for this waypoint
   * Behaves like DeviceYawRouteSettingsMode.ALONG_ROUTE for individual waypoint
   */
  ALONG_ROUTE = 'along_route',

  /**
   * Maintain the yaw from reference point to first waypoint
   * Behaves like DeviceYawRouteSettingsMode.LOCK_YAW_AXIS for individual waypoint
   */
  LOCK_YAW_AXIS = 'lock_yaw_axis',

  /**
   * Manual specification of device yaw
   * Behaves like DeviceYawRouteSettingsMode.MANUAL for individual waypoint
   */
  MANUAL = 'manual',

  /**
   * Auto adjust mode - current waypoint points to North (0°)
   * Next waypoint behavior depends on route settings:
   * - ALONG_ROUTE route: next waypoint uses modified trajectory (current→next+1)
   * - LOCK_YAW_AXIS/MANUAL route: next waypoint inherits 0° (inheritance chain)
   */
  AUTO_ADJUST = 'auto_adjust',
}

/**
 * Mission-level route settings configuration
 * Applied to entire mission, not individual waypoints
 */
export interface IMissionRouteSettings {
  deviceYawRouteSetting: {
    mode: DeviceYawRouteSettingsMode;
    // Note: No yawOverride - computation purely based on mode
  };
  // Future: speed settings, altitude behaviors, etc.
}

/**
 * Waypoint-specific device yaw action configuration
 * When present, overrides the mission-level route device yaw mode for this specific waypoint
 *
 * @interface IWaypointDeviceYawAction
 * @category Mission Planning
 * @public
 */
export interface IWaypointDeviceYawAction {
  /**
   * Original user input value from the app
   * Range: -180 to 180 degrees
   */
  value: number;

  /**
   * Original type from the app (FLIGHT_PATH or NORTH)
   */
  type: DroneYawActionTypes;
}

/**
 * Waypoint approach settings configuration
 * Controls whether waypoint follows route or uses custom approach
 *
 * @interface IWaypointApproachSettings
 * @category Mission Planning
 * @public
 */
export interface IWaypointApproachSettings {
  /**
   * Whether this waypoint follows mission-level route settings
   * @default true
   */
  followRoute: boolean;

  /**
   * Custom approach mode used when followRoute = false
   * Defaults to current routeDeviceYawMode when not specified
   */
  nextWaypointApproachMode?: NextWaypointApproachMode;
}

/**
 * Mission-planner-specific waypoint orientation computation data
 * Used for runtime calculations and display purposes only
 * Not stored permanently in waypoint data
 *
 * @interface IWaypointOrientation
 * @category Mission Planning
 * @public
 */
export interface IWaypointOrientation {
  /**
   * Computed device yaw based on route settings mode
   * - ALONG_ROUTE: Trajectory-based heading
   * - LOCK_YAW_AXIS: Reference point → first waypoint angle
   * - MANUAL: Same as LOCK_YAW_AXIS currently
   */
  deviceYaw: number;

  /**
   * Computed gimbal yaw control
   * Currently defaulted to 0, placeholder for future enhancement
   */
  gimbalYaw: number;

  /**
   * Computed gimbal tilt control
   * Currently defaulted to 0, placeholder for future enhancement
   */
  gimbalTilt: number;
}

/**
 * Represents the possible takeoff modes for a linear mission.
 *
 * @enum {string}
 * @category Feature Entities
 * @public
 */
export enum TakeoffMode {
  /**
   * The aircraft will ascend to the start point altitude and fly to the start point directly.
   */
  DIRECT_ASCENT = 'direct_ascent',

  /**
   * The aircraft will ascend to the safe takeoff altitude before flying to the start point.
   */
  SAFE_TAKEOFF = 'safe_takeoff',
}

/**
 * Represents the possible states of a mission during the planning phase.
 *
 * @enum {number}
 * @category Feature Entities
 * @public
 */
export enum LinearMissionPlannerState {
  /**
   * Initial state where no reference point has been set.
   * The mission planner is waiting for a reference point to be defined
   * before any waypoints can be added.
   */
  AWAITING_REFERENCE, // No reference point yet

  /**
   * Active planning state after a reference point has been set.
   * In this state, waypoints can be added, edited, and removed.
   */
  PLANNING, // Has reference, adding waypoints
}

/**
 * Represents the possible states of individual waypoints within a mission plan.
 *
 * @enum {number}
 * @category Feature Entities
 * @public
 */
export enum WaypointState {
  /**
   * Default state for waypoints that are not currently being interacted with.
   */
  NORMAL, // Default, non-selected state

  /**
   * State for a waypoint that is currently selected but not being edited.
   * A selected waypoint is typically highlighted visually on the map.
   */
  SELECTED, // Highlighted, but not being edited

  /**
   * State for a waypoint that is currently being modified.
   * Only one waypoint can be in EDITING state at a time.
   */
  EDITING, // Currently being modified (position or properties)
}

/**
 * Events emitted by the Linear Mission Planner during mission creation and editing.
 *
 * Subscribe to these events to receive notifications about changes to the mission state,
 * waypoints, and user interactions.
 *
 * @enum {string}
 * @category Events
 * @public
 */
export enum LinearMissionPlannerEventType {
  /**
   * Emitted when a reference point is added to a mission that was in AWAITING_REFERENCE state.
   * The mission transitions to PLANNING state after this event.
   *
   * Event data will not include additional properties beyond eventType.
   */
  REFERENCE_POINT_ADDED = 'linearMissionPlanner:referencePointAdded',

  /**
   * Emitted when the reference point of a mission is updated.
   *
   * Event data will not include additional properties beyond eventType.
   */
  REFERENCE_POINT_CHANGED = 'linearMissionPlanner:referencePointChanged',

  /**
   * Emitted when a waypoint is added to the mission.
   *
   * Event data includes:
   * - waypointIndex: The index of the newly added waypoint
   * - waypointData: The data of the newly added waypoint
   */
  WAYPOINT_ADDED = 'linearMissionPlanner:waypointAdded',

  /**
   * Emitted when a waypoint is removed from the mission.
   *
   * Event data includes:
   * - waypointIndex: The index where the waypoint was removed
   * - waypointData: The data of the removed waypoint
   */
  WAYPOINT_REMOVED = 'linearMissionPlanner:waypointRemoved',

  /**
   * Emitted when a waypoint's properties (position, orientation, etc.) are updated.
   *
   * Event data includes:
   * - waypointIndex: The index of the updated waypoint
   * - waypointData: The updated waypoint data
   */
  WAYPOINT_UPDATED = 'linearMissionPlanner:waypointUpdated',

  /**
   * Emitted when a waypoint is reordered (moved) within the mission sequence.
   *
   * Event data includes:
   * - fromWaypointIndex: Previous index of the moved waypoint
   * - toWaypointIndex: New index of the moved waypoint
   * - waypointData: The moved waypoint data (at its new index)
   */
  WAYPOINT_REORDERED = 'linearMissionPlanner:waypointReordered',

  /**
   * Emitted when a waypoint is selected.
   *
   * Event data includes:
   * - waypointIndex: The index of the selected waypoint
   * - waypointData: The data of the selected waypoint
   */
  WAYPOINT_SELECTED = 'linearMissionPlanner:waypointSelected',

  /**
   * Emitted when a waypoint enters edit mode.
   *
   * Event data includes:
   * - waypointIndex: The index of the waypoint entering edit mode
   * - waypointData: The data of the waypoint entering edit mode
   */
  WAYPOINT_EDIT_STARTED = 'linearMissionPlanner:waypointEditStarted',

  /**
   * Emitted when a waypoint exits edit mode.
   *
   * Event data includes:
   * - waypointIndex: The index of the waypoint exiting edit mode
   * - waypointData: The data of the waypoint exiting edit mode
   */
  WAYPOINT_EDIT_ENDED = 'linearMissionPlanner:waypointEditEnded',

  /**
   * Emitted when the mission planner changes state.
   *
   * Event data includes:
   * - oldState: The previous state
   * - newState: The new state
   */
  STATE_CHANGED = 'linearMissionPlanner:stateChanged',

  /**
   * Emitted when the mission visibility is toggled.
   *
   * Event data will not include additional properties beyond eventType.
   */
  MISSION_VISIBILITY_CHANGED = 'linearMissionPlanner:visibilityChanged',

  /**
   * Emitted when mission completion validation fails.
   *
   * Event data includes:
   * - validationErrors: Array of validation error messages
   */
  MISSION_VALIDATION_FAILED = 'linearMissionPlanner:validationFailed',

  /**
   * Emitted when the mission planning process is cancelled.
   *
   * Event data will not include additional properties beyond eventType.
   */
  MISSION_CANCELLED = 'linearMissionPlanner:cancelled',

  /**
   * Emitted when the mission distance changes due to waypoint modifications.
   *
   * Event data includes:
   * - missionDistance: The updated mission distance in meters
   */
  MISSION_DISTANCE_CHANGED = 'linearMissionPlanner:distanceChanged',

  /**
   * Emitted when mission route settings are changed.
   *
   * Event data includes:
   * - routeSettings: The updated route settings configuration
   */
  ROUTE_SETTINGS_CHANGED = 'linearMissionPlanner:routeSettingsChanged',

  /**
   * Emitted when waypoint altitudes are bulk updated after reference point changes.
   * This event provides updated position data for all waypoints with recalculated AGL altitudes.
   *
   * Event data includes:
   * - waypointsWithExtendedPosition: Array of all waypoints with updated position data including AGL
   */
  WAYPOINTS_ALTITUDE_UPDATED = 'linearMissionPlanner:waypointsAltitudeUpdated',
}

/**
 * Represents the final mission data when planning is completed.
 * This data structure can be used to execute the planned mission.
 *
 * @interface CompletedMissionData
 * @category Feature Entities
 * @public
 */
export interface CompletedMissionData {
  /**
   * The reference point for the mission, which serves as the starting position.
   */
  referencePoint: IPosition;

  /**
   * An ordered array of waypoints that define the mission path.
   */
  waypoints: WaypointData[];

  /**
   * The takeoff mode for the mission.
   * - DIRECT_ASCENT: Aircraft will ascend to the start point altitude and fly directly to the start point.
   * - SAFE_TAKEOFF: Aircraft will ascend to the safe takeoff altitude before flying to the start point.
   */
  takeoffMode: TakeoffMode;

  /**
   * The safe takeoff altitude in meters.
   * Only relevant when takeoffMode is SAFE_TAKEOFF.
   */
  takeoffAltitude: number;

  /**
   * Optional additional properties for the mission.
   */
  properties?: Record<string, unknown>;
}

/**
 * Data structure for events emitted by the Linear Mission Planner.
 * The properties included in the event data depend on the event type.
 *
 * @interface LinearMissionPlannerEventData
 * @category Events
 * @public
 */
export interface LinearMissionPlannerEventData {
  /**
   * The type of event that occurred.
   */
  eventType: LinearMissionPlannerEventType;

  /**
   * Index of the affected waypoint, if applicable.
   * Present for WAYPOINT_ADDED, WAYPOINT_REMOVED, WAYPOINT_UPDATED, WAYPOINT_SELECTED,
   * WAYPOINT_EDIT_STARTED, and WAYPOINT_EDIT_ENDED events.
   */
  waypointIndex?: number;

  /**
   * Data of the affected waypoint, if applicable.
   * Present for WAYPOINT_ADDED, WAYPOINT_UPDATED, WAYPOINT_SELECTED,
   * WAYPOINT_EDIT_STARTED, and WAYPOINT_EDIT_ENDED events.
   */
  waypointData?: WaypointData;

  /**
   * Previous state, if applicable.
   * Present for STATE_CHANGED events.
   */
  oldState?: LinearMissionPlannerState;

  /**
   * New state, if applicable.
   * Present for STATE_CHANGED events.
   */
  newState?: LinearMissionPlannerState;

  /**
   * List of validation error messages, if applicable.
   * Present for MISSION_VALIDATION_FAILED events.
   */
  validationErrors?: string[];

  /**
   * Mission distance in meters, if applicable.
   * Present for MISSION_DISTANCE_CHANGED events.
   */
  missionDistance?: number;

  /**
   * Route settings configuration, if applicable.
   * Present for ROUTE_SETTINGS_CHANGED events.
   */
  routeSettings?: IMissionRouteSettings;

  /**
   * Route altitude settings, if applicable.
   * Present for ROUTE_SETTINGS_CHANGED events when altitude settings are updated.
   */
  routeAltitudeSettings?: IRouteAltitudeSettings;

  /**
   * Reference point position in HAE coordinates, if applicable.
   * Present for REFERENCE_POINT_ADDED and REFERENCE_POINT_CHANGED events.
   */
  referencePoint?: IPosition;

  /**
   * Array of waypoints with extended position information including AGL altitude, if applicable.
   * Present for WAYPOINTS_ALTITUDE_UPDATED events.
   */
  waypointsWithExtendedPosition?: WaypointDataWithExtendedPosition[];

  /**
   * Previous index of a reordered waypoint.
   * Present for WAYPOINT_REORDERED events.
   */
  fromWaypointIndex?: number;

  /**
   * New index of a reordered waypoint.
   * Present for WAYPOINT_REORDERED events.
   */
  toWaypointIndex?: number;
}

/**
 * Data structure for waypoint properties during mission planning.
 *
 * @interface WaypointData
 * @category Feature Entities
 * @public
 */
export interface WaypointData {
  /**
   * Geographic position of the waypoint (latitude, longitude, altitude).
   */
  position: IPosition;

  /**
   * Optional orientation (heading, pitch, roll) for the waypoint.
   */
  orientation?: IOrientation;

  /**
   * Optional additional properties for the waypoint such as speed, hover time, etc.
   */
  properties?: Record<string, unknown>;

  /**
   * Whether this waypoint follows the route altitude settings.
   * When true, the waypoint altitude will be updated automatically when route altitude settings change.
   * When false, the waypoint maintains its manually set altitude independent of route settings.
   * @default true
   */
  followRouteAltitude?: boolean;

  /**
   * Optional waypoint-specific device yaw action
   * When present, this waypoint will use the specified yaw angle instead of mission-level route settings
   * When absent, the waypoint follows the mission-level deviceYawRouteSettingsMode
   */
  deviceYawAction?: IWaypointDeviceYawAction;

  /**
   * Approach settings for this waypoint
   * Optional - defaults to { followRoute: true }
   */
  approachSettings?: IWaypointApproachSettings;
}

/**
 * Extended position interface that includes AGL altitude for waypoints and reference points.
 * This interface extends the base IPosition with additional altitude formats for user convenience.
 * Designed to be extensible for future altitude formats like ASL (Above Sea Level).
 *
 * @interface IWaypointPosition
 * @category Feature Entities
 * @public
 */
export interface IWaypointPosition extends IPosition {
  /**
   * Above Ground Level altitude in meters.
   * This represents the altitude relative to the terrain directly below the position.
   */
  aglAltitude: number;

  // Future extensions can be added here:
  // aslAltitude?: number;  // Above Sea Level
  // mslAltitude?: number;  // Mean Sea Level
}

/**
 * Waypoint data with extended position information including AGL altitude.
 * This interface provides access to terrain-aware altitude information for mission planning.
 *
 * @interface WaypointDataWithExtendedPosition
 * @category Feature Entities
 * @public
 */
export interface WaypointDataWithExtendedPosition extends WaypointData {
  /**
   * Extended position information including AGL altitude.
   * Contains all standard position data plus calculated AGL altitude.
   */
  extendedPosition: IWaypointPosition;
}

/**
 * Route altitude settings for mission waypoints
 *
 * @interface IRouteAltitudeSettings
 * @category Feature Entities
 * @public
 */
export interface IRouteAltitudeSettings {
  /**
   * Altitude type: RLT (Relative to Launch/Takeoff) or AGL (Above Ground Level)
   * - RLT: Altitude relative to the takeoff/reference point
   * - AGL: Altitude above the ground level at waypoint location
   */
  type: 'RLT' | 'AGL';

  /**
   * Altitude value in meters
   */
  value: number;

  /**
   * Optional flag to indicate if the altitude settings have changed
   * This can be used to optimize updates and avoid unnecessary re-computations
   */
  onlyTypeChanged?: boolean;
}

/**
 * Options for creating a linear mission planner
 *
 * @interface ILinearMissionPlannerOptions
 * @category Feature Entities
 * @public
 */
export interface ILinearMissionPlannerOptions {
  /**
   * Optional unique identifier for this mission planner
   * If not provided, a UUID will be generated
   */
  id?: string;

  /**
   * Optional initial reference point to start in PLANNING state
   */
  initialReferencePoint?: IPosition;

  /**
   * The takeoff mode to use.
   * - DIRECT_ASCENT: Aircraft will ascend to the start point altitude and fly directly to the start point.
   * - SAFE_TAKEOFF: Aircraft will ascend to the safe takeoff altitude before flying to the start point.
   */
  takeoffMode: TakeoffMode;

  /**
   * The safe takeoff altitude in meters.
   * Only used when takeoffMode is SAFE_TAKEOFF.
   *
   * If this altitude is greater than the first waypoint altitude, the aircraft will maintain
   * the safe takeoff altitude, fly directly above the first waypoint, and then descend to the waypoint altitude.
   *
   * If this altitude is less than the first waypoint altitude, the aircraft will ascend to
   * the waypoint altitude after takeoff and then fly to the first waypoint directly.
   */
  takeoffAltitude: number;

  /**
   * Mission route altitude settings (mandatory)
   * Defines the altitude type and value for waypoints in this mission
   * This replaces the previous hardcoded altitude offset behavior
   */
  routeAltitudeSettings: IRouteAltitudeSettings;

  /**
   * Device yaw mode for the mission (mandatory)
   * Controls how device orientation is computed for all waypoints
   * - ALONG_ROUTE: Yaw follows trajectory direction between waypoints
   * - LOCK_YAW_AXIS: Yaw locked to reference point → first waypoint angle
   * - MANUAL: Same as LOCK_YAW_AXIS (placeholder for future manual control)
   */
  routeDeviceYawMode: DeviceYawRouteSettingsMode;

  /**
   * Optional mission-level route settings for device orientation control
   * Applied to entire mission, not individual waypoints
   * Defaults to ALONG_ROUTE mode if not provided
   * @deprecated Use routeDeviceYawMode instead. Will be removed in future version.
   */
  routeSettings?: IMissionRouteSettings;
}

/**
 * Interface for a linear mission planner entity that allows creating and editing
 * waypoint-based missions on the map.
 *
 * The Linear Mission Planner provides functionality for defining a reference point,
 * adding and managing waypoints, and finalizing mission plans for drone operations.
 * It supports both interactive creation through map clicks and programmatic creation
 * through API calls.
 *
 * @interface ILinearMissionPlanner
 * @category Feature Entities
 * @public
 *
 * @example
 * ```typescript
 * // Get mission planner manager from map instance
 * const missionManager = map.getMissionPlannerManager();
 *
 * // Create a linear mission planner with route settings
 * const missionPlanner = missionManager.createNewLinearMission({
 *   takeoffMode: TakeoffMode.DIRECT_ASCENT,
 *   takeoffAltitude: 0,
 *   routeSettings: {
 *     deviceYawRouteSetting: {
 *       mode: DeviceYawRouteSettingsMode.ALONG_ROUTE
 *     }
 *   }
 * });
 *
 * // Set up event handling for route settings changes
 * missionPlanner.onEvent(
 *   LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED,
 *   (eventData: LinearMissionPlannerEventData) => {
 *     console.log('Route settings changed:', eventData.routeSettings);
 *     // Update UI to reflect new route settings
 *     updateRouteSettingsUI(eventData.routeSettings);
 *   }
 * );
 *
 * // Set reference point
 * missionPlanner.setReferencePoint({
 *   latitude: 37.7749,
 *   longitude: -122.4194,
 *   altitude: 50
 * });
 *
 * // Add waypoints
 * missionPlanner.addWaypoint({
 *   latitude: 37.7750,
 *   longitude: -122.4195,
 *   altitude: 60
 * });
 *
 * // Update route settings during planning
 * missionPlanner.updateMissionRouteSettings({
 *   deviceYawRouteSetting: {
 *     mode: DeviceYawRouteSettingsMode.LOCK_YAW_AXIS
 *   }
 * });
 *
 * // Get computed orientation for a waypoint
 * const waypointOrientation = missionPlanner.computeWaypointOrientation(0);
 * console.log('Waypoint 0 device yaw:', waypointOrientation.deviceYaw);
 *
 * // Complete mission when done
 * const missionData = missionPlanner.completeMission();
 * console.log('Mission complete with', missionData.waypoints.length, 'waypoints');
 * ```
 *
 * @example
 * ```typescript
 * // Advanced event handling for orientation-aware applications
 *
 * // Create mission planner with event handlers
 * const missionPlanner = missionManager.createNewLinearMission({
 *   takeoffMode: TakeoffMode.SAFE_TAKEOFF,
 *   takeoffAltitude: 10,
 *   routeSettings: {
 *     deviceYawRouteSetting: {
 *       mode: DeviceYawRouteSettingsMode.MANUAL
 *     }
 *   }
 * });
 *
 * // Handle waypoint edit events to show orientation
 * missionPlanner.onEvent(
 *   LinearMissionPlannerEventType.WAYPOINT_EDIT_STARTED,
 *   (eventData: LinearMissionPlannerEventData) => {
 *     if (eventData.waypointIndex !== undefined) {
 *       // Get computed orientation for the editing waypoint
 *       const orientation = missionPlanner.computeWaypointOrientation(eventData.waypointIndex);
 *       const orientationData = missionPlanner.computeWaypointOrientationData(eventData.waypointIndex);
 *
 *       // Display orientation info in UI
 *       showOrientationPanel({
 *         waypointIndex: eventData.waypointIndex,
 *         heading: orientation.heading,
 *         deviceYaw: orientationData.deviceYaw,
 *         gimbalYaw: orientationData.gimbalYaw,
 *         gimbalTilt: orientationData.gimbalTilt
 *       });
 *     }
 *   }
 * );
 *
 * // Handle route settings changes
 * missionPlanner.onEvent(
 *   LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED,
 *   (eventData: LinearMissionPlannerEventData) => {
 *     const { routeSettings } = eventData;
 *     if (routeSettings) {
 *       // Update route settings UI
 *       updateRouteSettingsDropdown(routeSettings.deviceYawRouteSetting.mode);
 *
 *       // Refresh orientation display if waypoint is being edited
 *       if (missionPlanner.editingWaypointIndex !== -1) {
 *         const orientation = missionPlanner.computeWaypointOrientation(
 *           missionPlanner.editingWaypointIndex
 *         );
 *         updateOrientationDisplay(orientation);
 *       }
 *     }
 *   }
 * );
 *
 * // Handle waypoint position updates during editing
 * missionPlanner.onEvent(
 *   LinearMissionPlannerEventType.WAYPOINT_UPDATED,
 *   (eventData: LinearMissionPlannerEventData) => {
 *     if (eventData.waypointIndex === missionPlanner.editingWaypointIndex) {
 *       // Position changed for editing waypoint, orientation may have updated
 *       const orientation = missionPlanner.computeWaypointOrientation(eventData.waypointIndex!);
 *       updateOrientationDisplay(orientation);
 *     }
 *   }
 * );
 * ```
 */
export interface ILinearMissionPlanner {
  /**
   * Unique identifier for the mission planner.
   * This ID can be used to reference the planner in events and queries.
   */
  readonly id: string;

  /**
   * Current state of the mission planning.
   * This will be either AWAITING_REFERENCE or PLANNING.
   */
  readonly state: LinearMissionPlannerState;

  /**
   * Reference point for the mission being planned.
   * Will be null only in AWAITING_REFERENCE state.
   * This typically represents the starting position of the mission.
   */
  readonly referencePoint: Readonly<IPosition> | null;

  /**
   * Number of waypoints in the mission plan.
   */
  readonly waypointCount: number;

  /**
   * Index of the currently selected waypoint, or -1 if none is selected.
   */
  readonly selectedWaypointIndex: number;

  /**
   * Index of the waypoint currently in edit mode, or -1 if none is in edit mode.
   */
  readonly editingWaypointIndex: number;

  /**
   * Whether the mission plan is visible on the map.
   */
  readonly isVisible: boolean;

  /**
   * The takeoff mode for the mission.
   */
  readonly takeoffMode: TakeoffMode;

  /**
   * The safe takeoff altitude in meters.
   */
  readonly takeoffAltitude: number;

  /**
   * The total distance from first waypoint to last waypoint in meters.
   * Returns 0 if fewer than 2 waypoints exist.
   */
  readonly missionDistance: number;

  /**
   * Check if the mission plan can have waypoints added.
   *
   * @returns True if the mission is in a state where waypoints can be added
   *
   * @example
   * ```typescript
   * if (missionPlanner.canAddWaypoints()) {
   *   // Enable "Add Waypoint" button in UI
   *   addWaypointButton.disabled = false;
   * } else {
   *   // Disable button
   *   addWaypointButton.disabled = true;
   * }
   * ```
   */
  canAddWaypoints(): boolean;

  /**
   * Check if the mission plan can have waypoints edited.
   *
   * @returns True if the mission is in a state where waypoints can be edited
   *
   * @example
   * ```typescript
   * if (missionPlanner.canEditWaypoints()) {
   *   // Enable waypoint editing controls
   *   editControls.style.display = 'block';
   * } else {
   *   // Hide editing controls
   *   editControls.style.display = 'none';
   * }
   * ```
   */
  canEditWaypoints(): boolean;

  /**
   * Get information about all waypoints in the mission plan.
   *
   * @returns Array of waypoint data objects
   *
   * @example
   * ```typescript
   * const waypoints = missionPlanner.getWaypoints();
   * console.log(`Mission has ${waypoints.length} waypoints`);
   *
   * // Display waypoint list in UI
   * const list = document.getElementById('waypoint-list');
   * list.innerHTML = '';
   * waypoints.forEach((waypoint, index) => {
   *   const item = document.createElement('li');
   *   item.textContent = `Waypoint ${index + 1}:
   *     Lat ${waypoint.position.latitude.toFixed(6)},
   *     Lng ${waypoint.position.longitude.toFixed(6)},
   *     Alt ${waypoint.position.altitude}m`;
   *   list.appendChild(item);
   * });
   * ```
   */
  getWaypoints(): WaypointData[];

  /**
   * Get information about a specific waypoint in the plan.
   *
   * @param index The index of the waypoint
   * @returns Waypoint data if found, undefined if index is invalid
   *
   * @example
   * ```typescript
   * // Get the first waypoint
   * const waypoint = missionPlanner.getWaypoint(0);
   * if (waypoint) {
   *   // Update UI with waypoint details
   *   document.getElementById('lat-field').value = waypoint.position.latitude;
   *   document.getElementById('lng-field').value = waypoint.position.longitude;
   *   document.getElementById('alt-field').value = waypoint.position.altitude;
   *
   *   if (waypoint.orientation) {
   *     document.getElementById('heading-field').value = waypoint.orientation.heading;
   *   }
   * }
   * ```
   */
  getWaypoint(index: number): WaypointData | undefined;

  /**
   * Set the reference point for the mission plan.
   * This must be called first before waypoints can be added.
   *
   * @param position The position to set as reference
   * @throws Error if mission is not in AWAITING_REFERENCE state
   *
   * @example
   * ```typescript
   * try {
   *   missionPlanner.setReferencePoint({
   *     latitude: 37.7749,
   *     longitude: -122.4194,
   *     altitude: 50
   *   });
   *   console.log('Reference point set, now in PLANNING state');
   *
   *   // Update UI to show we're now adding waypoints
   *   updateUIForPlanningState();
   * } catch (error) {
   *   console.error('Failed to set reference point:', error.message);
   * }
   * ```
   */
  setReferencePoint(position: IPosition): void;

  /**
   * Update the reference point position.
   *
   * @param position The new position for the reference point
   * @throws Error if mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * try {
   *   missionPlanner.updateReferencePoint({
   *     latitude: 37.7750,
   *     longitude: -122.4195,
   *     altitude: 55
   *   });
   *   console.log('Reference point updated');
   * } catch (error) {
   *   console.error('Failed to update reference point:', error.message);
   * }
   * ```
   */
  updateReferencePoint(position: IPosition): void;

  /**
   * Add a waypoint to the mission plan.
   *
   * @param position The position of the new waypoint
   * @param properties Optional properties for the waypoint
   * @returns The index of the newly added waypoint
   * @throws Error if mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * try {
   *   const index = missionPlanner.addWaypoint({
   *     latitude: 37.7751,
   *     longitude: -122.4196,
   *     altitude: 60
   *   }, {
   *     orientation: {
   *       heading: 90,
   *       pitch: 0,
   *       roll: 0
   *     },
   *     properties: {
   *       speed: 5, // m/s
   *       hoverTime: 2 // seconds
   *     }
   *   });
   *
   *   console.log('Added waypoint at index:', index);
   * } catch (error) {
   *   console.error('Failed to add waypoint:', error.message);
   * }
   * ```
   */
  addWaypoint(position: IPosition, properties?: Partial<WaypointData>): number;

  /**
   * Insert a waypoint at a specific index in the mission plan.
   *
   * @param index The index to insert the waypoint at
   * @param position The position of the new waypoint
   * @param properties Optional properties for the waypoint
   * @returns The index of the newly inserted waypoint
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * try {
   *   // Insert a waypoint between the first and second waypoints
   *   const index = missionPlanner.insertWaypoint(1, {
   *     latitude: 37.7752,
   *     longitude: -122.4197,
   *     altitude: 65
   *   });
   *
   *   console.log('Inserted waypoint at index:', index);
   * } catch (error) {
   *   console.error('Failed to insert waypoint:', error.message);
   * }
   * ```
   */
  insertWaypoint(
    index: number,
    position: IPosition,
    properties?: Partial<WaypointData>
  ): number;

  /**
   * This is a higher-level helper built on top of `insertWaypoint(...)` that:
   * - Computes a new waypoint position between the target waypoint and its previous neighbor
   * - Inserts the waypoint at the provided index
   * - Emits `WAYPOINT_ADDED` with the inserted index (via `insertWaypoint`)
   *
   * This is intended for UI actions like "Add waypoint before" in client apps.
   *
   * Constraints:
   * - Requires at least 2 waypoints
   * - `waypointIndex` must be >= 1 (cannot insert before the first waypoint)
   *
   * @param waypointIndex Existing waypoint index to insert before (0-based)
   * @returns The index of the newly inserted waypoint (same as `waypointIndex`)
   * @throws Error if index is invalid or mission is not in PLANNING state
   */
  addWaypointBefore(waypointIndex: number): number;

  /**
   * This is a higher-level helper built on top of `insertWaypoint(...)` that:
   * - Computes a new waypoint position between the target waypoint and its next neighbor
   * - Inserts the waypoint at `waypointIndex + 1`
   * - Emits `WAYPOINT_ADDED` with the inserted index (via `insertWaypoint`)
   *
   * This is intended for UI actions like "Add waypoint after" in client apps.
   *
   * Constraints:
   * - Requires at least 2 waypoints
   * - `waypointIndex` must be < `waypointCount - 1` (cannot insert after the last waypoint)
   *
   * @param waypointIndex Existing waypoint index to insert after (0-based)
   * @returns The index of the newly inserted waypoint (typically `waypointIndex + 1`)
   * @throws Error if index is invalid or mission is not in PLANNING state
   */
  addWaypointAfter(waypointIndex: number): number;

  /**
   * Remove a waypoint by index from the mission plan.
   *
   * @param index The index of the waypoint to remove
   * @returns True if the waypoint was removed, false otherwise
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * try {
   *   const success = missionPlanner.removeWaypoint(1);
   *   if (success) {
   *     console.log('Waypoint removed successfully');
   *
   *     // Update UI to reflect the removed waypoint
   *     updateWaypointList();
   *   }
   * } catch (error) {
   *   console.error('Failed to remove waypoint:', error.message);
   * }
   * ```
   */
  removeWaypoint(index: number): boolean;

  /**
   * Update a waypoint's position and/or properties in the mission plan.
   *
   * @param index The index of the waypoint to update
   * @param properties The properties to update (including position if needed)
   * @returns True if the waypoint was updated, false otherwise
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * try {
   *   // Update a waypoint's position
   *   missionPlanner.updateWaypoint(0, {
   *     position: {
   *       latitude: 37.7753,
   *       longitude: -122.4198,
   *       altitude: 70
   *     }
   *   });
   *
   *   // Update a waypoint's orientation
   *   missionPlanner.updateWaypoint(0, {
   *     orientation: {
   *       heading: 180,
   *       pitch: 15,
   *       roll: 0
   *     }
   *   });
   *
   *   // Update a waypoint's custom properties
   *   missionPlanner.updateWaypoint(0, {
   *     properties: {
   *       speed: 7,
   *       hoverTime: 5
   *     }
   *   });
   * } catch (error) {
   *   console.error('Failed to update waypoint:', error.message);
   * }
   * ```
   */
  updateWaypoint(index: number, properties: Partial<WaypointData>): boolean;

  /**
   * Select a waypoint by index in the mission plan.
   * This will deselect any previously selected waypoint.
   *
   * @param index The index of the waypoint to select
   * @returns True if the waypoint was selected, false otherwise
   * @throws Error if index is out of bounds
   *
   * @example
   * ```typescript
   * // When user clicks a waypoint in the list
   * waypointListElement.addEventListener('click', (event) => {
   *   const index = parseInt(event.target.dataset.index, 10);
   *   try {
   *     const selected = missionPlanner.selectWaypoint(index);
   *     if (selected) {
   *       console.log('Selected waypoint at index:', index);
   *
   *       // Highlight the selected waypoint in UI
   *       highlightWaypointInList(index);
   *
   *       // Show waypoint details
   *       showWaypointDetails(missionPlanner.getWaypoint(index));
   *     }
   *   } catch (error) {
   *     console.error('Failed to select waypoint:', error.message);
   *   }
   * });
   * ```
   */
  selectWaypoint(index: number): boolean;

  /**
   * Sets an additional "multi-selected" overlay for waypoint markers.
   *
   * Important behavior:
   * - This is VISUAL ONLY: it does not change `selectedWaypointIndex` or `editingWaypointIndex`.
   * - No events are emitted.
   * - No camera movement occurs.
   *
   * This is intended for client-side multi-select UX (e.g. highlighting multiple waypoints)
   * while preserving the single selected waypoint used for editing.
   *
   * @param indices Waypoint indices (0-based) to visually highlight as selected.
   */
  setMultiSelectedWaypoints(indices: number[]): void;

  /**
   * Clears the multi-selected overlay and restores marker visuals based on the
   * current single selected/editing waypoint state.
   */
  clearMultiSelectedWaypoints(): void;

  /**
   * Returns the currently active multi-selected overlay indices.
   * This does not include the single selected waypoint unless it was also provided
   * via `setMultiSelectedWaypoints`.
   */
  getMultiSelectedWaypoints(): number[];

  /**
   * Toggles "multi-waypoint edit mode" visuals.
   *
   * When enabled:
   * - The planner will NOT visually emphasize the single selected/editing waypoint.
   * - The orientation model (if any) will be hidden.
   * - Multi-selected overlay markers (via `setMultiSelectedWaypoints`) continue to render as selected.
   *
   * This is intended for client multi-select UX where multiple waypoints are highlighted
   * while keeping the underlying single-selected state intact for business logic.
   *
   * No events are emitted and no camera movement occurs.
   */
  setMultiWaypointEditMode(enabled: boolean): void;

  /**
   * Returns whether multi-waypoint edit mode visuals are currently enabled.
   */
  getMultiWaypointEditMode(): boolean;

  /**
   * Enable/disable USER interactions for this mission planner on the map.
   *
   * When disabled:
   * - Map clicks will not set reference point or add waypoints
   * - Marker clicks will not select/enter edit mode
   * - Marker drag/position changes will be ignored
   * - Alt-drag reference altitude sync will be ignored
   *
   * This does NOT prevent programmatic API calls (e.g. addWaypoint/removeWaypoint)
   * from the client.
   */
  setUserInteractionsEnabled(enabled: boolean): void;

  /**
   * Returns whether user interactions are currently enabled.
   */
  getUserInteractionsEnabled(): boolean;

  /**
   * Put the currently selected waypoint into edit mode.
   *
   * @returns True if the waypoint was put into edit mode, false if no waypoint is selected
   * @throws Error if mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // When user clicks "Edit" button for selected waypoint
   * editButton.addEventListener('click', () => {
   *   try {
   *     const success = missionPlanner.enterEditMode();
   *     if (success) {
   *       console.log('Entered edit mode for waypoint:',
   *         missionPlanner.editingWaypointIndex);
   *
   *       // Show edit controls
   *       showEditControls();
   *     } else {
   *       console.log('No waypoint selected to edit');
   *       showMessage('Please select a waypoint first');
   *     }
   *   } catch (error) {
   *     console.error('Failed to enter edit mode:', error.message);
   *   }
   * });
   * ```
   */
  enterEditMode(): boolean;

  /**
   * Exit edit mode for the currently editing waypoint.
   * The waypoint will remain selected after exiting edit mode.
   *
   * @returns True if edit mode was exited, false if no waypoint was in edit mode
   *
   * @example
   * ```typescript
   * // When user clicks "Done Editing" button
   * doneEditingButton.addEventListener('click', () => {
   *   const success = missionPlanner.exitEditMode();
   *   if (success) {
   *     console.log('Exited edit mode, waypoint still selected');
   *
   *     // Hide edit controls
   *     hideEditControls();
   *
   *     // Show regular selection controls
   *     showSelectionControls();
   *   }
   * });
   * ```
   */
  exitEditMode(): boolean;

  /**
   * Reorder a waypoint to a new position in the sequence.
   *
   * @param fromIndex The current index of the waypoint
   * @param toIndex The target index for the waypoint
   * @returns True if the waypoint was reordered, false otherwise
   * @throws Error if either index is out of bounds or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // When user drags and drops a waypoint in the list
   * function handleWaypointDrop(fromIndex, toIndex) {
   *   try {
   *     const success = missionPlanner.reorderWaypoint(fromIndex, toIndex);
   *     if (success) {
   *       console.log(`Moved waypoint from ${fromIndex} to ${toIndex}`);
   *
   *       // Update the UI to reflect the new order
   *       updateWaypointList();
   *     }
   *   } catch (error) {
   *     console.error('Failed to reorder waypoint:', error.message);
   *
   *     // Revert the UI change
   *     updateWaypointList();
   *   }
   * }
   * ```
   */
  reorderWaypoint(fromIndex: number, toIndex: number): boolean;

  /**
   * Set the visibility of the mission plan on the map.
   *
   * @param visible Whether the mission plan should be visible
   *
   * @example
   * ```typescript
   * // Toggle mission visibility when checkbox is clicked
   * visibilityCheckbox.addEventListener('change', (event) => {
   *   missionPlanner.setVisibility(event.target.checked);
   * });
   *
   * // Initially hide the mission
   * missionPlanner.setVisibility(false);
   * ```
   */
  setVisibility(visible: boolean): void;

  /**
   * Set or update the takeoff mode for the mission.
   *
   * @param mode The takeoff mode to use (DIRECT_ASCENT or SAFE_TAKEOFF)
   * @throws Error if mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * try {
   *   // Update to safe takeoff mode
   *   missionPlanner.setTakeoffMode(TakeoffMode.SAFE_TAKEOFF);
   *   console.log('Takeoff mode updated');
   * } catch (error) {
   *   console.error('Failed to update takeoff mode:', error.message);
   * }
   * ```
   */
  setTakeoffMode(mode: TakeoffMode): void;

  /**
   * Set or update the safe takeoff altitude for the mission.
   * This setting is especially relevant when using SAFE_TAKEOFF mode.
   *
   * @param altitude The safe takeoff altitude in meters
   * @throws Error if mission is not in PLANNING state or altitude is negative
   *
   * @example
   * ```typescript
   * try {
   *   // Set the safe takeoff altitude to 30 meters
   *   missionPlanner.setTakeoffAltitude(30);
   *   console.log('Takeoff altitude updated');
   * } catch (error) {
   *   console.error('Failed to update takeoff altitude:', error.message);
   * }
   * ```
   */
  setTakeoffAltitude(altitude: number): void;

  /**
   * Complete the mission planning process and return the final mission data.
   * This will also clean up the mission visualization from the map.
   *
   * @returns The completed mission data containing reference point and waypoints
   * @throws Error if mission is not in PLANNING state or has fewer than 2 waypoints
   *
   * @example
   * ```typescript
   * // When user clicks "Complete Mission" button
   * completeMissionButton.addEventListener('click', () => {
   *   try {
   *     const missionData = missionPlanner.completeMission();
   *     console.log('Mission completed with', missionData.waypoints.length, 'waypoints');
   *
   *     // Send mission data to server
   *     saveMissionToServer(missionData);
   *
   *     // Navigate back to missions list
   *     navigateToMissionsList();
   *   } catch (error) {
   *     console.error('Failed to complete mission:', error.message);
   *
   *     // Show error to user
   *     showErrorMessage(error.message);
   *   }
   * });
   * ```
   */
  completeMission(): CompletedMissionData;

  /**
   * Cancel mission planning without saving.
   * This will clean up the mission visualization from the map.
   *
   * @example
   * ```typescript
   * // When user clicks "Cancel" button
   * cancelButton.addEventListener('click', () => {
   *   if (confirm('Are you sure you want to cancel this mission? All changes will be lost.')) {
   *     missionPlanner.cancelMission();
   *     console.log('Mission planning cancelled');
   *
   *     // Navigate back to missions list
   *     navigateToMissionsList();
   *   }
   * });
   * ```
   */
  cancelMission(): void;

  /**
   * Register an event handler for mission planning events.
   *
   * @param eventType The type of event to listen for
   * @param callback The callback function to execute when the event occurs
   *
   * @example
   * ```typescript
   * // Listen for waypoint added events
   * missionPlanner.onEvent(
   *   LinearMissionPlannerEventType.WAYPOINT_ADDED,
   *   (data) => {
   *     console.log(`Waypoint added at index ${data.waypointIndex}`);
   *
   *     // Update waypoint list UI
   *     updateWaypointList();
   *
   *     // Show success message
   *     showMessage('Waypoint added successfully');
   *   }
   * );
   *
   * // Listen for validation failures
   * missionPlanner.onEvent(
   *   LinearMissionPlannerEventType.MISSION_VALIDATION_FAILED,
   *   (data) => {
   *     console.error('Validation errors:', data.validationErrors);
   *
   *     // Show errors to user
   *     showValidationErrors(data.validationErrors);
   *   }
   * );
   * ```
   */
  onEvent(
    eventType: LinearMissionPlannerEventType,
    callback: (data: LinearMissionPlannerEventData) => void
  ): void;

  /**
   * Unregister an event handler.
   *
   * @param eventType The type of event to stop listening for
   * @param callback The callback function to remove
   *
   * @example
   * ```typescript
   * // Create a handler function
   * const waypointAddedHandler = (data) => {
   *   console.log(`Waypoint added at index ${data.waypointIndex}`);
   *   updateWaypointList();
   * };
   *
   * // Register the handler
   * missionPlanner.onEvent(
   *   LinearMissionPlannerEventType.WAYPOINT_ADDED,
   *   waypointAddedHandler
   * );
   *
   * // Later, when no longer needed, unregister the handler
   * missionPlanner.offEvent(
   *   LinearMissionPlannerEventType.WAYPOINT_ADDED,
   *   waypointAddedHandler
   * );
   * ```
   */
  offEvent(
    eventType: LinearMissionPlannerEventType,
    callback: (data: LinearMissionPlannerEventData) => void
  ): void;

  /**
   * Pans the camera to a specific waypoint by waypoint number.
   *
   * @param waypointNumber The waypoint number (1-based) to pan to
   * @returns True if the operation was successful, false if waypoint number is invalid
   *
   * @example
   * ```typescript
   * // Pan to waypoint 3 (the third waypoint in the mission)
   * const success = missionPlanner.panToWaypoint(3);
   * if (success) {
   *   console.log('Camera panned to waypoint 3');
   * } else {
   *   console.log('Invalid waypoint number or no waypoints exist');
   * }
   * ```
   */
  panToWaypoint(waypointNumber: number): boolean;

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
   *   console.log('No mission elements to pan to');
   * }
   * ```
   */
  panToMission(): boolean;

  /**
   * Gets the current mission route settings (readonly)
   *
   * @returns A readonly copy of the current mission route settings
   */
  readonly missionRouteSettings: Readonly<IMissionRouteSettings>;

  /**
   * Gets the current route altitude settings (readonly)
   *
   * @returns A readonly copy of the current route altitude settings
   */
  readonly routeAltitudeSettings: Readonly<IRouteAltitudeSettings>;

  /**
   * Updates mission-level route settings
   *
   * This method allows changing device yaw calculation modes during mission planning.
   * The change will trigger recomputation of orientation for any currently editing waypoint
   * and emit a ROUTE_SETTINGS_CHANGED event.
   *
   * @param routeSettings New route settings configuration
   * @throws Error if mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // Change to lock yaw axis mode
   * missionPlanner.updateMissionRouteSettings({
   *   deviceYawRouteSetting: {
   *     mode: DeviceYawRouteSettingsMode.LOCK_YAW_AXIS
   *   }
   * });
   *
   * // Change to along route mode
   * missionPlanner.updateMissionRouteSettings({
   *   deviceYawRouteSetting: {
   *     mode: DeviceYawRouteSettingsMode.ALONG_ROUTE
   *   }
   * });
   * ```
   */
  updateMissionRouteSettings(routeSettings: IMissionRouteSettings): void;

  /**
   * Updates route altitude settings
   *
   * This method allows changing the altitude type and value for waypoints.
   * When altitude settings change, all existing waypoints will be updated to reflect
   * the new altitude reference and values. The method handles both type changes
   * (AGL ↔ RLT) and value changes within the same type.
   * Emits a ROUTE_SETTINGS_CHANGED event and WAYPOINTS_ALTITUDE_UPDATED event.
   *
   * @param altitudeSettings New altitude settings configuration
   * @throws Error if mission is not in PLANNING state
   * @returns Promise that resolves when all waypoints have been updated
   *
   * @example
   * ```typescript
   * // Change to AGL mode with 100m altitude (existing waypoints will be updated)
   * await missionPlanner.updateRouteAltitudeSettings({
   *   type: 'AGL',
   *   value: 100
   * });
   *
   * // Change to RLT mode with 50m altitude (existing waypoints will be updated)
   * await missionPlanner.updateRouteAltitudeSettings({
   *   type: 'RLT',
   *   value: 50
   * });
   * ```
   */
  updateRouteAltitudeSettings(
    altitudeSettings: IRouteAltitudeSettings
  ): Promise<void>;

  /**
   * Computes orientation for a specific waypoint on-demand
   *
   * This method calculates device yaw based on the current route settings mode
   * and returns an orientation object with both legacy properties (for compatibility)
   * and new extended properties (for orientation model).
   *
   * @param index Waypoint index to compute orientation for
   * @returns Computed orientation with both legacy and new properties
   * @throws Error if waypoint index is invalid
   *
   * @example
   * ```typescript
   * // Get orientation for first waypoint (for orientation model)
   * const orientation = missionPlanner.computeWaypointOrientation(0);
   * console.log('Heading for map:', orientation.heading);
   * console.log('Pitch for map:', orientation.pitch);
   * console.log('Roll for map:', orientation.roll);
   *
   * // Get mission-specific orientation data (for UI display)
   * const orientationData = missionPlanner.computeWaypointOrientationData(0);
   * console.log('Device yaw:', orientationData.deviceYaw);
   * console.log('Gimbal yaw:', orientationData.gimbalYaw);
   * console.log('Gimbal tilt:', orientationData.gimbalTilt);
   *
   * // Use in orientation display
   * updateOrientationUI({
   *   heading: orientation.heading,
   *   pitch: orientation.pitch,
   *   roll: orientation.roll,
   *   deviceYaw: orientationData.deviceYaw,
   *   gimbalYaw: orientationData.gimbalYaw,
   *   gimbalTilt: orientationData.gimbalTilt
   * });
   * ```
   */
  computeWaypointOrientation(index: number): IOrientation;

  /**
   * Computes mission-specific waypoint orientation data at runtime
   * Returns waypoint-specific computed values for device and gimbal control
   * without storing them permanently in waypoint data
   *
   * @param index Waypoint index to compute orientation data for
   * @returns Runtime-computed waypoint orientation data with device and gimbal values
   * @throws Error if waypoint index is invalid
   *
   * @example
   * ```typescript
   * // Get mission-specific orientation data for display or control
   * const waypointData = missionPlanner.computeWaypointOrientationData(0);
   * console.log('Device yaw:', waypointData.deviceYaw);
   * console.log('Gimbal yaw:', waypointData.gimbalYaw);
   * console.log('Gimbal tilt:', waypointData.gimbalTilt);
   *
   * // Use for UI display of orientation controls
   * updateOrientationControls({
   *   deviceYaw: waypointData.deviceYaw,
   *   gimbalYaw: waypointData.gimbalYaw,
   *   gimbalTilt: waypointData.gimbalTilt
   * });
   * ```
   */
  computeWaypointOrientationData(index: number): IWaypointOrientation;

  /**
   * Computes base device yaw without considering deviceYawAction values
   * This is used to get the underlying flight path direction before any user-defined offsets
   *
   * @param index Waypoint index to compute base yaw for
   * @returns Base device yaw in degrees (without deviceYawAction offset)
   * @throws Error if waypoint index is invalid or no reference point available
   */
  computeBaseDeviceYaw(index: number): number;

  /**
   * Get all waypoints with extended position information including AGL altitude.
   * This method performs batch terrain sampling for optimal performance when multiple
   * waypoints need AGL information simultaneously.
   *
   * @returns Promise that resolves to an array of waypoints with extended position data
   * @throws Error if terrain service is unavailable or terrain sampling fails
   *
   * @example
   * ```typescript
   * try {
   *   const waypointsWithAGL = await missionPlanner.getWaypointsWithExtendedPosition();
   *
   *   // Display waypoints with AGL information
   *   waypointsWithAGL.forEach((waypoint, index) => {
   *     console.log(`Waypoint ${index + 1}:`);
   *     console.log(`  RLT Altitude: ${waypoint.position.altitude}m`);
   *     console.log(`  AGL Altitude: ${waypoint.extendedPosition.aglAltitude}m`);
   *   });
   *
   *   // Update UI with AGL values
   *   updateWaypointListWithAGL(waypointsWithAGL);
   * } catch (error) {
   *   console.error('Failed to get waypoints with AGL:', error.message);
   *   showErrorMessage('Unable to calculate AGL altitudes');
   * }
   * ```
   */
  getWaypointsWithExtendedPosition(): Promise<
    WaypointDataWithExtendedPosition[]
  >;

  /**
   * Get a specific waypoint with extended position information including AGL altitude.
   *
   * @param index The index of the waypoint to get extended position for
   * @returns Promise that resolves to waypoint with extended position data, or null if index is invalid
   * @throws Error if terrain service is unavailable or terrain sampling fails
   *
   * @example
   * ```typescript
   * try {
   *   const waypointWithAGL = await missionPlanner.getWaypointExtendedPosition(0);
   *
   *   if (waypointWithAGL) {
   *     console.log('First waypoint AGL altitude:', waypointWithAGL.extendedPosition.aglAltitude);
   *
   *     // Update altitude input field with AGL value
   *     document.getElementById('agl-altitude').value = waypointWithAGL.extendedPosition.aglAltitude;
   *   }
   * } catch (error) {
   *   console.error('Failed to get waypoint AGL:', error.message);
   *   showErrorMessage('Unable to calculate AGL altitude for this waypoint');
   * }
   * ```
   */
  getWaypointExtendedPosition(
    index: number
  ): Promise<WaypointDataWithExtendedPosition | null>;

  /**
   * Get the reference point with extended position information including AGL altitude.
   *
   * @returns Promise that resolves to reference point with extended position data, or null if no reference point is set
   * @throws Error if terrain service is unavailable or terrain sampling fails
   *
   * @example
   * ```typescript
   * try {
   *   const referenceWithAGL = await missionPlanner.getReferencePointExtendedPosition();
   *
   *   if (referenceWithAGL) {
   *     console.log('Reference point AGL altitude:', referenceWithAGL.aglAltitude);
   *
   *     // Update reference point display with AGL
   *     updateReferencePointDisplay({
   *       rlt: referenceWithAGL.altitude,
   *       agl: referenceWithAGL.aglAltitude
   *     });
   *   }
   * } catch (error) {
   *   console.error('Failed to get reference point AGL:', error.message);
   * }
   * ```
   */
  getReferencePointExtendedPosition(): Promise<IWaypointPosition | null>;

  /**
   * Get the AGL altitude for a specific waypoint.
   * This is a convenience method that returns only the AGL altitude value.
   *
   * @param index The index of the waypoint
   * @returns Promise that resolves to the AGL altitude in meters, or null if index is invalid
   * @throws Error if terrain service is unavailable or terrain sampling fails
   *
   * @example
   * ```typescript
   * try {
   *   const aglAltitude = await missionPlanner.getWaypointAGLAltitude(0);
   *
   *   if (aglAltitude !== null) {
   *     console.log('Waypoint 1 AGL altitude:', aglAltitude, 'meters');
   *
   *     // Simple AGL display update
   *     document.getElementById('waypoint-agl').textContent = `${aglAltitude}m AGL`;
   *   }
   * } catch (error) {
   *   console.error('Failed to get waypoint AGL altitude:', error.message);
   * }
   * ```
   */
  getWaypointAGLAltitude(index: number): Promise<number | null>;

  /**
   * Get the AGL altitude for the reference point.
   * This is a convenience method that returns only the AGL altitude value.
   *
   * @returns Promise that resolves to the AGL altitude in meters, or null if no reference point is set
   * @throws Error if terrain service is unavailable or terrain sampling fails
   *
   * @example
   * ```typescript
   * try {
   *   const referenceAGL = await missionPlanner.getReferencePointAGL();
   *
   *   if (referenceAGL !== null) {
   *     console.log('Reference point AGL altitude:', referenceAGL, 'meters');
   *
   *     // Update reference point AGL display
   *     document.getElementById('reference-agl').textContent = `${referenceAGL}m AGL`;
   *   }
   * } catch (error) {
   *   console.error('Failed to get reference point AGL altitude:', error.message);
   * }
   * ```
   */
  getReferencePointAGL(): Promise<number | null>;

  /**
   * Updates whether a waypoint should follow route altitude settings.
   * When changed from false to true, the waypoint altitude will be updated to match current route settings.
   * When changed from true to false, the waypoint maintains its current altitude independently.
   *
   * This is a form-driven action, so no events are emitted as the form controls this setting.
   *
   * @param index The index of the waypoint to update
   * @param followRoute Whether the waypoint should follow route altitude settings
   * @returns Promise<boolean> True if the setting was updated successfully
   * @throws Error if index is out of bounds or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // Make waypoint 0 follow route settings (will update altitude immediately)
   * await missionPlanner.updateWaypointFollowRoute(0, true);
   *
   * // Make waypoint 1 independent of route settings (keeps current altitude)
   * await missionPlanner.updateWaypointFollowRoute(1, false);
   * ```
   */
  updateWaypointFollowRoute(
    index: number,
    followRoute: boolean
  ): Promise<boolean>;

  /**
   * Updates the device yaw action for a specific waypoint with type-aware calculation
   * This sets a custom yaw angle for the waypoint, overriding mission-level route settings
   *
   * @param waypointIndex The index of the waypoint to update
   * @param value The raw user input value (-180 to 180)
   * @param type The type of yaw reference (FLIGHT_PATH or NORTH)
   * @returns True if the update was successful
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // Set waypoint 0 to face 30° relative to flight path
   * missionPlanner.updateDeviceYawActionValue(0, 30, DroneYawActionTypes.FLIGHT_PATH);
   *
   * // Set waypoint 2 to face 90° from north (absolute)
   * missionPlanner.updateDeviceYawActionValue(2, 90, DroneYawActionTypes.NORTH);
   * ```
   */
  updateDeviceYawActionValue(
    waypointIndex: number,
    value: number,
    type: DroneYawActionTypes
  ): boolean;

  /**
   * Removes the device yaw action from a specific waypoint
   * The waypoint will then follow the mission-level route device yaw mode
   *
   * @param waypointIndex The index of the waypoint to clear
   * @returns True if the action was removed
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // Clear custom yaw action for waypoint 1
   * missionPlanner.clearDeviceYawAction(1);
   * ```
   */
  clearDeviceYawAction(waypointIndex: number): boolean;

  /**
   * Checks if a waypoint has a specific device yaw action set
   *
   * @param waypointIndex The index of the waypoint to check
   * @returns True if the waypoint has a device yaw action, false otherwise
   *
   * @example
   * ```typescript
   * // Check if waypoint 0 has a custom yaw action
   * const hasCustomYaw = missionPlanner.hasDeviceYawAction(0);
   * if (hasCustomYaw) {
   *   console.log('Waypoint 0 has a custom yaw action');
   * }
   * ```
   */
  hasDeviceYawAction(waypointIndex: number): boolean;

  /**
   * Updates whether a waypoint follows route approach settings or uses custom approach mode
   * @param waypointIndex Index of the waypoint to update
   * @param followRoute Whether to follow mission route approach settings
   * @returns True if update was successful
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // Make waypoint 0 follow route approach settings
   * missionPlanner.updateWaypointApproachFollowRoute(0, true);
   *
   * // Make waypoint 1 use custom approach mode
   * missionPlanner.updateWaypointApproachFollowRoute(1, false);
   * ```
   */
  updateWaypointApproachFollowRoute(
    waypointIndex: number,
    followRoute: boolean
  ): boolean;

  /**
   * Updates the next waypoint approach mode (only relevant when followRoute = false)
   * @param waypointIndex Index of the waypoint to update
   * @param mode Custom approach mode to use
   * @returns True if update was successful
   * @throws Error if waypoint index is invalid or mission is not in PLANNING state
   *
   * @example
   * ```typescript
   * // Set waypoint 0 to use AUTO_ADJUST approach
   * missionPlanner.updateWaypointApproachMode(0, NextWaypointApproachMode.AUTO_ADJUST);
   *
   * // Set waypoint 1 to use ALONG_ROUTE approach
   * missionPlanner.updateWaypointApproachMode(1, NextWaypointApproachMode.ALONG_ROUTE);
   * ```
   */
  updateWaypointApproachMode(
    waypointIndex: number,
    mode: NextWaypointApproachMode
  ): boolean;

  /**
   * Gets the approach settings for a waypoint
   * @param waypointIndex Index of the waypoint
   * @returns Approach settings or null if waypoint doesn't exist
   *
   * @example
   * ```typescript
   * const settings = missionPlanner.getWaypointApproachSettings(0);
   * if (settings) {
   *   console.log('Follows route:', settings.followRoute);
   *   console.log('Approach mode:', settings.nextWaypointApproachMode);
   * }
   * ```
   */
  getWaypointApproachSettings(
    waypointIndex: number
  ): IWaypointApproachSettings | null;

  /**
   * Checks if waypoint follows route settings
   * @param waypointIndex Index of the waypoint
   * @returns True if waypoint follows route settings
   *
   * @example
   * ```typescript
   * const followsRoute = missionPlanner.isWaypointFollowingRoute(0);
   * console.log('Waypoint 0 follows route:', followsRoute);
   * ```
   */
  isWaypointFollowingRoute(waypointIndex: number): boolean;

  /**
   * Clean up all resources associated with this mission planner.
   * This should be called when the mission planner is no longer needed.
   *
   * @example
   * ```typescript
   * // When navigating away from mission planning page
   * function leaveMissionPlanner() {
   *   // Clean up resources
   *   missionPlanner.dispose();
   *
   *   // Clear reference
   *   missionPlanner = null;
   * }
   *
   * // Make sure to clean up when component unmounts
   * window.addEventListener('beforeunload', () => {
   *   if (missionPlanner) {
   *     missionPlanner.dispose();
   *   }
   * });
   * ```
   */
  dispose(): void;
}
