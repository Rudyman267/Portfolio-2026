import {
  BaseMapProvider,
  ConfigurableBaseMapProvider,
} from '@map/private/map-providers/cesium/map-tile-providers';
import { ArcGisConfig, LocalConfig } from '@map/public/contracts';
import { BaseMapType } from '@map/public/core';

/**
 * Provider registry - will be populated with concrete provider implementations
 * Registration is managed by CesiumMapService during map initialization lifecycle
 */
export class ProviderRegistry {
  private providers = new Map<BaseMapType, () => BaseMapProvider>();

  /**
   * Register a provider managers function
   */
  registerProvider(type: BaseMapType, factory: () => BaseMapProvider): void {
    this.providers.set(type, factory);
  }

  /**
   * Get provider instance for the given type
   */
  getProvider(type: BaseMapType): BaseMapProvider | undefined {
    const factory = this.providers.get(type);
    return factory ? factory() : undefined;
  }

  /**
   * Get all registered provider types
   */
  getRegisteredTypes(): BaseMapType[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Base Map Provider Factory
 *
 * Provider registration is managed through the CesiumMapService lifecycle.
 * Providers are registered once during the first map instance creation via registerAllProviders().
 */
export class BaseMapProviderFactory {
  private registry: ProviderRegistry;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
  }

  /**
   * Get a provider instance for the given base map type
   * @param baseMapType The base map type
   * @returns Provider instance
   * @throws Error if provider type is not supported
   */
  getProvider(baseMapType: BaseMapType): BaseMapProvider {
    const provider = this.registry.getProvider(baseMapType);

    if (!provider) {
      throw new Error(
        `Unsupported base map type: ${baseMapType}. Available types: ${this.registry
          .getRegisteredTypes()
          .join(', ')}`
      );
    }

    return provider;
  }

  /**
   * Get a provider instance with configuration
   * @param baseMapType The base map type
   * @param config Optional provider-specific configuration
   * @returns Configured provider instance
   * @throws Error if provider type is not supported or configuration is invalid
   */
  getProviderWithConfig(
    baseMapType: BaseMapType,
    config?: ArcGisConfig | LocalConfig
  ): BaseMapProvider {
    const provider = this.getProvider(baseMapType);

    // Validate and set configuration if provided
    if (config) {
      if (provider instanceof ConfigurableBaseMapProvider) {
        if (!provider.validateConfig(config)) {
          throw new Error(
            `Invalid configuration for ${provider.getProviderName()}: ${JSON.stringify(
              config
            )}`
          );
        }
        provider.setConfig(config);
      } else {
        console.warn(
          `Provider ${provider.getProviderName()} does not accept configuration, ignoring config parameter`
        );
      }
    }

    return provider;
  }

  /**
   * Register a new provider type
   * Called by CesiumMapService during map initialization
   * @param baseMapType The base map type
   * @param providerFactory Factory function to create provider instances
   */
  registerProvider(
    baseMapType: BaseMapType,
    providerFactory: () => BaseMapProvider
  ): void {
    this.registry.registerProvider(baseMapType, providerFactory);
  }
}
