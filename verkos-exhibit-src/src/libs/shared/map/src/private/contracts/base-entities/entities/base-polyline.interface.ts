import { IPosition } from '@map/public/contracts';
import { IBaseEntity } from './base-entity.interface';
import { PolylineStyle } from '@map/private/contracts/core';

export interface IPolylineConfig {
  /**
   * Optional unique identifier for the polyline
   */
  id?: string;
  positions: IPosition[];
  style?: PolylineStyle;
  isEditable?: boolean;
  isVisible?: boolean;
  isHoverable?: boolean;
  isClickable?: boolean;
  label?: string;
}

export interface IBasePolyline extends IBaseEntity {
  // Properties with readonly modifier
  readonly positions: IPosition[];
  readonly style: PolylineStyle;
  readonly visible: boolean;
  readonly editable: boolean;
  readonly hoverable: boolean;
  readonly clickable: boolean;

  // Position management
  setPositions(positions: IPosition[]): void;
  addPosition(position: IPosition): void;

  // Styling methods
  setStyle(style: Partial<PolylineStyle>): void;

  // Visibility
  setVisibility(visible: boolean): void;

  // Interaction control
  setEditable(editable: boolean): void;
  setHoverable(hoverable: boolean): void;
  setClickable(clickable: boolean): void;
  setDynamicPosition(dynamicPosition: boolean): void;

  // Cleanup
  destroy(): void;

  // Navigation
  /**
   * Pan the map view to center on this polyline entity
   */
  panTo(): void;

  /**
   * Get the underlying raw provider entity (for internal use)
   * @returns Raw provider entity or null if not available
   */

  getRawProviderEntity(): any | null;
}
