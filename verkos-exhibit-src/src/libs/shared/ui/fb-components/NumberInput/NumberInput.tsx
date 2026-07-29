import { memo, useEffect, useRef, useState } from 'react';
import { Button } from '../Button';

export interface NumberInputProps {
  id?: string;
  label?: string;
  hint?: string;
  min?: number;
  max?: number;
  value: number | string | null;
  singleStep?: boolean;
  noButtons?: boolean;
  disabled?: boolean;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
}

const NumberInputComponent: React.FC<NumberInputProps> = ({
  id,
  label,
  hint,
  min,
  max,
  value,
  singleStep = false,
  noButtons = false,
  onChange,
  onBlur,
  disabled = false,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValueChange = (value: string | number | null) => {
    if (typeof value === 'string') {
      if (value === '-') {
        setInternalValue('-');
        return;
      }
      if (value.endsWith('.')) {
        setInternalValue(value);
        return;
      }
      // Allow digits, decimal point, and negative sign
      const sanitizedValue = value.replace(/[^0-9.-]/g, '');

      // // Handle case where multiple decimal points exist
      const parts = sanitizedValue.split('.');
      const finalValue =
        parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');

      // Convert to number, handling empty string case
      const numValue = finalValue === '' ? null : parseFloat(finalValue);

      onChange(numValue);
      setInternalValue(numValue);
    } else {
      onChange(value);
      setInternalValue(value);
    }
  };

  useEffect(() => {
    // Only update internal value, don't clamp immediately
    // Clamping will happen on blur if onBlur is provided
    setInternalValue(value);
  }, [value]);

  // Add blur handler for validation
  const handleBlur = () => {
    const numValue = internalValue !== null ? Number(internalValue) : null;

    if (numValue !== null) {
      let validatedValue = numValue;

      // Validate against min/max on blur
      if (min !== undefined && numValue < min) {
        validatedValue = min;
      } else if (max !== undefined && numValue > max) {
        validatedValue = max;
      }

      // Update if value was clamped
      if (validatedValue !== numValue) {
        setInternalValue(validatedValue);
        onChange(validatedValue);
      }
    } else {
      // If value is null/empty, set to minimum if min is defined
      if (min !== undefined) {
        setInternalValue(min);
        onChange(min);
      }
    }

    // Call custom onBlur callback if provided
    if (onBlur) {
      onBlur();
    }
  };

  //keyboard events to handle ArrowUp and ArrowDown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when this input is focused
      if (document.activeElement !== inputRef.current) {
        return;
      }

      const increment = event.shiftKey ? 10 : 1;

      if (event.key === 'ArrowUp') {
        event.preventDefault(); // Prevent default cursor movement
        handleValueChange(
          internalValue !== null ? Number(internalValue) + increment : null
        );
      } else if (event.key === 'ArrowDown') {
        event.preventDefault(); // Prevent default cursor movement
        handleValueChange(
          internalValue !== null ? Number(internalValue) - increment : null
        );
      } else if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        // Optionally, you can handle Enter key to submit or confirm the value
        if (inputRef.current) {
          inputRef.current.blur(); // Remove focus from input
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [internalValue]);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="fb-body-1 text-text-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1 w-full">
        {!noButtons && (
          <div className="flex items-center gap-1">
            {!singleStep && (
              <Button
                variant="number"
                size="sm"
                onClick={() =>
                  handleValueChange(
                    internalValue !== null ? Number(internalValue) - 10 : null
                  )
                }
                disabled={
                  disabled ||
                  internalValue === null ||
                  Number(internalValue) <= (min ?? 0)
                }
              >
                -10
              </Button>
            )}
            <Button
              variant="number"
              size="sm"
              onClick={() =>
                handleValueChange(
                  internalValue !== null ? Number(internalValue) - 1 : null
                )
              }
              disabled={
                disabled ||
                internalValue === null ||
                Number(internalValue) <= (min ?? 0)
              }
            >
              -1
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          className={`number-to-text disabled:opacity-50 disabled:cursor-not-allowed fb-body-1 text-text-1 ${
            noButtons ? 'text-left' : 'text-center'
          } flex-1 w-10 flex items-center bg-background border border-outline-primary px-2 py-1.5 rounded-lg`}
          value={internalValue !== null ? internalValue : ''}
          disabled={disabled}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={handleBlur}
        />
        {!noButtons && (
          <div className="flex items-center gap-1">
            <Button
              variant="number"
              size="sm"
              onClick={() =>
                handleValueChange(
                  internalValue !== null ? Number(internalValue) + 1 : null
                )
              }
              disabled={
                disabled ||
                internalValue === null ||
                Number(internalValue) >= (max ?? Number.MAX_SAFE_INTEGER)
              }
            >
              +1
            </Button>
            {!singleStep && (
              <Button
                variant="number"
                size="sm"
                onClick={() =>
                  handleValueChange(
                    internalValue !== null ? Number(internalValue) + 10 : null
                  )
                }
                disabled={
                  disabled ||
                  internalValue === null ||
                  Number(internalValue) >= (max ?? Number.MAX_SAFE_INTEGER)
                }
              >
                +10
              </Button>
            )}
          </div>
        )}
      </div>
      {hint && <p className="fb-body-5 text-text-2">{hint}</p>}
    </div>
  );
};

const NumberInput = memo(NumberInputComponent);
export default NumberInput;
