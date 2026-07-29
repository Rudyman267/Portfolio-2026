import {
  Cartesian3,
  Entity,
  EntityCollection,
  KeyboardEventModifier,
  Math as CesiumMath,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
} from 'cesium';
import EventEmitter from 'eventemitter3';
import {
  ICameraOrientationEventData,
  IEventType,
  IMapEventData,
  IPosition,
} from '@map/public/contracts';
import { IEventsManager, MapEventEmitter } from '@map/private/contracts';
import { cartesianToPosition } from '../utils';
import {
  CesiumEventData,
  CesiumEntityEventData,
  type CesiumKeyboardEventData,
  CesiumEventType,
} from '@map/private/map-providers/cesium/types';
import {
  KeyboardEventPriority,
  KeyboardEventType,
  KeyboardManager,
  isKeyboardPressEvent,
  type IKeyboardEvent,
} from '@hardware-controls/keyboard';
import { KeyboardFocusManager } from './keyboard-focus-manager';
import { isMapKey } from '../constants/keyboard-keys.constants';

/**
 * Enhanced event manager for Cesium map implementation
 * Based on the reference implementation's MapEventsManager
 */
export class CesiumEventsManager implements IEventsManager {
  private handler: ScreenSpaceEventHandler;
  private eventEmitter = new EventEmitter();
  private mouseDragEntities = new Set<string>();
  private mouseHeightDragEntities = new Set<string>();
  private viewer: Viewer;
  private globalEventEmitter = new MapEventEmitter();
  private pickedTimeout: ReturnType<typeof setTimeout> | null = null;
  private eventEntityMap: Map<CesiumEventType, Set<string>> = new Map();
  private entityHeightChangeMap = new Map<string, number>();
  private entityOriginalPositionMap = new Map<string, Cartesian3>();
  private cameraChangeHandler: (() => void) | null = null;
  private lastCameraUpdateTime = 0;
  private static readonly CAMERA_UPDATE_THROTTLE = 100; // ms

  // Keyboard integration
  private readonly keyboardManager: KeyboardManager | null;
  private readonly keyboardControlsAvailable: boolean;
  private keyboardFocusManager: KeyboardFocusManager | null = null;
  private keyboardUnsubscribers: Array<() => void> = [];

  // Separate EntityCollections for height reference line Cesium entities
  private readonly heightReferenceLineCesiumEntityCollection: EntityCollection;
  private readonly heightReferencePointCesiumEntityCollection: EntityCollection;

  constructor(
    viewer: Viewer,
    keyboardManager: KeyboardManager | null = null,
    keyboardControlsAvailable = false
  ) {
    this.viewer = viewer;
    this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.keyboardManager = keyboardManager;
    this.keyboardControlsAvailable = keyboardControlsAvailable;

    // Create separate EntityCollections for height reference lines and points (standalone, not automatically added to viewer.entities)
    this.heightReferenceLineCesiumEntityCollection = new EntityCollection();
    this.heightReferencePointCesiumEntityCollection = new EntityCollection();

    this.initializeEventHandlers();
    this.initializeCameraOrientationTracking();
    this.initializeHeightReferenceLineVisibility();
  }

  /**
   * Provider-specific keyboard focus setter.
   * Exposed via IEventsManager optional method for programmatic focus.
   */
  setKeyboardFocus(entityId: string, focused: boolean): void {
    if (!this.keyboardControlsAvailable || !this.keyboardFocusManager) {
      return;
    }

    if (focused === false) {
      // Only clear focus if the currently focused entity matches this id.
      // Otherwise no-op to avoid clearing focus owned by another entity.
      const currentFocusedId = this.keyboardFocusManager.getFocusedEntityId();
      if (currentFocusedId === entityId) {
        this.keyboardFocusManager.clearFocus();
      }
      return;
    }

    if (!this.isEntityKeyboardControllable(entityId)) {
      // Do not allow focusing entities that have no keyboard handlers registered
      return;
    }

    this.keyboardFocusManager.setFocus(entityId);
  }

  /**
   * Provider-specific keyboard focus getter.
   */
  getKeyboardFocusedEntityId(): string | null {
    if (!this.keyboardControlsAvailable || !this.keyboardFocusManager) {
      return null;
    }
    return this.keyboardFocusManager.getFocusedEntityId();
  }

  /**
   * Get the event emitter instance for entity-specific events
   * @returns The event emitter instance
   */
  getEventEmitter() {
    return this.eventEmitter;
  }

