// Legacy Badge component - original API
export { Badge } from './Badge';
export type {
  BadgeProps,
  BadgeType,
  BadgeSize,
  BadgeBorderType,
} from './Badge';

// Modern Badge component - CVA version
export {
  ModernBadge,
  StatusBadge,
  CountBadge,
  NotificationBadge,
  IconBadge,
  BadgeGroup,
  badgeVariants,
  badgeIconVariants,
} from './ModernBadge';
export type { ModernBadgeProps, BadgeGroupProps } from './ModernBadge';
