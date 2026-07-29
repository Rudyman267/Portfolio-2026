import { Entity } from 'cesium';
import { v4 } from 'uuid';
import {
  IBaseCircle,
  IBaseEntityManager,
  IBaseLabel,
  IBaseMarker,
  IBaseModel,
  IBasePoint,
  IBasePolygon,
  IBasePolyline,
  ICircleConfig,
  ILabelConfig,
  IMarkerConfig,
  IModelConfig,
  IPointConfig,
  IPolygonConfig,
  IPolylineConfig,
} from '@map/private/contracts';
import {
  CesiumBaseCircle,
  CesiumBaseLabel,
  CesiumBaseMarker,
  CesiumBaseModel,
  CesiumBasePoint,
  CesiumBasePolygon,
  CesiumBasePolyline,
} from '@map/private/map-providers/cesium/entities';
import { ICesiumMapService } from '@map/private/map-providers/cesium/types';
import { CesiumEventsManager } from '@map/private/map-providers/cesium/events';

/**
 * Cesium implementation of the BaseEntityFactory
 * Creates and manages base entities using Cesium
 */
export class CesiumBaseEntityManager implements IBaseEntityManager {
  // Entity collections for storage and retrieval
  private pointEntities: Map<string, IBasePoint> = new Map();
  private polylineEntities: Map<string, IBasePolyline> = new Map();
  private polygonEntities: Map<string, IBasePolygon> = new Map();
  private circleEntities: Map<string, IBaseCircle> = new Map();
  private labelEntities: Map<string, IBaseLabel> = new Map();
  private markerEntities: Map<string, IBaseMarker> = new Map();
  private modelEntities: Map<string, IBaseModel> = new Map();

  /**
   * Create a base entity managers
   * @param mapService Cesium map service for accessing viewer and other services
   */
  constructor(private readonly mapService: ICesiumMapService) {}

  /**
   * Creates a base point entity
   * @param config Point configuration
   * @returns Base point implementation
   */
  createBasePoint(config: IPointConfig): IBasePoint {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const pointConfig: IPointConfig = {
      ...config,
      id,
    };

    // Create the entity
    const point = new CesiumBasePoint(this.mapService, pointConfig);

    // Store in registry
    this.pointEntities.set(point.id, point);

    return point;
  }

  /**
   * Creates a base polyline entity
   * @param config Polyline configuration
   * @returns Base polyline implementation
   */
  createBasePolyline(config: IPolylineConfig): IBasePolyline {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const polylineConfig: IPolylineConfig = {
      ...config,
      id,
    };

    // Create the entity
    const polyline = new CesiumBasePolyline(this.mapService, polylineConfig);

    // Store in registry
    this.polylineEntities.set(polyline.id, polyline);

    return polyline;
  }

  /**
   * Creates a base polygon entity
   * @param config Polygon configuration
   * @returns Base polygon implementation
   */
  createBasePolygon(config: IPolygonConfig): IBasePolygon {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const polygonConfig: IPolygonConfig = {
      ...config,
      id,
    };

    // Create the entity
    const polygon = new CesiumBasePolygon(this.mapService, polygonConfig);

    // Store in registry
    this.polygonEntities.set(polygon.id, polygon);

    return polygon;
  }

  /**
   * Creates a base circle entity
   * @param config Circle configuration
   * @returns Base circle implementation
   */
  createBaseCircle(config: ICircleConfig): IBaseCircle {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const circleConfig: ICircleConfig = {
      ...config,
      id,
    };

    // Create the entity
    const circle = new CesiumBaseCircle(this.mapService, circleConfig);

    // Store in registry
    this.circleEntities.set(circle.id, circle);

    return circle;
  }

  /**
   * Creates a base label entity
   * @param config Label configuration
   * @returns Base label implementation
   */
  createBaseLabel(config: ILabelConfig): IBaseLabel {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const labelConfig: ILabelConfig = {
      ...config,
      id,
    };

    // Create the entity
    const label = new CesiumBaseLabel(this.mapService, labelConfig);

    // Store in registry
    this.labelEntities.set(label.id, label);

    return label;
  }

  /**
   * Creates a base marker entity
   * @param config Marker configuration
   * @returns Base marker implementation
   */
  createBaseMarker(config: IMarkerConfig): IBaseMarker {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const markerConfig: IMarkerConfig = {
      ...config,
      id,
    };

    // Create the entity
    const marker = new CesiumBaseMarker(this.mapService, markerConfig);

    // Store in registry
    this.markerEntities.set(marker.id, marker);

    return marker;
  }

  /**
   * Creates a base 3D model entity
   * @param config Model configuration
   * @returns Base model implementation
   */
  createBaseModel(config: IModelConfig): IBaseModel {
    // Generate ID if not provided
    const id = config.id || v4();

    // Create configuration with ID
    const modelConfig: IModelConfig = {
      ...config,
      id,
    };

    // Create the entity
    const model = new CesiumBaseModel(this.mapService, modelConfig);

    // Store in registry
    this.modelEntities.set(model.id, model);

    return model;
  }

  /**
   * Gets a base point entity by ID
   * @param id Entity ID
   * @returns The point entity if found, undefined otherwise
   */
  getBasePoint(id: string): IBasePoint | undefined {
    return this.pointEntities.get(id);
  }