  /**
   * Register an entity for a specific event type
   * @param event The event type to register for
   * @param entityId The entity ID to register for events
   */
  registerEntityForEvent(event: CesiumEventType, entityId: string): void {
    if (!this.eventEntityMap.has(event)) {
      this.eventEntityMap.set(event, new Set());
    }
    this.eventEntityMap.get(event)?.add(entityId);
  }

  /**
   * Unregister an entity from a specific event type
   * @param event The event type to unregister from
   * @param entityId The entity ID to unregister
   */
  unregisterEntityFromEvent(event: CesiumEventType, entityId: string): void {
    this.eventEntityMap.get(event)?.delete(entityId);
    // Clean up empty sets
    if (this.eventEntityMap.get(event)?.size === 0) {
      this.eventEntityMap.delete(event);
    }

    // If a focused entity no longer has any keyboard handlers, clear focus
    if (this.keyboardControlsAvailable && this.keyboardFocusManager) {
      const focusedEntityId = this.keyboardFocusManager.getFocusedEntityId();
      if (
        focusedEntityId === entityId &&
        !this.isEntityKeyboardControllable(entityId)
      ) {
        this.keyboardFocusManager.clearFocus();
      }
    }
  }

  /**
   * Register a callback for global map events
   * @param event The event type to register for
   * @param callback The callback function to execute when the event occurs
   */
  onGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void {
    if (!this.globalEventEmitter) {
      console.error('Global event emitter not initialized');
      return;
    }
    this.globalEventEmitter.addGlobalEventListener(event, callback);
  }

  onSceneChange(sceneMode: unknown): void {
    this.globalEventEmitter.emitGlobalEvent({
      type: IEventType.SCENE_CHANGED,
      sceneMode: sceneMode as SceneMode,
    });
  }

  /**
   * Unregister a callback for global map events
   * @param event The event type to unregister from
   * @param callback The callback function to remove
   */
  offGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void {
    this.globalEventEmitter.removeGlobalEventListener(event, callback);
  }

  onRenderError(listener: (error: Error) => void): void {
    this.globalEventEmitter.addRenderErrorListener(listener);
  }

  offRenderError(listener: (error: Error) => void): void {
    this.globalEventEmitter.removeRenderErrorListener(listener);
  }

  /**
   * Emit an entity-specific event
   * @param event The event type to emit
   * @param entityId The entity ID to emit for
   * @param data The event data to emit
   */
  private emitEntityEvent(
    event: CesiumEventType,
    entityId: string,
    data: CesiumEntityEventData
  ): void {
    // Only emit if entity is registered for this event
    if (this.eventEntityMap.get(event)?.has(entityId)) {
      this.eventEmitter.emit(`${event}:${entityId}`, data);
    }
  }

  /**
   * Check if an entity has ANY keyboard handlers registered.
   * Used for focus acquisition/cleanup.
   */
  private isEntityKeyboardControllable(entityId: string): boolean {
    const keyboardEvents = [
      CesiumEventType.KEY_DOWN,
      CesiumEventType.KEY_UP,
      CesiumEventType.KEY_PRESS,
    ];

    return keyboardEvents.some(
      (event) => this.eventEntityMap.get(event)?.has(entityId) ?? false
    );
  }

