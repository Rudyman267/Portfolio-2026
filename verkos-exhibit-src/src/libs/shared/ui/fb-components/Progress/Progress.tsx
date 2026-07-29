import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const progressVariants = cva(
  // Base classes with FlytBase design tokens
  'relative overflow-hidden rounded-full bg-background-level-3',
  {
    variants: {
      variant: {
        default: 'bg-background-level-3',
        secondary: 'bg-background-level-2',
        muted: 'bg-background-level-4',
      },
      size: {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
        xl: 'h-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const progressIndicatorVariants = cva(
  // Base classes for the progress indicator
  'h-full w-full flex-1 transition-all duration-300 ease-in-out',
  {
    variants: {
      status: {
        default: 'bg-primary-200',
        success: 'bg-success-30',
        error: 'bg-error-30',
        warning: 'bg-warning-30',
        info: 'bg-info-30',
        caution: 'bg-caution-30',
      },
      animated: {
        true: 'bg-gradient-to-r from-current via-transparent to-current bg-[length:200%_100%] animate-[progress_2s_ease-in-out_infinite]',
        false: '',
      },
    },
    defaultVariants: {
      status: 'default',
      animated: false,
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  /**
   * The progress value (0-100)
   */
  value?: number;
  /**
   * Maximum value for the progress
   * @default 100
   */
  max?: number;
  /**
   * Visual variant of the progress container
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'muted';
  /**
   * Size of the progress bar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Status/color of the progress indicator
   * @default 'default'
   */
  status?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'caution';
  /**
   * Whether to show animated progress
   * @default false
   */
  animated?: boolean;
  /**
   * Whether to show label with percentage
   * @default false
   */
  showLabel?: boolean;
  /**
   * Custom label text (overrides percentage)
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Progress component for showing completion status using FlytBase design tokens
 * and CVA for type-safe variant management
 */
const Progress: React.FC<ProgressProps> = ({
  className,
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  status = 'default',
  animated = false,
  showLabel = false,
  label,
  ...props
}) => {
  // Ensure value is within bounds
  const normalizedValue = Math.max(0, Math.min(value, max));
  const percentage = (normalizedValue / max) * 100;

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="fb-body-4 text-text-2">{label || 'Progress'}</span>
          <span className="fb-body-4 text-text-1">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div
        className={cn(progressVariants({ variant, size, className }))}
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
        {...props}
      >
        <div
          className={cn(progressIndicatorVariants({ status, animated }))}
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Simple progress bar without label for compact use cases
 */
const SimpleProgress: React.FC<Omit<ProgressProps, 'showLabel' | 'label'>> = (
  props
) => <Progress {...props} showLabel={false} />;

/**
 * Indeterminate progress bar for unknown duration
 */
const IndeterminateProgress: React.FC<
  Omit<ProgressProps, 'value' | 'animated'>
> = (props) => <Progress {...props} value={50} animated={true} />;

export {
  progressVariants,
  progressIndicatorVariants,
  Progress,
  SimpleProgress,
  IndeterminateProgress,
};

export default Progress;
