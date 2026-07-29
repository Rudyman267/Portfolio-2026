import {
  LinearMissionPlannerEventData,
  LinearMissionPlannerEventType,
  LinearMissionPlannerState,
} from '@map/public/contracts';
import { EventService } from '@map/private/feature-entities/missions/shared';

/**
 * Manages the state of the LinearMissionPlanner
 * Handles state transitions and validation
 */
export class StateService {
  private _state: LinearMissionPlannerState =
    LinearMissionPlannerState.AWAITING_REFERENCE;
  private _selectedIndex = -1;
  private _editingIndex = -1;

  /**
   * Create a new StateService
   * @param eventService The event service for emitting state change events
   */
  constructor(
    private readonly _eventService: EventService<
      LinearMissionPlannerEventType,
      LinearMissionPlannerEventData
    >
  ) {}

  /**
   * Get the current state
   */
  public get state(): LinearMissionPlannerState {
    return this._state;
  }

  /**
   * Get the selected waypoint index
   */
  public get selectedWaypointIndex(): number {
    return this._selectedIndex;
  }

  /**
   * Set the selected waypoint index
   */
  public set selectedWaypointIndex(index: number) {
    this._selectedIndex = index;
  }

  /**
   * Get the editing waypoint index
   */
  public get editingWaypointIndex(): number {
    return this._editingIndex;
  }

  /**
   * Set the editing waypoint index
   */
  public set editingWaypointIndex(index: number) {
    this._editingIndex = index;
  }

  /**
   * Transition from one state to another
   * @param newState The new state to transition to
   * @returns True if transition was successful, false if invalid
   */
  public transitionToState(newState: LinearMissionPlannerState): boolean {
    // Check if it's a valid transition
    if (!this._isValidTransition(this._state, newState)) {
      return false;
    }

    if (this._state === newState) {
      return true; // Already in this state, consider it successful
    }

    const oldState = this._state;
    this._state = newState;

    // Emit state changed event
    this._eventService.emitEvent(LinearMissionPlannerEventType.STATE_CHANGED, {
      oldState,
      newState,
    });

    return true;
  }

  /**
   * Check if a state transition is valid
   * @param fromState The current state
   * @param toState The target state
   * @returns True if the transition is valid
   */
  private _isValidTransition(
    fromState: LinearMissionPlannerState,
    toState: LinearMissionPlannerState
  ): boolean {
    switch (fromState) {
      case LinearMissionPlannerState.AWAITING_REFERENCE:
        // From AWAITING_REFERENCE, can only go to PLANNING
        return toState === LinearMissionPlannerState.PLANNING;

      case LinearMissionPlannerState.PLANNING:
        // From PLANNING, can go back to AWAITING_REFERENCE (when canceling/completing)
        return toState === LinearMissionPlannerState.AWAITING_REFERENCE;

      default:
        return false;
    }
  }

  /**
   * Check if the mission plan can have waypoints added
   * @returns True if the mission is in a state where waypoints can be added
   */
  public canAddWaypoints(): boolean {
    return this._state === LinearMissionPlannerState.PLANNING;
  }

  /**
   * Check if the mission plan can have waypoints edited
   * @param waypointCount The current number of waypoints
   * @returns True if the mission is in a state where waypoints can be edited
   */
  public canEditWaypoints(waypointCount: number): boolean {
    return (
      this._state === LinearMissionPlannerState.PLANNING && waypointCount > 0
    );
  }

  /**
   * Update waypoint selection state
   * @param index The index of the waypoint to select, or -1 to deselect all
   * @returns True if selection changed, false otherwise
   */
  public selectWaypoint(index: number): boolean {
    if (this._selectedIndex === index) {
      return false; // No change
    }

    this._selectedIndex = index;
    return true;
  }

  /**
   * Enter edit mode for the currently selected waypoint
   * @returns True if edit mode was entered, false otherwise
   */
  public enterEditMode(): boolean {
    if (this._state !== LinearMissionPlannerState.PLANNING) {
      return false;
    }

    if (this._selectedIndex === -1) {
      return false; // No waypoint selected
    }

    // If already in edit mode, do nothing
    if (this._editingIndex === this._selectedIndex) {
      return false;
    }

    this._editingIndex = this._selectedIndex;
    return true;
  }

  /**
   * Exit edit mode
   * @returns True if edit mode was exited, false if not in edit mode
   */
  public exitEditMode(): boolean {
    if (this._editingIndex === -1) {
      return false; // Not in edit mode
    }

    this._editingIndex = -1;
    return true;
  }

  /**
   * Reset state to initial values
   */
  public reset(): void {
    this._state = LinearMissionPlannerState.AWAITING_REFERENCE;
    this._selectedIndex = -1;
    this._editingIndex = -1;
  }
}
