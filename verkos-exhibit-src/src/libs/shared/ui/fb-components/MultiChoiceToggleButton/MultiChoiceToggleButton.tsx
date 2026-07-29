import React, { memo, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

export type MultiChoiceToggleOption = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
};

export interface MultiChoiceToggleButtonProps {
  options: MultiChoiceToggleOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
  minSelections?: number;
}

export const MultiChoiceToggleButtonComponent: React.FC<
  MultiChoiceToggleButtonProps
> = ({
  options,
  selectedValues,
  onChange,
  className,
  disabled = false,
  maxSelections,
  minSelections,
}) => {
  if (!options.length) return null;

  const handleToggle = (value: string) => {
    if (disabled) return;

    const newValues = [...selectedValues];
    const valueIndex = newValues.indexOf(value);

    if (valueIndex >= 0) {
      // Remove value if already selected
      newValues.splice(valueIndex, 1);
    } else {
      // Add value if not already selected
      if (maxSelections && newValues.length >= maxSelections) {
        // If max selections reached, replace the oldest selection
        newValues.shift();
      }
      newValues.push(value);
    }

    onChange(newValues);
  };

  useEffect(() => {
    if (minSelections && selectedValues.length < minSelections) {
      handleToggle(options[0].value);
    }
  }, [selectedValues]);

  return (
    <>
      <div
        className={twMerge(
          'flex flex-row gap-1.5 w-full',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
      >
        {options.map((option) => {
          const isSelected = selectedValues?.includes(option.value);

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || option.disabled}
              onClick={() => handleToggle(option.value)}
              className={twMerge(
                'flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                'fb-body-2',
                isSelected
                  ? 'bg-surface-selected text-text-1'
                  : 'bg-surface text-text-2 hover:bg-surface-hover',
                option.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );
};

const MultiChoiceToggleButton = memo(MultiChoiceToggleButtonComponent);
export default MultiChoiceToggleButton;
