import { IPosition } from '@map/public/contracts/base';

export interface IAnnotationPolygonStyle {
  fillColor?: string;
  fillOpacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
  alpha?: number;
}

export interface IAnnotationPolygon {
  readonly id: string;
  updatePositions(positions: IPosition[]): void;
  remove(): void;
  setVisibility(visible: boolean): void;
  setStyle(style: IAnnotationPolygonStyle): void;
  panTo(): void;
}

export interface IAnnotationPolygonOptions {
  positions: IPosition[];
  color: string;
  labelText: string;
}
