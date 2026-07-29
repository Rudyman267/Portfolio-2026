import React, { memo } from 'react';
import { twMerge } from 'tailwind-merge';

export type SegmentedButtonOption = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  desc?: string;
};

export interface SegmentedButtonProps {
  options: SegmentedButtonOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const SegmentedButtonComponent: React.FC<SegmentedButtonProps> = ({
  options,
  value,
  onChange,
  className,
  disabled = false,
}) => {
  if (!options.length) return null;

  return (
    <div
      className={twMerge(
        'flex flex-row gap-[-1px] min-w-fit w-full rounded-lg',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled || option.disabled}
            title={option.desc}
            onClick={() => onChange(option.value)}
            className={twMerge(
              'flex-1 flex justify-center items-center gap-1 px-3 py-1.5 transition-colors',
              'fb-label-1',
              isFirst && 'rounded-l-lg',
              isLast && 'rounded-r-lg',
              isSelected
                ? 'bg-secondary-200'
                : 'bg-surface hover:bg-surface-hover',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

const SegmentedButton = memo(SegmentedButtonComponent);
export default SegmentedButton;
