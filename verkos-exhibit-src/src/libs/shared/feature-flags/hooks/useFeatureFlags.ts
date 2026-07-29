import { UseBoundStore, StoreApi } from 'zustand';
import { FeatureFlagsState } from '../types/feature-flags.types';

/**
 * Base hook for easy access to feature flags from a Zustand store
 * Provides convenient methods to check feature flag status
 *
 * This hook uses lazy evaluation - only computes feature flags when actually needed
 * This approach scales well with many features without performance degradation
 *
 * Note: This is the base hook. Applications should create wrapper hooks that pass their store.
 *
 * @param store - Zustand store instance containing feature flags state
 * @returns Feature flags state and utility functions
 *
 * @example
 * ```typescript
 * // In app-level wrapper hook
 * import { useFeatureFlagsBase } from '@libs/shared/feature-flags';
 *
 * export const useFeatureFlags = () => {
 *   return useFeatureFlagsBase(useMissionStore);
 * };
 * ```
 */
export function useFeatureFlagsBase<T extends FeatureFlagsState>(
  store: UseBoundStore<StoreApi<T>>
) {
  // Select raw state using stable selectors
  const features = store((state) => state.features);
  const isLoading = store((state) => state.isLoading);
  const error = store((state) => state.error);

  // Direct delegation to store functions (stable references, no duplication)
  const isEnabled = store((state) => state.isEnabled);
  const getValue = store((state) => state.getValue);
  const hasFeature = store((state) => state.hasFeature);

  return {
    // Raw data access
    features,
    isLoading,
    error,

    isEnabled,
    getValue,
    hasFeature,
  };
}
