import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  createFeatureFlagsSlice,
  FeatureFlagsState,
} from '@libs/shared/feature-flags';

/**
 * Standalone feature flags store for App Template
 * Uses the shared createFeatureFlagsSlice with template-specific middleware configuration
 */
export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  subscribeWithSelector(
    devtools(createFeatureFlagsSlice, {
      name: 'App Template Feature Flags Store',
    })
  )
);
