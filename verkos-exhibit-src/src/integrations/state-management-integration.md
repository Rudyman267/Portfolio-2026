# State Management Integration (Zustand)

## Overview

Add centralized state management using Zustand stores.

## Reference Apps

- **mission-planner** - Mission state, UI preferences (`/src/store/`)
- **fleet** - Drone state, video wall layout

## Quick Setup

### 1. Create Store Slice

**File**: `src/store/slices/feature.slice.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface FeatureState {
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;
}

interface FeatureActions {
  setItems: (items: Item[]) => void;
  selectItem: (id: string) => void;
  reset: () => void;
}

type FeatureStore = FeatureState & FeatureActions;

const initialState: FeatureState = {
  items: [],
  selectedId: null,
  isLoading: false,
};

export const useFeatureStore = create<FeatureStore>()(
  immer((set) => ({
    ...initialState,

    setItems: (items) =>
      set((state) => {
        state.items = items;
      }),

    selectItem: (id) =>
      set((state) => {
        state.selectedId = id;
      }),

    reset: () => set(initialState),
  }))
);
```

### 2. Create Selectors (Optional but Recommended)

**File**: `src/store/selectors/feature.selectors.ts`

```typescript
import { FeatureStore } from '../slices/feature.slice';

export const featureSelectors = {
  items: (state: FeatureStore) => state.items,
  selectedItem: (state: FeatureStore) => state.items.find((item) => item.id === state.selectedId),
  isLoading: (state: FeatureStore) => state.isLoading,
};
```

### 3. Use in Components

```typescript
import { useFeatureStore } from '@/store/slices/feature.slice';
import { featureSelectors } from '@/store/selectors/feature.selectors';

function MyComponent() {
  // Select specific state
  const items = useFeatureStore(featureSelectors.items);
  const selectedItem = useFeatureStore(featureSelectors.selectedItem);

  // Select actions
  const setItems = useFeatureStore((state) => state.setItems);
  const selectItem = useFeatureStore((state) => state.selectItem);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} onClick={() => selectItem(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

## Store Organization

```
store/
├── models/           - TypeScript interfaces
├── selectors/        - Reusable selectors (performance)
└── slices/           - Store implementations
```

## Best Practices

- Use Immer middleware for immutable updates
- Create granular selectors to minimize re-renders
- Subscribe stores to socket events for real-time updates
- Use shallow equality for performance

## Reference

See `apps/mission-planner/src/store/` for complete examples
