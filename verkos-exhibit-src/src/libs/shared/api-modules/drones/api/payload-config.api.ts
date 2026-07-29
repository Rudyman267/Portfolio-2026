import { PayloadConfigItem } from '../types/payload-config.types';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useHttp } from '@auth';

/**
 * Hook that provides access to payload config API operations
 */
export const usePayloadConfigApi = () => {
  const httpClient = useHttp();

  return {
    fetchPayloadConfig: async (): Promise<PayloadConfigItem[]> => {
      const response = await httpClient.get<PayloadConfigItem[]>(
        '/payload/config'
      );
      return response.data;
    },
  };
};
