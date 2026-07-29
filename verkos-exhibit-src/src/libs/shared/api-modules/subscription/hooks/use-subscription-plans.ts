import { useQuery } from '@tanstack/react-query';
import { useSubscriptionApi } from '../api/subscription.api';
import {
  SubscriptionPlansResponse,
  PlanBranding,
  SubscriptionPlanType,
} from '../types/subscription.types';
import { getPlanBrandingFromPlans } from '../utils/plan-utils';

export const SUBSCRIPTION_KEYS = {
  all: ['subscription'] as const,
  plans: () => [...SUBSCRIPTION_KEYS.all, 'plans'] as const,
  activePlans: () => [...SUBSCRIPTION_KEYS.plans(), 'active'] as const,
};

export const useSubscriptionPlans = () => {
  const subscriptionApi = useSubscriptionApi();

  const query = useQuery<SubscriptionPlansResponse>({
    queryKey: SUBSCRIPTION_KEYS.activePlans(),
    queryFn: () => subscriptionApi.fetchActivePlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes - same as sites
    refetchOnWindowFocus: false,
  });

  const planBranding: PlanBranding | null = query?.data?.plans
    ? getPlanBrandingFromPlans(query.data.plans)
    : getPlanBrandingFromPlans([SubscriptionPlanType.ZERO]);

  return {
    data: query.data,
    plansResponse: query.data,
    planBranding,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
