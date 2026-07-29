import { IFBEntity } from './fb-entity.interface';
import { IPosition } from '@map/public/contracts';
import { LabelStyle, PolygonStyle } from '@map/private/contracts/core';

export interface IFBPolygon extends IFBEntity {
  // Readonly Properties
  readonly positions: IPosition[]; // Array of vertex positions
  readonly style: PolygonStyle; // Polygon styling
  readonly labelText: string; // Label text
  readonly labelStyle: LabelStyle; // Label styling
  readonly visible: boolean; // Visibility state
  readonly editable: boolean; // Edit state
  readonly hoverable: boolean; // Hover state
  readonly clickable: boolean; // Click state
  readonly distanceLabelsVisible: boolean; // Distance labels visibility state

  // Position Management
  setPositions(positions: IPosition[]): void; // Update polygon positions
  appendPosition(position: IPosition): void; // Add new vertex position at last position
  removePosition(index: number): void; // Remove vertex position
  setPosition(index: number, position: IPosition): void; // Update vertex position

  // Style Management
  setStyle(style: Partial<PolygonStyle>): void; // Update polygon style

  // Label Management
  setCenterLabelText(text: string): void; // Update label text
  setCenterLabelStyle(style: Partial<LabelStyle>): void; // Update label style

  // State Management
  setVisibility(visible: boolean): void; // Toggle visibility
  setEditable(editable: boolean): void; // Toggle edit mode
  setHoverable(hoverable: boolean): void; // Toggle hover state
  setClickable(clickable: boolean): void; // Toggle click state

  // Distance Labels
  setDistanceLabelsVisibility(visible: boolean): void; // Toggle distance labels visibility

  // Navigation
  panTo(): void; // Pan to polygon
}
