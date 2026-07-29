import React from 'react';
import { DayPicker } from 'react-day-picker';
import { cva } from 'class-variance-authority';
import { cn } from '../../../utils/utils';
import Button from '../Button/Button';

const calendarVariants = cva(
  'border border-outline-primary rounded-lg bg-surface shadow-sm',
  {
    variants: {
      size: {
        sm: 'p-2 text-sm',
        md: 'p-3 text-sm',
        lg: 'p-4 text-base',
      },
      variant: {
        default: 'border-outline-primary bg-surface',
        outline: 'border-outline-primary bg-surface',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const dayButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-transparent text-text-1 hover:bg-surface-hover',
        selected:
          'bg-primary-500 text-white hover:bg-primary-600 focus:bg-primary-600',
        today: 'bg-accent-100 text-accent-700 hover:bg-accent-200',
        outside:
          'text-text-3 opacity-50 hover:bg-surface-hover hover:opacity-100',
        disabled: 'text-text-4 opacity-30',
      },
      size: {
        sm: 'h-7 w-7 text-xs rounded-md',
        md: 'h-8 w-8 text-sm rounded-md',
        lg: 'h-9 w-9 text-base rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const navButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-6 w-6 text-xs',
        md: 'h-7 w-7 text-sm',
        lg: 'h-8 w-8 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// Root Calendar component
export type CalendarProps = Omit<
  React.ComponentProps<typeof DayPicker>,
  'onSelect' | 'selected'
> & {
  /**
   * Size of the calendar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the calendar
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Whether to show days outside the current month
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * The selected date(s) - can be Date, Date[], or DateRange
   */
  selected?: any;
  /**
   * Callback when date selection changes
   */
  onSelect?: (selected: any) => void;
  /**
   * Callback when Apply Filter is clicked
   */
  onApplyFilter: (selected: any) => void;
  /**
   * Callback when Clear Filter is clicked
   */
  onClearFilter: () => void;
  /**
   * Text for the Apply button
   * @default 'Apply Filter'
   */
  applyButtonText?: string;
  /**
   * Text for the Clear button
   * @default 'Clear'
   */
  clearButtonText?: string;
};

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      size = 'md',
      variant = 'default',
      showOutsideDays = true,
      className,
      classNames,
      onApplyFilter,
      onClearFilter,
      applyButtonText = 'Apply Filter',
      clearButtonText = 'Clear',
      selected,
      onSelect,
      ...props
    },
    ref
  ) => {
    // Internal state for pending selection - always deferred now
    const [pendingSelection, setPendingSelection] =
      React.useState<any>(selected);
    const [appliedSelection, setAppliedSelection] =
      React.useState<any>(selected);

    // Update pending selection when external selected changes
    React.useEffect(() => {
      setPendingSelection(selected);
      setAppliedSelection(selected);
    }, [selected]);

    // Handle date selection - always store internally first
    const handleDateSelect = React.useCallback((newSelection: any) => {
      setPendingSelection(newSelection);
    }, []);

    // Handle Apply Filter
    const handleApplyFilter = React.useCallback(() => {
      setAppliedSelection(pendingSelection);
      onApplyFilter(pendingSelection);
      onSelect?.(pendingSelection);
    }, [pendingSelection, onApplyFilter, onSelect]);

    // Handle Clear Filter
    const handleClearFilter = React.useCallback(() => {
      setPendingSelection(undefined);
      setAppliedSelection(undefined);
      onClearFilter();
      onSelect?.(undefined);
    }, [onClearFilter, onSelect]);

    // Check if there are pending changes
    const hasPendingChanges = React.useMemo(() => {
      return (
        JSON.stringify(pendingSelection) !== JSON.stringify(appliedSelection)
      );
    }, [pendingSelection, appliedSelection]);

    // Always use pending selection for display
    const displaySelection = pendingSelection;

    const sizeMap = {
      sm: {
        day: 'sm' as const,
        nav: 'sm' as const,
        cell: 'h-7 w-7',
        head: 'text-xs',
      },
      md: {
        day: 'md' as const,
        nav: 'md' as const,
        cell: 'h-8 w-8',
        head: 'text-sm',
      },
      lg: {
        day: 'lg' as const,
        nav: 'lg' as const,
        cell: 'h-9 w-9',
        head: 'text-base',
      },
    };

    const currentSize = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn(calendarVariants({ size, variant }), className)}
      >
        {/* @ts-expect-error - DayPicker mode types are overly strict */}
        <DayPicker
          showOutsideDays={showOutsideDays}
          className="w-full"
          selected={displaySelection}
          onSelect={handleDateSelect}
          classNames={{
            months:
              'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: cn(
              'fb-body-2 font-medium text-text-1',
              size === 'sm' && 'fb-body-4',
              size === 'lg' && 'fb-body-1'
            ),
            nav: 'space-x-1 flex items-center',
            nav_button: cn(
              navButtonVariants({ size: currentSize.nav }),
              'bg-transparent text-text-3 hover:bg-surface-hover hover:text-text-1 opacity-70 hover:opacity-100'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1 table-fixed',
            head_row: 'flex',
            head_cell: cn(
              'text-text-3 rounded-md font-normal fb-body-4 flex items-center justify-center',
              currentSize.cell,
              currentSize.head
            ),
            row: 'flex w-full mt-2',
            cell: cn(
              'flex items-center justify-center text-sm p-0 relative',
              currentSize.cell,
              '[&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-end)]:bg-primary-100',
              '[&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-start)]:bg-primary-100',
              '[&:has([aria-selected].day-outside)]:bg-primary-50',
              '[&:has([aria-selected])]:bg-primary-50',
              'first:[&:has([aria-selected])]:rounded-l-md',
              'last:[&:has([aria-selected])]:rounded-r-md',
              'focus-within:relative focus-within:z-20',
              // Visual indicator for pending changes
              hasPendingChanges &&
                '[&:has([aria-selected])]:ring-2 [&:has([aria-selected])]:ring-semantic-warning-200'
            ),
            day: cn(
              dayButtonVariants({ size: currentSize.day }),
              'font-normal aria-selected:opacity-100'
            ),
            day_range_start: 'day-range-start',
            day_range_end: 'day-range-end',
            day_selected: cn(
              dayButtonVariants({ variant: 'selected', size: currentSize.day }),
              'aria-selected:bg-primary-500 aria-selected:text-white hover:aria-selected:bg-primary-600',
              // Pending state styling
              hasPendingChanges && 'ring-2 ring-semantic-warning-200'
            ),
            day_today: cn(
              dayButtonVariants({ variant: 'today', size: currentSize.day }),
              'bg-accent-100 text-accent-700 font-medium'
            ),
            day_outside: cn(
              dayButtonVariants({ variant: 'outside', size: currentSize.day }),
              'day-outside',
              'aria-selected:bg-accent-50 aria-selected:text-text-3 aria-selected:opacity-30'
            ),
            day_disabled: cn(
              dayButtonVariants({ variant: 'disabled', size: currentSize.day })
            ),
            day_range_middle:
              'aria-selected:bg-primary-100 aria-selected:text-primary-800 hover:aria-selected:bg-primary-200',
            day_hidden: 'invisible',
            ...classNames,
          }}
          components={{
            IconLeft: () => <i className="fa-solid fa-chevron-left text-xs" />,
            IconRight: () => (
              <i className="fa-solid fa-chevron-right text-xs" />
            ),
          }}
          {...props}
        />

        {/* Action Buttons - Always visible */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-primary mt-3">
          {/* Clear Button */}
          <Button
            onClick={handleClearFilter}
            disabled={!displaySelection}
            variant="outline"
            size="sm"
            className="fb-body-4"
          >
            {clearButtonText}
          </Button>

          {/* Apply Button - Always visible */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleApplyFilter}
              disabled={!pendingSelection}
              variant={hasPendingChanges ? 'primary' : 'secondary'}
              size="sm"
              className={cn(
                'fb-body-4',
                hasPendingChanges && 'ring-2 ring-semantic-warning-200'
              )}
            >
              {applyButtonText}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

// Date Range Calendar component
export interface DateRangeCalendarProps {
  /**
   * The selected date range
   */
  selected?: { from?: Date; to?: Date };
  /**
   * Callback when date range changes
   */
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
  /**
   * Number of months to display
   * @default 2
   */
  numberOfMonths?: number;
  /**
   * Size of the calendar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the calendar
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Whether to show days outside the current month
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when Apply Filter is clicked
   */
  onApplyFilter: (selected: any) => void;
  /**
   * Callback when Clear Filter is clicked
   */
  onClearFilter: () => void;
  /**
   * Text for the Apply button
   */
  applyButtonText?: string;
  /**
   * Text for the Clear button
   */
  clearButtonText?: string;
}

const DateRangeCalendar: React.FC<DateRangeCalendarProps> = ({
  selected,
  onSelect,
  numberOfMonths = 2,
  onApplyFilter,
  onClearFilter,
  ...props
}) => {
  return (
    <Calendar
      {...props}
      mode="range"
      selected={selected}
      onSelect={onSelect}
      onApplyFilter={onApplyFilter}
      onClearFilter={onClearFilter}
      numberOfMonths={numberOfMonths}
    />
  );
};

// Date Picker component for single date selection
export interface DatePickerProps {
  /**
   * The selected date
   */
  selected?: Date;
  /**
   * Callback when date changes
   */
  onSelect?: (date: Date | undefined) => void;
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string;
  /**
   * Whether to show the calendar in a popover
   * @default false
   */
  popover?: boolean;
  /**
   * Size of the calendar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the calendar
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Whether to show days outside the current month
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when Apply Filter is clicked
   */
  onApplyFilter: (selected: any) => void;
  /**
   * Callback when Clear Filter is clicked
   */
  onClearFilter: () => void;
  /**
   * Text for the Apply button
   */
  applyButtonText?: string;
  /**
   * Text for the Clear button
   */
  clearButtonText?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onSelect,
  popover = false,
  onApplyFilter,
  onClearFilter,
  applyButtonText,
  clearButtonText,
  ...props
}) => {
  if (popover) {
    // For popover version, we would need to integrate with a Popover component
    // For now, return inline version
    return (
      <Calendar
        {...props}
        selected={selected}
        onSelect={onSelect}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
        applyButtonText={applyButtonText}
        clearButtonText={clearButtonText}
      />
    );
  }

  return (
    <Calendar
      {...props}
      selected={selected}
      onSelect={onSelect}
      onApplyFilter={onApplyFilter}
      onClearFilter={onClearFilter}
      applyButtonText={applyButtonText}
      clearButtonText={clearButtonText}
    />
  );
};

// Simple Calendar component with preset configurations
export interface SimpleCalendarProps {
  /**
   * Calendar mode
   * @default 'single'
   */
  mode?: 'single' | 'range' | 'multiple';
  /**
   * The selected date(s)
   */
  selected?: Date | { from?: Date; to?: Date } | Date[];
  /**
   * Callback when selection changes
   */
  onSelect?: (
    date: Date | { from?: Date; to?: Date } | Date[] | undefined
  ) => void;
  /**
   * Size of the calendar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the calendar
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Whether to show days outside the current month
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Number of months to display
   * @default 1
   */
  numberOfMonths?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when Apply Filter is clicked
   */
  onApplyFilter: (selected: any) => void;
  /**
   * Callback when Clear Filter is clicked
   */
  onClearFilter: () => void;
  /**
   * Text for the Apply button
   */
  applyButtonText?: string;
  /**
   * Text for the Clear button
   */
  clearButtonText?: string;
}

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  mode = 'single',
  selected,
  onSelect,
  size = 'md',
  variant = 'default',
  showOutsideDays = true,
  numberOfMonths = 1,
  className,
  onApplyFilter,
  onClearFilter,
  applyButtonText,
  clearButtonText,
}) => {
  return (
    <Calendar
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      size={size}
      variant={variant}
      showOutsideDays={showOutsideDays}
      numberOfMonths={numberOfMonths}
      className={className}
      onApplyFilter={onApplyFilter}
      onClearFilter={onClearFilter}
      applyButtonText={applyButtonText}
      clearButtonText={clearButtonText}
    />
  );
};

export {
  Calendar,
  DateRangeCalendar,
  DatePicker,
  SimpleCalendar,
  calendarVariants,
  dayButtonVariants,
  navButtonVariants,
};

export default Calendar;
