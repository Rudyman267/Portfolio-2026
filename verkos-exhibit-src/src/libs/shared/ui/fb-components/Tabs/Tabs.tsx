import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const tabsListVariants = cva(
  // Base classes with FlytBase design tokens
  'inline-flex items-center justify-center rounded-lg bg-surface p-1',
  {
    variants: {
      variant: {
        default: 'bg-surface border border-outline-primary',
        underline:
          'bg-transparent border-none border-b border-b-outline-primary',
        pills: 'bg-background-level-3 p-1',
        ghost: 'bg-transparent border-none',
      },
      size: {
        sm: 'h-8 p-0.5',
        md: 'h-10 p-1',
        lg: 'h-12 p-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const tabsTriggerVariants = cva(
  // Base classes for tab triggers
  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 fb-body-2 font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'text-text-2 hover:text-text-1 hover:bg-surface-hover',
          'data-[state=active]:bg-background-level-1 data-[state=active]:text-text-1 data-[state=active]:shadow-sm',
        ],
        underline: [
          'rounded-none border-b-2 border-b-transparent text-text-2 hover:text-text-1 hover:border-b-outline-secondary',
          'data-[state=active]:border-b-primary-200 data-[state=active]:text-text-1 data-[state=active]:bg-transparent',
        ],
        pills: [
          'text-text-2 hover:text-text-1 hover:bg-surface-hover',
          'data-[state=active]:bg-primary-200 data-[state=active]:text-text-1',
        ],
        ghost: [
          'text-text-2 hover:text-text-1 hover:bg-surface-hover',
          'data-[state=active]:text-text-1 data-[state=active]:bg-surface-selected',
        ],
      },
      size: {
        sm: 'h-7 px-2 py-1 fb-body-4',
        md: 'h-8 px-3 py-1.5 fb-body-2',
        lg: 'h-10 px-4 py-2 fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const tabsContentVariants = cva(
  'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: '',
        underline: 'mt-6',
        pills: '',
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Root component
const TabsRoot = TabsPrimitive.Root;

// List component
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {
  variant?: 'default' | 'underline' | 'pills' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'default', size = 'md', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, size, className }))}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// Trigger component
export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  variant?: 'default' | 'underline' | 'pills' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  badge?: string | number;
  className?: string;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      children,
      icon,
      badge,
      ...props
    },
    ref
  ) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="flex items-center">{icon}</span>}
        <span>{children}</span>
        {badge && (
          <span className="bg-primary-200 text-text-1 rounded-full px-1.5 py-0.5 fb-tiny-2 min-w-[16px] h-4 flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
    </TabsPrimitive.Trigger>
  )
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// Content component
export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
    VariantProps<typeof tabsContentVariants> {
  variant?: 'default' | 'underline' | 'pills' | 'ghost';
  className?: string;
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentVariants({ variant, className }))}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Combined Tabs component for convenience
export interface TabsProps {
  /**
   * Array of tab items
   */
  items: Array<{
    value: string;
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    badge?: string | number;
    disabled?: boolean;
  }>;
  /**
   * Currently active tab value
   */
  value?: string;
  /**
   * Callback when active tab changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Visual variant of the tabs
   * @default 'default'
   */
  variant?: 'default' | 'underline' | 'pills' | 'ghost';
  /**
   * Size of the tabs
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Default tab value if uncontrolled
   */
  defaultValue?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onValueChange,
  variant = 'default',
  size = 'md',
  defaultValue,
  className,
}) => {
  return (
    <TabsRoot
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue || items[0]?.value}
      className={className}
    >
      <TabsList variant={variant} size={size}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant={variant}
            size={size}
            icon={item.icon}
            badge={item.badge}
            disabled={item.disabled}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} variant={variant}>
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  );
};

export {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
  Tabs,
};

export default Tabs;
