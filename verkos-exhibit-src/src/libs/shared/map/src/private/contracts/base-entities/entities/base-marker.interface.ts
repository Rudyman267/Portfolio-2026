import { IPosition } from '@map/public/contracts';
import { IBaseEntity } from './base-entity.interface';
import { MarkerStyle } from '@map/private/contracts/core';

/**
 * Configuration interface for creating markers
 */
export interface IMarkerConfig {
  /**
   * Optional unique identifier for the marker
   */
  id?: string;

  /**
   * Geographic position of the marker
   */
  position: IPosition;

  /**
   * Style properties for the marker billboard
   */
  style?: MarkerStyle;

  /**
   * Whether marker is draggable
   */
  isDraggable?: boolean;

  /**
   * Whether marker is keyboard controllable
   * When enabled, marker can receive keyboard focus and respond to WASD/ZC keys
   * Movement speeds are hardcoded for consistency across all markers
   */
  isKeyboardControllable?: boolean;
}

/**
 * Base marker interface that defines core marker billboard functionality
 * Focused solely on billboard rendering without labels or other entity types
 */
export interface IBaseMarker extends IBaseEntity {
  // Properties with readonly modifier
  readonly position: IPosition;
  readonly style: MarkerStyle;
  readonly visible: boolean;
  readonly draggable: boolean;
  readonly keyboardControllable: boolean;

  readonly rotateWithCamera: boolean;

  // Methods for state changes
  setPosition(position: IPosition): void;
  setStyle(style: Partial<MarkerStyle>): void;
  setVisibility(visible: boolean): void;
  setDraggable(draggable: boolean): void;
  setClickable(clickable: boolean): void;
  setHoverable(hoverable: boolean): void;

  // Marker-specific methods
  updateImage(imageUrl: string): void;
  setRotation(angle: number): void;
  enableCameraRotation(enable: boolean): void;

  // Keyboard control methods
  /**
   * Enable or disable keyboard control for this marker
   * @param enabled true to enable keyboard control, false to disable
   */
  setKeyboardControllable(enabled: boolean): void;
  /**
   * Request keyboard focus for this marker
   * @param focused true to request keyboard focus, false to release focus
   */
  setKeyboardFocus(focused: boolean): void;

  // Cleanup
  destroy(): void;

  // Navigation
  /**
   * Pan the map view to center on this marker entity
   */
  panTo(): void;

  setViewTo(): void;

  /**
   * Reset height manipulation state - useful when switching to 2D mode
   */
  resetHeightManipulationState(): void;
}
