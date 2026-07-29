import { useHttp } from '@auth';
import { SitesResponse } from '../types/sites.types';

export const useSitesApi = () => {
  const httpClient = useHttp();

  return {
    fetchSites: async (): Promise<SitesResponse> => {
      const response = await httpClient.get<SitesResponse>('sites/');
      return response.data;
    },
  };
};
