import { MapProviderType } from './map-provider-types';
import {
  IMapProvider,
  IMapProviderFactory,
  MapProviderCreationContext,
} from './map-provider.interface';
import { IMapProviderConfig } from './map-provider-config';

/**
 * Provider registry error types
 * Used for better error handling and debugging
 */
export enum ProviderRegistryErrorType {
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_ALREADY_REGISTERED = 'PROVIDER_ALREADY_REGISTERED',
  NO_DEFAULT_PROVIDER = 'NO_DEFAULT_PROVIDER',
  INVALID_PROVIDER_CONFIG = 'INVALID_PROVIDER_CONFIG',
}

/**
 * Provider registry error class
 * Provides detailed error information for troubleshooting
 */
export class ProviderRegistryError extends Error {
  constructor(
    public readonly errorType: ProviderRegistryErrorType,
    message: string,
    public readonly providerType?: MapProviderType
  ) {
    super(message);
    this.name = 'ProviderRegistryError';
  }
}

/**
 * Provider registry entry
 * Internal structure for managing registered map-map-tile-map-providers
 */
interface IProviderRegistryEntry<
  TProvider extends IMapProvider = IMapProvider,
  TConfig extends IMapProviderConfig = IMapProviderConfig
> {
  factory: IMapProviderFactory<TProvider, TConfig>;
  config: TConfig;
  isDefault: boolean;
}

/**
 * Map Provider Registry
 *
 * Singleton registry for managing map provider factories and configurations.
 * Follows the Registry Pattern for loose coupling between provider implementations
 * and consumer code.
 *
 * **Design Principles:**
 * - Singleton: Only one registry instance exists
 * - Type-safe: Strong typing for all provider operations
 * - Extensible: Easy to add new map-map-tile-map-providers without modifying existing code
 * - Immutable: Provider configurations cannot be modified after registration
 *
 * **Usage Pattern:**
 * ```typescript
 * // 1. Register a provider (done during bootstrap)
 * MapProviderRegistry.registerProvider(
 *   cesiumFactory,
 *   cesiumConfig
 * );
 * ```
 *
 * @remarks
 * - Registry should be initialized during application bootstrap
 * - Providers must be registered before they can be used
 * - Default provider is used when no specific type is requested
 */
export class MapProviderRegistry {
  /**
   * Singleton instance
   * Ensures only one registry exists across the application
   */
  private static instance: MapProviderRegistry | null = null;

  /**
   * Internal map of registered map-map-tile-map-providers
   * Key: Provider type (e.g., 'cesium')
   * Value: Provider registry entry (managers + config)
   */
  private readonly providers: Map<MapProviderType, IProviderRegistryEntry> =
    new Map();

  /**
   * Default provider type
   * Used when no specific provider is requested
   */
  private defaultProviderType: MapProviderType | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Use getInstance() to get the registry instance
   */
  private constructor() {
    // Private constructor prevents direct instantiation
  }

  /**
   * Get the singleton registry instance
   * Creates the instance if it doesn't exist
   *
   * @returns The singleton MapProviderRegistry instance
   */
  public static getInstance(): MapProviderRegistry {
    if (!MapProviderRegistry.instance) {
      MapProviderRegistry.instance = new MapProviderRegistry();
    }
    return MapProviderRegistry.instance;
  }

  /**
   * Register a map provider
   *
   * @template TProvider - Provider type
   * @template TConfig - Configuration type
   * @param factory - Provider managers instance
   * @param config - Provider configuration
   * @throws {ProviderRegistryError} If provider already registered
   * @throws {ProviderRegistryError} If configuration is invalid
   *
   * @example
   * ```typescript
   * const cesiumFactory = new CesiumProviderFactory();
   * const cesiumConfig: ICesiumProviderConfig = {
   *   type: MapProviderType.CESIUM,
   *   name: 'Cesium 3D Maps',
   *   version: '1.0.0',
   *   capabilities: { ... },
   *   isDefault: true
   * };
   *
   * MapProviderRegistry.registerProvider(cesiumFactory, cesiumConfig);
   * ```
   */
  public static registerProvider<
    TProvider extends IMapProvider,
    TConfig extends IMapProviderConfig
  >(factory: IMapProviderFactory<TProvider, TConfig>, config: TConfig): void {
    const registry = MapProviderRegistry.getInstance();

    // Check for duplicate registration
    if (registry.providers.has(config.type)) {
      throw new ProviderRegistryError(
        ProviderRegistryErrorType.PROVIDER_ALREADY_REGISTERED,
        `Provider '${config.type}' is already registered. Unregister it first if you need to replace it.`,
        config.type
      );
    }

    // Register the provider
    registry.providers.set(config.type, {
      factory,
      config,
      isDefault: config.isDefault ?? false,
    });

    // Set as default if specified
    if (config.isDefault) {
      registry.defaultProviderType = config.type;
    }

    console.log(
      `[ProviderRegistry] Registered provider: ${config.type} (${
        config.name
      } v${config.version})${config.isDefault ? ' [DEFAULT]' : ''}`
    );
  }

