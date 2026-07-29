import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cva } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const dropdownMenuContentVariants = cva(
  'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-surface p-1 text-text-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200',
  {
    variants: {
      size: {
        sm: 'min-w-[6rem] p-0.5',
        md: 'min-w-[8rem] p-1',
        lg: 'min-w-[10rem] p-1.5',
      },
      variant: {
        default: 'border-outline-primary bg-surface shadow-lg',
        outline: 'border-outline-primary bg-surface shadow-md',
        ghost: 'border-outline-tertiary bg-surface-hover shadow-sm',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const dropdownMenuItemVariants = cva(
  'relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'text-text-1 hover:bg-surface-hover hover:cursor-pointer focus:bg-surface-hover',
        destructive:
          'text-error-500 hover:bg-error-50 hover:cursor-pointer focus:bg-error-50 hover:text-error-600 focus:text-error-600',
        ghost:
          'text-text-2 hover:bg-surface-hover hover:cursor-pointer focus:bg-surface-hover hover:text-text-1 focus:text-text-1',
      },
      size: {
        sm: 'px-2 py-1 text-sm fb-body-4',
        md: 'px-2 py-1.5 text-sm fb-body-2',
        lg: 'px-3 py-2 text-base fb-body-1',
      },
      disabled: {
        true: 'pointer-events-none opacity-50 cursor-not-allowed hover:cursor-not-allowed',
        false: '',
      },
      inset: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        inset: true,
        size: 'sm',
        className: 'pl-6',
      },
      {
        inset: true,
        size: 'md',
        className: 'pl-8',
      },
      {
        inset: true,
        size: 'lg',
        className: 'pl-10',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      disabled: false,
      inset: false,
    },
  }
);

const dropdownMenuLabelVariants = cva('font-semibold text-text-1', {
  variants: {
    size: {
      sm: 'px-2 py-1 text-xs fb-body-4',
      md: 'px-2 py-1.5 text-sm fb-body-2',
      lg: 'px-3 py-2 text-base fb-body-1',
    },
    inset: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      inset: true,
      size: 'sm',
      className: 'pl-6',
    },
    {
      inset: true,
      size: 'md',
      className: 'pl-8',
    },
    {
      inset: true,
      size: 'lg',
      className: 'pl-10',
    },
  ],
  defaultVariants: {
    size: 'md',
    inset: false,
  },
});

