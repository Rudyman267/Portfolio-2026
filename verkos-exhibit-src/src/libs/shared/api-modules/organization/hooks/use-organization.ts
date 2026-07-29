import { useQuery } from '@tanstack/react-query';
import { useOrganizationApi } from '../api/organization.api';
import {
  OrganizationConfig,
  OrganizationResponse,
  BrandDetailsData,
} from '../types/organization.types';
import { OrganizationSettingsResponse } from '../api/organization.api';
import { BaseMapType } from '../types/organization.types';

// Query keys for consistent cache management
export const ORGANIZATION_KEYS = {
  all: ['organization'] as const,
  info: () => [...ORGANIZATION_KEYS.all, 'info'] as const,
  config: () => [...ORGANIZATION_KEYS.all, 'config'] as const,
  settings: () => [...ORGANIZATION_KEYS.all, 'settings'] as const,
  brandDetails: () => [...ORGANIZATION_KEYS.all, 'brandDetails'] as const,
};

/**
 * Hook for fetching and managing organization information
 */
export const useOrganizationInfo = () => {
  const organizationApi = useOrganizationApi();

  const query = useQuery<OrganizationResponse>({
    queryKey: ORGANIZATION_KEYS.info(),
    queryFn: () => organizationApi.fetchOrganizationInfo(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - organization info rarely changes
    refetchOnWindowFocus: false,
  });

  return {
    organization: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useOrganizationConfig = () => {
  const organizationApi = useOrganizationApi();

  const query = useQuery<OrganizationConfig>({
    queryKey: ORGANIZATION_KEYS.config(),
    queryFn: () => organizationApi.fetchOrganizationConfig(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - organization info rarely changes
    refetchOnWindowFocus: false,
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching and managing organization settings including base map configuration
 */
export const useOrganizationSettings = () => {
  const organizationApi = useOrganizationApi();

  const query = useQuery<OrganizationSettingsResponse>({
    queryKey: ORGANIZATION_KEYS.settings(),
    queryFn: () => organizationApi.fetchOrganizationSettings(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - organization settings rarely change
    refetchOnWindowFocus: false,
  });

  // Transform the settings response to match the expected base map configuration format
  const settings = query.data;
  const baseMapConfig = settings
    ? {
        base_map_type: settings.base_map_type as BaseMapType | undefined,
        base_map_config: settings.base_map_config,
      }
    : undefined;

  return {
    settings: query.data,
    baseMapConfig,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching and managing brand details
 */
export const useBrandDetails = () => {
  const organizationApi = useOrganizationApi();

  const query = useQuery<BrandDetailsData>({
    queryKey: ORGANIZATION_KEYS.brandDetails(),
    queryFn: () => organizationApi.fetchBrandDetails(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - branding details rarely change
    refetchOnWindowFocus: false,
  });

  return {
    brandDetails: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
