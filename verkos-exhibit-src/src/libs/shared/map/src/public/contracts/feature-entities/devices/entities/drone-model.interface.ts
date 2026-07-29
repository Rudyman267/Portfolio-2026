import { IOrientation, IPosition } from '@map/public/contracts/base';
import { HeightReferenceEnum } from '@map/public/core';

/**
 * Interface for model attitude/orientation
 */
export interface IDroneModelAttitude {
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
export interface IDroneModelStyle {
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
  colorBlendMode?: 'HIGHLIGHT' | 'REPLACE' | 'MIX';

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

export interface IDroneModel {
  readonly id: string;
  readonly position: IPosition;
  readonly attitude: IDroneModelAttitude;

  setVisibility(visible: boolean): void;
  remove(): void;
  updatePosition(position: IPosition): void;
  updateProperties(properties: { attitude?: IDroneModelAttitude }): void;
  panTo(): void;
  addPreviousPath(positions: IPosition[]): void;

  /**
   * Enable or disable camera tracking for this drone model
   * When enabled, the camera will automatically follow the drone as it moves
   * @param track Whether to track this drone with the camera
   */
  setCameraTracking(track: boolean): void;

  /**
   * Check if the camera is currently tracking this drone
   * @returns Whether camera tracking is enabled for this drone
   */
  isCameraTracking(): boolean;

  /**
   * Update the 3D model resource
   * @param modelUri URI to the new 3D model
   */
  updateModel(modelUri: string): void;

  /**
   * Update the trace line style
   * @param style Style object containing color and other properties
   */
  setTraceLineStyle(style: { color: string }): void;
}

export interface IDroneModelOptions {
  /**
   * Initial position of the drone
   */
  position: IPosition;

  /**
   * Initial orientation of the drone (optional)
   */
  orientation?: IOrientation;

  /**
   * URI to the 3D model to use
   */
  modelUri: string;

  /**
   * Scale factor for the model (optional)
   * Default is 1.0
   */
  scale?: number;

  /**
   * Whether the drone should be visible initially (optional)
   * Default is true
   */
  visible?: boolean;

  /**
   * Whether the drone should be clickable (optional)
   * Default is true
   */
  clickable?: boolean;

  /**
   * Whether the drone should be hoverable (optional)
   * Default is true
   */
  hoverable?: boolean;

  /**
   * Label text to display with the drone (optional)
   */
  labelText?: string;

  /**
   * Whether to show the height reference line (optional)
   * Default is false
   */
  showHeightReference?: boolean;
}
