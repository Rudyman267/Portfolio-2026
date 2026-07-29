import React from 'react';

export type CheckboxSize = 'sm' | 'md';
export type CheckboxState = 'unchecked' | 'checked' | 'indeterminate';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The current state of the checkbox
   */
  state?: CheckboxState;
  /**
   * The size of the checkbox
   */
  size?: CheckboxSize;
  /**
   * Label text to display next to the checkbox
   */
  label?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  state = 'unchecked',
  size = 'md',
  label,
  className = '',
  onChange,
  disabled,
  ...props
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = state === 'indeterminate';
    }
  }, [state]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const baseClasses =
    'relative appearance-none rounded flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

  const getStateClasses = () => {
    if (disabled) {
      return state === 'unchecked'
        ? 'border border-[rgba(255,255,255,0.24)]'
        : 'bg-[#3D3D3D] border-0';
    }

    switch (state) {
      case 'checked':
        return 'bg-primary-200 hover:bg-[#4262B4] active:bg-[#3A57A0] border-0';
      case 'indeterminate':
        return 'bg-primary-200 hover:bg-[#4262B4] active:bg-[#3A57A0] border-0';
      default:
        return 'border border-[rgba(255,255,255,0.54)] hover:border-[rgba(255,255,255,0.84)]';
    }
  };

  const getTextColor = () => {
    if (disabled) return 'text-text-disabled';
    return 'text-text-2';
  };

  return (
    <label
      className={`inline-flex items-center ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center h-full">
        <input
          ref={inputRef}
          type="checkbox"
          className={`${baseClasses} ${sizeClasses[size]} ${getStateClasses()}`}
          checked={state === 'checked'}
          disabled={disabled}
          onChange={onChange}
          {...props}
        />
        {state === 'checked' && (
          <i
            className={`absolute inset-0 ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            } flex items-center justify-center fa-solid fa-check ${getTextColor()}`}
          ></i>
        )}
        {state === 'indeterminate' && (
          <i
            className={`absolute inset-0 ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            } flex items-center justify-center fa-solid fa-minus ${getTextColor()}`}
          ></i>
        )}
      </div>
      {label && (
        <span className={`ml-2 text-sm font-inter ${getTextColor()}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
