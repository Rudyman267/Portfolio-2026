import { IPosition } from '@map/public/contracts';
import { MapEventEmitter } from '@map/private/contracts/events';
import { IBaseEntity } from './base-entity.interface';
import { CircleStyle } from '@map/private/contracts/core';

export interface ICircleConfig {
  /**
   * Optional unique identifier for the circle
   */
  id?: string;
  position: IPosition;
  radius: number;
  style?: CircleStyle;
  isEditable?: boolean;
  isVisible?: boolean;
  isHoverable?: boolean;
  isClickable?: boolean;
  label?: string;
}

export interface IBaseCircle extends IBaseEntity {
  // Properties with readonly modifier
  readonly positions: IPosition[];
  readonly style: CircleStyle;
  readonly visible: boolean;
  readonly editable: boolean;
  readonly hoverable: boolean;
  readonly clickable: boolean;
  readonly radius: number;
  readonly centerPosition: IPosition;

  setVisibility(visible: boolean): void;
  setEditable(editable: boolean): void;
  setHoverable(hoverable: boolean): void;
  setClickable(clickable: boolean): void;
  setPosition(position: IPosition): void;
  setRadius(radius: number): void;
  setStyle(style: Partial<CircleStyle>): void;
  destroy(): void;
  panTo(): void;

  getEventEmitter(): MapEventEmitter;
}

export interface ICompositeCircle {
  getEventEmitter(): MapEventEmitter;
  getRadius(): number;
  setRadius(radius: number): void;
  setEditable(editable: boolean): void;
  getLabelText(): string;
  setLabelText(text: string): void;
  destroy(): void;
  setStyle(style: Partial<CircleStyle>): void;
  getStyle(): CircleStyle;
}
