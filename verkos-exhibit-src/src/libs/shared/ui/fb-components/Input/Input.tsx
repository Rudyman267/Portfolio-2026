import React, { InputHTMLAttributes, useState, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled';
export type InputState = 'default' | 'error' | 'success';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  variant?: InputVariant;
  state?: InputState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
  prefix?: string;
  suffix?: string;
  onChangeValue?: (value: string) => void;
  inputBoxClasses?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      success,
      size = 'md',
      variant = 'default',
      state = 'default',
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      fullWidth = false,
      disabled = false,
      required = false,
      value,
      onChange,
      onChangeValue,
      prefix,
      suffix,
      id,
      inputBoxClasses = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId =
      id || `input-${Math.random().toString(36).substring(2, 11)}`;

    // Determine state based on props
    const effectiveState = error ? 'error' : success ? 'success' : state;

    // Handle change with value callback
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onChangeValue?.(e.target.value);
    };

    // Compute size-based classes
    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'h-8 text-xs px-2';
        case 'lg':
          return 'h-12 text-base px-4';
        case 'md':
        default:
          return 'h-10 text-sm px-3';
      }
    };

    // Compute state-based classes
    const getStateClasses = () => {
      // Base ring classes for focus state
      const focusClasses = isFocused ? 'ring-2 ring-primary-200' : '';

      switch (effectiveState) {
        case 'error':
          return `border-error-30 ${isFocused ? 'ring-2 ring-error-30' : ''}`;
        case 'success':
          return `border-success-30 ${
            isFocused ? 'ring-2 ring-success-30' : ''
          }`;
        case 'default':
        default:
          return `border-outline-primary hover:border-outline-primary ${focusClasses}`;
      }
    };

    // Compute variant-based classes
    const getVariantClasses = () => {
      switch (variant) {
        case 'filled':
          return 'bg-surface';
        case 'default':
        default:
          return 'bg-transparent';
      }
    };

    return (
      <div
        className={twMerge(
          'flex flex-col gap-1',
          fullWidth && 'w-full',
          containerClassName
        )}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={twMerge(
              'fb-body-4 text-text-1',
              disabled && 'text-text-disabled',
              required && 'after:content-["*"] after:ml-0.5 after:text-error-30'
            )}
          >
            {label}
          </label>
        )}

        <div
          className={twMerge(
            'relative flex items-center rounded-lg border transition-all',
            getVariantClasses(),
            getStateClasses(),
            disabled && 'opacity-50 cursor-not-allowed border-outline-disabled',
            fullWidth && 'w-full',
            inputBoxClasses
          )}
        >
          {leftIcon && (
            <div className="flex items-center justify-center ml-3 text-text-2">
              {leftIcon}
            </div>
          )}

          {prefix && (
            <div className="flex items-center px-1 text-text-2 fb-body2-regular">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              'outline-none w-full h-full fb-body2-regular bg-transparent text-text-1',
              getSizeClasses(),
              prefix && 'pl-0',
              suffix && 'pr-0',
              leftIcon && 'pl-1',
              rightIcon && 'pr-1',
              className
            )}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            {...props}
          />

          {suffix && (
            <div className="flex items-center px-1 text-text-2 fb-body2-regular">
              {suffix}
            </div>
          )}

          {rightIcon && (
            <div className="flex items-center justify-center mr-3 text-text-2">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Display appropriate helper text */}
        {error && <p className="fb-body-6 text-error-30 mt-0.5">{error}</p>}
        {!error && success && (
          <p className="fb-body-6 text-success-30 mt-0.5">{success}</p>
        )}
        {!error && !success && hint && (
          <p className="fb-body-6 text-text-2 mt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
