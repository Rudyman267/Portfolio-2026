import {
  ArcType,
  CallbackProperty,
  ClassificationType,
  ColorMaterialProperty,
  ConstantProperty,
  Ellipsoid,
  Entity,
  HeadingPitchRange,
  HeightReference,
  JulianDate,
  PolylineDashMaterialProperty,
  PolylineGraphics,
  PolylineOutlineMaterialProperty,
  Viewer,
  Math as CesiumMath,
} from 'cesium';
import { v4 } from 'uuid';
import {
  DEFAULT_BASE_POLYLINE_STYLE,
  IBasePolyline,
  IEvent,
  IEventsManager,
  IPolylineConfig,
  MapEventEmitter,
  PolylineStyle,
} from '@map/private/contracts';
import { IEventType, IPosition } from '@map/public/contracts';

import {
  cssColorToColor,
  handleMovementWithHeightReference,
  PickedEntity,
  positionsToCartesianArray,
  positionToCartesian,
} from '@map/private/map-providers/cesium/utils';
import {
  CesiumEventData,
  CesiumEventType,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';

export class CesiumBasePolyline implements IBasePolyline {
  protected _id: string;
  protected _positions: IPosition[] = [];
  protected _positionsBeforeDrag: IPosition[] = [];
  protected _style: PolylineStyle;
  protected _visible: boolean;
  protected _editable: boolean;
  protected _hoverable = false;
  protected _clickable = false;
  protected entity: Entity | null = null;
  protected mapServices: ICesiumMapService;
  protected viewer: Viewer;
  private eventsManager: IEventsManager;
  private _dragging = false;
  private _lastDragPosition: IPosition | null = null;
  private _restoreClampToGroundAfterDrag: boolean | null = null;
  private eventEmitter: MapEventEmitter;
  private _enableDistanceDisplay = true;
  private _dynamicPositionEnabled = false;

  /**
   * Create a new polyline entity on the map
   * @param mapServices Services for accessing the map, viewer, and events
   * @param polyline Configuration including positions, style, and editability
   */
  constructor(mapServices: ICesiumMapService, polyline: IPolylineConfig) {
    this._id = `cesium-base-polyline-${v4()}`;
    this._positions = [...polyline.positions];
    this._positionsBeforeDrag = structuredClone(this._positions);
    this._style = {
      ...structuredClone(DEFAULT_BASE_POLYLINE_STYLE),
      ...polyline.style,
    };
    this._visible =
      polyline.isVisible !== undefined ? polyline.isVisible : true;
    this._editable = polyline.isEditable || false;
    this._hoverable = polyline.isHoverable || false;
    this._clickable = polyline.isClickable || false;
    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this.eventsManager = mapServices.eventsManager;
    this.eventEmitter = new MapEventEmitter();
    // Set initial enableDistanceDisplay from style if provided
    if (this._style.enableDistanceDisplay !== undefined) {
      this._enableDistanceDisplay = this._style.enableDistanceDisplay;
    }

    // Create the main polyline entity
    this.createEntity();

    // If initially editable, register event handlers for dragging
    if (this._editable) {
      this.setDynamicPosition(true);
      this.registerEventHandlers();
    }

    // Setup event handlers based on initial properties
    if (this._hoverable) {
      this.setHoverable(true);
    }

    if (this._clickable) {
      this.setClickable(true);
    }
  }

  /** Get unique identifier */
  get id(): string {
    return this._id;
  }

  /**
   * Get the event emitter instance (read-only)
   * @returns A listen-only instance of the event emitter
   */
  getEventEmitter(): MapEventEmitter {
    return this.eventEmitter.getListenOnlyInstance();
  }

  /** Get a copy of all polyline positions */
  getPositions(): IPosition[] {
    return this._positions.map((pos) => ({ ...pos }));
  }

  /**
   * Set all polyline positions
   * @param positions New positions array
   */
  setPositions(positions: IPosition[]): void {
    if (!this.entity?.polyline) {
      return;
    }

    const oldPositions = [...this._positions];
    this._positions = [...positions];
    this._positionsBeforeDrag = structuredClone(this._positions);

    if (this._editable || this._dynamicPositionEnabled) {
      // Update the polyline entity using CallbackProperty
      this.updateEntity();
    } else {
      this.setDynamicPosition(true);
    }

    // Emit positions change event
    this.emitPositionChangeEvent(oldPositions);
  }

  /**
   * Add a new position to the end of the polyline
   * @param position The position to add
   */
  addPosition(position: IPosition): void {
    if (!this.entity?.polyline) {
      return;
    }
    // Add the position to our array
    this._positions.push({ ...position });

    // Update the entity
    if (this._editable || this._dynamicPositionEnabled) {
      // Update the polyline entity using CallbackProperty
      this.updateEntity();
    } else {
      this.setDynamicPosition(true);
    }
  }

  /** Get the current polyline style */
  get style(): PolylineStyle {
    return { ...this._style };
  }

  /**
   * Set the polyline style
   * @param style Style properties to update
   */
  setStyle(style: Partial<PolylineStyle>): void {
    // Update the style object
    this._style = { ...this._style, ...style };

    // Immediately update the entity
    if (this.entity?.polyline) {
      const polyline = this.entity.polyline;

      // Update width
      if (style.width !== undefined) {
        polyline.width = new ConstantProperty(style.width);
      }

      let material = null;
      if (style.dashPattern !== undefined && style.dashPattern > 0) {
        // Dashed line material
        material = new PolylineDashMaterialProperty({
          color: cssColorToColor(style.color || this._style.color!),
          dashLength: style.dashLength || this._style.dashLength,
        });
      } else if (style.outlineWidth && style.outlineColor) {
        material = new PolylineOutlineMaterialProperty({
          color: cssColorToColor(style.color || this._style.color!),
          outlineColor: cssColorToColor(
            style.outlineColor || this._style.outlineColor!
          ),
          outlineWidth: style.outlineWidth || this._style.outlineWidth!,
        });
      } else if (style.color) {
        // Basic color material
        material = new ColorMaterialProperty(
          cssColorToColor(style.color || this._style.color!)
        );
      }

      if (material) {
        polyline.material = material;
      }

      // Update other properties
      if (style.clampToGround !== undefined) {
        polyline.clampToGround = new ConstantProperty(style.clampToGround);
      }
    }
  }

  /**
   * Set visibility of the polyline
   * @param visible Whether the polyline should be visible
   */
  setVisibility(visible: boolean): void {
    // Setting polyline visibility
    this._visible = visible;
    if (this.entity) {
      // Entity reference for visibility
      this.entity.show = visible;
    }
  }

  /** Get the current visibility state */
  get visible(): boolean {
    return this._visible;
  }

  /**
   * Toggle edit mode and emit event for composite layer to handle
   * @param editable When true, shows edit vertices and activates event handlers
   */
  setEditable(editable: boolean): void {
    if (!this.entity?.polyline) {
      return;
    }

    if (this._editable !== editable) {
      this._editable = editable;
      this.setDynamicPosition(editable);

      // Register or unregister drag event handlers
      if (editable) {
        this.registerEventHandlers();
      } else {
        this.unregisterEventHandlers();
      }
    }
  }

  /** Get the current edit mode state */
  get editable(): boolean {
    return this._editable;
  }

  /** Get the current positions array */
  get positions(): IPosition[] {
    return this._positions.map((pos) => ({ ...pos }));
  }

  /** Get the current hoverable state */
  get hoverable(): boolean {
    return this._hoverable;
  }

  /** Get the current clickable state */
  get clickable(): boolean {
    return this._clickable;
  }

  /**
   * Set whether the polyline can be hovered over
   * @param hoverable Whether the polyline should be hoverable
   */
  setHoverable(hoverable: boolean): void {
    this._hoverable = hoverable;

    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    if (hoverable) {
      // Register for hover events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_HOVER,
        this._id
      );
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
          this.onMouseHover
        );
    } else {
      // Unregister hover events
      this.eventsManager
        .getEventEmitter()
        .removeListener(
          `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
          this.onMouseHover
        );
    }
  }

  /**
   * Mouse hover event handler
   */
  private onMouseHover = (event: any): void => {
    this.eventEmitter.emit({
      type: IEventType.MOUSE_HOVER,
      id: this._id,
      data: event,
    } as IEvent);
  };

  /**
   * Set whether the polyline can be clicked
   * @param clickable Whether the polyline should be clickable
   */
  setClickable(clickable: boolean): void {
    this._clickable = clickable;

    if (!this.eventsManager) {
      this.eventsManager = this.mapServices.eventsManager;
    }

    if (clickable) {
      // Register for click events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_CLICK,
        this._id
      );
      this.eventsManager
        .getEventEmitter()
        .addListener(
          `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
          this.onMouseClick
        );
    } else {
      // Unregister click events
      this.eventsManager
        .getEventEmitter()
        .removeListener(
          `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
          this.onMouseClick
        );
    }
  }

  /**
   * Mouse click event handler
   */
  private onMouseClick = (event: any): void => {
    this.eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: event,
    } as IEvent);
  };

  setDynamicPosition(dynamicPosition: boolean): void {
    if (!this.entity?.polyline) {
      return;
    }

    this._dynamicPositionEnabled = dynamicPosition;

    if (dynamicPosition) {
      this.entity.polyline.positions = new CallbackProperty(() => {
        const positions = this._positions || [];
        return positionsToCartesianArray(positions);
      }, false);
    } else {
      // Use static positions wrapped in ConstantProperty when not editable
      const positions = this._positions || [];
      this.entity.polyline.positions = new ConstantProperty(
        positionsToCartesianArray(positions)
      );
    }
  }
  /**
   * Pan the map view to center on this polyline entity
   */
  panTo(): void {
    if (!this.entity) return;
    const currentHeading = this.viewer.camera.heading;
    const currentPitch = this.viewer.camera.pitch;
    this.viewer.flyTo(this.entity, {
      offset: new HeadingPitchRange(currentHeading, currentPitch),
      duration: 3,
    });
  }

  // Event handler methods for the base polyline entity
  private _onMouseDown = (eventData: any): void => {
    this.handleMouseDown(eventData.position);
  };

  private _onMouseMove = (eventData: any): void => {
    if (this._dragging) {
      this.handleMouseMove(eventData);
    }
  };

  private _onMouseUp = (eventData: any): void => {
    if (this._dragging) {
      this.handleMouseUp(eventData.position);
    }
  };

  /**
   * Register event handlers for the base polyline entity
   */
  private registerEventHandlers(): void {
    if (!this.entity) return;

    // Register entity for events
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

    // Subscribe to entity-specific events
    this.eventsManager
      .getEventEmitter()
      .addListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this._onMouseDown
      );
    this.eventsManager
      .getEventEmitter()
      .addListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this._onMouseMove
      );
    this.eventsManager
      .getEventEmitter()
      .addListener(`${CesiumEventType.LEFT_UP}:${this._id}`, this._onMouseUp);
  }

  /**
   * Unregister event handlers
   */
  private unregisterEventHandlers(): void {
    // Unregister entity from events
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

    // Remove event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this._onMouseDown
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this._onMouseMove
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this._onMouseUp
      );
  }

  /**
   * Handle mouse down for dragging the entire polyline
   */
  private handleMouseDown(position: IPosition): void {
    if (!this._editable) return;

    this._dragging = true;
    this._lastDragPosition = { ...position };
    this._positionsBeforeDrag = structuredClone(this._positions);
    this.disableClampToGroundDuringDrag();

    // Emit drag start event
    this.eventEmitter.emit({
      type: IEventType.LEFT_DOWN,
      id: this._id,
      data: {
        position: position,
        positions: [...this._positions],
      },
    } as IEvent);
  }

  /**
   * Handle mouse move for dragging the entire polyline
   */
  private handleMouseMove(eventData: CesiumEventData): void {
    if (!this._dragging || !this._lastDragPosition) return;

    const oldPositions = [...this._positions];
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
          heightReference: this._style.clampToGround
            ? HeightReference.CLAMP_TO_GROUND
            : HeightReference.NONE,
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

    // Calculate position delta for longitude and latitude only
    const deltaLon = newPosition.longitude - this._lastDragPosition.longitude;
    const deltaLat = newPosition.latitude - this._lastDragPosition.latitude;

    // Apply delta to all positions, but assign direct altitude from newPosition
    const updatedPositions = this._positions.map((pos) => ({
      longitude: pos.longitude + deltaLon,
      latitude: pos.latitude + deltaLat,
      altitude: newPosition.altitude,
    }));

    // Update positions
    this._positions = updatedPositions;
    this.updateEntity();

    // Update last position
    this._lastDragPosition = { ...newPosition };

    // Emit drag move event
    this.eventEmitter.emit({
      type: IEventType.MOUSE_MOVE,
      id: this._id,
      data: {
        position: newPosition,
        positions: this._positions,
        previousPositions: oldPositions,
      },
    } as IEvent);
  }

  /**
   * Handle mouse up for dragging the entire polyline
   */
  private handleMouseUp(position: IPosition): void {
    if (!this._dragging) return;

    // Get original altitudes from before drag started
    const originalAltLookup = this._positionsBeforeDrag.reduce(
      (acc, pos, index) => {
        acc[index] = pos.altitude || 0;
        return acc;
      },
      {} as Record<number, number>
    );

    // Calculate altitude delta and apply to actual altitudes
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

    this._dragging = false;
    this._lastDragPosition = null;
    this.restoreClampToGroundAfterDrag();

    // Emit drag end event
    this.eventEmitter.emit({
      type: IEventType.LEFT_UP,
      id: this._id,
      data: {
        position: position,
        positions: [...this._positions],
      },
    } as IEvent);
  }

  /**
   * Emit a position change event
   * @param previousPositions Previous positions array before the change
   * @param added Whether this event is for a new position being added (true) or positions being updated (false)
   */
  private emitPositionChangeEvent(
    previousPositions?: IPosition[],
    added = false
  ): void {
    this.eventEmitter.emit({
      type: IEventType.MOUSE_MOVE,
      id: this._id,
      data: {
        position:
          this._positions.length > 0
            ? this._positions[this._positions.length - 1]
            : null,
        positions: this._positions,
        previousPositions: previousPositions || [],
        added: added, // Flag to indicate a new position was added
      },
    } as IEvent);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Unregister event handlers
    if (this._editable) {
      this.unregisterEventHandlers();
    }

    // Unregister hover and click handlers
    if (this._hoverable) {
      this.eventsManager
        .getEventEmitter()
        .removeListener(
          `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
          this.onMouseHover
        );
    }

    if (this._clickable) {
      this.eventsManager
        .getEventEmitter()
        .removeListener(
          `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
          this.onMouseClick
        );
    }

    // Remove entity
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }

    // Reset all arrays and references
    this._positions = [];

    // Remove all event listeners
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Create the polyline entity
   */
  private createEntity(): void {
    const polylineGraphics = this.createPolylineGraphics();
    this.entity = this.viewer.entities.add({
      id: this._id,
      polyline: polylineGraphics,
      show: this._visible,
    });
  }

  /**
   * Update the polyline entity
   */
  private updateEntity(): void {
    if (!this.entity) {
      this.createEntity();
      return;
    }

    // With CallbackProperty, we don't need to update positions directly
    // The callback will automatically use the latest this._positions
  }

  /**
   * Get the underlying raw provider entity (for internal use)
   * @returns Raw provider entity or null if not available
   */
  getRawProviderEntity(): Entity | null {
    return this.entity;
  }

  private createPolylineGraphics(): PolylineGraphics {
    // Creating polyline with style

    // Use CallbackProperty for dynamic position updates during dragging
    const positionsProperty = new CallbackProperty(() => {
      if (!this._positions) {
        console.error('Invalid positions array for polyline', this._positions);
        return [];
      }
      return positionsToCartesianArray(this._positions);
    }, true);

    // Determine which material to use based on style properties
    let material;
    if (this._style.dashPattern && this._style.dashPattern > 0) {
      // Dashed line material
      material = new PolylineDashMaterialProperty({
        color: cssColorToColor(this._style.color!),
        dashLength: this._style.dashLength,
      });
    } else if (
      this._style.outlineWidth &&
      this._style.outlineWidth > 0 &&
      this._style.outlineColor
    ) {
      material = new PolylineOutlineMaterialProperty({
        color: cssColorToColor(this._style.color!),
        outlineColor: cssColorToColor(this._style.outlineColor!),
        outlineWidth: this._style.outlineWidth,
      });
    } else {
      // Basic color material
      material = new ColorMaterialProperty(cssColorToColor(this._style.color!));
    }

    const polylineOptions: Partial<PolylineGraphics> = {
      positions: positionsProperty,
      width: new ConstantProperty(this._style.width!),
      clampToGround: new ConstantProperty(this._style.clampToGround!),
      zIndex: new ConstantProperty(this._style.zIndex!),
      classificationType: new ConstantProperty(ClassificationType.BOTH),
      arcType: new ConstantProperty(ArcType.GEODESIC),
      material: material,
    };

    // Conditionally add distance display condition based on style setting
    if (this._enableDistanceDisplay) {
      // Giving issues with terrain - will need to debug more later
      // polylineOptions.distanceDisplayCondition = new ConstantProperty({
      //   near: -1000,
      //   far: 6.0e4,
      // });
    }

    const polylineGraphics = new PolylineGraphics(polylineOptions);
    return polylineGraphics;
  }

  private disableClampToGroundDuringDrag(): void {
    if (!this.entity?.polyline) {
      return;
    }
    if (!this._style.clampToGround) {
      return;
    }
    this._restoreClampToGroundAfterDrag = true;
    this.entity.polyline.clampToGround = new ConstantProperty(false);
  }

  private restoreClampToGroundAfterDrag(): void {
    if (!this.entity?.polyline) {
      return;
    }
    if (!this._restoreClampToGroundAfterDrag) {
      return;
    }
    this._restoreClampToGroundAfterDrag = null;
    this.entity.polyline.clampToGround = new ConstantProperty(true);
  }

  /**
   * Calculate the center position of the polygon
   * @returns Position at the center of the polygon
   */
  private calculateCenterPosition(): IPosition {
    if (!this._positions || this._positions.length === 0) {
      throw new Error(
        'Cannot calculate center position: No positions defined for polyline'
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
