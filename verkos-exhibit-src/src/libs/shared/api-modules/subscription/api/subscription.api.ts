import { useHttp } from '@auth';
import { SubscriptionPlansResponse } from '../types/subscription.types';

export const useSubscriptionApi = () => {
  const httpClient = useHttp();

  return {
    fetchActivePlans: async (): Promise<SubscriptionPlansResponse> => {
      const response = await httpClient.get<SubscriptionPlansResponse>(
        'subscription/active-org-plans'
      );
      return response.data;
    },
  };
};
