import { IFbHeightReferenceLine } from './fb-heightReferenceLine.interface';
import { IPosition } from '@map/public/contracts';
import { LabelStyle, MarkerStyle } from '@map/private/contracts/core';

export interface IFBMarker extends IFbHeightReferenceLine {
  // Readonly Properties
  readonly position: IPosition; // Marker position
  readonly style: MarkerStyle; // Marker styling
  readonly labelText: string; // Label text
  readonly labelStyle: LabelStyle; // Label styling
  readonly visible: boolean; // Visibility state
  readonly editable: boolean; // Edit state
  readonly hoverable: boolean; // Hover state
  readonly clickable: boolean; // Click state
  readonly heightReferenceVisible: boolean; // Height reference line visibility
  readonly rotateWithCamera: boolean; // Camera rotation state
  readonly baseMarkerId: string;
  readonly keyboardControllable: boolean; // Keyboard control state (delegated to base marker)
  // Position Management
  updatePosition(position: IPosition): Promise<void>; // Update marker position

  // Style Management
  setStyle(style: Partial<MarkerStyle>): void; // Update marker style
  updateImage(imageUrl: string): void; // Update marker image
  setRotation(angle: number): void; // Set marker rotation angle
  enableCameraRotation(enable: boolean): void; // Toggle camera-based rotation

  // Label Management
  setLabelText(text: string): void; // Update label text
  updateLabelStyle(style: Partial<LabelStyle>): void; // Update label style

  // State Management
  setEditable(editable: boolean): void; // Toggle edit mode
  setHoverable(hoverable: boolean): void; // Toggle hover state
  setClickable(clickable: boolean): void; // Toggle click state

  setKeyboardControllable(enabled: boolean): void;
  setKeyboardFocus(focused: boolean): void;

  // Height Reference Management
  setHeightReferenceVisibility(visible: boolean): void; // Toggle height reference line visibility

  // Navigation
  panTo(): void; // Pan to marker

  setViewTo(): void; // Set view to marker
}
