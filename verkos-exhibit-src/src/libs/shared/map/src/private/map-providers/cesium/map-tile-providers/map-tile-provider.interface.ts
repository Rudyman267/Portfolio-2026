import { ImageryProvider } from 'cesium';
import type { ArcGisConfig, LocalConfig } from '@map/public/contracts';
import { MapLayers } from '@map/public/core';

// Base provider for map-map-tile-map-providers that don't need configuration (Bing, Google)
export abstract class SimpleBaseMapProvider {
  protected currentLayer: MapLayers;

  protected constructor(defaultLayer: MapLayers) {
    this.currentLayer = defaultLayer;
  }

  abstract createImageryProvider(layer: MapLayers): Promise<ImageryProvider>;
  abstract isLayerSupported(layer: MapLayers): boolean;
  abstract getSupportedLayers(): MapLayers[];
  abstract getProviderName(): string;

  setLayer(layer: MapLayers): void {
    this.currentLayer = layer;
  }

  getCurrentLayer(): MapLayers {
    return this.currentLayer;
  }
}

// Base provider for map-map-tile-map-providers that need configuration (ArcGIS, Local)
export abstract class ConfigurableBaseMapProvider<
  TConfig = ArcGisConfig | LocalConfig
> {
  protected config?: TConfig;
  protected currentLayer: MapLayers;

  protected constructor(defaultLayer: MapLayers) {
    this.currentLayer = defaultLayer;
  }

  abstract createImageryProvider(config: TConfig): Promise<ImageryProvider>;
  abstract isLayerSupported(layer: MapLayers): boolean;
  abstract getSupportedLayers(): MapLayers[];
  abstract validateConfig(config: unknown): config is TConfig;
  abstract getProviderName(): string;

  setConfig(config: TConfig): void {
    this.config = config;
  }

  getCurrentLayer(): MapLayers {
    return this.currentLayer;
  }
}

// Union type for all provider types
export type BaseMapProvider =
  | SimpleBaseMapProvider
  | ConfigurableBaseMapProvider<ArcGisConfig | LocalConfig>;
