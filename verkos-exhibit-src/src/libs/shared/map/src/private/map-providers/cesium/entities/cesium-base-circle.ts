import {
  CallbackProperty,
  Cartesian3,
  Color,
  ColorMaterialProperty,
  ConstantPositionProperty,
  ConstantProperty,
  EllipseGraphics,
  EllipseOutlineGeometry,
  Ellipsoid,
  Entity,
  HeadingPitchRange,
  Math as CesiumMath,
  PolylineDashMaterialProperty,
  PolylineGraphics,
  Viewer,
  Cartographic,
  JulianDate,
  ShadowMode,
  ArcType,
} from 'cesium';
import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import {
  CircleStyle,
  DEFAULT_BASE_CIRCLE_STYLE,
  ENTITY_ZOOM_LEVEL,
  IBaseCircle,
  ICircleConfig,
  IEvent,
  IEventsManager,
  MapEventEmitter,
  OutlineType,
} from '@map/private/contracts';
import {
  CesiumEventData,
  CesiumEventType,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';
import {
  cartesianToPosition,
  positionToCartesian,
} from '@map/private/map-providers/cesium/utils';

export class CesiumBaseCircle implements IBaseCircle {
  protected _id: string;
  protected entity: Entity;
  protected _position: IPosition;
  protected _radius: number;
  protected _style: CircleStyle;
  protected _visible: boolean;
  protected _editable: boolean;
  protected _hoverable = false;
  protected _clickable = false;
  protected viewer: Viewer;
  protected readonly earthRadius = Ellipsoid.WGS84.maximumRadius;
  protected eventEmitter: MapEventEmitter;
  protected isOutlineExist = false;
  protected circumferenceOutlinePoints: Cartesian3[] = [];
  protected mapServices: ICesiumMapService;
  protected eventsManager: IEventsManager | null = null;
  protected lastDragPosition: IPosition | null = null;
  protected isDragging = false;
  /**
   * Creates a new CesiumBaseCircle instance
   *
   * @param mapServices Map services instance providing access to the Cesium viewer
   * @param config Circle configuration including position, radius, style, and editability
   */
  constructor(mapServices: ICesiumMapService, config: ICircleConfig) {
    this._id = `cesium-base-circle-${v4()}`;
    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this._position = config.position;
    this._radius = config.radius || 100;
    this._visible = true;
    this._style = {
      ...structuredClone(DEFAULT_BASE_CIRCLE_STYLE),
      ...config.style,
    } as CircleStyle;
    this._editable = config.isEditable || false;
    this._hoverable = config.isHoverable || false;
    this._clickable = config.isClickable || false;
    this.eventEmitter = new MapEventEmitter();
    this.entity = this.createEntity();

    // Initialize drag functionality if editable
    if (this._editable) {
      this.setDraggable(true);
    }
  }

  get id(): string {
    return this._id;
  }

  get radius(): number {
    return this._radius;
  }

  get style(): CircleStyle {
    return { ...this._style };
  }

  get visible(): boolean {
    return this._visible;
  }

  get editable(): boolean {
    return this._editable;
  }

  get hoverable(): boolean {
    return this._hoverable;
  }

  get clickable(): boolean {
    return this._clickable;
  }

  get positions(): IPosition[] {
    return [{ ...this._position }];
  }

  get centerPosition(): IPosition {
    return { ...this._position };
  }

  public setClickable(clickable: boolean): void {
    // Update internal state
    this._clickable = clickable;

    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }
    if (clickable) {
      this.registerClickEvents();
    } else {
      this.unregisterClickEvents();
    }
  }

  public setHoverable(hoverable: boolean): void {
    // Update internal state
    this._hoverable = hoverable;

    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }
    if (hoverable) {
      this.registerHoverEvents();
    } else {
      this.unregisterHoverEvents();
    }
  }

  /**
   * Set the editable state of the circle.
   * Updates property types for dynamic updates and enables/disables dragging.
   */
  public setEditable(editable: boolean): void {
    // Only proceed if the state is actually changing
    if (this._editable === editable || !this.entity) return;

    this._visible = true;
    this._editable = editable;

    // Enable/disable dragging based on editable state
    this.setDraggable(editable);

    // Update the circle outline to ensure it's properly initialized
    this.updateCircleOutline();
  }

  public setPosition(position: IPosition): void {
    this._position = position;

    if (!this.entity) return;

    // Update the entity posit ion directly
    const cartesian = Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.altitude || 0
    );
    this.entity.position = new ConstantPositionProperty(cartesian);

    // Also directly update ellipse properties in case there are callback dependencies
    if (this.entity.ellipse) {
      if (this._editable) {
        this.entity.ellipse.semiMajorAxis = new CallbackProperty(
          () => this._radius,
          false
        );
        this.entity.ellipse.semiMinorAxis = new CallbackProperty(
          () => this._radius,
          false
        );
      } else {
        this.entity.ellipse.semiMajorAxis = new ConstantProperty(this._radius);
        this.entity.ellipse.semiMinorAxis = new ConstantProperty(this._radius);
      }
    }

    // Always update the outline
    this.updateCircleOutline();
  }

  public setRadius(radius: number): void {
    this._radius = radius;
    if (!this.entity || !this.entity.ellipse) return;

    // Handle differently based on edit mode
    if (this._editable) {
      // Use CallbackProperty for dynamic updates in edit mode
      this.entity.ellipse.semiMajorAxis = new CallbackProperty(
        () => this._radius,
        false
      );
      this.entity.ellipse.semiMinorAxis = new CallbackProperty(
        () => this._radius,
        false
      );
    } else {
      // Use ConstantProperty for better performance when not in edit mode
      this.entity.ellipse.semiMajorAxis = new ConstantProperty(radius);
      this.entity.ellipse.semiMinorAxis = new ConstantProperty(radius);
    }

    // Update the outline
    this.updateCircleOutline();
  }

  public setStyle(style: CircleStyle): void {
    this._style = { ...this._style, ...style };
    if (!this.entity || !this.entity.ellipse) return;

    if (style.fillColor) {
      const color = Color.fromCssColorString(style.fillColor).withAlpha(
        this._style.alpha!
      );
      this.entity.ellipse.material = new ColorMaterialProperty(color);
    }

    if (this.isOutlineExist && this.entity.polyline) {
      if (style.outlineColor) {
        const outlineType = this._style?.outlineType;

        if (outlineType === OutlineType.DASHED) {
          this.entity.polyline.material = new PolylineDashMaterialProperty({
            color: Color.fromCssColorString(style.outlineColor),
          });
        } else {
          this.entity.polyline.material = new ColorMaterialProperty(
            Color.fromCssColorString(style.outlineColor)
          );
        }
      }

      if (style.outlineWidth !== undefined) {
        this.entity.polyline.width = new ConstantProperty(style.outlineWidth);
      }
    }
  }

  public setVisibility(visible: boolean): void {
    this._visible = visible;
    if (this.entity) {
      this.entity.show = visible;
    }
  }

  public destroy(): void {
    this.unregisterClickEvents();
    this.unregisterHoverEvents();
    this.unregisterDragEvents();

    // Remove the main entity
    if (this.viewer && this.entity) {
      this.viewer.entities.remove(this.entity);
    }

    // Remove all event listeners
    this.eventEmitter.removeAllListeners();

    // Reset drag state
    this.lastDragPosition = null;
  }

  public getEventEmitter(): MapEventEmitter {
    return this.eventEmitter;
  }

  public panTo(): void {
    const entityPos = this.entity?.position?.getValue(JulianDate.now());
    if (!entityPos) return;

    let entityElevation =
      this.viewer.scene.globe.getHeight(
        Cartographic.fromCartesian(entityPos)
      ) || 0;
    entityElevation =
      !entityElevation || entityElevation < 0
        ? ENTITY_ZOOM_LEVEL.CIRCLE
        : entityElevation + ENTITY_ZOOM_LEVEL.CIRCLE;

    const currentHeading = this.viewer.camera.heading;
    const currentPitch = this.viewer.camera.pitch;
    this.viewer.flyTo(this.entity!, {
      offset: new HeadingPitchRange(
        currentHeading,
        currentPitch,
        entityElevation
      ),
      duration: 3,
    });
  }

  // Private methods
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
      const emitter = this.eventsManager?.getEventEmitter();
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
    emitter?.addListener(
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

  /**
   * Handle drag start event
   */

  private onMouseDown = (event: Event) => {
    this.eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: event,
    } as IEvent);
  };

  private onMouseHover = (event: Event) => {
    this.eventEmitter.emit({
      type: IEventType.MOUSE_HOVER,
      id: this._id,
      data: event,
    } as IEvent);
  };

  /**
   * Set whether the circle can be dragged
   */
  private setDraggable(draggable: boolean): void {
    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    if (draggable) {
      this.registerDragEvents();
    } else {
      this.unregisterDragEvents();
      // Reset drag state
      this.lastDragPosition = null;
    }
  }

  private registerDragEvents(): void {
    if (!this.entity || !this.eventsManager) return;

    // Register entity for drag events
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

    // Set up event listeners
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
    if (!this.entity || !this.eventsManager) return;

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

  private handleDragStart = (eventData: CesiumEventData): void => {
    if (!this._editable) return;

    // Store current position as reference
    if (eventData.position) {
      this.lastDragPosition = eventData.position;
    }

    // Switch to CallbackProperty for smooth dragging
    this.isDragging = true;
    if (this.entity) {
      this.entity.position = new CallbackProperty(() => {
        return Cartesian3.fromDegrees(
          this._position.longitude,
          this._position.latitude,
          this._position.altitude || 0
        );
      }, false) as any;

      if (this.entity.polyline && this.isOutlineExist) {
        this.entity.polyline.positions = new CallbackProperty(
          () => this.circumferenceOutlinePoints,
          false
        );
      }
    }
  };

  /**
   * Handle drag move event
   */
  private handleDragMove = (eventData: CesiumEventData): void => {
    if (!this._editable || !this.lastDragPosition) return;

    // Make sure we have a valid position in the event data
    if (!eventData.position) return;

    const newPosition = eventData.position;
    const newCartesian = positionToCartesian(newPosition);

    // Convert back to position
    this._position = cartesianToPosition(newCartesian);

    // Update outline points directly (CallbackProperty will automatically pick up the change)
    // This is more efficient than recreating the CallbackProperty
    if (this.isDragging && this.entity && this.entity.position) {
      const centerCartesian = this.entity.position.getValue(
        this.viewer.clock.currentTime
      );
      if (centerCartesian) {
        this.circumferenceOutlinePoints =
          this.getCircleOutlineCircumferencePoints(
            centerCartesian,
            this._radius
          );
      }
    } else {
      // Fallback to full update if not dragging
      this.updateCircleOutline();
    }

    // Emit position changed event
    this.emitPositionChangedEvent();

    // Update reference position for next move
    this.lastDragPosition = newPosition;
  };

  /**
   * Handle drag end event
   */
  private handleDragEnd = (eventData: CesiumEventData): void => {
    if (!this._editable) return;

    // Get final position for the event
    const finalPosition = eventData.position;

    // Switch back to ConstantPositionProperty for better performance when not dragging
    this.isDragging = false;
    if (this.entity) {
      const cartesian = Cartesian3.fromDegrees(
        this._position.longitude,
        this._position.latitude,
        this._position.altitude || 0
      );
      this.entity.position = new ConstantPositionProperty(cartesian);

      // Update outline one final time and switch back to appropriate property type
      this.updateCircleOutline();
    }

    // Emit final position changed event
    if (finalPosition) {
      this.emitPositionChangedEvent();
    }

    // Reset drag state
    this.lastDragPosition = null;
  };

  /**
   * Emit position changed event
   */
  private emitPositionChangedEvent(): void {
    this.eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this._id,
      data: {
        position: structuredClone(this._position),
        positions: [structuredClone(this._position)],
      },
    } as IEvent);
  }

  /**
   * Generates points to create a smooth circle outline
   *
   * @param center Center position as Cartesian3
   * @param radius Circle radius in meters
   * @returns Array of Cartesian3 points forming the circle outline
   */
  private getCircleOutlineCircumferencePoints(
    center: Cartesian3,
    radius: number
  ): Cartesian3[] {
    const ellipseOutlineGeometry = new EllipseOutlineGeometry({
      center: center,
      semiMajorAxis: radius,
      semiMinorAxis: radius,
      granularity: CesiumMath.RADIANS_PER_DEGREE / 2,
    });

    const geometry = EllipseOutlineGeometry.createGeometry(
      ellipseOutlineGeometry
    );
    const positions = geometry?.attributes?.position?.values;
    if (!positions) {
      return [];
    }
    const boundaryPoints: Cartesian3[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      boundaryPoints.push(
        new Cartesian3(positions[i], positions[i + 1], positions[i + 2])
      );
    }

    boundaryPoints.push(boundaryPoints[0]);
    return boundaryPoints;
  }

  private createEntity(): Entity {
    // Add null check for position
    if (!this._position) {
      console.error('Position is undefined in CesiumBaseCircle.createEntity');
      // Provide default position to prevent crash
      throw new Error('Position is undefined in CesiumBaseCircle.createEntity');
    }

    const position = Cartesian3.fromDegrees(
      this._position.longitude,
      this._position.latitude,
      this._position.altitude || 0
    );

    const fillColor = Color.fromCssColorString(
      this._style.fillColor!
    ).withAlpha(this._style.alpha!);

    // Create the base entity with ellipse graphics
    const circleEntity = new Entity({
      id: this._id,
      position: new ConstantPositionProperty(position),
      ellipse: new EllipseGraphics({
        semiMajorAxis: new ConstantProperty(this._radius),
        semiMinorAxis: new ConstantProperty(this._radius),
        material: fillColor,
        outline: false,
        zIndex: -1,
        granularity: CesiumMath.RADIANS_PER_DEGREE / 4,
        shadows: new ConstantProperty(ShadowMode.DISABLED),
      }),
    });

    // Add custom outline using polyline
    this.isOutlineExist = true;
    // Generate outline points using Cesium's standard granularity
    this.circumferenceOutlinePoints = this.getCircleOutlineCircumferencePoints(
      position,
      this._radius
    );

    const outlineType = this._style?.outlineType;

    let outlineColors;
    switch (outlineType) {
      case OutlineType.DASHED:
        outlineColors = new PolylineDashMaterialProperty({
          color: Color.fromCssColorString(this._style.outlineColor!),
          dashLength: 16.0,
        });
        break;

      case OutlineType.REGULAR:
      default:
        outlineColors = new ColorMaterialProperty(
          Color.fromCssColorString(this._style.outlineColor!)
        );
        break;
    }

    // Add polyline outline to the entity with dynamic updating
    circleEntity.polyline = new PolylineGraphics({
      positions: this.circumferenceOutlinePoints,
      width: new ConstantProperty(this._style.outlineWidth),
      material: outlineColors,
      clampToGround: new ConstantProperty(true),
      zIndex: 1,
      arcType: new ConstantProperty(ArcType.GEODESIC),
      shadows: new ConstantProperty(ShadowMode.DISABLED),
    });

    this.viewer.entities.add(circleEntity);
    return circleEntity;
  }

  /**
   * Updates the circle's outline when the position or radius changes
   * Creates new outline points based on current circle properties
   */
  private updateCircleOutline(): void {
    if (
      !this.isOutlineExist ||
      !this.entity ||
      !this.entity.position ||
      !this.entity.polyline
    ) {
      return;
    }

    // Get the current center position
    const centerCartesian = this.entity.position.getValue(
      this.viewer.clock.currentTime
    );

    if (centerCartesian) {
      // Generate new outline points based on current center and radius
      this.circumferenceOutlinePoints =
        this.getCircleOutlineCircumferencePoints(centerCartesian, this._radius);

      // Update the polyline positions based on edit mode
      if (this._editable) {
        // If we're in edit mode, the polyline is using a CallbackProperty
        // Force an update for the callback by explicitly updating the entity's polyline
        const currentPositions = this.circumferenceOutlinePoints;
        this.entity.polyline.positions = new CallbackProperty(
          () => currentPositions,
          false
        );
      } else {
        // When not in edit mode, update the ConstantProperty with new points
        this.entity.polyline.positions = new ConstantProperty(
          this.circumferenceOutlinePoints
        );
      }
    }
  }
}
