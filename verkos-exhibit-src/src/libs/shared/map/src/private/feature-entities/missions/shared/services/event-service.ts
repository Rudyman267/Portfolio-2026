import { IEventType, IMapEventData } from '@map/public/contracts';
import {
  ICompositeManager,
  IEvent,
  MapEventEmitter,
} from '@map/private/contracts';
import { MissionPlannerConstants } from '../constants';

/**
 * Generic event service for mission planners (Linear and Grid)
 * Provides a cleaner API for managing event emission and subscription
 *
 * @template TEventType - The event type enum (e.g., LinearMissionPlannerEventType, GridMissionPlannerEventType)
 * @template TEventData - The event data interface (e.g., LinearMissionPlannerEventData, GridMissionPlannerEventData)
 */
export class EventService<
  TEventType extends string = string,
  TEventData = unknown
> {
  private _eventEmitter: MapEventEmitter;
  private _eventHandlers: Map<IEventType, (event: IMapEventData) => void> =
    new Map();
  // Track wrapper functions for proper cleanup in offEvent
  // Map structure: eventType -> Map<callback, wrapper>
  private _eventCallbacks: Map<
    TEventType,
    Map<(data: TEventData) => void, (event: IEvent) => void>
  > = new Map();

  /**
   * Create a new EventService
   * @param compositeManager The composite manager to get map services
   * @param id Entity ID for events
   */
  constructor(
    private readonly _compositeManager: ICompositeManager,
    private readonly id: string
  ) {
    this._eventEmitter = new MapEventEmitter();
  }

  /**
   * Register a map click handler
   * @param handler The function to handle click events
   */
  public registerMapClickHandler(
    handler: (event: IMapEventData) => void
  ): void {
    const mapService = this._compositeManager.mapProviderServices.mapServices;
    this._registerHandler(IEventType.CLICK, handler);
    mapService.onGlobalMapEvent(IEventType.CLICK, handler);
  }

  // Removed marker drag handler method as we now handle position changes directly on the markers

  /**
   * Register an event handler and store the reference
   * @param eventType The event type
   * @param handler The handler function
   */
  private _registerHandler(
    eventType: IEventType,
    handler: (event: IMapEventData) => void
  ): void {
    this._eventHandlers.set(eventType, handler);
  }

  /**
   * Get the underlying MapEventEmitter for backward compatibility
   * @returns The MapEventEmitter instance
   */
  public getEventEmitter(): MapEventEmitter {
    return this._eventEmitter;
  }

  /**
   * Emit an event with data
   * @param eventType The type of event to emit
   * @param data The data to include with the event
   */
  public emitEvent(eventType: TEventType, data: Partial<TEventData>): void {
    // Add the event type to the data if not already present
    const eventData = {
      eventType,
      ...data,
    };

    // Create an IEvent-compatible object for the MapEventEmitter
    this._eventEmitter.emit({
      type: eventType as unknown as IEventType,
      id: this.id,
      data: {
        // Include the event data
        ...eventData,
      },
    });
  }

  /**
   * Register an event handler for mission planning events
   * @param eventType The type of event to listen for
   * @param callback The callback function to execute when the event occurs
   */
  public onEvent(
    eventType: TEventType,
    callback: (data: TEventData) => void
  ): void {
    // Create a wrapper function that we can track for cleanup
    const wrapper = (event: IEvent) => {
      if (event?.data) {
        callback(event.data as unknown as TEventData);
      }
    };

    // Store the wrapper function keyed by event type and callback reference
    let callbacksForEvent = this._eventCallbacks.get(eventType);
    if (!callbacksForEvent) {
      callbacksForEvent = new Map();
      this._eventCallbacks.set(eventType, callbacksForEvent);
    }
    callbacksForEvent.set(callback, wrapper);

    this._eventEmitter.addListener(eventType as unknown as IEventType, wrapper);
  }

  /**
   * Unregister an event handler
   * @param eventType The type of event to stop listening for
   * @param callback The callback function to remove (must be the same reference used in onEvent)
   */
  public offEvent(
    eventType: TEventType,
    callback: (data: TEventData) => void
  ): void {
    // Find the wrapper function we created in onEvent
    const callbacksForEvent = this._eventCallbacks.get(eventType);
    if (!callbacksForEvent) {
      return;
    }
    const wrapper = callbacksForEvent?.get(callback);

    if (wrapper) {
      this._eventEmitter.removeListener(
        eventType as unknown as IEventType,
        wrapper
      );
      callbacksForEvent.delete(callback);

      // Clean up empty event type entry
      if (callbacksForEvent.size === 0) {
        this._eventCallbacks.delete(eventType);
      }
    } else {
      if (MissionPlannerConstants.Debug.ENABLE_LOGGING) {
        console.warn(
          `[EventService] Could not find callback to remove for: ${eventType}`,
          {
            plannerId: this.id,
          }
        );
      }
    }
  }

  /**
   * Clean up all event handlers
   */
  public dispose(): void {
    const mapService = this._compositeManager.mapProviderServices.mapServices;

    // Remove all registered map event handlers
    for (const [eventType, handler] of this._eventHandlers.entries()) {
      mapService.offGlobalMapEvent(eventType, handler);
    }

    // Clear the handler map
    this._eventHandlers.clear();

    // Clear the callback tracking map
    this._eventCallbacks.clear();
  }
}
