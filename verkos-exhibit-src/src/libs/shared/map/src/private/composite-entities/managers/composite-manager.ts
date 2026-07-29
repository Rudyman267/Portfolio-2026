import {
  HeightReferenceLineOptions,
  IBaseEntityManager,
  ICompositeManager,
  IFBCircle,
  IFBCircleOptions,
  IFbHeightReferenceLine,
  IFBMarker,
  IFBMarkerOptions,
  IFBModel,
  IFBModelOptions,
  IFBPolygon,
  IFBPolygonFromCenterOptions,
  IFBPolygonOptions,
  IFBPolyline,
  IFBPolylineOptions,
  IMapProviderServices,
} from '@map/private/contracts';
import {
  FBCircle,
  FbHeightReferenceLine,
  FBMarker,
  FBModel,
  FBPolygon,
  FBPolyline,
} from '../entities';

/**
 * Implementation of the Composite Manager
 * Manages creation and retrieval of composite entities using provider services
 */
export class CompositeManager implements ICompositeManager {
  /**
   * Map of polyline entities by ID
   * @private
   */
  private _fbPolylines: Map<string, IFBPolyline> = new Map();

  /**
   * Map of circle entities by ID
   * @private
   */
  private _fbCircles: Map<string, IFBCircle> = new Map();

  /**
   * Map of polygon entities by ID
   * @private
   */
  private _fbPolygons: Map<string, IFBPolygon> = new Map();

  /**
   * Map of marker entities by ID
   * @private
   */
  private _fbMarkers: Map<string, IFBMarker> = new Map();

  /**
   * Map of model entities by ID
   * @private
   */
  private _fbModels: Map<string, IFBModel> = new Map();

  /**
   * Map of height reference line entities by ID
   * @private
   */
  private _fbHeightReferenceLines: Map<string, IFbHeightReferenceLine> =
    new Map();

  /**
   * Constructor for CompositeManager
   * @param mapProviderServices The map provider services for creating and manipulating entities
   */
  constructor(public readonly mapProviderServices: IMapProviderServices) {}

  /**
   * Create a new FBPolyline entity
   * @param options Configuration options for the polyline
   * @returns The created FBPolyline entity
   */
  createFBPolyline(options: IFBPolylineOptions): IFBPolyline {
    // Create the entity with provider services
    const entity = new FBPolyline(this.mapProviderServices, options);

    // Store in local registry
    this._fbPolylines.set(entity.id, entity);

    return entity;
  }

  /**
   * Create a new FBCircle entity
   * @param options Configuration options for the circle
   * @returns The created FBCircle entity
   */
  createFBCircle(options: IFBCircleOptions): IFBCircle {
    // Create the entity with provider services
    const entity = new FBCircle(this.mapProviderServices, options);

    // Store in local registry
    this._fbCircles.set(entity.id, entity);

    return entity;
  }

  /**
   * Create a new FBPolygon entity from positions
   * @param options Configuration options for the polygon
   * @returns The created FBPolygon entity
   */
  createFBPolygon(options: IFBPolygonOptions): IFBPolygon {
    const entity = FBPolygon.fromPositions(this.mapProviderServices, options);
    this._fbPolygons.set(entity.id, entity);
    return entity;
  }

  /**
   * Create a new FBPolygon entity from center point and radius
   * @param options Configuration options for the polygon including center and radius
   * @returns The created FBPolygon entity
   */
  createFBPolygonFromCenter(options: IFBPolygonFromCenterOptions): IFBPolygon {
    const entity = FBPolygon.fromCenter(this.mapProviderServices, {
      ...options,
      position: {
        latitude: options.position.latitude,
        longitude: options.position.longitude,
        altitude: 0,
      },
    });
    this._fbPolygons.set(entity.id, entity);
    return entity;
  }

  /**
   * Create a new FBMarker entity
   * @param options Configuration options for the marker
   * @returns The created FBMarker entity
   */
  createFBMarker(options: IFBMarkerOptions): IFBMarker {
    // Create the entity with provider services
    const entity = new FBMarker(this.mapProviderServices, options);

    // Store in local registry
    this._fbMarkers.set(entity.id, entity);

    return entity;
  }

