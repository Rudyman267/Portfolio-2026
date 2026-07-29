import { IPosition } from '@map/public/contracts/base';

/**
 * Asset geometry types for multi-geometry support
 */
export interface AssetPoint {
  type: 'Point';
  coordinates: [number, number, number?]; // [lng, lat, alt?]
}

export interface AssetLineString {
  type: 'LineString';
  coordinates: Array<[number, number, number?]>; // Array of [lng, lat, alt?]
}

export interface AssetPolygon {
  type: 'Polygon';
  coordinates: Array<Array<[number, number, number?]>>; // Array of rings, each ring is array of [lng, lat, alt?]
}

export type AssetGeometry = AssetPoint | AssetLineString | AssetPolygon;

/**
 * Asset metadata for annotations
 * Uses generic string for category to support dynamic categories
 */
export interface AssetMetadata {
  name: string;
  category: string; // Generic string - supports both enum values and dynamic categories
  description?: string;
  [key: string]: unknown;
}

/**
 * Asset style configuration for categories
 */
export interface AssetCategoryStyle {
  color: string;
  iconUrl: string;
  fillOpacity?: number;
  outlineWidth?: number;
}

/**
 * Complete asset style configuration
 */
export interface AssetStyleConfig {
  categories: Record<string, AssetCategoryStyle>;
  defaults: {
    color: string;
    iconUrl: string;
    fillOpacity: number;
    outlineWidth: number;
  };
  iconBaseUrl?: string; // Base URL for icon assets
}

/**
 * Asset annotation entity interface
 * Represents a visual annotation on the map (marker, line, or polygon)
 * This is the public-facing interface - implementation details are hidden
 */
export interface IAssetAnnotationEntity {
  readonly id: string;
  readonly type: 'marker' | 'polyline' | 'polygon';
  setVisibility(visible: boolean): void;
  remove(): void;
  panTo(): void;
}

/**
 * Asset annotation type alias for convenience
 */
export type IAssetAnnotation = IAssetAnnotationEntity;

/**
 * Asset interaction event types for type-safe event handling
 */
export enum AssetInteractionEventType {
  CLICK = 'click',
  HOVER = 'hover',
  HOVER_END = 'hover-end',
}

/**
 * Asset interaction event for bubbling to components
 */
export interface IAssetInteractionEvent {
  type: AssetInteractionEventType;
  assetId: string;
  position: IPosition;
  metadata: AssetMetadata;
}

/**
 * Asset data for batch creation
 */
export interface AssetGeometryData {
  id: string;
  name: string;
  geometry: AssetGeometry;
  category: string; // Generic string for dynamic categories
  metadata?: Record<string, unknown>;
}

/**
 * Asset point data for batch creation
 */
export interface AssetPointData {
  id: string;
  name: string;
  position: IPosition;
  category: string; // Generic string for dynamic categories
  metadata?: Record<string, unknown>;
}

/**
 * Asset line data for batch creation
 */
export interface AssetLineData {
  id: string;
  name: string;
  positions: IPosition[];
  category: string; // Generic string for dynamic categories
  metadata?: Record<string, unknown>;
}

/**
 * Asset polygon data for batch creation
 */
export interface AssetPolygonData {
  id: string;
  name: string;
  positions: IPosition[];
  category: string; // Generic string for dynamic categories
  metadata?: Record<string, unknown>;
}
