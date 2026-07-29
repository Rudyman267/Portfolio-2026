import { IFBEntity } from './fb-entity.interface';
import { IPosition } from '@map/public/contracts';
import {
  ColorBlendModeEnum,
  LabelStyle,
  ModelAttitude,
  ModelStyle,
} from '@map/private/contracts/core';

export interface IFBModel extends IFBEntity {
  // Readonly Properties
  readonly position: IPosition; // Model position
  readonly style: ModelStyle; // Model styling
  readonly attitude: ModelAttitude; // Model orientation
  readonly labelText: string; // Label text
  readonly labelStyle: LabelStyle; // Label styling
  readonly visible: boolean; // Visibility state
  readonly hoverable: boolean; // Hover state
  readonly clickable: boolean; // Click state
  readonly heightReferenceVisible: boolean; // Height reference line visibility
  readonly keyboardControllable: boolean; // Keyboard control state (delegated to base model)

  // Position Management
  updatePosition(position: IPosition): void; // Update model position

  // Style Management
  setStyle(style: Partial<ModelStyle>): void; // Update model style
  updateModel(modelUri: string): void; // Update 3D model resource
  setSilhouette(color: string, size?: number): void; // Set model silhouette
  removeSilhouette(): void; // Remove model silhouette
  setColorBlend(mode: ColorBlendModeEnum, amount?: number): void; // Set color blend

  // Orientation Management
  setAttitude(attitude: Partial<ModelAttitude>): void; // Update model orientation

  // Label Management
  setLabelText(text: string): void; // Update label text
  updateLabelStyle(style: Partial<LabelStyle>): void; // Update label style

  // State Management
  setVisibility(visible: boolean): void; // Toggle visibility
  setHoverable(hoverable: boolean): void; // Toggle hover state
  setClickable(clickable: boolean): void; // Toggle click state
  setEditable(editable: boolean): void; // Toggle editability

  // Keyboard Controls (delegated to underlying base model)
  setKeyboardControllable(enabled: boolean): void;
  setKeyboardFocus(focused: boolean): void;

  // Height Reference Management
  setHeightReferenceVisibility(visible: boolean): void; // Toggle height reference line visibility

  // Navigation
  panTo(): void; // Pan to model

  // Camera Tracking
  setCameraTracking(track: boolean): void; // Enable/disable camera tracking of the model
  isCameraTracking(): boolean; // Check if camera is tracking this model
}
