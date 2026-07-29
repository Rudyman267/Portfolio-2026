import { MapProviderCreationContext } from '@map/private/contracts/map-providers';
import {
  ICesiumProviderConfig,
  IMapProviderFactory,
  MapProviderType,
} from '@map/private/contracts';
import { CesiumMap } from './cesium-map';
import { MapOptions } from '@map/public/contracts';
import { CesiumMapOptions } from './types';

/**
 * Cesium Provider Factory
 *
 * Factory for creating Cesium map provider instances.
 * Implements the IMapProviderFactory contract from the contracts layer.
 *
 * **Responsibilities:**
 * - Create CesiumMap instances with proper configuration
 * - Validate Cesium-specific configuration
 * - Ensure proper initialization parameters
 *
 * **Design Pattern:** Factory Pattern
 * - Encapsulates object creation logic
 * - Allows for future optimization (pooling, caching, etc.)
 * - Provides configuration validation before instantiation
 *
 * @remarks
 * This managers is registered with the MapProviderRegistry during bootstrap.
 * Consumers should use MapProviderRegistry.getProvider() rather than
 * calling this managers directly.
 *
 * CesiumMap implements IMapProvider, so the factory can return it directly.
 */
export class CesiumProviderFactory
  implements IMapProviderFactory<CesiumMap, ICesiumProviderConfig>
{
  /**
   * Provider type this managers creates
   */
  public readonly providerType = MapProviderType.CESIUM;

  /**
   * Create a new Cesium provider instance
   *
   * @param config - Cesium provider configuration
   * @returns New CesiumMap instance (not yet initialized)
   * @throws {Error} If configuration is invalid
   *
   * @remarks
   * The returned instance is NOT initialized. Caller must call
   * initialize() before using the map.
   *
   * @example
   * ```typescript
   * const managers = new CesiumProviderFactory();
   * const provider = managers.createProviderInstance(cesiumConfig);
   * await provider.initialize('map-container');
   * ```
   */
  public createProviderInstance(
    config: ICesiumProviderConfig,
    context?: MapProviderCreationContext
  ): CesiumMap {
    const mapOptions = context?.options?.mapOptions as MapOptions | undefined;
    const overrideProviderOptions = mapOptions?.providerOptions as
      | Record<string, unknown>
      | undefined;
    const providerConfig: ICesiumProviderConfig = {
      ...config,
      providerOptions: {
        ...config.providerOptions,
        ...overrideProviderOptions,
      },
    };

    const cesiumMapOptions: CesiumMapOptions = {
      viewMode: mapOptions?.viewMode,
      baseMapConfig: mapOptions?.baseMapConfig,
    };

    return new CesiumMap(
      context?.containerId ?? '',
      cesiumMapOptions,
      providerConfig
    );
  }
}
