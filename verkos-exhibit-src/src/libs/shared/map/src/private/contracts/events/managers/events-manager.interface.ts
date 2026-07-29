import { IEventType, IMapEventData } from '@map/public/contracts';
import EventEmitter from 'eventemitter3';
import { BaseMapEventType, SceneMode } from '@map/public/core';

/**
 * Interface for the base events manager
 * Responsible for handling events and entity event registration
 */
export interface IEventsManager {
  getEventEmitter(): EventEmitter;
  registerEntityForEvent(event: BaseMapEventType, entityId: string): void;
  unregisterEntityFromEvent(event: BaseMapEventType, entityId: string): void;
  onGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void;
  offGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void;
  onSceneChange(sceneMode: SceneMode): void;
  onRenderError(listener: (error: Error) => void): void;

  offRenderError(listener: (error: Error) => void): void;

  dispose(): void;

  destroy(): void;

  /**
   * Set keyboard focus for an entity
   * @param entityId The entity ID to set focus for
   * @param focused Whether the entity should be focused
   */
  setKeyboardFocus?(entityId: string, focused: boolean): void;

  /**
   * Get the currently focused entity ID
   * @returns The currently focused entity ID or null if no entity is focused
   */
  getKeyboardFocusedEntityId?(): string | null;
}
