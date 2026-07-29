import React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const collapsibleTriggerVariants = cva(
  'flex w-full items-center justify-between py-2 fb-body-2 font-medium transition-all duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: 'text-text-1 hover:bg-surface-hover px-2 rounded-lg',
        ghost: 'text-text-1 hover:bg-transparent px-0',
        outline:
          'text-text-1 border border-outline-primary hover:bg-surface-hover px-3 rounded-lg',
        subtle:
          'text-text-2 hover:text-text-1 hover:bg-surface-hover px-2 rounded-lg',
      },
      size: {
        sm: 'py-1 px-2 fb-body-4',
        md: 'py-2 px-2 fb-body-2',
        lg: 'py-3 px-3 fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const collapsibleContentVariants = cva(
  'overflow-hidden text-sm data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
  {
    variants: {
      variant: {
        default: 'px-2 pb-2',
        ghost: 'px-0 pb-2',
        outline: 'px-3 pb-3',
        subtle: 'px-2 pb-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Root component
const CollapsibleRoot = CollapsiblePrimitive.Root;

// Trigger component
export interface CollapsibleTriggerProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>,
    VariantProps<typeof collapsibleTriggerVariants> {
  /**
   * Visual variant of the trigger
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline' | 'subtle';
  /**
   * Size of the trigger
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Icon to show before the text
   */
  icon?: React.ReactNode;
  /**
   * Whether to hide the chevron icon
   * @default false
   */
  hideChevron?: boolean;
  /**
   * Custom chevron icon
   */
  chevronIcon?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      children,
      icon,
      hideChevron = false,
      chevronIcon,
      ...props
    },
    ref
  ) => (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cn(collapsibleTriggerVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="flex items-center">{icon}</span>}
        <span className="text-left">{children}</span>
      </div>
      {!hideChevron && (
        <span className="flex items-center transition-transform duration-200">
          {chevronIcon || <i className="fa-solid fa-chevron-down text-sm" />}
        </span>
      )}
    </CollapsiblePrimitive.Trigger>
  )
);
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

// Content component
export interface CollapsibleContentProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>,
    VariantProps<typeof collapsibleContentVariants> {
  /**
   * Visual variant of the content
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline' | 'subtle';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(({ className, variant = 'default', children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(collapsibleContentVariants({ variant, className }))}
    {...props}
  >
    <div className="fb-body-2 text-text-2">{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

// Combined Collapsible component for convenience
export interface CollapsibleProps {
  /**
   * Whether the collapsible is open
   */
  open?: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Default open state for uncontrolled component
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Trigger content
   */
  trigger: React.ReactNode;
  /**
   * Content to show when expanded
   */
  children: React.ReactNode;
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline' | 'subtle';
  /**
   * Size of the trigger
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Icon to show before trigger text
   */
  icon?: React.ReactNode;
  /**
   * Whether to hide chevron
   * @default false
   */
  hideChevron?: boolean;
  /**
   * Custom chevron icon
   */
  chevronIcon?: React.ReactNode;
  /**
   * Whether the collapsible is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  open,
  onOpenChange,
  defaultOpen = false,
  trigger,
  children,
  variant = 'default',
  size = 'md',
  icon,
  hideChevron = false,
  chevronIcon,
  disabled = false,
  className,
}) => {
  return (
    <CollapsibleRoot
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
      disabled={disabled}
      className={className}
    >
      <CollapsibleTrigger
        variant={variant}
        size={size}
        icon={icon}
        hideChevron={hideChevron}
        chevronIcon={chevronIcon}
        disabled={disabled}
      >
        {trigger}
      </CollapsibleTrigger>
      <CollapsibleContent variant={variant}>{children}</CollapsibleContent>
    </CollapsibleRoot>
  );
};

/**
 * Simple collapsible for basic expand/collapse without trigger styling
 */
const SimpleCollapsible: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ open, onOpenChange, children, className }) => (
  <CollapsibleRoot
    open={open}
    onOpenChange={onOpenChange}
    className={className}
  >
    <CollapsibleContent variant="ghost">{children}</CollapsibleContent>
  </CollapsibleRoot>
);

export {
  Collapsible,
  SimpleCollapsible,
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
  collapsibleTriggerVariants,
  collapsibleContentVariants,
};

export default Collapsible;
