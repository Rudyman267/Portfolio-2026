import { HeightReferenceEnum } from '@map/public/core';
import { ColorBlendModeEnum } from '../constants';

/**
 * Interface for model attitude/orientation
 */
export interface ModelAttitude {
  /**
   * Heading/yaw in degrees (0-360)
   */
  yaw?: number;

  /**
   * Pitch in degrees (-90 to 90)
   */
  pitch?: number;

  /**
   * Roll in degrees (-180 to 180)
   */
  roll?: number;
}

/**
 * Style options for 3D models
 */
export interface ModelStyle {
  /**
   * URI to the 3D model resource (glTF/glb format)
   */
  modelUri?: string;

  /**
   * Scale factor for model size
   */
  scale?: number;

  /**
   * CSS color string for model tinting
   */
  color?: string;

  /**
   * CSS color string for silhouette outline
   */
  silhouetteColor?: string;

  /**
   * Size of silhouette outline in pixels
   */
  silhouetteSize?: number;

  /**
   * Blend mode for color tinting
   */
  colorBlendMode?: ColorBlendModeEnum;

  /**
   * Amount of color blending (0-1)
   */
  colorBlendAmount?: number;

  /**
   * Minimum pixel size when zoomed out
   */
  minimumPixelSize?: number;

  /**
   * Maximum scale when zoomed in
   */
  maximumScale?: number;

  /**
   * Height reference mode
   */
  heightReference?: HeightReferenceEnum;
}
