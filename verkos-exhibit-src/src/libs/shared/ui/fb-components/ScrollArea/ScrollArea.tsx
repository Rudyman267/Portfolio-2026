import React, { useRef, useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const scrollAreaVariants = cva('relative overflow-hidden', {
  variants: {
    variant: {
      default: 'rounded-md',
      bordered: 'rounded-md border border-outline-primary',
      ghost: 'rounded-none',
      elevated: 'rounded-md shadow-sm',
    },
    size: {
      sm: 'max-h-48',
      md: 'max-h-96',
      lg: 'max-h-[500px]',
      xl: 'max-h-[600px]',
      auto: 'h-auto',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const scrollbarVariants = cva(
  'absolute z-10 flex touch-none select-none transition-colors',
  {
    variants: {
      orientation: {
        vertical:
          'h-full w-2.5 border-l border-l-transparent p-[1px] right-0 top-0',
        horizontal:
          'w-full h-2.5 border-t border-t-transparent p-[1px] bottom-0 left-0',
      },
      variant: {
        default: 'bg-transparent hover:bg-surface-hover',
        visible: 'bg-surface-hover',
        auto: 'bg-transparent hover:bg-surface-hover',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
      variant: 'default',
    },
  }
);

const scrollbarThumbVariants = cva(
  'relative flex-1 rounded-full bg-outline-primary transition-colors hover:bg-outline-secondary active:bg-outline-tertiary',
  {
    variants: {
      variant: {
        default: 'bg-outline-primary hover:bg-outline-secondary',
        prominent: 'bg-outline-secondary hover:bg-outline-tertiary',
        subtle: 'bg-outline-muted hover:bg-outline-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollAreaVariants> {
  /**
   * Visual variant of the scroll area
   * @default 'default'
   */
  variant?: 'default' | 'bordered' | 'ghost' | 'elevated';
  /**
   * Size of the scroll area
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  /**
   * Scrollbar visibility
   * @default 'auto'
   */
  scrollbarVisibility?: 'auto' | 'visible' | 'hidden';
  /**
   * Scrollbar variant
   * @default 'default'
   */
  scrollbarVariant?: 'default' | 'prominent' | 'subtle';
  /**
   * Whether to show horizontal scrollbar
   * @default true
   */
  showHorizontalScrollbar?: boolean;
  /**
   * Whether to show vertical scrollbar
   * @default true
   */
  showVerticalScrollbar?: boolean;
  /**
   * Custom scrollbar width
   */
  scrollbarWidth?: number;
  /**
   * Callback when scroll position changes
   */
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ScrollArea component for creating custom scrollable areas using FlytBase design tokens
 * and CVA for type-safe variant management
 */
const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      variant = 'default',
      size = 'md',
      scrollbarVisibility = 'auto',
      scrollbarVariant = 'default',
      showHorizontalScrollbar = true,
      showVerticalScrollbar = true,
      scrollbarWidth = 10,
      onScroll,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Update scroll position and content dimensions
    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;
      setScrollPosition({ x: target.scrollLeft, y: target.scrollTop });
      onScroll?.(event);
    };

    // Update content and container dimensions
    const updateDimensions = () => {
      if (contentRef.current) {
        const content = contentRef.current;
        const container = content.parentElement;

        if (container) {
          setContentSize({
            width: content.scrollWidth,
            height: content.scrollHeight,
          });
          setContainerSize({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      }
    };

    useEffect(() => {
      updateDimensions();

      // Set up ResizeObserver to track dimension changes
      const resizeObserver = new ResizeObserver(updateDimensions);

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
        if (contentRef.current.parentElement) {
          resizeObserver.observe(contentRef.current.parentElement);
        }
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [children]);

    // Handle scroll start/end for UI feedback
    useEffect(() => {
      let scrollTimeout: NodeJS.Timeout;

      const handleScrollStart = () => {
        setIsScrolling(true);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      const content = contentRef.current;
      if (content) {
        content.addEventListener('scroll', handleScrollStart);
        return () => {
          content.removeEventListener('scroll', handleScrollStart);
          clearTimeout(scrollTimeout);
        };
      }
    }, []);

    // Calculate scrollbar dimensions and positions
    const verticalScrollbarHeight =
      containerSize.height > 0
        ? Math.max(
            20,
            (containerSize.height / contentSize.height) * containerSize.height
          )
        : 0;

    const horizontalScrollbarWidth =
      containerSize.width > 0
        ? Math.max(
            20,
            (containerSize.width / contentSize.width) * containerSize.width
          )
        : 0;

    const verticalScrollbarTop =
      containerSize.height > 0 && contentSize.height > 0
        ? (scrollPosition.y / (contentSize.height - containerSize.height)) *
          (containerSize.height - verticalScrollbarHeight)
        : 0;

    const horizontalScrollbarLeft =
      containerSize.width > 0 && contentSize.width > 0
        ? (scrollPosition.x / (contentSize.width - containerSize.width)) *
          (containerSize.width - horizontalScrollbarWidth)
        : 0;

    const needsVerticalScrollbar = contentSize.height > containerSize.height;
    const needsHorizontalScrollbar = contentSize.width > containerSize.width;

    const shouldShowVerticalScrollbar =
      showVerticalScrollbar &&
      needsVerticalScrollbar &&
      scrollbarVisibility !== 'hidden';
    const shouldShowHorizontalScrollbar =
      showHorizontalScrollbar &&
      needsHorizontalScrollbar &&
      scrollbarVisibility !== 'hidden';

    return (
      <div
        ref={ref}
        className={cn(scrollAreaVariants({ variant, size, className }))}
        {...props}
      >
        <div
          ref={contentRef}
          className="h-full w-full overflow-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingRight: shouldShowVerticalScrollbar
              ? `${scrollbarWidth}px`
              : undefined,
            paddingBottom: shouldShowHorizontalScrollbar
              ? `${scrollbarWidth}px`
              : undefined,
          }}
          onScroll={handleScroll}
        >
          {children}
        </div>

        {/* Vertical Scrollbar */}
        {shouldShowVerticalScrollbar && (
          <div
            className={cn(
              scrollbarVariants({
                orientation: 'vertical',
                variant:
                  scrollbarVisibility === 'visible' || isScrolling
                    ? 'visible'
                    : 'auto',
              })
            )}
            style={{ width: `${scrollbarWidth}px` }}
          >
            <div
              className={cn(
                scrollbarThumbVariants({ variant: scrollbarVariant })
              )}
              style={{
                height: `${verticalScrollbarHeight}px`,
                transform: `translateY(${verticalScrollbarTop}px)`,
              }}
            />
          </div>
        )}

        {/* Horizontal Scrollbar */}
        {shouldShowHorizontalScrollbar && (
          <div
            className={cn(
              scrollbarVariants({
                orientation: 'horizontal',
                variant:
                  scrollbarVisibility === 'visible' || isScrolling
                    ? 'visible'
                    : 'auto',
              })
            )}
            style={{ height: `${scrollbarWidth}px` }}
          >
            <div
              className={cn(
                scrollbarThumbVariants({ variant: scrollbarVariant })
              )}
              style={{
                width: `${horizontalScrollbarWidth}px`,
                transform: `translateX(${horizontalScrollbarLeft}px)`,
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

/**
 * Vertical only scroll area
 */
const VerticalScrollArea = React.forwardRef<
  HTMLDivElement,
  Omit<ScrollAreaProps, 'showHorizontalScrollbar'>
>((props, ref) => (
  <ScrollArea ref={ref} showHorizontalScrollbar={false} {...props} />
));

VerticalScrollArea.displayName = 'VerticalScrollArea';

/**
 * Horizontal only scroll area
 */
const HorizontalScrollArea = React.forwardRef<
  HTMLDivElement,
  Omit<ScrollAreaProps, 'showVerticalScrollbar'>
>((props, ref) => (
  <ScrollArea ref={ref} showVerticalScrollbar={false} {...props} />
));

HorizontalScrollArea.displayName = 'HorizontalScrollArea';

/**
 * Simple scroll area with minimal styling
 */
const SimpleScrollArea = React.forwardRef<
  HTMLDivElement,
  Omit<ScrollAreaProps, 'variant' | 'scrollbarVisibility'>
>((props, ref) => (
  <ScrollArea ref={ref} variant="ghost" scrollbarVisibility="auto" {...props} />
));

SimpleScrollArea.displayName = 'SimpleScrollArea';

export {
  scrollAreaVariants,
  scrollbarVariants,
  scrollbarThumbVariants,
  ScrollArea,
  VerticalScrollArea,
  HorizontalScrollArea,
  SimpleScrollArea,
};

export default ScrollArea;
