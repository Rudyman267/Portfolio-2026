import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  ConstantPositionProperty,
  ConstantProperty,
  DistanceDisplayCondition,
  Ellipsoid,
  Entity,
  HeightReference,
  JulianDate,
  Math as CesiumMath,
  PointGraphics,
  SceneMode,
  Viewer,
  HeadingPitchRange,
} from 'cesium';
import { v4 } from 'uuid';
import { IEventType, IMapEventData, IPosition } from '@map/public/contracts';
import { ViewType } from '@map/public/core';
import {
  ENTITY_ZOOM_LEVEL,
  DEFAULT_BASE_REAL_POINT_STYLE,
  IBasePoint,
  IEvent,
  IEventsManager,
  IPointConfig,
  MapEventEmitter,
  PointStyle,
} from '@map/private/contracts';
import {
  CesiumEventType,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';
import {
  cssColorToColor,
  getHeightReference,
  handleMovementWithHeightReference,
  PickedEntity,
  positionToCartesian,
} from '@map/private/map-providers/cesium/utils';

export class CesiumBasePoint implements IBasePoint {
  protected _id: string;
  protected _position: IPosition;
  protected _style: PointStyle;
  protected _visible: boolean;
  protected _editable: boolean;
  protected _tracking: boolean;
  protected _hoverable: boolean;
  protected _clickable: boolean;
  protected entity!: Entity;
  protected mapServices: ICesiumMapService;
  protected viewer: Viewer;
  private eventsManager!: IEventsManager;
  private eventEmitter: MapEventEmitter;

  // Dragging and height manipulation state
  private _dragging = false;
  private _heightDragging = false;
  private _originalEntityPosition: Cartesian3 | null = null;
  private _heightChange = 0;
  private _lastDragPosition: IPosition | null = null;

  constructor(mapServices: ICesiumMapService, point: IPointConfig) {
    this._id = `cesium-base-point-${v4()}`;
    this._position = point.position;
    this._style = {
      ...structuredClone(DEFAULT_BASE_REAL_POINT_STYLE),
      ...point.style,
    };
    this._visible = true;
    this._editable = point.isEditable || false;
    this._tracking = point.isTrackable || false;
    this._hoverable = point.isHoverable || false;
    this._clickable = point.isClickable || false;
    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this.eventEmitter = new MapEventEmitter();
    this.createEntity();
  }

  // Core properties
  get id(): string {
    return this._id;
  }

  // Readonly properties that replace getter methods
  get position(): IPosition {
    // Use structuredClone for deep immutability
    return structuredClone(this._position);
  }

  get style(): PointStyle {
    // Use structuredClone for deep immutability
    return structuredClone(this._style);
  }

  get visible(): boolean {
    return this._visible;
  }

  get editable(): boolean {
    return this._editable;
  }

  get tracking(): boolean {
    return this._tracking;
  }

  get hoverable(): boolean {
    return this._hoverable;
  }

  get clickable(): boolean {
    return this._clickable;
  }

  private createEntity(): void {
    this.entity = new Entity({
      id: this._id,
      position: new ConstantPositionProperty(
        positionToCartesian(this._position)
      ),
      point: new PointGraphics({
        color: new ConstantProperty(cssColorToColor(this._style.color!)),
        pixelSize: new ConstantProperty(this._style.pixelSize!),
        outlineColor: new ConstantProperty(
          cssColorToColor(this._style.outlineColor!)
        ),
        outlineWidth: new ConstantProperty(this._style.outlineWidth!),
        heightReference: new ConstantProperty(
          getHeightReference(this._style.heightReference!)
        ),
        distanceDisplayCondition: new ConstantProperty(
          new DistanceDisplayCondition(0, 6.0e4)
        ),
        disableDepthTestDistance: new ConstantProperty(
          Number.POSITIVE_INFINITY
        ),
      }),
      show: this._visible,
    });

    this.viewer.entities.add(this.entity);

    // Register scene mode change listener and adjust for current scene mode
    this.registerSceneChangeListener();
    this.adjustForSceneMode(this.viewer.scene.mode);

    if (this._editable) {
      this.enableEditing();
    }
  }

  /**
   * Register a listener for scene change events
   * @private
   */
  private registerSceneChangeListener(): void {
    if (this.mapServices.eventsManager) {
      this.mapServices.eventsManager.onGlobalEvent(
        IEventType.SCENE_CHANGED,
        (eventData: IMapEventData) => {
          this.onSceneChanged(eventData);
        }
      );
    }
  }

  /**
   * Handle scene change events
   * @param eventData Event data containing the scene mode
   * @private
   */
  private onSceneChanged(eventData: IMapEventData): void {
    if (eventData.sceneMode !== undefined) {
      this.adjustForSceneMode(eventData.sceneMode);
    }
  }

  /**
   * Adjust point properties based on scene mode
   * In 2D mode, CLAMP_TO_TERRAIN doesn't work properly, so we use NONE
   * In 3D mode, we restore CLAMP_TO_TERRAIN
   * @param sceneMode The current scene mode (2D or 3D)
   * @private
   */
  private adjustForSceneMode(sceneMode: SceneMode): void {
    if (this.entity && this.entity.point) {
      const heightRef = this._style?.heightReference;

      if (sceneMode === SceneMode.SCENE2D) {
        // In 2D mode, use NONE so the point uses absolute altitude
        // This ensures visibility since CLAMP_TO_TERRAIN doesn't work in 2D
        this.entity.point.heightReference = new ConstantProperty(
          HeightReference.NONE
        );
      } else {
        // In 3D mode, restore the original height reference
        this.entity.point.heightReference = new ConstantProperty(
          getHeightReference(heightRef)
        );
      }
    }
  }

  /**
   * Get the event emitter instance (read-only)
   * @returns A read-only instance of the event emitter
   */
  getEventEmitter(): MapEventEmitter {
    return this.eventEmitter.getListenOnlyInstance();
  }

  // Position management
  setPosition(position: IPosition): void {
    this._position = { ...position };
    if (this.entity) {
      this.entity.position = new ConstantPositionProperty(
        positionToCartesian(position)
      );
    }
  }

  // Styling methods
  setStyle(style: Partial<PointStyle>): void {
    this._style = { ...this._style, ...style };
    if (this.entity?.point) {
      const point = this.entity.point;
      if (style.color) {
        point.color = new ConstantProperty(cssColorToColor(style.color));
      }
      if (style.pixelSize !== undefined) {
        point.pixelSize = new ConstantProperty(style.pixelSize);
      }
      if (style.outlineColor) {
        point.outlineColor = new ConstantProperty(
          cssColorToColor(style.outlineColor)
        );
      }
      if (style.outlineWidth !== undefined) {
        point.outlineWidth = new ConstantProperty(style.outlineWidth);
      }
      if (style.heightReference) {
        point.heightReference = new ConstantProperty(
          getHeightReference(style.heightReference)
        );
      }
    }
  }

  // Visibility
  setVisibility(visible: boolean): void {
    this._visible = visible;
    if (this.entity) {
      this.entity.show = visible;
    }
  }

  // Interaction control
  setEditable(editable: boolean): void {
    this._editable = editable;
    if (editable) {
      this.enableEditing();
    } else {
      this.disableEditing();
    }
  }

  // Cleanup
  destroy(): void {
    this.disableEditing();
    this.disableHoverEvents();
    this.disableClickEvents();

    // Reset height manipulation state
    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;
    this._dragging = false;
    this._lastDragPosition = null;

    if (this.entity) {
      this.viewer.entities.remove(this.entity);
    }
  }

  /**
   * Pan the map view to center on this point entity
   */
  panTo(): void {
    if (!this.entity) return;
    const entityPos = this.entity?.position?.getValue(JulianDate.now());
    if (!entityPos) return;
    let entityElevation =
      this.viewer.scene.globe.getHeight(
        Cartographic.fromCartesian(entityPos)
      ) || 0;
    entityElevation =
      !entityElevation || entityElevation < 0
        ? ENTITY_ZOOM_LEVEL.POINT
        : entityElevation + ENTITY_ZOOM_LEVEL.POINT;
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
   * Get the underlying raw provider entity (for internal use)
   * @returns Raw provider entity or null if not available
   */
  getRawProviderEntity(): Entity | null {
    return this.entity;
  }

  // Private methods
  private enableEditing(): void {
    // Register for drag events
    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    if (this.eventsManager) {
      // Register entity for regular drag events
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

      // Register entity for ALT key height manipulation events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.ALT_PLUS_LEFT_DOWN,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.ALT_PLUS_MOUSE_DRAG,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.ALT_PLUS_LEFT_UP,
        this._id
      );

      // Subscribe to entity-specific regular drag events
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.LEFT_DOWN}:${this._id}`,
          this.handleDragStart
        );
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
          this.handleDragMove
        );
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.LEFT_UP}:${this._id}`,
          this.handleDragEnd
        );

      // Subscribe to entity-specific ALT key events
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.ALT_PLUS_LEFT_DOWN}:${this._id}`,
          this.handleAltMouseDown
        );
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.ALT_PLUS_MOUSE_DRAG}:${this._id}`,
          this.handleAltMouseMove
        );
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.ALT_PLUS_LEFT_UP}:${this._id}`,
          this.handleAltMouseUp
        );
    }
  }

  private disableEditing(): void {
    if (!this.eventsManager) return;

    // Unregister entity from regular drag events
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

    // Unregister entity from ALT key events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.ALT_PLUS_LEFT_DOWN,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.ALT_PLUS_MOUSE_DRAG,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.ALT_PLUS_LEFT_UP,
      this._id
    );

    // Remove regular drag event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.handleDragStart
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this.handleDragMove
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this.handleDragEnd
      );

    // Remove ALT key event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.ALT_PLUS_LEFT_DOWN}:${this._id}`,
        this.handleAltMouseDown
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.ALT_PLUS_MOUSE_DRAG}:${this._id}`,
        this.handleAltMouseMove
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.ALT_PLUS_LEFT_UP}:${this._id}`,
        this.handleAltMouseUp
      );
  }

  private handleDragStart = (): void => {
    if (!this._editable) return;
    // Set dragging flag
    this._dragging = true;
    this._lastDragPosition = { ...this._position };
    // No need to emit any event on drag start
  };

  private handleDragMove = (eventData: any): void => {
    if (!this._editable || !this._dragging) return;

    // Check for valid position data
    if (
      !eventData ||
      (!eventData.position &&
        !eventData.screenPosition &&
        !eventData.endPosition &&
        !eventData.cartesian)
    ) {
      return;
    }

    // Store original position before changes
    const oldPosition = { ...this._position };

    // Use height reference handling for accurate movement
    if (this.entity && this.viewer) {
      const screenPosition =
        eventData.screenPosition ||
        (eventData.endPosition
          ? new Cartesian2(eventData.endPosition.x, eventData.endPosition.y)
          : undefined);

      if (screenPosition) {
        // Get the height reference value
        const heightRef = getHeightReference(this._style?.heightReference);

        // Create a properly formatted PickedEntity object
        const pickedEntity: PickedEntity = {
          id: {
            position: {
              getValue: (date: JulianDate) => {
                const position = this.entity?.position?.getValue(date);
                return position || new Cartesian3();
              },
            },
          },
          primitive: {
            heightReference: heightRef,
          },
        };

        // Use the movement utility to handle height reference properly
        const cartesian = handleMovementWithHeightReference(
          this.viewer,
          screenPosition,
          pickedEntity,
          this.viewer.scene.mode
        );

        if (cartesian) {
          // Update entity position with the calculated cartesian
          this.entity.position = new ConstantPositionProperty(cartesian);

          // Update internal position state by converting cartesian to geographic
          const cartographic =
            Ellipsoid.WGS84.cartesianToCartographic(cartesian);
          this._position = {
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            longitude: CesiumMath.toDegrees(cartographic.longitude),
            altitude: cartographic.height,
          };
        }
      } else if (eventData.cartesian) {
        // Handle cartesian position directly
        this.entity.position = new ConstantPositionProperty(
          eventData.cartesian
        );

        // Update position from cartesian
        const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
          eventData.cartesian
        );
        this._position = {
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          altitude: cartographic.height,
        };
      } else if (eventData.position) {
        // Handle position directly
        const position = eventData.position;
        this._position = { ...position };

        this.entity.position = new ConstantPositionProperty(
          positionToCartesian(position)
        );
      }
    }

    this._lastDragPosition = { ...this._position };
    // Emit position change event
    const event = {
      type: IEventType.POSITION_CHANGED,
      id: this._id,
      data: {
        position: this._position,
        previousPosition: oldPosition,
      },
    } as IEvent;
    this.eventEmitter.emit(event);
  };

  private handleDragEnd = (eventData: any): void => {
    if (!this._editable || !this._dragging) return;

    // End the dragging operation
    this._dragging = false;

    const position = eventData.position;
    if (!position) {
      console.warn(`[Point ${this._id}] No position data in drag end event`);
      return;
    }

    const oldPosition = { ...this._lastDragPosition };
    this._position = { ...this._lastDragPosition! };
    if (this.entity) {
      this.entity.position = new ConstantPositionProperty(
        positionToCartesian(this._lastDragPosition!)
      );
    }

    this._lastDragPosition = null;

    // Emit position change event
    const event = {
      type: IEventType.POSITION_CHANGED,
      id: this._id,
      data: {
        position: this._position,
        previousPosition: oldPosition,
      },
    } as IEvent;

    this.eventEmitter.emit(event);
  };

  /**
   * Handle ALT+mouse down event for height manipulation
   */
  private handleAltMouseDown = (): void => {
    if (!this._editable) return;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

    // Verify we have a valid entity before starting height manipulation
    if (!this.entity) return;

    // Set height manipulation flags
    this._heightDragging = true;

    // Store original position for reference
    if (this.entity.position) {
      const position = this.entity.position.getValue(
        this.viewer.clock.currentTime
      );
      this._originalEntityPosition = position || null;
      this._heightChange = 0;
    }

    // Emit event to indicate start of height manipulation
    this.eventEmitter.emit({
      type: IEventType.ALT_PLUS_LEFT_DOWN,
      id: this._id,
      data: {
        position: { ...this._position },
      },
    } as IEvent);
  };

  /**
   * Handle ALT+mouse move event for height manipulation
   */
  private handleAltMouseMove = (eventData: {
    movement?: { startPosition?: Cartesian2; endPosition?: Cartesian2 };
  }): void => {
    if (
      !this._editable ||
      !this._heightDragging ||
      !this._originalEntityPosition
    )
      return;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

    // We need the movement event with startPosition and endPosition
    const movement = eventData.movement;
    if (!movement || !movement.endPosition) return;

    try {
      // Calculate camera distance for scaling
      const cameraPosition = this.viewer.camera.position;
      const distance = Cartesian3.distance(
        cameraPosition,
        this._originalEntityPosition
      );

      // Calculate height adjustment based on mouse movement delta
      const deltaY =
        (movement.endPosition?.y || 0) - (movement.startPosition?.y || 0);
      const scalingFactor = 0.00099 * distance; // Using exact factor from reference
      const heightAdjustment = -1 * deltaY * scalingFactor;

      // Accumulate height change
      this._heightChange += heightAdjustment;

      // Apply height change to original position
      const cartographicPos = Cartographic.fromCartesian(
        this._originalEntityPosition
      );
      cartographicPos.height += this._heightChange;

      // Create new position with updated height
      const finalCart = Cartesian3.fromRadians(
        cartographicPos.longitude,
        cartographicPos.latitude,
        cartographicPos.height
      );

      // Update entity position
      if (finalCart && this.entity) {
        this.entity.position = new ConstantPositionProperty(finalCart);

        // Update internal position state
        this._position = {
          latitude: CesiumMath.toDegrees(cartographicPos.latitude),
          longitude: CesiumMath.toDegrees(cartographicPos.longitude),
          altitude: cartographicPos.height,
        };

        // Emit position change event with height change info
        this.eventEmitter.emit({
          type: IEventType.POSITION_CHANGED,
          id: this._id,
          data: {
            position: this._position,
            heightChange: this._heightChange,
          },
        } as IEvent);
      }
    } catch (error) {
      console.error('Error during height manipulation:', error);
    }
  };

  /**
   * Handle ALT+mouse up event for completing height manipulation
   */
  private handleAltMouseUp = (): void => {
    if (!this._editable || !this._heightDragging) return;

    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

    // Emit final position after height manipulation
    this.eventEmitter.emit({
      type: IEventType.ALT_PLUS_LEFT_UP,
      id: this._id,
      data: {
        position: { ...this._position },
        heightChange: this._heightChange,
      },
    } as IEvent);
  };

  // Tracking
  setTracking(tracking: boolean): void {
    this._tracking = tracking;
    // Tracking functionality can be implemented here
  }

  // Hover interaction
  setHoverable(hoverable: boolean): void {
    this._hoverable = hoverable;
    if (hoverable) {
      this.enableHoverEvents();
    } else {
      this.disableHoverEvents();
    }
  }

  private enableHoverEvents(): void {
    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    if (this.eventsManager) {
      // Register hover events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_HOVER,
        this._id
      );

      // Subscribe to hover events
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
          this.handleMouseHover
        );
    }
  }

  private disableHoverEvents(): void {
    if (!this.eventsManager) return;

    // Unregister hover events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    // Remove event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
        this.handleMouseHover
      );
  }

  private handleMouseHover = (eventData: any): void => {
    if (!this._hoverable) return;

    // Emit hover event
    this.eventEmitter.emit({
      type: IEventType.MOUSE_HOVER,
      id: this._id,
      data: {
        position: this._position,
        hoverPosition: eventData.position,
        isHovering: true, // Can be used to determine if hovering or leaving
      },
    } as IEvent);
  };

  // Click interaction
  setClickable(clickable: boolean): void {
    this._clickable = clickable;
    if (clickable) {
      this.enableClickEvents();
    } else {
      this.disableClickEvents();
    }
  }

  private enableClickEvents(): void {
    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    if (this.eventsManager) {
      // Register click events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_CLICK,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.LEFT_DOWN,
        this._id
      );

      // Subscribe to click events
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
          this.handleClick
        );
    }
  }

  private disableClickEvents(): void {
    if (!this.eventsManager) return;

    // Unregister click events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_CLICK,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.LEFT_DOWN,
      this._id
    );

    // Remove event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
        this.handleClick
      );
  }

  private handleClick = (eventData: any): void => {
    if (!this._clickable) return;

    // Emit click event
    this.eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: {
        position: this._position,
        clickPosition: eventData.position,
      },
    } as IEvent);
  };
}
