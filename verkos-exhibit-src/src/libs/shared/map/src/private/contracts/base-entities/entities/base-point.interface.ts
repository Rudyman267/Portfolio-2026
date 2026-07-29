import { IPosition } from '@map/public/contracts';
import { IBaseEntity } from './base-entity.interface';
import { PointStyle } from '@map/private/contracts/core';

export interface IPointConfig {
  /**
   * Optional unique identifier for the point
   */
  id?: string;
  position: IPosition;
  style?: PointStyle;
  isTrackable?: boolean;
  isEditable?: boolean;
  isHoverable?: boolean;
  isClickable?: boolean;
}

export interface IBasePoint extends IBaseEntity {
  // Properties with readonly modifier
  readonly position: IPosition;
  readonly style: PointStyle;
  readonly visible: boolean;
  readonly editable: boolean;
  readonly tracking: boolean;
  readonly hoverable: boolean;
  readonly clickable: boolean;

  // Methods for state changes
  setPosition(position: IPosition): void;
  setStyle(style: Partial<PointStyle>): void;
  setVisibility(visible: boolean): void;
  setEditable(editable: boolean): void;
  setTracking(tracking: boolean): void;
  setHoverable(hoverable: boolean): void;
  setClickable(clickable: boolean): void;

  // Cleanup
  destroy(): void;

  // Navigation
  /**
   * Pan the map view to center on this point entity
   */
  panTo(): void;

  /**
   * Get the underlying raw provider entity (for internal use)
   * @returns Raw provider entity or null if not available
   */

  getRawProviderEntity(): any | null;
}
