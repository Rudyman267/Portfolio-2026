import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const skeletonVariants = cva(
  // Base classes with FlytBase design tokens and animation
  'animate-pulse rounded-md bg-background-level-3',
  {
    variants: {
      variant: {
        default: 'bg-background-level-3',
        light: 'bg-background-level-2',
        dark: 'bg-background-level-4',
        text: 'bg-background-level-3 h-4',
        avatar: 'bg-background-level-3 rounded-full',
        button: 'bg-background-level-3 rounded-lg',
      },
      size: {
        xs: 'h-2',
        sm: 'h-3',
        md: 'h-4',
        lg: 'h-6',
        xl: 'h-8',
        '2xl': 'h-12',
        '3xl': 'h-16',
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
        '1/2': 'w-1/2',
        '1/3': 'w-1/3',
        '2/3': 'w-2/3',
        '1/4': 'w-1/4',
        '3/4': 'w-3/4',
      },
      speed: {
        slow: 'animate-pulse [animation-duration:2s]',
        normal: 'animate-pulse',
        fast: 'animate-pulse [animation-duration:1s]',
      },
    },
    compoundVariants: [
      {
        variant: 'text',
        size: 'xs',
        class: 'h-3',
      },
      {
        variant: 'text',
        size: 'sm',
        class: 'h-3.5',
      },
      {
        variant: 'text',
        size: 'md',
        class: 'h-4',
      },
      {
        variant: 'text',
        size: 'lg',
        class: 'h-5',
      },
      {
        variant: 'text',
        size: 'xl',
        class: 'h-6',
      },
      {
        variant: 'avatar',
        size: 'sm',
        class: 'w-8 h-8',
      },
      {
        variant: 'avatar',
        size: 'md',
        class: 'w-10 h-10',
      },
      {
        variant: 'avatar',
        size: 'lg',
        class: 'w-12 h-12',
      },
      {
        variant: 'avatar',
        size: 'xl',
        class: 'w-16 h-16',
      },
      {
        variant: 'button',
        size: 'sm',
        class: 'h-8 w-20',
      },
      {
        variant: 'button',
        size: 'md',
        class: 'h-10 w-24',
      },
      {
        variant: 'button',
        size: 'lg',
        class: 'h-12 w-28',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      width: 'full',
      speed: 'normal',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Visual variant of the skeleton
   * @default 'default'
   */
  variant?: 'default' | 'light' | 'dark' | 'text' | 'avatar' | 'button';
  /**
   * Height size of the skeleton
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /**
   * Width of the skeleton
   * @default 'full'
   */
  width?: 'auto' | 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
  /**
   * Animation speed
   * @default 'normal'
   */
  speed?: 'slow' | 'normal' | 'fast';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Skeleton component for loading states using FlytBase design tokens
 * and CVA for type-safe variant management
 */
const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  size = 'md',
  width = 'full',
  speed = 'normal',
  ...props
}) => {
  return (
    <div
      className={cn(
        skeletonVariants({ variant, size, width, speed, className })
      )}
      {...props}
    />
  );
};

/**
 * Pre-composed skeleton components for common use cases
 */
const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="text" {...props} />
);

const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="avatar" {...props} />
);

const SkeletonButton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="button" {...props} />
);

export {
  skeletonVariants,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
};

export default Skeleton;
