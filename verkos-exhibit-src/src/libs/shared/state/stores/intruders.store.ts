import { create } from 'zustand';
import { isEqual } from 'lodash';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { IntrudersState } from '../interfaces/intruders-state.interface';
import { IntrudersData, IntruderData } from '../types';

const useIntrudersStore = create<IntrudersState>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        intruders: {},

        updateIntrudersData: (data: IntrudersData) =>
          set(
            (state) => {
              // Only update if the data has actually changed
              if (!isEqual(state.intruders, data)) {
                state.intruders = { ...data };
              }
            },
            false,
            'intruders/updateData'
          ),

        updateIntruder: (intruderId: string, data: IntruderData) =>
          set(
            (state) => {
              const currentIntruder = state.intruders[intruderId];

              // Only update if the intruder data has changed
              if (!currentIntruder || !isEqual(currentIntruder, data)) {
                state.intruders[intruderId] = { ...data };
              }
            },
            false,
            `intruders/updateIntruder/${intruderId}`
          ),

        removeIntruder: (intruderId: string) =>
          set(
            (state) => {
              if (state.intruders[intruderId]) {
                delete state.intruders[intruderId];
              }
            },
            false,
            `intruders/removeIntruder/${intruderId}`
          ),

        clearIntruders: () =>
          set(
            (state) => {
              state.intruders = {};
            },
            false,
            'intruders/clearAll'
          ),

        getActiveIntruders: () => {
          const state = get();
          return state.intruders;
        },
      })),
      {
        name: 'Intruders Store',
      }
    )
  )
);

export default useIntrudersStore;
