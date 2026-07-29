import {
  IBaseEntityManager,
  IMapProviderServices,
  IMapServices,
} from '@map/private/contracts';

import { CesiumBaseEntityManager } from '@map/private/map-providers/cesium/managers';
import { CesiumMapServicesImplementation } from './cesium-map-services-implementation';
import { ICesiumMapService } from '@map/private/map-providers/cesium/types';

/**
 * Cesium implementation of the IMapProviderServices interface
 * Provides unified access to entity managers and map services
 */
export class CesiumProviderServices implements IMapProviderServices {
  private _entityFactory: IBaseEntityManager;
  private _mapServices: IMapServices;

  /**
   * Get the entity managers instance
   */
  public get baseEntityManager(): IBaseEntityManager {
    return this._entityFactory;
  }

  /**
   * Get the map services instance
   */
  public get mapServices(): IMapServices {
    return this._mapServices;
  }

  /**
   * Create a new provider services instance
   * @param mapService The underlying Cesium map service
   */
  constructor(private readonly mapService: ICesiumMapService) {
    // Create and initialize the entity managers
    this._entityFactory = new CesiumBaseEntityManager(mapService);

    // Create and initialize the map services
    this._mapServices = new CesiumMapServicesImplementation(mapService);
  }

  /**
   * Dispose of all services and release resources
   */
  public dispose(): void {
    // Clear all entities created by the managers
    this._entityFactory.clear();
  }
}
