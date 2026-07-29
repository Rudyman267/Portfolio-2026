/**
 * PlanIcon Component
 *
 * Renders the appropriate plan icon based on subscription plan branding.
 * Replaces static logo with dynamic plan-specific branding in the header.
 */

import React from 'react';
import { PlanBranding, SubscriptionPlanType } from '../../../../api-modules';
import { cn } from '../../../../utils';

/**
 * Props for PlanIcon component
 */
interface PlanIconProps {
  /** Plan branding information containing icon name and plan type */
  planBranding: PlanBranding | null;
  /** Optional CSS class name for styling */
  className?: string;
}

const PlanIcon: React.FC<PlanIconProps> = ({ planBranding, className }) => {
  if (!planBranding) {
    return null;
  }
  const { iconName, subscriptionPlanType: planType } = planBranding;
  const iconSrc = `assets/plan-icons/${iconName}.svg`;
  const altText = `${planType} Plan`;

  return (
    <img
      src={iconSrc}
      alt={altText}
      className={cn(
        'flex-shrink-0',
        // Plan-specific sizing (matching Angular implementation)
        {
          'ml-4 h-15 w-[120px]': planType === SubscriptionPlanType.ENTERPRISE,
          'mb-2 ml-2 h-10 w-15': planType === SubscriptionPlanType.PRO,
          'ml-2 h-6 w-17': planType === SubscriptionPlanType.ZERO,
        },
        className
      )}
    />
  );
};

export default PlanIcon;
