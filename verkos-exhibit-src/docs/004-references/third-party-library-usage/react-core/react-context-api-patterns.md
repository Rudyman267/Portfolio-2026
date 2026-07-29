# React Context API - Patterns & Best Practices

> **Purpose**: Comprehensive guide on when and how to use React Context API for state management in the monorepo applications.
>
> **Status**: Active Standard
>
> **Last Updated**: 2026-01-27

---

## Table of Contents

1. [When to Use Context](#1-when-to-use-context)
2. [Context vs Other State Management](#2-context-vs-other-state-management)
3. [Context Scope & Granularity](#3-context-scope--granularity)
4. [Provider Composition Patterns](#4-provider-composition-patterns)
5. [Performance Optimization](#5-performance-optimization)
6. [Custom Context Hooks](#6-custom-context-hooks)
7. [Provider Placement Strategy](#7-provider-placement-strategy)
8. [Testing Context](#8-testing-context)
9. [Real-World Examples](#9-real-world-examples-from-codebase)
10. [Anti-Patterns to Avoid](#10-anti-patterns-to-avoid)
11. [Decision Tree](#11-decision-tree)

---

## 1. When to Use Context

### Ideal Use Cases for Context API

**✅ Use Context for:**

1. **Application-Wide Configuration**
   - Authentication state (user session, tokens, permissions)
   - Theme settings (dark mode, color scheme)
   - Internationalization (locale, translations)
   - Feature flags

2. **Cross-Cutting Concerns**
   - HTTP client instance with interceptors
   - WebSocket connections
   - Keyboard shortcuts manager
   - Map instances (Cesium, Leaflet)

3. **UI State Shared Across Routes**
   - Modal/dialog state
   - Toast notifications
   - Loading overlays
   - Navigation state

4. **Infrastructure Services**
   - Logging services
   - Analytics tracking
   - Error boundary context

**❌ DON'T Use Context for:**

1. **Server State** - Use TanStack Query instead
2. **Complex Client State** - Use Zustand instead
3. **Prop Drilling (2-3 levels)** - Just pass props
4. **Frequently Changing Values** - Performance concerns
5. **Form State** - Keep local or use form libraries

### Context Decision Criteria

**Use Context when:**
- State is needed by many components at different nesting levels
- State is "app-wide" or "feature-wide" infrastructure
- State changes infrequently (auth, theme, config)
- You need to avoid prop drilling through 4+ levels
- State represents a singleton service (HTTP client, map instance)

**Don't use Context when:**
- State is local to a feature (use feature Zustand store)
- State comes from a server (use TanStack Query)
- State changes frequently (telemetry, real-time data)
- Only 2-3 components need the data (just pass props)

---

## 2. Context vs Other State Management

### State Management Spectrum

```
Local State → Props → Context → Global State (Zustand) → Server State (Query)
     ↓           ↓         ↓                ↓                      ↓
  Component    Pass    Shared         Cross-feature           API data
  only       through    across        client state            with
             props    component        persistence            caching
                       tree
```

### Comparison Matrix

| State Type | Solution | Example | Update Frequency | Scope |
|------------|----------|---------|------------------|-------|
| **Ephemeral UI** | `useState` | Modal open/close | High | Single component |
| **Form State** | `useState` / Form lib | Input values | High | Form component |
| **Prop Drilling** | Props (2-3 levels) | Theme toggle | Low-Medium | Parent→Child |
| **App Infrastructure** | **Context** | Auth, HTTP, i18n | Low | Entire app |
| **Feature State** | **Zustand** | Asset list filters | Medium-High | Feature scope |
| **Server State** | **TanStack Query** | User profile, assets | Low (cache) | App-wide |

### When to Choose What

**Choose `useState` (Local State):**
```typescript
// ✅ GOOD: Component-local state
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
```

**Choose Props (Data Flow):**
```typescript
// ✅ GOOD: Passing data 2-3 levels
<UserCard user={user} onUpdate={handleUpdate} />
<UserList users={users} onUserSelect={handleSelect} />
```

**Choose Context (Infrastructure):**
```typescript
// ✅ GOOD: App-wide infrastructure
<AuthProvider>
  <HttpProvider>
    <I18nProvider>
      <KeyboardProvider>
        <MapProvider>
          <App />
        </MapProvider>
      </KeyboardProvider>
    </I18nProvider>
  </HttpProvider>
</AuthProvider>
```

**Choose Zustand (Feature State):**
```typescript
// ✅ GOOD: Feature-level client state
const assetListUI = useAssetListUIStore();
const { viewMode, sortBy, setViewMode } = assetListUI;
```

**Choose TanStack Query (Server State):**
```typescript
// ✅ GOOD: Server data with caching
const { data: assets, isLoading } = useAssetList();
const createMutation = useCreateAsset();
```

---

## 3. Context Scope & Granularity

### Context Hierarchy Levels

**Level 1: Application-Level Contexts** (Root providers in `App.tsx`)

```typescript
// /apps/mission-planner/src/App.tsx
<QueryClientProvider client={queryClient}>
  <SuperTokensWrapper>
    <AuthProvider authConfig={authConfig}>
      <HttpProvider routerConfig={...}>
        <I18nProvider>
          <KeyboardProvider>
            <MapProvider>
              <App />
            </MapProvider>
          </KeyboardProvider>
        </I18nProvider>
      </HttpProvider>
    </AuthProvider>
  </SuperTokensWrapper>
</QueryClientProvider>
```

**Level 2: Feature-Level Contexts** (Within feature modules)

```typescript
// Feature-specific contexts
<MissionPlannerProvider value={contextValue}>
  <Feature />
</MissionPlannerProvider>

<MultiSelectDeleteDialogProvider>
  <MissionSequenceList />
</MultiSelectDeleteDialogProvider>
```

### Granularity Principles

**✅ Coarse-Grained Contexts (Preferred):**
- One context per domain (Auth, HTTP, Map, Keyboard)
- Combine related values (user + session + permissions in Auth)
- Reduces provider nesting depth
- Better performance (fewer context consumers)

**❌ Fine-Grained Contexts (Avoid):**
- Separate contexts for user, session, permissions (overkill)
- Context for every piece of state
- Too many providers to manage

**Example from codebase:**

```typescript
// ✅ GOOD: Coarse-grained auth context
interface AuthContextType {
  session: ReturnType<typeof useSessionContext>;
  userId: string | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  orgId: string;
  userType: string | undefined;
  tokenPayload: TokenPayload | null;
  authConfig: AuthConfig;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkCurrentOrgInMap: () => Promise<OrgCheckState>;
  isUserASuperAdmin: () => Promise<boolean>;
  setOrgId: (orgId: string) => boolean;
}

// ❌ BAD: Splitting into multiple contexts
<UserContext>
  <SessionContext>
    <PermissionContext>
      <OrgContext>
        <App />
      </OrgContext>
    </PermissionContext>
  </SessionContext>
</UserContext>
```

### Context Naming Conventions

```typescript
// Context type: [Domain]ContextValue or [Domain]ContextType
interface AuthContextValue { ... }
interface MapContextValue { ... }
interface KeyboardContextValue { ... }

// Context object: [Domain]Context
export const AuthContext = createContext<AuthContextValue | null>(null);
export const MapContext = createContext<MapContextValue | undefined>(undefined);

// Provider component: [Domain]Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => { ... };
export const MapProvider: React.FC<MapProviderProps> = ({ children }) => { ... };

// Custom hook: use[Domain]
export const useAuth = () => { ... };
export const useMapContext = () => { ... };
export const useKeyboard = () => { ... };
```

---

## 4. Provider Composition Patterns

### Provider Composition Strategies

**Pattern 1: Nested Providers (Standard)**

```typescript
// ✅ GOOD: Standard nested provider composition
export default function App() {
  return (
    <FBErrorBoundary environment={environment}>
      <Suspense fallback={<LoadingScreen />}>
        <QueryClientProvider client={queryClient}>
          <SuperTokensWrapper>
            <AuthProvider authConfig={authConfig}>
              <HttpProvider routerConfig={{ setAuthContext }}>
                <I18nProvider>
                  <KeyboardProvider>
                    <MapProvider>
                      <FeatureFlagInitializer>
                        <TooltipProvider>
                          <Toaster position="top-right" />
                          {contextReady ? <RouterProvider router={router} /> : <LoadingScreen />}
                        </TooltipProvider>
                      </FeatureFlagInitializer>
                    </MapProvider>
                  </KeyboardProvider>
                </I18nProvider>
              </HttpProvider>
            </AuthProvider>
          </SuperTokensWrapper>
        </QueryClientProvider>
      </Suspense>
    </FBErrorBoundary>
  );
}
```

**Pattern 2: Context Composition Hook**

```typescript
// Create composed context provider
const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authConfig={authConfig}>
        <HttpProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </HttpProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

**Pattern 3: Provider with External Dependencies**

```typescript
// ✅ GOOD: HttpProvider uses useAuth hook internally
export const HttpProvider: React.FC<HttpProviderProps> = ({
  children,
  routerConfig,
}) => {
  const auth = useAuth();
  const authRef = useRef(auth);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  const client = useMemo(() => {
    return createHttpClient(
      auth.authConfig?.appInfo?.apiDomain,
      auth.authConfig,
      () => authRef.current.orgId // Ref ensures latest value
    );
  }, [auth.authConfig]);

  useEffect(() => {
    if (routerConfig?.setAuthContext && client) {
      routerConfig.setAuthContext(auth, client);
    }
  }, [auth, client, routerConfig]);

  return (
    <HttpContext.Provider value={{ client }}>
      {children}
    </HttpContext.Provider>
  );
};
```

**Pattern 4: Feature-Level Provider Composition**

```typescript
// Feature-specific provider within a route
export default function MissionPlannerRoute() {
  const contextValue = useMemo(() => ({
    validationErrors: [],
    isDirty: false,
  }), []);

  return (
    <MissionPlannerProvider value={contextValue}>
      <MultiSelectDeleteDialogProvider>
        <MissionPlannerLayout />
      </MultiSelectDeleteDialogProvider>
    </MissionPlannerProvider>
  );
}
```

---

## 5. Performance Optimization

### Context Performance Challenges

**Problem:** All consumers re-render when ANY context value changes.

```typescript
// ❌ BAD: All consumers re-render on any auth change
const authContextValue = {
  session,
  userId,
  isLoading,
  isAuthenticated,
  orgId,
  // ... many more values
};
```

### Optimization Strategies

**1. Memoize Context Value**

```typescript
// ✅ GOOD: Memoize to prevent unnecessary re-renders
const authContextValue = useMemo(() => ({
  session,
  userId: session.loading ? undefined : tokenPayload?.['user_id'],
  isLoading: session.loading,
  isAuthenticated,
  orgId,
  // ... other values
}), [session, tokenPayload, isAuthenticated, orgId]);
```

**2. Split Context by Update Frequency**

```typescript
// ✅ GOOD: Split static vs dynamic context
const AuthStaticContext = createContext<{ config: AuthConfig } | null>(null);
const AuthDynamicContext = createContext<{
  user: User | null;
  logout: () => void;
} | null>(null);

// Component only re-renders on user changes
const SomeComponent = () => {
  const { config } = useAuthStaticContext();
  return <div>{config.appName}</div>;
};
```

**3. Use Ref for Closure-Prone Values**

```typescript
// ✅ GOOD: Use ref to avoid closure staleness
const HttpProvider = ({ children, routerConfig }) => {
  const auth = useAuth();
  const authRef = useRef(auth);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  const client = useMemo(() => {
    return createHttpClient(
      auth.authConfig?.apiDomain,
      auth.authConfig,
      () => authRef.current.orgId // Ref ensures latest value
    );
  }, [auth.authConfig]);

  return <HttpContext.Provider value={{ client }}>{children}</HttpContext.Provider>;
};
```

**4. Selective Context Consumption**

```typescript
// ✅ GOOD: Create specific hooks to prevent re-renders
export const useUserId = () => {
  const auth = useAuth();
  return auth.userId;
};

export const useIsAuthenticated = () => {
  const auth = useAuth();
  return auth.isAuthenticated;
};

// Component only re-renders when userId changes
const UserProfile = () => {
  const userId = useUserId();
  // ...
};
```

**5. React.memo for Expensive Components**

```typescript
// ✅ GOOD: Memoize expensive components
const ExpensiveMapComponent = React.memo(({ mapInstance }) => {
  return <CesiumMap instance={mapInstance} />;
});

export default function MapView() {
  const { mapInstance } = useMapContext();
  return <ExpensiveMapComponent mapInstance={mapInstance} />;
}
```

### Performance Checklist

- Memoize context values when they change frequently
- Split contexts by update frequency (static vs dynamic)
- Use refs for closure-prone values
- Create selective hooks for specific values
- Memoize expensive components
- Use useCallback for context functions

---

## 6. Custom Context Hooks

### Hook Patterns

**1. Basic Hook with Error Handling**

```typescript
// libs/core/auth-frontend/hooks/useAuth.ts
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const session = useSessionContext();

  return {
    ...context,
    session,
    isAuthenticated: !session.loading && session.doesSessionExist,
    isLoading: session.loading,
  };
}
```

**2. Hook with Selectors (Performance)**

```typescript
// ✅ GOOD: Create specific hooks to prevent re-renders
export const useUserId = () => {
  const auth = useAuth();
  return auth.userId;
};

export const useIsAuthenticated = () => {
  const auth = useAuth();
  return auth.isAuthenticated;
};

export const useOrgId = () => {
  const auth = useAuth();
  return auth.orgId;
};

export const useAuthActions = () => {
  const auth = useAuth();
  return {
    logout: auth.logout,
    refreshSession: auth.refreshSession,
    setOrgId: auth.setOrgId,
  };
};
```

**Benefits:**
- Components only re-render when specific value changes
- Clearer intent (better readability)
- Easier to refactor

**3. Hook with Default Values**

```typescript
// ✅ GOOD: Provide defaults for optional context
const defaultContextValue = {
  validationErrors: [],
  isDirty: false,
};

const MissionPlannerContext = createContext(defaultContextValue);

export const useMissionPlannerContext = () => {
  const context = useContext(MissionPlannerContext);

  if (context === undefined) {
    console.warn('useMissionPlannerContext was called outside of its Provider');
    return defaultContextValue;
  }

  return context;
};
```

**4. Hook with Ready State**

```typescript
// ✅ GOOD: Expose ready state for async initialization
export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};

// Usage
const Component = () => {
  const { keyboardManager, isReady } = useKeyboard();

  useEffect(() => {
    if (!isReady || !keyboardManager) return;
    // Register feature-specific handlers
  }, [isReady, keyboardManager]);
};
```

**5. Hook with Derived State**

```typescript
// ✅ GOOD: Compute derived values in hook
export const useAuthContext = () => {
  const auth = useAuth();

  return {
    // Raw values
    user: auth.userId,
    orgId: auth.orgId,
    isAuthenticated: auth.isAuthenticated,

    // Derived values
    hasAuth: !!auth.userId && auth.isAuthenticated,
    canManageAssets: auth.userType === 'ADMIN',
    requiresOrgSetup: !auth.orgId && auth.isAuthenticated,
  };
};
```

---

## 7. Provider Placement Strategy

### Provider Hierarchy

**Root-Level Providers (App.tsx)**

```typescript
// 1. Error Boundary (outermost)
<FBErrorBoundary environment={environment}>

  {/* 2. Suspense */}
  <Suspense fallback={<LoadingScreen />}>

    {/* 3. Query Client */}
    <QueryClientProvider client={queryClient}>

      {/* 4. Authentication */}
      <SuperTokensWrapper>

        {/* 5. Auth Provider */}
        <AuthProvider authConfig={authConfig}>

          {/* 6. HTTP Provider */}
          <HttpProvider routerConfig={...}>

            {/* 7. I18n Provider */}
            <I18nProvider>

              {/* 8. Keyboard Provider */}
              <KeyboardProvider>

                {/* 9. Map Provider */}
                <MapProvider>

                  {/* 10. Feature Flags */}
                  <FeatureFlagInitializer>

                    {/* 11. UI Providers */}
                    <TooltipProvider>
                      <Toaster />

                      {/* 12. Router */}
                      {contextReady ? <RouterProvider router={router} /> : <LoadingScreen />}

                    </TooltipProvider>
                  </FeatureFlagInitializer>
                </MapProvider>
              </KeyboardProvider>
            </I18nProvider>
          </HttpProvider>
        </AuthProvider>
      </SuperTokensWrapper>
    </QueryClientProvider>
  </Suspense>
</FBErrorBoundary>
```

**Feature-Level Providers**

```typescript
// routes/missions.tsx
export default function MissionsRoute() {
  const contextValue = useMemo(() => ({
    validationErrors: [],
    isDirty: false,
  }), []);

  return (
    <MissionPlannerProvider value={contextValue}>
      <MultiSelectDeleteDialogProvider>
        <MissionList />
      </MultiSelectDeleteDialogProvider>
    </MissionPlannerProvider>
  );
}
```

### Placement Rules

**Key Principles:**
- Place as low as possible (don't over-wrap)
- Respect initialization order (Auth → HTTP → others)
- Consider lazy initialization for heavy providers
- Co-locate providers with features

---

## 8. Testing Context

### Testing Strategies

**Method 1: Wrap with Test Provider**

```typescript
// ✅ GOOD: Custom test render function
import { render } from '@testing-library/react';

const createTestAuthContext = (overrides = {}) => ({
  session: { doesSessionExist: true, loading: false },
  userId: 'test-user-id',
  isAuthenticated: true,
  orgId: 'test-org-id',
  logout: vi.fn(),
  ...overrides,
});

const renderWithAuth = (ui, authContext = {}) => {
  return render(
    <AuthContext.Provider value={createTestAuthContext(authContext)}>
      {ui}
    </AuthContext.Provider>
  );
};

// Usage in tests
it('renders user profile when authenticated', () => {
  const { getByText } = renderWithAuth(<UserProfile />);
  expect(getByText('John Doe')).toBeInTheDocument();
});

it('shows login when not authenticated', () => {
  const { getByText } = renderWithAuth(<UserProfile />, {
    isAuthenticated: false,
    userId: undefined,
  });
  expect(getByText('Please login')).toBeInTheDocument();
});
```

**Method 2: Mock Custom Hook**

```typescript
// ✅ GOOD: Mock the hook directly
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

it('uses auth context correctly', () => {
  (useAuth as jest.Mock).mockReturnValue({
    userId: 'test-user',
    isAuthenticated: true,
    logout: vi.fn(),
  });

  const { result } = renderHook(() => useAuth());
  expect(result.current.userId).toBe('test-user');
});
```

**Method 3: Test Provider Dependencies**

```typescript
// ✅ GOOD: Test provider that consumes another context
import { renderHook } from '@testing-library/react';

it('creates HTTP client with auth context', () => {
  const { result } = renderHook(() => useHttp(), {
    wrapper: ({ children }) => (
      <AuthProvider authConfig={mockAuthConfig}>
        <HttpProvider routerConfig={{}}>
          {children}
        </HttpProvider>
      </AuthProvider>
    ),
  });

  expect(result.current.client).toBeDefined();
});
```

---

## 9. Real-World Examples (from codebase)

### Example 1: AuthProvider Pattern

**Location:** `/libs/core/auth-frontend/providers/AuthProvider.tsx`

**Key Patterns:**
- Combines SuperTokens session with custom auth context
- Non-blocking render (always renders children)
- No memoization (infrequent updates acceptable)

```typescript
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  authConfig,
  backendUrl,
}: {
  children: ReactNode;
  authConfig: AuthConfig;
  backendUrl?: string;
}): JSX.Element {
  const session = useSessionContext();
  const [orgId, setOrgId] = useState<string>('');
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const isAuthenticated = !session.loading && session.doesSessionExist === true;

  const authContextValue: AuthContextType = {
    session,
    userId: session.loading ? undefined : tokenPayload?.['user_id']?.toString(),
    isLoading: session.loading,
    isAuthenticated,
    orgId,
    userType: tokenPayload?.['user_type']?.toString(),
    tokenPayload,
    authConfig,
    logout,
    refreshSession,
    checkCurrentOrgInMap,
    isUserASuperAdmin,
    setOrgId: setOrgIdForApp,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Why this works:**
- Authentication state changes infrequently (good for context)
- Combines multiple related values (user + session + org)
- Custom hook provides type safety and error handling

### Example 2: HttpProvider with Ref Pattern

**Location:** `/libs/core/auth-frontend/providers/HttpProvider.tsx`

**Key Patterns:**
- Consumes AuthContext
- Uses `useRef` to avoid closure staleness
- Memoizes HTTP client (expensive to recreate)

```typescript
export const HttpProvider: React.FC<HttpProviderProps> = ({
  children,
  routerConfig,
}) => {
  const auth = useAuth();
  const authRef = useRef(auth);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  const client = useMemo(() => {
    const effectiveBaseUrl = auth.authConfig?.appInfo?.apiDomain || AUTH_DEFAULTS.HTTP_BASE_URL;

    return createHttpClient(
      effectiveBaseUrl,
      auth.authConfig,
      () => authRef.current.orgId // Ref ensures latest value
    );
  }, [auth.authConfig]);

  useEffect(() => {
    if (routerConfig?.setAuthContext && client) {
      routerConfig.setAuthContext(auth, client);
    }
  }, [auth, client, routerConfig]);

  return (
    <HttpContext.Provider value={{ client }}>
      {children}
    </HttpContext.Provider>
  );
};
```

**Why this pattern matters:**
- HTTP client is expensive to recreate (only recreate on config change)
- `useRef` ensures client always has latest `orgId` without recreation

### Example 3: KeyboardProvider Infrastructure

**Location:** `/apps/mission-planner/src/contexts/KeyboardContext.tsx`

**Key Patterns:**
- Infrastructure singleton initialization
- Exposes ready state for async initialization
- Cleanup on unmount

```typescript
export const KeyboardProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const keyboardManagerRef = useRef<KeyboardManager | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const keyboardManager = KeyboardManager.getInstance({
      debug: false,
      continuousEventFrequencyInMS: 100,
    });

    keyboardManager.initialize();
    keyboardManagerRef.current = keyboardManager;
    setIsReady(true);

    return () => {
      keyboardManager.dispose();
    };
  }, []);

  return (
    <KeyboardContext.Provider
      value={{
        keyboardManager: keyboardManagerRef.current,
        isReady,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};
```

**Why this pattern:**
- KeyboardManager is a singleton (only one instance needed)
- Async initialization requires `isReady` flag
- Centralized cleanup prevents memory leaks

### Example 4: MapProvider Pattern

**Location:** `/apps/mission-planner/src/contexts/MapContext.tsx`

**Key Patterns:**
- Simple state management for map instance
- Setter pattern (allows components to update map)
- Ready state for async initialization

```typescript
interface MapContextValue {
  mapInstance: IFlytMap | null;
  setMapInstance: (instance: IFlytMap | null) => void;
  isMapReady: boolean;
  setIsMapReady: (ready: boolean) => void;
}

export const MapProvider = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<IFlytMap | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  return (
    <MapContext.Provider
      value={{
        mapInstance,
        setMapInstance,
        isMapReady,
        setIsMapReady,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
```

**Why this pattern:**
- Map instance is expensive to create (singleton-like)
- Async initialization requires ready state
- Allows components to set map instance after initialization

### Example 5: Multi-Select Dialog Context

**Location:** `/apps/mission-planner/src/contexts/MultiSelectDeleteDialogContext.tsx`

**Key Patterns:**
- Dialog state management
- Handler registration pattern
- Centralized dialog control

```typescript
export const MultiSelectDeleteDialogProvider = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteHandler, setDeleteHandler] = useState<(() => Promise<boolean>) | null>(null);

  const showDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const hideDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteHandler) {
      console.warn('Delete handler not registered');
      setIsDialogOpen(false);
      return;
    }
    setIsDialogOpen(false);
    await deleteHandler();
  }, [deleteHandler]);

  const setConfirmDeleteHandler = useCallback(
    (handler: () => Promise<boolean>) => {
      setDeleteHandler(() => handler);
    },
    []
  );

  return (
    <MultiSelectDeleteDialogContext.Provider
      value={{
        isDialogOpen,
        showDialog,
        hideDialog,
        confirmDelete,
        setConfirmDeleteHandler,
      }}
    >
      {children}
    </MultiSelectDeleteDialogContext.Provider>
  );
};
```

**Why this pattern:**
- Avoids duplicating dialog state across components
- Handler registration allows flexible delete behavior

---

## 10. Anti-Patterns to Avoid

### 1. Context for Everything

```typescript
// ❌ BAD: Using context for feature state (should use Zustand)
const AssetListContext = createContext({
  assets: [],
  filters: {},
  setFilters: () => {},
});

// ✅ GOOD: Use Zustand for feature state
const useAssetListStore = create((set) => ({
  assets: [],
  filters: {},
  setFilters: (filters) => set({ filters }),
}));
```

**Why:** Context causes all consumers to re-render on any change. Zustand allows selective subscriptions.

### 2. Context for Server State

```typescript
// ❌ BAD: Fetching and storing server data in context
const UserContext = createContext({
  users: [],
  loading: false,
  fetchUsers: () => {},
});

// ✅ GOOD: Use TanStack Query for server state
const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};
```

**Why:** TanStack Query handles caching, invalidation, retries. Context doesn't handle server state requirements.

### 3. Context in High-Frequency Updates

```typescript
// ❌ BAD: Storing frequently changing values in context
const TelemetryContext = createContext({
  dronePosition: { x: 0, y: 0, z: 0 },
  // Updates 10-60 times per second!
});

// ✅ GOOD: Use Zustand with selective subscriptions
const useTelemetryStore = create((set) => ({
  dronePosition: { x: 0, y: 0, z: 0 },
  updateTelemetry: (data) => set(data),
}));
```

**Why:** Context re-renders all consumers on every update = performance disaster.

### 4. Deep Nesting Without Composition

```typescript
// ❌ BAD: Too many nested providers
function App() {
  return (
    <AuthProvider>
      <HttpProvider>
        <I18nProvider>
          <ThemeProvider>
            <FeatureFlagProvider>
              <KeyboardProvider>
                <MapProvider>
                  <RouterProvider />
                </MapProvider>
              </KeyboardProvider>
            </FeatureFlagProvider>
          </ThemeProvider>
        </I18nProvider>
      </HttpProvider>
    </AuthProvider>
  );
}

// ✅ GOOD: Compose related providers
function AppProviders({ children }) {
  return (
    <AuthProvider>
      <HttpProvider>
        <I18nProvider>
          <KeyboardProvider>
            <MapProvider>
              {children}
            </MapProvider>
          </KeyboardProvider>
        </I18nProvider>
      </HttpProvider>
    </AuthProvider>
  );
}
```

### 5. Missing Error Handling

```typescript
// ❌ BAD: No error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context; // Returns undefined if used outside provider
};

// ✅ GOOD: Proper error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 6. Prop Drilling Through Context

```typescript
// ❌ BAD: Using context for one level
function Parent() {
  return (
    <UserContext.Provider value={{ user: userData }}>
      <Child />
    </UserContext.Provider>
  );
}

// ✅ GOOD: Just pass props
function Parent() {
  return <Child user={userData} />;
}

**Rule of thumb:** If only 1-2 components need the data, use props.
```

### 7. Context Without Memoization

```typescript
// ❌ BAD: Creating new object on every render
function MyProvider({ children }) {
  return (
    <MyContext.Provider value={{ data: [], loading: false }}>
      {children}
    </MyContext.Provider>
  );
}

// ✅ GOOD: Memoize context value
function MyProvider({ children }) {
  const value = useMemo(() => ({
    data: [],
    loading: false,
  }), []);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}
```

---

## 11. Decision Tree

### State Management Decision Tree

```
┌─────────────────────────────────────────────┐
│ What type of state are you managing?        │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   Server Data?           Client Data?
        │                       │
        │ YES                   │ NO
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ TanStack Query   │   │ Local useState()  │
│ - Caching        │   │ - Form inputs    │
│ - Refetching     │   │ - UI toggles     │
│ - Deduplication  │   │ - Temporary data │
└──────────────────┘   └──────────────────┘
        │                       │
        │                       │ Need to share
        │                       │ across components?
        │                       │ YES
        │                       │
        │                       ▼
        │              ┌─────────────────────────┐
        │              │ Feature-level or        │
        │              │ Application-level?      │
        │              └─────────────────────────┘
        │                       │
        │           ┌───────────┴───────────┐
        │           │                       │
        │    Feature-level          Application-level
        │           │                       │
        │           ▼                       ▼
        │  ┌──────────────────┐  ┌──────────────────┐
        │  │ Zustand Store    │  │ React Context    │
        │  │ - Feature state  │  │ - Auth           │
        │  │ - UI filters    │  │ - HTTP client    │
        │  │ - Selection     │  │ - Theme          │
        │  │ - View prefs    │  │ - i18n           │
        │  └──────────────────┘  │ - Keyboard       │
        │                        │ - Map instance   │
        │                        └──────────────────┘
```

### Quick Reference

| Use Case | Solution | Example |
|----------|----------|---------|
| **Form input** | `useState` | Text input, checkbox |
| **Modal open/close** | `useState` | Dialog state |
| **Server data** | TanStack Query | User profile, asset list |
| **Feature UI state** | Zustand | Asset filters, selection |
| **Authentication** | **Context** | User, session, org |
| **HTTP client** | **Context** | Axios instance |
| **Theme** | **Context** | Dark mode, colors |
| **i18n** | **Context** | Locale, translations |
| **Keyboard shortcuts** | **Context** | Keyboard manager |
| **Map instance** | **Context** | Cesium/Leaflet map |
| **Real-time telemetry** | Zustand / WebSocket | Drone position (high freq) |
| **URL params** | TanStack Router | Search params, route params |

### Context Decision Flow

```
Should you use Context for this?

┌─ Is this application infrastructure? (Auth, HTTP, i18n, etc.)
│  └─ YES → Use Context
│
├─ Do 4+ components at different levels need this data?
│  └─ YES → Consider Context
│
├─ Does this change infrequently? (Config, theme, auth)
│  └─ YES → Context is suitable
│
├─ Is this a singleton service? (Map, keyboard, HTTP)
│  └─ YES → Use Context
│
├─ Does this change frequently? (>10x per second)
│  └─ YES → DON'T use Context (use Zustand)
│
├─ Is this server data? (API responses)
│  └─ YES → DON'T use Context (use TanStack Query)
│
├─ Is this feature-specific UI state? (Filters, selection)
│  └─ YES → Consider Zustand (better performance)
│
└─ Do only 1-2 components need this data?
   └─ YES → Just pass props
```

---

## Summary

### Key Takeaways

1. **Context is for infrastructure, not feature state**
   - Auth, HTTP, i18n, theme, keyboard, map → Context
   - Feature filters, selection, UI state → Zustand
   - Server data → TanStack Query

2. **Performance matters**
   - Memoize context values when appropriate
   - Split contexts by update frequency
   - Use refs for closure-prone values
   - Create selective hooks (e.g., `useUserId` instead of `useAuth`)

3. **Provider composition is standard**
   - Nest providers in App.tsx for app-wide contexts
   - Place feature providers at route level
   - Respect initialization order (Auth → HTTP → others)

4. **Custom hooks provide type safety**
   - Always export a custom hook (e.g., `useAuth`)
   - Throw helpful errors when used outside provider
   - Create selector-based hooks for performance

5. **Testing requires provider wrappers**
   - Create test render functions with providers
   - Mock contexts for unit tests
   - Test providers in isolation

### Related Documentation

- [React App Folder Structure](./react-app-folder-structure.md)
- [Zustand State Management](../../002-applications/asset-management/architecture/zustand-state-management.md)
- [Testing Standards](../testing-standards/)
- [Code Standards](./code-standards.md)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-27 | 1.0.0 | Initial documentation based on Mission Planner, Asset Management, and Fleet codebase analysis |

---

## Approval

**Approved by:** Engineering Team
**Effective Date:** 2026-01-27
**Review Cycle:** Quarterly
**Related RFCs:** N/A
