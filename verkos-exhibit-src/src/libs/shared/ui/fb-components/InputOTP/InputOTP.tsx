import React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { cva, type VariantProps } from 'class-variance-authority';
import { Dot } from 'lucide-react';
import { cn } from '../../../utils/utils';

const inputOTPVariants = cva(
  'flex items-center gap-2 has-[:disabled]:opacity-50',
  {
    variants: {
      size: {
        sm: 'gap-1',
        md: 'gap-2',
        lg: 'gap-3',
      },
      variant: {
        default: '',
        outline: '',
        filled: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const inputOTPSlotVariants = cva(
  'relative flex items-center justify-center border-y border-r border-outline-primary text-text-1 transition-all first:rounded-l-md first:border-l last:rounded-r-md fb-body-3',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
      },
      variant: {
        default: 'bg-surface border-outline-primary',
        outline: 'bg-surface border-outline-primary',
        filled: 'bg-surface-hover border-outline-secondary',
      },
      state: {
        default: '',
        active: 'z-10 ring-2 ring-accent-primary ring-offset-surface',
        error:
          'border-semantic-error ring-2 ring-semantic-error ring-offset-surface',
        success:
          'border-semantic-success ring-2 ring-semantic-success ring-offset-surface',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      state: 'default',
    },
  }
);

const inputOTPSeparatorVariants = cva('text-text-3', {
  variants: {
    size: {
      sm: 'scale-75',
      md: 'scale-100',
      lg: 'scale-125',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// InputOTP root component
export interface InputOTPProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof OTPInput>,
    'size' | 'variant' | 'render'
  > {
  /**
   * Size of the OTP input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the OTP input
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled';
  /**
   * CSS class for the container
   */
  containerClassName?: string;
  /**
   * CSS class for the input
   */
  className?: string;
  /**
   * Child components (typically InputOTPGroup with slots)
   */
  children: React.ReactNode;
}

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  InputOTPProps
>(
  (
    {
      size = 'md',
      variant = 'default',
      className,
      containerClassName,
      ...props
    },
    ref
  ) => (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        inputOTPVariants({ size, variant }),
        containerClassName
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
);
InputOTP.displayName = 'InputOTP';

// InputOTP Group component
export interface InputOTPGroupProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Size of the OTP group
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  InputOTPGroupProps
>(({ size = 'md', className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center',
      size === 'sm' && 'gap-1',
      size === 'md' && 'gap-2',
      size === 'lg' && 'gap-3',
      className
    )}
    {...props}
  />
));
InputOTPGroup.displayName = 'InputOTPGroup';

// InputOTP Slot component
export interface InputOTPSlotProps
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof inputOTPSlotVariants> {
  /**
   * Index of the slot
   */
  index: number;
  /**
   * Size of the OTP slot
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the OTP slot
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled';
  /**
   * State of the OTP slot
   * @default 'default'
   */
  state?: 'default' | 'active' | 'error' | 'success';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const InputOTPSlot = React.forwardRef<
  React.ElementRef<'div'>,
  InputOTPSlotProps
>(
  (
    {
      index,
      size = 'md',
      variant = 'default',
      state = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    // Determine actual state
    const actualState = isActive ? 'active' : state;

    return (
      <div
        ref={ref}
        className={cn(
          inputOTPSlotVariants({ size, variant, state: actualState }),
          className
        )}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-text-1 duration-1000" />
          </div>
        )}
      </div>
    );
  }
);
InputOTPSlot.displayName = 'InputOTPSlot';

// InputOTP Separator component
export interface InputOTPSeparatorProps
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof inputOTPSeparatorVariants> {
  /**
   * Size of the separator
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  InputOTPSeparatorProps
>(({ size = 'md', className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn(inputOTPSeparatorVariants({ size }), className)}
    {...props}
  >
    <Dot />
  </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

// Simple InputOTP component
export interface SimpleInputOTPProps {
  /**
   * Number of OTP digits
   * @default 6
   */
  maxLength?: number;
  /**
   * Size of the OTP input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant of the OTP input
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled';
  /**
   * State of the OTP input
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';
  /**
   * Value of the OTP input
   */
  value?: string;
  /**
   * Callback when OTP value changes
   */
  onChange?: (value: string) => void;
  /**
   * Callback when OTP is complete
   */
  onComplete?: (value: string) => void;
  /**
   * Whether to show separator between groups
   * @default false
   */
  showSeparator?: boolean;
  /**
   * Group size for separators (e.g., 3 for XXX-XXX pattern)
   * @default 3
   */
  groupSize?: number;
  /**
   * Placeholder character
   * @default ''
   */
  placeholder?: string;
  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleInputOTP: React.FC<SimpleInputOTPProps> = ({
  maxLength = 6,
  size = 'md',
  variant = 'default',
  state = 'default',
  value,
  onChange,
  onComplete,
  showSeparator = false,
  groupSize = 3,
  placeholder = '',
  disabled = false,
  className,
}) => {
  const renderSlots = (): React.ReactElement[] => {
    const slots: React.ReactElement[] = [];

    for (let i = 0; i < maxLength; i++) {
      // Add separator if needed
      if (showSeparator && i > 0 && i % groupSize === 0) {
        slots.push(<InputOTPSeparator key={`separator-${i}`} size={size} />);
      }

      slots.push(
        <InputOTPSlot
          key={i}
          index={i}
          size={size}
          variant={variant}
          state={state}
        />
      );
    }

    return slots;
  };

  return (
    <InputOTP
      maxLength={maxLength}
      size={size}
      variant={variant}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      placeholder={placeholder}
      containerClassName={className}
    >
      <InputOTPGroup size={size}>{renderSlots()}</InputOTPGroup>
    </InputOTP>
  );
};

// PIN Code Input component
export interface PinCodeInputProps {
  /**
   * Number of PIN digits
   * @default 4
   */
  length?: number;
  /**
   * Size of the PIN input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Current PIN value
   */
  value?: string;
  /**
   * Callback when PIN value changes
   */
  onChange?: (value: string) => void;
  /**
   * Callback when PIN is complete
   */
  onComplete?: (value: string) => void;
  /**
   * Whether the PIN is invalid
   * @default false
   */
  isInvalid?: boolean;
  /**
   * Whether to mask the PIN input
   * @default true
   */
  mask?: boolean;
  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PinCodeInput: React.FC<PinCodeInputProps> = ({
  length = 4,
  size = 'md',
  value,
  onChange,
  onComplete,
  isInvalid = false,
  mask = true,
  disabled = false,
  className,
}) => {
  return (
    <SimpleInputOTP
      maxLength={length}
      size={size}
      variant="filled"
      state={isInvalid ? 'error' : 'default'}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      className={className}
      {...(mask && { inputMode: 'numeric' as const, type: 'password' })}
    />
  );
};

// Verification Code Input component
export interface VerificationCodeInputProps {
  /**
   * Number of verification digits
   * @default 6
   */
  length?: number;
  /**
   * Size of the verification input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Current verification value
   */
  value?: string;
  /**
   * Callback when verification value changes
   */
  onChange?: (value: string) => void;
  /**
   * Callback when verification is complete
   */
  onComplete?: (value: string) => void;
  /**
   * Whether the verification is invalid
   * @default false
   */
  isInvalid?: boolean;
  /**
   * Whether to show separator between groups
   * @default true
   */
  showSeparator?: boolean;
  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  size = 'md',
  value,
  onChange,
  onComplete,
  isInvalid = false,
  showSeparator = true,
  disabled = false,
  className,
}) => {
  return (
    <SimpleInputOTP
      maxLength={length}
      size={size}
      variant="outline"
      state={isInvalid ? 'error' : 'default'}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      showSeparator={showSeparator}
      groupSize={3}
      disabled={disabled}
      className={className}
    />
  );
};

export { inputOTPVariants, inputOTPSlotVariants, inputOTPSeparatorVariants };

export {
  InputOTP,
  SimpleInputOTP,
  PinCodeInput,
  VerificationCodeInput,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
};

export default InputOTP;
