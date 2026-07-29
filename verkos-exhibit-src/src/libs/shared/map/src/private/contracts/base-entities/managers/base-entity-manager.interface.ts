import {
  IBasePoint,
  IBasePolyline,
  IBasePolygon,
  IBaseCircle,
  IBaseLabel,
  IBaseMarker,
  IBaseModel,
  IPointConfig,
  IPolylineConfig,
  IPolygonConfig,
  ICircleConfig,
  ILabelConfig,
  IMarkerConfig,
  IModelConfig,
} from '@map/private/contracts/base-entities';

/**
 * Interface for a managers that creates base map entities
 * This managers is defined in the Base layer and implemented in the Cesium layer
 * It enables creation of primitive map entities without exposing provider-specific implementations
 */
export interface IBaseEntityManager {
  /**
   * Creates a base point entity
   * @param config Point configuration options
   * @returns IBasePoint implementation
   */
  createBasePoint(config: IPointConfig): IBasePoint;

  /**
   * Creates a base polyline entity
   * @param config Polyline configuration options
   * @returns IBasePolyline implementation
   */
  createBasePolyline(config: IPolylineConfig): IBasePolyline;

  /**
   * Creates a base polygon entity
   * @param config Polygon configuration options
   * @returns IBasePolygon implementation
   */
  createBasePolygon(config: IPolygonConfig): IBasePolygon;

  /**
   * Creates a base circle entity
   * @param config Circle configuration options
   * @returns IBaseCircle implementation
   */
  createBaseCircle(config: ICircleConfig): IBaseCircle;

  /**
   * Creates a base label entity
   * @param config Label configuration options
   * @returns IBaseLabel implementation
   */
  createBaseLabel(config: ILabelConfig): IBaseLabel;

  /**
   * Creates a base marker entity
   * @param config Marker configuration options
   * @returns IBaseMarker implementation
   */
  createBaseMarker(config: IMarkerConfig): IBaseMarker;

  /**
   * Creates a base 3D model entity
   * @param config Model configuration options
   * @returns IBaseModel implementation
   */
  createBaseModel(config: IModelConfig): IBaseModel;

  /**
   * Gets a base point entity by ID
   * @param id The entity ID
   * @returns The point entity if found, undefined otherwise
   */
  getBasePoint(id: string): IBasePoint | undefined;

  /**
   * Gets a base polyline entity by ID
   * @param id The entity ID
   * @returns The polyline entity if found, undefined otherwise
   */
  getBasePolyline(id: string): IBasePolyline | undefined;

  /**
   * Gets a base polygon entity by ID
   * @param id The entity ID
   * @returns The polygon entity if found, undefined otherwise
   */
  getBasePolygon(id: string): IBasePolygon | undefined;

  /**
   * Gets a base circle entity by ID
   * @param id The entity ID
   * @returns The circle entity if found, undefined otherwise
   */
  getBaseCircle(id: string): IBaseCircle | undefined;

  /**
   * Gets a base label entity by ID
   * @param id The entity ID
   * @returns The label entity if found, undefined otherwise
   */
  getBaseLabel(id: string): IBaseLabel | undefined;

  /**
   * Gets a base marker entity by ID
   * @param id The entity ID
   * @returns The marker entity if found, undefined otherwise
   */
  getBaseMarker(id: string): IBaseMarker | undefined;

  /**
   * Gets a base model entity by ID
   * @param id The entity ID
   * @returns The model entity if found, undefined otherwise
   */
  getBaseModel(id: string): IBaseModel | undefined;

  /**
   * Clears all entities created by this managers and releases resources
   */
  clear(): void;

  /**
   * Register height reference line entities to the listener collection for bulk visibility management
   * Factory will retrieve entities by ID from local map and extract provider-specific entities internally
   * @param polylineId ID of the base polyline entity
   * @param pointId ID of the base point entity
   */
  registerToHeightReferenceListenerEntities(
    polylineId: string,
    pointId: string
  ): void;

  /**
   * Unregister height reference line entities from the listener collection
   * Factory will retrieve entities by ID from local map and extract provider-specific entities internally
   * @param polylineId ID of the base polyline entity
   * @param pointId ID of the base point entity
   */
  unregisterFromHeightReferenceListenerEntities(
    polylineId: string,
    pointId: string
  ): void;
}
