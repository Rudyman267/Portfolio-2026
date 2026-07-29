import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { UseBoundStore, StoreApi } from 'zustand';
import { AxiosInstance } from 'axios';
import { FeatureFlagsState } from '../types/feature-flags.types';

interface FeatureFlagInitializerProps<T extends FeatureFlagsState> {
  children: React.ReactNode;
  /**
   * Zustand store instance that contains feature flags state
   * The store must have the FeatureFlagsState interface
   */
  store: UseBoundStore<StoreApi<T>>;
  /**
   * Organization ID from auth context
   * Passed as prop to avoid circular dependency with @auth
   */
  orgId: string | null | undefined;
  /**
   * HTTP client instance from auth context
   * Passed as prop to avoid circular dependency with @auth
   */
  httpClient: AxiosInstance;
  /**
   * Optional loading spinner color class
   * Default: 'text-primary-default'
   */
  spinnerColor?: string;
}

/**
 * Base component that initializes feature flags by fetching them from the API
 * Wraps children and shows loading state while fetching feature flags
 *
 * Note: This is the base component. Applications should create wrapper components that pass auth props.
 *
 * @example
 * ```typescript
 * // In app-level wrapper component
 * import { FeatureFlagInitializerBase } from '@libs/shared/feature-flags';
 *
 * export const FeatureFlagInitializer = ({ children }) => {
 *   const { orgId } = useAuth();
 *   const httpClient = useHttp();
 *   return (
 *     <FeatureFlagInitializerBase store={useStore} orgId={orgId} httpClient={httpClient}>
 *       {children}
 *     </FeatureFlagInitializerBase>
 *   );
 * };
 * ```
 */
export function FeatureFlagInitializerBase<T extends FeatureFlagsState>({
  children,
  store,
  orgId,
  httpClient,
  spinnerColor = 'text-primary-default',
}: FeatureFlagInitializerProps<T>) {
  const features = store((state) => state.features);
  const isLoading = store((state) => state.isLoading);
  const error = store((state) => state.error);
  const fetchFeatureFlags = store((state) => state.fetchFeatureFlags);

  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch when orgId is available and we haven't fetched before
    if (
      orgId &&
      orgId.trim() !== '' &&
      !hasFetched.current &&
      !isLoading &&
      !error
    ) {
      hasFetched.current = true;
      fetchFeatureFlags(httpClient);
    }
  }, [orgId, isLoading, error, fetchFeatureFlags, httpClient]);

  if (orgId && features && features.length === 0 && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`h-8 w-8 animate-spin ${spinnerColor}`} />
          <div className="text-text-2">
            Loading organization feature details...
          </div>
        </div>
      </div>
    );
  }

  // Graceful degradation: Continue with app if feature flags fail
  if (error && features && features.length === 0) {
    console.warn(
      '[FeatureFlags] Failed to load feature flags, continuing with defaults:',
      error
    );
  }

  return <>{children}</>;
}
