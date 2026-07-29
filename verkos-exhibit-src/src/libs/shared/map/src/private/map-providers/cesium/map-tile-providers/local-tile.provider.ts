import { ImageryProvider, UrlTemplateImageryProvider } from 'cesium';
import { ConfigurableBaseMapProvider } from './map-tile-provider.interface';
import { MapLayers } from '@map/public/core';

interface LocalTileConfig {
  url: string;
  tile_width?: number;
  tile_height?: number;
}

export class LocalTileProvider extends ConfigurableBaseMapProvider<LocalTileConfig> {
  constructor() {
    super(MapLayers.AERIAL);
  }

  async createImageryProvider(
    config: LocalTileConfig
  ): Promise<ImageryProvider> {
    const { url, tile_width = 512, tile_height = 512 } = config;

    if (!this.isValidTileUrlTemplate(url)) {
      throw new Error(
        `Invalid tile URL template. Must contain {z}, {x}, {y} placeholders: ${url}`
      );
    }

    return new UrlTemplateImageryProvider({
      url: url,
      tileWidth: tile_width,
      tileHeight: tile_height,
      maximumLevel: 18,
      minimumLevel: 0,
    });
  }

  private isValidTileUrlTemplate(url: string): boolean {
    const hasZ = url.includes('{z}') || url.includes('{zoom}');
    const hasX = url.includes('{x}');
    const hasY = url.includes('{y}');
    return hasZ && hasX && hasY;
  }

  isLayerSupported(layer: MapLayers): boolean {
    return this.getSupportedLayers().includes(layer);
  }

  getSupportedLayers(): MapLayers[] {
    return [MapLayers.AERIAL];
  }

  validateConfig(config: unknown): config is LocalTileConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const cfg = config as Record<string, unknown>;

    if (!cfg.url || typeof cfg.url !== 'string') {
      return false;
    }

    if (
      cfg.tile_width &&
      (!Number.isInteger(cfg.tile_width) || Number(cfg.tile_width) <= 0)
    ) {
      return false;
    }

    return !(
      cfg.tile_height &&
      (!Number.isInteger(cfg.tile_height) || Number(cfg.tile_height) <= 0)
    );
  }

  getProviderName(): string {
    return 'Local Tile Server';
  }
}
