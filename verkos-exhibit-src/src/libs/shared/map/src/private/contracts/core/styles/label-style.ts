import { HeightReferenceEnum } from '@map/public/core';

export interface LabelStyle {
  font?: string;
  fillColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  style?: number;
  scale?: number;

  // Positioning
  horizontalOrigin?: number;
  verticalOrigin?: number;
  eyeOffset?: { x: number; y: number; z: number };
  pixelOffset?: { x: number; y: number };

  // Background
  showBackground?: boolean;
  backgroundColor?: string;
  backgroundAlpha?: number; // 0.0 to 1.0, controls background transparency
  backgroundPadding?: { x: number; y: number };
  heightReference?: HeightReferenceEnum;
}
