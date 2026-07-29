/**
 * Map Library - Public Entry Point
 */
// Bootstrap functions (optional explicit initialization)
export {
  bootstrapMapLibrary,
  resetBootstrap,
  isLibraryBootstrapped,
  type BootstrapOptions,
  type BootstrapResult,
} from '../runtime';

// Public contracts (types/base/constants)
export * from './contracts';

// Public core (constants/types/utils/factories)
export * from './core';
