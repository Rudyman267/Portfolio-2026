import { FeatureFlag } from './feature-flag.enum';

/**
 * Globally released feature flags that are always enabled for all organizations.
 * These features bypass DB checks and return `true` regardless of organization configuration.
 */
export const GloballyReleasedFeatures: readonly FeatureFlag[] = [
  FeatureFlag.THREE_D_GRID,
  FeatureFlag.AI_SPOTCHECK,
] as const;
