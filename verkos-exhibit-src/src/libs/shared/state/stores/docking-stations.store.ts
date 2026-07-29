import { create } from 'zustand';
import { isEqual } from 'lodash';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DockingStationsState,
  PropertyPath,
  DockingStationState,
} from '../interfaces/docking-stations-state.interface';

/**
 * Store for managing multiple docking stations' state
 * Uses a flexible update system to reduce boilerplate
 *
 * Includes middlewares:
 * - subscribeWithSelector: for granular subscriptions
 * - devtools: for Redux DevTools integration
 * - immer: for simplified immutable state updates
 */
const useDockingStationsStore = create<DockingStationsState>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        dockingStations: {},

        updateDockingStationData: (
          dockingStationId: string,
          data: DockingStationState
        ) =>
          set(
            (state) => {
              const currentDockingStation =
                state.dockingStations[dockingStationId];

              if (
                !currentDockingStation ||
                !isEqual(currentDockingStation, data)
              ) {
                state.dockingStations[dockingStationId] = {
                  ...data,
                  id: dockingStationId,
                };
              }
            },
            false,
            `dockingStations/updateData/${dockingStationId}`
          ),

        updateDockingStationProperty: (
          dockingStationId: string,
          propertyPath: PropertyPath,
          value: any
        ) => {
          const currentState = get();
          const existingDockingStation =
            currentState.dockingStations[dockingStationId];
          const currentValue = getValueAtPath(
            existingDockingStation,
            propertyPath
          );

          if (isEqual(currentValue, value)) {
            return;
          }

          // Property update tracking removed

          set(
            (state) => {
              if (!state.dockingStations[dockingStationId]) {
                state.dockingStations[dockingStationId] = {
                  id: dockingStationId,
                  bindingId: '',
                };
              }

              const parts = Array.isArray(propertyPath)
                ? propertyPath
                : propertyPath.split('.');
              let current = state.dockingStations[dockingStationId];

              for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) current[part] = {};
                current = current[part];
              }

              current[parts[parts.length - 1]] = value;
            },
            false,
            `dockingStations/updateProperty/${
              Array.isArray(propertyPath)
                ? propertyPath.join('.')
                : propertyPath
            }`
          );
        },
      })),
      {
        name: 'Docking Stations Store',
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

export default useDockingStationsStore;
