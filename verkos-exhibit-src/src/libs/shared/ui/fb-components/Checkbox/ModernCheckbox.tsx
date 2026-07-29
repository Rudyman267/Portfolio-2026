import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const checkboxVariants = cva(
  'peer shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150',
  {
    variants: {
      variant: {
        default:
          'border-outline-primary text-primary-foreground data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500 data-[state=indeterminate]:bg-primary-500 data-[state=indeterminate]:border-primary-500 hover:border-primary-300',
        secondary:
          'border-outline-primary text-secondary-foreground data-[state=checked]:bg-secondary-500 data-[state=checked]:border-secondary-500 data-[state=indeterminate]:bg-secondary-500 data-[state=indeterminate]:border-secondary-500 hover:border-secondary-300',
        success:
          'border-outline-primary text-success-foreground data-[state=checked]:bg-success-500 data-[state=checked]:border-success-500 data-[state=indeterminate]:bg-success-500 data-[state=indeterminate]:border-success-500 hover:border-success-300',
        warning:
          'border-outline-primary text-warning-foreground data-[state=checked]:bg-warning-500 data-[state=checked]:border-warning-500 data-[state=indeterminate]:bg-warning-500 data-[state=indeterminate]:border-warning-500 hover:border-warning-300',
        error:
          'border-outline-primary text-error-foreground data-[state=checked]:bg-error-500 data-[state=checked]:border-error-500 data-[state=indeterminate]:bg-error-500 data-[state=indeterminate]:border-error-500 hover:border-error-300',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const checkboxIndicatorVariants = cva(
  'flex items-center justify-center text-current',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const checkboxLabelVariants = cva(
  'fb-body-2 text-text-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      size: {
        sm: 'fb-body-4 text-sm',
        md: 'fb-body-2 text-sm',
        lg: 'fb-body-1 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ModernCheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /**
   * Visual variant of the checkbox
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  /**
   * Size of the checkbox
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Label text for the checkbox
   */
  label?: string;
  /**
   * Description text below the label
   */
  description?: string;
  /**
   * Whether the checkbox is in an error state
   */
  error?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;
}

const ModernCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  ModernCheckboxProps
>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      description,
      error,
      errorMessage,
      className,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const actualVariant = error ? 'error' : variant;

    return (
      <div className="flex items-start space-x-2">
        <CheckboxPrimitive.Root
          ref={ref}
          className={cn(
            checkboxVariants({ variant: actualVariant, size }),
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            className={cn(checkboxIndicatorVariants({ size }))}
          >
            <i className="fa-solid fa-check" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {(label || description) && (
          <div className="grid gap-1.5 leading-none">
            {label && (
              <label
                htmlFor={props.id}
                className={cn(checkboxLabelVariants({ size }), labelClassName)}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-text-2 fb-body-4">{description}</p>
            )}
            {error && errorMessage && (
              <p className="text-sm text-error-500 fb-body-4">{errorMessage}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
ModernCheckbox.displayName = CheckboxPrimitive.Root.displayName;

// Labeled Checkbox component
export interface LabeledCheckboxProps extends ModernCheckboxProps {
  /**
   * Label text for the checkbox (required)
   */
  label: string;
}

const LabeledCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  LabeledCheckboxProps
>(({ label, ...props }, ref) => {
  return <ModernCheckbox ref={ref} label={label} {...props} />;
});
LabeledCheckbox.displayName = 'LabeledCheckbox';

// Checkbox Group component
export interface CheckboxGroupProps {
  /**
   * Array of checkbox options
   */
  options: Array<{
    id: string;
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
  }>;
  /**
   * Array of selected values
   */
  value?: string[];
  /**
   * Callback when selection changes
   */
  onChange?: (values: string[]) => void;
  /**
   * Visual variant for all checkboxes
   * @default 'default'
   */
  variant?: ModernCheckboxProps['variant'];
  /**
   * Size for all checkboxes
   * @default 'md'
   */
  size?: ModernCheckboxProps['size'];
  /**
   * Group label
   */
  label?: string;
  /**
   * Group description
   */
  description?: string;
  /**
   * Whether the group is disabled
   */
  disabled?: boolean;
  /**
   * Whether the group is in an error state
   */
  error?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Layout direction
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  value = [],
  onChange,
  variant = 'default',
  size = 'md',
  label,
  description,
  disabled,
  error,
  errorMessage,
  orientation = 'vertical',
  className,
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (!onChange) return;

    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="fb-body-2 text-text-1 font-medium">{label}</label>
      )}
      {description && (
        <p className="text-sm text-text-2 fb-body-4">{description}</p>
      )}
      <div
        className={cn(
          'space-y-2',
          orientation === 'horizontal' && 'flex space-x-4 space-y-0'
        )}
      >
        {options.map((option) => (
          <ModernCheckbox
            key={option.id}
            id={option.id}
            variant={variant}
            size={size}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            disabled={disabled || option.disabled}
            error={error}
            onCheckedChange={(checked) =>
              handleChange(option.value, checked as boolean)
            }
          />
        ))}
      </div>
      {error && errorMessage && (
        <p className="text-sm text-error-500 fb-body-4">{errorMessage}</p>
      )}
    </div>
  );
};

export {
  checkboxVariants,
  checkboxIndicatorVariants,
  checkboxLabelVariants,
  ModernCheckbox,
  LabeledCheckbox,
  CheckboxGroup,
};

export default ModernCheckbox;