  /**
   * Unregister a map provider
   * Use with caution - only unregister map-map-tile-map-providers that are no longer needed
   *
   * @param providerType - Type of provider to unregister
   * @throws {ProviderRegistryError} If provider not found
   */
  public static unregisterProvider(providerType: MapProviderType): void {
    const registry = MapProviderRegistry.getInstance();

    if (!registry.providers.has(providerType)) {
      throw new ProviderRegistryError(
        ProviderRegistryErrorType.PROVIDER_NOT_FOUND,
        `Provider '${providerType}' is not registered.`,
        providerType
      );
    }

    registry.providers.delete(providerType);

    // Clear default if this was the default provider
    if (registry.defaultProviderType === providerType) {
      registry.defaultProviderType = null;
    }
  }

  /**
   * Get a provider instance
   *
   * @param providerType - Type of provider to get (optional, uses default if not specified)
   * @returns Provider instance (not yet initialized)
   * @throws {ProviderRegistryError} If provider not found
   * @throws {ProviderRegistryError} If no default provider and type not specified
   *
   * @example
   * ```typescript
   * // Get specific provider
   * const cesiumProvider = MapProviderRegistry.getProvider(MapProviderType.CESIUM);
   *
   * // Get default provider
   * const defaultProvider = MapProviderRegistry.getProvider();
   * ```
   */
  public static getProvider<TProvider extends IMapProvider = IMapProvider>(
    providerType?: MapProviderType,
    context?: MapProviderCreationContext
  ): TProvider {
    const registry = MapProviderRegistry.getInstance();

    // Determine which provider to use
    const targetType = providerType ?? registry.defaultProviderType;

    if (!targetType) {
      throw new ProviderRegistryError(
        ProviderRegistryErrorType.NO_DEFAULT_PROVIDER,
        'No default provider set and no provider type specified. Call setDefaultProvider() or specify a provider type.'
      );
    }

    // Get provider entry
    const entry = registry.providers.get(targetType);

    if (!entry) {
      throw new ProviderRegistryError(
        ProviderRegistryErrorType.PROVIDER_NOT_FOUND,
        `Provider '${targetType}' is not registered. Available providers: ${Array.from(
          registry.providers.keys()
        ).join(', ')}`,
        targetType
      );
    }

    // Create provider instance using managers
    return entry.factory.createProviderInstance(
      entry.config,
      context
    ) as TProvider;
  }

  /**
   * Get provider configuration without creating an instance
   *
   * @param providerType - Type of provider
   * @returns Provider configuration
   * @throws {ProviderRegistryError} If provider not found
   */
  public static getProviderConfig(
    providerType: MapProviderType
  ): IMapProviderConfig {
    const registry = MapProviderRegistry.getInstance();

    const entry = registry.providers.get(providerType);

    if (!entry) {
      throw new ProviderRegistryError(
        ProviderRegistryErrorType.PROVIDER_NOT_FOUND,
        `Provider '${providerType}' is not registered.`,
        providerType
      );
    }

    return entry.config;
  }

  /**
   * Set the default provider
   *
   * @param providerType - Type of provider to set as default
   * @throws {ProviderRegistryError} If provider not found
   */
  public static setDefaultProvider(providerType: MapProviderType): void {
    const registry = MapProviderRegistry.getInstance();

    if (!registry.providers.has(providerType)) {
      throw new ProviderRegistryError(
        ProviderRegistryErrorType.PROVIDER_NOT_FOUND,
        `Cannot set default: Provider '${providerType}' is not registered.`,
        providerType
      );
    }

    registry.defaultProviderType = providerType;
    console.log(`[ProviderRegistry] Default provider set to: ${providerType}`);
  }

  /**
   * Get the default provider type
   *
   * @returns Default provider type or null if not set
   */
  public static getDefaultProviderType(): MapProviderType | null {
    return MapProviderRegistry.getInstance().defaultProviderType;
  }

  /**
   * Check if a provider is registered
   *
   * @param providerType - Type of provider to check
   * @returns True if provider is registered
   */
  public static isProviderRegistered(providerType: MapProviderType): boolean {
    return MapProviderRegistry.getInstance().providers.has(providerType);
  }

  /**
   * Get all registered provider types
   *
   * @returns Array of registered provider types
   */
  public static getRegisteredProviders(): MapProviderType[] {
    return Array.from(MapProviderRegistry.getInstance().providers.keys());
  }

  /**
   * Clear all registered map-map-tile-map-providers
   * **WARNING**: Use only for testing or complete application reset
   */
  public static clearAll(): void {
    const registry = MapProviderRegistry.getInstance();
    registry.providers.clear();
    registry.defaultProviderType = null;
    console.log('[MapProviderRegistry] All map-map-tile-map-providers cleared');
  }

  /**
   * Reset the singleton instance
   * **WARNING**: Use only for testing
   */
  public static resetInstance(): void {
    MapProviderRegistry.instance = null;
    console.log('[MapProviderRegistry] Instance reset');
  }
}
