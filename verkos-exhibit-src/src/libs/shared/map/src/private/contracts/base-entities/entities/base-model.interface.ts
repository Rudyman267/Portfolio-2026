import { IPosition } from '@map/public/contracts';
import { IBaseEntity } from './base-entity.interface';
import { ModelAttitude, ModelStyle } from '@map/private/contracts/core';

/**
 * Configuration interface for creating models
 */
export interface IModelConfig {
  /**
   * Optional unique identifier for the model
   */
  id?: string;

  /**
   * Geographic position of the model
   */
  position: IPosition;

  /**
   * Orientation of the model
   */
  attitude?: ModelAttitude;

  /**
   * Style properties for the model
   */
  style?: ModelStyle;

  /**
   * Whether model is draggable
   */
  isDraggable?: boolean;

  /**
   * Whether model is keyboard controllable
   * When enabled, model can receive keyboard focus and respond to WASD/ZC/QE keys
   */
  isKeyboardControllable?: boolean;
}

/**
 * Base model interface that defines core 3D model functionality
 * Focused solely on model rendering without labels or other entity types
 */
export interface IBaseModel extends IBaseEntity {
  // Properties with readonly modifier
  readonly position: IPosition;
  readonly style: ModelStyle;
  readonly attitude: ModelAttitude;
  readonly visible: boolean;
  readonly draggable: boolean;
  readonly hoverable: boolean;
  readonly clickable: boolean;
  readonly keyboardControllable: boolean;

  // Position management
  setPosition(position: IPosition): void;

  // Style methods
  setStyle(style: Partial<ModelStyle>): void;

  // Model resource management
  updateModel(modelUri: string): void;

  // Orientation methods
  setAttitude(attitude: Partial<ModelAttitude>): void;

  // Visibility
  setVisibility(visible: boolean): void;

  // Interaction control
  setDraggable(draggable: boolean): void;
  setHoverable(hoverable: boolean): void;
  setClickable(clickable: boolean): void;

  // Keyboard controls
  setKeyboardControllable(enabled: boolean): void;
  setKeyboardFocus(focused: boolean): void;

  // Silhouette control
  setSilhouette(color: string, size?: number): void;
  removeSilhouette(): void;

  // Color blend control
  setColorBlend(mode: 'HIGHLIGHT' | 'REPLACE' | 'MIX', amount?: number): void;

  // Camera control
  panTo(): void;

  // Position tracking
  setTracking(tracking: boolean): void;
  isTracking(): boolean;

  // Camera tracking
  setCameraTracking(track: boolean): void;
  isCameraTracking(): boolean;

  // Cleanup
  destroy(): void;
}
