import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const inputVariants = cva(
  'flex w-full rounded-md border px-3 py-2 fb-body-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-outline-primary bg-surface text-text-1 focus-visible:ring-primary-200',
        outline:
          'border-outline-secondary bg-surface text-text-1 focus-visible:ring-primary-200',
        filled:
          'border-outline-primary bg-surface-hover text-text-1 focus-visible:ring-primary-200',
        ghost:
          'border-transparent bg-transparent text-text-1 hover:bg-surface-hover focus-visible:ring-primary-200',
        underlined:
          'border-0 border-b-2 border-outline-primary bg-transparent text-text-1 rounded-none focus-visible:ring-0 focus-visible:border-primary-500',
      },
      size: {
        sm: 'h-8 px-2 text-sm fb-body-4',
        md: 'h-10 px-3 text-sm fb-body-2',
        lg: 'h-12 px-4 text-base fb-body-1',
      },
      state: {
        default: '',
        error: 'border-error-300 focus-visible:ring-error-200',
        success: 'border-success-300 focus-visible:ring-success-200',
        warning: 'border-warning-300 focus-visible:ring-warning-200',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

const inputWrapperVariants = cva('relative flex items-center', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const inputLabelVariants = cva('block font-medium text-text-1 fb-body-2 mb-1', {
  variants: {
    size: {
      sm: 'text-sm fb-body-4',
      md: 'text-sm fb-body-2',
      lg: 'text-base fb-body-1',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const inputDescriptionVariants = cva('mt-1 text-text-2', {
  variants: {
    size: {
      sm: 'text-xs fb-body-4',
      md: 'text-sm fb-body-4',
      lg: 'text-sm fb-body-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const inputIconVariants = cva('flex items-center justify-center text-text-3', {
  variants: {
    size: {
      sm: 'w-4 h-4 text-xs',
      md: 'w-5 h-5 text-sm',
      lg: 'w-6 h-6 text-base',
    },
    position: {
      start: 'ml-3',
      end: 'mr-3',
    },
  },
  defaultVariants: {
    size: 'md',
    position: 'start',
  },
});

export interface ModernInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Visual variant of the input
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled' | 'ghost' | 'underlined';
  /**
   * Size of the input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * State of the input
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success' | 'warning';
  /**
   * Label text for the input
   */
  label?: string;
  /**
   * Description text below the input
   */
  description?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Success message to display
   */
  success?: string;
  /**
   * Warning message to display
   */
  warning?: string;
  /**
   * Icon to display at the start of the input
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the input
   */
  endIcon?: React.ReactNode;
  /**
   * Prefix text to display before the input
   */
  prefix?: string;
  /**
   * Suffix text to display after the input
   */
  suffix?: string;
  /**
   * Additional CSS classes for the wrapper
   */
  wrapperClassName?: string;
  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;
  /**
   * Whether the input is required
   */
  required?: boolean;
  /**
   * Whether the input should take full width
   */
  fullWidth?: boolean;
}

const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      state = 'default',
      label,
      description,
      error,
      success,
      warning,
      startIcon,
      endIcon,
      prefix,
      suffix,
      wrapperClassName,
      labelClassName,
      required = false,
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine the actual state based on messages
    const actualState = error
      ? 'error'
      : success
      ? 'success'
      : warning
      ? 'warning'
      : state;

    // Get the appropriate message
    const message = error || success || warning || description;
    const messageType = error
      ? 'error'
      : success
      ? 'success'
      : warning
      ? 'warning'
      : 'default';

    return (
      <div
        className={cn('flex flex-col', fullWidth && 'w-full', wrapperClassName)}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              inputLabelVariants({ size }),
              required &&
                'after:content-["*"] after:ml-0.5 after:text-error-500',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <div className={cn(inputWrapperVariants({ size }))}>
          {startIcon && (
            <div className={cn(inputIconVariants({ size, position: 'start' }))}>
              {startIcon}
            </div>
          )}

          {prefix && (
            <div className="flex items-center px-2 text-text-2 fb-body-2 border-r border-outline-primary">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant, size, state: actualState }),
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              prefix && 'pl-2 border-l-0 rounded-l-none',
              suffix && 'pr-2 border-r-0 rounded-r-none',
              className
            )}
            {...props}
          />

          {suffix && (
            <div className="flex items-center px-2 text-text-2 fb-body-2 border-l border-outline-primary">
              {suffix}
            </div>
          )}

          {endIcon && (
            <div className={cn(inputIconVariants({ size, position: 'end' }))}>
              {endIcon}
            </div>
          )}
        </div>

        {message && (
          <p
            className={cn(
              inputDescriptionVariants({ size }),
              messageType === 'error' && 'text-error-500',
              messageType === 'success' && 'text-success-500',
              messageType === 'warning' && 'text-warning-500'
            )}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);
ModernInput.displayName = 'ModernInput';

// Simple Input component without wrapper
const SimpleInput = React.forwardRef<
  HTMLInputElement,
  Omit<
    ModernInputProps,
    | 'label'
    | 'description'
    | 'error'
    | 'success'
    | 'warning'
    | 'wrapperClassName'
    | 'labelClassName'
  >
>(
  (
    {
      variant,
      size,
      state,
      startIcon,
      endIcon,
      prefix,
      suffix,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        className={cn(
          inputVariants({
            variant,
            size,
            state,
          }),
          className
        )}
        {...props}
      />
    );
  }
);
SimpleInput.displayName = 'SimpleInput';

// Input with floating label
export interface FloatingLabelInputProps extends ModernInputProps {
  /**
   * Label text for the floating label
   */
  label: string;
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      label,
      variant,
      size,
      state,
      startIcon,
      endIcon,
      prefix,
      suffix,
      className,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== '');
      onBlur?.(e);
    };

    const isFloated = isFocused || hasValue;

    return (
      <div className="relative">
        <input
          ref={ref}
          className={cn(
            inputVariants({
              variant,
              size,
              state,
            }),
            'pt-6 pb-2',
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <label
          className={cn(
            'absolute left-3 transition-all duration-200 pointer-events-none',
            isFloated
              ? 'top-1 text-xs text-text-3 fb-body-4'
              : 'top-1/2 -translate-y-1/2 text-text-2 fb-body-2'
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingLabelInput.displayName = 'FloatingLabelInput';

export {
  inputVariants,
  inputWrapperVariants,
  inputLabelVariants,
  inputDescriptionVariants,
  inputIconVariants,
  ModernInput,
  SimpleInput,
  FloatingLabelInput,
};

export default ModernInput;
