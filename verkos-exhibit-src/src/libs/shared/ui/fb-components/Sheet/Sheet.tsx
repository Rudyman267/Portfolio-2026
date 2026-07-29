import React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const sheetVariants = cva(
  // Base classes for sheet overlay
  'fixed z-50 gap-4 bg-background-level-1 p-6 shadow-lg transition duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-b-outline-primary data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t border-t-outline-primary data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-r-outline-primary data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l border-l-outline-primary data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
        full: '',
      },
    },
    compoundVariants: [
      {
        side: ['top', 'bottom'],
        size: 'sm',
        class: 'h-1/3',
      },
      {
        side: ['top', 'bottom'],
        size: 'md',
        class: 'h-1/2',
      },
      {
        side: ['top', 'bottom'],
        size: 'lg',
        class: 'h-2/3',
      },
      {
        side: ['top', 'bottom'],
        size: 'xl',
        class: 'h-3/4',
      },
      {
        side: ['top', 'bottom'],
        size: 'full',
        class: 'h-full',
      },
      {
        side: ['left', 'right'],
        size: 'sm',
        class: 'max-w-xs',
      },
      {
        side: ['left', 'right'],
        size: 'md',
        class: 'max-w-md',
      },
      {
        side: ['left', 'right'],
        size: 'lg',
        class: 'max-w-lg',
      },
      {
        side: ['left', 'right'],
        size: 'xl',
        class: 'max-w-xl',
      },
      {
        side: ['left', 'right'],
        size: 'full',
        class: 'max-w-full',
      },
    ],
    defaultVariants: {
      side: 'right',
      size: 'md',
    },
  }
);

const sheetOverlayVariants = cva(
  'fixed inset-0 z-50 bg-others-scrim backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
);

// Root component
const SheetRoot = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

// Overlay component
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(sheetOverlayVariants(), className)}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

// Content component
export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      side = 'right',
      size = 'md',
      className,
      children,
      showCloseButton = true,
      ...props
    },
    ref
  ) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side, size }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute right-4 top-4 rounded-lg bg-transparent p-2 text-text-2 hover:text-text-1 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:pointer-events-none">
            <i className="fa-solid fa-xmark text-lg" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

// Header component
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

// Footer component
const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

// Title component
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('fb-heading-3 font-semibold text-text-1', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

// Description component
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('fb-body-2 text-text-2', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// Combined Sheet component for convenience
export interface SheetProps {
  /**
   * Whether the sheet is open
   */
  open?: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Side of the screen where sheet appears
   * @default 'right'
   */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Size of the sheet
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Title of the sheet
   */
  title?: string;
  /**
   * Description of the sheet
   */
  description?: string;
  /**
   * Content to render inside the sheet
   */
  children: React.ReactNode;
  /**
   * Trigger element to open the sheet
   */
  trigger?: React.ReactNode;
  /**
   * Whether to show close button
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  side = 'right',
  size = 'md',
  title,
  description,
  children,
  trigger,
  showCloseButton = true,
  footer,
  className,
}) => {
  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side={side}
        size={size}
        showCloseButton={showCloseButton}
        className={className}
      >
        {(title || description) && (
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}

        <div className="flex-1 overflow-auto">{children}</div>

        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </SheetRoot>
  );
};

export {
  SheetRoot,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetVariants,
  sheetOverlayVariants,
  Sheet,
};

export default Sheet;
