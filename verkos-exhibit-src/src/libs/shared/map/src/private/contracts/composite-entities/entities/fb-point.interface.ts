import { IFBEntity } from './fb-entity.interface';
import { IPosition } from '@map/public/contracts';
import { LabelStyle, PointStyle } from '@map/private/contracts/core';

export interface IFBPoint extends IFBEntity {
  // Readonly Properties
  readonly position: IPosition; // Point position
  readonly style: PointStyle; // Point styling
  readonly labelText: string; // Label text
  readonly labelStyle: LabelStyle; // Label styling
  readonly visible: boolean; // Visibility state
  readonly editable: boolean; // Edit state
  readonly hoverable: boolean; // Hover state
  readonly clickable: boolean; // Click state
  readonly heightReferenceVisible: boolean; // Height reference line visibility

  // Position Management
  setPosition(position: IPosition): void; // Update point position

  // Style Management
  setStyle(style: Partial<PointStyle>): void; // Update point style

  // Label Management
  setLabelText(text: string): void; // Update label text
  updateLabelStyle(style: Partial<LabelStyle>): void; // Update label style

  // State Management
  setVisibility(visible: boolean): void; // Toggle visibility
  setEditable(editable: boolean): void; // Toggle edit mode
  setHoverable(hoverable: boolean): void; // Toggle hover state
  setClickable(clickable: boolean): void; // Toggle click state

  // Height Reference Management
  setHeightReferenceVisibility(visible: boolean): void; // Toggle height reference line visibility

  // Navigation
  panTo(): void; // Pan to point
}
