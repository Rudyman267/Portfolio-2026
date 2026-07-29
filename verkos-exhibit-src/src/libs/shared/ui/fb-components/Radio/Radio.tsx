import React from 'react';

export type RadioSize = 'sm' | 'md';
export type RadioState =
  | 'default'
  | 'hover'
  | 'pressed'
  | 'focused'
  | 'disabled';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The current state of the radio button
   */
  state?: RadioState;
  /**
   * The size of the radio button
   */
  size?: RadioSize;
  /**
   * Label text to display next to the radio button
   */
  label?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      state = 'default',
      size = 'md',
      label,
      className = '',
      checked = false,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    // If disabled prop is true, override state
    const effectiveState = disabled ? 'disabled' : state;

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
    };

    const baseClasses =
      'relative appearance-none rounded-full flex-shrink-0 focus:outline-none transition-colors';

    const getStateClasses = () => {
      if (effectiveState === 'disabled') {
        return `border-2 border-[rgba(255,255,255,0.24)] ${
          checked ? 'after:bg-[rgba(255,255,255,0.24)]' : ''
        }`;
      }

      switch (effectiveState) {
        case 'hover':
          return checked
            ? 'border-2 border-[#4262B4] after:bg-[#4262B4]'
            : 'border-2 border-[rgba(255,255,255,0.84)]';
        case 'pressed':
          return checked
            ? 'border-2 border-[#3A57A0] after:bg-[#3A57A0]'
            : 'border-2 border-[rgba(255,255,255,0.84)]';
        case 'focused':
          return `border-2 ${
            checked
              ? 'border-[#496DC8] after:bg-[#496DC8]'
              : 'border-[rgba(255,255,255,0.84)]'
          } ring-2 ring-[rgba(0,128,255,1)]`;
        default:
          return checked
            ? 'border-2 border-[#496DC8] after:bg-[#496DC8]'
            : 'border-2 border-[rgba(255,255,255,0.54)] hover:border-[rgba(255,255,255,0.84)]';
      }
    };

    const getTextColor = () => {
      if (effectiveState === 'disabled') return 'text-[rgba(255,255,255,0.24)]';
      return 'text-text-1';
    };

    // Classes for the inner circle
    const innerCircleClasses = checked
      ? 'after:content-[""] after:absolute after:rounded-full after:top-1/2 after:left-1/2 after:transform after:-translate-x-1/2 after:-translate-y-1/2 after:w-[70%] after:h-[70%] after:transition-colors'
      : '';

    return (
      <label
        className={`inline-flex items-center ${
          effectiveState === 'disabled'
            ? 'cursor-not-allowed'
            : 'cursor-pointer'
        } ${className}`}
      >
        <div className="relative flex items-center h-full">
          <input
            ref={ref}
            type="radio"
            className={`${baseClasses} ${
              sizeClasses[size]
            } ${getStateClasses()} ${innerCircleClasses}`}
            checked={checked}
            disabled={effectiveState === 'disabled'}
            onChange={onChange}
            {...props}
          />
        </div>
        {label && (
          <span className={`ml-2 text-sm font-inter ${getTextColor()}`}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

export default Radio;
