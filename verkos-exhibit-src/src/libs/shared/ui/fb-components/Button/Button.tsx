import React, { ButtonHTMLAttributes, ReactNode, memo } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'text'
  | 'number';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  textStyles?: string;
  deepClickEffect?: boolean;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled = false,
  textStyles = '',
  deepClickEffect = false,
  ...props
}) => {
  const sizeClasses = {
    xs: 'h-6 text-xs py-0 px-2 gap-1',
    sm: 'h-8 text-sm py-0 px-3 gap-1',
    md: 'h-10 text-base py-0 px-4 gap-2',
    lg: 'h-12 text-base py-0 px-5 gap-2',
  };

  const variantClasses = {
    primary: 'bg-primary-200 hover:bg-primary-states-hover text-text-1',
    secondary: 'bg-surface hover:bg-surface-hover text-text-1',
    outline:
      'bg-transparent hover:bg-surface-hover text-text-1 !border !border-outline-primary',
    text: 'bg-transparent text-primary-100 hover:text-primary-50 border-none',
    number:
      'p-1 w-8 h-8 flex items-center justify-center bg-surface text-text-1 hover:bg-surface-hover',
  };

  return (
    <button
      className={`
        inline-flex items-center rounded-lg
        transition-all duration-150 text-nowrap
        pb-[0.5px]
        border-t-[1px] border-t-others-outline-tertiary-bright
        ${variant === 'number' ? 'justify-center' : ''}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${fullWidth && (rightIcon || leftIcon) ? 'justify-between' : ''}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
        ${
          deepClickEffect && !disabled
            ? 'active:scale-95 active:shadow-inner'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {leftIcon && <span className="flex items-center">{leftIcon}</span>}
      <div
        className={`${
          variant === 'number' ? '' : 'truncate w-full'
        } ${textStyles} fb-body-2`}
      >
        {children}
      </div>
      {rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};

const Button = memo(ButtonComponent);
export default Button;
