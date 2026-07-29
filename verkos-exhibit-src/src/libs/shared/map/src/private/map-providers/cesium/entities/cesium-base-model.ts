import {
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Cartographic,
  ColorBlendMode,
  ConstantPositionProperty,
  ConstantProperty,
  Ellipsoid,
  Entity,
  HeadingPitchRoll,
  JulianDate,
  Math as CesiumMath,
  ModelGraphics,
  SampledPositionProperty,
  ShadowMode,
  Transforms,
  Viewer,
  HeadingPitchRange,
  DistanceDisplayCondition,
} from 'cesium';
import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import { ViewType } from '@map/public/core';
import {
  ColorBlendModeEnum,
  DEFAULT_BASE_MODEL_STYLE,
  DragAltitudeMode,
  ENTITY_ZOOM_LEVEL,
  IBaseModel,
  IEvent,
  IEventsManager,
  IModelConfig,
  MapEventEmitter,
  ModelAttitude,
  ModelStyle,
} from '@map/private/contracts';
import {
  cssColorToColor,
  getHeightReference,
  handleMovementWithHeightReference,
  PickedEntity,
  positionToCartesian,
  calculateKeyboardMovement,
} from '@map/private/map-providers/cesium/utils';
import {
  CesiumEventType,
  CesiumKeyboardEventData,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';
import { isKeyboardPressEvent } from '@hardware-controls/keyboard';

/**
 * CesiumBaseModel implements the IBaseModel interface for Cesium
 * Focused solely on 3D model rendering without labels or other entity types
 */
export class CesiumBaseModel implements IBaseModel {
  // Core properties
  protected _id: string;
  protected _position: IPosition;
  protected _style: ModelStyle;
  protected _attitude: ModelAttitude;
  protected _visible = true;
  protected _draggable = false;
  protected _hoverable = false;
  protected _clickable = false;
  protected _tracking = false;
  protected _cameraTracking = false;

  // Keyboard control
  private _keyboardControllable = false;

  // Cesium entities
  protected entity: Entity | null = null;

  // Services and utilities
  protected mapServices: ICesiumMapService;
  protected viewer: Viewer;
  protected eventsManager: IEventsManager;
  protected eventEmitter: MapEventEmitter;

  // Tracking properties
  protected samplePositions: SampledPositionProperty | null = null;

  // Drag state
  private _dragging = false;
  private _heightDragging = false;
  private _originalEntityPosition: Cartesian3 | null = null;
  private _heightChange = 0;
  private _originalDragAltitude: number | null = null;
  private _originalDragAltitudeMode: DragAltitudeMode | null = null;

  /**
   * Creates a new CesiumBaseModel instance
   * @param mapServices Services for accessing the map, viewer, and events
   * @param model Configuration including position, style, attitude, and interaction settings
   */
  constructor(mapServices: ICesiumMapService, model: IModelConfig) {
    this._id = `cesium-base-model-${v4()}`;
    this._position = model.position;
    this._style = {
      ...structuredClone(DEFAULT_BASE_MODEL_STYLE),
      ...model.style,
    } as ModelStyle;
    this._attitude = model.attitude || { yaw: 0, pitch: 0, roll: 0 };

    // Explicitly ensure draggable flag is set based on config
    this._draggable = model.isDraggable === true;

    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this.eventsManager = mapServices.eventsManager;
    this.eventEmitter = new MapEventEmitter();

    // Initialize tracking if enabled
    if (this._tracking) {
      this.samplePositions = new SampledPositionProperty();
      this.samplePositions.forwardExtrapolationType = 1; // HOLD
    }

    // Create the model entity
    this.createEntity();

    // Register event handlers
    this.registerClickEvents();

    // Set up keyboard control if configured
    if (model.isKeyboardControllable === true) {
      this.setKeyboardControllable(true);
    }

    // Set up drag handling if needed
    if (this._draggable) {
      setTimeout(() => {
        this.setDraggable(true);
      }, 0);
    }
  }

  /** Get unique identifier */
  get id(): string {
    return this._id;
  }

  get style(): ModelStyle {
    return { ...this._style };
  }

  get visible(): boolean {
    return this._visible;
  }

  getEventEmitter(): MapEventEmitter {
    return this.eventEmitter.getListenOnlyInstance();
  }

  get position(): IPosition {
    return { ...this._position };
  }

  get draggable(): boolean {
    return this._draggable;
  }

  get clickable(): boolean {
    return this._clickable;
  }

  get attitude(): ModelAttitude {
    return { ...this._attitude };
  }

  get hoverable(): boolean {
    return this._hoverable;
  }

  get keyboardControllable(): boolean {
    return this._keyboardControllable;
  }

  /**
   * Set the position of the model
   * @param position The new position
   */
  setPosition(position: IPosition): void {
    if (
      !position ||
      typeof position.latitude !== 'number' ||
      typeof position.longitude !== 'number'
    ) {
      console.error('Invalid position received:', position);
      return;
    }

    // Store old position for event
    const oldPosition = { ...this._position };

    // Update internal position state
    this._position = { ...position };

    try {
      if (this._tracking && this.samplePositions) {
        // Add the position to tracking history
        const time = JulianDate.now();
        this.samplePositions.addSample(time, positionToCartesian(position));
      } else if (this.entity) {
        // Convert position to Cartesian3
        const cartesian = positionToCartesian(position);

        if (!cartesian) {
          console.error('Failed to convert position to cartesian:', position);
          return;
        }

        // Update the entity position
        this.entity.position = new ConstantPositionProperty(cartesian);

        // If camera tracking is enabled, the Camera will follow automatically
        // since we're using Cesium's trackedEntity property
      }
    } catch (error) {
      console.error('Error in setPosition:', error);
    }

    // Emit position change event
    this.eventEmitter.emit({
      type: IEventType.MOUSE_MOVE,
      id: this._id,
      data: {
        position: this._position,
        previousPosition: oldPosition,
      },
    } as IEvent);
  }

  /**
   * Update the model style
   * @param style Partial style properties to update
   */
  setStyle(style: Partial<ModelStyle>): void {
    // Update internal style object
    this._style = { ...this._style, ...style };

    if (!this.entity || !this.entity.model) {
      console.error('Entity or model not found');
      return;
    }

    // Update individual properties if provided
    if (style.color) {
      this.entity.model.color = new ConstantProperty(
        cssColorToColor(style.color)
      );
    }

    if (style.scale !== undefined) {
      this.entity.model.scale = new ConstantProperty(style.scale);
    }

    if (style.modelUri) {
      this.updateModel(style.modelUri);
    }

    if (style.silhouetteColor) {
      this.setSilhouette(style.silhouetteColor, style.silhouetteSize);
    }

    if (style.minimumPixelSize !== undefined) {
      this.entity.model.minimumPixelSize = new ConstantProperty(
        style.minimumPixelSize
      );
    }

    if (style.maximumScale !== undefined) {
      this.entity.model.maximumScale = new ConstantProperty(style.maximumScale);
    }

    if (style.heightReference) {
      this.entity.model.heightReference = new ConstantProperty(
        getHeightReference(style.heightReference)
      );
    }

    if (style.colorBlendMode) {
      const blendMode: ColorBlendMode = this.getColorBlendMode(
        style.colorBlendMode
      );

      this.entity.model.colorBlendMode = new ConstantProperty(blendMode);

      if (style.colorBlendAmount !== undefined) {
        this.entity.model.colorBlendAmount = new ConstantProperty(
          style.colorBlendAmount
        );
      }
    }
  }

  /**
   * Update the model resource URI
   * @param modelUri URI to the 3D model resource
   */
  updateModel(modelUri: string): void {
    if (!this.entity || !this.entity.model) {
      console.error('Entity or model not found');
      return;
    }

    this._style.modelUri = modelUri;
    this.entity.model.uri = new ConstantProperty(modelUri);
  }

  /**
   * Set the attitude (orientation) of the model
   * @param attitude The new attitude settings
   */
  setAttitude(attitude: Partial<ModelAttitude>): void {
    // Setting model attitude
    // Update internal state
    this._attitude = { ...this._attitude, ...attitude };

    if (!this.entity) return;

    // Update entity orientation
    if (!this.entity?.position) return;
    const position = this.entity.position.getValue(JulianDate.now());
    if (!position) return;

    this.entity.orientation = new CallbackProperty(() => {
      return Transforms.headingPitchRollQuaternion(
        position,
        new HeadingPitchRoll(
          CesiumMath.toRadians(this._attitude.yaw || 0),
          CesiumMath.toRadians(this._attitude.pitch || 0),
          CesiumMath.toRadians(this._attitude.roll || 0)
        )
      );
    }, false);
  }

  /**
   * Set visibility of the model
   * @param visible Whether the model should be visible
   */
  setVisibility(visible: boolean): void {
    this._visible = visible;

    if (this.entity !== null) {
      this.entity.show = visible;
    }
  }

  /**
   * Set whether the model is draggable
   * @param draggable Whether the model can be dragged
   */
  setDraggable(draggable: boolean): void {
    this._draggable = draggable;

    if (draggable) {
      try {
        this.registerDragEvents();
        this.setKeyboardFocus(true);
      } catch (error) {
        console.warn('[CesiumBaseModel] Error registering drag events:', error);
      }
    } else {
      this.unregisterDragEvents();
      this.setKeyboardFocus(false);
    }
  }

  /**
   * Enable/disable keyboard control (KEY_PRESS movement)
   */
  setKeyboardControllable(enabled: boolean): void {
    if (!this.eventsManager) return;

    if (this._keyboardControllable === enabled) {
      return;
    }

    this._keyboardControllable = enabled;

    if (this._keyboardControllable) {
      this.registerKeyboardEvents();
      this.eventsManager.setKeyboardFocus?.(this._id, true);
    } else {
      this.eventsManager.setKeyboardFocus?.(this._id, false);
      this.unregisterKeyboardEvents();
    }
  }

  /**
   * Programmatically toggle keyboard focus for this entity.
   * Only works when keyboardControllable is enabled.
   */
  setKeyboardFocus(focused: boolean): void {
    if (!this.eventsManager || !this.keyboardControllable) return;
    this.eventsManager.setKeyboardFocus?.(this._id, focused);
  }

  /**
   * Set whether the model is hoverable
   * @param hoverable Whether the model can be hovered
   */
  setHoverable(hoverable: boolean): void {
    this._hoverable = hoverable;

    if (hoverable) {
      this.registerHoverEvents();
    } else {
      this.unregisterHoverEvents();
    }
  }

  /**
   * Set whether the model is clickable
   * @param clickable Whether the model can be clicked
   */
  setClickable(clickable: boolean): void {
    this._clickable = clickable;

    if (clickable) {
      this.registerClickEvents();
    } else {
      this.unregisterClickEvents();
    }
  }

  /**
   * Set whether the model should track position history
   * @param tracking When true, enables position tracking
   */
  setTracking(tracking: boolean): void {
    // If tracking state isn't changing, do nothing
    if (this._tracking === tracking) return;

    this._tracking = tracking;

    if (tracking) {
      // Initialize tracking if not already done
      if (!this.samplePositions) {
        this.samplePositions = new SampledPositionProperty();
        this.samplePositions.forwardExtrapolationType = 1; // HOLD
      }

      // Add current position as first sample
      const time = JulianDate.now();
      this.samplePositions.addSample(time, positionToCartesian(this._position));

      // Update entity to use sampled position
      if (this.entity !== null && this.samplePositions !== null) {
        this.entity.position = this.samplePositions;
      }
    } else {
      // Switch back to constant position
      if (this.entity !== null) {
        const cartesian = positionToCartesian(this._position);
        if (cartesian) {
          this.entity.position = new ConstantPositionProperty(cartesian);
        }
      }
    }
  }

  /**
   * Check if the model is currently tracking position history
   * @returns Whether position tracking is enabled
   */
  isTracking(): boolean {
    return this._tracking;
  }

  /**
   * Set whether the camera should track this model
   * When enabled, the camera will automatically follow this model as it moves
   * @param track When true, camera will follow this model
   * @param zoomLevel Optional custom zoom level in meters (distance from camera to entity)
   */
  setCameraTracking(track: boolean, zoomLevel?: number): void {
    // If tracking state isn't changing, do nothing
    if (this._cameraTracking === track) return;

    this._cameraTracking = track;

    if (this.entity && this.viewer) {
      if (track) {
        // Check if the current view is 2D and toggle to 3D if needed
        // Entity tracking requires 3D view mode
        if (this.mapServices.currentView === ViewType.TwoD) {
          // Toggle to 3D view first
          this.mapServices.toggleView(ViewType.ThreeD);

          // Wait for the view transition to complete before setting tracking
          // The toggleView method has a duration of 0.7 seconds for the animation
          setTimeout(() => {
            this.setupEntityTracking(zoomLevel);
          }, 800); // Slightly longer than the animation duration to ensure completion

          return; // Exit early as tracking will be set after the view change
        }

        // If already in 3D view, set up tracking immediately
        this.setupEntityTracking(zoomLevel);
      } else if (this.viewer.trackedEntity === this.entity) {
        // Remove viewFrom when no longer tracking
        this.entity.viewFrom = undefined;

        // Stop tracking this entity (only if we're still tracking it)
        this.viewer.trackedEntity = undefined;

        // Reset camera minimum zoom distance
        this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1;
      }
    }
  }

  /**
   * Helper method to set up entity tracking configuration
   * Extracted to avoid code duplication when handling delayed tracking after view change
   * @param zoomLevel Optional custom zoom level in meters (distance from camera to entity)
   * @private
   */
  private setupEntityTracking(zoomLevel?: number): void {
    if (!this.entity || !this.viewer) return;

    // Set a better viewFrom distance - this offsets the camera position
    // relative to the entity's position and orientation
    // Format is (x, y, z) where:
    // - x: positive is east, negative is west
    // - y: positive is north, negative is south
    // - z: positive is up, negative is down
    // These units are in meters
    const height = zoomLevel !== undefined ? zoomLevel : 2500;
    this.entity.viewFrom = new ConstantProperty(new Cartesian3(0, 0, height));

    this.viewer.trackedEntity = this.entity;

    if (this.viewer.trackedEntity === this.entity) {
      this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100; // in meters
      const scene = this.viewer.scene;
      scene.camera.setView({
        destination: scene.camera.position,
        orientation: {
          heading: scene.camera.heading,
          pitch: -Math.PI / 2,
          roll: 0,
        },
      });
    }
  }

  /**
   * Check if the camera is currently tracking this entity
   * @returns Whether camera tracking is enabled
   */
  isCameraTracking(): boolean {
    return this._cameraTracking && this.viewer?.trackedEntity === this.entity;
  }

  /**
   * Set silhouette for the model
   * @param color Color of the silhouette outline
   * @param size Size of the silhouette outline in pixels
   */
  setSilhouette(color: string, size?: number): void {
    if (!this.entity || !this.entity.model) {
      console.error('Entity or model not found');
      return;
    }

    // Update internal style state
    this._style.silhouetteColor = color;
    this._style.silhouetteSize = size || 1.0;

    const colorObj = cssColorToColor(color);
    if (colorObj) {
      this.entity.model.silhouetteColor = new ConstantProperty(colorObj);
      this.entity.model.silhouetteSize = new ConstantProperty(
        this._style.silhouetteSize
      );
    }
  }

  /**
   * Remove silhouette from the model
   */
  removeSilhouette(): void {
    if (!this.entity || !this.entity.model) return;

    this._style.silhouetteSize = 0;
    this.entity.model.silhouetteSize = new ConstantProperty(0);
  }

  /**
   * Set color blend mode for the model
   * @param mode Blend mode for model coloring
   * @param amount Amount of color blending (0-1)
   */
  setColorBlend(mode: ColorBlendModeEnum, amount?: number): void {
    if (!this.entity || !this.entity.model) return;

    // Update internal style state
    this._style.colorBlendMode = mode;
    this._style.colorBlendAmount = amount || 0.5;

    this.entity.model.colorBlendMode = new ConstantProperty(
      this.getColorBlendMode(mode)
    );

    this.entity.model.colorBlendAmount = new ConstantProperty(
      this._style.colorBlendAmount
    );
  }

  /**
   * Pan the map view to center on this model entity
   * Uses entity-based flyTo for better 3D navigation, with fallback to bounding sphere
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
        ? ENTITY_ZOOM_LEVEL.MODEL
        : entityElevation + ENTITY_ZOOM_LEVEL.MODEL;

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

  /**
   * Clean up resources and destroy the model
   */
  destroy(): void {
    // Unregister ALL events
    this.unregisterClickEvents();
    this.unregisterHoverEvents();
    this.unregisterDragEvents();
    this.unregisterKeyboardEvents();
    this.setKeyboardFocus(false);
    this._keyboardControllable = false;

    // Reset drag state
    this._dragging = false;
    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;
    this._originalDragAltitude = null;
    this._originalDragAltitudeMode = null;

    // Stop camera tracking before removing
    if (this._cameraTracking && this.viewer?.trackedEntity === this.entity) {
      this.viewer.trackedEntity = undefined;
      this._cameraTracking = false;
    }

    // Remove entity from viewer
    if (this.entity !== null) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }

    // Clear resources
    this.samplePositions = null;
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Register keyboard event handlers
   * Entity will receive KEY_PRESS events while focused
   */
  private registerKeyboardEvents(): void {
    if (!this.entity) {
      console.warn(
        '[CesiumBaseModel] Cannot register keyboard events - entity is null'
      );
      return;
    }

    try {
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.KEY_PRESS,
        this._id
      );
      const emitter = this.eventsManager.getEventEmitter();
      emitter.addListener(
        `${CesiumEventType.KEY_PRESS}:${this._id}`,
        this.handleKeyPress
      );
    } catch (error) {
      console.warn(
        '[CesiumBaseModel] Error registering keyboard events:',
        error
      );
    }
  }

  /**
   * Unregister keyboard event handlers
   */
  private unregisterKeyboardEvents(): void {
    if (!this.entity) return;

    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.KEY_PRESS,
      this._id
    );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.KEY_PRESS}:${this._id}`,
        this.handleKeyPress
      );
  }

  /**
   * Handle KEY_PRESS (continuous movement while keys are held)
   */
  private handleKeyPress = (eventData: CesiumKeyboardEventData): void => {
    const keyboardEvent = eventData.keyboardEvent;
    if (!isKeyboardPressEvent(keyboardEvent)) {
      return;
    }

    const pressedKeys = keyboardEvent.pressedKeys;
    const deltaTime = keyboardEvent.deltaTime;

    const movement = calculateKeyboardMovement(pressedKeys, deltaTime);
    if (
      movement.lat === 0 &&
      movement.lng === 0 &&
      movement.alt === 0 &&
      movement.rotation === 0
    ) {
      return;
    }

    // Apply positional movement
    if (movement.lat !== 0 || movement.lng !== 0 || movement.alt !== 0) {
      const oldPosition = { ...this._position };
      const nextPosition: IPosition = {
        latitude: this._position.latitude + movement.lat,
        longitude: this._position.longitude + movement.lng,
        altitude: (this._position.altitude || 0) + movement.alt,
      };

      const cartesian = positionToCartesian(nextPosition);
      if (this.entity) {
        this.entity.position = new ConstantPositionProperty(cartesian);
      }
      this._position = { ...nextPosition };
      this.eventEmitter.emit({
        type: IEventType.POSITION_CHANGED,
        id: this._id,
        data: {
          position: nextPosition,
          previousPosition: oldPosition,
        },
      } as IEvent);
    }

    // Apply rotation to yaw (degrees)
    if (movement.rotation !== 0) {
      const currentYaw = this._attitude.yaw || 0;
      const nextYaw = (((currentYaw + movement.rotation) % 360) + 360) % 360;
      this.setAttitude({ yaw: nextYaw });
    }
  };

  // ================ EVENT REGISTRATION METHODS ================

  /**
   * Register event handlers for click
   */
  private registerClickEvents(): void {
    if (!this.entity) {
      console.error(
        '[CesiumBaseModel] Cannot register click events - entity is null'
      );
      return;
    }

    try {
      // Register entity for click events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_CLICK,
        this._id
      );

      // Subscribe to click events
      const emitter = this.eventsManager.getEventEmitter();
      emitter.addListener(
        `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
        this.handleClick
      );
    } catch (error) {
      console.error('[CesiumBaseModel] Error registering click events:', error);
    }
  }

  /**
   * Unregister event handlers for click
   */
  private unregisterClickEvents(): void {
    if (!this.entity) return;

    // Unregister click events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_CLICK,
      this._id
    );

    // Remove click event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
        this.handleClick
      );
  }

  /**
   * Register event handlers for hover
   */
  private registerHoverEvents(): void {
    if (!this.entity) return;

    // Register hover events
    this.eventsManager.registerEntityForEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    // Subscribe to hover events
    const emitter = this.eventsManager.getEventEmitter();
    emitter.addListener(
      `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
      this.handleHover
    );
  }

  /**
   * Unregister event handlers for hover
   */
  private unregisterHoverEvents(): void {
    if (!this.entity) return;

    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
        this.handleHover
      );
  }

  /**
   * Register event handlers for dragging
   */
  private registerDragEvents(): void {
    if (!this.entity) {
      console.error(
        '[CesiumBaseModel] Cannot register drag events - entity is null'
      );
      return;
    }

    try {
      // First unregister any existing drag handlers to avoid duplicates
      this.unregisterDragEvents();

      // Register entity for DRAG events
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

      // ALT key height manipulation events
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

      // Subscribe to drag events
      const emitter = this.eventsManager.getEventEmitter();

      emitter.addListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.handleMouseDown
      );
      emitter.addListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this.handleMouseMove
      );
      emitter.addListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this.handleMouseUp
      );

      // ALT key event handlers
      emitter.addListener(
        `${CesiumEventType.ALT_PLUS_LEFT_DOWN}:${this._id}`,
        this.handleAltMouseDown
      );
      emitter.addListener(
        `${CesiumEventType.ALT_PLUS_MOUSE_DRAG}:${this._id}`,
        this.handleAltMouseMove
      );
      emitter.addListener(
        `${CesiumEventType.ALT_PLUS_LEFT_UP}:${this._id}`,
        this.handleAltMouseUp
      );
    } catch (error) {
      console.error('[CesiumBaseModel] Error registering drag events:', error);
    }
  }

  /**
   * Unregister event handlers for dragging
   */
  private unregisterDragEvents(): void {
    if (!this.entity) return;

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
    const emitter = this.eventsManager.getEventEmitter();
    emitter.removeListener(
      `${CesiumEventType.LEFT_DOWN}:${this._id}`,
      this.handleMouseDown
    );
    emitter.removeListener(
      `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
      this.handleMouseMove
    );
    emitter.removeListener(
      `${CesiumEventType.LEFT_UP}:${this._id}`,
      this.handleMouseUp
    );

    // Remove ALT key event listeners
    emitter.removeListener(
      `${CesiumEventType.ALT_PLUS_LEFT_DOWN}:${this._id}`,
      this.handleAltMouseDown
    );
    emitter.removeListener(
      `${CesiumEventType.ALT_PLUS_MOUSE_DRAG}:${this._id}`,
      this.handleAltMouseMove
    );
    emitter.removeListener(
      `${CesiumEventType.ALT_PLUS_LEFT_UP}:${this._id}`,
      this.handleAltMouseUp
    );
  }

  // ================ EVENT HANDLERS ================

  /**
   * Handle click event for the model
   */
  private handleClick = (eventData: { position: IPosition }): void => {
    if (!this._clickable) return;

    this.eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: {
        position: this._position,
      },
    } as IEvent);
  };

  /**
   * Handle hover event for the model
   */
  private handleHover = (eventData: { position: IPosition }): void => {
    if (!this._hoverable) return;

    this.eventEmitter.emit({
      type: IEventType.MOUSE_HOVER,
      id: this._id,
      data: {
        position: this._position,
      },
    } as IEvent);
  };

  /**
   * Handle mouse down event for dragging
   */
  private handleMouseDown = (): void => {
    if (!this._draggable) return;

    if (!this.entity) return;

    // Set dragging flag
    this._dragging = true;

    // Store original altitude for preservation
    try {
      this._storeOriginalAltitudeForDrag();
    } catch (error) {
      console.error(
        '[CesiumBaseModel] Error storing original altitude for drag:',
        error
      );
    }
  };

  /**
   * Handle mouse move event for dragging
   */
  private handleMouseMove = (eventData: {
    position?: IPosition;
    screenPosition?: Cartesian2;
    endPosition?: { x: number; y: number };
    cartesian?: Cartesian3;
  }): void => {
    if (!this._draggable || !this._dragging) return;

    // Check for valid position data
    if (
      !eventData ||
      (!eventData.position &&
        !eventData.screenPosition &&
        !eventData.endPosition)
    ) {
      return;
    }

    const oldPosition = { ...this._position };

    try {
      if (this.entity && this.viewer) {
        // Get screen position from event data
        const screenPosition =
          eventData.screenPosition ||
          (eventData.endPosition
            ? new Cartesian2(eventData.endPosition.x, eventData.endPosition.y)
            : undefined);

        if (screenPosition) {
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
              heightReference: getHeightReference(this._style.heightReference),
            },
          };

          const cartesian = handleMovementWithHeightReference(
            this.viewer,
            screenPosition,
            pickedEntity,
            this.viewer.scene.mode
          );

          if (cartesian) {
            // Update the entity position with the calculated cartesian
            this.entity.position = new ConstantPositionProperty(cartesian);

            // Update internal position state
            const cartographic =
              Ellipsoid.WGS84.cartesianToCartographic(cartesian);
            this._position = {
              latitude: CesiumMath.toDegrees(cartographic.latitude),
              longitude: CesiumMath.toDegrees(cartographic.longitude),
              altitude: cartographic.height,
            };

            // Emit position change event
            this.eventEmitter.emit({
              type: IEventType.POSITION_CHANGED,
              id: this._id,
              data: {
                position: this._position,
                previousPosition: oldPosition,
              },
            } as IEvent);
          }
        } else if (eventData.cartesian) {
          // Fallback to the raw cartesian if no screen position
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

          // Emit position change
          this.eventEmitter.emit({
            type: IEventType.POSITION_CHANGED,
            id: this._id,
            data: {
              position: this._position,
              previousPosition: oldPosition,
            },
          } as IEvent);
        } else if (eventData.position) {
          // Last fallback - use provided position data
          const position = eventData.position;

          // Convert to cartesian
          const cartesian = Cartesian3.fromDegrees(
            position.longitude,
            position.latitude,
            position.altitude || 0
          );

          this.entity.position = new ConstantPositionProperty(cartesian);
          this._position = { ...position };

          // Emit position change
          this.eventEmitter.emit({
            type: IEventType.POSITION_CHANGED,
            id: this._id,
            data: {
              position: this._position,
              previousPosition: oldPosition,
            },
          } as IEvent);
        }
      }
    } catch (error) {
      console.error('[CesiumBaseModel] Error updating model position:', error);
    }
  };

  /**
   * Handle mouse up event for dragging
   */
  private handleMouseUp = (eventData: { position: IPosition }): void => {
    if (this._draggable && this._dragging) {
      const position = eventData.position;
      this._position = position;

      // Restore original altitude if preservation is enabled
      this._restoreOriginalAltitudeAfterDrag().catch((error) => {
        console.error(
          '[CesiumBaseModel] Error restoring original altitude after drag:',
          error
        );
      });

      // End the dragging operation
      this._dragging = false;

      // Emit LEFT_UP event for drag completion
      this.eventEmitter.emit({
        type: IEventType.LEFT_UP,
        id: this._id,
        data: {
          position: this._position,
        },
      } as IEvent);
    } else if (this._draggable && this._heightDragging) {
      // Emit LEFT_UP event for Alt drag completion
      this.eventEmitter.emit({
        type: IEventType.LEFT_UP,
        id: this._id,
        data: {
          position: this._position,
        },
      } as IEvent);
    }
  };

  /**
   * Handle ALT+mouse down event for height manipulation
   */
  private handleAltMouseDown = (): void => {
    if (!this._draggable) return;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

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
      !this._draggable ||
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
      const scalingFactor = 0.00099 * distance;
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
      console.error(
        '[CesiumBaseModel] Error during height manipulation:',
        error
      );
    }
  };

  /**
   * Handle ALT+mouse up event for completing height manipulation
   */
  private handleAltMouseUp = (): void => {
    if (!this._draggable || !this._heightDragging) return;

    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;

    if (this.mapServices.currentView !== ViewType.ThreeD) {
      // Reset height manipulation state if we're not in 3D mode
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

  /**
   * Store original altitude when drag starts for preservation
   */
  private _storeOriginalAltitudeForDrag(): void {
    if (!this.entity) return;

    // Get current drag altitude mode
    const dragAltitudeMode = this.mapServices.currentDragAltitudeMode;

    // Get current position
    const currentPosition = this.entity.position?.getValue(JulianDate.now());
    if (!currentPosition) return;

    // Convert to cartographic for altitude extraction
    const cartographic =
      Ellipsoid.WGS84.cartesianToCartographic(currentPosition);

    if (dragAltitudeMode === DragAltitudeMode.AGL) {
      // For AGL mode, store the AGL altitude (current altitude - terrain height)
      const terrainQueryPosition = {
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        altitude: 0,
      };

      const terrainHeight =
        this.mapServices.getTerrainHeight(terrainQueryPosition);
      this._originalDragAltitude = cartographic.height - terrainHeight;
    } else {
      // For HAE mode (default), store the HAE altitude directly
      this._originalDragAltitude = cartographic.height;
    }

    this._originalDragAltitudeMode = dragAltitudeMode;
  }

  /**
   * Restore original altitude after drag ends
   */
  private async _restoreOriginalAltitudeAfterDrag(): Promise<void> {
    if (
      !this.entity ||
      this._originalDragAltitude === null ||
      this._originalDragAltitudeMode === null
    ) {
      return;
    }

    try {
      // Get current position
      const currentPosition = this.entity.position?.getValue(JulianDate.now());
      if (!currentPosition) return;

      // Convert to cartographic
      const cartographic =
        Ellipsoid.WGS84.cartesianToCartographic(currentPosition);

      let targetAltitude: number;

      if (this._originalDragAltitudeMode === DragAltitudeMode.AGL) {
        // For AGL mode, restore AGL altitude
        const terrainQueryPosition = {
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          altitude: 0,
        };

        const terrainHeight =
          this.mapServices.getTerrainHeight(terrainQueryPosition);
        targetAltitude = this._originalDragAltitude + terrainHeight;
      } else {
        // For HAE mode, restore HAE altitude directly
        targetAltitude = this._originalDragAltitude;
      }

      // Update position with restored altitude
      const restoredCartesian = Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        targetAltitude
      );

      this.entity.position = new ConstantPositionProperty(restoredCartesian);

      // Update internal position
      this._position = {
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        altitude: targetAltitude,
      };
    } catch (error) {
      console.error('[CesiumBaseModel] Error restoring altitude:', error);
    }
  }

  // ================ PRIVATE HELPER METHODS ================

  /**
   * Create the model entity in Cesium
   */
  private createEntity(): void {
    try {
      // Convert position to Cartesian3
      const cartesianPosition = positionToCartesian(this._position);
      if (!cartesianPosition) {
        console.error(
          'Failed to convert position to cartesian:',
          this._position
        );
        return;
      }

      // Create orientation property
      const orientationProperty = new CallbackProperty(() => {
        return Transforms.headingPitchRollQuaternion(
          cartesianPosition,
          new HeadingPitchRoll(
            CesiumMath.toRadians(this._attitude.yaw || 0),
            CesiumMath.toRadians(this._attitude.pitch || 0),
            CesiumMath.toRadians(this._attitude.roll || 0)
          )
        );
      }, false);

      // Prepare model graphics
      const modelGraphics = this.createModelGraphics();

      // Create the entity
      this.entity = new Entity({
        id: this._id,
        position:
          this._tracking && this.samplePositions
            ? this.samplePositions
            : new ConstantPositionProperty(cartesianPosition),
        orientation: orientationProperty,
        model: modelGraphics,
        show: this._visible,
      });

      this.viewer.entities.add(this.entity);

      // If camera tracking was enabled before, reset it with the new entity
      if (this._cameraTracking) {
        this.viewer.trackedEntity = this.entity;
      }
    } catch (error) {
      console.error('Error creating model entity:', error);
    }
  }

  /**
   * Create model graphics with current style
   * @returns Configured ModelGraphics instance
   */
  private createModelGraphics(): ModelGraphics {
    const heightRef = getHeightReference(this._style.heightReference);

    // Set up color blend mode
    const colorBlendMode: ColorBlendMode = this.getColorBlendMode(
      this._style.colorBlendMode!
    );

    const modelUri = this._style.modelUri?.trim();

    // Create model graphics with style properties
    return new ModelGraphics({
      uri: new ConstantProperty(modelUri),
      scale: new ConstantProperty(this._style.scale),
      color: this._style.color
        ? new ConstantProperty(cssColorToColor(this._style.color))
        : undefined,
      heightReference: new ConstantProperty(heightRef),
      minimumPixelSize: new ConstantProperty(this._style.minimumPixelSize),
      maximumScale: new ConstantProperty(this._style.maximumScale),
      silhouetteColor: this._style.silhouetteColor
        ? new ConstantProperty(cssColorToColor(this._style.silhouetteColor))
        : undefined,
      silhouetteSize: this._style.silhouetteSize
        ? new ConstantProperty(this._style.silhouetteSize)
        : undefined,
      colorBlendMode: new ConstantProperty(colorBlendMode),
      colorBlendAmount:
        this._style.colorBlendAmount !== undefined
          ? new ConstantProperty(this._style.colorBlendAmount)
          : undefined,
      distanceDisplayCondition: new ConstantProperty(
        new DistanceDisplayCondition(0, 6.0e4)
      ),
      shadows: new ConstantProperty(ShadowMode.DISABLED),
    });
  }

  private getColorBlendMode(mode: ColorBlendModeEnum): ColorBlendMode {
    if (!mode) {
      return ColorBlendMode.HIGHLIGHT;
    }

    switch (mode) {
      case ColorBlendModeEnum.HIGHLIGHT:
        return ColorBlendMode.HIGHLIGHT;
      case ColorBlendModeEnum.REPLACE:
        return ColorBlendMode.REPLACE;
      case ColorBlendModeEnum.MIX:
        return ColorBlendMode.MIX;
      default:
        return ColorBlendMode.HIGHLIGHT;
    }
  }
}
