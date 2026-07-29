import { IPosition } from '@map/public/contracts/base';

/**
 * Events emitted by the Grid Mission Planner during mission creation and editing.
 *
 * Subscribe to these events to receive notifications about changes to the mission state,
 * takeoff point, polygon, grid waypoints, and grid settings.
 *
 * @enum {string}
 * @category Events
 * @public
 */
export enum GridMissionPlannerEventType {
  /**
   * Emitted when a takeoff point is added to the grid mission.
   * This occurs during the two-click creation flow when the first click is placed.
   *
   * Event data includes:
   * - takeoffPoint: The position of the newly added takeoff point
   */
  TAKEOFF_POINT_ADDED = 'gridMissionPlanner:takeoffPointAdded',

  /**
   * Emitted when the takeoff point position is changed (e.g., when dragged).
   *
   * Event data includes:
   * - takeoffPoint: The new position of the takeoff point
   */
  TAKEOFF_POINT_CHANGED = 'gridMissionPlanner:takeoffPointChanged',

  /**
   * Emitted when a polygon is created from the two-click flow.
   * This occurs when the second click is placed, creating the grid boundary.
   *
   * Event data includes:
   * - polygonVertices: The vertices of the created polygon
   */
  POLYGON_CREATED = 'gridMissionPlanner:polygonCreated',

  /**
   * Emitted when polygon vertices are modified (e.g., when a vertex is dragged).
   *
   * Event data includes:
   * - polygonVertices: The updated vertices of the polygon
   */
  POLYGON_VERTICES_CHANGED = 'gridMissionPlanner:polygonVerticesChanged',

  /**
   * Emitted when grid waypoints are updated.
   * This occurs when the polygon changes, grid settings change, or the grid is recalculated.
   *
   * Event data includes:
   * - gridWaypoints: The grid waypoints (excluding takeoff point)
   * - completeMissionPath: The complete mission path including takeoff point
   * - polygonVertices: The current polygon vertices
   */
  GRID_WAYPOINTS_UPDATED = 'gridMissionPlanner:gridWaypointsUpdated',

  /**
   * Emitted when the grid angle is changed.
   *
   * Event data includes:
   * - gridAngle: The new grid angle in degrees
   */
  GRID_ANGLE_CHANGED = 'gridMissionPlanner:gridAngleChanged',

  /**
   * Emitted when the grid spacing is changed.
   *
   * Event data includes:
   * - gridSpacing: The new grid spacing in meters
   */
  GRID_SPACING_CHANGED = 'gridMissionPlanner:gridSpacingChanged',

  /**
   * Emitted when the grid altitude is changed.
   *
   * Event data includes:
   * - gridAltitude: The new grid altitude in meters (HAE)
   */
  GRID_ALTITUDE_CHANGED = 'gridMissionPlanner:gridAltitudeChanged',

  /**
   * Emitted when the planner state changes.
   * States include: AWAITING_FIRST_CLICK, AWAITING_SECOND_CLICK, READY
   *
   * Event data includes:
   * - oldState: The previous state
   * - newState: The new state
   */
  STATE_CHANGED = 'gridMissionPlanner:stateChanged',

  /**
   * Emitted when the grid mission is cancelled.
   *
   * Event data will not include additional properties beyond eventType.
   */
  MISSION_CANCELLED = 'gridMissionPlanner:cancelled',
}

/**
 * Data structure for events emitted by the Grid Mission Planner.
 * The properties included in the event data depend on the event type.
 *
 * @interface GridMissionPlannerEventData
 * @category Events
 * @public
 */
export interface GridMissionPlannerEventData {
  /**
   * The type of event that occurred.
   */
  eventType: GridMissionPlannerEventType;

  /**
   * Takeoff point position in HAE coordinates, if applicable.
   * Present for TAKEOFF_POINT_ADDED and TAKEOFF_POINT_CHANGED events.
   */
  takeoffPoint?: IPosition;

  /**
   * Polygon vertices in HAE coordinates, if applicable.
   * Present for POLYGON_CREATED, POLYGON_VERTICES_CHANGED, and GRID_WAYPOINTS_UPDATED events.
   */
  polygonVertices?: IPosition[];

  /**
   * Grid waypoints (excluding takeoff point) in HAE coordinates, if applicable.
   * Present for GRID_WAYPOINTS_UPDATED events.
   */
  gridWaypoints?: IPosition[];

  /**
   * Complete mission path including takeoff point and grid waypoints, if applicable.
   * Present for GRID_WAYPOINTS_UPDATED events.
   */
  completeMissionPath?: IPosition[];

  /**
   * Previous state, if applicable.
   * Present for STATE_CHANGED events.
   */
  oldState?: string;

  /**
   * New state, if applicable.
   * Present for STATE_CHANGED events.
   */
  newState?: string;

  /**
   * Grid angle in degrees, if applicable.
   * Present for GRID_ANGLE_CHANGED events.
   */
  gridAngle?: number;

  /**
   * Grid spacing in meters, if applicable.
   * Present for GRID_SPACING_CHANGED events.
   */
  gridSpacing?: number;

  /**
   * Grid altitude in meters (HAE), if applicable.
   * Present for GRID_ALTITUDE_CHANGED events.
   */
  gridAltitude?: number;
}
