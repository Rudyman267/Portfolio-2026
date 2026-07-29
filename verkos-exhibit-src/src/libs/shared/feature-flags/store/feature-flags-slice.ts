import { StateCreator } from 'zustand';
import { OrganizationConfig } from '../../api-modules/organization';
import { AxiosInstance } from 'axios';
import { FeatureFlagsState } from '../types/feature-flags.types';
import { FeatureFlag, GloballyReleasedFeatures } from '../../types';

/**
 * Creates a Zustand slice for feature flags
 * This can be merged into a larger store using Zustand's slice pattern
 *
 * Usage in store:
 * ```typescript
 * export const useStore = create<RootState>()(
 *   devtools(
 *     (...args) => ({
 *       ...createFeatureFlagsSlice(...args),
 *       // ... other slices
 *     })
 *   )
 * );
 * ```
 */
export const createFeatureFlagsSlice: StateCreator<FeatureFlagsState> = (
  set,
  get
) => ({
  // Initial state
  features: [],
  isLoading: false,
  error: null,

  // UTILITY FUNCTIONS - use arrow functions for stable references
  isEnabled: (featureName: string) => {
    if (GloballyReleasedFeatures.includes(featureName as FeatureFlag)) {
      return true;
    }

    const { features } = get();
    const feature = features.find((f) => f.name === featureName);
    if (!feature) return false;
    if (typeof feature.value === 'boolean') return feature.value;
    if (typeof feature.value === 'string')
      return feature.value.toLowerCase() === 'true';
    return false;
  },

  getValue: <T = boolean | string>(featureName: string) => {
    const { features } = get();
    const feature = features.find((f) => f.name === featureName);
    return feature?.value as T;
  },

  hasFeature: (featureName: string) => {
    const { features } = get();
    return features.some((f) => f.name === featureName);
  },

  // API CALL - ONLY CALLED FROM APP LEVEL
  fetchFeatureFlags: async (httpClient: AxiosInstance) => {
    set({ isLoading: true, error: null });

    try {
      const response = await httpClient.get<OrganizationConfig>(
        '/organization/entitlements/fetch'
      );

      set({
        features: response.data.features || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch feature flags';
      console.error('[FeatureFlags]', 'Failed to fetch feature flags:', {
        error: errorMessage,
      });
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  setFeatureFlags: (config: OrganizationConfig) => {
    set({
      features: config.features || [],
      isLoading: false,
      error: null,
    });
  },

  clearFeatureFlags: () => {
    set({
      features: [],
      isLoading: false,
      error: null,
    });
  },
});
