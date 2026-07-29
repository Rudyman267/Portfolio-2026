import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden border-2 transition-all duration-200',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
      variant: {
        default: 'rounded-full border-outline-primary',
        square: 'rounded-md border-outline-primary',
        rounded: 'rounded-lg border-outline-primary',
      },
      status: {
        none: '',
        online: 'ring-2 ring-success-500 ring-offset-2 ring-offset-surface',
        offline: 'ring-2 ring-error-500 ring-offset-2 ring-offset-surface',
        away: 'ring-2 ring-warning-500 ring-offset-2 ring-offset-surface',
        busy: 'ring-2 ring-error-600 ring-offset-2 ring-offset-surface',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      status: 'none',
    },
  }
);

const avatarFallbackVariants = cva(
  'flex h-full w-full items-center justify-center text-text-1 font-medium fb-body-2',
  {
    variants: {
      size: {
        xs: 'fb-body-4 text-xs',
        sm: 'fb-body-4 text-sm',
        md: 'fb-body-2 text-base',
        lg: 'fb-body-1 text-lg',
        xl: 'fb-heading-4 text-xl',
        '2xl': 'fb-heading-3 text-2xl',
      },
      variant: {
        default: 'rounded-full bg-surface-hover',
        square: 'rounded-md bg-surface-hover',
        rounded: 'rounded-lg bg-surface-hover',
      },
      color: {
        default: 'bg-surface-hover text-text-1',
        primary: 'bg-primary-100 text-primary-700',
        secondary: 'bg-secondary-100 text-secondary-700',
        success: 'bg-success-100 text-success-700',
        warning: 'bg-warning-100 text-warning-700',
        error: 'bg-error-100 text-error-700',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      color: 'default',
    },
  }
);

// Root Avatar component
export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /**
   * Size of the avatar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Shape variant of the avatar
   * @default 'default'
   */
  variant?: 'default' | 'square' | 'rounded';
  /**
   * Status indicator around the avatar
   * @default 'none'
   */
  status?: 'none' | 'online' | 'offline' | 'away' | 'busy';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(
  (
    { size = 'md', variant = 'default', status = 'none', className, ...props },
    ref
  ) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, variant, status }), className)}
      {...props}
    />
  )
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

// Avatar Image component
export interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// Avatar Fallback component
export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {
  /**
   * Size of the fallback text
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Shape variant of the fallback
   * @default 'default'
   */
  variant?: 'default' | 'square' | 'rounded';
  /**
   * Color variant of the fallback
   * @default 'default'
   */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(
  (
    {
      size = 'md',
      variant = 'default',
      color = 'default',
      className,
      ...props
    },
    ref
  ) => (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        avatarFallbackVariants({ size, variant, color }),
        className
      )}
      {...props}
    />
  )
);
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Combined Avatar component for convenience
export interface SimpleAvatarProps {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alt text for the image
   */
  alt?: string;
  /**
   * Fallback text (usually initials)
   */
  fallback: string;
  /**
   * Size of the avatar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Shape variant of the avatar
   * @default 'default'
   */
  variant?: 'default' | 'square' | 'rounded';
  /**
   * Status indicator around the avatar
   * @default 'none'
   */
  status?: 'none' | 'online' | 'offline' | 'away' | 'busy';
  /**
   * Color variant of the fallback
   * @default 'default'
   */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  variant = 'default',
  status = 'none',
  color = 'default',
  className,
}) => (
  <Avatar size={size} variant={variant} status={status} className={className}>
    {src && <AvatarImage src={src} alt={alt} />}
    <AvatarFallback size={size} variant={variant} color={color}>
      {fallback}
    </AvatarFallback>
  </Avatar>
);

/**
 * User avatar with user data
 */
export interface UserAvatarProps {
  /**
   * User object with name and optional image
   */
  user: {
    name: string;
    image?: string;
    email: string;
  };
  /**
   * Size of the avatar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Shape variant of the avatar
   * @default 'default'
   */
  variant?: 'default' | 'square' | 'rounded';
  /**
   * Status indicator around the avatar
   * @default 'none'
   */
  status?: 'none' | 'online' | 'offline' | 'away' | 'busy';
  /**
   * Whether to show initials or first letter only
   * @default false
   */
  showInitials?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  variant = 'default',
  status = 'none',
  showInitials = false,
  className,
}) => {
  const getInitials = (name: string) => {
    if (!showInitials) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name: string) => {
    const colors: Array<
      'primary' | 'secondary' | 'success' | 'warning' | 'error'
    > = ['primary', 'secondary', 'success', 'warning', 'error'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <SimpleAvatar
      src={user.image}
      alt={user.name}
      fallback={getInitials(user.name)}
      size={size}
      variant={variant}
      status={status}
      color={getColorFromName(user.name)}
      className={className}
    />
  );
};

/**
 * Avatar group for multiple avatars
 */
export interface AvatarGroupProps {
  /**
   * Array of avatar data
   */
  avatars: Array<{
    src?: string;
    alt?: string;
    fallback: string;
    id: string;
  }>;
  /**
   * Maximum number of avatars to display
   * @default 3
   */
  max?: number;
  /**
   * Size of the avatars
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Shape variant of the avatars
   * @default 'default'
   */
  variant?: 'default' | 'square' | 'rounded';
  /**
   * Spacing between avatars
   * @default 'normal'
   */
  spacing?: 'tight' | 'normal' | 'loose';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
  variant = 'default',
  spacing = 'normal',
  className,
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-3',
  };

  return (
    <div
      className={cn('flex items-center', spacingClasses[spacing], className)}
    >
      {displayAvatars.map((avatar, index) => (
        <SimpleAvatar
          key={avatar.id}
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size={size}
          variant={variant}
          className={cn('ring-2 ring-surface', index > 0 && 'ml-0')}
        />
      ))}
      {remainingCount > 0 && (
        <SimpleAvatar
          fallback={`+${remainingCount}`}
          size={size}
          variant={variant}
          color="default"
          className="ring-2 ring-surface"
        />
      )}
    </div>
  );
};

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  SimpleAvatar,
  UserAvatar,
  AvatarGroup,
  avatarVariants,
  avatarFallbackVariants,
};

export default Avatar;
