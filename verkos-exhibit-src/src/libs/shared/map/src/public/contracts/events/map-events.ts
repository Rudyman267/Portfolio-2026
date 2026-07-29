import { SceneMode } from 'cesium';
import { IEventType } from './map-event-types';
import { IPosition } from '../base';

export interface IMapEventData {
  type: IEventType;
  position?: IPosition;
  entityId?: string;
  heightChange?: number;
  sceneMode?: SceneMode;
}

export interface ICameraOrientationEventData extends IMapEventData {
  heading: number; // Current heading in radians
  pitch: number; // Current pitch in radians
  roll: number; // Current roll in radians
  headingDegrees: number; // Normalized heading in degrees (0-360)
  pitchDegrees: number; // Current pitch in degrees
  altitude?: number; // Current camera altitude in meters
}
