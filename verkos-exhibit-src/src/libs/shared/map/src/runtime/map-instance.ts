import {
  DEFAULT_MAP_OPTIONS,
  IFlytMap,
  MapOptions,
} from '@map/public/contracts';
import {
  MapProviderCreationContext,
  MapProviderRegistry,
  MapProviderType,
} from '@map/private/contracts/map-providers';
import { bootstrapMapLibrary, isLibraryBootstrapped } from './bootstrap';

function ensureBootstrap(): void {
  if (!isLibraryBootstrapped()) {
    const result = bootstrapMapLibrary();
    if (!result.success) {
      throw new Error(
        `Failed to bootstrap map library: ${result.errors.join(', ')}`
      );
    }
  }
}

function buildProviderContext(
  containerId: string,
  mapOptions?: MapOptions
): MapProviderCreationContext {
  return {
    containerId,
    options: { mapOptions: mapOptions ?? DEFAULT_MAP_OPTIONS },
  };
}

/**
 * Runtime managers that creates and returns a map implementation.
 *
 * Lives in the runtime layer to avoid public -> private imports.
 */
export function createMapInstanceWithProvider(
  providerType = MapProviderType.CESIUM,
  containerId: string,
  mapOptions?: MapOptions
): IFlytMap {
  ensureBootstrap();
  const provider = MapProviderRegistry.getProvider(
    providerType,
    buildProviderContext(containerId, mapOptions)
  );

  return provider.mapInstance as IFlytMap;
}

export { MapProviderType };
