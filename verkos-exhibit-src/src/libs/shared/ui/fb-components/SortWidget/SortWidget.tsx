import React, { useCallback, useState, useRef, ReactNode } from 'react';
import { cn } from '../../utils/utils';
import { Radio } from '../Radio';
import { Button } from '../Button';
import { Separator } from '../Separator';
import { useClickOutside } from '../../hooks';

export interface SortOption {
  /** Unique identifier for the sort option */
  id: string;
  /** Display label for the sort option */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

export interface SortDirection {
  /** Unique identifier for the sort direction */
  id: string;
  /** Display label for the sort direction */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

export type SortWidgetPlacement =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

export interface SortWidgetProps {
  /** Array of sort options to display */
  sortOptions: SortOption[];
  /** Array of sort direction options */
  sortDirections: SortDirection[];
  /** Currently selected sort option ID */
  selectedSortOption?: string;
  /** Currently selected sort direction ID */
  selectedSortDirection?: string;
  /** Callback when sort option is selected */
  onSortOptionChange?: (optionId: string) => void;
  /** Callback when sort direction is selected */
  onSortDirectionChange?: (directionId: string) => void;
  /** Callback when reset button is clicked */
  onReset?: () => void;
  /** Whether the reset button should be disabled */
  resetDisabled?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Width of the widget */
  width?: string;
  /** Maximum height before scrolling */
  maxHeight?: string;

  // Dropdown functionality
  /** Trigger element to toggle the sort widget (if provided, renders as dropdown) */
  trigger?: ReactNode;
  /** Placement of the dropdown relative to trigger */
  placement?: SortWidgetPlacement;
  /** Whether the dropdown is controlled externally */
  isOpen?: boolean;
  /** Callback when dropdown open state changes */
  onToggle?: (open: boolean) => void;
  /** Additional CSS class name for the trigger container */
  triggerClassName?: string;
}

const SortWidgetComponent: React.FC<SortWidgetProps> = ({
  sortOptions,
  sortDirections,
  selectedSortOption,
  selectedSortDirection,
  onSortOptionChange,
  onSortDirectionChange,
  onReset,
  resetDisabled = false,
  className = '',
  width = '220px',
  maxHeight = '300px',
  // Dropdown props
  trigger,
  placement = 'bottom-left',
  isOpen: controlledIsOpen,
  onToggle,
  triggerClassName = '',
}) => {
  // Internal state for dropdown (when not controlled)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Determine if we're in dropdown mode
  const isDropdownMode = !!trigger;

  // Use controlled or internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Handle dropdown close
  const handleClose = useCallback(() => {
    if (controlledIsOpen !== undefined && onToggle) {
      onToggle(false);
    } else {
      setInternalIsOpen(false);
    }
  }, [controlledIsOpen, onToggle]);

  // Handle dropdown toggle
  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    if (controlledIsOpen !== undefined && onToggle) {
      onToggle(newState);
    } else {
      setInternalIsOpen(newState);
    }
  }, [isOpen, controlledIsOpen, onToggle]);

  // Use click outside hook only in dropdown mode
  useClickOutside(
    [widgetRef, triggerRef],
    handleClose,
    isDropdownMode && isOpen
  );

  // Get placement classes for dropdown positioning
  const getPlacementClasses = useCallback(() => {
    switch (placement) {
      case 'bottom-right':
        return 'right-0 top-full mt-1';
      case 'top-left':
        return 'left-0 bottom-full mb-1';
      case 'top-right':
        return 'right-0 bottom-full mb-1';
      case 'bottom-left':
      default:
        return 'left-0 top-full mt-1';
    }
  }, [placement]);

  const handleSortOptionChange = useCallback(
    (optionId: string) => {
      if (onSortOptionChange) {
        onSortOptionChange(optionId);
      }
    },
    [onSortOptionChange]
  );

  const handleSortDirectionChange = useCallback(
    (directionId: string) => {
      if (onSortDirectionChange) {
        onSortDirectionChange(directionId);
      }
    },
    [onSortDirectionChange]
  );

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  // Widget content component
  const widgetContent = (
    <div
      ref={widgetRef}
      className={cn(
        'bg-background-level-1 rounded-lg border border-outline-primary shadow-lg',
        isDropdownMode && 'absolute z-50',
        isDropdownMode && getPlacementClasses(),
        className
      )}
      style={{ width, maxHeight }}
      role="menu"
      aria-label="Sort options"
    >
      {/* Scrollable content */}
      <div
        className="flex flex-col overflow-y-auto"
        style={{ maxHeight: `calc(${maxHeight} - 60px)` }}
      >
        <div className="flex flex-col gap-1 p-2">
          {/* Sort Options */}
          {sortOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded transition-colors',
                option.disabled
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer hover:bg-surface-hover'
              )}
              role="menuitemradio"
              aria-checked={selectedSortOption === option.id}
              onClick={
                option.disabled
                  ? undefined
                  : () => handleSortOptionChange(option.id)
              }
            >
              <Radio
                name="sortOption"
                value={option.id}
                checked={selectedSortOption === option.id}
                disabled={option.disabled}
                size="sm"
                aria-label={`Sort by ${option.label}`}
                onChange={() => undefined} // Dummy handler to prevent React warning - container onClick handles it
              />
              <span
                className={cn(
                  'fb-body2-regular select-none flex-1',
                  option.disabled ? 'text-text-disabled' : 'text-text-1'
                )}
              >
                {option.label}
              </span>
            </div>
          ))}

          {/* Divider */}
          {sortDirections.length > 0 && (
            <div className="px-2 py-1">
              <Separator className="bg-outline-primary" />
            </div>
          )}

          {/* Sort Directions */}
          {sortDirections.map((direction) => (
            <div
              key={direction.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded transition-colors',
                direction.disabled
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer hover:bg-surface-hover'
              )}
              role="menuitemradio"
              aria-checked={selectedSortDirection === direction.id}
              onClick={
                direction.disabled
                  ? undefined
                  : () => handleSortDirectionChange(direction.id)
              }
            >
              <Radio
                name="sortDirection"
                value={direction.id}
                checked={selectedSortDirection === direction.id}
                disabled={direction.disabled}
                size="sm"
                aria-label={`Sort ${direction.label.toLowerCase()}`}
                onChange={() => undefined} // Dummy handler to prevent React warning - container onClick handles it
              />
              <span
                className={cn(
                  'fb-body2-regular select-none flex-1',
                  direction.disabled ? 'text-text-disabled' : 'text-text-1'
                )}
              >
                {direction.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Reset Button */}
      <div className="flex items-center justify-start px-4 py-3 border-t border-outline-primary">
        <Button
          variant="text"
          size="sm"
          onClick={handleReset}
          disabled={resetDisabled}
          className="text-text-disabled hover:text-text-2 disabled:text-text-disabled"
        >
          Reset to default
        </Button>
      </div>
    </div>
  );

  // Render based on mode
  if (isDropdownMode) {
    return (
      <div className="relative inline-block">
        {/* Trigger Element */}
        <div
          ref={triggerRef}
          onClick={handleToggle}
          className={cn('cursor-pointer', triggerClassName)}
          role="button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {trigger}
        </div>

        {/* Dropdown Widget */}
        {isOpen && widgetContent}
      </div>
    );
  }

  // Static mode
  return widgetContent;
};

SortWidgetComponent.displayName = 'SortWidget';

export default SortWidgetComponent;