  /**
   * Gets a base polyline entity by ID
   * @param id Entity ID
   * @returns The polyline entity if found, undefined otherwise
   */
  getBasePolyline(id: string): IBasePolyline | undefined {
    return this.polylineEntities.get(id);
  }

  /**
   * Gets a base polygon entity by ID
   * @param id Entity ID
   * @returns The polygon entity if found, undefined otherwise
   */
  getBasePolygon(id: string): IBasePolygon | undefined {
    return this.polygonEntities.get(id);
  }

  /**
   * Gets a base circle entity by ID
   * @param id Entity ID
   * @returns The circle entity if found, undefined otherwise
   */
  getBaseCircle(id: string): IBaseCircle | undefined {
    return this.circleEntities.get(id);
  }

  /**
   * Gets a base label entity by ID
   * @param id Entity ID
   * @returns The label entity if found, undefined otherwise
   */
  getBaseLabel(id: string): IBaseLabel | undefined {
    return this.labelEntities.get(id);
  }

  /**
   * Gets a base marker entity by ID
   * @param id Entity ID
   * @returns The marker entity if found, undefined otherwise
   */
  getBaseMarker(id: string): IBaseMarker | undefined {
    return this.markerEntities.get(id);
  }

  /**
   * Gets a base model entity by ID
   * @param id Entity ID
   * @returns The model entity if found, undefined otherwise
   */
  getBaseModel(id: string): IBaseModel | undefined {
    return this.modelEntities.get(id);
  }

  /**
   * Clears all entities created by this managers and releases resources
   */
  clear(): void {
    // Clear point entities
    for (const point of this.pointEntities.values()) {
      point.destroy();
    }
    this.pointEntities.clear();

    // Clear polyline entities
    for (const polyline of this.polylineEntities.values()) {
      polyline.destroy();
    }
    this.polylineEntities.clear();

    // Clear polygon entities
    for (const polygon of this.polygonEntities.values()) {
      polygon.destroy();
    }
    this.polygonEntities.clear();

    // Clear circle entities
    for (const circle of this.circleEntities.values()) {
      circle.destroy();
    }
    this.circleEntities.clear();

    // Clear label entities
    for (const label of this.labelEntities.values()) {
      label.destroy();
    }
    this.labelEntities.clear();

    // Clear marker entities
    for (const marker of this.markerEntities.values()) {
      marker.destroy();
    }
    this.markerEntities.clear();

    // Clear model entities
    for (const model of this.modelEntities.values()) {
      model.destroy();
    }
    this.modelEntities.clear();
  }

  /**
   * Register height reference line entities to the listener collection for bulk visibility management
   * Retrieves entities by ID from local map, extracts raw provider entities internally, and delegates to EventsManager
   * @param polylineId ID of the base polyline entity
   * @param pointId ID of the base point entity
   */
  registerToHeightReferenceListenerEntities(
    polylineId: string,
    pointId: string
  ): void {
    const eventsManager = this.mapService.eventsManager as CesiumEventsManager;

    if (!eventsManager) {
      return;
    }

    // Retrieve entities from local maps
    const polyline = this.polylineEntities.get(polylineId);
    const point = this.pointEntities.get(pointId);

    if (!polyline || !point) {
      return;
    }

    // Extract raw provider entities using helper method
    const rawPolylineEntity = this.extractRawProviderEntity(polyline);
    const rawPointEntity = this.extractRawProviderEntity(point);

    if (!rawPolylineEntity || !rawPointEntity) {
      return;
    }

    eventsManager.addHeightReferenceLineEntity(rawPolylineEntity);
    eventsManager.addHeightReferencePointEntity(rawPointEntity);
  }

  /**
   * Unregister height reference line entities from the listener collection
   * Retrieves entities by ID from local map, extracts Cesium entities internally, and delegates to EventsManager
   * @param polylineId ID of the base polyline entity
   * @param pointId ID of the base point entity
   */
  unregisterFromHeightReferenceListenerEntities(
    polylineId: string,
    pointId: string
  ): void {
    const eventsManager = this.mapService.eventsManager as CesiumEventsManager;

    if (!eventsManager) {
      return;
    }

    const polyline = this.polylineEntities.get(polylineId);
    const point = this.pointEntities.get(pointId);

    if (!polyline || !point) {
      return;
    }

    const rawPolylineEntity = this.extractRawProviderEntity(polyline);
    const rawPointEntity = this.extractRawProviderEntity(point);

    if (!rawPolylineEntity || !rawPointEntity) {
      return;
    }

    eventsManager.removeHeightReferenceLineEntity(rawPolylineEntity);
    eventsManager.removeHeightReferencePointEntity(rawPointEntity);
  }

  /**
   * Extract raw provider entity from a base entity
   * @param entity Base entity (polyline or point)
   * @returns Raw provider entity (Cesium Entity) or null if not available
   */
  private extractRawProviderEntity(
    entity: IBasePolyline | IBasePoint
  ): Entity | null {
    if (
      'getRawProviderEntity' in entity &&
      typeof entity.getRawProviderEntity === 'function'
    ) {
      return entity.getRawProviderEntity() as Entity | null;
    }
    return null;
  }
}
