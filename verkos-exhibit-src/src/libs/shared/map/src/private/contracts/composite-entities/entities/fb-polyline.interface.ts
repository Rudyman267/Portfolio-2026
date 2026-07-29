import { IFBEntity } from './fb-entity.interface';
import { IPosition } from '@map/public/contracts';
import { LabelStyle, PolylineStyle } from '@map/private/contracts/core';

export interface IFBPolyline extends IFBEntity {
  // Readonly Properties
  readonly positions: IPosition[]; // Array of vertex positions
  readonly style: PolylineStyle; // Polyline styling
  readonly labelText: string; // Label text
  readonly labelStyle: LabelStyle; // Label styling
  readonly visible: boolean; // Visibility state
  readonly editable: boolean; // Edit state
  readonly hoverable: boolean; // Hover state
  readonly clickable: boolean; // Click state
  readonly distanceLabelsVisible: boolean; // Distance labels visibility state

  // Position Management
  setPositions(positions: IPosition[]): void; // Update polyline positions
  addPosition(position: IPosition): void; // Add new vertex position
  removePosition(index: number): void; // Remove vertex position
  updatePosition(index: number, position: IPosition): void; // Update vertex position

  // Style Management
  setStyle(style: Partial<PolylineStyle>): void; // Update polyline style

  // Label Management
  setCenterLabelText(text: string): void; // Update center label text
  setCenterLabelVisibility(visible: boolean): void; // Update center label visibility
  updateCenterLabelStyle(style: Partial<LabelStyle>): void; // Update center label style

  // State Management
  setVisibility(visible: boolean): void; // Toggle visibility
  setEditable(editable: boolean): void; // Toggle edit mode
  setHoverable(hoverable: boolean): void; // Toggle hover state
  setClickable(clickable: boolean): void; // Toggle click state

  setDynamicPosition(dynamicPosition: boolean): void;

  // Distance Labels
  setDistanceLabelsVisibility(visible: boolean): void; // Toggle distance labels visibility

  // Navigation
  panTo(): void; // Pan to polyline
}
