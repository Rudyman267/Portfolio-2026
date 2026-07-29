# Feature Flags Module

A shared module for managing feature flags across applications. Supports both Zustand slice pattern (for apps with combined stores) and standalone store pattern.

## Features

- ✅ Zustand-based state management
- ✅ Type-safe feature flag checking
- ✅ Automatic API fetching from organization entitlements
- ✅ Loading states and error handling
- ✅ Graceful degradation on errors
- ✅ Works with both slice and standalone store patterns

## Installation

The module is part of `@libs/shared` and can be imported directly:

```typescript
import { createFeatureFlagsSlice, useFeatureFlagsBase, FeatureFlagInitializerBase, FeatureFlagsState } from '@libs/shared/feature-flags';
```

## Usage Patterns

### Pattern 1: Zustand Slice (Mission Planner)

For applications that use a combined Zustand store with multiple slices:

```typescript
// store/store.ts
import { create } from 'zustand';
import { createFeatureFlagsSlice, FeatureFlagsState } from '@libs/shared/feature-flags';

export type RootState = FeatureFlagsState & /* other slices */;

export const useStore = create<RootState>()(
  devtools(
    (...args) => ({
      ...createFeatureFlagsSlice(...args),
      // ... other slices
    })
  )
);
```

```typescript
// hooks/useFeatureFlags.ts
import { useStore } from '@/store/store';
import { useFeatureFlagsBase } from '@libs/shared/feature-flags';

export const useFeatureFlags = () => {
  return useFeatureFlagsBase(useStore);
};
```

```typescript
// components/FeatureFlagInitializer.tsx
import { FeatureFlagInitializerBase } from '@libs/shared/feature-flags';
import { useStore } from '@/store/store';
import { useAuth } from '@auth';
import { useHttp } from '@auth';

export const FeatureFlagInitializer = ({ children }) => {
  const { orgId } = useAuth();
  const httpClient = useHttp();
  return (
    <FeatureFlagInitializerBase store={useStore} orgId={orgId} httpClient={httpClient}>
      {children}
    </FeatureFlagInitializerBase>
  );
};
```

### Pattern 2: Standalone Store (Fleet)

For applications that use standalone Zustand stores:

```typescript
// store/feature-flags.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createFeatureFlagsSlice } from '@libs/shared/feature-flags';

export const useFeatureFlagsStore = create(devtools(createFeatureFlagsSlice, { name: 'FeatureFlags' }));
```

```typescript
// hooks/useFeatureFlags.ts
import { useFeatureFlagsStore } from '@/store/feature-flags.store';
import { useFeatureFlagsBase } from '@libs/shared/feature-flags';

export const useFeatureFlags = () => {
  return useFeatureFlagsBase(useFeatureFlagsStore);
};
```

```typescript
// components/FeatureFlagInitializer.tsx
import { FeatureFlagInitializerBase } from '@libs/shared/feature-flags';
import { useFeatureFlagsStore } from '@/store/feature-flags.store';
import { useAuth } from '@auth';
import { useHttp } from '@auth';

export const FeatureFlagInitializer = ({ children }) => {
  const { orgId } = useAuth();
  const httpClient = useHttp();
  return (
    <FeatureFlagInitializerBase store={useFeatureFlagsStore} orgId={orgId} httpClient={httpClient}>
      {children}
    </FeatureFlagInitializerBase>
  );
};
```

## API Reference

### `createFeatureFlagsSlice`

Creates a Zustand slice for feature flags.

**Type:** `StateCreator<FeatureFlagsState>`

**Returns:** Zustand slice object with feature flags state and actions

### `useFeatureFlagsBase(store)`

Base hook to access feature flags from a Zustand store. Applications should create wrapper hooks that call this with their store.

**Parameters:**

- `store`: Zustand store instance that contains `FeatureFlagsState`

**Returns:**

```typescript
{
  features: Array<FeatureFlagData>;
  isLoading: boolean;
  error: string | null;
  isEnabled: (featureName: string) => boolean;
  getValue: <T>(featureName: string) => T | undefined;
  hasFeature: (featureName: string) => boolean;
}
```