const dropdownMenuSeparatorVariants = cva('h-px bg-outline-secondary', {
  variants: {
    size: {
      sm: '-mx-0.5 my-0.5',
      md: '-mx-1 my-1',
      lg: '-mx-1.5 my-1.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Root components (re-export Radix primitives)
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// Content component
export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  /**
   * Size of the dropdown menu
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the dropdown menu
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Offset from the trigger element
   * @default 4
   */
  sideOffset?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(
  (
    { size = 'md', variant = 'default', sideOffset = 4, className, ...props },
    ref
  ) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          dropdownMenuContentVariants({ size, variant }),
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

// Item component
export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  /**
   * Visual variant of the menu item
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'ghost';
  /**
   * Size of the menu item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the item is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to indent the item
   * @default false
   */
  inset?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(
  (
    {
      variant = 'default',
      size = 'md',
      disabled = false,
      inset = false,
      className,
      ...props
    },
    ref
  ) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        dropdownMenuItemVariants({ variant, size, disabled, inset }),
        className
      )}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

// Checkbox item component
export interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.CheckboxItem
  > {
  /**
   * Visual variant of the checkbox item
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'ghost';
  /**
   * Size of the checkbox item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the checkbox is checked
   */
  checked?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(
  (
    {
      variant = 'default',
      size = 'md',
      className,
      children,
      checked,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        item: 'py-1 pl-6 pr-2',
        indicator: 'left-2 h-3 w-3',
        icon: 'h-3 w-3',
      },
      md: {
        item: 'py-1.5 pl-8 pr-2',
        indicator: 'left-2 h-3.5 w-3.5',
        icon: 'h-4 w-4',
      },
      lg: {
        item: 'py-2 pl-10 pr-3',
        indicator: 'left-3 h-4 w-4',
        icon: 'h-4 w-4',
      },
    };

    const currentSize = sizeClasses[size];

    return (
      <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
          dropdownMenuItemVariants({ variant, size }),
          currentSize.item,
          'relative flex cursor-default select-none items-center rounded-sm text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        checked={checked}
        {...props}
      >
        <span
          className={cn(
            'absolute flex items-center justify-center',
            currentSize.indicator
          )}
        >
          <DropdownMenuPrimitive.ItemIndicator>
            <i className={cn('fa-solid fa-check', currentSize.icon)} />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.CheckboxItem>
    );
  }
);
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

// Radio item component
export interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.RadioItem
  > {
  /**
   * Visual variant of the radio item
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'ghost';
  /**
   * Size of the radio item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(
  (
    { variant = 'default', size = 'md', className, children, ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        item: 'py-1 pl-6 pr-2',
        indicator: 'left-2 h-3 w-3',
        icon: 'h-2 w-2',
      },
      md: {
        item: 'py-1.5 pl-8 pr-2',
        indicator: 'left-2 h-3.5 w-3.5',
        icon: 'h-2 w-2',
      },
      lg: {
        item: 'py-2 pl-10 pr-3',
        indicator: 'left-3 h-4 w-4',
        icon: 'h-2.5 w-2.5',
      },
    };

    const currentSize = sizeClasses[size];

    return (
      <DropdownMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
          dropdownMenuItemVariants({ variant, size }),
          currentSize.item,
          'relative flex cursor-default select-none items-center rounded-sm text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'absolute flex items-center justify-center',
            currentSize.indicator
          )}
        >
          <DropdownMenuPrimitive.ItemIndicator>
            <i className={cn('fa-solid fa-circle', currentSize.icon)} />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.RadioItem>
    );
  }
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// Label component
export interface DropdownMenuLabelProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  /**
   * Size of the label
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to indent the label
   * @default false
   */
  inset?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ size = 'md', inset = false, className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(dropdownMenuLabelVariants({ size, inset }), className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// Separator component
export interface DropdownMenuSeparatorProps
  extends React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.Separator
  > {
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

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>(({ size = 'md', className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(dropdownMenuSeparatorVariants({ size }), className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// Shortcut component
export interface DropdownMenuShortcutProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Size of the shortcut text
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DropdownMenuShortcut = React.forwardRef<
  HTMLSpanElement,
  DropdownMenuShortcutProps
>(({ size = 'md', className, ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-xs fb-body-4',
    md: 'text-xs fb-body-4',
    lg: 'text-sm fb-body-2',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'ml-auto tracking-widest opacity-60 text-text-3',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// Sub components
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }
>(({ size = 'md', inset = false, className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ size, inset }),
      'flex cursor-default select-none items-center rounded-sm outline-none focus:bg-surface-hover data-[state=open]:bg-surface-hover',
      className
    )}
    {...props}
  >
    {children}
    <i className="fa-solid fa-chevron-right ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline' | 'ghost';
  }
>(({ size = 'md', variant = 'default', className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      dropdownMenuContentVariants({ size, variant }),
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

// Simple dropdown menu component
export interface SimpleDropdownMenuProps {
  /**
   * Array of menu items
   */
  items: Array<{
    label: string;
    value?: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    destructive?: boolean;
    type?: 'item' | 'separator' | 'label';
    onClick?: () => void;
  }>;
  /**
   * Trigger element
   */
  trigger: React.ReactNode;
  /**
   * Size of the dropdown menu
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the dropdown menu
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleDropdownMenu: React.FC<SimpleDropdownMenuProps> = ({
  items,
  trigger,
  size = 'md',
  variant = 'default',
  className,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent size={size} variant={variant} className={className}>
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={index} size={size} />;
          }

          if (item.type === 'label') {
            return (
              <DropdownMenuLabel key={index} size={size}>
                {item.label}
              </DropdownMenuLabel>
            );
          }

          return (
            <DropdownMenuItem
              key={index}
              size={size}
              variant={item.destructive ? 'destructive' : 'default'}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              {item.icon && <i className={cn('fa-solid', item.icon, 'mr-2')} />}
              {item.label}
              {item.shortcut && (
                <DropdownMenuShortcut size={size}>
                  {item.shortcut}
                </DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export {
  dropdownMenuContentVariants,
  dropdownMenuItemVariants,
  dropdownMenuLabelVariants,
  dropdownMenuSeparatorVariants,
};

export {
  DropdownMenu,
  SimpleDropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
