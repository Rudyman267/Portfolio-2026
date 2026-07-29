import {
  createWorldImageryAsync,
  ImageryProvider,
  IonWorldImageryStyle,
} from 'cesium';
import { SimpleBaseMapProvider } from './map-tile-provider.interface';
import { MapLayers } from '@map/public/core';

export class BingMapsProvider extends SimpleBaseMapProvider {
  constructor() {
    super(MapLayers.AERIAL);
  }

  async createImageryProvider(layer: MapLayers): Promise<ImageryProvider> {
    switch (layer) {
      case MapLayers.AERIAL_WITH_LABELS:
        return await createWorldImageryAsync({
          style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
        });
      case MapLayers.ROAD:
        return await createWorldImageryAsync({
          style: IonWorldImageryStyle.ROAD,
        });
      case MapLayers.AERIAL:
      default:
        return await createWorldImageryAsync({
          style: IonWorldImageryStyle.AERIAL,
        });
    }
  }

  isLayerSupported(layer: MapLayers): boolean {
    return this.getSupportedLayers().includes(layer);
  }

  getSupportedLayers(): MapLayers[] {
    return [MapLayers.AERIAL, MapLayers.AERIAL_WITH_LABELS, MapLayers.ROAD];
  }

  getProviderName(): string {
    return 'Bing Maps';
  }
}
