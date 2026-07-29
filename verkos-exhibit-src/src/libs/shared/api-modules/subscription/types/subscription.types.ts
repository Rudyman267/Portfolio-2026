/**
 * Subscription API Types
 *
 * Type definitions for subscription plans API following the established pattern
 * from other API modules. Defines interfaces for organization subscription plans
 * and plan branding system with hierarchy.
 */

// Subscription Plan Type enum for type safety
export enum SubscriptionPlanType {
  ZERO = 'ZERO',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

// Plan hierarchy constant for determining highest plan
export const PLAN_HIERARCHY = {
  [SubscriptionPlanType.ZERO]: 0,
  [SubscriptionPlanType.PRO]: 1,
  [SubscriptionPlanType.ENTERPRISE]: 2,
} as const;

// Plan branding type for UI display
export interface PlanBranding {
  subscriptionPlanType: SubscriptionPlanType;
  brandingString: string; // e.g., "enterprise-plan"
  iconName: string; // e.g., "enterprise-plan"
}

export type SubscriptionPlansResponse = {
  _id: string | null;
  plans: string[];
};
