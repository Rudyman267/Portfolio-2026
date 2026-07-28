# Zustand Store Patterns

## Overview

Zustand is a lightweight state management library used across FlytBase apps for client-side state management.

## Reference App

**mission-planner** - Complex Zustand store managing mission state, UI preferences, and user data

## Basic Store Setup

### Simple Counter Store

**File**: `src/store/counterStore.ts`

```typescript
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Using the Store

```typescript
import { useCounterStore } from '@/store/counterStore';

function Counter() {
  // Subscribe to specific state
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  // Or subscribe to multiple values
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="flex items-center gap-3">
      <button onClick={decrement} className="bg-surface hover:bg-surface-hover px-3 py-2 rounded">
        -
      </button>
      <span className="fb-body-2 text-text-1">{count}</span>
      <button onClick={increment} className="bg-primary-200 hover:bg-primary-states-hover text-white px-3 py-2 rounded">
        +
      </button>
    </div>
  );
}
```

## Complex Store Pattern

### Application Store

**File**: `src/store/appStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface UIPreferences {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: string;
}

interface AppState {
  // User data
  user: User | null;
  setUser: (user: User | null) => void;

  // UI preferences
  uiPreferences: UIPreferences;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset store
  reset: () => void;
}

// Initial state
const initialState = {
  user: null,
  uiPreferences: {
    sidebarOpen: true,
    theme: 'dark' as const,
    language: 'en',
  },
  isLoading: false,
  error: null,
};

// Create store with devtools and persistence
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User actions
        setUser: (user) => set({ user }, false, 'setUser'),

        // UI preference actions
        setSidebarOpen: (open) =>
          set(
            (state) => ({
              uiPreferences: { ...state.uiPreferences, sidebarOpen: open },
            }),
            false,
            'setSidebarOpen'
          ),

        setTheme: (theme) =>
          set(
            (state) => ({
              uiPreferences: { ...state.uiPreferences, theme },
            }),
            false,
            'setTheme'
          ),

        setLanguage: (language) =>
          set(
            (state) => ({
              uiPreferences: { ...state.uiPreferences, language },
            }),
            false,
            'setLanguage'
          ),

        // Loading actions
        setIsLoading: (loading) => set({ isLoading: loading }, false, 'setIsLoading'),

        // Error actions
        setError: (error) => set({ error }, false, 'setError'),
        clearError: () => set({ error: null }, false, 'clearError'),

        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'app-storage', // localStorage key
        partialize: (state) => ({
          // Only persist UI preferences
          uiPreferences: state.uiPreferences,
        }),
      }
    )
  )
);
```

## Middleware

### Using Devtools

```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(
    (set) => ({
      // ... state
    }),
    {
      name: 'MyStore', // Shows in Redux DevTools
    }
  )
);
```

### Using Persist

```typescript
import { persist } from 'zustand/middleware';

export const useStore = create<State>()(
  persist(
    (set) => ({
      // ... state
    }),
    {
      name: 'my-storage', // localStorage key
      partialize: (state) => ({
        // Only persist certain fields
        preferences: state.preferences,
      }),
    }
  )
);
```

### Combining Middleware

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        // ... state
      }),
      {
        name: 'my-storage',
      }
    ),
    {
      name: 'MyStore',
    }
  )
);
```

## Slices Pattern

For large stores, split into slices:

**File**: `src/store/slices/userSlice.ts`

```typescript
import { StateCreator } from 'zustand';

interface User {
  id: string;
  name: string;
}

export interface UserSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
});
```

**File**: `src/store/slices/uiSlice.ts`

```typescript
import { StateCreator } from 'zustand';

export interface UISlice {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
});
```

**File**: `src/store/index.ts`

```typescript
import { create } from 'zustand';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createUISlice, UISlice } from './slices/uiSlice';

type StoreState = UserSlice & UISlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createUISlice(...a),
}));
```

## Accessing Store Outside Components

```typescript
// Get state
const user = useAppStore.getState().user;

// Subscribe to changes
const unsubscribe = useAppStore.subscribe((state, prevState) => {
  if (state.user !== prevState.user) {
    console.log('User changed:', state.user);
  }
});

// Unsubscribe
unsubscribe();

// Set state
useAppStore.setState({ user: newUser });
```

## Selectors

### Optimized Selector

```typescript
import { shallow } from 'zustand/shallow';

function MyComponent() {
  // Only re-renders if name or email changes
  const { name, email } = useAppStore(
    (state) => ({
      name: state.user?.name,
      email: state.user?.email,
    }),
    shallow
  );

  return (
    <div>
      <p>{name}</p>
      <p>{email}</p>
    </div>
  );
}
```

### Computed Values

```typescript
interface State {
  items: Item[];
  filter: string;
}

// Selector with computation
const useFilteredItems = () => useStore((state) => state.items.filter((item) => item.name.includes(state.filter)));

function ItemList() {
  const filteredItems = useFilteredItems();

  return (
    <ul>
      {filteredItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## Async Actions

```typescript
interface StoreState {
  users: User[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      set({ users, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      set({ isLoading: false });
    }
  },
}));
```

## Testing Stores

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounterStore } from './counterStore';

describe('CounterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCounterStore.setState({ count: 0 });
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(-1);
  });

  it('should reset count', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(0);
  });
});
```

## Best Practices

1. **Keep stores focused** - Create separate stores for different concerns
2. **Use TypeScript** - Define proper interfaces for state
3. **Normalize state** - Avoid nested structures when possible
4. **Use slices** - Split large stores into manageable pieces
5. **Optimize selectors** - Use shallow comparison for objects
6. **Document actions** - Add JSDoc comments for complex actions
7. **Use middleware wisely** - Only persist what's necessary
8. **Test stores** - Write unit tests for store actions
9. **Action naming** - Use consistent naming (set*, toggle*, add*, remove*)
10. **Avoid over-subscribing** - Only subscribe to needed state slices

## Common Patterns

### Toggle Pattern

```typescript
toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }));
```

### Array Operations

```typescript
addItem: (item) => set((state) => ({ items: [...state.items, item] })),
removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
updateItem: (id, data) => set((state) => ({
  items: state.items.map((i) => (i.id === id ? { ...i, ...data } : i))
})),
```

### Loading States

```typescript
setLoading: (key: string, loading: boolean) =>
  set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading },
  }));
```
