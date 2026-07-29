import {
  ILinearMissionOptions,
  ILinearMissionPlanner,
  ILinearMissionPlannerOptions,
  ILinearMissionView,
  IMissionPlannerManager,
  IPosition,
  WaypointData,
} from '@map/public/contracts';
import { ICompositeManager } from '@map/private/contracts';
import { LinearMissionView, LinearMissionPlanner } from '../entities';

/**
 * Implementation of the IMissionPlannerManager interface
 * Handles creation, retrieval, and management of mission planning
 * Only one linear mission can be planned at a time
 */
export class MissionPlannerManager implements IMissionPlannerManager {
  // Current active linear mission planner (only one allowed at a time)
  private _currentLinearMission: ILinearMissionPlanner | undefined;

  // Collection of read-only linear mission views
  private _linearMissionViews: Map<string, ILinearMissionView> = new Map();

  /**
   * Constructor for MissionPlannerManager
   * @param compositeManager Manager for creating and managing composite entities
   */
  constructor(private readonly _compositeManager: ICompositeManager) {}

  /**
   * Create a new linear mission instance
   * If another linear mission is currently being planned, it will be cancelled first
   * @param options Configuration options for the linear mission planner
   * @returns A new linear mission planner instance
   */
  public createNewLinearMission(
    options: ILinearMissionPlannerOptions
  ): ILinearMissionPlanner {
    // Cancel any existing mission first
    this._cancelmissionBeingEdited();

    // Create a new LinearMissionPlanner instance
    const linearMission = new LinearMissionPlanner(
      this._compositeManager,
      options
    );

    // Store as current mission
    this._currentLinearMission = linearMission;

    return linearMission;
  }

  /**
   * Load an existing linear mission for editing
   * If another linear mission is currently being planned, it will be cancelled first
   * @param referencePoint Required reference point for the mission
   * @param waypoints Array of waypoint data for the mission
   * @param options Configuration options for the linear mission planner
   * @returns A linear mission planner instance initialized with the provided data
   */
  public editLinearMission(
    referencePoint: IPosition,
    waypoints: WaypointData[],
    options: Omit<ILinearMissionPlannerOptions, 'initialReferencePoint'>
  ): ILinearMissionPlanner {
    // Cancel any existing mission first
    this._cancelmissionBeingEdited();

    // Create a combined options object with the reference point
    const fullOptions: ILinearMissionPlannerOptions = {
      ...options,
      initialReferencePoint: referencePoint,
    };

    // Create a new LinearMissionPlanner instance
    const linearMission = new LinearMissionPlanner(
      this._compositeManager,
      fullOptions
    );

    // Add all waypoints to the mission
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];

      // Add the waypoint first
      const waypointIndex = linearMission.addWaypoint(waypoint.position, {
        orientation: waypoint.orientation,
        properties: waypoint.properties,
        followRouteAltitude: waypoint.followRouteAltitude,
      });

      // Apply deviceYawAction if present
      if (waypoint.deviceYawAction) {
        // Use the original value and type from the app
        linearMission.updateDeviceYawActionValue(
          waypointIndex,
          waypoint.deviceYawAction.value,
          waypoint.deviceYawAction.type
        );
      }

      // Apply approach settings if present
      if (waypoint.approachSettings) {
        // Update follow route setting
        linearMission.updateWaypointApproachFollowRoute(
          waypointIndex,
          waypoint.approachSettings.followRoute
        );

        // Update approach mode if specified
        if (waypoint.approachSettings.nextWaypointApproachMode) {
          linearMission.updateWaypointApproachMode(
            waypointIndex,
            waypoint.approachSettings.nextWaypointApproachMode
          );
        }
      }
    }

    // Store as current mission
    this._currentLinearMission = linearMission;

    return linearMission;
  }

  /**
   * Get the current linear mission being planned, if any
   * @returns The current linear mission planner instance, or undefined if none exists
   */
  public getCurrentLinearMission(): ILinearMissionPlanner | undefined {
    return this._currentLinearMission;
  }

  /**
   * Create a read-only linear mission view entity
   * This method is used to display completed missions that are not being edited
   *
   * @param options Configuration options for the linear mission view
   * @returns A new linear mission view instance
   */
  public plotLinearMissionView(
    options: ILinearMissionOptions
  ): ILinearMissionView {
    // Create a new read-only LinearMissionView view
    const linearMissionView = new LinearMissionView(
      this._compositeManager,
      options
    );

    // Store the linear mission view for tracking
    this._linearMissionViews.set(linearMissionView.id, linearMissionView);

    return linearMissionView;
  }

  /**
   * Get a plotted linear mission by its ID
   * @param id The unique identifier of the mission
   * @returns The linear mission view if found, undefined otherwise
   */
  public getPlottedLinearMissionViewById(
    id: string
  ): ILinearMissionView | undefined {
    return this._linearMissionViews.get(id);
  }

  /**
   * Get all currently plotted linear missions
   * @returns Array of all linear mission views
   */
  public getAllPlottedLinearMissionView(): ILinearMissionView[] {
    return Array.from(this._linearMissionViews.values());
  }

  /**
   * Remove a plotted linear mission by its ID
   * @param id The unique identifier of the mission to remove
   * @returns True if the mission was found and removed, false otherwise
   */
  public removePlottedLinearMissionView(id: string): boolean {
    const mission = this._linearMissionViews.get(id);
    if (mission) {
      // Remove the mission from the map visualization
      mission.remove();
      // Remove from our tracking collection
      this._linearMissionViews.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Cancel the current mission if one exists
   * @private
   */
  private _cancelmissionBeingEdited(): void {
    if (this._currentLinearMission) {
      this._currentLinearMission.cancelMission();
      this._currentLinearMission = undefined;
    }
  }

  /**
   * Clean up all resources when manager is no longer needed
   * Called by the map when it's disposing entities
   */
  public dispose(): void {
    // Cancel any active mission planner
    // this._cancelCurrentMission();

    // Remove all linear mission views
    this._linearMissionViews.forEach((mission) => {
      mission.remove();
    });
    this._linearMissionViews.clear();
  }
}
