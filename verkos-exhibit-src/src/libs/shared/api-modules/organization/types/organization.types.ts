/**
 * Organization Types
 */

export enum BaseMapType {
  BING = 'bing', // Default fallback (existing Bing Maps)
  ARCGIS = 'arcgis', // ArcGIS MapServer/Tile services
  GOOGLE = 'google', // Google Maps imagery
  LOCAL = 'local', // Custom tile servers
}

export interface BaseMapProvider {
  base_map_type: BaseMapType;
  base_map_config?: ArcGisConfig | LocalConfig;
}

export interface ArcGisConfig {
  url: string;
  token?: string;
}

export interface LocalConfig {
  url: string;
  tile_width?: number;
  tile_height?: number;
}

export interface Organization {
  _id: string;
  name: string;
  domain: string;
  sub_domain: string;
  sub_domain_suffix: string;
  owner_id: string;
  created_by: string;
  status: string;
  is_delete: boolean;
  created_at: string;
  updated_at: string;
  cool_down_date: string;
}

export interface OrganizationResponse {
  status: boolean;
  code: string;
  message: string;
  data: Organization;
}

export interface OrganizationFeature {
  name: string;
  value: boolean | string;
  _id?: string;
}

export interface OrganizationConfig {
  organization_id: string;
  features: OrganizationFeature[];
  announcement_slots: number;
  supported_features: string[];
  base_map_provider?: BaseMapProvider; // Optional base map provider configuration
}

/**
 * Branding Types
 */
export enum BrandingTypes {
  DEFAULT = 0,
  CUSTOMER_BRANDING = 1,
  CO_BRANDING = 2,
  PARTNER_BRANDING = 3,
}

/**
 * Brand Details Response
 */
export interface BrandDetailsData {
  logo_favicon: string;
  theme_color: string;
  customer_branding_enabled: boolean;
  organization_id: string;
  logo_link: string;
  branding_type: BrandingTypes;
  partner_logo_link: string;
  logo_link_dark: string;
  partner_logo_link_dark: string;
  powered_by_logo_horizontal?: string;
  powered_by_logo_stacked?: string;
  white_background_image?: string;
  primary_logo_light_bg?: string;
}
