import type { ICesiumProviderConfig } from '@map/private/contracts/map-providers';
import { MapProviderType } from '@map/private/contracts/map-providers';
import { BaseMapConfiguration, ViewType } from '@map/public';

export const DEFAULT_CESIUM_PROVIDER_CONFIG: ICesiumProviderConfig = {
  type: MapProviderType.CESIUM,
  name: 'Cesium 3D Maps',
  version: '1.130.0',
  isDefault: true,
  capabilities: {
    supports3D: true,
    supportsTerrainHeight: true,
    supportsModels: true,
    supportsRealTimeUpdates: true,
    supportsCustomImagery: true,
  },
  providerOptions: {
    ionAccessToken: 'default_token',
    enableTerrain: true,
    enableShadows: false,
    enableLighting: false,
    keyboardControlsAvailable: false,
    keyboardManager: undefined,
  },
};

export interface CesiumMapOptions {
  viewMode?: ViewType;
  baseMapConfig?: BaseMapConfiguration;
}
