import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const drawerOverlayVariants = cva('fixed inset-0 z-50 bg-black/80', {
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
});

const drawerContentVariants = cva(
  'fixed z-50 flex h-auto flex-col border bg-surface',
  {
    variants: {
      side: {
        bottom: 'inset-x-0 bottom-0 mt-24 rounded-t-[10px] border-t',
        top: 'inset-x-0 top-0 mb-24 rounded-b-[10px] border-b',
        left: 'inset-y-0 left-0 mr-24 h-full w-3/4 max-w-sm rounded-r-[10px] border-r sm:max-w-sm',
        right:
          'inset-y-0 right-0 ml-24 h-full w-3/4 max-w-sm rounded-l-[10px] border-l sm:max-w-sm',
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
        side: 'bottom',
        size: 'sm',
        className: 'max-h-[40vh]',
      },
      {
        side: 'bottom',
        size: 'md',
        className: 'max-h-[50vh]',
      },
      {
        side: 'bottom',
        size: 'lg',
        className: 'max-h-[60vh]',
      },
      {
        side: 'bottom',
        size: 'xl',
        className: 'max-h-[80vh]',
      },
      {
        side: 'bottom',
        size: 'full',
        className: 'max-h-[95vh]',
      },
      {
        side: 'top',
        size: 'sm',
        className: 'max-h-[40vh]',
      },
      {
        side: 'top',
        size: 'md',
        className: 'max-h-[50vh]',
      },
      {
        side: 'top',
        size: 'lg',
        className: 'max-h-[60vh]',
      },
      {
        side: 'top',
        size: 'xl',
        className: 'max-h-[80vh]',
      },
      {
        side: 'top',
        size: 'full',
        className: 'max-h-[95vh]',
      },
      {
        side: ['left', 'right'],
        size: 'sm',
        className: 'max-w-xs',
      },
      {
        side: ['left', 'right'],
        size: 'md',
        className: 'max-w-sm',
      },
      {
        side: ['left', 'right'],
        size: 'lg',
        className: 'max-w-md',
      },
      {
        side: ['left', 'right'],
        size: 'xl',
        className: 'max-w-lg',
      },
      {
        side: ['left', 'right'],
        size: 'full',
        className: 'max-w-full',
      },
    ],
    defaultVariants: {
      side: 'bottom',
      size: 'md',
    },
  }
);

