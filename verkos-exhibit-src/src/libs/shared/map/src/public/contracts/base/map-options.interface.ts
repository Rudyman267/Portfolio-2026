import { BaseMapType, ViewType } from '@map/public/core';

export interface ArcGisConfig {
  url: string;
  token?: string;
}

export interface LocalConfig {
  url: string;
  tile_width?: number;
  tile_height?: number;
}

/**
 * Public core configuration for selecting a basemap provider.
 */
export interface BaseMapConfiguration {
  base_map_type: BaseMapType;
  base_map_config?: ArcGisConfig | LocalConfig;
}

export interface MapOptions {
  viewMode?: ViewType;
  baseMapConfig?: BaseMapConfiguration;
  providerOptions?: Record<string, unknown>;
}

export const DEFAULT_BASE_MAP_CONFIG: BaseMapConfiguration = {
  base_map_type: BaseMapType.BING,
  base_map_config: undefined,
};

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  viewMode: ViewType.ThreeD,
  baseMapConfig: DEFAULT_BASE_MAP_CONFIG,
  providerOptions: {},
};
