import { IPosition } from '@map/public/contracts/base';
import {
  ILinearMissionOptions,
  ILinearMissionPlanner,
  ILinearMissionPlannerOptions,
  ILinearMissionView,
  WaypointData,
} from '../entities';

/**
 * Interface for the Mission Planner Manager
 * Handles creation, retrieval, and management of mission planning
 * Only one linear mission can be planned at a time
 */
export interface IMissionPlannerManager {
  /**
   * Create a new linear mission instance
   * If another linear mission is currently being planned, it will be cancelled first
   * @param options Configuration options for the linear mission planner, including:
   *               - id (optional): Unique identifier
   *               - initialReferencePoint (optional): If provided, mission starts in PLANNING state
   *               - takeoffMode (required): DIRECT_ASCENT or SAFE_TAKEOFF
   *               - takeoffAltitude (required): Altitude in meters for takeoff
   * @returns A new linear mission planner instance
   */
  createNewLinearMission(
    options: ILinearMissionPlannerOptions
  ): ILinearMissionPlanner;

  /**
   * Load an existing linear mission for editing
   * If another linear mission is currently being planned, it will be cancelled first
   * @param referencePoint Required reference point for the mission
   * @param waypoints Array of waypoint data for the mission
   * @param options Configuration options for the linear mission planner, including:
   *               - id (optional): Unique identifier
   *               - takeoffMode (required): DIRECT_ASCENT or SAFE_TAKEOFF
   *               - takeoffAltitude (required): Altitude in meters for takeoff
   * @returns A linear mission planner instance initialized with the provided data
   */
  editLinearMission(
    referencePoint: IPosition,
    waypoints: WaypointData[],
    options: Omit<ILinearMissionPlannerOptions, 'initialReferencePoint'>
  ): ILinearMissionPlanner;

  /**
   * Get the current linear mission being planned, if any
   * @returns The current linear mission planner instance, or undefined if none exists
   */
  getCurrentLinearMission(): ILinearMissionPlanner | undefined;

  /**
   * Create a read-only linear mission view entity
   * This method is used to display completed missions that are not being edited
   *
   * @param options Configuration options for the linear mission view
   * @returns A new linear mission view instance
   */
  plotLinearMissionView(options: ILinearMissionOptions): ILinearMissionView;

  /**
   * Get a plotted linear mission by its ID
   * @param id The unique identifier of the mission
   * @returns The linear mission view if found, undefined otherwise
   */
  getPlottedLinearMissionViewById(id: string): ILinearMissionView | undefined;

  /**
   * Get all currently plotted linear missions
   * @returns Array of all linear mission views
   */
  getAllPlottedLinearMissionView(): ILinearMissionView[];

  /**
   * Remove a plotted linear mission by its ID
   * @param id The unique identifier of the mission to remove
   * @returns True if the mission was found and removed, false otherwise
   */
  removePlottedLinearMissionView(id: string): boolean;
}
