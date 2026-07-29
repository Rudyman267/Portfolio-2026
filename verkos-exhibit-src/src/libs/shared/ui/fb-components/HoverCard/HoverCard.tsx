import React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const hoverCardContentVariants = cva(
  'z-50 rounded-md border bg-surface text-text-1 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      size: {
        sm: 'w-48 p-3',
        md: 'w-64 p-4',
        lg: 'w-80 p-5',
        xl: 'w-96 p-6',
      },
      variant: {
        default: 'border-outline-primary bg-surface',
        outline: 'border-outline-primary bg-surface',
        ghost: 'border-outline-tertiary bg-surface-hover shadow-sm',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

// Root components (re-export Radix primitives)
const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

// HoverCard Content component
export interface HoverCardContentProps
  extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>,
    VariantProps<typeof hoverCardContentVariants> {
  /**
   * Size of the hover card
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Visual variant of the hover card
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Alignment of the hover card
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Offset from the trigger element
   * @default 4
   */
  sideOffset?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  HoverCardContentProps
>(
  (
    {
      size = 'md',
      variant = 'default',
      align = 'center',
      sideOffset = 4,
      className,
      ...props
    },
    ref
  ) => (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(hoverCardContentVariants({ size, variant }), className)}
      {...props}
    />
  )
);
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

// Simple HoverCard component
export interface SimpleHoverCardProps {
  /**
   * Trigger element
   */
  trigger: React.ReactNode;
  /**
   * Content to display in the hover card
   */
  children: React.ReactNode;
  /**
   * Size of the hover card
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Visual variant of the hover card
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Alignment of the hover card
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Side of the trigger where the card appears
   * @default 'bottom'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Offset from the trigger element
   * @default 4
   */
  sideOffset?: number;
  /**
   * Delay before showing the hover card
   * @default 700
   */
  openDelay?: number;
  /**
   * Delay before hiding the hover card
   * @default 300
   */
  closeDelay?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleHoverCard: React.FC<SimpleHoverCardProps> = ({
  trigger,
  children,
  size = 'md',
  variant = 'default',
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  openDelay = 700,
  closeDelay = 300,
  className,
}) => {
  return (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent
        size={size}
        variant={variant}
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={className}
      >
        {children}
      </HoverCardContent>
    </HoverCard>
  );
};

// User Profile HoverCard component
export interface UserProfileHoverCardProps {
  /**
   * Trigger element
   */
  trigger: React.ReactNode;
  /**
   * User data
   */
  user: {
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    joinDate?: string;
    stats?: {
      followers?: number;
      following?: number;
      posts?: number;
    };
  };
  /**
   * Size of the hover card
   * @default 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const UserProfileHoverCard: React.FC<UserProfileHoverCardProps> = ({
  trigger,
  user,
  size = 'lg',
  className,
}) => {
  return (
    <SimpleHoverCard trigger={trigger} size={size} className={className}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-surface-hover flex items-center justify-center">
              <span className="text-lg font-medium text-text-1">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-text-1 truncate fb-body-2">
              {user.name}
            </h3>
            {user.username && (
              <span className="text-xs text-text-3 fb-body-4">
                @{user.username}
              </span>
            )}
          </div>
          {user.bio && (
            <p className="text-xs text-text-2 mt-1 fb-body-4">{user.bio}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-text-3">
            {user.location && (
              <span className="flex items-center space-x-1">
                <i className="fa-solid fa-map-marker-alt" />
                <span>{user.location}</span>
              </span>
            )}
            {user.joinDate && (
              <span className="flex items-center space-x-1">
                <i className="fa-solid fa-calendar" />
                <span>{user.joinDate}</span>
              </span>
            )}
          </div>
          {user.stats && (
            <div className="flex items-center space-x-4 mt-2 text-xs text-text-2">
              {user.stats.followers !== undefined && (
                <span>
                  <strong className="text-text-1">
                    {user.stats.followers}
                  </strong>{' '}
                  followers
                </span>
              )}
              {user.stats.following !== undefined && (
                <span>
                  <strong className="text-text-1">
                    {user.stats.following}
                  </strong>{' '}
                  following
                </span>
              )}
              {user.stats.posts !== undefined && (
                <span>
                  <strong className="text-text-1">{user.stats.posts}</strong>{' '}
                  posts
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </SimpleHoverCard>
  );
};

export { hoverCardContentVariants };

export {
  HoverCard,
  SimpleHoverCard,
  UserProfileHoverCard,
  HoverCardTrigger,
  HoverCardContent,
};

export default HoverCard;
