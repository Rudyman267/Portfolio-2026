/**
 * Plan Utility Functions
 *
 * Utility functions for subscription plan hierarchy and branding logic.
 * Migrated from Angular implementation to React/TypeScript.
 */

import {
  SubscriptionPlanType,
  PLAN_HIERARCHY,
  PlanBranding,
} from '../types/subscription.types';

/**
 * Determines the highest plan type from a list of plan names
 * @param plans Array of plan names from the API
 * @returns The highest plan type according to the hierarchy
 */
export const getHighestPlanType = (plans: string[]): SubscriptionPlanType => {
  if (!plans || plans.length === 0) {
    return SubscriptionPlanType.ZERO;
  }

  return plans.reduce<SubscriptionPlanType>((highest, current) => {
    // Normalize the current plan name to match SubscriptionPlanType enum
    const normalizedCurrent = current.toUpperCase() as SubscriptionPlanType;
    const normalizedHighest = highest.toUpperCase() as SubscriptionPlanType;

    // Get hierarchy values, defaulting to 0 for unknown plans
    const currentRank = PLAN_HIERARCHY[normalizedCurrent] ?? 0;
    const highestRank = PLAN_HIERARCHY[normalizedHighest] ?? 0;

    return currentRank > highestRank ? normalizedCurrent : normalizedHighest;
  }, SubscriptionPlanType.ZERO);
};

/**
 * Generates plan branding information for UI display
 * @param planType The plan type to generate branding for
 * @returns PlanBranding object with type, branding string, and icon name
 */
export const getPlanBranding = (
  planType: SubscriptionPlanType
): PlanBranding => {
  const brandingString = `${planType.toLowerCase()}-plan`;

  return {
    subscriptionPlanType: planType,
    brandingString,
    iconName: brandingString, // Icons match the branding string format
  };
};

/**
 * Convenience function to get plan branding from plan list
 * @param plans Array of plan names from the API
 * @returns PlanBranding object for the highest plan
 */
export const getPlanBrandingFromPlans = (plans: string[]): PlanBranding => {
  const highestPlan = getHighestPlanType(plans);
  return getPlanBranding(highestPlan);
};
