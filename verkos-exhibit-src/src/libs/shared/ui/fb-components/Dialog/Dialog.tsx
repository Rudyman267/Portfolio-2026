import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const dialogOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  {
    variants: {
      variant: {
        default: 'bg-black/80',
        light: 'bg-black/60',
        dark: 'bg-black/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const dialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background-level-1 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
      },
      variant: {
        default: 'border-outline-primary bg-background-level-1 text-text-1',
        elevated:
          'border-outline-primary bg-background-level-2 text-text-1 shadow-2xl',
        minimal: 'border-none bg-background-level-1 text-text-1 shadow-lg',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const dialogHeaderVariants = cva(
  'flex flex-col space-y-1.5 text-center sm:text-left',
  {
    variants: {
      size: {
        sm: 'pb-2',
        md: 'pb-3',
        lg: 'pb-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const dialogFooterVariants = cva(
  'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
  {
    variants: {
      size: {
        sm: 'pt-2 gap-2',
        md: 'pt-3 gap-2',
        lg: 'pt-4 gap-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const dialogTitleVariants = cva('font-semibold leading-none tracking-tight', {
  variants: {
    size: {
      sm: 'fb-body1-medium',
      md: 'fb-title1-semi',
      lg: 'fb-title2-medium',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const dialogDescriptionVariants = cva('text-text-3', {
  variants: {
    size: {
      sm: 'fb-body5-regular',
      md: 'fb-body2-regular',
      lg: 'fb-body1-medium',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Root component
const DialogRoot = DialogPrimitive.Root;

// Trigger component
const DialogTrigger = DialogPrimitive.Trigger;

// Portal component
const DialogPortal = DialogPrimitive.Portal;

// Close component
const DialogClose = DialogPrimitive.Close;

// Overlay component
export interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
    VariantProps<typeof dialogOverlayVariants> {
  /**
   * Visual variant of the overlay
   * @default 'default'
   */
  variant?: 'default' | 'light' | 'dark';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ variant = 'default', className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(dialogOverlayVariants({ variant }), className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Content component
export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Size of the dialog
   * @default 'md'
   */
  size?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | 'full';
  /**
   * Visual variant of the dialog
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'minimal';
  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Overlay variant
   * @default 'default'
   */
  overlayVariant?: 'default' | 'light' | 'dark';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      size = 'md',
      variant = 'default',
      showCloseButton = true,
      overlayVariant = 'default',
      className,
      children,
      ...props
    },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay variant={overlayVariant} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ size, variant }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background-DEFAULT transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-hover data-[state=open]:text-text-3">
            <i className="fa-solid fa-xmark text-sm" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

// Header component
export interface DialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogHeaderVariants> {
  /**
   * Size of the header
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(dialogHeaderVariants({ size }), className)}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

// Footer component
export interface DialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogFooterVariants> {
  /**
   * Size of the footer
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(dialogFooterVariants({ size }), className)}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

// Title component
export interface DialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>,
    VariantProps<typeof dialogTitleVariants> {
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

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ size = 'md', className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(dialogTitleVariants({ size }), className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// Description component
export interface DialogDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>,
    VariantProps<typeof dialogDescriptionVariants> {
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

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ size = 'md', className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(dialogDescriptionVariants({ size }), className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Combined Dialog component for convenience
export interface DialogProps {
  /**
   * Whether the dialog is open
   */
  open?: boolean;
  /**
   * Default open state
   */
  defaultOpen?: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Title of the dialog
   */
  title?: string;
  /**
   * Description of the dialog
   */
  description?: string;
  /**
   * Content of the dialog
   */
  children: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Size of the dialog
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the dialog
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'minimal';
  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Overlay variant
   * @default 'default'
   */
  overlayVariant?: 'default' | 'light' | 'dark';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  overlayVariant = 'default',
  className,
}) => {
  return (
    <DialogRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        size={size}
        variant={variant}
        showCloseButton={showCloseButton}
        overlayVariant={overlayVariant}
        className={className}
      >
        {(title || description) && (
          <DialogHeader size={size}>
            {title && <DialogTitle size={size}>{title}</DialogTitle>}
            {description && (
              <DialogDescription size={size}>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="flex-1">{children}</div>
        {footer && <DialogFooter size={size}>{footer}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  );
};

/**
 * Confirmation dialog with predefined actions
 */
export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open?: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Title of the confirmation dialog
   */
  title: string;
  /**
   * Description of the confirmation dialog
   */
  description?: string;
  /**
   * Text for the confirm button
   * @default 'Confirm'
   */
  confirmText?: string;
  /**
   * Text for the cancel button
   * @default 'Cancel'
   */
  cancelText?: string;
  /**
   * Callback when confirmed
   */
  onConfirm?: () => void;
  /**
   * Callback when cancelled
   */
  onCancel?: () => void;
  /**
   * Variant of the confirm button
   * @default 'error'
   */
  confirmVariant?: 'default' | 'error' | 'warning';
  /**
   * Whether the action is destructive
   * @default false
   */
  destructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'error',
  destructive = false,
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 fb-body2-regular bg-background-level-2 text-text-1 rounded-md hover:bg-surface-hover transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 fb-body2-regular rounded-md transition-colors',
              confirmVariant === 'error' &&
                'bg-error-30 text-background-DEFAULT hover:bg-error-40',
              confirmVariant === 'warning' &&
                'bg-warning-30 text-background-DEFAULT hover:bg-warning-40',
              confirmVariant === 'default' &&
                'bg-primary-200 text-background-DEFAULT hover:bg-primary-300',
              destructive && 'font-medium'
            )}
            {...(destructive && { 'data-destructive': true })}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      {/* Required children prop - empty div for confirmation dialogs */}
      <div />
    </Dialog>
  );
};

export {
  Dialog,
  ConfirmDialog,
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogOverlayVariants,
  dialogContentVariants,
  dialogHeaderVariants,
  dialogFooterVariants,
  dialogTitleVariants,
  dialogDescriptionVariants,
};

export default Dialog;
