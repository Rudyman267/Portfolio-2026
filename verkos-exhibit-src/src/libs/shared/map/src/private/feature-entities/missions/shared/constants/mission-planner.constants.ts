/**
 * Constants for the Mission Planner feature
 */

/**
 * Asset paths for mission planner visual elements
 */
export enum MissionPlannerAssetPaths {
  REFERENCE_POINT = 'assets/mission-planner/reference-point.svg',
  WAYPOINT_NORMAL = 'assets/mission-planner/non-selected-waypoint.svg',
  WAYPOINT_SELECTED = 'assets/mission-planner/selected-waypoint.svg',
  WAYPOINT_EDITING = 'assets/mission-planner/edit-waypoint-state.svg',
  ORIENTATION_MODEL = 'assets/mission-planner/drone-model.glb',
}

/**
 * Configuration values for mission elements
 */
export enum MissionPlannerConfig {
  /**
   * @deprecated Use routeAltitudeSettings in ILinearMissionPlannerOptions instead
   * This constant is kept for backward compatibility only
   */
  DEFAULT_ALTITUDE_OFFSET = 500, // Default altitude offset for new waypoints (deprecated)
  DEFAULT_PATH_WIDTH = 5, // Width of the mission path line
  DEFAULT_MARKER_SCALE = 1.0, // Default scale for markers
}

/**
 * Entity name prefixes for identifying mission planner entities
 */
export const MissionPlannerEntityPrefixes = {
  REFERENCE_POINT: 'reference-point',
  WAYPOINT: 'waypoint',
  MISSION_PATH: 'mission-path',
  TAKEOFF_PATH: 'takeoff-path',
  WAYPOINT_PATH: 'waypoint-path',
  ORIENTATION_MODEL: 'orientation-model',
};

/**
 * Validation requirements for missions
 */
export const MissionPlannerValidation = {
  MINIMUM_WAYPOINTS: 2, // Minimum number of waypoints for a valid mission
};

/**
 * Debug configuration
 */
export const MissionPlannerDebug = {
  ENABLE_LOGGING: false, // Set to true to enable debug logging
};

/**
 * Backwards compatibility export to avoid breaking changes
 */
export const MissionPlannerConstants = {
  AssetPaths: MissionPlannerAssetPaths,
  Config: MissionPlannerConfig,
  EntityPrefixes: MissionPlannerEntityPrefixes,
  Validation: MissionPlannerValidation,
  Debug: MissionPlannerDebug,
};
