/**
 * GlobalHeader Component Types
 *
 * Shared types for the GlobalHeader component used across applications.
 */

import { ReactNode } from 'react';
import { PlanBranding } from '../../../../api-modules';

/**
 * Site interface for site selection dropdown
 */
export interface GlobalHeaderSite {
  _id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * User data for avatar display
 */
export interface GlobalHeaderUser {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image_url?: string;
}

/**
 * Organization data for header display
 */
export interface GlobalHeaderOrganization {
  _id?: string;
  name: string;
}

/**
 * Branding configuration
 */
export interface GlobalHeaderBranding {
  logoUrl?: string;
  partnerLogoUrl?: string;
  poweredByLogoUrl?: string;
  brandingType?: number;
  faviconUrl?: string;
}

/**
 * Menu item configuration
 */
export interface GlobalHeaderMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
}

/**
 * Organization data for logo click navigation
 */
export interface GlobalHeaderOrganizationNav {
  sub_domain?: string;
  sub_domain_suffix?: string;
  domain?: string;
}

/**
 * Props for GlobalHeader component
 */
export interface GlobalHeaderProps {
  /**
   * Application name displayed in the middle section
   * @example "Asset Management" | "Mission Planner" | "Fleet View"
   */
  appName: string;

  /**
   * Available sites for site selection dropdown
   */
  sites?: GlobalHeaderSite[];

  /**
   * Currently selected site
   */
  selectedSite?: GlobalHeaderSite | null;

  /**
   * Callback when site is changed
   */
  onSiteChange?: (site: GlobalHeaderSite) => void;

  /**
   * Whether sites are loading
   */
  isSitesLoading?: boolean;

  /**
   * Whether to show site selection dropdown
   * @default true
   */
  showSiteSelection?: boolean;

  /**
   * Callback when logo is clicked (e.g., navigate to dashboard)
   */
  onLogoClick?: () => void;

  /**
   * Whether to show user menu (Profile, Logout options)
   * @default true
   */
  showUserMenu?: boolean;

  /**
   * User profile data for avatar display
   */
  userProfile?: GlobalHeaderUser | null;

  /**
   * Organization data for display
   */
  organization?: GlobalHeaderOrganization | null;

  /**
   * Whether to show organization info in middle section
   * @default true
   */
  showOrgInfo?: boolean;

  /**
   * Plan branding for plan icon display
   */
  planBranding?: PlanBranding | null;

  /**
   * Whether to show plan badge/icon
   * @default true
   */
  showPlanBadge?: boolean;

  /**
   * Whether to show Beta badge after app name
   * @default false
   */
  showBeta?: boolean;

  /**
   * Whether to show user avatar (vs just icon)
   * @default true
   */
  showUserAvatar?: boolean;

  /**
   * Branding configuration
   */
  branding?: GlobalHeaderBranding;

  /**
   * URL to redirect for profile page
   */
  profileUrl?: string;

  /**
   * Callback when profile is clicked
   */
  onProfileClick?: () => void;

  /**
   * Callback when logout is clicked
   */
  onLogout?: () => void;

  /**
   * Additional menu items for user dropdown
   */
  additionalMenuItems?: GlobalHeaderMenuItem[];

  /**
   * Custom middle content to replace default app name + org info
   */
  middleContent?: ReactNode;

  /**
   * Custom right content to add before user menu
   */
  rightContent?: ReactNode;

  /**
   * Additional CSS class name
   */
  className?: string;
}
