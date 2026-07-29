import { IPosition } from '@map/public/contracts';
import { IFBEntity } from './fb-entity.interface';
import { CircleStyle, LabelStyle } from '@map/private/contracts/core';

export interface IFBCircle extends IFBEntity {
  // Readonly Properties
  readonly centerPosition: IPosition; // Center position of circle
  readonly radius: number; // Circle radius
  readonly style: CircleStyle; // Circle styling
  readonly labelText: string; // Label text
  readonly labelStyle: LabelStyle; // Label styling
  readonly visible: boolean; // Visibility state
  readonly editable: boolean; // Edit state
  readonly hoverable: boolean; // Hover state
  readonly clickable: boolean; // Click state
  readonly distanceLabelsVisible: boolean; // Distance labels visibility state

  // Circle Management
  setRadius(radius: number): void; // Update circle radius
  setCenterPosition(position: IPosition): void; // Update center position

  // Style Management
  setStyle(style: Partial<CircleStyle>): void; // Update circle style

  // Label Management
  setCenterLabelText(text: string): void; // Update center label text
  setCenterLabelStyle(style: Partial<LabelStyle>): void; // Update center label style

  // State Management
  setVisibility(visible: boolean): void; // Toggle visibility
  setEditable(editable: boolean): void; // Toggle edit mode (shows/hides edit points)
  setHoverable(hoverable: boolean): void; // Toggle hover state
  setClickable(clickable: boolean): void; // Toggle click state

  // Distance Labels
  setDistanceLabelsVisibility(visible: boolean): void; // Toggle distance labels visibility

  // Navigation
  panTo(): void; // Pan to circle
}
