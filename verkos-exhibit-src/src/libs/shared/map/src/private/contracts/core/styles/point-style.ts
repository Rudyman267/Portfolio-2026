import { HeightReferenceEnum } from '@map/public/core';

export interface PointStyle {
  color?: string;
  pixelSize?: number;
  outlineColor?: string;
  outlineWidth?: number;
  heightReference?: HeightReferenceEnum;
}
