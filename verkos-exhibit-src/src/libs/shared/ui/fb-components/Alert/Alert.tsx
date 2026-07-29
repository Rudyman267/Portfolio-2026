import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 transition-all duration-200 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-surface border-outline-primary text-text-1',
        success:
          'bg-success-50 border-success-200 text-success-700 [&>svg]:text-success-600',
        warning:
          'bg-warning-50 border-warning-200 text-warning-700 [&>svg]:text-warning-600',
        error:
          'bg-error-50 border-error-200 text-error-700 [&>svg]:text-error-600',
        info: 'bg-info-50 border-info-200 text-info-700 [&>svg]:text-info-600',
        neutral:
          'bg-surface-hover border-outline-secondary text-text-1 [&>svg]:text-text-2',
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4 text-sm',
        lg: 'p-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const alertIconVariants = cva('flex items-center justify-center shrink-0', {
  variants: {
    size: {
      sm: 'w-4 h-4 text-base',
      md: 'w-5 h-5 text-lg',
      lg: 'w-6 h-6 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const alertTitleVariants = cva('mb-1 font-medium leading-none tracking-tight', {
  variants: {
    size: {
      sm: 'fb-body-4 text-sm',
      md: 'fb-body-2 text-base',
      lg: 'fb-body-1 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const alertDescriptionVariants = cva('text-sm [&_p]:leading-relaxed', {
  variants: {
    size: {
      sm: 'fb-body-4 text-xs',
      md: 'fb-body-4 text-sm',
      lg: 'fb-body-2 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Visual variant of the alert
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /**
   * Size of the alert
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Icon to display at the start of the alert
   */
  icon?: React.ReactNode;
  /**
   * Title of the alert
   */
  title?: string;
  /**
   * Description/content of the alert
   */
  description?: string;
  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean;
  /**
   * Callback when the alert is dismissed
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'default',
      size = 'md',
      icon,
      title,
      description,
      dismissible = false,
      onDismiss,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const getDefaultIcon = () => {
      switch (variant) {
        case 'success':
          return <i className="fa-solid fa-check-circle" />;
        case 'warning':
          return <i className="fa-solid fa-exclamation-triangle" />;
        case 'error':
          return <i className="fa-solid fa-times-circle" />;
        case 'info':
          return <i className="fa-solid fa-info-circle" />;
        default:
          return <i className="fa-solid fa-info-circle" />;
      }
    };

    const displayIcon = icon || getDefaultIcon();

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {displayIcon && (
          <div className={cn(alertIconVariants({ size }))}>{displayIcon}</div>
        )}
        <div className="flex-1">
          {title && <AlertTitle size={size}>{title}</AlertTitle>}
          {description && (
            <AlertDescription size={size}>{description}</AlertDescription>
          )}
          {children}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-surface-hover transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof alertTitleVariants> {
  /**
   * Size of the title
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(alertTitleVariants({ size }), className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertDescriptionVariants> {
  /**
   * Size of the description
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  AlertDescriptionProps
>(({ size = 'md', className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(alertDescriptionVariants({ size }), className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

/**
 * Success alert with predefined styling
 */
const SuccessAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => <Alert ref={ref} variant="success" {...props} />);
SuccessAlert.displayName = 'SuccessAlert';

/**
 * Warning alert with predefined styling
 */
const WarningAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => <Alert ref={ref} variant="warning" {...props} />);
WarningAlert.displayName = 'WarningAlert';

/**
 * Error alert with predefined styling
 */
const ErrorAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => <Alert ref={ref} variant="error" {...props} />);
ErrorAlert.displayName = 'ErrorAlert';

/**
 * Info alert with predefined styling
 */
const InfoAlert = React.forwardRef<HTMLDivElement, Omit<AlertProps, 'variant'>>(
  ({ ...props }, ref) => <Alert ref={ref} variant="info" {...props} />
);
InfoAlert.displayName = 'InfoAlert';

/**
 * Simple alert for basic use cases
 */
const SimpleAlert: React.FC<{
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
}> = ({ message, type = 'info', dismissible, onDismiss }) => (
  <Alert
    variant={type}
    description={message}
    dismissible={dismissible}
    onDismiss={onDismiss}
  />
);

export {
  Alert,
  AlertTitle,
  AlertDescription,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
  InfoAlert,
  SimpleAlert,
  alertVariants,
  alertIconVariants,
  alertTitleVariants,
  alertDescriptionVariants,
};

export default Alert;
