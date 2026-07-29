/**
 * TemplateAppHeader Component
 *
 * Application-specific header wrapper that integrates the shared GlobalHeader
 * with template app's data hooks and configuration.
 *
 * This is a simplified version without site selection (removed as per requirements).
 * Add application-specific logic here as you build features.
 */

import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { GlobalHeader } from '@ui/components';
import { environment } from '@env';
import {
import { assetUrl } from '@/exhibit/asset-url';
  useUserProfile,
  useBrandDetails,
  useOrganizationInfo,
  useSubscriptionPlans,
} from '@libs/shared/api-modules';

interface TemplateAppHeaderProps {
  /**
   * Optional custom app name to display in header
   * Defaults to environment.appInfo.appName
   */
  appName?: string;
}

const TemplateAppHeader: React.FC<TemplateAppHeaderProps> = ({
  appName = environment.appInfo.appName,
}) => {
  const navigate = useNavigate();

  // Data fetching hooks
  const { brandDetails } = useBrandDetails();
  const { userProfile } = useUserProfile();
  const { organization } = useOrganizationInfo();
  const { planBranding } = useSubscriptionPlans();

  /**
   * Open profile page in new tab
   */
  const handleProfileClick = () => {
    window.open(`${environment.appInfo.accountAppUrl}`, '_blank');
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    navigate({ to: '/logout' });
  };

  /**
   * No-op handler for site change (site selection disabled)
   */
  const handleSiteChange = () => {
    // Site selection is disabled for template app
  };

  // Build branding config
  const brandingConfig = {
    logoUrl: brandDetails?.logo_link || assetUrl('/assets/flytbase-logo.svg'),
    partnerLogoUrl: brandDetails?.partner_logo_link || '',
    poweredByLogoUrl: environment.branding.poweredByLogoUrl,
    brandingType: brandDetails?.branding_type,
    faviconUrl: brandDetails?.logo_favicon,
  };

  return (
    <GlobalHeader
      appName={appName}
      // Site selection disabled (removed as per requirements)
      showSiteSelection={false}
      sites={undefined}
      selectedSite={null}
      onSiteChange={handleSiteChange}
      isSitesLoading={false}
      // User and org info
      userProfile={userProfile}
      organization={organization}
      showOrgInfo={true}
      // Plan badge
      planBranding={planBranding}
      showPlanBadge={true}
      // User avatar
      showUserAvatar={true}
      // Branding
      branding={brandingConfig}
      profileUrl={environment.appInfo.accountAppUrl}
      onProfileClick={handleProfileClick}
      onLogout={handleLogout}
      // Beta badge (shown after app name)
      showBeta={true}
    />
  );
};

export default TemplateAppHeader;
