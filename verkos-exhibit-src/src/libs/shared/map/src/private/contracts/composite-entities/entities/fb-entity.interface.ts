import { MapEventEmitter } from '@map/private/contracts/events';

export interface IFBEntity {
  id: string;
  getEventEmitter(): MapEventEmitter;
  remove(): void;
}
