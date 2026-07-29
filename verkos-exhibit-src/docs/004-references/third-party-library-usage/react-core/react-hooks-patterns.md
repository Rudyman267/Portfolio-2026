# React Hooks - Patterns & Best Practices

> **Comprehensive guide for building scalable, performant custom hooks in drone operations applications**

## Table of Contents

1. [When to Create Custom Hooks](#1-when-to-create-custom-hooks)
2. [Hook Categorization System](#2-hook-categorization-system)
3. [Naming Conventions](#3-naming-conventions)
4. [Dependency Arrays Best Practices](#4-dependency-arrays-best-practices)
5. [Performance Patterns](#5-performance-patterns)
6. [Hook Composition Patterns](#6-hook-composition-patterns)
7. [Testing Hooks](#7-testing-hooks)
8. [Anti-Patterns to Avoid](#8-anti-patterns-to-avoid)
9. [Real-World Examples from Codebase](#9-real-world-examples-from-codebase)
10. [Quick Reference Checklist](#10-quick-reference-checklist)

---

## 1. When to Create Custom Hooks

### 1.1 Extract Logic for Reusability

Create a custom hook when:

- **Multiple components need the same logic** - Prevent code duplication
- **Logic is complex** - Simplify component code by extracting it
- **Logic involves state or effects** - Hooks can use useState, useEffect, etc.
- **Logic needs to be tested independently** - Easier to test in isolation

**Good Example:**
```typescript
// ❌ BEFORE: Duplicated across components
function AssetList() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };
}

// ✅ AFTER: Reusable hook
function useAssetSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);
  return { selectedIds, toggle };
}
```

### 1.2 Separate Concerns

Create focused hooks that do one thing well:

```typescript
// ✅ GOOD: Single responsibility
const assets = useAssetData();
const selection = useAssetSelection();
const filters = useAssetFilters();

// ❌ AVOID: Doing too much
const useAssetManager = () => {
  // Fetching, selection, filtering, sorting, pagination, UI state...
  // Too many responsibilities!
};
```

### 1.3 Abstract Complex State Logic

When state management becomes complex:

```typescript
// From: useGridMetricsCalculation
export const useGridMetricsCalculation = (): void => {
  const updateGridMetrics = useMissionStore((state) => state.updateGridMetrics);

  // Complex calculation logic extracted from component
  const calculateMetrics = useCallback(() => {
    // Grid area, flight time, estimated images calculations
  }, [planner, routeSettings, gsd, frontOverlap, speed]);

  useEffect(() => {
    planner.onEvent(GridMissionPlannerEventType.GRID_WAYPOINTS_UPDATED, calculateMetrics);
    return () => planner.offEvent(...);
  }, [planner, calculateMetrics]);
};
```

### 1.4 Integrate External Libraries

Wrap third-party libraries for:

- Consistent API across the app
- Easier mocking in tests
- Centralized configuration
- Error handling

```typescript
// From: useIntersectionObserver
// Wraps browser IntersectionObserver API with React patterns
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  // Cleanup, state management, error handling handled internally
}
```

---

## 2. Hook Categorization System

Our codebase uses a three-tier categorization system. This pattern from **Asset Management** provides excellent separation of concerns:

### 2.1 Client-Only Hooks (`/hooks/client/`)

**Purpose:** Pure UI state management, no server calls

**Characteristics:**
- Manage UI-only state (modals, panels, view modes)
- No data fetching or mutations
- Fast, synchronous operations
- Often wrap Zustand store selectors

**Example: `use-asset-list-ui.ts`**
```typescript
export const useAssetListUI = (): UseAssetListUIReturn => {
  // Individual primitive selectors prevent object recreation
  const selectedAssetIds = useSelectedAssetIds();
  const viewMode = useViewMode();
  const sortBy = useSortBy();

  // Pure client-side filtering logic
  const applyClientFilters = useCallback((assets: AssetMinimal[]) => {
    let filtered = assets;
    if (quickFilters.categories.length > 0) {
      filtered = filtered.filter(asset => quickFilters.categories.includes(asset.category));
    }
    return filtered;
  }, [quickFilters]);

  return { selectedAssetIds, viewMode, applyClientFilters };
};
```

### 2.2 Server/Data-Fetching Hooks (`/hooks/server/`)

**Purpose:** Server integration, data fetching, caching

**Characteristics:**
- Use TanStack Query (useQuery, useInfiniteQuery, useMutation)
- Handle loading, error states
- Implement caching strategies
- Provide optimistic updates

**Example: `use-asset-data.ts`**
```typescript
export const ASSET_QUERY_KEYS = {
  all: ['assets'] as const,
  list: (query: AssetQuery) => [...ASSET_QUERY_KEYS.all, query] as const,
};

export const useInfiniteAssets = (options: UseInfiniteAssetsOptions = {}) => {
  const assetApiService = useAssetListApiService();

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...ASSET_QUERY_KEYS.list(options.query)],
    queryFn: async ({ pageParam }) => {
      return await assetApiService.getAssetList({
        ...options.query,
        pagination: { cursor: pageParam, limit: 500 },
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore ? lastPage.pagination.cursor : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...infiniteQuery,
    isLoadingAll: infiniteQuery.isFetching || infiniteQuery.hasNextPage,
  };
};
```

### 2.3 Composed/Composite Hooks (`/hooks/composed/`)

**Purpose:** Combine client + server hooks into cohesive feature APIs

**Characteristics:**
- Import from client/ and server/ hooks
- Provide unified interface for components
- Combine multiple data sources
- Implement business logic

**Example: `use-asset-list.ts`**
```typescript
export const useAssetList = (baseQuery: Partial<AssetQuery> = {}): UseAssetListReturn => {
  // UI STATE (Zustand)
  const uiState = useAssetListUI();

  // SERVER STATE (TanStack Query)
  const { data: serverData, isLoading, error, fetchNextPage, refetch } = useInfiniteAssets({ query: baseQuery });

  // DERIVED STATE
  const assets = useMemo(() => serverData?.pages.flatMap((page) => page.assets) ?? [], [serverData]);
  const filteredAssets = useMemo(() => uiState.applyClientFilters(assets), [assets, uiState]);

  // COMPOSED OPERATIONS
  const refreshWithSelection = useCallback(() => void refetch(), [refetch]);

  return {
    assets: filteredAssets,
    isLoading,
    error,
    fetchNextPage: () => void fetchNextPage(),
    selectedAssets: uiState.selectedAssetIds,
    refreshWithSelection,
  };
};
```

### 2.4 Directory Structure

```
features/
  asset-list/
    hooks/
      index.ts                    # Public API
      client/                     # UI-only hooks
        index.ts
        use-asset-list-ui.ts
      server/                     # Data fetching hooks
        index.ts
        use-asset-data.ts
      composed/                   # Combined hooks
        index.ts
        use-asset-list.ts
```

---

## 3. Naming Conventions

### 3.1 Hook Naming

**Always start with `use`**

```typescript
// ✅ CORRECT
useAssetList()
useMissionEditor()
useGridMetricsCalculation()

// ❌ WRONG
getAssetList()
missionEditor()
calculateGridMetrics()
```

**Use descriptive, action-oriented names**

```typescript
// ✅ GOOD - Clear intent
useWaypointOperations()
useDroneIntegratedData()
useIntersectionObserver()

// ⚠️ OKAY - Generic but clear
useData()
useState()
useEffect()

// ❌ BAD - Unclear
useStuff()
useThing()
useHelper()
```

### 3.2 Return Value Naming

**Return objects, not arrays (unless there's a good reason)**

```typescript
// ✅ GOOD - Object return with clear property names
const { assets, isLoading, error, refetch } = useAssetList();

// ✅ ALSO GOOD - Array return for toggle/select pattern
const [selectedIds, toggleSelection] = useSelection();

// ❌ AVOID - Array return for multiple values
const [assets, loading, error, refetch, hasMore] = useAssetList();
// Hard to remember order!
```

**Use descriptive property names**

```typescript
// ✅ GOOD
return {
  selectedAssetIds,
  isAssetSelected,
  toggleAssetSelection,
  clearAllSelections,
};

// ❌ BAD
return {
  ids,
  check,
  toggle,
  clear,
};
```

### 3.3 Type Naming

**Hook Parameters**: `<HookName>Params`

**Hook Return**: `<HookName>Return`

```typescript
export interface UseGridMissionEditorParams {
  mode?: 'create' | 'edit';
}

export interface UseGridMissionEditorReturn {
  gridMissionPlanner: IGridMissionPlanner | null;
  isLoading: boolean;
  error: Error | null;
  cancelMission: () => void;
}

export const useGridMissionEditor = (
  params?: UseGridMissionEditorParams
): UseGridMissionEditorReturn => {
  // ...
};
```

---

## 4. Dependency Arrays Best Practices

### 4.1 The Golden Rules

1. **Include ALL values used in the effect**
2. **Stabilize functions with useCallback**
3. **Stabilize objects with useMemo**
4. **Use ESLint rules to catch missing deps**

### 4.2 Common Mistakes

**Missing Dependencies:**
```typescript
// ❌ WRONG: Missing `calculateMetrics`
useEffect(() => {
  planner.onEvent('UPDATE', calculateMetrics);
  return () => planner.offEvent(...);
}, [planner]); // Missing calculateMetrics!

// ✅ CORRECT: Include all dependencies
useEffect(() => {
  planner.onEvent('UPDATE', calculateMetrics);
  return () => planner.offEvent(...);
}, [planner, calculateMetrics]);
```

**Unstable Dependencies:**
```typescript
// ❌ WRONG: Function recreated on every render
useEffect(() => {
  const handler = (data) => console.log(data);
  planner.onEvent('UPDATE', handler);
}, [planner]);

// ✅ CORRECT: Stable callback
const handler = useCallback((data) => console.log(data), []);
useEffect(() => {
  planner.onEvent('UPDATE', handler);
}, [planner, handler]);
```

### 4.3 Advanced Patterns

**Reading Fresh State:**
```typescript
// Read state inside callback instead of as dependency
const createNewMissionPlanner = useCallback(() => {
  const currentState = useMissionStore.getState();
  const currentRouteAltitudeSettings = selectRouteAltitudeSettings(currentState);
  return missionPlannerManager.createNewLinearMission({
    routeAltitudeSettings: currentRouteAltitudeSettings,
  });
}, [mapInstance, isMapReady]);
```

**Event Listener Pattern:**
```typescript
const handleUpdate = useCallback(() => calculateMetrics(), [calculateMetrics]);
useEffect(() => {
  planner.onEvent('UPDATE', handleUpdate);
  return () => planner.offEvent('UPDATE', handleUpdate);
}, [planner, handleUpdate]);
```

---

## 5. Performance Patterns

### 5.1 Memoization

**Use useMemo for expensive computations**

```typescript
// Flatten server data
const assets = useMemo(() => serverData?.pages.flatMap((page) => page.assets) ?? [], [serverData]);

// Apply filters
const filteredAssets = useMemo(() => applyClientFilters(assets), [assets, applyClientFilters]);

// Aggregations
const aggregations = useMemo(() => ({
  categoryBreakdown: serverData?.pages[0]?.aggregations.categoryBreakdown ?? {},
}), [serverData]);
```

**Use useCallback for stable function references**

```typescript
const removeWaypoint = useCallback(async (index: number) => {
  if (!missionPlanner) return false;
  try {
    removeFromStore(index);
    return missionPlanner.removeWaypoint(index);
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}, [missionPlanner, removeFromStore]);
```

### 5.2 Selective Subscriptions (Zustand)

**Prevent unnecessary re-renders with selectors**

```typescript
// ✅ OPTIMIZED: Individual primitive selectors
const selectedAssetIds = useSelectedAssetIds();
const viewMode = useViewMode();
const sortBy = useSortBy();

// ❌ AVOID: Subscribing to entire store slice
const uiState = useAssetListUIStore(); // Re-renders on ANY change
```

### 5.3 Performance Patterns

**Infinite Scroll:**
```typescript
// Auto-fetch with error checking
useEffect(() => {
  if (infiniteQuery.hasNextPage && !infiniteQuery.isFetching && !infiniteQuery.isError) {
    void infiniteQuery.fetchNextPage();
  }
}, [infiniteQuery]);
```

**Resize Handling with RAF:**
```typescript
useEffect(() => {
  if (!element) return;

  let rafId: number | null = null;
  const handleResize = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(calculateLayout);
  };

  const obs = new ResizeObserver(handleResize);
  obs.observe(element);

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    obs.disconnect();
  };
}, [calculateLayout, element]);
```

**Real-Time Updates:**
```typescript
// Throttle high-frequency updates
useSystemStateSubscription(bindingId, { throttle: 500 });
```

---

## 6. Hook Composition Patterns

### 6. Hook Composition Patterns

**Layer 1: Basic hooks**
```typescript
const { selectedIds, toggle } = useSelection();
const { filters, setFilter } = useFilters();
```

**Layer 2: Composed hook**
```typescript
const useAssetList = () => {
  const selection = useSelection();
  const { data, isLoading } = useAssetData();

  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  return {
    ...selection,
    data: filteredData,
    isLoading,
  };
};
```

**Layer 3: Component usage**
```typescript
function AssetList() {
  const { selectedIds, toggle, data, isLoading, setFilter } = useAssetList();
}
```

**Higher-Order Hook:**
```typescript
// Add error boundary to any hook
function useWithErrorBoundary<T>(hook: () => T, fallback: T) {
  const [state, setState] = useState<T>(fallback);

  useEffect(() => {
    try {
      setState(hook());
    } catch (error) {
      setState(fallback);
    }
  }, [hook]);

  return state;
}
```

---

## 7. Testing Hooks

### 7. Testing Hooks

**Basic Testing Setup**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useAssetList', () => {
  beforeEach(() => vi.clearAllMocks());
});
```

**Test Initialization**
```typescript
it('should initialize with default state', () => {
  const { result } = renderHook(() => useAssetList());
  expect(result.current.assets).toEqual([]);
  expect(result.current.isLoading).toBe(true);
});
```

**Test State Updates**
```typescript
it('should toggle asset selection', async () => {
  const { result } = renderHook(() => useAssetList());

  await act(async () => {
    result.current.toggleAssetSelection('asset-1');
  });

  expect(result.current.selectedAssetIds.has('asset-1')).toBe(true);
});
```

**Test Async Operations**
```typescript
it('should fetch assets on mount', async () => {
  const { result } = renderHook(() => useAssetList());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.assets.length).toBeGreaterThan(0);
});
```

**Mocking Dependencies**
```typescript
// Mock API
vi.mock('../api/asset-list-api', () => ({
  useAssetListApiService: () => ({
    getAssetList: vi.fn().mockResolvedValue(mockAssets),
  }),
}));

// Mock Store
vi.mock('../stores/asset-list-ui.store', () => ({
  useAssetListUIStore: () => ({
    selectedAssetIds: new Set(['asset-1']),
  }),
}));
```

---

## 8. Anti-Patterns to Avoid

### 8.1 Conditional Hook Calls

**❌ WRONG: Hooks inside conditions**

```typescript
if (isLoading) {
  useData(); // VIOLATES RULES OF HOOKS!
}
```

**✅ CORRECT: Always call hooks**

```typescript
const { data } = useData({ enabled: isLoading });
```

### 8.2 Hooks in Loops

**❌ WRONG: Hooks in loops**

```typescript
items.map((item) => {
  const [value, setValue] = useState(item.value); // VIOLATES RULES OF HOOKS!
  return <div key={item.id}>{value}</div>;
});
```

**✅ CORRECT: Extract to component**

```typescript
function Item({ value }) {
  const [state, setState] = useState(value);
  return <div>{state}</div>;
}

items.map((item) => <Item key={item.id} value={item.value} />);
```

### 8.3 Mutable Reference Traps

**❌ WRONG: Mutable state in closures**

```typescript
const fetchData = async () => {
  const response = await fetch(url);
  setData(response.data); // Stale closure if url changed!
};

useEffect(() => {
  fetchData();
}, []); // Missing url dependency
```

**✅ CORRECT: Include dependencies**

```typescript
const fetchData = async () => {
  const response = await fetch(url);
  setData(response.data);
};

useEffect(() => {
  fetchData();
}, [url]); // Include url
```

### 8.4 Infinite Loop Traps

**❌ WRONG: Updating state that's in dependencies**

```typescript
useEffect(() => {
  setFilteredAssets(assets.filter(a => a.active));
}, [filteredAssets, assets]); // filteredAssets causes infinite loop!
```

**✅ CORRECT: Only external dependencies**

```typescript
useEffect(() => {
  setFilteredAssets(assets.filter(a => a.active));
}, [assets]); // Only assets is external
```

### 8.5 Prop Drilling in Hooks

**❌ WRONG: Hooks that expect many props**

```typescript
const useAssetList = (
  assets,
  filters,
  selection,
  viewMode,
  sortBy,
  pagination,
  onError,
  onSuccess
) => {
  // Too many params!
};
```

**✅ CORRECT: Hook manages its own state**

```typescript
const useAssetList = (baseQuery?: Partial<AssetQuery>) => {
  const filters = useFilters();
  const selection = useSelection();
  const { data } = useAssetData(baseQuery);

  return {
    ...filters,
    ...selection,
    data,
  };
};
```

### 8.6 Over-Abstracting

**❌ WRONG: Hook for simple logic**

```typescript
const useSum = (a: number, b: number) => {
  return useMemo(() => a + b, [a, b]);
};
// Just use: a + b
```

**✅ CORRECT: Hook for complex logic**

```typescript
const useGridMetrics = () => {
  const [metrics, setMetrics] = useState({ area: 0, flightTime: 0, images: 0 });

  const calculate = useCallback(() => {
    // 100+ lines of complex calculations
    // Event listeners
    // State updates
  }, [/* dependencies */]);

  useEffect(() => {
    // Setup event listeners
    return () => cleanup();
  }, [calculate]);

  return metrics;
};
```

---

## 9. Real-World Examples from Codebase

### 9. Real-World Examples from Codebase

**Complex State Management: useMissionEditor**
```typescript
export const useMissionEditor = ({ mode, missionId }) => {
  const missionPlannerRef = useRef(null);
  const [isLoading, setError, isDirty] = useState(false);

  const { data: existingMission } = useMission(
    mode === 'edit' && missionId ? missionId : '',
    { enabled: mode === 'edit' && !!missionId }
  );

  const createNewMissionPlanner = useCallback(() => {
    if (!mapInstance || !isMapReady) return null;

    const currentState = useMissionStore.getState();
    return missionPlannerManager.createNewLinearMission({
      routeAltitudeSettings: selectRouteAltitudeSettings(currentState),
    });
  }, [mapInstance, isMapReady]);

  useEffect(() => {
    if (mode === 'create') initializeMissionPlanner();
    else if (mode === 'edit' && existingMission) initializeMissionPlanner();
  }, [mapInstance, mode, existingMission, initializeMissionPlanner]);

  useEffect(() => {
    return () => cancelMission();
  }, [cancelMission]);

  return {
    missionPlanner: missionPlannerRef.current,
    isLoading: isLoading || (mode === 'edit' && isMissionLoading),
    error: error || missionError,
    cancelMission,
    isDirty,
  };
};
```

**Event-Driven Updates: useGridMetricsCalculation**
```typescript
export const useGridMetricsCalculation = () => {
  const updateGridMetrics = useMissionStore((state) => state.updateGridMetrics);

  const calculateMetrics = useCallback(() => {
    if (!planner || !routeSettings) {
      updateGridMetrics({ grid_area: 0, flight_time: 0, estimated_images: 0 });
      return;
    }

    // Complex calculations...
    const area = calculatePolygonArea(polygonVertices);
    const flightTime = speed > 0 ? flightLength / speed : 0;
    updateGridMetrics({ grid_area: area, flight_time: flightTime, estimated_images: estimatedImages });
  }, [planner, routeSettings, speed]);

  // Event-driven updates
  useEffect(() => {
    const handleUpdate = (eventData) => calculateMetrics();
    planner.onEvent('GRID_WAYPOINTS_UPDATED', handleUpdate);
    return () => planner.offEvent('GRID_WAYPOINTS_UPDATED', handleUpdate);
  }, [planner, calculateMetrics]);

  // Settings changes
  useEffect(() => {
    calculateMetrics();
  }, [gsd, frontOverlap, speed, calculateMetrics]);
};
```

**Optimistic Updates: useBulkOperations**
```typescript
export function useBulkOperations() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request) => missionService.bulkOperation(request),

    // Optimistic update
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey: MISSION_KEYS.lists() });
      const previousMissions = queryClient.getQueryData(MISSION_KEYS.lists());

      if (request.action === 'delete' && previousMissions) {
        queryClient.setQueryData(
          MISSION_KEYS.lists(),
          previousMissions.filter(m => !request.missionIds.includes(m.id))
        );
      }

      return { previousMissions };
    },

    // Rollback on error
    onError: (_error, _request, context) => {
      if (context?.previousMissions) {
        queryClient.setQueryData(MISSION_KEYS.lists(), context.previousMissions);
      }
    },

    // Invalidate on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.lists() });
    },
  });

  return {
    ...mutation,
    bulkDelete: { ...mutation, mutate: (ids) => mutation.mutate({ action: 'delete', missionIds: ids }) },
  };
}
```

**Layout Calculations: useGridLayout**
```typescript
export function useGridLayout(count) {
  const [element, setElement] = useState(null);
  const [layout, setLayout] = useState({ columns: 1, videoWidth: MIN_VIDEO_WIDTH });
  const prevLayoutRef = useRef(null);

  const calculateLayout = useCallback(() => {
    if (!element) return;

    // Brute-force search for best column configuration
    let best = { s: 0, cols: 1 };
    for (let c = 1; c <= maxColsToTest; c++) {
      const s = Math.min(s1, s2);
      if (s > best.s) best = { s, cols: c };
    }

    // Only update if changed
    const prev = prevLayoutRef.current;
    if (prev && prev.columns === newColumns) return;

    setLayout(newLayout);
  }, [count, element]);

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      rafId = requestAnimationFrame(calculateLayout);
    });
    obs.observe(element);
    return () => obs.disconnect();
  }, [calculateLayout, element]);

  return [setElement, layout];
}
```

---

## 10. Quick Reference Checklist

### ✅ Hook Design Checklist

**When creating a hook, ask:**

- [ ] Clear, single responsibility?
- [ ] Descriptive name starting with `use`?
- [ ] Optional parameters with sensible defaults?
- [ ] Well-defined return type?
- [ ] Loading and error states handled?
- [ ] All dependencies properly specified?
- [ ] Performant (memoization, selective subscriptions)?
- [ ] Testable?
- [ ] Documented?

### ✅ Performance Checklist

**For optimal performance:**

- [ ] `useCallback` for functions passed to children/effects
- [ ] `useMemo` for expensive calculations
- [ ] Selective Zustand subscriptions
- [ ] Proper cleanup in `useEffect`
- [ ] Debounce/throttle high-frequency updates
- [ ] Refs for non-reacting values
- [ ] Virtual scrolling for large lists
- [ ] Cache expensive computations

### ✅ Dependency Array Checklist

**For correct dependency arrays:**

- [ ] Include all values used in the effect
- [ ] Stabilize functions with `useCallback`
- [ ] Stabilize objects with `useMemo`
- [ ] Don't include state set in the effect
- [ ] Use ESLint to catch missing dependencies
- [ ] Run `exhaustive-deps` rule

### ✅ Testing Checklist

**For comprehensive testing:**

- [ ] Initial state
- [ ] State updates
- [ ] Async operations
- [ ] Error handling
- [ ] Edge cases (null, undefined, empty)
- [ ] Mock external dependencies
- [ ] Cleanup functions
- [ ] Realistic data

### ✅ Documentation Checklist

**For well-documented hooks:**

- [ ] JSDoc comment describing purpose
- [ ] `@param` tags for all parameters
- [ ] `@returns` tag for return value
- [ ] TypeScript types for all inputs/outputs

---

## Appendix: Codebase Statistics

### Mission Planner App (40+ hooks)
- **Mission operations**: `use-mission-editor`, `use-waypoint-operations`, `use-bulk-operations`
- **Grid missions**: `use-grid-mission-editor`, `use-grid-metrics-calculation`
- **Map integration**: `use-mission-map-display`, `use-store-to-map-sync`
- **Data fetching**: `use-mission-list`, `use-mission`, `use-filtered-missions`
- **Utilities**: `use-cached-image`, `use-agl-calculation`, `use-check-name`

### Asset Management App (30+ hooks)
- **Client hooks**: `use-asset-list-ui`, `use-media-grouping`, `use-selected-media-from-store`
- **Server hooks**: `use-asset-data`, `use-asset-detail`, `use-filtered-media`, `use-media-data`
- **Composed hooks**: `use-asset-list`, `use-media-gallery`
- **Shared hooks**: `useAutoScroll`, `useIntersectionObserver`

### Fleet View App (25+ hooks)
- **Drone management**: `useDroneIntegratedData`, `useDroneFlightState`, `useAllDronesIntegratedData`
- **Map integration**: `useFleetMapManager`, `useGoToMapIntegration`, `useSensorMapIntegration`
- **Video streaming**: `useVideoStream`, `useVideoWallDrones`, `useGridLayout`
- **Telemetry**: `useAltitudeCalculation`, `useFeatureFlags`, `useNotificationSubscription`

---

## Related Documentation

- [Zustand State Management](/docs/002-applications/asset-management/architecture/zustand-state-management.md)
- [Testing Best Practices](/docs/001-common/testing-standards/)
- [TanStack Query Patterns](/docs/001-common/development-standards/)
- [Performance Optimization Guide](/docs/001-common/development-standards/)
