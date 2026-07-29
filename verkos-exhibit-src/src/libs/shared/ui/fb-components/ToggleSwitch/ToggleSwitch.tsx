import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ToggleSwitchProps {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  name?: string;
  ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isOn,
  onChange,
  className,
  disabled = false,
  loading = false,
  size = 'md',
  id,
  name,
  ariaLabel = 'Toggle Switch',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && !loading) {
      onChange(e.target.checked);
    }
  };

  const getSwitchClasses = () => {
    let baseClasses =
      'relative inline-flex items-center rounded-full transition-colors focus:outline-none';

    // Size classes
    if (size === 'sm') {
      baseClasses += ' h-4 w-8';
    } else {
      baseClasses += ' h-6 w-11';
    }

    // State classes
    if (disabled) {
      baseClasses += ' bg-background-level-3 cursor-not-allowed';
    } else if (loading) {
      baseClasses += ' bg-primary-200 cursor-wait';
    } else if (isOn) {
      baseClasses += ' bg-primary-200 hover:bg-primary-300';
    } else {
      baseClasses += ' bg-background-level-3 hover:bg-background-level-4';
    }

    // Focus state
    baseClasses += ' focus:ring-2 focus:ring-primary-200 focus:ring-offset-0';

    return baseClasses;
  };

  const getKnobClasses = () => {
    let baseClasses =
      'absolute transform rounded-full transition-transform duration-200 ease-in-out bg-text-1';

    // Size classes
    if (size === 'sm') {
      baseClasses += ' h-3 w-3';
      baseClasses += isOn ? ' translate-x-4 ml-0.5' : ' translate-x-0.5';
    } else {
      baseClasses += ' h-5 w-5';
      baseClasses += isOn ? ' translate-x-5 ml-0.5' : ' translate-x-0.5';
    }

    // State classes
    if (disabled) {
      baseClasses += ' bg-text-disabled';
    } else if (loading) {
      baseClasses += ' animate-pulse';
    }

    return baseClasses;
  };

  const renderLoaderIcon = () => {
    if (!loading) return null;

    return (
      <svg
        className={`absolute animate-spin ${
          size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
        }`}
        style={{
          left: isOn
            ? size === 'sm'
              ? '5px'
              : '7px'
            : size === 'sm'
            ? '1.5px'
            : '2px',
        }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );
  };

  return (
    <label
      className={twMerge(
        'inline-flex cursor-pointer',
        disabled && 'cursor-not-allowed',
        className
      )}
      htmlFor={id}
    >
      <span className="sr-only">{ariaLabel}</span>
      <input
        type="checkbox"
        className="sr-only"
        checked={isOn}
        onChange={handleChange}
        disabled={disabled || loading}
        id={id}
        name={name}
      />
      <div className={getSwitchClasses()}>
        <span className={getKnobClasses()}>{renderLoaderIcon()}</span>
      </div>
    </label>
  );
};

export default ToggleSwitch;
