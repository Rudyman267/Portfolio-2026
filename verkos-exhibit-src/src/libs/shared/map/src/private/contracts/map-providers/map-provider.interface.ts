import { IMapProviderConfig } from './map-provider-config';

/**
 * Core map provider interface
 * All map map-map-tile-map-providers (Cesium, Mapbox, etc.) must implement this interface
 *
 * IMPORTANT: This interface should only contain contracts, not implementations
 * Actual provider implementations live in the private layer
 *
 * @template TMapInstance - The underlying map instance type (e.g., Cesium.Viewer)
 * @template TConfig - Provider-specific configuration type
 */
export interface IMapProvider<
  TMapInstance = unknown,
  TConfig extends IMapProviderConfig = IMapProviderConfig
> {
  /**
   * Provider configuration
   */
  readonly config: TConfig;

  /**
   * Whether the provider has been initialized
   */
  readonly isInitialized: boolean;

  /**
   * The underlying map instance
   * Type varies by provider (Cesium.Viewer, Mapbox.Map, etc.)
   */
  readonly mapInstance: TMapInstance | null;

  /**
   * Initialize the map provider
   * Sets up the underlying map instance and all necessary services
   *
   * @param containerId - DOM element ID where the map will be rendered
   * @param options - Provider-specific initialization options
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} If initialization fails or container not found
   */
  initialize(
    containerId?: string,
    options?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Dispose of all provider resources
   * Cleanup method to prevent memory leaks
   *
   * Must clean up:
   * - Event listeners
   * - Map entities
   * - Underlying map instance
   * - Manager instances
   */
  dispose(): void;
}

/**
 * Map provider managers interface
 * Responsible for creating provider instances
 *
 * @template TProvider - The provider type this managers creates
 * @template TConfig - Configuration type for the provider
 */
export interface IMapProviderFactory<
  TProvider extends IMapProvider = IMapProvider,
  TConfig extends IMapProviderConfig = IMapProviderConfig
> {
  /**
   * Provider type this managers creates
   */
  readonly providerType: TConfig['type'];

  /**
   * Create a new provider instance
   *
   * @param config - Provider configuration
   * @returns New provider instance (not yet initialized)
   * @throws {Error} If configuration is invalid
   */
  createProviderInstance(
    config: TConfig,
    context?: MapProviderCreationContext
  ): TProvider;
}

export interface MapProviderCreationContext {
  containerId?: string;
  options?: Record<string, unknown>;
}
