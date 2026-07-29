import { OutlineType } from '../constants';

export interface CircleStyle {
  fillColor?: string;
  outlineType?: OutlineType;
  outlineColor?: string;
  outlineWidth?: number;
  material?: unknown;
  alpha?: number; // Custom alpha value for fill color transparency
}
