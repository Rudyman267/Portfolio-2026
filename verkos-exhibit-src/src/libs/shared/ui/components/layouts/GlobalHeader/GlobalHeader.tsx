/**
 * GlobalHeader Component
 *
 * Provides consistent branding and functionality:
 * - Dynamic logo rendering based on branding type
 * - Site selection dropdown
 * - Organization info and plan badge display
 * - User profile menu with avatar
 *
 * @example
 * ```tsx
 * <GlobalHeader
 *   appName="Mission Planner"
 *   sites={sitesData}
 *   selectedSite={selectedSite}
 *   onSiteChange={handleSiteChange}
 *   userProfile={userProfile}
 *   organization={organization}
 *   planBranding={planBranding}
 *   branding={brandingConfig}
 *   onLogout={handleLogout}
 * />
 * ```
 */

import React, { useEffect } from 'react';
import {
  Badge,
  Button,
  IconButton,
  Menu,
  Separator,
  UserAvatar,
} from '../../../fb-components';
import { BrandingTypes } from '../../../../api-modules';
import { cn } from '../../../../utils';
import PlanIcon from './PlanIcon';
import type {
  GlobalHeaderProps,
  GlobalHeaderSite,
  GlobalHeaderUser,
} from './GlobalHeader.types';

/**
 * Gets formatted user avatar data for display
 */
