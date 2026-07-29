import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  PayloadConfigState,
  PayloadConfigItem,
} from '../interfaces/payload-config-state.interface';

const usePayloadConfigStore = create<PayloadConfigState>()(
  devtools(
    (set, get) => ({
      configMap: {},
      isLoading: false,
      isLoaded: false,
      error: null,

      setPayloadConfigs: (configs: PayloadConfigItem[]) => {
        const newMap: Record<string, string> = {};
        configs.forEach((config) => {
          newMap[config.payload_index] = config.name;
        });
        set(
          { configMap: newMap, isLoaded: true },
          false,
          'payloadConfig/setConfigs'
        );
      },

      getPayloadType: (payloadIndex: string) => {
        return get().configMap[payloadIndex];
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading }, false, 'payloadConfig/setLoading');
      },

      setError: (error: Error | null) => {
        set({ error }, false, 'payloadConfig/setError');
      },
    }),
    {
      name: 'Payload Config Store',
    }
  )
);

export default usePayloadConfigStore;
