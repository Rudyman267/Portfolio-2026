/**
 * Runtime Layer: Bootstrap & Initialization
 *
 * This layer handles the initialization and wiring of the map library.
 * It bridges the contracts layer (pure base) with the private layer
 * (implementations) by registering map-map-tile-map-providers and setting up the runtime environment.
 *
 * **Responsibilities:**
 * - Provider registration during application startup
 * - Default configuration management
 * - Bootstrap lifecycle management
 * - Provider registry initialization
 *
 * **Usage Flow:**
 * 1. Application calls bootstrapMapLibrary() during startup
 * 2. Bootstrap registers Cesium provider (and future map-map-tile-map-providers)
 * 3. Application can now use createMapInstance() to create maps
 * 4. Maps are created using registered map-map-tile-map-providers via the registry
 *
 * @module runtime
 */

export {
  bootstrapMapLibrary,
  resetBootstrap,
  isLibraryBootstrapped,
  type BootstrapOptions,
  type BootstrapResult,
} from './bootstrap';
