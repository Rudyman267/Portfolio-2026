import React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const commandVariants = cva(
  'flex h-full w-full flex-col overflow-hidden rounded-md bg-surface text-text-1',
  {
    variants: {
      variant: {
        default: 'bg-surface border border-outline-primary',
        ghost: 'bg-transparent border-none',
        outline: 'bg-surface border border-outline-primary',
      },
      size: {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const commandInputVariants = cva(
  'flex h-11 w-full rounded-md bg-transparent py-3 outline-none placeholder:text-text-3 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-9 text-sm fb-body-4',
        md: 'h-11 text-sm fb-body-2',
        lg: 'h-12 text-base fb-body-1',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const commandListVariants = cva('overflow-y-auto overflow-x-hidden', {
  variants: {
    size: {
      sm: 'max-h-[200px]',
      md: 'max-h-[300px]',
      lg: 'max-h-[400px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const commandItemVariants = cva(
  'relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
  {
    variants: {
      variant: {
        default:
          'text-text-1 data-[selected=true]:bg-accent-100 data-[selected=true]:text-accent-900',
        ghost:
          'text-text-2 data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-1',
      },
      size: {
        sm: 'px-2 py-1 text-sm fb-body-4',
        md: 'px-2 py-1.5 text-sm fb-body-2',
        lg: 'px-3 py-2 text-base fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const commandGroupVariants = cva('overflow-hidden p-1 text-text-1', {
  variants: {
    size: {
      sm: 'p-0.5',
      md: 'p-1',
      lg: 'p-1.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const commandEmptyVariants = cva('py-6 text-center text-text-3', {
  variants: {
    size: {
      sm: 'py-4 text-sm fb-body-4',
      md: 'py-6 text-sm fb-body-2',
      lg: 'py-8 text-base fb-body-1',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const commandSeparatorVariants = cva('h-px bg-outline-secondary', {
  variants: {
    size: {
      sm: '-mx-0.5 my-1',
      md: '-mx-1 my-1',
      lg: '-mx-1.5 my-1.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const commandShortcutVariants = cva('ml-auto tracking-widest text-text-3', {
  variants: {
    size: {
      sm: 'text-xs fb-body-4',
      md: 'text-xs fb-body-4',
      lg: 'text-sm fb-body-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Root Command component
export interface CommandProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive>,
    VariantProps<typeof commandVariants> {
  /**
   * Visual variant of the command
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline';
  /**
   * Size of the command
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandProps
>(({ variant = 'default', size = 'md', className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(commandVariants({ variant, size }), className)}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

// Command Input component
export interface CommandInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
    'size'
  > {
  /**
   * Size of the input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show search icon
   * @default true
   */
  showSearchIcon?: boolean;
  /**
   * Custom search icon
   */
  searchIcon?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(
  (
    {
      size = 'md',
      showSearchIcon = true,
      searchIcon = 'fa-search',
      className,
      ...props
    },
    ref
  ) => (
    <div
      className="flex items-center border-b border-outline-secondary px-3"
      cmdk-input-wrapper=""
    >
      {showSearchIcon && (
        <i
          className={cn(
            'fa-solid',
            searchIcon,
            'mr-2 h-4 w-4 shrink-0 opacity-50 text-text-3'
          )}
        />
      )}
      <CommandPrimitive.Input
        ref={ref}
        className={cn(commandInputVariants({ size }), className)}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = CommandPrimitive.Input.displayName;

// Command List component
export interface CommandListProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>,
    VariantProps<typeof commandListVariants> {
  /**
   * Size of the list
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>(({ size = 'md', className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(commandListVariants({ size }), className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

// Command Empty component
export interface CommandEmptyProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>,
    VariantProps<typeof commandEmptyVariants> {
  /**
   * Size of the empty state
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>(({ size = 'md', className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn(commandEmptyVariants({ size }), className)}
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

// Command Group component
export interface CommandGroupProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>,
    VariantProps<typeof commandGroupVariants> {
  /**
   * Size of the group
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>(({ size = 'md', className, ...props }, ref) => {
  const headingClasses = {
    sm: '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-3',
    md: '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-3',
    lg: '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-3',
  };

  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        commandGroupVariants({ size }),
        headingClasses[size],
        className
      )}
      {...props}
    />
  );
});
CommandGroup.displayName = CommandPrimitive.Group.displayName;

// Command Item component
export interface CommandItemProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
    VariantProps<typeof commandItemVariants> {
  /**
   * Visual variant of the item
   * @default 'default'
   */
  variant?: 'default' | 'ghost';
  /**
   * Size of the item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Icon to display with the item
   */
  icon?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(
  (
    { variant = 'default', size = 'md', icon, className, children, ...props },
    ref
  ) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(commandItemVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <i className={cn('fa-solid', icon, 'mr-2 h-4 w-4')} />}
      {children}
    </CommandPrimitive.Item>
  )
);
CommandItem.displayName = CommandPrimitive.Item.displayName;

// Command Separator component
export interface CommandSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>,
    VariantProps<typeof commandSeparatorVariants> {
  /**
   * Size of the separator
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  CommandSeparatorProps
>(({ size = 'md', className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn(commandSeparatorVariants({ size }), className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

// Command Shortcut component
export interface CommandShortcutProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof commandShortcutVariants> {
  /**
   * Size of the shortcut
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CommandShortcut = React.forwardRef<HTMLSpanElement, CommandShortcutProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(commandShortcutVariants({ size }), className)}
      {...props}
    />
  )
);
CommandShortcut.displayName = 'CommandShortcut';

// Simple Command component
export interface SimpleCommandProps {
  /**
   * Array of command items
   */
  items: Array<{
    id: string;
    label: string;
    value?: string;
    icon?: string;
    shortcut?: string;
    group?: string;
    disabled?: boolean;
    onSelect?: () => void;
  }>;
  /**
   * Placeholder text for the input
   */
  placeholder?: string;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Visual variant of the command
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline';
  /**
   * Size of the command
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show search icon
   * @default true
   */
  showSearchIcon?: boolean;
  /**
   * Custom search icon
   */
  searchIcon?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleCommand: React.FC<SimpleCommandProps> = ({
  items,
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
  variant = 'default',
  size = 'md',
  showSearchIcon = true,
  searchIcon = 'fa-search',
  className,
}) => {
  // Group items by group
  const groupedItems = items.reduce((acc, item) => {
    const group = item.group || 'default';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <Command variant={variant} size={size} className={className}>
      <CommandInput
        placeholder={placeholder}
        size={size}
        showSearchIcon={showSearchIcon}
        searchIcon={searchIcon}
      />
      <CommandList size={size}>
        <CommandEmpty size={size}>{emptyMessage}</CommandEmpty>
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <CommandGroup key={groupName} size={size}>
            {groupName !== 'default' && (
              <div cmdk-group-heading="">{groupName}</div>
            )}
            {groupItems.map((item) => (
              <CommandItem
                key={item.id}
                value={item.value || item.label}
                variant={variant === 'ghost' ? 'ghost' : 'default'}
                size={size}
                icon={item.icon}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.label}
                {item.shortcut && (
                  <CommandShortcut size={size}>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
};

export {
  commandVariants,
  commandInputVariants,
  commandListVariants,
  commandItemVariants,
  commandGroupVariants,
  commandEmptyVariants,
  commandSeparatorVariants,
  commandShortcutVariants,
};

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  SimpleCommand,
};

export default Command;
