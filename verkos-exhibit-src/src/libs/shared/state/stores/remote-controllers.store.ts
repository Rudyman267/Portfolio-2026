import { create } from 'zustand';
import { isEqual } from 'lodash';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  RemoteControllersState,
  PropertyPath,
  RemoteControllerState,
} from '../interfaces/remote-controllers-state.interface';

/**
 * Store for managing multiple remote controllers' state
 * Uses a flexible update system to reduce boilerplate
 *
 * Includes middlewares:
 * - subscribeWithSelector: for granular subscriptions
 * - devtools: for Redux DevTools integration
 * - immer: for simplified immutable state updates
 */
const useRemoteControllersStore = create<RemoteControllersState>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        remoteControllers: {},

        updateRemoteControllerData: (
          remoteControllerId: string,
          data: RemoteControllerState
        ) =>
          set(
            (state) => {
              const currentRemoteController =
                state.remoteControllers[remoteControllerId];

              if (
                !currentRemoteController ||
                !isEqual(currentRemoteController, data)
              ) {
                state.remoteControllers[remoteControllerId] = {
                  ...data,
                  id: remoteControllerId,
                };
              }
            },
            false,
            `remoteControllers/updateData/${remoteControllerId}`
          ),

        updateRemoteControllerProperty: (
          remoteControllerId: string,
          propertyPath: PropertyPath,
          value: any
        ) => {
          const currentState = get();
          const existingRemoteController =
            currentState.remoteControllers[remoteControllerId];
          const currentValue = getValueAtPath(
            existingRemoteController,
            propertyPath
          );

          if (isEqual(currentValue, value)) {
            return;
          }

          set(
            (state) => {
              if (!state.remoteControllers[remoteControllerId]) {
                state.remoteControllers[remoteControllerId] = {
                  id: remoteControllerId,
                  bindingId: '',
                };
              }

              const parts = Array.isArray(propertyPath)
                ? propertyPath
                : propertyPath.split('.');
              let current: Record<string, unknown> = state.remoteControllers[
                remoteControllerId
              ] as Record<string, unknown>;

              for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) current[part] = {};
                current = current[part] as Record<string, unknown>;
              }

              current[parts[parts.length - 1]] = value;
            },
            false,
            `remoteControllers/updateProperty/${
              Array.isArray(propertyPath)
                ? propertyPath.join('.')
                : propertyPath
            }`
          );
        },
      })),
      {
        name: 'Remote Controllers Store',
      }
    )
  )
);

function getValueAtPath(obj: any, path: PropertyPath): any {
  if (!obj) return undefined;

  const parts = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }

  return current;
}

export default useRemoteControllersStore;
