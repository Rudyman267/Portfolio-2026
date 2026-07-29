/**
 * Public map factory API
 * Re-exports the runtime implementation so the public surface stays free of private imports.
 */
export {
  createMapInstanceWithProvider,
  MapProviderType,
} from '../../../runtime/map-instance';
