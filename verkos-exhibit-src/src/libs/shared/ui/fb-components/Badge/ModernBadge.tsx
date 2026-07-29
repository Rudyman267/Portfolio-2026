import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-500 text-primary-foreground hover:bg-primary-600',
        secondary:
          'border-transparent bg-secondary-500 text-secondary-foreground hover:bg-secondary-600',
        success:
          'border-transparent bg-success-500 text-success-foreground hover:bg-success-600',
        warning:
          'border-transparent bg-warning-500 text-warning-foreground hover:bg-warning-600',
        error:
          'border-transparent bg-error-500 text-error-foreground hover:bg-error-600',
        outline:
          'border-outline-primary bg-transparent text-text-1 hover:bg-surface-hover',
        ghost:
          'border-transparent bg-surface-hover text-text-1 hover:bg-surface-hover',
        neutral:
          'border-transparent bg-surface-hover text-text-2 hover:bg-surface-hover',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs fb-body-4',
        md: 'px-2.5 py-0.5 text-sm fb-body-4',
        lg: 'px-3 py-1 text-sm fb-body-2',
      },
      shape: {
        rounded: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
    },
  }
);

const badgeIconVariants = cva('flex items-center justify-center', {
  variants: {
    size: {
      sm: 'w-3 h-3 text-xs',
      md: 'w-4 h-4 text-sm',
      lg: 'w-5 h-5 text-base',
    },
    position: {
      start: 'mr-1',
      end: 'ml-1',
    },
  },
  defaultVariants: {
    size: 'md',
    position: 'start',
  },
});

export interface ModernBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Visual variant of the badge
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline'
    | 'ghost'
    | 'neutral';
  /**
   * Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Shape of the badge
   * @default 'rounded'
   */
  shape?: 'rounded' | 'square';
  /**
   * Icon to display at the start of the badge
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the badge
   */
  endIcon?: React.ReactNode;
  /**
   * Whether the badge is clickable
   */
  clickable?: boolean;
  /**
   * Whether the badge is dismissible
   */
  dismissible?: boolean;
  /**
   * Callback when the badge is dismissed
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const ModernBadge = React.forwardRef<HTMLDivElement, ModernBadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      shape = 'rounded',
      startIcon,
      endIcon,
      clickable = false,
      dismissible = false,
      onDismiss,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (clickable && onClick) {
        onClick(e);
      }
    };

    const handleDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onDismiss) {
        onDismiss();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, shape }),
          clickable && 'cursor-pointer hover:opacity-90',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {startIcon && (
          <span className={cn(badgeIconVariants({ size, position: 'start' }))}>
            {startIcon}
          </span>
        )}
        <span className="truncate">{children}</span>
        {endIcon && (
          <span className={cn(badgeIconVariants({ size, position: 'end' }))}>
            {endIcon}
          </span>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              badgeIconVariants({ size, position: 'end' }),
              'ml-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2'
            )}
            aria-label="Dismiss badge"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>
    );
  }
);
ModernBadge.displayName = 'ModernBadge';

// Status Badge component
const StatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<ModernBadgeProps, 'variant'> & {
    status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error';
  }
>(({ status, ...props }, ref) => {
  const statusToVariant = {
    active: 'success',
    inactive: 'neutral',
    pending: 'warning',
    success: 'success',
    warning: 'warning',
    error: 'error',
  } as const;

  return <ModernBadge ref={ref} variant={statusToVariant[status]} {...props} />;
});
StatusBadge.displayName = 'StatusBadge';

// Count Badge component
const CountBadge = React.forwardRef<
  HTMLDivElement,
  Omit<ModernBadgeProps, 'variant' | 'size'> & {
    count: number;
    maxCount?: number;
  }
>(({ count, maxCount = 99, ...props }, ref) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <ModernBadge ref={ref} variant="error" size="sm" shape="rounded" {...props}>
      {displayCount}
    </ModernBadge>
  );
});
CountBadge.displayName = 'CountBadge';

// Notification Badge component
const NotificationBadge = React.forwardRef<
  HTMLDivElement,
  Omit<ModernBadgeProps, 'variant' | 'size' | 'shape'> & {
    count?: number;
    maxCount?: number;
    showZero?: boolean;
  }
>(({ count = 0, maxCount = 99, showZero = false, ...props }, ref) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <ModernBadge
      ref={ref}
      variant="error"
      size="sm"
      shape="rounded"
      className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center"
      {...props}
    >
      {displayCount}
    </ModernBadge>
  );
});
NotificationBadge.displayName = 'NotificationBadge';

// Icon Badge component
const IconBadge = React.forwardRef<
  HTMLDivElement,
  Omit<ModernBadgeProps, 'children'> & {
    icon: React.ReactNode;
  }
>(({ icon, ...props }, ref) => {
  return (
    <ModernBadge ref={ref} {...props}>
      {icon}
    </ModernBadge>
  );
});
IconBadge.displayName = 'IconBadge';

// Badge Group component
export interface BadgeGroupProps {
  /**
   * Array of badges to display
   */
  badges: Array<{
    id: string;
    content: React.ReactNode;
    variant?: ModernBadgeProps['variant'];
    size?: ModernBadgeProps['size'];
    shape?: ModernBadgeProps['shape'];
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    clickable?: boolean;
    dismissible?: boolean;
    onDismiss?: () => void;
    onClick?: () => void;
  }>;
  /**
   * Maximum number of badges to show before showing "+X more"
   * @default 5
   */
  maxVisible?: number;
  /**
   * Gap between badges
   * @default 'md'
   */
  spacing?: 'sm' | 'md' | 'lg';
  /**
   * Whether badges should wrap to new lines
   * @default true
   */
  wrap?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const BadgeGroup: React.FC<BadgeGroupProps> = ({
  badges,
  maxVisible = 5,
  spacing = 'md',
  wrap = true,
  className,
}) => {
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;

  const spacingClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  return (
    <div
      className={cn(
        'flex items-center',
        spacingClasses[spacing],
        wrap && 'flex-wrap',
        className
      )}
    >
      {visibleBadges.map((badge) => (
        <ModernBadge
          key={badge.id}
          variant={badge.variant}
          size={badge.size}
          shape={badge.shape}
          startIcon={badge.startIcon}
          endIcon={badge.endIcon}
          clickable={badge.clickable}
          dismissible={badge.dismissible}
          onDismiss={badge.onDismiss}
          onClick={badge.onClick}
        >
          {badge.content}
        </ModernBadge>
      ))}
      {remainingCount > 0 && (
        <ModernBadge variant="neutral" size="sm">
          +{remainingCount} more
        </ModernBadge>
      )}
    </div>
  );
};

export {
  badgeVariants,
  badgeIconVariants,
  ModernBadge,
  StatusBadge,
  CountBadge,
  NotificationBadge,
  IconBadge,
  BadgeGroup,
};

export default ModernBadge;
