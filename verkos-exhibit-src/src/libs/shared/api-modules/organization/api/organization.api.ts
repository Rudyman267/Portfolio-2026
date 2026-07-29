import { useHttp } from '@auth';
import {
  ArcGisConfig,
  LocalConfig,
  OrganizationConfig,
  OrganizationResponse,
  BrandDetailsData,
} from '../types/organization.types';

// Interface for organization settings response
export interface OrganizationSettingsResponse {
  _id: string;
  organization_id: string;
  flight_speed: number;
  flight_altitude: number;
  adsb_failsafe_notification: boolean;
  guest_notifications: Array<{
    name: string;
    email: string;
  }>;
  base_map_type?: string;
  base_map_config?: ArcGisConfig | LocalConfig;
}

/**
 * Hook that provides access to organization-related API operations
 */
export const useOrganizationApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch current organization information
     */
    fetchOrganizationInfo: async (): Promise<OrganizationResponse> => {
      const response = await httpClient.get<OrganizationResponse>(
        '/organization/org-info'
      );
      return response.data;
    },

    fetchOrganizationConfig: async (): Promise<OrganizationConfig> => {
      const response = await httpClient.get('/organization/entitlements/fetch');
      return response.data;
    },

    /**
     * Fetch organization settings including base map configuration
     */
    fetchOrganizationSettings:
      async (): Promise<OrganizationSettingsResponse> => {
        const response = await httpClient.get<OrganizationSettingsResponse>(
          '/organization_settings'
        );
        return response.data;
      },

    /**
     * Fetch brand details for organization branding
     */
    fetchBrandDetails: async (): Promise<BrandDetailsData> => {
      const response = await httpClient.get<BrandDetailsData>(
        '/organization/customer_branding/get_brand_details'
      );
      return response.data;
    },
  };
};
