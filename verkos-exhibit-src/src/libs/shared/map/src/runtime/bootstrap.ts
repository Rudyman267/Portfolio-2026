import {
  ICesiumProviderConfig,
  MapProviderRegistry,
  MapProviderType,
} from '@map/private/contracts/map-providers';
import { CesiumProviderFactory } from '@map/private/map-providers/cesium/cesium-provider-factory';
import { DEFAULT_CESIUM_PROVIDER_CONFIG } from '@map/private/map-providers/cesium/types/default-cesium-config';

/**
 * Bootstrap configuration options
 * Allows customization of the bootstrap process
 */
export interface BootstrapOptions {
  /**
   * Whether to automatically set Cesium as default provider
   * @default true
   */
  setCesiumAsDefault?: boolean;
}

/**
 * Bootstrap result
 * Contains information about the bootstrap process
 */
export interface BootstrapResult {
  /**
   * Whether bootstrap was successful
   */
  success: boolean;

  /**
   * Registered provider types
   */
  registeredProviders: MapProviderType[];

  /**
   * Default provider type (if set)
   */
  defaultProvider: MapProviderType | null;

  /**
   * Any errors encountered during bootstrap
   */
  errors: string[];

  /**
   * Bootstrap timestamp
   */
  timestamp: Date;
}

/**
 * Flag to track if bootstrap has been called
 * Prevents multiple bootstrap calls
 */
let isBootstrapped = false;

/**
 * Bootstrap the map library
 *
 * Initializes the provider registry and registers default map-providers.
 * This function should be called once during application startup,
 * before creating any map instances.
 *
 * **Responsibilities:**
 * - Register Cesium provider managers
 * - Set up default provider
 * - Initialize provider configurations
 * - Validate bootstrap prerequisites
 *
 * **Idempotency:**
 * This function is idempotent - calling it multiple times is safe.
 * Subsequent calls will return the existing bootstrap result.
 *
 * @param options - Optional bootstrap configuration
 * @returns Bootstrap result with registration details
 *
 * @remarks
 * - Call this before using createMapInstance()
 * - Safe to call multiple times (idempotent)
 * - Errors are logged and returned in result
 * - In production, call this during app initialization
 */
export function bootstrapMapLibrary(
  options: BootstrapOptions = {}
): BootstrapResult {
  const { setCesiumAsDefault = true } = options;

  const result: BootstrapResult = {
    success: false,
    registeredProviders: [],
    defaultProvider: null,
    errors: [],
    timestamp: new Date(),
  };

  try {
    // Check if already bootstrapped
    if (isBootstrapped) {
      result.success = true;
      result.registeredProviders = MapProviderRegistry.getRegisteredProviders();
      result.defaultProvider = MapProviderRegistry.getDefaultProviderType();
      return result;
    }

    // Register Cesium provider
    registerCesiumMapProvider(setCesiumAsDefault);

    // Update result
    result.success = true;
    result.registeredProviders = MapProviderRegistry.getRegisteredProviders();
    result.defaultProvider = MapProviderRegistry.getDefaultProviderType();

    isBootstrapped = true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    console.error('[Bootstrap] Bootstrap failed:', errorMessage);

    if (error instanceof Error && error.stack) {
      console.error('[Bootstrap] Stack trace:', error.stack);
    }
  }

  return result;
}

/**
 * Reset the bootstrap state
 * This will:
 * - Clear the bootstrap flag
 * - Clear all registered map-map-tile-map-providers
 * - Reset the provider registry
 *
 * @remarks
 * After calling this, you must call bootstrapMapLibrary() again
 * before creating new map instances.
 */
export function resetBootstrap(): void {
  isBootstrapped = false;
  MapProviderRegistry.clearAll();
  MapProviderRegistry.resetInstance();
  console.log('[Bootstrap] Bootstrap state reset');
}

/**
 * Check if the library has been bootstrapped
 * @returns True if bootstrapMapLibrary() has been called successfully
 */
export function isLibraryBootstrapped(): boolean {
  return isBootstrapped;
}

function registerCesiumMapProvider(setCesiumAsDefault = true): void {
  const finalCesiumConfig: ICesiumProviderConfig = {
    ...DEFAULT_CESIUM_PROVIDER_CONFIG,
    // Ensure type is always CESIUM
    type: MapProviderType.CESIUM,
    isDefault: setCesiumAsDefault,
  };

  // Create Cesium provider managers
  const cesiumFactory = new CesiumProviderFactory();

  MapProviderRegistry.registerProvider(cesiumFactory, finalCesiumConfig);
}
