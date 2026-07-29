import React from 'react';

export type BadgeType =
  | 'secondary'
  | 'caution'
  | 'warning'
  | 'disabled'
  | 'success'
  | 'error'
  | 'info'
  | 'outline';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'legacyMd' | 'lg';

export type BadgeBorderType = 'rounded' | 'pill';

export interface BadgeProps {
  /**
   * The label text to display in the badge
   */
  label: string;
  /**
   * The type of badge to display
   * @default 'secondary'
   */
  type?: BadgeType;
  /**
   * Optional icon to display before the label
   */
  prefixIcon?: React.ReactNode;
  /**
   * Optional size of badge (affects height/typography/padding)
   * @default 'legacyMd' (matches legacy default styling)
   */
  size?: BadgeSize;
  /**
   * Optional border/corner style.
   * - 'pill' => rounded-full
   * - 'rounded' => rounded-md
   *
   * If omitted, Badge picks a default per-size to preserve legacy visuals.
   */
  borderType?: BadgeBorderType;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Badge component that displays a small label with different stylings based on type
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  type = 'secondary',
  prefixIcon,
  size = 'legacyMd',
  borderType = 'pill',
  className = '',
}) => {
  // Tailwind classes mapping for different badge types
  const typeStyles: Record<BadgeType, string> = {
    secondary: 'bg-secondary-200 text-text-1',
    caution: 'bg-caution-container text-caution-30',
    warning: 'bg-warning-container text-warning-30',
    disabled: 'bg-background-level-4 text-text-2',
    success: 'bg-success-container text-success-30',
    error: 'bg-error-container text-error-30',
    info: 'bg-info-container text-info-30',
    outline: 'bg-transparent border border-outline-primary text-text-1',
  };

  // Size styles. IMPORTANT: legacyMd must match the legacy default styling (backwards compatible).
  const sizeStyles: Record<BadgeSize, string> = {
    xs: 'h-4 px-1.5 fb-tiny-2',
    sm: 'h-5 px-2 fb-tiny-1',
    md: 'h-6 px-2.5 fb-body-4',
    legacyMd: 'px-2 py-0.5 fb-tiny-1',
    lg: 'h-8 px-3.5 fb-body-2',
  };

  const defaultBorderTypeBySize: Record<BadgeSize, BadgeBorderType> = {
    xs: 'rounded',
    sm: 'rounded',
    md: 'pill',
    legacyMd: 'pill',
    lg: 'pill',
  };

  const borderTypeStyles: Record<BadgeBorderType, string> = {
    rounded: 'rounded-md',
    pill: 'rounded-full',
  };

  return (
    <div
      className={`flex items-center gap-1 whitespace-nowrap ${
        sizeStyles[size]
      } ${borderTypeStyles[borderType ?? defaultBorderTypeBySize[size]]} ${
        typeStyles[type]
      } ${className}`}
    >
      {prefixIcon}
      <span>{label}</span>
    </div>
  );
};

export default Badge;
