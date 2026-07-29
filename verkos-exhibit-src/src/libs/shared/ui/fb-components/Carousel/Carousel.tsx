import React from 'react';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

const carouselVariants = cva('relative', {
  variants: {
    variant: {
      default: '',
      cards: 'px-4',
      centered: 'mx-auto max-w-full',
    },
    size: {
      sm: 'h-48',
      md: 'h-64',
      lg: 'h-80',
      xl: 'h-96',
      auto: 'h-auto',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'auto',
  },
});

const carouselButtonVariants = cva(
  'absolute inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-outline-primary bg-surface hover:bg-surface-hover text-text-1',
        ghost: 'hover:bg-surface-hover text-text-1',
        outline:
          'border border-outline-primary bg-transparent hover:bg-surface-hover text-text-1',
      },
      size: {
        sm: 'h-7 w-7',
        md: 'h-8 w-8',
        lg: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

// Root Carousel component
export interface CarouselRootProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof carouselVariants>,
    CarouselProps {
  /**
   * Visual variant of the carousel
   * @default 'default'
   */
  variant?: 'default' | 'cards' | 'centered';
  /**
   * Size of the carousel
   * @default 'auto'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  /**
   * Orientation of the carousel
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselRootProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'default',
      size = 'auto',
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === 'horizontal' ? 'x' : 'y',
      },
      plugins
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);

      return () => {
        api?.off('select', onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn(carouselVariants({ variant, size }), className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = 'Carousel';

// Carousel Content component
export interface CarouselContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            'flex',
            orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CarouselContent.displayName = 'CarouselContent';

// Carousel Item component
export interface CarouselItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          'min-w-0 shrink-0 grow-0 basis-full',
          orientation === 'horizontal' ? 'pl-4' : 'pt-4',
          className
        )}
        {...props}
      />
    );
  }
);
CarouselItem.displayName = 'CarouselItem';

// Carousel Previous button component
export interface CarouselPreviousProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof carouselButtonVariants> {
  /**
   * Visual variant of the button
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline';
  /**
   * Size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  CarouselPreviousProps
>(({ variant = 'default', size = 'md', className, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn(
        carouselButtonVariants({ variant, size }),
        orientation === 'horizontal'
          ? '-left-12 top-1/2 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span className="sr-only">Previous slide</span>
    </button>
  );
});
CarouselPrevious.displayName = 'CarouselPrevious';

// Carousel Next button component
export interface CarouselNextProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof carouselButtonVariants> {
  /**
   * Visual variant of the button
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'outline';
  /**
   * Size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselNextProps>(
  ({ variant = 'default', size = 'md', className, ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <button
        ref={ref}
        className={cn(
          carouselButtonVariants({ variant, size }),
          orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="sr-only">Next slide</span>
      </button>
    );
  }
);
CarouselNext.displayName = 'CarouselNext';

// Carousel Dots component
export interface CarouselDotsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const CarouselDots = React.forwardRef<HTMLDivElement, CarouselDotsProps>(
  ({ className, ...props }, ref) => {
    const { api } = useCarousel();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);

      api.on('select', () => {
        setCurrent(api.selectedScrollSnap() + 1);
      });
    }, [api]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center space-x-2 mt-4',
          className
        )}
        {...props}
      >
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              current === i + 1 ? 'bg-primary-500' : 'bg-outline-secondary'
            )}
            onClick={() => api?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    );
  }
);
CarouselDots.displayName = 'CarouselDots';

// Simple Carousel component
export interface SimpleCarouselProps {
  /**
   * Array of carousel items
   */
  items: React.ReactNode[];
  /**
   * Visual variant of the carousel
   * @default 'default'
   */
  variant?: 'default' | 'cards' | 'centered';
  /**
   * Size of the carousel
   * @default 'auto'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  /**
   * Orientation of the carousel
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether to show navigation buttons
   * @default true
   */
  showNavigation?: boolean;
  /**
   * Whether to show dots indicator
   * @default true
   */
  showDots?: boolean;
  /**
   * Whether to auto-play the carousel
   * @default false
   */
  autoPlay?: boolean;
  /**
   * Auto-play delay in milliseconds
   * @default 3000
   */
  autoPlayDelay?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SimpleCarousel: React.FC<SimpleCarouselProps> = ({
  items,
  variant = 'default',
  size = 'auto',
  orientation = 'horizontal',
  showNavigation = true,
  showDots = true,
  autoPlay = false,
  autoPlayDelay = 3000,
  className,
}) => {
  const [api, setApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (!api || !autoPlay) {
      return;
    }

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, autoPlayDelay);

    return () => clearInterval(interval);
  }, [api, autoPlay, autoPlayDelay]);

  return (
    <Carousel
      variant={variant}
      size={size}
      orientation={orientation}
      setApi={setApi}
      className={className}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={index}>{item}</CarouselItem>
        ))}
      </CarouselContent>
      {showNavigation && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
      {showDots && <CarouselDots />}
    </Carousel>
  );
};

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  SimpleCarousel,
  carouselVariants,
  carouselButtonVariants,
  useCarousel,
};
export type { CarouselApi };

export default Carousel;