**Example:**

```typescript
// In app-level wrapper hook
import { useFeatureFlagsBase } from '@libs/shared/feature-flags';

export const useFeatureFlags = () => {
  return useFeatureFlagsBase(useStore);
};

// Then use in components
const { isEnabled } = useFeatureFlags();
const isFeatureOn = isEnabled('MY_FEATURE_FLAG');
```

### `FeatureFlagInitializerBase`

Base component that fetches and initializes feature flags. Applications should create wrapper components that pass auth props.

**Props:**

- `store`: Zustand store instance (required)
- `orgId`: Organization ID from auth context (required)
- `httpClient`: HTTP client instance from auth context (required)
- `children`: React children (required)
- `spinnerColor`: Optional CSS class for spinner color (default: `'text-primary-default'`)

**Example:**

```typescript
// In app-level wrapper component
import { FeatureFlagInitializerBase } from '@libs/shared/feature-flags';

export const FeatureFlagInitializer = ({ children }) => {
  const { orgId } = useAuth();
  const httpClient = useHttp();
  return (
    <FeatureFlagInitializerBase store={useStore} orgId={orgId} httpClient={httpClient}>
      {children}
    </FeatureFlagInitializerBase>
  );
};
```

### `FeatureFlagsState`

TypeScript interface for feature flags state.

```typescript
interface FeatureFlagsState {
  features: Array<FeatureFlagData>;
  isLoading: boolean;
  error: string | null;
  isEnabled: (featureName: string) => boolean;
  getValue: <T>(featureName: string) => T | undefined;
  hasFeature: (featureName: string) => boolean;
  fetchFeatureFlags: (httpClient: AxiosInstance) => Promise<void>;
  setFeatureFlags: (config: OrganizationConfig) => void;
  clearFeatureFlags: () => void;
}

interface FeatureFlagData {
  name: string;
  value: boolean | string;
  _id?: string;
}
```

## Business Logic

The module fetches feature flags from `/organization/entitlements/fetch` API endpoint. The business logic is:

1. **Fetching**: Automatically fetches when `orgId` is available
2. **Caching**: Feature flags are stored in Zustand store
3. **Error Handling**: Gracefully degrades if fetch fails (continues with empty features)
4. **Loading State**: Shows loading spinner while fetching
5. **Utility Functions**:
   - `isEnabled`: Checks if a feature flag is enabled (returns boolean)
   - `getValue`: Gets the raw value of a feature flag (can be boolean or string)
   - `hasFeature`: Checks if a feature flag exists in the list

## Globally Released Features

Some features are **globally released** and are always enabled for all organizations, bypassing DB checks. These features return `true` regardless of organization configuration.

### Configuration

Globally released features are defined in:

```
libs/shared/types/feature-flag.constants.ts
```

### Adding a New Globally Released Feature

To add a new globally released feature:

1. **Add the feature flag** to `GloballyReleasedFeatures` array in `libs/shared/types/feature-flag.constants.ts`
   ```typescript
   export const GloballyReleasedFeatures: readonly FeatureFlag[] = [
     FeatureFlag.THREE_D_GRID,
     FeatureFlag.AI_SPOTCHECK,
     FeatureFlag.NEW_FEATURE, // ← Add here
   ] as const;
   ```

### How It Works

- **Feature Flag Slice** (`isEnabled`): Checks `GloballyReleasedFeatures` first, returns `true` if found
- **Feature Guard** (`requireFeature`): Checks `GloballyReleasedFeatures` first, allows access if found
- Both implementations use the same shared constant, ensuring consistency

### Current Globally Released Features

- `THREE_D_GRID` (`'3D_grid'`) - 3D Grid Mission feature
- `AI_SPOTCHECK` (`'ai_spot_check'`) - AI Spot Check feature

## Notes

- Feature flags are fetched once per app session
- The component prevents duplicate fetches using a ref
- Feature flag values can be boolean or string (strings are converted: `'true'` → `true`)
- The module is framework-agnostic and works with any Zustand store pattern
- Globally released features bypass all DB checks and are always enabled
