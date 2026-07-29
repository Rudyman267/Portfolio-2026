/**
 * Contracts: Map Provider System
 *
 * Provider registry and base for supporting multiple map platforms (Cesium, Mapbox, etc.)
 *
 * **Architecture:**
 * - Pure contracts in contracts layer (this module)
 * - Implementations in private layer (e.g., CesiumProvider)
 * - Bootstrap/wiring in runtime layer
 *
 * **Key Components:**
 * - Provider types and capabilities
 * - Provider configuration base
 * - IMapProvider interface (provider contract)
 * - IMapProviderFactory interface (managers contract)
 * - MapProviderRegistry (singleton registry for managing map-map-tile-map-providers)
 *
 * **Usage Flow:**
 * 1. Runtime layer registers map-map-tile-map-providers during bootstrap
 * 2. Public layer uses MapProviderRegistry to get map-map-tile-map-providers
 * 3. Providers create map instances with proper initialization
 */

// Provider types and capabilities
export * from './map-provider-types';

// Provider configuration
export * from './map-provider-config';

// Provider base
export * from './map-provider.interface';

// Provider registry
export * from './map-provider-registry';
