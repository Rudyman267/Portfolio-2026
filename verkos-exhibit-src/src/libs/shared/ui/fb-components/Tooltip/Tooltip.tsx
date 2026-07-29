import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const tooltipVariants = cva(
  'z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm fb-body-4 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-surface-hover border border-outline-primary text-text-1',
        inverse: 'bg-text-1 text-surface',
        success: 'bg-success-200 text-success-900 border border-success-300',
        warning: 'bg-warning-200 text-warning-900 border border-warning-300',
        error: 'bg-error-200 text-error-900 border border-error-300',
        info: 'bg-info-200 text-info-900 border border-info-300',
        ghost:
          'bg-background-level-1 text-text-1 border border-outline-primary',
      },
      size: {
        sm: 'px-2 py-1 text-xs fb-tiny-1',
        md: 'px-3 py-1.5 text-sm fb-body-4',
        lg: 'px-4 py-2 text-base fb-body-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Root component
const TooltipRoot = TooltipPrimitive.Root;

// Provider component
const TooltipProvider = TooltipPrimitive.Provider;

// Trigger component
const TooltipTrigger = TooltipPrimitive.Trigger;

// Content component
export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipVariants> {
  /**
   * Visual variant of the tooltip
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'inverse'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'ghost';
  /**
   * Size of the tooltip
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
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

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      sideOffset = 4,
      showArrow = false,
      children,
      ...props
    },
    ref
  ) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(tooltipVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {showArrow && <TooltipPrimitive.Arrow className="fill-surface-hover" />}
    </TooltipPrimitive.Content>
  )
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Combined Tooltip component for convenience
export interface TooltipProps {
  /**
   * Content to show in the tooltip
   */
  content: React.ReactNode;
  /**
   * Element that triggers the tooltip
   */
  children: React.ReactNode;
  /**
   * Visual variant of the tooltip
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'inverse'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'ghost';
  /**
   * Size of the tooltip
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Side where tooltip appears
   * @default 'top'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Alignment of tooltip relative to trigger
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Delay in milliseconds before showing
   * @default 700
   */
  delayDuration?: number;
  /**
   * Whether to show arrow pointing to trigger
   * @default false
   */
  showArrow?: boolean;
  /**
   * Side offset from the trigger
   * @default 4
   */
  sideOffset?: number;
  /**
   * Whether the tooltip is open (controlled)
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
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  variant = 'default',
  size = 'md',
  side = 'top',
  align = 'center',
  delayDuration = 700,
  showArrow = false,
  sideOffset = 4,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <TooltipRoot
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
      >
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          variant={variant}
          size={size}
          side={side}
          align={align}
          sideOffset={sideOffset}
          showArrow={showArrow}
          className={className}
        >
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
};

/**
 * Simple tooltip with just text content
 */
const SimpleTooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'inverse'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'ghost';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}> = ({ text, children, variant = 'default', side = 'top', className }) => (
  <Tooltip content={text} variant={variant} side={side} className={className}>
    {children}
  </Tooltip>
);

/**
 * Tooltip with custom styling for help text
 */
const HelpTooltip: React.FC<{
  help: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ help, children, className }) => (
  <Tooltip
    content={help}
    variant="info"
    size="md"
    side="top"
    showArrow={true}
    className={className}
  >
    {children}
  </Tooltip>
);

/**
 * Tooltip for showing keyboard shortcuts
 */
const KeyboardTooltip: React.FC<{
  shortcut: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ shortcut, description, children, className }) => (
  <Tooltip
    content={
      <div className="flex flex-col gap-1">
        {description && <span className="text-text-2">{description}</span>}
        <kbd className="bg-surface border border-outline-primary rounded px-1.5 py-0.5 text-xs fb-tiny-1">
          {shortcut}
        </kbd>
      </div>
    }
    variant="default"
    size="md"
    side="bottom"
    className={className}
  >
    {children}
  </Tooltip>
);

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  SimpleTooltip,
  HelpTooltip,
  KeyboardTooltip,
  tooltipVariants,
};

export default Tooltip;
