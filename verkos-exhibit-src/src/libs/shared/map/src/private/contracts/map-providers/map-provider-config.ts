import { KeyboardManager } from '@hardware-controls/keyboard';
import { MapProviderType, MapProviderCapabilities } from './map-provider-types';

/**
 * Base configuration for all map map-map-tile-map-providers
 * Provider-specific configurations should extend this interface
 */
export interface IMapProviderConfig {
  /**
   * The type of provider (cesium, mapbox, etc.)
   */
  type: MapProviderType;

  /**
   * Provider display name for UI/logging
   */
  name: string;

  /**
   * Provider version
   */
  version: string;

  /**
   * Provider capabilities
   */
  capabilities: MapProviderCapabilities;

  /**
   * Whether this provider is the default
   */
  isDefault?: boolean;

  /**
   * Provider-specific configuration options
   * Allows map-map-tile-map-providers to extend with custom config
   */
  providerOptions?: Record<string, unknown>;
}

/**
 * Cesium-specific provider configuration
 * Extends base config with Cesium-specific options
 */
export interface ICesiumProviderConfig extends IMapProviderConfig {
  type: MapProviderType.CESIUM;

  /**
   * Cesium-specific options
   */
  providerOptions?: {
    /**
     * Cesium ion access token
     */
    ionAccessToken?: string;

    /**
     * Enable terrain provider
     */
    enableTerrain?: boolean;

    /**
     * Terrain provider URL
     */
    terrainProviderUrl?: string;

    /**
     * Enable shadows
     */
    enableShadows?: boolean;

    /**
     * Enable lighting
     */
    enableLighting?: boolean;

    /**
     * Keyboard manager instance for keyboard control support
     * Must be provided along with keyboardControlsAvailable=true to enable keyboard features
     * @optional
     */
    keyboardManager?: KeyboardManager;

    /**
     * Enable keyboard control features for the map
     * When true, entities can register for keyboard events and receive focus
     * @default false
     */
    keyboardControlsAvailable?: boolean;

    /**
     * Additional Cesium viewer options
     */
    [key: string]: unknown;
  };
}

/**
 * Union type of all provider configurations
 * Extensible for future map-map-tile-map-providers
 */
export type MapProviderConfig = ICesiumProviderConfig;
