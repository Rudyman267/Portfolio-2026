import React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const toggleVariants = cva(
  // Base classes with FlytBase design tokens
  'inline-flex items-center justify-center rounded-lg fb-body-2 font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'bg-transparent text-text-1 hover:bg-surface-hover',
          'data-[state=on]:bg-primary-200 data-[state=on]:text-text-1 data-[state=on]:hover:bg-primary-states-hover',
        ],
        outline: [
          'border border-outline-primary bg-transparent text-text-1 hover:bg-surface-hover hover:border-outline-secondary',
          'data-[state=on]:bg-primary-200 data-[state=on]:text-text-1 data-[state=on]:border-primary-200 data-[state=on]:hover:bg-primary-states-hover',
        ],
        secondary: [
          'bg-transparent text-text-1 hover:bg-surface-hover',
          'data-[state=on]:bg-surface data-[state=on]:text-text-1 data-[state=on]:hover:bg-surface-hover',
        ],
        ghost: [
          'bg-transparent text-text-1 hover:bg-surface-hover',
          'data-[state=on]:bg-surface-selected data-[state=on]:text-text-1 data-[state=on]:hover:bg-surface-hover',
        ],
      },
      size: {
        sm: 'h-8 px-2.5 gap-1 fb-body-4',
        md: 'h-10 px-3 gap-2 fb-body-2',
        lg: 'h-12 px-4 gap-2 fb-body-1',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  /**
   * Content to be rendered inside the toggle
   */
  children: React.ReactNode;
  /**
   * Visual variant of the toggle
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /**
   * Size of the toggle
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /**
   * Whether the toggle is pressed/active
   */
  pressed?: boolean;
  /**
   * Callback when toggle state changes
   */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Icon to display (for icon variant)
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Toggle component for pressable toggle buttons using Radix + FlytBase design tokens
 * and CVA for type-safe variant management
 */
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      children,
      icon,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // For icon-only toggles
    if (size === 'icon' && icon) {
      return (
        <TogglePrimitive.Root
          ref={ref}
          className={cn(toggleVariants({ variant, size, className }))}
          disabled={disabled}
          {...props}
        >
          {icon}
        </TogglePrimitive.Root>
      );
    }

    return (
      <TogglePrimitive.Root
        ref={ref}
        className={cn(toggleVariants({ variant, size, className }))}
        disabled={disabled}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {children && <span className="truncate">{children}</span>}
      </TogglePrimitive.Root>
    );
  }
);

Toggle.displayName = TogglePrimitive.Root.displayName;

/**
 * Icon-only toggle component for toolbar use cases
 */
const IconToggle: React.FC<
  Omit<ToggleProps, 'size' | 'children'> & { icon: React.ReactNode }
> = ({ icon, ...props }) => (
  <Toggle size="icon" {...props}>
    {icon}
  </Toggle>
);

/**
 * Toggle group for multiple related toggles
 */
export interface ToggleGroupProps {
  /**
   * Toggle items to render
   */
  items: Array<{
    value: string;
    label?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  /**
   * Currently selected values (for multiple selection)
   */
  value?: string[];
  /**
   * Callback when selection changes
   */
  onValueChange?: (value: string[]) => void;
  /**
   * Visual variant for all toggles
   */
  variant?: ToggleProps['variant'];
  /**
   * Size for all toggles
   */
  size?: ToggleProps['size'];
  /**
   * Whether multiple selection is allowed
   * @default false
   */
  multiple?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  items,
  value = [],
  onValueChange,
  variant = 'default',
  size = 'md',
  multiple = false,
  className,
}) => {
  const handleToggle = (itemValue: string) => {
    if (!onValueChange) return;

    if (multiple) {
      const newValue = value.includes(itemValue)
        ? value.filter((v) => v !== itemValue)
        : [...value, itemValue];
      onValueChange(newValue);
    } else {
      const newValue = value.includes(itemValue) ? [] : [itemValue];
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {items.map((item) => (
        <Toggle
          key={item.value}
          variant={variant}
          size={size}
          pressed={value.includes(item.value)}
          onPressedChange={() => handleToggle(item.value)}
          disabled={item.disabled}
          icon={item.icon}
        >
          {item.label}
        </Toggle>
      ))}
    </div>
  );
};

export { Toggle, IconToggle, ToggleGroup, toggleVariants };
export default Toggle;
