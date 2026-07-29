import { OrganizationConfig } from '../../api-modules/organization';
import { AxiosInstance } from 'axios';

/**
 * Feature flag data structure
 * Represents a single feature flag from the API
 */
export interface FeatureFlagData {
  name: string;
  value: boolean | string;
  _id?: string;
}

/**
 * Feature flags state interface
 * This interface defines the shape of feature flags state in Zustand stores
 */
export interface FeatureFlagsState {
  // CORE FEATURE FLAGS DATA
  features: Array<FeatureFlagData>;

  // UTILITIES FOR EASY ACCESS
  isEnabled: (featureName: string) => boolean;
  getValue: <T = boolean | string>(featureName: string) => T | undefined;
  hasFeature: (featureName: string) => boolean;

  // STATE MANAGEMENT
  isLoading: boolean;
  error: string | null;

  // ACTIONS
  fetchFeatureFlags: (httpClient: AxiosInstance) => Promise<void>;
  setFeatureFlags: (config: OrganizationConfig) => void;
  clearFeatureFlags: () => void;
}
