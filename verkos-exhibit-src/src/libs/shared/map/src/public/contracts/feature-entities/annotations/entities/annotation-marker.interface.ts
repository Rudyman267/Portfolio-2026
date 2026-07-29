import { IPosition } from '@map/public/contracts/base';

/**
 * Style options for marker billboards
 */
export interface IAnnotationMarkerStyle {
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
}

export interface IAnnotationMarker {
  readonly id: string;
  updatePosition(position: IPosition): void;
  remove(): void;
  setVisibility(visible: boolean): void;
  setStyle(style: IAnnotationMarkerStyle): void;
  panTo(): void;
}

export interface IAnnotationMarkerOptions {
  position: IPosition;
  color: string;
  labelText: string;
  /**
   * Icon configuration object.
   * - icon_type: The type of icon ('custom' or 'default')
   * - icon_id: The icon identifier (default icon name like 'point' OR custom icon ID)
   * - icon_content: SVG content (only used when icon_type is 'custom')
   */
  icon?: {
    icon_type?: 'custom' | 'default';
    icon_id: string;
    icon_content?: string;
  };
}
