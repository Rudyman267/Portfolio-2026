import { IBaseEntityManager } from '@map/private/contracts/base-entities';
import { IMapProviderServices } from '@map/private/contracts/services';
import {
  IFBCircle,
  IFBPolyline,
  IFBPolygon,
  IFBMarker,
  IFBModel,
  IFbHeightReferenceLine,
} from '@map/private/contracts/composite-entities/entities';
import {
  HeightReferenceLineOptions,
  IFBCircleOptions,
  IFBMarkerOptions,
  IFBModelOptions,
  IFBPolygonOptions,
  IFBPolygonFromCenterOptions,
  IFBPolylineOptions,
} from '@map/private/contracts/composite-entities/types';

/**
 * Interface for the Composite Manager
 * This manager handles creation and retrieval of composite entities
 * Following the design pattern, this manager only provides create, get, and clear methods
 * All entities manage their own operations, updates, and individual lifecycle
 */
export interface ICompositeManager {
  /**
   * The map provider services instance used by this manager
   * Provides access to entity managers and map services
   */
  readonly mapProviderServices: IMapProviderServices;

  /**
   * Create a new FBPolyline composite entity
   * @param options Configuration options for the polyline
   * @returns The created FBPolyline entity
   */
  createFBPolyline(options: IFBPolylineOptions): IFBPolyline;

  /**
   * Create a new FBCircle composite entity
   * @param options Configuration options for the circle
   * @returns The created FBCircle entity
   */
  createFBCircle(options: IFBCircleOptions): IFBCircle;

  /**
   * Create a new FBPolygon composite entity from positions
   * @param options Configuration options for the polygon
   * @returns The created FBPolygon entity
   */
  createFBPolygon(options: IFBPolygonOptions): IFBPolygon;

  /**
   * Create a new FBPolygon composite entity from center point and radius
   * @param options Configuration options for the polygon including center and radius
   * @returns The created FBPolygon entity
   */
  createFBPolygonFromCenter(options: IFBPolygonFromCenterOptions): IFBPolygon;

  /**
   * Create a new FBMarker composite entity
   * @param options Configuration options for the marker
   * @returns The created FBMarker entity
   */
  createFBMarker(options: IFBMarkerOptions): IFBMarker;

  /**
   * Create a new FBModel composite entity
   * @param options Configuration options for the model
   * @returns The created FBModel entity
   */
  createFBModel(options: IFBModelOptions): IFBModel;

  /**
   * Create a new FBHeightReferenceLine composite entity
   * @param options Configuration options for the height reference line
   * @returns The created FBHeightReferenceLine entity
   */
  createFBHeightReferenceLine(
    options: HeightReferenceLineOptions
  ): IFbHeightReferenceLine;

  /**
   * Get a FBPolyline entity by its ID
   * @param id The ID of the polyline to retrieve
   * @returns The FBPolyline entity or undefined if not found
   */
  getFBPolyline(id: string): IFBPolyline | undefined;

  /**
   * Get a FBCircle entity by its ID
   * @param id The ID of the circle to retrieve
   * @returns The FBCircle entity or undefined if not found
   */
  getFBCircle(id: string): IFBCircle | undefined;

  /**
   * Get a FBPolygon entity by its ID
   * @param id The ID of the polygon to retrieve
   * @returns The FBPolygon entity or undefined if not found
   */
  getFBPolygon(id: string): IFBPolygon | undefined;

  /**
   * Get a FBMarker entity by its ID
   * @param id The ID of the marker to retrieve
   * @returns The FBMarker entity or undefined if not found
   */
  getFBMarker(id: string): IFBMarker | undefined;

  /**
   * Get a FBModel entity by its ID
   * @param id The ID of the model to retrieve
   * @returns The FBModel entity or undefined if not found
   */
  getFBModel(id: string): IFBModel | undefined;

  /**
   * Get a FBHeightReferenceLine entity by its ID
   * @param id The ID of the height reference line to retrieve
   * @returns The FBHeightReferenceLine entity or undefined if not found
   */
  getFBHeightReferenceLine(id: string): IFbHeightReferenceLine | undefined;

  /**
   * Clear all composite entities
   * Removes all entities from the map and registry
   */
  clearAll(): void;

  /**
   * ONLY AND ONLY FOR TESTING AND DEVELOPMENT PURPOSES
   * Get the base manager instance
   * @returns The IBaseEntityManager instance or null if not available
   */
  getBaseManager(): IBaseEntityManager | null;
}
