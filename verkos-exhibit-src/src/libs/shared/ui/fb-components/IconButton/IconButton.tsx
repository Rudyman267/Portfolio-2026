import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

export type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'pressedPrimary';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
  ariaLabel: string;
  disabled?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'secondary',
      size = 'md',
      className = '',
      ariaLabel,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'h-5 w-5 text-xs',
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-10 w-10',
    };

    const variantClasses = {
      primary:
        'bg-primary-200 hover:bg-primary-states-hover text-text-1 border border-outline-primary',
      secondary:
        'bg-background-level-2 hover:bg-surface-hover text-text-1 border-none',
      ghost:
        'bg-transparent hover:bg-surface-hover text-text-2 hover:text-text-1 border-none',
      pressedPrimary:
        'bg-secondary-200 text-text-1 border border-outline-primary',
    };

    return (
      <button
        type="button"
        aria-label={ariaLabel}
        ref={ref}
        className={`
          inline-flex items-center justify-center rounded-lg
          transition-colors
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${disabled ? '!opacity-50 !cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
