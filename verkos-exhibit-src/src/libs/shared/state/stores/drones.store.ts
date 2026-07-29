import { create } from 'zustand';
import { isEqual } from 'lodash';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DronesState,
  DroneState,
  PropertyPath,
} from '../interfaces/drones-state.interface';

const useDronesStore = create<DronesState>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        drones: {},

        updateDroneData: (droneId: string, data: DroneState) =>
          set(
            (state) => {
              const currentDrone = state.drones[droneId];

              if (!currentDrone || !isEqual(currentDrone, data)) {
                state.drones[droneId] = {
                  ...data,
                  id: droneId,
                };
              }
            },
            false,
            `drones/updateData/${droneId}`
          ),

        updateDroneProperty: (
          droneId: string,
          propertyPath: PropertyPath,
          value: any
        ) => {
          const currentState = get();
          const existingDrone = currentState.drones[droneId];
          const currentValue = getValueAtPath(existingDrone, propertyPath);

          // Check if this is an aglHeight update
          const isAglHeightUpdate =
            propertyPath === 'aglHeight' ||
            (Array.isArray(propertyPath) &&
              propertyPath.join('.') === 'aglHeight');

          if (isEqual(currentValue, value)) {
            return;
          }

          set(
            (state) => {
            if (!state.drones[droneId]) {
                state.drones[droneId] = { 
                  id: droneId,
                  bindingId: '',
                  edgeType: {} as any,
                  payload: [],
                };
              }

              const parts = Array.isArray(propertyPath)
                ? propertyPath
                : propertyPath.split('.');
              let current = state.drones[droneId];

              for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) current[part] = {};
                current = current[part];
              }

              current[parts[parts.length - 1]] = value;
            },
            false,
            `drones/updateProperty/${
              Array.isArray(propertyPath)
                ? propertyPath.join('.')
                : propertyPath
            }`
          );

          // We can keep isAglHeightUpdate for any future use if needed
          // But no need for any post-update checking now
        },
      })),
      {
        name: 'Drones Store',
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

export default useDronesStore;
