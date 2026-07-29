import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const aspectRatioVariants = cva('relative w-full overflow-hidden', {
  variants: {
    ratio: {
      square: 'aspect-square',
      video: 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '3/2': 'aspect-[3/2]',
      '16/9': 'aspect-[16/9]',
      '21/9': 'aspect-[21/9]',
      '1/1': 'aspect-[1/1]',
      '2/1': 'aspect-[2/1]',
      '3/4': 'aspect-[3/4]',
      '9/16': 'aspect-[9/16]',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    ratio: 'video',
    rounded: 'md',
  },
});

export interface AspectRatioProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aspectRatioVariants> {
  /**
   * Content to be rendered inside the aspect ratio container
   */
  children: React.ReactNode;
  /**
   * Aspect ratio preset
   * @default 'video'
   */
  ratio?:
    | 'square'
    | 'video'
    | '4/3'
    | '3/2'
    | '16/9'
    | '21/9'
    | '1/1'
    | '2/1'
    | '3/4'
    | '9/16';
  /**
   * Custom aspect ratio (overrides ratio prop)
   * Format: "width/height" or decimal number
   */
  customRatio?: string | number;
  /**
   * Border radius
   * @default 'md'
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * AspectRatio component for maintaining consistent aspect ratios
 * using FlytBase design tokens and CVA for type-safe variant management
 */
const AspectRatio: React.FC<AspectRatioProps> = ({
  children,
  className,
  ratio = 'video',
  customRatio,
  rounded = 'md',
  style,
  ...props
}) => {
  // Handle custom aspect ratio
  const customStyle = customRatio
    ? {
        ...style,
        aspectRatio:
          typeof customRatio === 'number'
            ? customRatio.toString()
            : customRatio,
      }
    : style;

  return (
    <div
      className={cn(
        aspectRatioVariants({
          ratio: customRatio ? undefined : ratio,
          rounded,
          className,
        })
      )}
      style={customStyle}
      {...props}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/**
 * Image aspect ratio component for responsive images
 */
export interface ImageAspectRatioProps extends AspectRatioProps {
  src: string;
  alt: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

const ImageAspectRatio: React.FC<ImageAspectRatioProps> = ({
  src,
  alt,
  objectFit = 'cover',
  children,
  ...props
}) => (
  <AspectRatio {...props}>
    <img
      src={src}
      alt={alt}
      className={cn(
        'w-full h-full',
        objectFit === 'contain' && 'object-contain',
        objectFit === 'cover' && 'object-cover',
        objectFit === 'fill' && 'object-fill',
        objectFit === 'none' && 'object-none',
        objectFit === 'scale-down' && 'object-scale-down'
      )}
    />
    {children}
  </AspectRatio>
);

export { AspectRatio, ImageAspectRatio, aspectRatioVariants };
export default AspectRatio;
