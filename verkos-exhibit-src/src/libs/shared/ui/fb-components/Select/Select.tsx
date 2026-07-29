import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const selectTriggerVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 fb-body2-regular ring-offset-background-DEFAULT placeholder:text-text-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
  {
    variants: {
      variant: {
        default:
          'border-outline-primary bg-background-level-1 text-text-1 hover:bg-surface-hover',
        outline:
          'border-outline-secondary bg-background-level-1 text-text-1 hover:bg-surface-hover',
        ghost:
          'border-transparent bg-transparent text-text-1 hover:bg-surface-hover',
        filled:
          'border-outline-primary bg-surface-hover text-text-1 hover:bg-surface-hover',
      },
      size: {
        sm: 'h-8 px-2 fb-body5-regular',
        md: 'h-10 px-3 fb-body2-regular',
        lg: 'h-12 px-4 fb-body1-medium',
      },
      state: {
        default: '',
        error: 'border-error-30 focus:ring-error-30',
        success: 'border-success-30 focus:ring-success-30',
        warning: 'border-warning-30 focus:ring-warning-30',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

const selectContentVariants = cva(
  'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-background-level-1 text-text-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'border-outline-primary bg-background-level-1',
        elevated: 'border-outline-primary bg-background-level-2 shadow-lg',
        minimal: 'border-outline-primary bg-background-level-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const selectItemVariants = cva(
  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 fb-body2-regular outline-none focus:bg-surface-hover focus:text-text-1 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      variant: {
        default: 'text-text-1 focus:bg-surface-hover',
        highlighted: 'text-text-1 focus:bg-primary-50 focus:text-primary-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Root component
const SelectRoot = SelectPrimitive.Root;

// Group component
const SelectGroup = SelectPrimitive.Group;

// Value component
const SelectValue = SelectPrimitive.Value;

// Trigger component
export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  /**
   * Visual variant of the select trigger
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost' | 'filled';
  /**
   * Size of the select trigger
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * State of the select trigger
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success' | 'warning';
  /**
   * Custom icon for the trigger
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    {
      variant = 'default',
      size = 'md',
      state = 'default',
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(selectTriggerVariants({ variant, size, state, className }))}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {icon || <i className="fa-solid fa-chevron-down text-sm text-text-3" />}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

// Scroll buttons
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1 text-text-3 hover:text-text-1',
      className
    )}
    {...props}
  >
    <i className="fa-solid fa-chevron-up text-sm" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1 text-text-3 hover:text-text-1',
      className
    )}
    {...props}
  >
    <i className="fa-solid fa-chevron-down text-sm" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

// Content component
export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
    VariantProps<typeof selectContentVariants> {
  /**
   * Visual variant of the select content
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'minimal';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(
  (
    { variant = 'default', className, children, position = 'popper', ...props },
    ref
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          selectContentVariants({ variant }),
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

// Label component
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-1.5 pl-8 pr-2 fb-body5-regular font-semibold text-text-2',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

// Item component
export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    VariantProps<typeof selectItemVariants> {
  /**
   * Visual variant of the select item
   * @default 'default'
   */
  variant?: 'default' | 'highlighted';
  /**
   * Icon to display before the item text
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ variant = 'default', icon, className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants({ variant, className }))}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <i className="fa-solid fa-check text-xs text-primary-200" />
      </SelectPrimitive.ItemIndicator>
    </span>

    {icon && <span className="mr-2 flex items-center">{icon}</span>}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

// Separator component
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-outline-primary', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Combined Select component for convenience
export interface SelectProps {
  /**
   * Options for the select
   */
  options: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  /**
   * Grouped options
   */
  groups?: Array<{
    label: string;
    options: Array<{
      value: string;
      label: string;
      icon?: React.ReactNode;
      disabled?: boolean;
    }>;
  }>;
  /**
   * Current selected value
   */
  value?: string;
  /**
   * Default selected value
   */
  defaultValue?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether the select is disabled
   */
  disabled?: boolean;
  /**
   * Visual variant of the select
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost' | 'filled';
  /**
   * Size of the select
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * State of the select
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success' | 'warning';
  /**
   * Content variant
   * @default 'default'
   */
  contentVariant?: 'default' | 'elevated' | 'minimal';
  /**
   * Custom trigger icon
   */
  triggerIcon?: React.ReactNode;
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options = [],
  groups = [],
  value,
  defaultValue,
  placeholder = 'Select an option...',
  disabled = false,
  variant = 'default',
  size = 'md',
  state = 'default',
  contentVariant = 'default',
  triggerIcon,
  onValueChange,
  className,
}) => {
  const hasGroups = groups.length > 0;
  const allOptions = hasGroups ? groups : [{ label: '', options }];

  return (
    <SelectRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        variant={variant}
        size={size}
        state={state}
        icon={triggerIcon}
        className={className}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent variant={contentVariant}>
        {allOptions.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {hasGroups && group.label && (
              <>
                <SelectLabel>{group.label}</SelectLabel>
                {groupIndex > 0 && <SelectSeparator />}
              </>
            )}
            {group.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                icon={option.icon}
              >
                {option.label}
              </SelectItem>
            ))}
          </React.Fragment>
        ))}
      </SelectContent>
    </SelectRoot>
  );
};

/**
 * Simple select with basic options
 */
const SimpleSelect: React.FC<{
  options: string[] | Array<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}> = ({
  options,
  value,
  defaultValue,
  placeholder,
  onValueChange,
  disabled,
  className,
}) => {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option
  );

  return (
    <Select
      options={normalizedOptions}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onValueChange={onValueChange}
      disabled={disabled}
      className={className}
    />
  );
};

/**
 * Multi-select variant (basic implementation)
 */
const MultiSelect: React.FC<{
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  values?: string[];
  defaultValues?: string[];
  placeholder?: string;
  onValuesChange?: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}> = ({
  options,
  values = [],
  defaultValues = [],
  placeholder,
  onValuesChange,
  disabled,
  className,
}) => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    values.length > 0 ? values : defaultValues
  );

  const handleValueChange = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newValues);
    onValuesChange?.(newValues);
  };

  const selectedLabels = selectedValues
    .map((value) => options.find((opt) => opt.value === value)?.label)
    .filter(Boolean);

  return (
    <SelectRoot disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedLabels.length > 0
            ? selectedLabels.join(', ')
            : placeholder || 'Select options...'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            onSelect={() => handleValueChange(option.value)}
            icon={option.icon}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleValueChange(option.value)}
                className="rounded border-outline-primary"
              />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
};

export {
  SelectRoot,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  selectTriggerVariants,
  selectContentVariants,
  selectItemVariants,
  Select,
  SimpleSelect,
  MultiSelect,
};

export default Select;
