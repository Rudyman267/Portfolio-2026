import React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const popoverVariants = cva(
  'z-50 rounded-md border bg-surface p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-surface border-outline-primary text-text-1',
        elevated: 'bg-surface border-none shadow-lg text-text-1',
        outlined: 'bg-surface border-outline-secondary text-text-1',
        ghost: 'bg-surface-hover border-outline-primary text-text-1',
        error: 'bg-error-50 border-error-300 text-error-900',
        warning: 'bg-warning-50 border-warning-300 text-warning-900',
        success: 'bg-success-50 border-success-300 text-success-900',
        info: 'bg-info-50 border-info-300 text-info-900',
      },
      size: {
        sm: 'p-3 min-w-[200px] max-w-[240px]',
        md: 'p-4 min-w-[250px] max-w-[320px]',
        lg: 'p-5 min-w-[300px] max-w-[400px]',
        xl: 'p-6 min-w-[350px] max-w-[480px]',
        auto: 'p-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Root component
const PopoverRoot = PopoverPrimitive.Root;

// Trigger component
const PopoverTrigger = PopoverPrimitive.Trigger;

// Close component
const PopoverClose = PopoverPrimitive.Close;

// Content component
export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    VariantProps<typeof popoverVariants> {
  /**
   * Visual variant of the popover
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'elevated'
    | 'outlined'
    | 'ghost'
    | 'error'
    | 'warning'
    | 'success'
    | 'info';
  /**
   * Size of the popover
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  /**
   * Side offset from the trigger
   * @default 4
   */
  sideOffset?: number;
  /**
   * Whether to show arrow pointing to trigger
   * @default false
   */
  showArrow?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      align = 'center',
      sideOffset = 4,
      showArrow = false,
      children,
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(popoverVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {showArrow && (
          <PopoverPrimitive.Arrow className="fill-surface border-t border-l border-outline-primary" />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// Header component
export interface PopoverHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show close button
   * @default false
   */
  showCloseButton?: boolean;
  /**
   * Close button icon
   */
  closeIcon?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PopoverHeader = React.forwardRef<HTMLDivElement, PopoverHeaderProps>(
  (
    { className, showCloseButton = false, closeIcon, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between border-b border-outline-primary pb-3 mb-3',
        className
      )}
      {...props}
    >
      <div className="fb-heading-4 font-semibold text-text-1">{children}</div>
      {showCloseButton && (
        <PopoverClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          {closeIcon || (
            <i className="fa-solid fa-xmark text-sm text-text-3 hover:text-text-1" />
          )}
        </PopoverClose>
      )}
    </div>
  )
);
PopoverHeader.displayName = 'PopoverHeader';

// Body component
export interface PopoverBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PopoverBody = React.forwardRef<HTMLDivElement, PopoverBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('fb-body-2 text-text-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);
PopoverBody.displayName = 'PopoverBody';

// Footer component
export interface PopoverFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PopoverFooter = React.forwardRef<HTMLDivElement, PopoverFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-2 border-t border-outline-primary pt-3 mt-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
PopoverFooter.displayName = 'PopoverFooter';

// Combined Popover component for convenience
export interface PopoverProps {
  /**
   * Content to show in the popover
   */
  content: React.ReactNode;
  /**
   * Element that triggers the popover
   */
  children: React.ReactNode;
  /**
   * Optional header content
   */
  header?: React.ReactNode;
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  /**
   * Visual variant of the popover
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'elevated'
    | 'outlined'
    | 'ghost'
    | 'error'
    | 'warning'
    | 'success'
    | 'info';
  /**
   * Size of the popover
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  /**
   * Side where popover appears
   * @default 'bottom'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Alignment of popover relative to trigger
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Side offset from the trigger
   * @default 4
   */
  sideOffset?: number;
  /**
   * Whether to show arrow pointing to trigger
   * @default false
   */
  showArrow?: boolean;
  /**
   * Whether to show close button in header
   * @default false
   */
  showCloseButton?: boolean;
  /**
   * Whether the popover is open (controlled)
   */
  open?: boolean;
  /**
   * Default open state (uncontrolled)
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  header,
  footer,
  variant = 'default',
  size = 'md',
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  showArrow = false,
  showCloseButton = false,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}) => {
  return (
    <PopoverRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        variant={variant}
        size={size}
        side={side}
        align={align}
        sideOffset={sideOffset}
        showArrow={showArrow}
        className={className}
      >
        {header && (
          <PopoverHeader showCloseButton={showCloseButton}>
            {header}
          </PopoverHeader>
        )}
        <PopoverBody>{content}</PopoverBody>
        {footer && <PopoverFooter>{footer}</PopoverFooter>}
      </PopoverContent>
    </PopoverRoot>
  );
};

/**
 * Simple popover with just content
 */
const SimplePopover: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'elevated'
    | 'outlined'
    | 'ghost'
    | 'error'
    | 'warning'
    | 'success'
    | 'info';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}> = ({
  content,
  children,
  variant = 'default',
  side = 'bottom',
  className,
}) => (
  <Popover
    content={content}
    variant={variant}
    side={side}
    className={className}
  >
    {children}
  </Popover>
);

/**
 * Confirmation popover with actions
 */
const ConfirmationPopover: React.FC<{
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'warning';
  className?: string;
}> = ({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  children,
  variant = 'default',
  className,
}) => (
  <Popover
    header={title}
    content={description}
    footer={
      <div className="flex gap-2">
        <PopoverClose asChild>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-outline-primary rounded-md hover:bg-surface-hover transition-colors"
          >
            {cancelText}
          </button>
        </PopoverClose>
        <PopoverClose asChild>
          <button
            onClick={onConfirm}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              variant === 'error' &&
                'bg-error-500 text-white hover:bg-error-600',
              variant === 'warning' &&
                'bg-warning-500 text-white hover:bg-warning-600',
              variant === 'default' &&
                'bg-primary-500 text-white hover:bg-primary-600'
            )}
          >
            {confirmText}
          </button>
        </PopoverClose>
      </div>
    }
    variant={variant}
    showCloseButton={true}
    className={className}
  >
    {children}
  </Popover>
);

/**
 * Menu popover with list items
 */
const MenuPopover: React.FC<{
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
  }>;
  children: React.ReactNode;
  className?: string;
}> = ({ items, children, className }) => (
  <Popover
    content={
      <div className="py-1">
        {items.map((item, index) => (
          <PopoverClose key={index} asChild>
            <button
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors',
                'hover:bg-surface-hover focus:bg-surface-hover',
                item.disabled && 'opacity-50 cursor-not-allowed',
                item.destructive &&
                  'text-error-600 hover:bg-error-50 focus:bg-error-50'
              )}
            >
              {item.icon && (
                <span className="flex items-center">{item.icon}</span>
              )}
              {item.label}
            </button>
          </PopoverClose>
        ))}
      </div>
    }
    variant="elevated"
    size="auto"
    className={className}
  >
    {children}
  </Popover>
);

export {
  Popover,
  SimplePopover,
  ConfirmationPopover,
  MenuPopover,
  PopoverRoot,
  PopoverTrigger,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  popoverVariants,
};

export default Popover;
