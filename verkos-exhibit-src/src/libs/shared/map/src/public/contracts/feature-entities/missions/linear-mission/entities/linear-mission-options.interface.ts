import { IPosition } from '@map/public/contracts/base';
import { TakeoffMode, WaypointData } from './linear-mission-planner.interface';

/**
 * Configuration options for creating a LinearMissionView entity
 */
export interface ILinearMissionOptions {
  /**
   * Optional unique identifier for the mission
   * If not provided, a UUID will be generated
   */
  id?: string;

  /**
   * Optional name for the mission
   * This can be used for display purposes in the UI
   */
  name?: string;

  /**
   * Reference point (starting position) of the mission
   * This is required and serves as the first point in the mission
   */
  referencePoint: IPosition;

  /**
   * Array of waypoints that define the mission path
   * Each waypoint includes position and optional orientation data
   */
  waypoints: WaypointData[];

  /**
   * Optional flag to set the initial visibility state
   * Defaults to true if not specified
   */
  isVisible?: boolean;

  /**
   * Optional flag to set the initial selection state
   * Defaults to false if not specified
   */
  isSelected?: boolean;

  /**
   * Takeoff mode for the mission
   * Determines how the path from reference point to first waypoint is generated
   */
  takeoffMode: TakeoffMode;

  /**
   * Takeoff altitude in meters
   * Minimum value of 2 meters is enforced for safety
   */
  takeoffAltitude: number;
}
