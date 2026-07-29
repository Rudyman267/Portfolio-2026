import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';
import Radio, { RadioSize, RadioState } from '../Radio/Radio';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

const radioGroupVariants = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row flex-wrap',
      vertical: 'flex-col',
    },
    spacing: {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
    spacing: 'sm',
  },
});

const radioItemVariants = cva('flex items-start', {
  variants: {
    orientation: {
      horizontal: 'flex-col items-center text-center',
      vertical: 'flex-row items-start',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof radioGroupVariants> {
  /**
   * Radio options
   */
  options: RadioOption[];
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;
  /**
   * Name attribute for radio group
   */
  name?: string;
  /**
   * Size of the radio buttons
   * @default 'md'
   */
  size?: RadioSize;
  /**
   * State of the radio buttons
   * @default 'default'
   */
  state?: RadioState;
  /**
   * Orientation of the radio group
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Spacing between radio items
   * @default 'sm'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether the entire group is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show descriptions for options
   * @default false
   */
  showDescriptions?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      options,
      value,
      onChange,
      name,
      size = 'md',
      state = 'default',
      orientation = 'vertical',
      spacing = 'sm',
      disabled = false,
      className,
      showDescriptions = false,
      ...props
    },
    ref
  ) => {
    // Generate a unique name if not provided
    const radioGroupName = name || `radio-group-${React.useId()}`;

    const handleRadioChange = (
      event: React.ChangeEvent<HTMLInputElement>,
      optionValue: string
    ) => {
      if (onChange && !disabled) {
        onChange(optionValue);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          radioGroupVariants({ orientation, spacing }),
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        role="radiogroup"
        {...props}
      >
        {options.map((option) => {
          const isChecked = value === option.value;
          const isDisabled = disabled || option.disabled;
          const effectiveState = isDisabled ? 'disabled' : state;

          return (
            <div
              key={option.value}
              className={cn(radioItemVariants({ orientation }))}
            >
              <Radio
                name={radioGroupName}
                value={option.value}
                checked={isChecked}
                disabled={isDisabled}
                size={size}
                state={effectiveState}
                label={
                  typeof option.label === 'string' ? option.label : undefined
                }
                onChange={(e) => handleRadioChange(e, option.value)}
                className={cn(
                  'transition-all duration-200',
                  orientation === 'horizontal' && 'mb-2'
                )}
              />

              {/* Custom label with description support */}
              {(typeof option.label !== 'string' ||
                (showDescriptions && option.description)) && (
                <div
                  className={cn(
                    'flex flex-col',
                    orientation === 'horizontal' ? 'items-center' : 'ml-2'
                  )}
                >
                  {typeof option.label !== 'string' && (
                    <div
                      className={cn(
                        'text-sm font-inter cursor-pointer',
                        isDisabled
                          ? 'text-[rgba(255,255,255,0.24)]'
                          : 'text-text-1',
                        orientation === 'horizontal' && 'text-center'
                      )}
                      onClick={() => {
                        if (!isDisabled && onChange) {
                          onChange(option.value);
                        }
                      }}
                    >
                      {option.label}
                    </div>
                  )}

                  {showDescriptions && option.description && (
                    <div
                      className={cn(
                        'text-xs font-inter mt-1',
                        isDisabled
                          ? 'text-[rgba(255,255,255,0.16)]'
                          : 'text-text-2',
                        orientation === 'horizontal' && 'text-center'
                      )}
                    >
                      {option.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

// Simple RadioGroup component for common use cases
export interface SimpleRadioGroupProps {
  /**
   * Radio options with simple labels
   */
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;
  /**
   * Name attribute for radio group
   */
  name?: string;
  /**
   * Size of the radio buttons
   * @default 'md'
   */
  size?: RadioSize;
  /**
   * Orientation of the radio group
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Spacing between radio items
   * @default 'sm'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether the entire group is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Show descriptions for options
   * @default false
   */
  showDescriptions?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SimpleRadioGroup: React.FC<SimpleRadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  size = 'md',
  orientation = 'vertical',
  spacing = 'sm',
  disabled = false,
  showDescriptions = false,
  className,
}) => {
  return (
    <RadioGroup
      options={options}
      value={value}
      onChange={onChange}
      name={name}
      size={size}
      orientation={orientation}
      spacing={spacing}
      disabled={disabled}
      showDescriptions={showDescriptions}
      className={className}
    />
  );
};

// Horizontal RadioGroup component for inline layouts
export interface HorizontalRadioGroupProps {
  /**
   * Radio options
   */
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;
  /**
   * Name attribute for radio group
   */
  name?: string;
  /**
   * Size of the radio buttons
   * @default 'md'
   */
  size?: RadioSize;
  /**
   * Spacing between radio items
   * @default 'md'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether the entire group is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const HorizontalRadioGroup: React.FC<HorizontalRadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  size = 'md',
  spacing = 'md',
  disabled = false,
  className,
}) => {
  return (
    <SimpleRadioGroup
      options={options}
      value={value}
      onChange={onChange}
      name={name}
      size={size}
      orientation="horizontal"
      spacing={spacing}
      disabled={disabled}
      className={className}
    />
  );
};

// Compact RadioGroup component for tight spaces
export interface CompactRadioGroupProps {
  /**
   * Radio options with minimal spacing
   */
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;
  /**
   * Name attribute for radio group
   */
  name?: string;
  /**
   * Size of the radio buttons
   * @default 'sm'
   */
  size?: RadioSize;
  /**
   * Whether the entire group is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const CompactRadioGroup: React.FC<CompactRadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  size = 'sm',
  disabled = false,
  className,
}) => {
  return (
    <SimpleRadioGroup
      options={options}
      value={value}
      onChange={onChange}
      name={name}
      size={size}
      orientation="vertical"
      spacing="none"
      disabled={disabled}
      className={className}
    />
  );
};

export { radioGroupVariants, radioItemVariants };

export { RadioGroup };

export default RadioGroup;
