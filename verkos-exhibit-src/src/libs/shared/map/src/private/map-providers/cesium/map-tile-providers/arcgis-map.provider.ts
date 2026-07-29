import {
  ArcGisMapServerImageryProvider,
  ImageryProvider,
  UrlTemplateImageryProvider,
} from 'cesium';
import { ConfigurableBaseMapProvider } from './map-tile-provider.interface';
import { MapLayers } from '@map/public/core';

interface ArcGisServiceConfig {
  url: string;
  token?: string;
}

export class ArcGisMapProvider extends ConfigurableBaseMapProvider<ArcGisServiceConfig> {
  constructor() {
    super(MapLayers.AERIAL);
  }

  async createImageryProvider(
    config: ArcGisServiceConfig
  ): Promise<ImageryProvider> {
    if (!config || !config.url) {
      throw new Error('ArcGIS configuration with URL is required');
    }

    const url = config.url;

    if (this.isMapServerUrl(url) && !url.includes('/tile/')) {
      let baseUrl = url.replace(/\/$/, '');

      if (config.token) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        baseUrl = `${baseUrl}${separator}token=${config.token}`;
      }

      return await ArcGisMapServerImageryProvider.fromUrl(baseUrl);
    } else {
      let tileUrl = url;

      if (config.token) {
        const separator = url.includes('?') ? '&' : '?';
        tileUrl = `${url}${separator}token=${config.token}`;
      }

      return new UrlTemplateImageryProvider({
        url: tileUrl,
      });
    }
  }

  private isMapServerUrl(url: string): boolean {
    return url.includes('/MapServer') || url.includes('/ImageServer');
  }

  // ArcGIS is URL-based and does not support layer switching
  isLayerSupported(layer: MapLayers): boolean {
    return this.getSupportedLayers().includes(layer);
  }

  getSupportedLayers(): MapLayers[] {
    return [MapLayers.AERIAL];
  }

  validateConfig(config: unknown): config is ArcGisServiceConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const cfg = config as Record<string, unknown>;

    if (!cfg.url || typeof cfg.url !== 'string') {
      return false;
    }

    try {
      new URL(cfg.url);
    } catch {
      return false;
    }

    return !(cfg.token && typeof cfg.token !== 'string');
  }

  getProviderName(): string {
    return 'ArcGIS Maps';
  }
}
