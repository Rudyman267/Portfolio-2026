import React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/utils';

const navigationMenuVariants = cva(
  'relative z-10 flex max-w-max flex-1 items-center justify-center',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
      variant: {
        default: '',
        outline: '',
        ghost: '',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
    },
  }
);

const navigationMenuListVariants = cva(
  'group flex flex-1 list-none items-center justify-center space-x-1',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row space-x-1 space-y-0',
        vertical: 'flex-col space-x-0 space-y-1',
      },
      size: {
        sm: 'space-x-0.5',
        md: 'space-x-1',
        lg: 'space-x-2',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
  }
);

const navigationMenuTriggerVariants = cva(
  'group inline-flex w-max items-center justify-center rounded-md bg-surface text-text-1 font-medium transition-colors hover:bg-surface-hover hover:text-text-1 focus:bg-surface-hover focus:text-text-1 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-surface-hover/50 data-[state=open]:bg-surface-hover/50 fb-body-3',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 py-1.5 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 py-3 text-base',
      },
      variant: {
        default: 'bg-surface text-text-1',
        outline: 'border border-outline-primary bg-surface text-text-1',
        ghost: 'bg-transparent text-text-1 hover:bg-surface-hover',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const navigationMenuContentVariants = cva(
  'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto',
  {
    variants: {
      size: {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
      variant: {
        default: 'bg-surface text-text-1',
        outline: 'bg-surface text-text-1 border border-outline-primary',
        ghost: 'bg-surface text-text-1 shadow-sm',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const navigationMenuViewportVariants = cva(
  'origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-surface text-text-1 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]',
  {
    variants: {
      variant: {
        default: 'border-outline-primary bg-surface',
        outline: 'border-outline-primary bg-surface',
        ghost: 'border-outline-tertiary bg-surface shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const navigationMenuIndicatorVariants = cva(
  'top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in',
  {
    variants: {
      variant: {
        default: '',
        outline: '',
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Root components (re-export Radix primitives)
const NavigationMenuItem = NavigationMenuPrimitive.Item;
const NavigationMenuLink = NavigationMenuPrimitive.Link;

// NavigationMenu root component
export interface NavigationMenuProps
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>,
    VariantProps<typeof navigationMenuVariants> {
  /**
   * Orientation of the navigation menu
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Visual variant of the navigation menu
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  NavigationMenuProps
>(
  (
    {
      orientation = 'horizontal',
      variant = 'default',
      className,
      children,
      ...props
    },
    ref
  ) => (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn(
        navigationMenuVariants({ orientation, variant }),
        className
      )}
      {...props}
    >
      {children}
      <NavigationMenuViewport variant={variant} />
    </NavigationMenuPrimitive.Root>
  )
);
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

// NavigationMenu List component
export interface NavigationMenuListProps
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>,
    VariantProps<typeof navigationMenuListVariants> {
  /**
   * Orientation of the navigation menu list
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Size of the navigation menu list
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  NavigationMenuListProps
>(({ orientation = 'horizontal', size = 'md', className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(navigationMenuListVariants({ orientation, size }), className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

// NavigationMenu Trigger component
export interface NavigationMenuTriggerProps
  extends React.ComponentPropsWithoutRef<
      typeof NavigationMenuPrimitive.Trigger
    >,
    VariantProps<typeof navigationMenuTriggerVariants> {
  /**
   * Size of the navigation menu trigger
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the navigation menu trigger
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Whether to show the chevron indicator
   * @default true
   */
  showChevron?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  NavigationMenuTriggerProps
>(
  (
    {
      size = 'md',
      variant = 'default',
      showChevron = true,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn(
        navigationMenuTriggerVariants({ size, variant }),
        'group',
        className
      )}
      {...props}
    >
      {children}
      {showChevron && (
        <ChevronDown
          className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180 text-text-2"
          aria-hidden="true"
        />
      )}
    </NavigationMenuPrimitive.Trigger>
  )
);
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

// NavigationMenu Content component
export interface NavigationMenuContentProps
  extends React.ComponentPropsWithoutRef<
      typeof NavigationMenuPrimitive.Content
    >,
    VariantProps<typeof navigationMenuContentVariants> {
  /**
   * Size of the navigation menu content
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the navigation menu content
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  NavigationMenuContentProps
>(({ size = 'md', variant = 'default', className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(navigationMenuContentVariants({ size, variant }), className)}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

// NavigationMenu Viewport component
export interface NavigationMenuViewportProps
  extends React.ComponentPropsWithoutRef<
      typeof NavigationMenuPrimitive.Viewport
    >,
    VariantProps<typeof navigationMenuViewportVariants> {
  /**
   * Visual variant of the navigation menu viewport
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  NavigationMenuViewportProps
>(({ variant = 'default', className, ...props }, ref) => (
  <div className={cn('absolute left-0 top-full flex justify-center')}>
    <NavigationMenuPrimitive.Viewport
      className={cn(navigationMenuViewportVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName;

// NavigationMenu Indicator component
export interface NavigationMenuIndicatorProps
  extends React.ComponentPropsWithoutRef<
      typeof NavigationMenuPrimitive.Indicator
    >,
    VariantProps<typeof navigationMenuIndicatorVariants> {
  /**
   * Visual variant of the navigation menu indicator
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  NavigationMenuIndicatorProps
>(({ variant = 'default', className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(navigationMenuIndicatorVariants({ variant }), className)}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-outline-primary shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;

// Simple NavigationMenu component
export interface SimpleNavigationMenuProps {
  /**
   * Size of the navigation menu
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the navigation menu
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Orientation of the navigation menu
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Navigation items configuration
   */
  items: Array<{
    label: string;
    href?: string;
    content?: React.ReactNode;
    disabled?: boolean;
    showChevron?: boolean;
  }>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleNavigationMenu: React.FC<SimpleNavigationMenuProps> = ({
  size = 'md',
  variant = 'default',
  orientation = 'horizontal',
  items,
  className,
}) => {
  return (
    <NavigationMenu
      orientation={orientation}
      variant={variant}
      className={className}
    >
      <NavigationMenuList orientation={orientation} size={size}>
        {items.map((item, index) => (
          <NavigationMenuItem key={index}>
            {item.content ? (
              <>
                <NavigationMenuTrigger
                  size={size}
                  variant={variant}
                  showChevron={item.showChevron}
                  disabled={item.disabled}
                >
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent size={size} variant={variant}>
                  {item.content}
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                href={item.href}
                className={cn(
                  navigationMenuTriggerVariants({ size, variant }),
                  item.disabled && 'pointer-events-none opacity-50'
                )}
              >
                {item.label}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
        <NavigationMenuIndicator variant={variant} />
      </NavigationMenuList>
    </NavigationMenu>
  );
};

// Header NavigationMenu component
export interface HeaderNavigationMenuProps {
  /**
   * Size of the navigation menu
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Navigation items configuration
   */
  items: Array<{
    label: string;
    href?: string;
    items?: Array<{
      label: string;
      href: string;
      description?: string;
      icon?: React.ReactNode;
    }>;
  }>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const HeaderNavigationMenu: React.FC<HeaderNavigationMenuProps> = ({
  size = 'md',
  items,
  className,
}) => {
  return (
    <NavigationMenu variant="ghost" className={className}>
      <NavigationMenuList size={size}>
        {items.map((item, index) => (
          <NavigationMenuItem key={index}>
            {item.items ? (
              <>
                <NavigationMenuTrigger size={size} variant="ghost">
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent size={size} variant="ghost">
                  <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-surface-hover p-6 no-underline outline-none focus:shadow-md"
                          href={item.href}
                        >
                          <div className="mb-2 mt-4 text-lg font-medium fb-heading-3">
                            {item.label}
                          </div>
                          <p className="text-sm leading-tight text-text-2 fb-body-4">
                            Explore {item.label.toLowerCase()} features and
                            options
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </div>
                    {item.items.map((subItem, subIndex) => (
                      <div key={subIndex} className="grid gap-1">
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-surface-hover focus:bg-surface-hover"
                            href={subItem.href}
                          >
                            <div className="flex items-center space-x-2">
                              {subItem.icon}
                              <div className="text-sm font-medium leading-none fb-body-3">
                                {subItem.label}
                              </div>
                            </div>
                            {subItem.description && (
                              <p className="line-clamp-2 text-sm leading-snug text-text-2 fb-body-4">
                                {subItem.description}
                              </p>
                            )}
                          </a>
                        </NavigationMenuLink>
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                href={item.href}
                className={cn(
                  navigationMenuTriggerVariants({ size, variant: 'ghost' })
                )}
              >
                {item.label}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
        <NavigationMenuIndicator variant="ghost" />
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export {
  navigationMenuVariants,
  navigationMenuListVariants,
  navigationMenuTriggerVariants,
  navigationMenuContentVariants,
  navigationMenuViewportVariants,
  navigationMenuIndicatorVariants,
};

export {
  NavigationMenu,
  SimpleNavigationMenu,
  HeaderNavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};

export default NavigationMenu;
