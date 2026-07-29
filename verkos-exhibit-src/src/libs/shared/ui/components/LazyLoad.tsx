import { Suspense, lazy, ComponentType } from 'react';
import { LoadingScreen } from './LoadingScreen';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
}

/**
 * Creates a lazy-loaded component with Suspense wrapper.
 * Use for heavy components like maps, charts, rich editors, etc.
 *
 * @example
 * // In your component file:
 * const HeavyChart = lazyLoad(() => import('./HeavyChart'));
 *
 * // In JSX:
 * <HeavyChart data={data} />
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFn);
  const { fallback = <LoadingScreen /> } = options;

  return function LazyLoadWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lightweight inline loading spinner for smaller lazy components.
 */
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-2 border-primary-200 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
