import EventEmitter from 'eventemitter3';
import { IEventType, IMapEventData } from '@map/public/contracts';
import { IEvent, IMapEventEmitter } from '@map/private/contracts';

export class MapEventEmitter implements IMapEventEmitter {
  private emitter: EventEmitter;
  constructor() {
    this.emitter = new EventEmitter();
  }

  // Method to emit messages (within the class)
  emit(message: IEvent) {
    this.emitter.emit(message.type, message);
  }

  emitGlobalEvent(message: IMapEventData) {
    this.emitter.emit(message.type, message);
  }

  // Method to remove listeners (within the class)
  removeListener(event: IEventType, listener: (message: IEvent) => void) {
    this.emitter?.removeListener(event, listener);
  }

  // Method to add listeners (within the class)
  addListener(event: IEventType, listener: (message: IEvent) => void) {
    this.emitter.addListener(event, listener);
  }

  addGlobalEventListener(
    event: IEventType,
    listener: (message: IMapEventData) => void
  ) {
    this.emitter.addListener(event, listener);
  }

  removeGlobalEventListener(
    event: IEventType,
    listener: (message: IMapEventData) => void
  ) {
    this.emitter.removeListener(event, listener);
  }

  //Method to add listener that is called only once.
  once(event: IEventType, listener: (message: IEvent) => void) {
    this.emitter.once(event, listener);
  }

  //Method to get the list of listeners.
  listeners(event: IEventType) {
    return this.emitter.listeners(event);
  }

  //Method to get the list of event names.
  eventNames() {
    return this.emitter.eventNames();
  }

  // Method to remove all listeners
  removeAllListeners() {
    this.emitter?.removeAllListeners();
  }

  // Method to get the listener view (Proxy)
  getListenOnlyInstance(): MapEventEmitter {
    // Create a restricted listener-only instance of MapEventEmitter
    const listenerOnlyInstance = new MapEventEmitter();

    // Override the internal emitter with our proxy
    Object.defineProperty(listenerOnlyInstance, 'emitter', {
      value: new Proxy(this.emitter, {
        get: (target, prop) => {
          if (
            prop === 'on' ||
            prop === 'addListener' ||
            prop === 'once' ||
            prop === 'listeners' ||
            prop === 'eventNames' ||
            prop === 'removeListener'
          ) {
            return target[prop].bind(target);
          }
          return undefined; // Prevent access to other methods
        },
        set: () => {
          return false; // Prevent setting any properties
        },
        deleteProperty: () => {
          return false; // Prevent deleting any properties
        },
      }),
      writable: false,
      configurable: false,
    });

    // Override methods that should not be available in the listener-only instance
    listenerOnlyInstance.emit = (() => {
      /* no-op */
    }) as unknown as typeof listenerOnlyInstance.emit;
    listenerOnlyInstance.removeAllListeners = (() => {
      /* no-op */
    }) as unknown as typeof listenerOnlyInstance.removeAllListeners;

    return listenerOnlyInstance;
  }

  emitRenderError(error: Error) {
    this.emitter.emit(IEventType.RENDER_ERROR, error);
  }

  addRenderErrorListener(listener: (error: Error) => void) {
    this.emitter.on(IEventType.RENDER_ERROR, listener);
  }

  removeRenderErrorListener(listener: (error: Error) => void) {
    this.emitter.removeListener(IEventType.RENDER_ERROR, listener);
  }
}