  /**
   * Initialize shared keyboard listeners (via KeyboardManager.eventBus).
   *
   * Important behavior:
   * - We only forward events when an entity is focused AND registered for that keyboard event type.
   * - We forward the SAME keyboard event object so entity handlers can call markHandled().
   * - We DO NOT markHandled ourselves; entities decide.
   */
  private initializeKeyboardEventHandlers(): void {
    if (
      !this.keyboardControlsAvailable ||
      !this.keyboardManager ||
      !this.keyboardFocusManager
    ) {
      console.warn(
        '[CesiumEventsManager] Keyboard controls not available, skipping keyboard initialization'
      );
      return;
    }

    // Clean up if re-initialized (defensive)
    this.keyboardUnsubscribers.forEach((u) => u());
    this.keyboardUnsubscribers = [];

    const onKeyDown = (e: IKeyboardEvent) => {
      const focusedEntityId = this.keyboardFocusManager!.getFocusedEntityId();

      // Forward to focused entity ONLY if:
      // 1. Entity is focused
      // 2. Key is a map key (WASD/ZC/QE)
      // 3. Entity is registered for KEY_DOWN
      if (!focusedEntityId) return;
      if (!isMapKey(e.key)) return; // Filter out non-map keys
      if (
        !this.eventEntityMap.get(CesiumEventType.KEY_DOWN)?.has(focusedEntityId)
      )
        return;

      const entity = this.viewer.entities.getById(focusedEntityId);
      if (!entity) return;

      const payload: CesiumKeyboardEventData = {
        entityId: focusedEntityId,
        keyboardEvent: e,
        entity,
      };

      this.emitEntityEvent(CesiumEventType.KEY_DOWN, focusedEntityId, payload);
    };

    const onKeyUp = (e: IKeyboardEvent) => {
      const focusedEntityId = this.keyboardFocusManager!.getFocusedEntityId();
      if (!focusedEntityId) return;
      if (!isMapKey(e.key)) return; // Filter out non-map keys
      if (
        !this.eventEntityMap.get(CesiumEventType.KEY_UP)?.has(focusedEntityId)
      )
        return;

      const entity = this.viewer.entities.getById(focusedEntityId);
      if (!entity) return;

      const payload: CesiumKeyboardEventData = {
        entityId: focusedEntityId,
        keyboardEvent: e,
        entity,
      };

      this.emitEntityEvent(CesiumEventType.KEY_UP, focusedEntityId, payload);
    };

    const onKeyPress = (e: IKeyboardEvent) => {
      if (!isKeyboardPressEvent(e)) return;

      // Only forward if at least one key is a map key
      const hasMapKey = e.pressedKeys.some(isMapKey);
      if (!hasMapKey) return;

      const focusedEntityId = this.keyboardFocusManager!.getFocusedEntityId();
      if (!focusedEntityId) return;
      if (
        !this.eventEntityMap
          .get(CesiumEventType.KEY_PRESS)
          ?.has(focusedEntityId)
      )
        return;

      const entity = this.viewer.entities.getById(focusedEntityId);
      if (!entity) return;

      const payload: CesiumKeyboardEventData = {
        entityId: focusedEntityId,
        keyboardEvent: e,
        entity,
      };

      this.emitEntityEvent(CesiumEventType.KEY_PRESS, focusedEntityId, payload);
    };

    this.keyboardUnsubscribers.push(
      this.keyboardManager.eventBus.register(
        KeyboardEventType.KEY_DOWN,
        onKeyDown,
        KeyboardEventPriority.HIGH,
        'CesiumEventsManager'
      )
    );
    this.keyboardUnsubscribers.push(
      this.keyboardManager.eventBus.register(
        KeyboardEventType.KEY_UP,
        onKeyUp,
        KeyboardEventPriority.HIGH,
        'CesiumEventsManager'
      )
    );
    this.keyboardUnsubscribers.push(
      this.keyboardManager.eventBus.register(
        KeyboardEventType.KEY_PRESS,
        onKeyPress,
        KeyboardEventPriority.HIGH,
        'CesiumEventsManager'
      )
    );
  }

  /**
   * Check if an entity is registered for drag events
   * @param entityId The entity ID to check
   * @returns true if the entity is registered for drag events, false otherwise
   */
  private isEntityDraggable(entityId: string): boolean {
    const dragEvents = [
      CesiumEventType.LEFT_DOWN,
      CesiumEventType.MOUSE_DRAG,
      CesiumEventType.LEFT_UP,
    ];

    // Check if entity is registered for all drag-related events
    return dragEvents.every(
      (event) => this.eventEntityMap.get(event)?.has(entityId) ?? false
    );
  }

  /**
   * Check if an entity is registered for height drag events
   * @param entityId The entity ID to check
   * @returns true if the entity is registered for height drag events, false otherwise
   */
  private isEntityHeightDraggable(entityId: string): boolean {
    const heightDragEvents = [
      CesiumEventType.ALT_PLUS_LEFT_DOWN,
      CesiumEventType.ALT_PLUS_MOUSE_DRAG,
      CesiumEventType.ALT_PLUS_LEFT_UP,
    ];

    // Check if entity is registered for all height drag-related events
    return heightDragEvents.every(
      (event) => this.eventEntityMap.get(event)?.has(entityId) ?? false
    );
  }

  /**
   * Initialize all event handlers for the Cesium viewer
   */
  private initializeEventHandlers(): void {
    this.initializeStandardEventHandlers();

    // Initialize keyboard events ONLY if keyboard controls are available AND manager is provided
    if (this.keyboardControlsAvailable && this.keyboardManager) {
      this.keyboardFocusManager = new KeyboardFocusManager();
      this.initializeKeyboardEventHandlers();
    } else if (!this.keyboardManager) {
      console.warn(
        '[CesiumEventsManager] Keyboard controls disabled (no KeyboardManager provided)'
      );
    }
  }

