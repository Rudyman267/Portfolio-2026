/**
 * Supported map provider types
 * Extensible enum for different mapping platforms
 */
export enum MapProviderType {
  /**
   * Cesium-based 3D mapping platform
   * Current default and primary provider
   */
  CESIUM = 'cesium',
}

/**
 * Provider capability flags
 * Indicates what feature-entities a provider supports
 */
export interface MapProviderCapabilities {
  /**
   * Supports 3D visualization and terrain
   */
  supports3D: boolean;

  /**
   * Supports terrain height queries
   */
  supportsTerrainHeight: boolean;

  /**
   * Supports model rendering (GLTF/GLB)
   */
  supportsModels: boolean;

  /**
   * Supports real-time entity updates
   */
  supportsRealTimeUpdates: boolean;

  /**
   * Supports custom imagery map-map-tile-map-providers
   */
  supportsCustomImagery: boolean;
}
