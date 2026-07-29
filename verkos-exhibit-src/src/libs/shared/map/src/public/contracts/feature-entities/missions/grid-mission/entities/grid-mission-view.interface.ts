/**
 * Interface for a read-only grid mission display with selection capability.
 *
 * This interface provides a simplified view of a grid mission, focused on
 * visualization and selection rather than editing. It allows applications to
 * display completed missions and highlight selected missions.
 *
 * @interface IGridMissionView
 * @category Feature
 * @public
 */
import { IPosition } from '@map/public/contracts/base';
import { IEventType } from '@map/public/contracts/events';

export interface IGridMissionView {
  /**
   * Unique identifier for this mission view.
   */
  readonly id: string;

  /**
   * Gets the reference point of
   */
  readonly referencePoint: IPosition;

  /**
   * Gets whether this mission is currently selected.
   */
  readonly isSelected: boolean;

  /**
   * Gets whether this mission is currently visible.
   */
  readonly isVisible: boolean;

  /**
   * Gets the takeoff altitude of the mission in meters.
   */
  readonly takeoffAltitude: number;

  /**
   * Sets the selection state of this mission.
   * When selected, the mission will use a highlighted visual style.
   *
   * @param selected Whether the mission should be selected
   */
  setSelected(selected: boolean): void;

  /**
   * Sets the visibility of this mission.
   *
   * @param visible Whether the mission should be visible
   */
  setVisibility(visible: boolean): void;

  /**
   * Disposes of this mission view, removing it from the map.
   * After calling this method, the mission view is no longer usable.
   */
  remove(): void;

  /**
   * Centers the map view on this mission.
   * This will adjust the camera to show the entire mission path.
   */
  panTo(): void;

  /**
   *
   * Event handler for mission events.
   * This allows the application to respond to only click events related to the mission.
   * @param event
   * @param callback
   */
  onEvent(event: IEventType, callback: () => void): void;
}
