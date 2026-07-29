# Store Selectors

This directory contains reusable selectors for Zustand stores.

## Purpose

Selectors help:

- Avoid recomputing derived state
- Prevent unnecessary re-renders
- Centralize state access logic

## Structure

```
selectors/
├── user.selectors.ts    - User state selectors
└── app.selectors.ts     - App state selectors
```

## Example

```typescript
// selectors/user.selectors.ts
import { UserStore } from '../models/user.model';

export const userSelectors = {
  // Simple selector
  currentUser: (state: UserStore) => state.currentUser,

  // Derived selector
  isLoggedIn: (state: UserStore) => state.currentUser !== null,

  // Complex selector
  hasPermission: (permission: string) => (state: UserStore) => {
    return state.currentUser?.permissions?.includes(permission) ?? false;
  },

  // Multiple values selector
  userInfo: (state: UserStore) => ({
    user: state.currentUser,
    preferences: state.preferences,
    isLoading: state.isLoading,
  }),
};

// Usage in component:
// const user = useUserStore(userSelectors.currentUser);
// const isLoggedIn = useUserStore(userSelectors.isLoggedIn);
```

## Best Practices

- Keep selectors pure (no side effects)
- Use shallow equality for performance
- Create granular selectors to minimize re-renders
- Export selectors as a namespace object
