import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const labelVariants = cva(
  // Base classes with FlytBase design tokens
  'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-text-1',
        secondary: 'text-text-2',
        muted: 'text-text-3',
        success: 'text-success-30',
        error: 'text-error-30',
        warning: 'text-warning-30',
        info: 'text-info-30',
      },
      size: {
        xs: 'fb-tiny-2',
        sm: 'fb-tiny-1',
        md: 'fb-body-4',
        lg: 'fb-body-2',
        xl: 'fb-body-1',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
      },
      required: {
        true: "after:content-['*'] after:text-error-30 after:ml-1",
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      weight: 'medium',
      required: false,
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /**
   * Content to be rendered inside the label
   */
  children: React.ReactNode;
  /**
   * Visual variant of the label
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'secondary'
    | 'muted'
    | 'success'
    | 'error'
    | 'warning'
    | 'info';
  /**
   * Size/typography scale of the label
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Font weight of the label
   * @default 'medium'
   */
  weight?: 'normal' | 'medium' | 'semibold';
  /**
   * Whether to show required asterisk
   * @default false
   */
  required?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Help text to display below the label
   */
  helpText?: string;
  /**
   * Error text to display below the label
   */
  errorText?: string;
}

/**
 * Label component for form inputs using FlytBase design tokens
 * and CVA for type-safe variant management
 */
const Label: React.FC<LabelProps> = ({
  className,
  variant = 'default',
  size = 'md',
  weight = 'medium',
  required = false,
  children,
  helpText,
  errorText,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label
        className={cn(
          labelVariants({ variant, size, weight, required, className })
        )}
        {...props}
      >
        {children}
      </label>

      {helpText && !errorText && (
        <p className="fb-tiny-1 text-text-3">{helpText}</p>
      )}

      {errorText && (
        <p className="fb-tiny-1 text-error-30 flex items-center gap-1">
          <i className="fa-solid fa-triangle-exclamation text-xs" />
          {errorText}
        </p>
      )}
    </div>
  );
};

/**
 * Simple label component without wrapper div for basic use cases
 */
const SimpleLabel: React.FC<Omit<LabelProps, 'helpText' | 'errorText'>> = ({
  className,
  variant = 'default',
  size = 'md',
  weight = 'medium',
  required = false,
  children,
  ...props
}) => {
  return (
    <label
      className={cn(
        labelVariants({ variant, size, weight, required, className })
      )}
      {...props}
    >
      {children}
    </label>
  );
};

export { Label, SimpleLabel, labelVariants };
export default Label;
