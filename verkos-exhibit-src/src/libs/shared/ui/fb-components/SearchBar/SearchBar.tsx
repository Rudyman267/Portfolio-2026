import React, { InputHTMLAttributes, useState } from 'react';

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const SearchBar: React.FC<SearchBarProps> = ({
  onChange,
  onClear,
  placeholder = 'Search',
  value: controlledValue,
  className = '',
  size = 'md',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }

    onChange?.(e.target.value);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }

    onClear?.();
    onChange?.('');
  };

  const sizeClasses = {
    sm: 'py-1 px-1.5',
    md: 'py-1.5 px-2',
  };

  const focusClasses = isFocused
    ? 'ring-2 ring-blue-500 border-[rgba(255,255,255,0.2)]'
    : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.2)]';

  return (
    <div
      className={`
        flex items-center rounded-lg border
        bg-transparent transition-all
        max-w-[300px] w-full
        ${sizeClasses[size]}
        ${focusClasses}
        ${currentValue ? 'bg-[rgba(236,236,238,0.08)] border-primary-200' : ''}
        ${className}
      `}
    >
      <i className="fa-regular fa-search text-text-2 w-4 h-4 flex items-center justify-center"></i>
      <input
        type="text"
        className="bg-transparent text-text-1 flex-1 outline-none text-sm font-inter leading-5 tracking-[-0.3%] px-1.5"
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {currentValue && (
        <button
          type="button"
          onClick={handleClear}
          className="text-text-2 hover:text-text-1 transition-colors w-4 h-4 flex items-center justify-center"
        >
          <i className="fa-regular fa-xmark"></i>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
