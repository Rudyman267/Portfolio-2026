import { ImageryProvider, UrlTemplateImageryProvider } from 'cesium';
import { SimpleBaseMapProvider } from './map-tile-provider.interface';
import { MapLayers } from '@map/public/core';

export class GoogleMapsProvider extends SimpleBaseMapProvider {
  constructor() {
    super(MapLayers.AERIAL);
  }

  async createImageryProvider(layer: MapLayers): Promise<ImageryProvider> {
    const mapType = this.getGoogleMapType(layer);

    return new UrlTemplateImageryProvider({
      url: `https://mt{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`,
      subdomains: ['0', '1', '2', '3'],
      credit: 'Google Maps',
    });
  }

  private getGoogleMapType(layer: MapLayers): string {
    // Map Bing layer names to Google map types
    switch (layer) {
      case MapLayers.AERIAL_WITH_LABELS:
        return 'y';
      case MapLayers.ROAD:
        return 'm'; // Map (roadmap)
      case MapLayers.AERIAL:
      default:
        return 's'; // Satellite only
    }
  }

  isLayerSupported(layer: MapLayers): boolean {
    return this.getSupportedLayers().includes(layer);
  }

  getSupportedLayers(): MapLayers[] {
    return [MapLayers.AERIAL, MapLayers.AERIAL_WITH_LABELS, MapLayers.ROAD];
  }

  getProviderName(): string {
    return 'Google Maps';
  }
}
