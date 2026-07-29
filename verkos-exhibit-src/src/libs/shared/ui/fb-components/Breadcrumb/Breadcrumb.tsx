import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const breadcrumbVariants = cva(
  'flex flex-wrap items-center gap-1.5 break-words transition-colors sm:gap-2.5',
  {
    variants: {
      size: {
        sm: 'text-sm gap-1 sm:gap-1.5',
        md: 'text-sm gap-1.5 sm:gap-2.5',
        lg: 'text-base gap-2 sm:gap-3',
      },
      variant: {
        default: 'text-text-3',
        muted: 'text-text-3',
        subtle: 'text-text-2',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const breadcrumbItemVariants = cva(
  'inline-flex items-center gap-1.5 transition-colors',
  {
    variants: {
      size: {
        sm: 'gap-1',
        md: 'gap-1.5',
        lg: 'gap-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const breadcrumbLinkVariants = cva(
  'transition-colors hover:text-text-1 focus:text-text-1 focus:outline-none focus:ring-2 focus:ring-primary-200 rounded-sm',
  {
    variants: {
      variant: {
        default: 'text-text-3 hover:text-text-1',
        muted: 'text-text-3 hover:text-text-2',
        subtle: 'text-text-2 hover:text-text-1',
      },
      size: {
        sm: 'fb-body-4 text-sm',
        md: 'fb-body-2 text-sm',
        lg: 'fb-body-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const breadcrumbPageVariants = cva('font-normal text-text-1', {
  variants: {
    size: {
      sm: 'fb-body-4 text-sm',
      md: 'fb-body-2 text-sm',
      lg: 'fb-body-1 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const breadcrumbSeparatorVariants = cva(
  'flex items-center justify-center text-text-3',
  {
    variants: {
      size: {
        sm: 'text-sm [&>svg]:size-3',
        md: 'text-sm [&>svg]:size-3.5',
        lg: 'text-base [&>svg]:size-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// Root Breadcrumb component
export interface BreadcrumbProps
  extends React.ComponentPropsWithoutRef<'nav'>,
    VariantProps<typeof breadcrumbVariants> {
  /**
   * Size of the breadcrumb
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the breadcrumb
   * @default 'default'
   */
  variant?: 'default' | 'muted' | 'subtle';
  /**
   * Custom separator between breadcrumb items
   */
  separator?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ size = 'md', variant = 'default', className, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn(breadcrumbVariants({ size, variant }), className)}
      {...props}
    />
  )
);
Breadcrumb.displayName = 'Breadcrumb';

// Breadcrumb List component
export interface BreadcrumbListProps
  extends React.ComponentPropsWithoutRef<'ol'>,
    VariantProps<typeof breadcrumbVariants> {
  /**
   * Size of the breadcrumb list
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the breadcrumb list
   * @default 'default'
   */
  variant?: 'default' | 'muted' | 'subtle';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ size = 'md', variant = 'default', className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(breadcrumbVariants({ size, variant }), className)}
      {...props}
    />
  )
);
BreadcrumbList.displayName = 'BreadcrumbList';

// Breadcrumb Item component
export interface BreadcrumbItemProps
  extends React.ComponentPropsWithoutRef<'li'>,
    VariantProps<typeof breadcrumbItemVariants> {
  /**
   * Size of the breadcrumb item
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn(breadcrumbItemVariants({ size }), className)}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

// Breadcrumb Link component
export interface BreadcrumbLinkProps
  extends React.ComponentPropsWithoutRef<'a'>,
    VariantProps<typeof breadcrumbLinkVariants> {
  /**
   * Render as child component
   */
  asChild?: boolean;
  /**
   * Visual variant of the link
   * @default 'default'
   */
  variant?: 'default' | 'muted' | 'subtle';
  /**
   * Size of the link
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  (
    { asChild = false, variant = 'default', size = 'md', className, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'a';

    return (
      <Comp
        ref={ref}
        className={cn(breadcrumbLinkVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

// Breadcrumb Page component
export interface BreadcrumbPageProps
  extends React.ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof breadcrumbPageVariants> {
  /**
   * Size of the current page
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(breadcrumbPageVariants({ size }), className)}
      {...props}
    />
  )
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

// Breadcrumb Separator component
export interface BreadcrumbSeparatorProps
  extends React.ComponentProps<'li'>,
    VariantProps<typeof breadcrumbSeparatorVariants> {
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

const BreadcrumbSeparator = React.forwardRef<
  HTMLLIElement,
  BreadcrumbSeparatorProps
>(({ size = 'md', children, className, ...props }, ref) => (
  <li
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn(breadcrumbSeparatorVariants({ size }), className)}
    {...props}
  >
    {children ?? <i className="fa-solid fa-chevron-right" />}
  </li>
));
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

// Breadcrumb Ellipsis component
export interface BreadcrumbEllipsisProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof breadcrumbSeparatorVariants> {
  /**
   * Size of the ellipsis
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbEllipsisProps
>(({ size = 'md', className, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn(
      'flex items-center justify-center',
      size === 'sm' && 'h-8 w-8',
      size === 'md' && 'h-9 w-9',
      size === 'lg' && 'h-10 w-10',
      className
    )}
    {...props}
  >
    <i className="fa-solid fa-ellipsis text-text-3" />
    <span className="sr-only">More</span>
  </span>
));
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

// Combined Breadcrumb component for convenience
export interface SimpleBreadcrumbProps {
  /**
   * Array of breadcrumb items
   */
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    current?: boolean;
  }>;
  /**
   * Size of the breadcrumb
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the breadcrumb
   * @default 'default'
   */
  variant?: 'default' | 'muted' | 'subtle';
  /**
   * Custom separator between items
   */
  separator?: React.ReactNode;
  /**
   * Maximum number of items to show before ellipsis
   * @default 3
   */
  maxItems?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleBreadcrumb: React.FC<SimpleBreadcrumbProps> = ({
  items,
  size = 'md',
  variant = 'default',
  separator,
  maxItems = 3,
  className,
}) => {
  const displayItems =
    items.length > maxItems
      ? [items[0], ...items.slice(-(maxItems - 1))]
      : items;

  const showEllipsis = items.length > maxItems;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList size={size} variant={variant}>
        {displayItems.map((item, index) => (
          <React.Fragment key={index}>
            {showEllipsis && index === 1 && (
              <>
                <BreadcrumbItem size={size}>
                  <BreadcrumbEllipsis size={size} />
                </BreadcrumbItem>
                <BreadcrumbSeparator size={size}>
                  {separator}
                </BreadcrumbSeparator>
              </>
            )}
            <BreadcrumbItem size={size}>
              {item.current ? (
                <BreadcrumbPage size={size}>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  size={size}
                  variant={variant}
                  href={item.href}
                  onClick={item.onClick}
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < displayItems.length - 1 && (
              <BreadcrumbSeparator size={size}>{separator}</BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  SimpleBreadcrumb,
  breadcrumbVariants,
  breadcrumbItemVariants,
  breadcrumbLinkVariants,
  breadcrumbPageVariants,
  breadcrumbSeparatorVariants,
};

export default Breadcrumb;
