import * as React from 'react';
import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { cva } from 'class-variance-authority';

import { cn } from '../../utils/utils';

/**
 * ResizablePanelGroup component for creating resizable panel layouts
 * Built on react-resizable-panels with FlytBase design tokens
 */
const ResizablePanelGroup: React.FC<React.ComponentProps<typeof ResizablePrimitive.PanelGroup>> = ({
  className,
  ...props
}) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
      className
    )}
    {...props}
  />
);

/**
 * ResizablePanel component - individual panel within a resizable group
 */
const ResizablePanel = ResizablePrimitive.Panel;

const resizableHandleVariants = cva(
  // Base styles with FlytBase design tokens
  'relative flex w-px items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-200 focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full [&[data-panel-group-direction=vertical]>div]:rotate-90',
  {
    variants: {
      variant: {
        default: 'bg-outline-primary',
        subtle: 'bg-outline-secondary',
        prominent: 'bg-outline-primary hover:bg-primary-200 transition-colors',
      },
      size: {
        sm: 'w-px data-[panel-group-direction=vertical]:h-px',
        md: 'w-0.5 data-[panel-group-direction=vertical]:h-0.5',
        lg: 'w-1 data-[panel-group-direction=vertical]:h-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

const resizableGripVariants = cva(
  'z-10 flex items-center justify-center rounded-sm border transition-colors',
  {
    variants: {
      size: {
        sm: 'h-3 w-2 border-outline-secondary',
        md: 'h-4 w-3 border-outline-primary',
        lg: 'h-5 w-4 border-outline-primary',
      },
      variant: {
        default: 'bg-background-level-1 hover:bg-surface-hover',
        subtle: 'bg-surface hover:bg-surface-hover',
        prominent:
          'bg-background-level-1 hover:bg-primary-50 border-primary-200',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

interface ResizableHandleProps
  extends React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> {
  /**
   * Visual variant of the resize handle
   * @default 'default'
   */
  variant?: 'default' | 'subtle' | 'prominent';
  /**
   * Size of the resize handle
   * @default 'sm'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show the grip handle for easier interaction
   * @default false
   */
  withHandle?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ResizableHandle component - draggable divider between panels
 * Supports FlytBase design tokens, variants, and optional grip handle
 */
const ResizableHandle = ({
  variant = 'default',
  size = 'sm',
  withHandle = false,
  className,
  ...props
}: ResizableHandleProps) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      resizableHandleVariants({ variant, size }),
      // Hover zone - wider invisible area for easier interaction
      'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
      'data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1',
      'data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2',
      'data-[panel-group-direction=vertical]:after:translate-x-0',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className={cn(resizableGripVariants({ size, variant }))}>
        <GripVertical
          className={cn(
            'text-text-3',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3'
          )}
        />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

// Set display names for debugging
ResizablePanelGroup.displayName = 'ResizablePanelGroup';
ResizablePanel.displayName = 'ResizablePanel';
ResizableHandle.displayName = 'ResizableHandle';

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  resizableHandleVariants,
  resizableGripVariants,
};

export type { ResizableHandleProps };