  /**
   * Initialize camera orientation tracking for real-time compass updates
   */
  private initializeCameraOrientationTracking(): void {
    if (!this.viewer?.camera) {
      console.warn(
        'Cannot initialize camera orientation tracking: camera not available'
      );
      return;
    }
    // Set camera percentageChanged to a reasonable value to ensure updates
    this.viewer.camera.percentageChanged = 0.1;

    this.cameraChangeHandler = () => {
      // Throttle updates to prevent excessive event emissions
      const now = Date.now();
      if (
        now - this.lastCameraUpdateTime <
        CesiumEventsManager.CAMERA_UPDATE_THROTTLE
      ) {
        return;
      }
      this.lastCameraUpdateTime = now;

      const camera = this.viewer.camera;
      const heading = camera.heading;
      const pitch = camera.pitch;
      const roll = camera.roll;

      // Get camera altitude
      const cartographic = camera.positionCartographic;
      const altitude = cartographic ? cartographic.height : 0;

      // Convert to degrees and normalize heading to 0-360
      const headingDegrees = CesiumMath.toDegrees(heading);
      const pitchDegrees = CesiumMath.toDegrees(pitch);
      const normalizedHeading = ((headingDegrees % 360) + 360) % 360;

      // Emit camera orientation change event
      const eventData: ICameraOrientationEventData = {
        type: IEventType.CAMERA_ORIENTATION_CHANGED,
        heading,
        pitch,
        roll,
        headingDegrees: normalizedHeading,
        pitchDegrees,
        altitude,
      };

      this.globalEventEmitter.emitGlobalEvent(eventData);
    };

    // Attach to camera.changed event
    this.viewer.camera.changed.addEventListener(this.cameraChangeHandler);
  }

