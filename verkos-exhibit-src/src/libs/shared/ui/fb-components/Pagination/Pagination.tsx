import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const paginationVariants = cva('mx-auto flex w-full justify-center', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    },
    variant: {
      default: '',
      outline: '',
      ghost: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

const paginationContentVariants = cva('flex flex-row items-center', {
  variants: {
    size: {
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-1.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const paginationLinkVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-transparent text-text-2 hover:bg-surface-hover hover:text-text-1',
        active: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm',
        outline:
          'border border-outline-primary bg-transparent text-text-2 hover:bg-surface-hover hover:text-text-1',
        ghost:
          'bg-transparent text-text-2 hover:bg-surface-hover hover:text-text-1',
      },
      size: {
        sm: 'h-8 w-8 text-sm rounded-md fb-body-4',
        md: 'h-9 w-9 text-sm rounded-md fb-body-2',
        lg: 'h-10 w-10 text-base rounded-md fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const paginationNavLinkVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-transparent text-text-2 hover:bg-surface-hover hover:text-text-1',
        outline:
          'border border-outline-primary bg-transparent text-text-2 hover:bg-surface-hover hover:text-text-1',
        ghost:
          'bg-transparent text-text-2 hover:bg-surface-hover hover:text-text-1',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md fb-body-4',
        md: 'h-9 px-4 text-sm rounded-md fb-body-2',
        lg: 'h-10 px-5 text-base rounded-md fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Root Pagination component
export interface PaginationProps
  extends React.ComponentProps<'nav'>,
    VariantProps<typeof paginationVariants> {
  /**
   * Size of the pagination
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the pagination
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ size = 'md', variant = 'default', className, ...props }, ref) => (
    <nav
      ref={ref}
      role="navigation"
      aria-label="pagination"
      className={cn(paginationVariants({ size, variant }), className)}
      {...props}
    />
  )
);
Pagination.displayName = 'Pagination';

// Pagination Content component
export interface PaginationContentProps
  extends React.ComponentProps<'ul'>,
    VariantProps<typeof paginationContentVariants> {
  /**
   * Size of the pagination content
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  PaginationContentProps
>(({ size = 'md', className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(paginationContentVariants({ size }), className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

// Pagination Item component
export interface PaginationItemProps extends React.ComponentProps<'li'> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PaginationItem = React.forwardRef<HTMLLIElement, PaginationItemProps>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  )
);
PaginationItem.displayName = 'PaginationItem';

// Pagination Link component
export interface PaginationLinkProps
  extends React.ComponentProps<'a'>,
    VariantProps<typeof paginationLinkVariants> {
  /**
   * Whether the link is active (current page)
   * @default false
   */
  isActive?: boolean;
  /**
   * Size of the pagination link
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the pagination link
   * @default 'default'
   */
  variant?: 'default' | 'active' | 'outline' | 'ghost';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  (
    { isActive = false, size = 'md', variant = 'default', className, ...props },
    ref
  ) => (
    <a
      ref={ref}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        paginationLinkVariants({
          variant: isActive ? 'active' : variant,
          size,
        }),
        className
      )}
      {...props}
    />
  )
);
PaginationLink.displayName = 'PaginationLink';

// Pagination Previous component
export interface PaginationPreviousProps
  extends React.ComponentProps<typeof PaginationLink> {
  /**
   * Whether to show the "Previous" text
   * @default true
   */
  showText?: boolean;
  /**
   * Custom text for previous button
   * @default 'Previous'
   */
  text?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PaginationPrevious = React.forwardRef<
  HTMLAnchorElement,
  PaginationPreviousProps
>(
  (
    { showText = true, text = 'Previous', size = 'md', className, ...props },
    ref
  ) => {
    const gapClasses = {
      sm: 'gap-1 pl-2',
      md: 'gap-1 pl-2.5',
      lg: 'gap-1.5 pl-3',
    };

    return (
      <a
        ref={ref}
        aria-label="Go to previous page"
        className={cn(
          paginationNavLinkVariants({ size }),
          showText && gapClasses[size],
          className
        )}
        {...props}
      >
        <i className="fa-solid fa-chevron-left h-4 w-4" />
        {showText && <span className="fb-body-2">{text}</span>}
      </a>
    );
  }
);
PaginationPrevious.displayName = 'PaginationPrevious';

// Pagination Next component
export interface PaginationNextProps
  extends React.ComponentProps<typeof PaginationLink> {
  /**
   * Whether to show the "Next" text
   * @default true
   */
  showText?: boolean;
  /**
   * Custom text for next button
   * @default 'Next'
   */
  text?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PaginationNext = React.forwardRef<HTMLAnchorElement, PaginationNextProps>(
  (
    { showText = true, text = 'Next', size = 'md', className, ...props },
    ref
  ) => {
    const gapClasses = {
      sm: 'gap-1 pr-2',
      md: 'gap-1 pr-2.5',
      lg: 'gap-1.5 pr-3',
    };

    return (
      <a
        ref={ref}
        aria-label="Go to next page"
        className={cn(
          paginationNavLinkVariants({ size }),
          showText && gapClasses[size],
          className
        )}
        {...props}
      >
        {showText && <span className="fb-body-2">{text}</span>}
        <i className="fa-solid fa-chevron-right h-4 w-4" />
      </a>
    );
  }
);
PaginationNext.displayName = 'PaginationNext';

// Pagination Ellipsis component
export interface PaginationEllipsisProps
  extends React.ComponentProps<'span'>,
    Pick<VariantProps<typeof paginationLinkVariants>, 'size'> {
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

const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  PaginationEllipsisProps
>(({ size = 'md', className, ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        'flex items-center justify-center text-text-3',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <i className="fa-solid fa-ellipsis h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
});
PaginationEllipsis.displayName = 'PaginationEllipsis';

// Simple Pagination component
export interface SimplePaginationProps {
  /**
   * Current page number
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Size of the pagination
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the pagination
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Maximum number of page buttons to show
   * @default 5
   */
  maxVisible?: number;
  /**
   * Whether to show previous/next buttons
   * @default true
   */
  showNavigation?: boolean;
  /**
   * Whether to show text in navigation buttons
   * @default true
   */
  showNavigationText?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  size = 'md',
  variant = 'default',
  maxVisible = 5,
  showNavigation = true,
  showNavigationText = true,
  className,
}) => {
  const getVisiblePages = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 1;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination size={size} variant={variant} className={className}>
      <PaginationContent size={size}>
        {showNavigation && (
          <PaginationItem>
            <PaginationPrevious
              size={size}
              showText={showNavigationText}
              onClick={() => handlePageChange(currentPage - 1)}
              className={
                currentPage === 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        )}

        {showStartEllipsis && (
          <>
            <PaginationItem>
              <PaginationLink
                size={size}
                variant={variant}
                onClick={() => handlePageChange(1)}
                className="cursor-pointer"
              >
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis size={size} />
            </PaginationItem>
          </>
        )}

        {visiblePages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              size={size}
              variant={variant}
              isActive={page === currentPage}
              onClick={() => handlePageChange(page)}
              className="cursor-pointer"
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {showEndEllipsis && (
          <>
            <PaginationItem>
              <PaginationEllipsis size={size} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                size={size}
                variant={variant}
                onClick={() => handlePageChange(totalPages)}
                className="cursor-pointer"
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        {showNavigation && (
          <PaginationItem>
            <PaginationNext
              size={size}
              showText={showNavigationText}
              onClick={() => handlePageChange(currentPage + 1)}
              className={
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  SimplePagination,
  paginationVariants,
  paginationContentVariants,
  paginationLinkVariants,
  paginationNavLinkVariants,
};

export default Pagination;
