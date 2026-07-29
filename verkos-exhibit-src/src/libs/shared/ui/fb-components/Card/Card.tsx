import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const cardVariants = cva(
  // Base classes with FlytBase design tokens
  'rounded-lg transition-all duration-150 fb-body-2',
  {
    variants: {
      variant: {
        default: 'bg-surface border border-outline-primary text-text-1',
        elevated: 'bg-surface shadow-lg border-none text-text-1',
        outlined: 'bg-transparent border-2 border-outline-primary text-text-1',
        flat: 'bg-surface-hover border-none text-text-1',
        ghost: 'bg-transparent border-none text-text-1',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-surface-hover',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'elevated',
        interactive: true,
        class: 'hover:shadow-xl active:scale-[0.98] hover:-translate-y-0.5',
      },
      {
        variant: 'outlined',
        interactive: true,
        class: 'hover:border-outline-secondary hover:bg-surface',
      },
      {
        variant: 'default',
        interactive: true,
        class: 'hover:border-outline-secondary',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Content to be rendered inside the card
   */
  children: React.ReactNode;
  /**
   * Whether the card should respond to hover/click interactions
   * @default false
   */
  interactive?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Card component that provides a flexible container with different styling variants
 * using FlytBase design tokens and CVA for type-safe variant management
 */
const Card: React.FC<CardProps> = ({
  className,
  variant,
  size,
  interactive = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(cardVariants({ variant, size, interactive, className }))}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, cardVariants };
export default Card;
