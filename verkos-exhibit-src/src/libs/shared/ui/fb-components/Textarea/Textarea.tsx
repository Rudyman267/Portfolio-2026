import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const textareaVariants = cva(
  // Base classes with FlytBase design tokens
  'flex min-h-[80px] w-full rounded-lg border bg-background-level-1 px-3 py-2 fb-body-2 ring-offset-background placeholder:text-text-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-all duration-150',
  {
    variants: {
      variant: {
        default:
          'border-outline-primary focus-visible:ring-primary-200 focus-visible:border-primary-200',
        error:
          'border-error-30 focus-visible:ring-error-30 focus-visible:border-error-30',
        success:
          'border-success-30 focus-visible:ring-success-30 focus-visible:border-success-30',
        warning:
          'border-warning-30 focus-visible:ring-warning-30 focus-visible:border-warning-30',
      },
      size: {
        sm: 'min-h-[60px] px-2 py-1.5 fb-body-4',
        md: 'min-h-[80px] px-3 py-2 fb-body-2',
        lg: 'min-h-[120px] px-4 py-3 fb-body-1',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      resize: 'vertical',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /**
   * Visual variant of the textarea
   * @default 'default'
   */
  variant?: 'default' | 'error' | 'success' | 'warning';
  /**
   * Size of the textarea
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Resize behavior
   * @default 'vertical'
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /**
   * Label for the textarea
   */
  label?: string;
  /**
   * Helper text to display below the textarea
   */
  helperText?: string;
  /**
   * Error text to display below the textarea
   */
  errorText?: string;
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;
  /**
   * Character count limit
   */
  maxLength?: number;
  /**
   * Whether to show character count
   * @default false
   */
  showCharCount?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Textarea component for multi-line text input using FlytBase design tokens
 * and CVA for type-safe variant management
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      resize = 'vertical',
      label,
      helperText,
      errorText,
      required = false,
      maxLength,
      showCharCount = false,
      value,
      ...props
    },
    ref
  ) => {
    // Use errorText to determine if we should show error variant
    const effectiveVariant = errorText ? 'error' : variant;

    // Calculate character count
    const currentLength = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength ? currentLength > maxLength : false;

    return (
      <div className="space-y-2">
        {label && (
          <label
            className={cn(
              'fb-body-4 font-medium text-text-1',
              required && "after:content-['*'] after:text-error-30 after:ml-1"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({
                variant: effectiveVariant,
                size,
                resize,
                className,
              })
            )}
            ref={ref}
            value={value}
            maxLength={maxLength}
            {...props}
          />

          {showCharCount && maxLength && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <span
                className={cn(
                  'fb-tiny-2',
                  isOverLimit ? 'text-error-30' : 'text-text-3'
                )}
              >
                {currentLength}/{maxLength}
              </span>
            </div>
          )}
        </div>

        {(helperText || errorText) && (
          <div className="space-y-1">
            {errorText && (
              <p className="fb-tiny-1 text-error-30 flex items-center gap-1">
                <i className="fa-solid fa-triangle-exclamation text-xs" />
                {errorText}
              </p>
            )}

            {helperText && !errorText && (
              <p className="fb-tiny-1 text-text-3">{helperText}</p>
            )}

            {showCharCount && !maxLength && (
              <p className="fb-tiny-2 text-text-3">
                {currentLength} characters
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Simple textarea component without wrapper for basic use cases
 */
const SimpleTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaProps, 'label' | 'helperText' | 'errorText' | 'showCharCount'>
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      resize = 'vertical',
      ...props
    },
    ref
  ) => (
    <textarea
      className={cn(textareaVariants({ variant, size, resize, className }))}
      ref={ref}
      {...props}
    />
  )
);

SimpleTextarea.displayName = 'SimpleTextarea';

export { textareaVariants, Textarea, SimpleTextarea };
export default Textarea;
