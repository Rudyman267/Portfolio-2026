/**
 * Shared Feature Flags Module
 *
 * Provides feature flag management functionality that can be used across multiple applications.
 * Supports both Zustand slice pattern (for apps with combined stores) and standalone store pattern.
 *
 * @example
 * ```typescript
 * // Mission Planner pattern (slice)
 * import { createFeatureFlagsSlice, useFeatureFlagsBase, FeatureFlagInitializerBase } from '@libs/shared/feature-flags';
 *
 * // Fleet pattern (standalone store)
 * import { useFeatureFlagsStore } from '@libs/shared/feature-flags';
 * import { useFeatureFlagsBase, FeatureFlagInitializerBase } from '@libs/shared/feature-flags';
 * ```
 */

export * from './types';

export * from './store';

export * from './hooks';

export * from './components';
