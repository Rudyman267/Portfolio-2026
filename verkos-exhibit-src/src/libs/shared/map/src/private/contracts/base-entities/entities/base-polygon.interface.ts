import { IPosition } from '@map/public/contracts';
import { MapEventEmitter } from '@map/private/contracts/events';
import { IBaseEntity } from './base-entity.interface';
import { PolygonStyle } from '@map/private/contracts/core';

export interface IPolygonConfig {
  /**
   * Optional unique identifier for the polygon
   */
  id?: string;
  position: IPosition[] | IPosition;
  style?: PolygonStyle;
  isEditable: boolean;
  label?: string;
}

export interface IBasePolygon extends IBaseEntity {
  //Properties with readonly modifier
  readonly positions: IPosition[];
  readonly style: PolygonStyle;
  readonly visible: boolean;
  readonly editable: boolean;

  //Methods
  setVisibility(visible: boolean): void;
  setEditable(editable: boolean): void;
  setHoverable(hoverable: boolean): void;
  setClickable(clickable: boolean): void;
  setPositions(positions: IPosition[]): void;
  setStyle(style: PolygonStyle): void;
  panTo(): void;
  destroy(): void;

  // Added getter methods for test access
  getEventEmitter(): MapEventEmitter;
}
