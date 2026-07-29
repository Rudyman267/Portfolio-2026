import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const tableVariants = cva('w-full caption-bottom fb-body-2 border-collapse', {
  variants: {
    variant: {
      default: 'bg-surface text-text-1',
      striped:
        'bg-surface text-text-1 [&_tbody_tr:nth-child(odd)]:bg-surface-hover',
      bordered: 'bg-surface text-text-1 border border-outline-primary',
      minimal: 'bg-transparent text-text-1',
    },
    size: {
      sm: 'text-sm fb-body-4',
      md: 'text-sm fb-body-2',
      lg: 'text-base fb-body-1',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const tableContainerVariants = cva('relative w-full overflow-auto', {
  variants: {
    variant: {
      default: 'rounded-lg border border-outline-primary',
      striped: 'rounded-lg border border-outline-primary',
      bordered: 'rounded-lg',
      minimal: 'rounded-none border-none',
    },
    maxHeight: {
      none: 'max-h-none',
      sm: 'max-h-96',
      md: 'max-h-[500px]',
      lg: 'max-h-[600px]',
      xl: 'max-h-[800px]',
    },
  },
  defaultVariants: {
    variant: 'default',
    maxHeight: 'none',
  },
});

const tableHeaderVariants = cva(
  'sticky top-0 z-10 bg-surface-hover [&_tr]:border-b border-outline-primary',
  {
    variants: {
      variant: {
        default: 'bg-surface-hover',
        elevated: 'bg-surface shadow-sm',
        minimal: 'bg-transparent border-b border-outline-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tableRowVariants = cva(
  'transition-colors border-b border-outline-primary',
  {
    variants: {
      variant: {
        default: 'hover:bg-surface-hover data-[state=selected]:bg-primary-50',
        interactive:
          'hover:bg-surface-hover cursor-pointer data-[state=selected]:bg-primary-50',
        static: 'hover:bg-transparent',
      },
      state: {
        default: '',
        selected: 'bg-primary-50 border-primary-200',
        disabled: 'opacity-50 cursor-not-allowed hover:bg-transparent',
        error: 'bg-error-50 border-error-200',
        warning: 'bg-warning-50 border-warning-200',
        success: 'bg-success-50 border-success-200',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
    },
  }
);

const tableCellVariants = cva('align-middle [&:has([role=checkbox])]:pr-0', {
  variants: {
    variant: {
      default: 'p-4 border-r border-outline-primary last:border-r-0',
      compact: 'p-2 border-r border-outline-primary last:border-r-0',
      spacious: 'p-6 border-r border-outline-primary last:border-r-0',
      minimal: 'p-4 border-r-0',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'default',
    align: 'left',
  },
});

const tableHeadVariants = cva(
  'h-12 align-middle font-medium text-text-2 [&:has([role=checkbox])]:pr-0',
  {
    variants: {
      variant: {
        default:
          'px-4 text-left border-r border-outline-primary last:border-r-0',
        compact:
          'px-2 text-left border-r border-outline-primary last:border-r-0',
        spacious:
          'px-6 text-left border-r border-outline-primary last:border-r-0',
        minimal: 'px-4 text-left border-r-0',
      },
      sortable: {
        false: '',
        true: 'cursor-pointer hover:bg-surface-hover transition-colors',
      },
    },
    defaultVariants: {
      variant: 'default',
      sortable: false,
    },
  }
);

// Container component
export interface TableContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tableContainerVariants> {
  /**
   * Visual variant of the table container
   * @default 'default'
   */
  variant?: 'default' | 'striped' | 'bordered' | 'minimal';
  /**
   * Maximum height of the table container
   * @default 'none'
   */
  maxHeight?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  (
    { variant = 'default', maxHeight = 'none', className, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(tableContainerVariants({ variant, maxHeight, className }))}
      {...props}
    >
      {children}
    </div>
  )
);
TableContainer.displayName = 'TableContainer';

// Table component
export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  /**
   * Visual variant of the table
   * @default 'default'
   */
  variant?: 'default' | 'striped' | 'bordered' | 'minimal';
  /**
   * Size of the table
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ variant = 'default', size = 'md', className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn(tableVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Table.displayName = 'Table';

// Header component
export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableHeaderVariants> {
  /**
   * Visual variant of the table header
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'minimal';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(tableHeaderVariants({ variant, className }))}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

// Body component
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

// Footer component
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-outline-primary bg-surface-hover font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

// Row component
export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {
  /**
   * Visual variant of the table row
   * @default 'default'
   */
  variant?: 'default' | 'interactive' | 'static';
  /**
   * State of the table row
   * @default 'default'
   */
  state?: 'default' | 'selected' | 'disabled' | 'error' | 'warning' | 'success';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ variant = 'default', state = 'default', className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(tableRowVariants({ variant, state, className }))}
      data-state={state !== 'default' ? state : undefined}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

// Head cell component
export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableHeadVariants> {
  /**
   * Visual variant of the table head
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'spacious' | 'minimal';
  /**
   * Whether the column is sortable
   * @default false
   */
  sortable?: boolean;
  /**
   * Sort icon to display
   */
  sortIcon?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      variant = 'default',
      sortable = false,
      sortIcon,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <th
      ref={ref}
      className={cn(tableHeadVariants({ variant, sortable, className }))}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && sortIcon && (
          <span className="flex items-center text-text-3">{sortIcon}</span>
        )}
      </div>
    </th>
  )
);
TableHead.displayName = 'TableHead';

// Cell component
export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {
  /**
   * Visual variant of the table cell
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'spacious' | 'minimal';
  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ variant = 'default', align = 'left', className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(tableCellVariants({ variant, align, className }))}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

// Caption component
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-text-3 fb-body-4', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// Combined Table component for convenience
export interface CompleteTableProps {
  /**
   * Table data
   */
  data: Record<string, unknown>[];
  /**
   * Column definitions
   */
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  }>;
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'striped' | 'bordered' | 'minimal';
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Maximum height
   * @default 'none'
   */
  maxHeight?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Caption text
   */
  caption?: string;
  /**
   * Row selection
   */
  selectedRows?: string[];
  /**
   * Row selection callback
   */
  onRowSelect?: (selectedRows: string[]) => void;
  /**
   * Sort configuration
   */
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  /**
   * Sort callback
   */
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CompleteTable: React.FC<CompleteTableProps> = ({
  data,
  columns,
  variant = 'default',
  size = 'md',
  maxHeight = 'none',
  caption,
  selectedRows = [],
  onRowSelect,
  sortConfig,
  onSort,
  className,
}) => {
  const handleSort = (key: string) => {
    if (!onSort) return;

    const direction =
      sortConfig?.key === key && sortConfig?.direction === 'asc'
        ? 'desc'
        : 'asc';
    onSort(key, direction);
  };

  return (
    <TableContainer
      variant={variant}
      maxHeight={maxHeight}
      className={className}
    >
      <Table variant={variant} size={size}>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                sortable={column.sortable}
                sortIcon={
                  column.sortable && (
                    <i
                      className={cn(
                        'fa-solid text-xs transition-transform',
                        sortConfig?.key === column.key
                          ? sortConfig.direction === 'asc'
                            ? 'fa-chevron-up'
                            : 'fa-chevron-down'
                          : 'fa-sort'
                      )}
                    />
                  )
                }
                onClick={
                  column.sortable ? () => handleSort(column.key) : undefined
                }
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const rowId = String(index);
            const isSelected = selectedRows.includes(rowId);
            return (
              <TableRow
                key={index}
                variant="interactive"
                onClick={() =>
                  onRowSelect?.(
                    isSelected
                      ? selectedRows.filter((id) => id !== rowId)
                      : [...selectedRows, rowId]
                  )
                }
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(0, 128, 255, 0.1)'
                    : undefined,
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : (row[column.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  tableVariants,
  tableContainerVariants,
  tableHeaderVariants,
  tableRowVariants,
  tableCellVariants,
  tableHeadVariants,
  CompleteTable,
};

export default Table;
