import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const alertDialogOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  {
    variants: {
      blur: {
        none: 'backdrop-blur-none',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
      },
    },
    defaultVariants: {
      blur: 'none',
    },
  }
);

const alertDialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-surface shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm p-4',
        md: 'max-w-md p-6',
        lg: 'max-w-lg p-6',
        xl: 'max-w-xl p-8',
        '2xl': 'max-w-2xl p-8',
      },
      variant: {
        default: 'border-outline-primary bg-surface text-text-1',
        destructive: 'border-error-200 bg-error-50 text-error-900',
        warning: 'border-warning-200 bg-warning-50 text-warning-900',
        success: 'border-success-200 bg-success-50 text-success-900',
        info: 'border-info-200 bg-info-50 text-info-900',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const alertDialogHeaderVariants = cva(
  'flex flex-col space-y-2 text-center sm:text-left',
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        warning: '',
        success: '',
        info: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const alertDialogFooterVariants = cva(
  'flex flex-col-reverse sm:flex-row sm:justify-end',
  {
    variants: {
      size: {
        sm: 'sm:space-x-1',
        md: 'sm:space-x-2',
        lg: 'sm:space-x-2',
        xl: 'sm:space-x-3',
        '2xl': 'sm:space-x-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const alertDialogTitleVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-text-1',
      destructive: 'text-error-900',
      warning: 'text-warning-900',
      success: 'text-success-900',
      info: 'text-info-900',
    },
    size: {
      sm: 'text-lg fb-heading-4',
      md: 'text-lg fb-heading-4',
      lg: 'text-xl fb-heading-3',
      xl: 'text-xl fb-heading-3',
      '2xl': 'text-2xl fb-heading-2',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const alertDialogDescriptionVariants = cva('', {
  variants: {
    variant: {
      default: 'text-text-2',
      destructive: 'text-error-700',
      warning: 'text-warning-700',
      success: 'text-success-700',
      info: 'text-info-700',
    },
    size: {
      sm: 'text-sm fb-body-4',
      md: 'text-sm fb-body-2',
      lg: 'text-base fb-body-1',
      xl: 'text-base fb-body-1',
      '2xl': 'text-lg fb-body-1',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const alertDialogActionVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600',
        destructive: 'bg-error-500 text-white hover:bg-error-600',
        warning: 'bg-warning-500 text-white hover:bg-warning-600',
        success: 'bg-success-500 text-white hover:bg-success-600',
        info: 'bg-info-500 text-white hover:bg-info-600',
      },
      size: {
        sm: 'h-8 px-3 text-xs fb-body-4',
        md: 'h-9 px-4 text-sm fb-body-2',
        lg: 'h-10 px-6 text-base fb-body-1',
        xl: 'h-11 px-8 text-base fb-body-1',
        '2xl': 'h-12 px-10 text-lg fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const alertDialogCancelVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-outline-primary bg-transparent hover:bg-surface-hover hover:text-text-1 mt-2 sm:mt-0',
  {
    variants: {
      variant: {
        default: 'text-text-2 border-outline-primary hover:bg-surface-hover',
        destructive: 'text-error-600 border-error-300 hover:bg-error-50',
        warning: 'text-warning-600 border-warning-300 hover:bg-warning-50',
        success: 'text-success-600 border-success-300 hover:bg-success-50',
        info: 'text-info-600 border-info-300 hover:bg-info-50',
      },
      size: {
        sm: 'h-8 px-3 text-xs fb-body-4',
        md: 'h-9 px-4 text-sm fb-body-2',
        lg: 'h-10 px-6 text-base fb-body-1',
        xl: 'h-11 px-8 text-base fb-body-1',
        '2xl': 'h-12 px-10 text-lg fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Root components (re-export Radix primitives)
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

// Overlay component
export interface AlertDialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>,
    VariantProps<typeof alertDialogOverlayVariants> {
  /**
   * Backdrop blur effect
   * @default 'none'
   */
  blur?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  AlertDialogOverlayProps
>(({ blur = 'none', className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(alertDialogOverlayVariants({ blur }), className)}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

// Content component
export interface AlertDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
    VariantProps<typeof alertDialogContentVariants> {
  /**
   * Size of the alert dialog
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Visual variant of the alert dialog
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Backdrop blur effect
   * @default 'none'
   */
  blur?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(
  (
    { size = 'md', variant = 'default', blur = 'none', className, ...props },
    ref
  ) => (
    <AlertDialogPortal>
      <AlertDialogOverlay blur={blur} />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(alertDialogContentVariants({ size, variant }), className)}
        {...props}
      />
    </AlertDialogPortal>
  )
);
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

// Header component
export interface AlertDialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertDialogHeaderVariants> {
  /**
   * Visual variant of the header
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  AlertDialogHeaderProps
>(({ variant = 'default', className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(alertDialogHeaderVariants({ variant }), className)}
    {...props}
  />
));
AlertDialogHeader.displayName = 'AlertDialogHeader';

// Footer component
export interface AlertDialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertDialogFooterVariants> {
  /**
   * Size of the footer spacing
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  AlertDialogFooterProps
>(({ size = 'md', className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(alertDialogFooterVariants({ size }), className)}
    {...props}
  />
));
AlertDialogFooter.displayName = 'AlertDialogFooter';

// Title component
export interface AlertDialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>,
    VariantProps<typeof alertDialogTitleVariants> {
  /**
   * Visual variant of the title
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Size of the title
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  AlertDialogTitleProps
>(({ variant = 'default', size = 'md', className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(alertDialogTitleVariants({ variant, size }), className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

// Description component
export interface AlertDialogDescriptionProps
  extends React.ComponentPropsWithoutRef<
      typeof AlertDialogPrimitive.Description
    >,
    VariantProps<typeof alertDialogDescriptionVariants> {
  /**
   * Visual variant of the description
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Size of the description
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  AlertDialogDescriptionProps
>(({ variant = 'default', size = 'md', className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(alertDialogDescriptionVariants({ variant, size }), className)}
    {...props}
  />
));
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

// Action component
export interface AlertDialogActionProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>,
    VariantProps<typeof alertDialogActionVariants> {
  /**
   * Visual variant of the action button
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Size of the action button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProps
>(({ variant = 'default', size = 'md', className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(alertDialogActionVariants({ variant, size }), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

// Cancel component
export interface AlertDialogCancelProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>,
    VariantProps<typeof alertDialogCancelVariants> {
  /**
   * Visual variant of the cancel button
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Size of the cancel button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  AlertDialogCancelProps
>(({ variant = 'default', size = 'md', className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(alertDialogCancelVariants({ variant, size }), className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// Simple AlertDialog component
export interface SimpleAlertDialogProps {
  /**
   * Whether the alert dialog is open
   */
  open?: boolean;
  /**
   * Callback when the dialog open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Trigger element
   */
  trigger?: React.ReactNode;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog description
   */
  description?: string;
  /**
   * Action button configuration
   */
  action: {
    label: string;
    onClick: () => void;
  };
  /**
   * Cancel button configuration
   */
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  /**
   * Visual variant of the dialog
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  /**
   * Size of the dialog
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Backdrop blur effect
   * @default 'none'
   */
  blur?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Icon to display in the dialog
   */
  icon?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleAlertDialog: React.FC<SimpleAlertDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  action,
  cancel = { label: 'Cancel' },
  variant = 'default',
  size = 'md',
  blur = 'none',
  icon,
  className,
}) => {
  const getVariantIcon = () => {
    switch (variant) {
      case 'destructive':
        return 'fa-exclamation-triangle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'success':
        return 'fa-check-circle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-question-circle';
    }
  };

  const displayIcon = icon || getVariantIcon();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent
        size={size}
        variant={variant}
        blur={blur}
        className={className}
      >
        <AlertDialogHeader variant={variant}>
          <div className="flex items-center space-x-3">
            {displayIcon && (
              <div className="flex-shrink-0">
                <i className={cn('fa-solid', displayIcon, 'h-6 w-6')} />
              </div>
            )}
            <AlertDialogTitle variant={variant} size={size}>
              {title}
            </AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription variant={variant} size={size}>
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter size={size}>
          <AlertDialogCancel
            variant={variant}
            size={size}
            onClick={cancel.onClick}
          >
            {cancel.label}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            size={size}
            onClick={action.onClick}
          >
            {action.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export {
  alertDialogOverlayVariants,
  alertDialogContentVariants,
  alertDialogHeaderVariants,
  alertDialogFooterVariants,
  alertDialogTitleVariants,
  alertDialogDescriptionVariants,
  alertDialogActionVariants,
  alertDialogCancelVariants,
};

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  SimpleAlertDialog,
};

export default AlertDialog;
