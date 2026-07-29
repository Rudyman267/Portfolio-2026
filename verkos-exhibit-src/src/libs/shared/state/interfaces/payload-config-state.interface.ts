import { PayloadConfigItem } from '../../api-modules/drones/types/payload-config.types';
export type { PayloadConfigItem } from '../../api-modules/drones/types/payload-config.types';
export interface PayloadConfigState {
  configMap: Record<string, string>;
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  setPayloadConfigs: (configs: PayloadConfigItem[]) => void;
  getPayloadType: (payloadIndex: string) => string | undefined;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}
