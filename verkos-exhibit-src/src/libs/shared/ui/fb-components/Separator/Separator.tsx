import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const separatorVariants = cva(
  // Base classes with FlytBase design tokens
  'shrink-0 bg-outline-primary',
  {
    variants: {
      orientation: {
        horizontal: 'h-px w-full',
        vertical: 'w-px h-full',
      },
      variant: {
        default: 'bg-outline-primary',
        secondary: 'bg-outline-secondary',
        tertiary: 'bg-outline-tertiary',
        muted: 'bg-outline-primary opacity-50',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        size: 'sm',
        class: 'h-px',
      },
      {
        orientation: 'horizontal',
        size: 'md',
        class: 'h-px',
      },
      {
        orientation: 'horizontal',
        size: 'lg',
        class: 'h-0.5',
      },
      {
        orientation: 'vertical',
        size: 'sm',
        class: 'w-px',
      },
      {
        orientation: 'vertical',
        size: 'md',
        class: 'w-px',
      },
      {
        orientation: 'vertical',
        size: 'lg',
        class: 'w-0.5',
      },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {
  /**
   * The orientation of the separator
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Visual variant of the separator
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'tertiary' | 'muted';
  /**
   * Size/thickness of the separator
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Separator component for creating visual divisions between content
 * using FlytBase design tokens and CVA for type-safe variant management
 */
const Separator: React.FC<SeparatorProps> = ({
  className,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  ...props
}) => {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        separatorVariants({ orientation, variant, size, className })
      )}
      {...props}
    />
  );
};

export { separatorVariants, Separator };
export default Separator;
