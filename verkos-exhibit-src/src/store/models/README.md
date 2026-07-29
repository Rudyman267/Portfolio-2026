# Store Models

This directory contains TypeScript type definitions for Zustand store state.

## Structure

```
models/
├── app.model.ts         - Global app state types
├── user.model.ts        - User state types
└── feature.model.ts     - Feature state types
```

## Example

```typescript
// models/user.model.ts
import { User } from '@/api/types/user.types';

export interface UserState {
  currentUser: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

export interface UserActions {
  setCurrentUser: (user: User | null) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  reset: () => void;
}

export type UserStore = UserState & UserActions;
```

## See Also

- `/integrations/state-management-integration.md` for Zustand setup
- `../slices/` for store implementation
- `../selectors/` for state selectors
