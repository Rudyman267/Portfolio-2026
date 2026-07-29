import { HeightReferenceEnum } from '@map/public';

export interface PolygonStyle {
  fillColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  alpha?: number;
  heightReference?: HeightReferenceEnum;
}
