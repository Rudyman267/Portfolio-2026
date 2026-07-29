import { Cartesian2, Entity } from 'cesium';
import { IPosition } from '@map/public/contracts';
import { BaseMapEventType } from '@map/public/core';
import type {
  IKeyboardEvent,
  IKeyboardPressEvent,
} from '@hardware-controls/keyboard';

/**
 * CesiumEventType is an alias for BaseMapEventType
 * This allows us to use CesiumEventType and BaseMapEventType interchangeably
 */
export type CesiumEventType = BaseMapEventType;

/**
 * Re-export BaseMapEventType values for convenience
 */
export const CesiumEventType = BaseMapEventType;

/**
 * Event data interface for standardized event payloads
 */
export interface CesiumEventData {
  entityId: string;
  position: IPosition;
  entity: Entity;
  cartesian?: any; // Add optional cartesian property for direct access
  screenPosition?: Cartesian2; // Original screen position (2D coordinates)
  movement?: any; // Full motion event for drag operations (especially needed for height manipulation)
  heightChange?: number; // Optional height change amount for ALT-drag operations
}

/**
 * Keyboard event data for entity-specific keyboard events.
 *
 * Important: we forward the SAME keyboard event object that comes from KeyboardManager,
 * so entities can call `markHandled()` and stop propagation to lower-priority listeners.
 */
export interface CesiumKeyboardEventData {
  entityId: string;
  keyboardEvent: IKeyboardEvent | IKeyboardPressEvent;
  entity: Entity;
}

/**
 * Union of entity event payloads emitted by CesiumEventsManager.
 */
export type CesiumEntityEventData = CesiumEventData | CesiumKeyboardEventData;

/**
 * Callback type for entity-specific events
 */
export type CesiumEventCallback = (
  entityId: string,
  position: IPosition,
  entity: Entity
) => void;

/**
 * Callback type for global map events
 */
export type CesiumGlobalEventCallback = (eventData: CesiumEventData) => void;
