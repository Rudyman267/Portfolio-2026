# Store Slices

This directory contains Zustand store implementations.

## Structure

```
slices/
├── user.slice.ts        - User state management
├── app.slice.ts         - App-wide state
└── feature.slice.ts     - Feature-specific state
```

## Example

```typescript
// slices/user.slice.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { UserStore } from '../models/user.model';

const initialState = {
  currentUser: null,
  preferences: {
    theme: 'dark',
    language: 'en',
    notifications: true,
  },
  isLoading: false,
};

export const useUserStore = create<UserStore>()(
  immer((set) => ({
    ...initialState,

    setCurrentUser: (user) =>
      set((state) => {
        state.currentUser = user;
      }),

    updatePreferences: (preferences) =>
      set((state) => {
        state.preferences = { ...state.preferences, ...preferences };
      }),

    reset: () => set(initialState),
  }))
);
```

## Usage in Components

```typescript
import { useUserStore } from '@/store/slices/user.slice';
import { userSelectors } from '@/store/selectors/user.selectors';

function MyComponent() {
  // Select specific state
  const user = useUserStore(userSelectors.currentUser);

  // Select actions
  const setUser = useUserStore((state) => state.setCurrentUser);

  return <div>{user?.name}</div>;
}
```

## Integration Guide

See `/integrations/state-management-integration.md` for detailed Zustand setup.
