import { HeightReferenceEnum } from '@map/public/core';

/**
 * Style options for marker billboards
 */
export interface MarkerStyle {
  /**
   * URL, data URI, or SVG for the marker image
   */
  image?: string;

  /**
   * Scale factor for the marker image
   */
  scale?: number;

  /**
   * Color tint for the marker
   */
  color?: string;

  /**
   * Rotation angle in degrees
   */
  rotation?: number;

  /**
   * Whether rotation should follow the camera heading
   */
  rotateWithCamera?: boolean;

  /**
   * Pixel offset from anchor point (x, y)
   */
  pixelOffset?: { x: number; y: number };

  /**
   * Eye offset in 3D space
   */
  eyeOffset?: { x: number; y: number; z: number };

  /**
   * Vertical origin (0 = center, 1 = bottom, -1 = top)
   */
  verticalOrigin?: number;

  /**
   * Horizontal origin (0 = center, 1 = right, -1 = left)
   */
  horizontalOrigin?: number;

  /**
   * Height reference mode (NONE, CLAMP_TO_GROUND, RELATIVE_TO_GROUND)
   */
  heightReference?: HeightReferenceEnum;

  /**
   * Determines when the marker is displayed based on distance from camera
   */
  distanceDisplayCondition?: { near: number; far: number };

  /**
   * Scale based on distance from camera
   */
  scaleByDistance?: boolean;

  /**
   * Whether to disable depth testing for the marker
   */
  disableDepthTestDistance?: boolean;
}
