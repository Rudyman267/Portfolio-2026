import React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-text-1 font-medium transition-colors hover:bg-surface-hover hover:text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent-primary data-[state=on]:text-surface fb-body-3',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-outline-primary bg-transparent hover:bg-surface-hover hover:text-text-1',
        filled: 'bg-surface-hover text-text-1 hover:bg-surface-hover/80',
        ghost: 'bg-transparent hover:bg-surface-hover/50',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const toggleGroupVariants = cva('flex items-center justify-center', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    spacing: {
      none: 'gap-0',
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    },
    variant: {
      default: '',
      outline: '',
      filled: '',
      ghost: '',
      segment: 'border border-outline-primary rounded-md p-1 bg-surface-hover',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    spacing: 'sm',
    variant: 'default',
  },
});

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    groupVariant?: 'default' | 'outline' | 'filled' | 'ghost' | 'segment';
  }
>({
  size: 'md',
  variant: 'default',
  groupVariant: 'default',
});

// ToggleGroup root component
interface ToggleGroupBaseProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
    'type' | 'value' | 'onValueChange'
  > {
  /**
   * Size of the toggle group items
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the toggle group items
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  /**
   * Visual variant of the toggle group container
   * @default 'default'
   */
  groupVariant?: 'default' | 'outline' | 'filled' | 'ghost' | 'segment';
  /**
   * Orientation of the toggle group
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Spacing between toggle items
   * @default 'sm'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  type: 'single';
  value?: string;
  onValueChange?: (value: string) => void;
}

interface ToggleGroupMultipleProps extends ToggleGroupBaseProps {
  type: 'multiple';
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps =
  | ToggleGroupSingleProps
  | ToggleGroupMultipleProps;

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>((props, ref) => {
  const {
    className,
    variant = 'default',
    size = 'md',
    groupVariant = 'default',
    orientation = 'horizontal',
    spacing = 'sm',
    children,
  } = props;

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(
        toggleGroupVariants({ orientation, spacing, variant: groupVariant }),
        className
      )}
      {...(props as any)}
    >
      <ToggleGroupContext.Provider value={{ variant, size, groupVariant }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

// ToggleGroup Item component
export interface ToggleGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> {
  /**
   * Size of the toggle item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the toggle item
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  // For segment variant, use different styling
  const itemVariant =
    context.groupVariant === 'segment' ? 'ghost' : context.variant || variant;

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: itemVariant,
          size: context.size || size,
        }),
        // Special styling for segment variant
        context.groupVariant === 'segment' && [
          'data-[state=on]:bg-surface data-[state=on]:text-text-1 data-[state=on]:shadow-sm',
          'hover:bg-surface/50',
        ],
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

// Simple ToggleGroup component
export interface SimpleToggleGroupProps {
  /**
   * Toggle options
   */
  options: Array<{
    value: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  /**
   * Currently selected value(s)
   */
  value?: string | string[];
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Whether multiple selections are allowed
   * @default false
   */
  multiple?: boolean;
  /**
   * Size of the toggle group
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the toggle group
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  /**
   * Visual variant of the toggle group container
   * @default 'default'
   */
  groupVariant?: 'default' | 'outline' | 'filled' | 'ghost' | 'segment';
  /**
   * Orientation of the toggle group
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Spacing between toggle items
   * @default 'sm'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SimpleToggleGroup: React.FC<SimpleToggleGroupProps> = ({
  options,
  value,
  onValueChange,
  multiple = false,
  size = 'md',
  variant = 'default',
  groupVariant = 'default',
  orientation = 'horizontal',
  spacing = 'sm',
  className,
}) => {
  return (
    <ToggleGroup
      type={multiple ? 'multiple' : 'single'}
      value={value as any}
      onValueChange={onValueChange as any}
      size={size}
      variant={variant}
      groupVariant={groupVariant}
      orientation={orientation}
      spacing={spacing}
      className={className}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          size={size}
          variant={variant}
        >
          {option.icon && <span className="mr-2">{option.icon}</span>}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

// Segment ToggleGroup component
export interface SegmentToggleGroupProps {
  /**
   * Toggle options
   */
  options: Array<{
    value: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Size of the toggle group
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SegmentToggleGroup: React.FC<SegmentToggleGroupProps> = ({
  options,
  value,
  onValueChange,
  size = 'md',
  className,
}) => {
  return (
    <SimpleToggleGroup
      options={options}
      value={value}
      onValueChange={
        onValueChange as ((value: string | string[]) => void) | undefined
      }
      multiple={false}
      size={size}
      variant="ghost"
      groupVariant="segment"
      spacing="none"
      className={className}
    />
  );
};

// Icon ToggleGroup component
export interface IconToggleGroupProps {
  /**
   * Toggle options with icons
   */
  options: Array<{
    value: string;
    icon: React.ReactNode;
    label?: string;
    disabled?: boolean;
  }>;
  /**
   * Currently selected value(s)
   */
  value?: string | string[];
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Whether multiple selections are allowed
   * @default false
   */
  multiple?: boolean;
  /**
   * Size of the toggle group
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the toggle group
   * @default 'outline'
   */
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const IconToggleGroup: React.FC<IconToggleGroupProps> = ({
  options,
  value,
  onValueChange,
  multiple = false,
  size = 'md',
  variant = 'outline',
  className,
}) => {
  return (
    <SimpleToggleGroup
      options={options.map((option) => ({
        value: option.value,
        label: option.label || option.icon,
        icon: option.label ? option.icon : undefined,
        disabled: option.disabled,
      }))}
      value={value}
      onValueChange={onValueChange}
      multiple={multiple}
      size={size}
      variant={variant}
      className={className}
    />
  );
};

export { toggleVariants, toggleGroupVariants };

export { ToggleGroup, ToggleGroupItem };

export default ToggleGroup;