  private initializeStandardEventHandlers(): void {
    // LEFT_DOWN handler - start drag
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.PositionedEvent) => {
        let entityId: string | undefined;
        let entityObject = undefined;

        // Try to get entity, but don't return if not found
        const entity = this.viewer.scene.pick(event.position);
        if (entity && entity.id) {
          entityId = entity.id._id;
          entityObject = entity.id;
        }

        // Get cartesian coordinates - only return early if these aren't available
        const cartesian = this.viewer.scene.pickPosition(event.position);
        if (!cartesian) return;

        // Keyboard focus: same behavior as LEFT_CLICK (but on press down)
        if (this.keyboardControlsAvailable && this.keyboardFocusManager) {
          if (entityId) {
            if (this.isEntityKeyboardControllable(entityId)) {
              this.keyboardFocusManager.setFocus(entityId);
            } else {
              // Clicking a non-keyboard entity should clear focus
              this.keyboardFocusManager.clearFocus();
            }
          }
        }

        // Only disable camera controls if the entity is actually registered for drag events
        if (entityId && this.isEntityDraggable(entityId)) {
          // Disable all camera controls to prevent map movement during entity drag
          this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
          this.viewer.scene.screenSpaceCameraController.enableZoom = false;
          this.viewer.scene.screenSpaceCameraController.enableTilt = false;
          this.viewer.scene.screenSpaceCameraController.enableLook = false;

          this.mouseDragEntities.add(entityId);
        }

        // Convert cartesian coordinates to geographic coordinates
        const position = cartesianToPosition(cartesian);

        // Emit entity-specific event only if we have an entity
        if (entityId && entityObject) {
          const eventData: CesiumEventData = {
            entityId,
            position: position,
            entity: entityObject,
          };
          this.emitEntityEvent(CesiumEventType.LEFT_DOWN, entityId, eventData);
        }

        // Emit global event regardless of entity presence
        this.globalEventEmitter.emitGlobalEvent({
          type: IEventType.LEFT_DOWN,
          position: position,
          entityId: entityId, // This will be undefined if no entity was found
        });
      },
      ScreenSpaceEventType.LEFT_DOWN
    );

    // ALT + LEFT_DOWN handler - start height manipulation
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.PositionedEvent) => {
        let entityId: string | undefined;
        let entityObject = undefined;

        // Try to get entity, but don't return if not found
        const entity = this.viewer.scene.pick(event.position);
        if (entity && entity.id) {
          entityId = entity.id._id;
          entityObject = entity.id;
        }

        // Get cartesian coordinates - only return early if these aren't available
        const cartesian = this.viewer.scene.pickPosition(event.position);
        if (!cartesian) return;

        // Only disable camera controls if the entity is actually registered for height drag events
        if (entityId && this.isEntityHeightDraggable(entityId)) {
          // Disable all camera controls to prevent map movement during entity drag
          this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
          this.viewer.scene.screenSpaceCameraController.enableZoom = false;
          this.viewer.scene.screenSpaceCameraController.enableTilt = false;
          this.viewer.scene.screenSpaceCameraController.enableLook = false;

          this.mouseHeightDragEntities.add(entityId);
        }

        // Convert cartesian coordinates to geographic coordinates
        const position = cartesianToPosition(cartesian);

        // Emit entity-specific event only if we have an entity
        if (entityId && entityObject) {
          const eventData: CesiumEventData = {
            entityId,
            position: position,
            entity: entityObject,
          };
          this.emitEntityEvent(
            CesiumEventType.ALT_PLUS_LEFT_DOWN,
            entityId,
            eventData
          );
        }

        // Emit global event regardless of entity presence
        this.globalEventEmitter.emitGlobalEvent({
          type: IEventType.ALT_PLUS_LEFT_DOWN,
          position: position,
          entityId: entityId, // This will be undefined if no entity was found
        });
      },
      ScreenSpaceEventType.LEFT_DOWN,
      KeyboardEventModifier.ALT
    );

    // MOUSE_MOVE handler - update drag or hover
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.MotionEvent) => {
        // Always track mouse position regardless of drag state
        // Try various position retrieval methods for better reliability
        let cartesian = this.viewer.scene.pickPosition(event.endPosition);

        // If we're dragging entities, we need to ensure we have valid cartesian
        if (this.mouseDragEntities.size > 0 && !cartesian) {
          console.warn('pickPosition returned null, trying alternate methods');

          // Try getCameraPosition directly from the mouse event
          const ray = this.viewer.camera.getPickRay(event.endPosition);
          if (ray) {
            const pickedPosition = this.viewer.scene.globe.pick(
              ray,
              this.viewer.scene
            );
            if (pickedPosition) {
              cartesian = pickedPosition;
            } else {
              console.warn('pickPosition failed, using camera position');
            }
          }
        }

        // If we have a valid position, emit mouse position events
        if (cartesian) {
          // Convert cartesian coordinates to geographic coordinates
          const position = cartesianToPosition(cartesian);

          // Emit global mouse position event using both CesiumEventType and IEventType for compatibility
          // Emitting MOUSE_MOVE event
          this.globalEventEmitter.emitGlobalEvent({
            type: IEventType.MOUSE_MOVE,
            position: position,
          });
        }

        // Only process entity-specific events if we're actually dragging entities
        if (this.mouseDragEntities.size > 0) {
          // CRITICAL: We must ensure we have valid cartesian coordinates for dragging
          if (!cartesian) {
            console.warn(
              'No cartesian coordinates during drag - trying ellipsoid method'
            );

            // Try with ellipsoid intersection as last resort
            const ellipsoidPosition = this.viewer.camera.pickEllipsoid(
              event.endPosition,
              this.viewer.scene.globe.ellipsoid
            );

            if (ellipsoidPosition) {
              cartesian = ellipsoidPosition;
            }

            if (!cartesian) {
              console.error(
                'All methods to get cartesian coordinates failed - cannot update position'
              );
              return;
            }
          }

          // Convert cartesian coordinates to geographic coordinates
          const position = cartesianToPosition(cartesian);

          // Track which entities we couldn't find to clean them up
          const invalidEntityIds: string[] = [];

          // Process all entities being dragged
          this.mouseDragEntities.forEach((entityId) => {
            const entity = this.viewer.entities.getById(entityId);
            if (!entity) {
              // Instead of just warning, mark it for removal from the tracking set
              invalidEntityIds.push(entityId);
              return;
            }

            // Create a complete event data package with all needed information
            const eventData: CesiumEventData = {
              entityId,
              position: position,
              entity: entity,
              cartesian: cartesian, // Include the original cartesian for more precise positioning
              screenPosition: event.endPosition, // Include the original screen position for height reference handling
            };

            this.emitEntityEvent(
              CesiumEventType.MOUSE_DRAG,
              entityId,
              eventData
            );
          });

          // Clean up any invalid entity IDs from the tracking set
          if (invalidEntityIds.length > 0) {
            // Removing invalid entities from drag tracking
            invalidEntityIds.forEach((id) => {
              this.mouseDragEntities.delete(id);
            });
          }
        }
        // Handle hover events when not dragging
        else {
          // Clear any existing timeout to prevent multiple hover events
          if (this.pickedTimeout) {
            clearTimeout(this.pickedTimeout);
          }

          // Set a small timeout to avoid excessive hover events
          this.pickedTimeout = setTimeout(() => {
            // Get mouse position regardless of entity presence
            const cartesian = this.viewer.scene.pickPosition(event.endPosition);
            if (!cartesian) return;

            // Convert cartesian coordinates to geographic coordinates
            const position = cartesianToPosition(cartesian);

            // Try to get entity information if available
            const pickedObject = this.viewer.scene.pick(event.endPosition);

            // Check if we have an entity and process entity-specific events
            if (pickedObject && pickedObject.id && pickedObject.id._id) {
              const entityId = pickedObject.id._id;
              const entityObject = pickedObject.id;

              // Emit entity-specific event only when we have a valid entity
              const eventData: CesiumEventData = {
                entityId,
                position: position,
                entity: entityObject,
              };

              this.emitEntityEvent(
                CesiumEventType.MOUSE_HOVER,
                entityId,
                eventData
              );

              // Emit global hover event with entity information
              this.globalEventEmitter.emitGlobalEvent({
                type: IEventType.MOUSE_HOVER,
                position: position,
                entityId: entityId,
              });
            } else {
              // Emit global hover event without entity information
              this.globalEventEmitter.emitGlobalEvent({
                type: IEventType.MOUSE_HOVER,
                position: position,
              });
            }
          }, 0);
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE
    );

    // ALT + MOUSE_MOVE handler - update height manipulation
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.MotionEvent) => {
        // Only process if we're actively height-dragging entities
        if (this.mouseHeightDragEntities.size > 0) {
          // Process all entities being height-dragged
          const invalidEntityIds: string[] = [];

          this.mouseHeightDragEntities.forEach((entityId) => {
            const entity = this.viewer.entities.getById(entityId);
            if (!entity) {
              // Mark invalid entities for removal
              invalidEntityIds.push(entityId);
              return;
            }

            // Get cartesian position for consistency with other events
            const cartesian = this.viewer.scene.pickPosition(event.endPosition);
            const position = cartesian
              ? cartesianToPosition(cartesian)
              : { latitude: 0, longitude: 0, altitude: 0 };

            // Create complete event data for height manipulation with full movement data
            // This is important - the reference implementation passes the full movement object
            const eventData: CesiumEventData = {
              entityId,
              entity: entity,
              position: position,
              screenPosition: event.endPosition,
              movement: event, // Pass the full motion event for delta calculations
            };

            // Emit entity-specific height drag event
            this.emitEntityEvent(
              CesiumEventType.ALT_PLUS_MOUSE_DRAG,
              entityId,
              eventData
            );
          });

          // Clean up any invalid entity IDs
          invalidEntityIds.forEach((id) =>
            this.mouseHeightDragEntities.delete(id)
          );
        }
        // Handle hover events when not height-dragging
        else {
          // Clear any existing timeout to prevent multiple hover events
          if (this.pickedTimeout) {
            clearTimeout(this.pickedTimeout);
          }

          // Set a small timeout to avoid excessive hover events
          this.pickedTimeout = setTimeout(() => {
            const cartesian = this.viewer.scene.pickPosition(event.endPosition);
            if (!cartesian) return;

            // Convert to position
            const position = cartesianToPosition(cartesian);

            // Check for entity hover
            const pickedObject = this.viewer.scene.pick(event.endPosition);

            if (pickedObject && pickedObject.id && pickedObject.id._id) {
              const entityId = pickedObject.id._id;

              // Emit entity-specific ALT hover event
              const eventData: CesiumEventData = {
                entityId,
                position: position,
                entity: pickedObject.id,
              };

              this.emitEntityEvent(
                CesiumEventType.ALT_PLUS_MOUSE_HOVER,
                entityId,
                eventData
              );

              // Emit global ALT hover event with entity
              this.globalEventEmitter.emitGlobalEvent({
                type: IEventType.ALT_PLUS_MOUSE_HOVER,
                position: position,
                entityId: entityId,
              });
            } else {
              // Emit global ALT hover event without entity
              this.globalEventEmitter.emitGlobalEvent({
                type: IEventType.ALT_PLUS_MOUSE_HOVER,
                position: position,
              });
            }
          }, 100);
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.ALT
    );

    // LEFT_UP handler - end drag
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.PositionedEvent) => {
        // Don't return early if no drag entities, we still want to emit global event

        // Re-enable camera rotation if there were drag entities
        if (this.mouseDragEntities.size > 0) {
          this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        }

        // Try to get position, but don't return if not available
        let position: IPosition | undefined;
        const cartesian = this.viewer.scene.pickPosition(event.position);
        if (cartesian) {
          // Convert cartesian coordinates to geographic coordinates if available
          position = cartesianToPosition(cartesian);
        }

        // Process all dragging entities only if we have position data
        if (position) {
          this.mouseDragEntities.forEach((entityId) => {
            const entity = this.viewer.entities.getById(entityId);
            if (!entity) return;

            // Emit entity-specific event
            const eventData: CesiumEventData = {
              entityId,
              position: position,
              entity: entity,
            };

            this.emitEntityEvent(CesiumEventType.LEFT_UP, entityId, eventData);
          });
        }

        // Emit global event regardless of position data
        // Emitting LEFT_UP event
        this.globalEventEmitter.emitGlobalEvent({
          type: IEventType.LEFT_UP,
          position: position, // This may be undefined if cartesian was undefined
        });

        // Re-enable all camera controls when drag ends
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = true;
        this.viewer.scene.screenSpaceCameraController.enableLook = true;

        this.mouseDragEntities.clear();
        this.mouseHeightDragEntities.clear();
      },
      ScreenSpaceEventType.LEFT_UP
    );

    // ALT + LEFT_UP handler - end height manipulation
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.PositionedEvent) => {
        // Don't return early if no height-drag entities, we still want to emit global event

        // Re-enable camera rotation if there were drag entities
        if (this.mouseHeightDragEntities.size > 0) {
          this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        }

        // Try to get position, but don't return if not available
        let position: IPosition | undefined;
        const cartesian = this.viewer.scene.pickPosition(event.position);
        if (cartesian) {
          // Convert cartesian coordinates to geographic coordinates if available
          position = cartesianToPosition(cartesian);
        }

        // Process all height-dragging entities only if we have position data
        if (position) {
          this.mouseHeightDragEntities.forEach((entityId) => {
            const entity = this.viewer.entities.getById(entityId);
            if (!entity) return;

            // Emit entity-specific event
            const eventData: CesiumEventData = {
              entityId,
              position: position,
              entity: entity,
            };

            this.emitEntityEvent(
              CesiumEventType.ALT_PLUS_LEFT_UP,
              entityId,
              eventData
            );
          });
        }

        // Emit global event regardless of position data
        this.globalEventEmitter.emitGlobalEvent({
          type: IEventType.ALT_PLUS_LEFT_UP,
          position: position, // This may be undefined if cartesian was undefined
        });

        // IMPORTANT: Clear height drag entities tracking set BEFORE re-enabling controls
        // to ensure no lingering height manipulation state
        this.mouseHeightDragEntities.clear();

        // Re-enable all camera controls when height manipulation ends
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = true;
        this.viewer.scene.screenSpaceCameraController.enableLook = true;
      },
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.ALT
    );

    // LEFT_  handler
    this.handler.setInputAction(
      (event: ScreenSpaceEventHandler.PositionedEvent) => {
        const entity = this.viewer.scene.pick(event.position);
        const position = this.viewer.scene.pickPosition(event.position);
        if (!position) return;

        if (entity && entity.id) {
          const entityId = entity.id._id;

          // Keyboard focus: if entity is keyboard-controllable, set focus on click
          // If non-controllable entity clicked, clear focus to avoid "stale focus"
          if (this.keyboardControlsAvailable && this.keyboardFocusManager) {
            if (this.isEntityKeyboardControllable(entityId)) {
              this.keyboardFocusManager.setFocus(entityId);
            } else {
              this.keyboardFocusManager.clearFocus();
            }
          }

          // Emit entity-specific event
          const eventData: CesiumEventData = {
            entityId,
            position: cartesianToPosition(position),
            entity: entity.id,
          };

          this.emitEntityEvent(
            CesiumEventType.MOUSE_CLICK,
            entityId,
            eventData
          );
        }

        // Only emit global click event if no entity was clicked or entity doesn't have a registered click handler
        const hasEntityClickHandler =
          entity &&
          entity.id &&
          this.eventEntityMap
            .get(CesiumEventType.MOUSE_CLICK)
            ?.has(entity.id._id);

        if (!hasEntityClickHandler) {
          this.globalEventEmitter.emitGlobalEvent({
            type: IEventType.CLICK,
            position: cartesianToPosition(position),
          });
        }
      },
      ScreenSpaceEventType.LEFT_CLICK
    );

    this.viewer.scene.renderError.addEventListener((error) => {
      this.globalEventEmitter.emitRenderError(error);
    });

    // Disable Double Click handler
    try {
      this.viewer.screenSpaceEventHandler.removeInputAction(
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );
    } catch (error) {
      console.warn(
        'Failed to remove LEFT_DOUBLE_CLICK handler - it may not be set or already removed',
        error
      );
    }
  }

  /**
   * Initialize scene change listener for height reference line collection
   * Handles bulk show/hide based on scene mode (2D vs 3D)
   */
  private initializeHeightReferenceLineVisibility(): void {
    this.onGlobalEvent(IEventType.SCENE_CHANGED, (eventData: IMapEventData) => {
      if (eventData.sceneMode !== undefined) {
        this.updateHeightReferenceLineCollectionVisibility(eventData.sceneMode);
      }
    });

    const currentSceneMode = this.viewer.scene.mode;
    this.updateHeightReferenceLineCollectionVisibility(currentSceneMode);
  }

  /**
   * Update height reference line collection visibility based on scene mode
   * Uses bulk collection.show property for efficient updates on both collections
   * @param sceneMode Current scene mode (2D or 3D)
   */
  private updateHeightReferenceLineCollectionVisibility(
    sceneMode: SceneMode
  ): void {
    const shouldShow = sceneMode !== SceneMode.SCENE2D;

    this.heightReferenceLineCesiumEntityCollection.show = shouldShow;
    this.heightReferencePointCesiumEntityCollection.show = shouldShow;
  }

  /**
   * Add height reference line entity to the collection for bulk visibility management
   * Called by Factory after extracting Cesium entity from base entity
   * @param polylineEntity Cesium Entity for the polyline (can be null)
   */
  addHeightReferenceLineEntity(polylineEntity: Entity | null): void {
    if (!polylineEntity || !this.heightReferenceLineCesiumEntityCollection) {
      return;
    }

    const collection = this.heightReferenceLineCesiumEntityCollection;
    const alreadyInCollection = collection.contains(polylineEntity);

    if (!alreadyInCollection) {
      collection.add(polylineEntity);
    }
  }

  /**
   * Add height reference point entity to the collection for bulk visibility management
   * Called by Factory after extracting Cesium entity from base entity
   * @param pointEntity Cesium Entity for the point (can be null)
   */
  addHeightReferencePointEntity(pointEntity: Entity | null): void {
    if (!pointEntity || !this.heightReferencePointCesiumEntityCollection) {
      return;
    }

    const collection = this.heightReferencePointCesiumEntityCollection;
    const alreadyInCollection = collection.contains(pointEntity);

    if (!alreadyInCollection) {
      collection.add(pointEntity);
    }
  }

  /**
   * Remove height reference line entity from the collection
   * Called by Factory after extracting Cesium entity from base entity
   * @param polylineEntity Cesium Entity for the polyline (can be null)
   */
  removeHeightReferenceLineEntity(polylineEntity: Entity | null): void {
    if (!polylineEntity || !this.heightReferenceLineCesiumEntityCollection) {
      return;
    }

    const collection = this.heightReferenceLineCesiumEntityCollection;
    const isInCollection = collection.contains(polylineEntity);

    if (isInCollection) {
      collection.remove(polylineEntity);
    }
  }

  /**
   * Remove height reference point entity from the collection
   * Called by Factory after extracting Cesium entity from base entity
   * @param pointEntity Cesium Entity for the point (can be null)
   */
  removeHeightReferencePointEntity(pointEntity: Entity | null): void {
    if (!pointEntity || !this.heightReferencePointCesiumEntityCollection) {
      return;
    }

    const collection = this.heightReferencePointCesiumEntityCollection;
    const isInCollection = collection.contains(pointEntity);

    if (isInCollection) {
      collection.remove(pointEntity);
    }
  }

  /**
   * Clean up all event handlers and resources
   */
  dispose(): void {
    // Keyboard cleanup
    if (this.keyboardControlsAvailable) {
      this.keyboardUnsubscribers.forEach((u) => u());
      this.keyboardUnsubscribers = [];
      this.keyboardFocusManager?.clearFocus();
    }

    if (this.handler) {
      this.handler.destroy();
    }

    // Clean up camera orientation tracking
    if (this.cameraChangeHandler && this.viewer?.camera) {
      this.viewer.camera.changed.removeEventListener(this.cameraChangeHandler);
      this.cameraChangeHandler = null;
    }

    // If we're in the middle of a drag or height manipulation operation when disposing, ensure camera controls are re-enabled
    if (
      (this.mouseDragEntities.size > 0 ||
        this.mouseHeightDragEntities.size > 0) &&
      this.viewer?.scene?.screenSpaceCameraController
    ) {
      // Re-enable all camera controls
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
      this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
      this.viewer.scene.screenSpaceCameraController.enableZoom = true;
      this.viewer.scene.screenSpaceCameraController.enableTilt = true;
      this.viewer.scene.screenSpaceCameraController.enableLook = true;
    }

    this.eventEmitter.removeAllListeners();
    this.globalEventEmitter.removeAllListeners();
    this.eventEntityMap.clear();
    this.mouseDragEntities.clear();
    this.mouseHeightDragEntities.clear();
    this.entityOriginalPositionMap.clear();
    this.entityHeightChangeMap.clear();
    if (this.pickedTimeout) {
      clearTimeout(this.pickedTimeout);
    }
    // CesiumEventsManager disposed
  }

  /**
   * Clean up resources when the manager is destroyed
   */
  destroy(): void {
    this.dispose();
  }
}
