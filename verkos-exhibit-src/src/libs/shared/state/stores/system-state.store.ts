import { create } from 'zustand';
import { isEqual } from 'lodash';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { CompleteSystemState } from '../types/system-state.types';

/**
 * Interface for system state store
 */
export interface SystemStateStore {
  // Map of binding ID to system state
  systemStates: Record<string, CompleteSystemState>;

  // Set the system state for a binding
  setSystemState: (bindingId: string, state: CompleteSystemState) => void;

  // Get system state by binding ID
  getSystemState: (bindingId: string) => CompleteSystemState | undefined;

  // Clear all system states (useful for logout/cleanup)
  clearSystemStates: () => void;
}

/**
 * Store for managing system states by binding ID
 *
 * Includes middlewares:
 * - subscribeWithSelector: for granular subscriptions
 * - devtools: for Redux DevTools integration
 * - immer: for simplified immutable state updates
 */
const useSystemStateStore = create<SystemStateStore>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        systemStates: {},

        setSystemState: (bindingId, state) => {
          const currentState = get();
          const existingState = currentState.systemStates[bindingId];

          // Check if the state has actually changed
          if (existingState && isEqual(existingState, state)) {
            return;
          }

          set(
            (draft) => {
              // Add timestamp if it doesn't already have one
              const stateWithTimestamp = state.system_ping
                ? state
                : { ...state, system_ping: Date.now() };

              draft.systemStates[bindingId] = stateWithTimestamp;
            },
            false,
            `systemState/set/${bindingId}`
          );
        },

        getSystemState: (bindingId) => {
          return get().systemStates[bindingId];
        },

        clearSystemStates: () =>
          set(
            (draft) => {
              draft.systemStates = {};
            },
            false,
            'systemState/clearAll'
          ),
      })),
      {
        name: 'System State Store',
      }
    )
  )
);

export default useSystemStateStore;
