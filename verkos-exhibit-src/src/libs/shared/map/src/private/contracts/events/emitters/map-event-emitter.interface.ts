import { IEventType, IMapEventData } from '@map/public/contracts';
import { IEvent } from './map-events.interface';

export interface IMapEventEmitter {
  emit(message: IEvent): void;
  emitGlobalEvent(message: IMapEventData): void;
  removeListener(event: IEventType, listener: (message: IEvent) => void): void;
  addListener(event: IEventType, listener: (message: IEvent) => void): void;
  addGlobalEventListener(
    event: IEventType,
    listener: (message: IMapEventData) => void
  ): void;
  removeGlobalEventListener(
    event: IEventType,
    listener: (message: IMapEventData) => void
  ): void;
  once(event: IEventType, listener: (message: IEvent) => void): void;
  listeners(event: IEventType): unknown[];
  eventNames(): Array<string | symbol>;
  removeAllListeners(): void;
  getListenOnlyInstance(): IMapEventEmitter;
  emitRenderError(error: Error): void;
  addRenderErrorListener(listener: (error: Error) => void): void;
  removeRenderErrorListener(listener: (error: Error) => void): void;
}