const drawerHeaderVariants = cva('grid gap-1.5 p-4 text-center sm:text-left', {
  variants: {
    variant: {
      default: 'text-text-1',
      centered: 'text-center',
      left: 'text-left',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const drawerFooterVariants = cva('mt-auto flex gap-2 p-4', {
  variants: {
    variant: {
      default: 'flex-col',
      horizontal: 'flex-row justify-end',
      centered: 'flex-row justify-center',
      spread: 'flex-row justify-between',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const drawerTitleVariants = cva(
  'font-semibold leading-none tracking-tight text-text-1',
  {
    variants: {
      size: {
        sm: 'text-base fb-heading-4',
        md: 'text-lg fb-heading-4',
        lg: 'text-xl fb-heading-3',
        xl: 'text-2xl fb-heading-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const drawerDescriptionVariants = cva('text-text-2', {
  variants: {
    size: {
      sm: 'text-sm fb-body-4',
      md: 'text-sm fb-body-2',
      lg: 'text-base fb-body-1',
      xl: 'text-lg fb-body-1',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Root Drawer component
export type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * Whether to scale the background
   * @default true
   */
  shouldScaleBackground?: boolean;
};

const Drawer = ({ shouldScaleBackground = true, ...props }: DrawerProps) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
Drawer.displayName = 'Drawer';

// Drawer components (re-export primitives)
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

// Drawer Overlay component
export interface DrawerOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>,
    VariantProps<typeof drawerOverlayVariants> {
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

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  DrawerOverlayProps
>(({ blur = 'none', className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(drawerOverlayVariants({ blur }), className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

// Drawer Content component
export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
    VariantProps<typeof drawerContentVariants> {
  /**
   * Side from which the drawer appears
   * @default 'bottom'
   */
  side?: 'bottom' | 'top' | 'left' | 'right';
  /**
   * Size of the drawer
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Whether to show the drag handle
   * @default true
   */
  showHandle?: boolean;
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

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      side = 'bottom',
      size = 'md',
      showHandle = true,
      blur = 'none',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isVertical = side === 'bottom' || side === 'top';

    return (
      <DrawerPortal>
        <DrawerOverlay blur={blur} />
        <DrawerPrimitive.Content
          ref={ref}
          className={cn(drawerContentVariants({ side, size }), className)}
          {...props}
        >
          {showHandle && isVertical && (
            <div
              className={cn(
                'mx-auto h-2 w-[100px] rounded-full bg-outline-secondary',
                side === 'bottom' ? 'mt-4' : 'mb-4'
              )}
            />
          )}
          {children}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    );
  }
);
DrawerContent.displayName = 'DrawerContent';

// Drawer Header component
export interface DrawerHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerHeaderVariants> {
  /**
   * Visual variant of the header
   * @default 'default'
   */
  variant?: 'default' | 'centered' | 'left';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(drawerHeaderVariants({ variant }), className)}
      {...props}
    />
  )
);
DrawerHeader.displayName = 'DrawerHeader';

// Drawer Footer component
export interface DrawerFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerFooterVariants> {
  /**
   * Visual variant of the footer
   * @default 'default'
   */
  variant?: 'default' | 'horizontal' | 'centered' | 'spread';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(drawerFooterVariants({ variant }), className)}
      {...props}
    />
  )
);
DrawerFooter.displayName = 'DrawerFooter';

// Drawer Title component
export interface DrawerTitleProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>,
    VariantProps<typeof drawerTitleVariants> {
  /**
   * Size of the title
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  DrawerTitleProps
>(({ size = 'md', className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(drawerTitleVariants({ size }), className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

// Drawer Description component
export interface DrawerDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>,
    VariantProps<typeof drawerDescriptionVariants> {
  /**
   * Size of the description
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  DrawerDescriptionProps
>(({ size = 'md', className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn(drawerDescriptionVariants({ size }), className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

// Simple Drawer component
export interface SimpleDrawerProps {
  /**
   * Whether the drawer is open
   */
  open?: boolean;
  /**
   * Callback when the drawer open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Trigger element
   */
  trigger?: React.ReactNode;
  /**
   * Drawer title
   */
  title?: string;
  /**
   * Drawer description
   */
  description?: string;
  /**
   * Drawer content
   */
  children: React.ReactNode;
  /**
   * Side from which the drawer appears
   * @default 'bottom'
   */
  side?: 'bottom' | 'top' | 'left' | 'right';
  /**
   * Size of the drawer
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Whether to show the drag handle
   * @default true
   */
  showHandle?: boolean;
  /**
   * Backdrop blur effect
   * @default 'none'
   */
  blur?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Header variant
   * @default 'default'
   */
  headerVariant?: 'default' | 'centered' | 'left';
  /**
   * Footer variant
   * @default 'default'
   */
  footerVariant?: 'default' | 'horizontal' | 'centered' | 'spread';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleDrawer: React.FC<SimpleDrawerProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  side = 'bottom',
  size = 'md',
  showHandle = true,
  blur = 'none',
  footer,
  headerVariant = 'default',
  footerVariant = 'default',
  className,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        side={side}
        size={size}
        showHandle={showHandle}
        blur={blur}
        className={className}
      >
        {(title || description) && (
          <DrawerHeader variant={headerVariant}>
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <DrawerFooter variant={footerVariant}>{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export {
  drawerOverlayVariants,
  drawerContentVariants,
  drawerHeaderVariants,
  drawerFooterVariants,
  drawerTitleVariants,
  drawerDescriptionVariants,
};

export {
  Drawer,
  SimpleDrawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};

export default Drawer;
