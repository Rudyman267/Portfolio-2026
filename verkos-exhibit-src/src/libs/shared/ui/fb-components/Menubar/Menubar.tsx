import React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../../utils/utils';

const menubarVariants = cva(
  'flex items-center space-x-1 rounded-md border bg-surface p-1',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      variant: {
        default: 'border-outline-primary bg-surface',
        outline: 'border-outline-primary bg-surface',
        ghost: 'border-transparent bg-transparent',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const menubarTriggerVariants = cva(
  'flex cursor-default select-none items-center rounded-sm font-medium outline-none focus:bg-surface-hover focus:text-text-1 data-[state=open]:bg-surface-hover data-[state=open]:text-text-1 fb-body-3',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
      variant: {
        default: 'text-text-1',
        outline: 'text-text-1',
        ghost: 'text-text-1',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const menubarContentVariants = cva(
  'z-50 min-w-[12rem] overflow-hidden rounded-md border bg-surface p-1 text-text-1 shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      size: {
        sm: 'min-w-[8rem] text-xs',
        md: 'min-w-[12rem] text-sm',
        lg: 'min-w-[16rem] text-base',
      },
      variant: {
        default: 'border-outline-primary bg-surface',
        outline: 'border-outline-primary bg-surface',
        ghost: 'border-outline-tertiary bg-surface shadow-sm',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const menubarItemVariants = cva(
  'relative flex cursor-default select-none items-center rounded-sm text-text-1 outline-none focus:bg-surface-hover focus:text-text-1 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 fb-body-3',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
      variant: {
        default: '',
        destructive: 'text-semantic-error focus:text-semantic-error',
      },
      inset: {
        true: 'pl-8',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      inset: false,
    },
  }
);

const menubarLabelVariants = cva('text-text-3 font-semibold fb-body-4', {
  variants: {
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2 py-1.5 text-sm',
      lg: 'px-3 py-2 text-base',
    },
    inset: {
      true: 'pl-8',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    inset: false,
  },
});

const menubarShortcutVariants = cva(
  'ml-auto text-text-3 tracking-widest fb-body-4',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-xs',
        lg: 'text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// Root components (re-export Radix primitives)
const MenubarMenu: typeof MenubarPrimitive.Menu = MenubarPrimitive.Menu;
const MenubarGroup: typeof MenubarPrimitive.Group = MenubarPrimitive.Group;
const MenubarPortal: typeof MenubarPrimitive.Portal = MenubarPrimitive.Portal;
const MenubarSub: typeof MenubarPrimitive.Sub = MenubarPrimitive.Sub;
const MenubarRadioGroup: typeof MenubarPrimitive.RadioGroup = MenubarPrimitive.RadioGroup;

// Menubar root component
export interface MenubarProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>,
    VariantProps<typeof menubarVariants> {
  /**
   * Size of the menubar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the menubar
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  MenubarProps
>(({ size = 'md', variant = 'default', className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(menubarVariants({ size, variant }), className)}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

// Menubar Trigger component
export interface MenubarTriggerProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>,
    VariantProps<typeof menubarTriggerVariants> {
  /**
   * Size of the trigger
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the trigger
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  MenubarTriggerProps
>(({ size = 'md', variant = 'default', className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(menubarTriggerVariants({ size, variant }), className)}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

// Menubar Content component
export interface MenubarContentProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>,
    VariantProps<typeof menubarContentVariants> {
  /**
   * Size of the content
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the content
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Alignment of the content
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Offset from the trigger element
   * @default -4
   */
  alignOffset?: number;
  /**
   * Side offset from the trigger element
   * @default 8
   */
  sideOffset?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  MenubarContentProps
>(
  (
    {
      size = 'md',
      variant = 'default',
      align = 'start',
      alignOffset = -4,
      sideOffset = 8,
      className,
      ...props
    },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(menubarContentVariants({ size, variant }), className)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
);
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

// Menubar Item component
export interface MenubarItemProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>,
    VariantProps<typeof menubarItemVariants> {
  /**
   * Size of the item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the item
   * @default 'default'
   */
  variant?: 'default' | 'destructive';
  /**
   * Whether the item is inset
   * @default false
   */
  inset?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  MenubarItemProps
>(
  (
    { size = 'md', variant = 'default', inset = false, className, ...props },
    ref
  ) => (
    <MenubarPrimitive.Item
      ref={ref}
      className={cn(menubarItemVariants({ size, variant, inset }), className)}
      {...props}
    />
  )
);
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

// Menubar Checkbox Item component
export interface MenubarCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>,
    VariantProps<typeof menubarItemVariants> {
  /**
   * Size of the checkbox item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  MenubarCheckboxItemProps
>(({ size = 'md', className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(menubarItemVariants({ size, inset: true }), className)}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-text-1" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

// Menubar Radio Item component
export interface MenubarRadioItemProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>,
    VariantProps<typeof menubarItemVariants> {
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

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  MenubarRadioItemProps
>(({ size = 'md', className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(menubarItemVariants({ size, inset: true }), className)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current text-text-1" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

// Menubar Label component
export interface MenubarLabelProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label>,
    VariantProps<typeof menubarLabelVariants> {
  /**
   * Size of the label
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the label is inset
   * @default false
   */
  inset?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  MenubarLabelProps
>(({ size = 'md', inset = false, className, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(menubarLabelVariants({ size, inset }), className)}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

// Menubar Separator component
export interface MenubarSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  MenubarSeparatorProps
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-outline-tertiary', className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

// Menubar SubTrigger component
export interface MenubarSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>,
    VariantProps<typeof menubarItemVariants> {
  /**
   * Size of the sub trigger
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the sub trigger is inset
   * @default false
   */
  inset?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  MenubarSubTriggerProps
>(({ size = 'md', inset = false, className, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(menubarItemVariants({ size, inset }), className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-text-2" />
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

// Menubar SubContent component
export interface MenubarSubContentProps
  extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>,
    VariantProps<typeof menubarContentVariants> {
  /**
   * Size of the sub content
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the sub content
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  MenubarSubContentProps
>(({ size = 'md', variant = 'default', className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-surface p-1 text-text-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      menubarContentVariants({ size, variant }),
      className
    )}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

// Menubar Shortcut component
export interface MenubarShortcutProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof menubarShortcutVariants> {
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

const MenubarShortcut: React.FC<MenubarShortcutProps> = ({
  size = 'md',
  className,
  ...props
}) => {
  return (
    <span
      className={cn(menubarShortcutVariants({ size }), className)}
      {...props}
    />
  );
};
MenubarShortcut.displayName = 'MenubarShortcut';

// Simple Menubar component
export interface SimpleMenubarProps {
  /**
   * Size of the menubar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the menubar
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Menubar items configuration
   */
  items: Array<{
    label: string;
    value: string;
    items?: Array<{
      label: string;
      value: string;
      onClick?: () => void;
      disabled?: boolean;
      shortcut?: string;
      separator?: boolean;
    }>;
  }>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleMenubar: React.FC<SimpleMenubarProps> = ({
  size = 'md',
  variant = 'default',
  items,
  className,
}) => {
  return (
    <Menubar size={size} variant={variant} className={className}>
      {items.map((menu) => (
        <MenubarMenu key={menu.value}>
          <MenubarTrigger size={size} variant={variant}>
            {menu.label}
          </MenubarTrigger>
          <MenubarContent size={size} variant={variant}>
            {menu.items?.map((item) => (
              <React.Fragment key={item.value}>
                {item.separator && <MenubarSeparator />}
                <MenubarItem
                  size={size}
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {item.label}
                  {item.shortcut && (
                    <MenubarShortcut size={size}>
                      {item.shortcut}
                    </MenubarShortcut>
                  )}
                </MenubarItem>
              </React.Fragment>
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
};

export {
  menubarVariants,
  menubarTriggerVariants,
  menubarContentVariants,
  menubarItemVariants,
  menubarLabelVariants,
  menubarShortcutVariants,
};

export {
  Menubar,
  SimpleMenubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};

export default Menubar;