  /**
   * Create a new FBModel entity
   * @param options Configuration options for the model
   * @returns The created FBModel entity
   */
  createFBModel(options: IFBModelOptions): IFBModel {
    // Create the entity with provider services
    const entity = new FBModel(this.mapProviderServices, options);

    // Store in local registry
    this._fbModels.set(entity.id, entity);

    return entity;
  }

  /**
   * Create a new FBHeightReferenceLine entity
   * @param options Configuration options for the height reference line
   * @returns The created FBHeightReferenceLine entity
   */
  createFBHeightReferenceLine(
    options: HeightReferenceLineOptions
  ): IFbHeightReferenceLine {
    // Create the entity with provider services
    const entity = new FbHeightReferenceLine(this.mapProviderServices, options);

    // Store in local registry
    this._fbHeightReferenceLines.set(entity.id, entity);

    return entity;
  }

  /**
   * Get a FBPolyline entity by its ID
   * @param id The ID of the polyline to retrieve
   * @returns The FBPolyline entity or undefined if not found
   */
  getFBPolyline(id: string): IFBPolyline | undefined {
    return this._fbPolylines.get(id);
  }

  /**
   * Get a FBCircle entity by its ID
   * @param id The ID of the circle to retrieve
   * @returns The FBCircle entity or undefined if not found
   */
  getFBCircle(id: string): IFBCircle | undefined {
    return this._fbCircles.get(id);
  }

  /**
   * Get a FBPolygon entity by its ID
   * @param id The ID of the polygon to retrieve
   * @returns The FBPolygon entity or undefined if not found
   */
  getFBPolygon(id: string): IFBPolygon | undefined {
    return this._fbPolygons.get(id);
  }

  /**
   * Get a FBMarker entity by its ID
   * @param id The ID of the marker to retrieve
   * @returns The FBMarker entity or undefined if not found
   */
  getFBMarker(id: string): IFBMarker | undefined {
    return this._fbMarkers.get(id);
  }

  /**
   * Get a FBModel entity by its ID
   * @param id The ID of the model to retrieve
   * @returns The FBModel entity or undefined if not found
   */
  getFBModel(id: string): IFBModel | undefined {
    return this._fbModels.get(id);
  }

  /**
   * Get a FBHeightReferenceLine entity by its ID
   * @param id The ID of the height reference line to retrieve
   * @returns The FBHeightReferenceLine entity or undefined if not found
   */
  getFBHeightReferenceLine(id: string): IFbHeightReferenceLine | undefined {
    return this._fbHeightReferenceLines.get(id);
  }

  /**
   * Clear all composite entities
   * Removes all entities from the map by calling their remove methods
   * and clears all entity collections
   */
  clearAll(): void {
    // Clean up all polylines
    this._fbPolylines.forEach((entity) => {
      entity.remove();
    });
    this._fbPolylines.clear();

    // Clean up all circles
    this._fbCircles.forEach((entity) => {
      entity.remove();
    });
    this._fbCircles.clear();

    // Clean up all polygons
    this._fbPolygons.forEach((entity) => {
      entity.remove();
    });
    this._fbPolygons.clear();

    // Clean up all markers
    this._fbMarkers.forEach((entity) => {
      entity.remove();
    });
    this._fbMarkers.clear();

    // Clean up all models
    this._fbModels.forEach((entity) => {
      entity.remove();
    });
    this._fbModels.clear();

    // Clean up all height reference lines
    this._fbHeightReferenceLines.forEach((entity) => {
      entity.remove();
    });
    this._fbHeightReferenceLines.clear();
  }

  /**
   * ONLY AND ONLY FOR TESTING AND DEVELOPMENT PURPOSES
   * Get the base entity manager
   * @returns The base entity managers
   */

  getBaseManager(): IBaseEntityManager | null {
    return this.mapProviderServices.baseEntityManager;
  }
}
