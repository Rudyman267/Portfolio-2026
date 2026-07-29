import {
  ArcType,
  CallbackProperty,
  Cartographic,
  ClassificationType,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  Ellipsoid,
  Entity,
  HeadingPitchRange,
  JulianDate,
  PolylineGraphics,
  ShadowMode,
  Viewer,
  Math as CesiumMath,
} from 'cesium';
import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import {
  DEFAULT_BASE_POLYGON_STYLE,
  ENTITY_ZOOM_LEVEL,
  IBasePolygon,
  IEvent,
  IEventsManager,
  IPolygonConfig,
  MapEventEmitter,
  PolygonStyle,
} from '@map/private/contracts';
import {
  CesiumEventData,
  CesiumEventType,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';
import {
  convertToCartesian3Array,
  getHeightReference,
  getPolygonCoordinates,
  handleMovementWithHeightReference,
  PickedEntity,
  positionToCartesian,
} from '@map/private/map-providers/cesium/utils';
import { HeightReferenceEnum } from '@map/public';

export class CesiumBasePolygon implements IBasePolygon {
  protected _id: string;
  protected _positions: IPosition[];
  protected _positionsBeforeDrag: IPosition[];
  protected _style: PolygonStyle;
  protected _visible: boolean;
  protected _editable: boolean;
  protected entity: Entity | null = null;
  protected mapServices: ICesiumMapService;
  protected viewer: Viewer;
  protected eventsManager: IEventsManager | null = null;
  protected readonly _eventEmitter: MapEventEmitter;
  protected lastDragPosition: IPosition | null = null;
  protected _outlineClampToGround: boolean;

  constructor(mapServices: ICesiumMapService, polygonConfig: IPolygonConfig) {
    this._id = `cesium-base-polygon-${v4()}`;
    this._positions = getPolygonCoordinates(polygonConfig.position);
    this._positionsBeforeDrag = structuredClone(this._positions);
    this._style = {
      ...structuredClone(DEFAULT_BASE_POLYGON_STYLE),
      ...(polygonConfig.style ?? {}),
    };

    this._visible = true;
    this._outlineClampToGround =
      this._style.heightReference !== HeightReferenceEnum.NONE;

    this._editable = polygonConfig.isEditable;
    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this._eventEmitter = new MapEventEmitter();
    this.entity = this.createEntity();
    if (this._editable) {
      this.setDraggable(true);
    }
  }

  get id(): string {
    return this._id;
  }

  get visible(): boolean {
    return this._visible;
  }

  get editable(): boolean {
    return this._editable;
  }

  get style(): PolygonStyle {
    return structuredClone(this._style);
  }

  get positions(): IPosition[] {
    return structuredClone(this._positions);
  }

  panTo(): void {
    if (!this.entity) return;
    const entityPos = this._positions[0];
    if (!entityPos) return;
    let entityElevation =
      this.viewer.scene.globe.getHeight(
        Cartographic.fromDegrees(
          entityPos.longitude || 0,
          entityPos.latitude || 0,
          entityPos.altitude || 0
        )
      ) || 0;

    entityElevation =
      !entityElevation || entityElevation < 0
        ? ENTITY_ZOOM_LEVEL.POLYGON
        : entityElevation + ENTITY_ZOOM_LEVEL.POLYGON;

    const currentHeading = this.viewer.camera.heading;
    const currentPitch = this.viewer.camera.pitch;
    this.viewer.flyTo(this.entity, {
      offset: new HeadingPitchRange(
        currentHeading,
        currentPitch,
        entityElevation
      ),
      duration: 3,
    });
  }

  /**
   * Set whether the polygon can be clicked
   */
  public setClickable(clickable: boolean): void {
    if (clickable) {
      this.registerClickEvents();
    } else {
      this.unregisterClickEvents();
    }
  }

  /**
   * Set whether the polygon can be hovered over
   */
  public setHoverable(hoverable: boolean): void {
    if (hoverable) {
      this.registerHoverEvents();
    } else {
      this.unregisterHoverEvents();
    }
  }

  /**
   * Set the editable state of the polygon
   */
  public setEditable(editable: boolean): void {
    this._editable = editable;
    if (!this.entity) return;
    this.updatePolygonGeometry();
    this.entity.show = true;

    if (this.entity.polygon) {
      this.entity.polygon.show = new ConstantProperty(true);
    }

    if (this.entity.polyline) {
      this.entity.polyline.show = new ConstantProperty(true);
    }

    this.setDraggable(editable);
  }

  /**
   * Set whether the polygon can be dragged
   */
  public setDraggable(draggable: boolean): void {
    if (draggable) {
      this.registerDragEvents();
    } else {
      this.unregisterDragEvents();
      // Reset drag state
      this.lastDragPosition = null;
    }
  }

  getEventEmitter(): MapEventEmitter {
    return this._eventEmitter;
  }

  public setPositions(positions: IPosition[]): void {
    if (!positions || positions.length < 3) {
      return;
    }
    const validPositions = positions.filter(
      (pos) => pos && isFinite(pos.longitude) && isFinite(pos.latitude)
    );
    if (validPositions.length < 3) {
      return;
    }

    this._positions = validPositions.map((pos) => ({
      latitude: pos.latitude,
      longitude: pos.longitude,
      altitude: pos.altitude || 0,
    }));

    this._positionsBeforeDrag = structuredClone(this._positions);

    this._visible = true;
    this.updatePolygonGeometry();
  }

  public setStyle(style: PolygonStyle): void {
    this._style = { ...this._style, ...style };

    if (!this.entity || !this.entity.polygon) return;

    if (style.fillColor) {
      this.entity.polygon.material = new ColorMaterialProperty(
        Color.fromCssColorString(style.fillColor).withAlpha(this._style.alpha!)
      );
    }

    if (style.alpha) {
      this.entity.polygon.material = new ColorMaterialProperty(
        Color.fromCssColorString(this._style.fillColor!).withAlpha(
          this._style.alpha!
        )
      );
    }

    if (style.heightReference) {
      this.entity.polygon.heightReference = new ConstantProperty(
        getHeightReference(style.heightReference)
      );

      this.entity.polygon.perPositionHeight = new ConstantProperty(
        style.heightReference === HeightReferenceEnum.NONE
      );

      this._outlineClampToGround =
        style.heightReference !== HeightReferenceEnum.NONE;
      if (this.entity.polyline) {
        this.entity.polyline.clampToGround = new ConstantProperty(
          this._outlineClampToGround
        );
      }
    }

    if (style.outlineColor && this.entity.polyline) {
      this.entity.polyline.material = new ColorMaterialProperty(
        Color.fromCssColorString(style.outlineColor)
      );
    }

    if (style.outlineWidth && this.entity.polyline) {
      this.entity.polyline.width = new ConstantProperty(style.outlineWidth);
    }
  }

  /**
   * Set polygon visibility
   */
  public setVisibility(visible: boolean): void {
    this._visible = visible;
    if (this.entity) {
      this.entity.show = visible;
    }
  }

  /**
   * Clean up all resources
   */
  public destroy(): void {
    this.unregisterClickEvents();
    this.unregisterHoverEvents();
    this.unregisterDragEvents();

    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
    this._positions = [];
    this._positionsBeforeDrag = [];
    if (this._eventEmitter) {
      this._eventEmitter.removeAllListeners();
    }
  }

  // Private event handlers
  /**
   * Register event handlers for click and hover (always available)
   */
  private registerClickEvents(): void {
    if (!this.entity) {
      console.error(
        '[CesiumBasePolygon] Cannot register click events - entity is null'
      );
      return;
    }

    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    try {
      // Register entity for click events
      this.eventsManager?.registerEntityForEvent(
        CesiumEventType.LEFT_DOWN,
        this._id
      );

      // Subscribe to click events
      const emitter = this.eventsManager.getEventEmitter();
      emitter.addListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.onMouseDown
      );
    } catch (error) {
      console.error(
        '[CesiumBasePolygon] Error registering click events:',
        error
      );
    }
  }

  /**
   * Unregister event handlers for click and hover
   */
  private unregisterClickEvents(): void {
    if (!this.entity) return;

    // Unregister click events
    this.eventsManager?.unregisterEntityFromEvent(
      CesiumEventType.LEFT_DOWN,
      this._id
    );

    // Remove click event listeners
    this.eventsManager
      ?.getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.onMouseDown
      );
  }

  /**
   * Register event handlers for hover (always available)
   */
  private registerHoverEvents(): void {
    if (!this.entity) return;

    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    // Register hover events
    this.eventsManager?.registerEntityForEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    // Subscribe to hover events
    const emitter = this.eventsManager.getEventEmitter();
    emitter.addListener(
      `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
      this.onMouseHover
    );
  }

  /**
   * Unregister event handlers for hover (always available)
   */
  private unregisterHoverEvents(): void {
    if (!this.entity) return;

    this.eventsManager?.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    this.eventsManager
      ?.getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
        this.onMouseHover
      );
  }

  private registerDragEvents(): void {
    if (!this.entity) return;
    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    this.eventsManager.registerEntityForEvent(
      CesiumEventType.LEFT_DOWN,
      this._id
    );
    this.eventsManager.registerEntityForEvent(
      CesiumEventType.MOUSE_DRAG,
      this._id
    );
    this.eventsManager.registerEntityForEvent(
      CesiumEventType.LEFT_UP,
      this._id
    );

    this.eventsManager
      .getEventEmitter()
      ?.addListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.handleDragStart
      );
    this.eventsManager
      .getEventEmitter()
      ?.addListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this.handleDragMove
      );
    this.eventsManager
      .getEventEmitter()
      ?.addListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this.handleDragEnd
      );
  }

  private unregisterDragEvents(): void {
    if (!this.entity) return;
    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.LEFT_DOWN,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_DRAG,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.LEFT_UP,
      this._id
    );

    this.eventsManager
      .getEventEmitter()
      ?.removeListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.handleDragStart
      );
    this.eventsManager
      .getEventEmitter()
      ?.removeListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this.handleDragMove
      );
    this.eventsManager
      .getEventEmitter()
      ?.removeListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this.handleDragEnd
      );
  }

  /**
   * Handle hover event for the polygon
   */
  private onMouseHover = (eventData: { position: IPosition }): void => {
    this._eventEmitter.emit({
      type: IEventType.MOUSE_HOVER,
      id: this._id,
      data: {
        position: eventData?.position ?? null,
        positions: this._positions,
      },
    } as IEvent);
  };

  /**
   * Mouse down event handler
   */
  private onMouseDown = (event: Event): void => {
    this._eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: event,
    } as IEvent);
  };

  /**
   * Handle drag start event
   */
  protected handleDragStart = (eventData: CesiumEventData): void => {
    if (!this._editable) return;

    // Store current position as reference
    if (eventData.position) {
      this.lastDragPosition = eventData.position;
    }

    this._positionsBeforeDrag = structuredClone(this._positions);
  };

  /**
   * Handle drag move event
   */
  protected handleDragMove = (eventData: CesiumEventData): void => {
    if (!this._editable || !this.lastDragPosition) return;

    // Make sure we have a valid position in the event data
    if (!eventData.position) return;

    let newPosition = eventData.position;
    const screenPosition = eventData.screenPosition;

    if (screenPosition) {
      // Create a properly formatted PickedEntity object
      const pickedEntity: PickedEntity = {
        id: {
          position: {
            getValue: (date: JulianDate) => {
              const centerPosition = this.calculateCenterPosition();
              return positionToCartesian(centerPosition);
            },
          },
        },
        primitive: {
          heightReference: getHeightReference(this._style.heightReference!),
        },
      };

      const cartesian = handleMovementWithHeightReference(
        this.viewer,
        screenPosition,
        pickedEntity,
        this.viewer.scene.mode
      );

      if (cartesian) {
        // Update internal position state
        const cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
        newPosition = {
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          altitude: cartographic.height,
        };
      }
    }

    const oldPositions = [...this._positions];

    // Calculate position delta
    const deltaLon = newPosition.longitude - this.lastDragPosition.longitude;
    const deltaLat = newPosition.latitude - this.lastDragPosition.latitude;

    // // Apply delta to all positions except altitude
    const updatedPositions = this._positions.map((pos) => {
      return {
        longitude: pos.longitude + deltaLon,
        latitude: pos.latitude + deltaLat,
        altitude: newPosition.altitude,
      };
    });

    // Update positions
    // The CallbackProperty will automatically update the polygon geometry
    this._positions = updatedPositions;

    // Update reference position for next move
    this.lastDragPosition = newPosition;

    // Emit drag event
    this._eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this._id,
      data: {
        position: structuredClone(newPosition),
        positions: structuredClone(updatedPositions),
        previousPositions: structuredClone(oldPositions),
      },
    } as IEvent);
  };

  /**
   * Handle drag end event
   */
  protected handleDragEnd = (eventData: CesiumEventData): void => {
    if (!this._editable) return;

    // Get final position for the event
    const finalPosition = eventData.position;

    const originalAltLookup = this._positionsBeforeDrag.reduce(
      (acc, pos, index) => {
        acc[index] = pos.altitude || 0;
        return acc;
      },
      {} as Record<number, number>
    );

    this._positions = this._positions.map((pos, index) => {
      const originalAltitude = originalAltLookup[index];
      const altitudeDelta = Math.abs(originalAltitude - (pos.altitude || 0));
      return {
        longitude: pos.longitude,
        latitude: pos.latitude,
        altitude: (pos.altitude || 0) + altitudeDelta,
      };
    });

    this._positionsBeforeDrag = structuredClone(this._positions);

    // Emit drag end event
    if (finalPosition) {
      this._eventEmitter.emit({
        type: IEventType.POSITION_CHANGED,
        id: this._id,
        data: {
          position: structuredClone(this.lastDragPosition),
          positions: structuredClone(this._positions),
        },
      } as IEvent);
    }
    this.emitPositionChangedEvent();

    // Clear drag state
    this.lastDragPosition = null;
  };

  /**
   * Create the Cesium entity for this polygon
   */
  private createEntity(): Entity {
    const polygonHierarchy = new CallbackProperty(() => {
      return {
        positions: convertToCartesian3Array(this._positions),
      };
    }, true);

    // Store material as instance property to ensure it persists
    const fillColorMaterial = new ColorMaterialProperty(
      Color.fromCssColorString(this._style.fillColor!).withAlpha(
        this._style.alpha!
      )
    );

    const polygonEntity = new Entity({
      id: this._id,
      polygon: {
        hierarchy: polygonHierarchy,
        material: fillColorMaterial, // Use stored material property
        outline: false,
        heightReference: new ConstantProperty(
          getHeightReference(this._style.heightReference!)
        ),
        perPositionHeight: new ConstantProperty(
          this._style.heightReference === HeightReferenceEnum.NONE
        ),
        arcType: new ConstantProperty(ArcType.GEODESIC),
        shadows: new ConstantProperty(ShadowMode.DISABLED),
        classificationType: new ConstantProperty(ClassificationType.BOTH),
      },
      show: this._visible,
    });

    // Add polyline for the outline as default outline is supported with feature that we want
    polygonEntity.polyline = new PolylineGraphics({
      positions: new CallbackProperty(() => {
        const positions = convertToCartesian3Array(this._positions);
        return [...positions, positions[0]];
      }, true),
      width: new ConstantProperty(this._style.outlineWidth),
      material: new ColorMaterialProperty(
        Color.fromCssColorString(this._style.outlineColor!)
      ),
      clampToGround: new ConstantProperty(this._outlineClampToGround),
    });

    this.viewer.entities.add(polygonEntity);
    return polygonEntity;
  }

  /**
   * Update the polygon's geometry
   */
  private updatePolygonGeometry(): void {
    if (!this.entity || !this.entity.polygon) return;
    if (this._positions.length < 3) {
      return;
    }
    this._visible = true;
    this.entity.show = true;
    this.entity.polygon.hierarchy = new CallbackProperty(() => {
      return {
        positions: convertToCartesian3Array(this._positions),
      };
    }, false);

    if (this.entity.polyline) {
      this.entity.polyline.positions = new CallbackProperty(() => {
        const positions = convertToCartesian3Array(this._positions);
        return [...positions, positions[0]];
      }, false);
    }
  }

  private emitPositionChangedEvent(): void {
    const centerPosition = this.calculateCenterPosition();
    this._eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this._id,
      data: {
        position: structuredClone(centerPosition),
        positions: structuredClone(this._positions),
      },
    });
  }

  /**
   * Calculate the center position of the polygon
   * @returns Position at the center of the polygon
   */
  private calculateCenterPosition(): IPosition {
    if (!this._positions || this._positions.length === 0) {
      throw new Error(
        'Cannot calculate center position: No positions defined for polygon'
      );
    }

    const validPositions = this._positions.filter(
      (pos) => pos && isFinite(pos.latitude) && isFinite(pos.longitude)
    );

    let sumLat = 0;
    let sumLon = 0;
    let sumAlt = 0;

    for (const position of validPositions) {
      sumLat += position.latitude;
      sumLon += position.longitude;
      sumAlt += position.altitude || 0;
    }

    return {
      latitude: sumLat / validPositions.length,
      longitude: sumLon / validPositions.length,
      altitude: sumAlt / validPositions.length,
    };
  }
}
