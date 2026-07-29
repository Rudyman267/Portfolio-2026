import { IBaseEntityManager } from '@map/private/contracts/base-entities';
import { IMapServices } from './map-services';

/**
 * Interface for map provider services that combines entity managers and map utility functions
 * This interface serves as the central access point for all map provider capabilities
 * It enables composite entities to access both entity creation and map utility functions
 * through a single interface without knowing the specific provider implementation
 */
export interface IMapProviderServices {
  /**
   * Base Entity Manager for creating base map entities
   * Provides methods to create and manage primitive map entities
   */
  baseEntityManager: IBaseEntityManager;

  /**
   * Map services for accessing map-specific utility functions
   */
  mapServices: IMapServices;
}
