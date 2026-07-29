import React from 'react';
import { IconButton } from '../IconButton';

export interface FilterChipProps {
  /**
   * The label text to display in the chip
   */
  label: string;

  /**
   * The category/group name to display (optional)
   */
  category?: string;

  /**
   * Called when the remove button is clicked
   */
  onRemove?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  category,
  onRemove,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center h-8 px-2 py-0.5 rounded-lg bg-background border border-outline-primary ${className}`}
    >
      {category && (
        <i
          className={`fa-kit fa-fb-${category.toLowerCase()} text-xs mr-1.5`}
        ></i>
      )}
      <span className="text-xs font-medium text-text-1">{label}</span>
      {onRemove && (
        <IconButton
          variant="ghost"
          size="xs"
          icon={<i className="fa-regular fa-xmark text-text-2"></i>}
          onClick={onRemove}
          ariaLabel="exit"
        />
      )}
    </div>
  );
};

export default FilterChip;