const getUserAvatarData = (
  userProfile: GlobalHeaderUser | null | undefined
) => {
  if (!userProfile) {
    return undefined;
  }

  return {
    name:
      userProfile.name ||
      `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
    image: userProfile.profile_image_url || undefined,
    email: userProfile.email || '',
  };
};

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  appName,
  sites = [],
  selectedSite,
  onSiteChange,
  isSitesLoading = false,
  showSiteSelection = true,
  onLogoClick,
  showUserMenu = true,
  userProfile,
  organization,
  showOrgInfo = true,
  planBranding,
  showPlanBadge = true,
  showBeta = false,
  showUserAvatar = true,
  branding,
  profileUrl,
  onProfileClick,
  onLogout,
  additionalMenuItems = [],
  middleContent,
  rightContent,
  className,
}) => {
  const [localSelectedSite, setLocalSelectedSite] = React.useState<
    string | null
  >(selectedSite?.name ?? null);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSelectedSite(selectedSite?.name ?? null);
  }, [selectedSite]);

  // Update favicon when branding changes
  useEffect(() => {
    if (branding?.faviconUrl) {
      const faviconLink = document.getElementById('favicon') as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = branding.faviconUrl;
      }
    }
  }, [branding?.faviconUrl]);

  /**
   * Handles site selection change
   */
  const handleSiteChange = (site: GlobalHeaderSite) => {
    setLocalSelectedSite(site.name);
    onSiteChange?.(site);
  };

  /**
   * Opens user profile page in new tab
   */
  const handleOpenProfilePage = () => {
    if (onProfileClick) {
      onProfileClick();
    } else if (profileUrl) {
      window.open(profileUrl, '_blank');
    }
  };

  /**
   * Initiates logout process
   */
  const handleLogout = () => {
    onLogout?.();
  };

  /**
   * Build site menu items
   */
  const siteMenuItems = sites.map((site: GlobalHeaderSite) => ({
    label: site.name,
    value: site._id,
    onSelect: () => handleSiteChange(site),
  }));

  /**
   * Build user menu items
   */
  const userMenuItems = [
    {
      label: 'Profile',
      onClick: handleOpenProfilePage,
    },
    ...additionalMenuItems,
    {
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  /**
   * Handles logo click - navigates to dashboard if callback provided
   */
  const handleLogoClick = () => {
    onLogoClick?.();
  };

  /**
   * Common logo wrapper with optional click handler
   */
  const LogoWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    if (onLogoClick) {
      return (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleLogoClick}
          title="Go to Dashboard"
        >
          {children}
        </div>
      );
    }
    return <div className="flex items-center gap-3">{children}</div>;
  };

  /**
   * Renders the logo section based on branding type
   */
  const renderLogo = () => {
    const dashboardLogo = branding?.logoUrl || 'assets/flytbase-logo.svg';
    const partnerLogo = branding?.partnerLogoUrl || '';
    const poweredByLogo = branding?.poweredByLogoUrl || '';
    const brandingType = branding?.brandingType ?? BrandingTypes.DEFAULT;

    switch (brandingType) {
      case BrandingTypes.CUSTOMER_BRANDING:
        return (
          <LogoWrapper>
            <img
              src={dashboardLogo}
              alt="Logo"
              className="h-10 flex-shrink-0"
            />
            {poweredByLogo && (
              <>
                <div
                  className="w-[0.6px] h-8"
                  style={{ backgroundColor: '#494949' }}
                ></div>
                <img
                  src={poweredByLogo}
                  alt="Powered by FlytBase"
                  className="h-8 flex-shrink-0"
                />
              </>
            )}
          </LogoWrapper>
        );

      case BrandingTypes.CO_BRANDING:
        return (
          <LogoWrapper>
            <img
              src={dashboardLogo}
              alt="Logo"
              className="h-10 flex-shrink-0"
            />
            {partnerLogo && (
              <>
                <div
                  className="w-[0.6px] h-8"
                  style={{ backgroundColor: '#494949' }}
                ></div>
                <img
                  src={partnerLogo}
                  alt="Partner Logo"
                  className="h-10 flex-shrink-0"
                />
              </>
            )}
          </LogoWrapper>
        );

      case BrandingTypes.PARTNER_BRANDING:
        return (
          <LogoWrapper>
            <img
              src={dashboardLogo}
              alt="Logo"
              className="h-10 flex-shrink-0"
            />
            {poweredByLogo && (
              <>
                <div
                  className="w-[0.6px] h-8"
                  style={{ backgroundColor: '#494949' }}
                ></div>
                <img
                  src={poweredByLogo}
                  alt="Powered by FlytBase"
                  className="w-36 h-8 flex-shrink-0"
                />
              </>
            )}
            {partnerLogo && (
              <>
                <div
                  className="w-[0.6px] h-5"
                  style={{ backgroundColor: '#494949' }}
                ></div>
                <img
                  src={partnerLogo}
                  alt="Partner Logo"
                  className="h-10 flex-shrink-0"
                />
              </>
            )}
          </LogoWrapper>
        );

      case BrandingTypes.DEFAULT:
      default:
        return (
          <LogoWrapper>
            <img
              src={dashboardLogo}
              alt="FlytBase"
              className="h-10 flex-shrink-0"
            />
          </LogoWrapper>
        );
    }
  };

  /**
   * Renders the middle section content
   */
  const renderMiddleSection = () => {
    if (middleContent) {
      return middleContent;
    }

    return (
      <div className="flex items-center gap-3 justify-self-center">
        <span className="text-text-1 font-medium text-base">{appName}</span>
        {showBeta && (
          <Badge 
            label="Beta" 
            type="info" 
            size="sm"
          />
        )}
        {showOrgInfo && organization && (
          <>
            <Separator orientation="vertical" className="h-7" />
            <span className="text-text-2 font-medium text-base">
              {organization.name}
            </span>
          </>
        )}
        {showPlanBadge && planBranding && (
          <PlanIcon planBranding={planBranding} className="ml-2" />
        )}
      </div>
    );
  };

  /**
   * Renders the user menu trigger
   */
  const renderUserMenuTrigger = () => {
    if (showUserAvatar) {
      const avatarData = getUserAvatarData(userProfile);
      if (avatarData) {
        return (
          <div className="cursor-pointer rounded-full hover:ring-2 hover:ring-outline-primary hover:ring-opacity-50 transition-all duration-200">
            <UserAvatar
              user={avatarData}
              size="sm"
              variant="default"
              showInitials={true}
            />
          </div>
        );
      }
    }

    return (
      <IconButton
        variant="ghost"
        icon={<i className="fa-solid fa-user"></i>}
        ariaLabel="user profile menu"
        className="text-text-2 hover:text-text-1 hover:bg-surface-hover"
      />
    );
  };

  return (
    <header
      className={cn(
        'w-full bg-background-level-1 border-b border-outline-primary p-2 grid grid-cols-3 items-center',
        className
      )}
    >
      {/* Left Section: Logo(s) + Site Selection (optional) */}
      <div className="flex items-center gap-4 min-w-0">
        {renderLogo()}
        {showSiteSelection && (
          <div className="min-w-0 flex-none">
            <Menu
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  rightIcon={<i className="fa-solid fa-chevron-down"></i>}
                  disabled={isSitesLoading}
                  className="bg-background-level-2 border-outline-primary text-text-1 hover:bg-surface-hover min-w-0 flex items-center justify-center"
                >
                  <span className="fb-body2-regular truncate">
                    {isSitesLoading
                      ? 'Loading sites...'
                      : localSelectedSite || 'Select Site'}
                  </span>
                </Button>
              }
              fullWidth
              items={siteMenuItems}
              className="bg-background-level-1 border-outline-primary"
            />
          </div>
        )}
      </div>

      {/* Middle Section: App Name + Org Info + Plan Icon */}
      {renderMiddleSection()}

      {/* Right Section: Custom Content + User Profile Menu (optional) */}
      <div className="flex items-center justify-end gap-2">
        {rightContent}
        {showUserMenu && (
          <Menu
            trigger={renderUserMenuTrigger()}
            menuWidth="120px"
            items={userMenuItems}
            className="bg-background-level-1 border-outline-primary"
          />
        )}
      </div>
    </header>
  );
};

export default GlobalHeader;
