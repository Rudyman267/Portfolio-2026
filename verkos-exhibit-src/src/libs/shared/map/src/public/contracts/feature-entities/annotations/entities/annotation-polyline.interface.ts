import { IPosition } from '@map/public/contracts/base';

export interface IAnnotationPolylineStyle {
  color?: string;
  width?: number;
  outlineColor?: string;
  outlineWidth?: number;
}

export interface IAnnotationPolyline {
  readonly id: string;
  updatePositions(positions: IPosition[]): void;
  remove(): void;
  setVisibility(visible: boolean): void;
  setStyle(style: IAnnotationPolylineStyle): void;
  panTo(): void;
}

export interface IAnnotationPolylineOptions {
  positions: IPosition[];
  labelText: string;
  color: string;
}
