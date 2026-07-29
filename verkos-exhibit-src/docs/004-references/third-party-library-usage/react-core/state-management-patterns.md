# State Management - Patterns & Best Practices

## Introduction

This guide provides comprehensive patterns and strategies for managing state in React applications within the drone operations platform. It covers the full spectrum of state management needs, from local component state to complex synchronization patterns between stores, maps, and servers.

## Table of Contents

1. [State Types & Decision Tree](#1-state-types--decision-tree)
2. [Local State Patterns](#2-local-state-patterns)
3. [Global State with Zustand](#3-global-state-with-zustand)
4. [Server State with TanStack Query](#4-server-state-with-tanstack-query)
5. [Form State Management](#5-form-state-management)
6. [State Synchronization Patterns](#6-state-synchronization-patterns)
7. [Performance Optimization](#7-performance-optimization)
8. [Real-World Examples](#8-real-world-examples)
9. [Anti-Patterns to Avoid](#9-anti-patterns-to-avoid)
10. [State Architecture Checklist](#10-state-architecture-checklist)

---

## 1. State Types & Decision Tree

### Understanding State Categories

State in React applications falls into distinct categories, each requiring different management strategies:

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE TYPE DECISION TREE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Is this data from an API?                                    │
│     ├─ YES → Server State (TanStack Query)                       │
│     └─ NO → Continue to 2                                        │
│                                                                  │
│  2. Is this form data?                                           │
│     ├─ YES → Form State (React Hook Form)                        │
│     └─ NO → Continue to 3                                        │
│                                                                  │
│  3. Does this affect the URL?                                    │
│     ├─ YES → URL State (search params)                           │
│     └─ NO → Continue to 4                                        │
│                                                                  │
│  4. Is this shared across components?                            │
│     ├─ YES → Global Client State (Zustand)                       │
│     └─ NO → Local Component State (useState/useReducer)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### State Type Comparison Table

| State Type | Use Case | Tool | Persistence | Scope |
|-----------|----------|------|-------------|-------|
| **Local Component State** | UI-specific to single component | useState, useReducer | None (component lifetime) | Single component |
| **Cross-Component Local** | Shared by closely related components | useContext | None (component tree) | Component subtree |
| **Global Client State** | App-wide UI state, selections, preferences | Zustand | Optional (localStorage) | Entire app |
| **Server State** | Data from APIs, databases | TanStack Query | Configurable (cache) | Entire app |
| **URL State** | Shareable, bookmarkable state | TanStack Router search params | URL (user/browser) | Entire app |
| **Form State** | User input, validation | React Hook Form | Optional | Form scope |

### Decision Criteria

**Use Local State (useState/useReducer) when:**
- State is only used by one component
- State is simple (primitive values or small objects)
- State doesn't need to persist across routes
- State is derived from props

**Use Global State (Zustand) when:**
- Multiple unrelated components need the same state
- State needs to persist across route changes
- State requires complex update logic
- State needs to sync with external systems (map, WebSocket)

**Use Server State (TanStack Query) when:**
- Data comes from an API
- Data needs caching and revalidation
- Data is shared across the app
- You need loading/error states

**Use URL State when:**
- State should be shareable via URL
- State needs to work with browser back/forward
- State represents filtering, sorting, or pagination
- State should be bookmarkable

**Use Form State (React Hook Form) when:**
- Collecting user input
- Need validation
- Performance matters (many fields)
- Need to track touched/dirty fields

---

## 2. Local State Patterns

### useState for Simple State

Use `useState` for simple, independent state pieces:

```typescript
// Good: Simple boolean toggle
const [isOpen, setIsOpen] = useState(false);

// Good: Single value with clear update logic
const [selectedTab, setSelectedTab] = useState('overview');

// Good: Small related object (config-like)
const [settings, setSettings] = useState({
  theme: 'light',
  density: 'comfortable',
});
```

**When to avoid useState:**
- Complex state with multiple related values (use useReducer)
- State shared across components (use Zustand or useContext)
- Derived state (use useMemo)

### useReducer for Complex State

Use `useReducer` when state logic is complex:

```typescript
type ModalState =
  | { type: 'closed' }
  | { type: 'edit-asset'; assetId: string }
  | { type: 'delete-confirmation'; assetIds: string[] };

type ModalAction =
  | { type: 'OPEN_EDIT'; assetId: string }
  | { type: 'OPEN_DELETE'; assetIds: string[] }
  | { type: 'CLOSE' };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_EDIT':
      return { type: 'edit-asset', assetId: action.assetId };
    case 'OPEN_DELETE':
      return { type: 'delete-confirmation', assetIds: action.assetIds };
    case 'CLOSE':
      return { type: 'closed' };
    default:
      return state;
  }
}

function AssetList() {
  const [modalState, dispatch] = useReducer(modalReducer, { type: 'closed' });

  // Usage with clear intent
  const openEdit = (assetId: string) => dispatch({ type: 'OPEN_EDIT', assetId });
  const close = () => dispatch({ type: 'CLOSE' });
}
```

**Benefits of useReducer:**
- Centralizes state update logic
- Makes state transitions explicit
- Easier to test
- Better for complex state machines

### Derived State with useMemo

Never store derived state - compute it:

```typescript
// ❌ BAD: Storing derived state
const [filteredAssets, setFilteredAssets] = useState(assets);
useEffect(() => {
  setFilteredAssets(assets.filter(a => a.status === 'active'));
}, [assets]);

// ✅ GOOD: Computing derived state
const filteredAssets = useMemo(
  () => assets.filter(a => a.status === 'active'),
  [assets]
);
```

**Derived state patterns:**
```typescript
// Filtered lists
const visibleAssets = useMemo(
  () => assets.filter(asset => {
    if (filters.category && asset.category !== filters.category) return false;
    if (filters.search && !asset.name.includes(filters.search)) return false;
    return true;
  }),
  [assets, filters]
);

// Computed values
const summaryStats = useMemo(
  () => ({
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    issues: assets.filter(a => a.hasIssues).length,
  }),
  [assets]
);

// Sorted data
const sortedAssets = useMemo(
  () => [...assets].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return b.createdAt - a.createdAt;
    return 0;
  }),
  [assets, sortBy]
);
```

### useContext for Cross-Component State

Use `useContext` when state is shared by closely related components:

```typescript
// AssetTreeContext.tsx
interface AssetTreeContextValue {
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  selectFolder: (id: string | null) => void;
}

const AssetTreeContext = createContext<AssetTreeContextValue | null>(null);

export function AssetTreeProvider({ children }: { children: React.ReactNode }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedFolderId,
      expandedFolders,
      toggleFolder,
      selectFolder: setSelectedFolderId,
    }),
    [selectedFolderId, expandedFolders, toggleFolder]
  );

  return (
    <AssetTreeContext.Provider value={value}>
      {children}
    </AssetTreeContext.Provider>
  );
}

// Usage in child components
function FolderItem({ id, name }: { id: string; name: string }) {
  const { expandedFolders, toggleFolder, selectFolder } = useContext(AssetTreeContext)!;
  const isExpanded = expandedFolders.has(id);

  return (
    <div onClick={() => { toggleFolder(id); selectFolder(id); }}>
      {isExpanded ? '▼' : '▶'} {name}
    </div>
  );
}
```

**When to use useContext:**
- Component tree-specific state (theme, layout mode)
- Parent-child communication without prop drilling
- State that's only relevant to a specific component subtree

**When NOT to use useContext:**
- App-wide state (use Zustand instead)
- State needed by unrelated components
- Performance-critical updates (context updates all consumers)

---

## 3. Global State with Zustand

### Store Granularity

**Rule of thumb: One store per feature**

The codebase demonstrates excellent store organization:

```
Asset Management (9 stores):
├─ asset-list-ui.store.ts          # List page UI state
├─ asset-details-ui.store.ts       # Details page UI state
├─ media-gallery.store.ts          # Media gallery state
├─ inspection-logs-ui.store.ts     # Inspection logs UI
├─ kml-import.store.ts             # KML import workflow
└─ ...                             # Feature-specific stores

Mission Planner (7 slices in 1 store):
├─ ui-slice.ts                     # UI preferences
├─ missions-slice.ts               # Mission data
├─ filter-slice.ts                 # Filters
├─ selection-slice.ts              # Selection state
├─ editor-slice.ts                 # Editor state
├─ payload-slice.ts                # Payload state
└─ ...                             # Feature-specific slices

Shared Libraries (domain stores):
├─ drones.store.ts                 # Drone telemetry
├─ docking-stations.store.ts       # Docking station state
├─ sensors.store.ts                # Sensor data
└─ ...                             # Domain-specific stores
```

### Store vs Slice Architecture

**Multiple Stores (Asset Management approach):**
```typescript
// Each feature gets its own store
export const useAssetListUIStore = create<AssetListUIStore>()(
  persist(
    subscribeWithSelector(
      devtools(
        (...args) => ({
          ...createAssetListUISlice(...args),
        }),
        { name: 'asset-list-ui-store' }
      )
    ),
    {
      name: 'asset-list-ui-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        // Only persist preferences, not session state
      }),
    }
  )
);

export const useAssetDetailsUIStore = create<AssetDetailsUIStore>()(
  // Similar structure for details page
);
```

**Single Store with Slices (Mission Planner approach):**
```typescript
// Combine multiple slices into one store
export const useMissionStore = create<RootState>()(
  devtools(
    persist(
      (...args) => ({
        ...createUISlice(...args),
        ...createMissionSlice(...args),
        ...createFilterSlice(...args),
        ...createSelectionSlice(...args),
        ...createEditorSliceWithValidation(...args),
        ...createPayloadSlice(...args),
      }),
      {
        name: 'mission-planner-store',
        partialize: (state) => ({
          filters: state.filters,
          uiPreferences: state.uiPreferences,
        }),
      }
    ),
    { name: 'mission-planner' }
  )
);
```

**Choosing between stores and slices:**

| Factor | Multiple Stores | Single Store with Slices |
|--------|-----------------|-------------------------|
| Code splitting | Better (tree-shaking) | Harder |
| Feature independence | Better | More coupling |
| Type safety | Better per-feature | More complex types |
| DevTools | Multiple stores | Single organized store |
| Persistence | Easier per-feature | Requires partialize |
| **Use when:** | Features are independent | Features are tightly coupled |

### Slice Architecture Pattern

Follow the established slice pattern for consistency:

```typescript
// 1. Define state interface
export interface AssetListUISlice {
  unifiedSelection: UnifiedSelectionState;
  viewMode: 'list' | 'table' | 'grid' | 'map';
  sortBy: AssetSortBy;
  sortOrder: SortOrder;
}

// 2. Define actions interface
export interface AssetListUIActions {
  selectNode: (nodeId: string, nodeType: NodeType) => void;
  toggleNode: (nodeId: string, nodeType: NodeType) => void;
  clearSelection: () => void;
}

// 3. Define initial state
const initialAssetListUIState: AssetListUISlice = {
  unifiedSelection: {
    selectedNodes: new Set<string>(),
    nodeTypes: new Map<string, NodeType>(),
    selectionType: 'assets',
    selectionVersion: 0,
  },
  viewMode: 'list',
  sortBy: AssetSortBy.NAME,
  sortOrder: SortOrder.ASC,
};

// 4. Create slice
export const createAssetListUISlice: StateCreator<
  AssetListUISlice & AssetListUIActions,
  [['zustand/devtools', never], ['zustand/subscribeWithSelector', never]],
  [],
  AssetListUISlice & AssetListUIActions
> = (set, get) => ({
  ...initialAssetListUIState,

  selectNode: (nodeId, nodeType) =>
    set(
      produce((state) => {
        state.unifiedSelection.selectedNodes.add(nodeId);
        state.unifiedSelection.nodeTypes.set(nodeId, nodeType);
        state.unifiedSelection.selectionVersion++;
      }),
      false,
      'selectNode'
    ),

  toggleNode: (nodeId, nodeType) =>
    set(
      produce((state) => {
        const isSelected = state.unifiedSelection.selectedNodes.has(nodeId);
        if (isSelected) {
          state.unifiedSelection.selectedNodes.delete(nodeId);
          state.unifiedSelection.nodeTypes.delete(nodeId);
        } else {
          state.unifiedSelection.selectedNodes.add(nodeId);
          state.unifiedSelection.nodeTypes.set(nodeId, nodeType);
        }
        state.unifiedSelection.selectionVersion++;
      }),
      false,
      'toggleNode'
    ),
});
```

### Middleware Configuration

**Standard middleware stack:**

```typescript
// Recommended middleware order (outer to inner)
export const useMyStore = create<MyStore>()(
  persist(                    // 1. Outermost: Persist to localStorage
    subscribeWithSelector(    // 2. Subscribe to specific properties
      devtools(               // 3. DevTools integration
        immer(                // 4. Innermost: Immer for immutable updates
          (set, get) => ({
            // Store implementation
          })
        )
      ),
      { name: 'my-store' }
    ),
    {
      name: 'my-store',
      partialize: (state) => ({
        // Only persist specific properties
        preferences: state.preferences,
      }),
      version: 1,
    }
  )
);
```

**Middleware breakdown:**

1. **immer** - Mutable-style immutable updates
   ```typescript
   set(produce((state) => {
     state.unifiedSelection.selectedNodes.add(nodeId);  // Looks mutable
     // But actually creates immutable update under the hood
   }));
   ```

2. **devtools** - Time-travel debugging
   ```typescript
   devtools(
     (set, get) => ({ /* store */ }),
     { name: 'my-store', serialize: { map: true } }
   )
   ```

3. **subscribeWithSelector** - Subscribe to specific properties
   ```typescript
   // Only re-render when viewMode changes
   useAssetListUIStore(
     (state) => state.viewMode,
     (viewMode, prevViewMode) => {
       console.log('View mode changed:', prevViewMode, '→', viewMode);
     }
   );
   ```

4. **persist** - Save state to localStorage
   ```typescript
   persist(
     (set, get) => ({ /* store */ }),
     {
       name: 'my-store',
       partialize: (state) => ({
         // Only persist preferences, not session state
         viewMode: state.viewMode,
       }),
     }
   )
   ```

### Action Organization

**Best practices for actions:**

1. **Use descriptive action names** (include in DevTools)
   ```typescript
   // Good: Clear action name
   set({ selectedNodes: new Set() }, false, 'clearSelection');

   // Bad: Generic action name
   set({ selectedNodes: new Set() });
   ```

2. **Batch related updates**
   ```typescript
   // Good: Single action for related state
   selectNode: (nodeId, nodeType) =>
     set(
       produce((state) => {
         state.unifiedSelection.selectedNodes.add(nodeId);
         state.unifiedSelection.nodeTypes.set(nodeId, nodeType);
         state.unifiedSelection.selectionVersion++;
       }),
       false,
       'selectNode'
     );
   ```

3. **Use action creators for complex logic**
   ```typescript
   toggleNode: (nodeId, nodeType) => {
     const state = get();
     const isSelected = state.unifiedSelection.selectedNodes.has(nodeId);
     const multiSelectEnabled = state.featureFlags.enableMultiSelection;

     set(
       produce((draft) => {
         if (isSelected) {
           draft.unifiedSelection.selectedNodes.delete(nodeId);
           draft.unifiedSelection.nodeTypes.delete(nodeId);
         } else if (!multiSelectEnabled) {
           // Single select: clear existing first
           draft.unifiedSelection.selectedNodes.clear();
           draft.unifiedSelection.selectedTypes.clear();
           draft.unifiedSelection.selectedNodes.add(nodeId);
           draft.unifiedSelection.nodeTypes.set(nodeId, nodeType);
         } else {
           // Multi select: add to existing
           draft.unifiedSelection.selectedNodes.add(nodeId);
           draft.unifiedSelection.nodeTypes.set(nodeId, nodeType);
         }
         draft.unifiedSelection.selectionVersion++;
       }),
       false,
       'toggleNode'
     );
   }
   ```

### Selector Optimization

**Prevent unnecessary re-renders with selectors:**

```typescript
// ❌ BAD: Selects entire store (re-renders on any change)
const store = useAssetListUIStore();

// ✅ GOOD: Select only what's needed
const viewMode = useAssetListUIStore((state) => state.viewMode);

// ✅ BETTER: Use selector hooks for reusability
export const useViewMode = () =>
  useAssetListUIStore((state) => state.viewMode);

// ✅ BEST: Shallow comparison for objects
const preferences = useAssetListUIStore(
  (state) => state.preferences,
  shallow
);
```

**Selector patterns from the codebase:**

```typescript
// Primitive selectors (no object creation)
export const useViewMode = () =>
  useAssetListUIStore((state) => state.viewMode);

export const useSelectedAssetIds = () =>
  useAssetListUIStore((state) => state.getAssetSelection());

// Computed selectors
export const useHasActiveFilters = () =>
  useAssetListUIStore(
    (state) =>
      state.quickFilters.categories.length > 0 ||
      state.quickFilters.statuses.length > 0 ||
      state.searchText.length > 0
  );

// Action selectors (stable function references)
export const useSelectNode = () =>
  useAssetListUIStore((state) => state.selectNode);

export const useToggleNode = () =>
  useAssetListUIStore((state) => state.toggleNode);
```

**Performance optimization techniques:**

1. **Use Set/Map for O(1) lookups**
   ```typescript
   // Store
   unifiedSelection: {
     selectedNodes: new Set<string>(),        // O(1) has/add/delete
     nodeTypes: new Map<string, NodeType>(),  // O(1) get/set
   }

   // Selector
   const isSelected = useAssetListUIStore((state) =>
     state.unifiedSelection.selectedNodes.has(nodeId)
   );
   ```

2. **Version-based cache invalidation**
   ```typescript
   // Store increments version on changes
   state.unifiedSelection.selectionVersion++;

   // Component uses version for cache busting
   const selectionVersion = useSelectionVersion();
   const cachedData = useMemo(
     () => computeExpensiveOperation(selection),
     [selectionVersion]  // Only recompute when version changes
   );
   ```

3. **Stable references for callbacks**
   ```typescript
   // Returns stable function reference (doesn't change)
   const selectNode = useSelectNode();

   // Can be used in useEffect without dependency issues
   useEffect(() => {
     if (autoSelectAsset) {
       selectNode(autoSelectAsset, 'asset');
     }
   }, [autoSelectAsset, selectNode]);
   ```

### Naming Conventions

**Store files:**
```
[feature]-ui.store.ts          # UI state for a feature
[feature]-workflow.store.ts    # Multi-step workflow state
[domain].store.ts              # Domain-specific shared state
```

**Slice files:**
```
[feature]-ui.slice.ts          # UI state slice
[feature]-actions.slice.ts     # Actions slice
```

**Selector files:**
```
[feature]-ui.selectors.ts      # Selector hooks
```

**Action names:**
- Use verb+noun pattern: `selectNode`, `toggleNode`, `clearSelection`
- Be descriptive: `setViewMode` (not `view`), `toggleRightPanel` (not `panel`)
- Include intent: `selectFromMap` (not `select`)

---

## 4. Server State with TanStack Query

### Query Key Hierarchy

Organize query keys in a hierarchy for easy invalidation:

```typescript
// Query key factories
const ASSET_QUERY_KEYS = {
  all: ['assets'] as const,
  lists: () => [...ASSET_QUERY_KEYS.all, 'list'] as const,
  list: (filters: AssetListFilters) =>
    [...ASSET_QUERY_KEYS.lists(), filters] as const,
  details: () => [...ASSET_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) =>
    [...ASSET_QUERY_KEYS.details(), id] as const,
} as const;

const MEDIA_QUERY_KEYS = {
  all: ['media'] as const,
  filtered: (request: MediaListInternalRequest) =>
    ['media', 'filtered', request] as const,
} as const;
```

**Benefits of hierarchical keys:**
- Easy partial invalidation: `queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.lists() })`
- Type-safe key construction
- Clear cache organization in DevTools

### Stale Time and GC Time Strategy

**Current standard (5-min stale, 10-min GC):**

```typescript
export function useAssetDetail(assetId: string) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.detail(assetId),
    queryFn: async () => {
      const result = await assetApi.getAssetById(assetId);
      return result;
    },
    staleTime: 5 * 60 * 1000,    // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,      // 10 minutes - keep in cache for 10 min
  });
}
```

**Choosing appropriate times:**

| Data Type | staleTime | gcTime | Rationale |
|-----------|-----------|--------|-----------|
| User profile | 5 min | 15 min | Changes infrequently, reload not critical |
| Asset list | 2 min | 5 min | Can change from other users/devices |
| Asset detail | 5 min | 10 min | Individual asset changes less often |
| Media items | 5 min | 10 min | Media doesn't change often |
| Real-time telemetry | 0 | 1 min | Always fresh, cache briefly for navigation |
| Static data (enums, config) | Infinity | Infinity | Never changes |

### Cache Invalidation Patterns

**1. Automatic refetching on mutation:**

```typescript
const updateAsset = useMutation({
  mutationFn: async (data: UpdateAssetDTO) => {
    return assetApi.updateAsset(assetId, data);
  },
  onSuccess: () => {
    // Invalidate specific asset query
    queryClient.invalidateQueries({
      queryKey: ASSET_QUERY_KEYS.detail(assetId),
    });

    // Invalidate all asset lists
    queryClient.invalidateQueries({
      queryKey: ASSET_QUERY_KEYS.lists(),
    });
  },
});
```

**2. Optimistic updates:**

```typescript
const updateAssetStatus = useMutation({
  mutationFn: async ({ assetId, status }: { assetId: string; status: AssetStatus }) => {
    return assetApi.updateStatus(assetId, status);
  },

  onMutate: async ({ assetId, status }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ASSET_QUERY_KEYS.detail(assetId) });

    // Snapshot previous value
    const previousAsset = queryClient.getQueryData(
      ASSET_QUERY_KEYS.detail(assetId)
    );

    // Optimistically update cache
    queryClient.setQueryData(
      ASSET_QUERY_KEYS.detail(assetId),
      (old: AssetDetailResponseDTO) => ({
        ...old,
        asset: {
          ...old.asset,
          status,
        },
      })
    );

    // Return context with previous value
    return { previousAsset };
  },

  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousAsset) {
      queryClient.setQueryData(
        ASSET_QUERY_KEYS.detail(variables.assetId),
        context.previousAsset
      );
    }
  },

  onSettled: (data, error, variables) => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({
      queryKey: ASSET_QUERY_KEYS.detail(variables.assetId),
    });
  },
});
```

**3. Dependent queries:**

```typescript
// Only fetch media when asset is loaded
const { data: asset } = useAssetDetail(assetId);
const { data: media } = useFilteredMedia(
  assetId,
  filters,
  search,
  { enabled: !!asset }  // Only enable when asset exists
);
```

**4. Sequential queries:**

```typescript
// Load asset, then its mission history
const { data: asset } = useAssetDetail(assetId);
const { data: missionHistory } = useQuery({
  queryKey: ['assets', assetId, 'mission-history'],
  queryFn: () => assetApi.getMissionHistory(assetId),
  enabled: !!asset,  // Only run when asset is loaded
});
```

### Query Composition Patterns

**1. Parallel queries (independent data):**

```typescript
function AssetDetails({ assetId }: { assetId: string }) {
  // All queries run in parallel
  const { data: asset } = useAssetDetail(assetId);
  const { data: media } = useFilteredMedia(assetId, filters, search);
  const { data: logs } = useInspectionLogs(assetId);

  if (!asset || !media || !logs) return <Loading />;

  return <AssetDetailsView asset={asset} media={media} logs={logs} />;
}
```

**2. Dependent queries (sequential):**

```typescript
function AssetMissionHistory({ assetId }: { assetId: string }) {
  const { data: asset } = useAssetDetail(assetId);
  const { data: missions } = useQuery({
    queryKey: ['assets', assetId, 'missions'],
    queryFn: () => assetApi.getMissions(assetId),
    enabled: !!asset,  // Only runs when asset exists
  });

  if (!asset) return <LoadingAsset />;
  if (!missions) return <LoadingMissions />;

  return <MissionTimeline missions={missions} />;
}
```

**3. Paginated queries:**

```typescript
function MediaGallery({ assetId }: { assetId: string }) {
  const [filters, setFilters] = useState({ limit: 50, cursor: null });

  const { data, hasNextPage } = useFilteredMedia(
    assetId,
    filters,
    ''
  );

  const loadNextPage = () => {
    if (hasNextPage && data?.cursor) {
      setFilters(prev => ({ ...prev, cursor: data.cursor }));
    }
  };

  return (
    <InfiniteScroll loadMore={loadNextPage} hasMore={hasNextPage}>
      {data?.media.map(media => <MediaItem key={media.id} media={media} />)}
    </InfiniteScroll>
  );
}
```

### Infinite Queries Pattern

For cursor-based pagination:

```typescript
function useInfiniteMedia(assetId: string) {
  return useInfiniteQuery({
    queryKey: ['media', 'infinite', assetId],
    queryFn: async ({ pageParam }) => {
      return mediaApi.getMedia(assetId, {
        limit: 50,
        cursor: pageParam,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.cursor
        : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

// Usage
function MediaGallery({ assetId }: { assetId: string }) {
  const {
    data,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMedia(assetId);

  const allMedia = data?.pages.flatMap(page => page.media) ?? [];

  return (
    <div>
      {allMedia.map(media => <MediaCard key={media.id} media={media} />)}
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>Load More</Button>
      )}
    </div>
  );
}
```

### Mutation Patterns

**1. Simple mutation:**

```typescript
const deleteAsset = useMutation({
  mutationFn: async (assetId: string) => {
    return assetApi.deleteAsset(assetId);
  },
  onSuccess: (deletedId) => {
    toast.success(`Asset ${deletedId} deleted`);
    queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.lists() });
  },
});
```

**2. Mutation with callbacks:**

```typescript
const updateAsset = useMutation({
  mutationFn: async ({ assetId, data }: { assetId: string; data: UpdateAssetDTO }) => {
    return assetApi.updateAsset(assetId, data);
  },
  onMutate: ({ assetId, data }) => {
    toast.loading('Updating asset...', { id: 'update-asset' });
  },
  onSuccess: (result, { assetId }) => {
    toast.success('Asset updated', { id: 'update-asset' });
    queryClient.invalidateQueries({
      queryKey: ASSET_QUERY_KEYS.detail(assetId),
    });
  },
  onError: (error) => {
    toast.error(`Failed to update: ${error.message}`, { id: 'update-asset' });
  },
});
```

**3. Mutation with undo:**

```typescript
const bulkDeleteAssets = useMutation({
  mutationFn: async (assetIds: string[]) => {
    return assetApi.bulkDelete(assetIds);
  },

  onMutate: async (assetIds) => {
    await queryClient.cancelQueries({ queryKey: ASSET_QUERY_KEYS.lists() });

    const previousAssets = queryClient.getQueryData(
      ASSET_QUERY_KEYS.list(filters)
    );

    queryClient.setQueryData(
      ASSET_QUERY_KEYS.list(filters),
      (old: AssetListResponseDTO) => ({
        ...old,
        assets: old.assets.filter(a => !assetIds.includes(a.id)),
        totalCount: old.totalCount - assetIds.length,
      })
    );

    toast.success(
      `${assetIds.length} assets deleted`,
      {
        action: {
          label: 'Undo',
          onClick: () => {
            queryClient.setQueryData(
              ASSET_QUERY_KEYS.list(filters),
              previousAssets
            );
          },
        },
      }
    );

    return { previousAssets };
  },

  onError: (error, assetIds, context) => {
    if (context?.previousAssets) {
      queryClient.setQueryData(
        ASSET_QUERY_KEYS.list(filters),
        context.previousAssets
      );
    }
    toast.error('Failed to delete assets');
  },
});
```

---

## 5. Form State Management

### React Hook Form Integration

**Standard form setup:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema definition
const updateAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.nativeEnum(AssetCategory),
  status: z.nativeEnum(AssetStatus),
  inspectionInterval: z.number().min(1).max(365),
  notes: z.string().optional(),
});

type UpdateAssetFormData = z.infer<typeof updateAssetSchema>;

// Component
function UpdateAssetForm({ asset }: { asset: Asset }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateAssetFormData>({
    resolver: zodResolver(updateAssetSchema),
    defaultValues: {
      name: asset.name,
      category: asset.category,
      status: asset.status,
      inspectionInterval: asset.inspectionInterval,
      notes: asset.notes || '',
    },
  });

  const updateAsset = useMutation({
    mutationFn: (data: UpdateAssetFormData) => {
      return assetApi.updateAsset(asset.id, data);
    },
    onSuccess: () => {
      toast.success('Asset updated');
      reset();
    },
  });

  return (
    <form onSubmit={handleSubmit(data => updateAsset.mutate(data))}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <select {...register('category')}>
        {Object.values(AssetCategory).map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <button type="submit" disabled={!isDirty || updateAsset.isPending}>
        Update Asset
      </button>
    </form>
  );
}
```

### Form + Store Integration

**Combine form state with store for complex workflows:**

```typescript
function KMLImportWizard() {
  // Store for workflow state
  const { currentStage, setStage, processedEntities } = useKmlImportStore();

  // Form for each stage
  const methods = useForm<KMLFormData>({
    defaultValues: {
      importType: 'replace',
      targetFolder: null,
      createFolders: true,
      folderNaming: 'kml-filename',
    },
  });

  const onSubmit = (data: KMLFormData) => {
    switch (currentStage) {
      case ImportStage.CONFIGURATION:
        // Save form data to store
        setCreationContext({
          sessionId: generateSessionId(),
          options: data,
        });
        setStage(ImportStage.PREVIEW);
        break;

      case ImportStage.PREVIEW:
        // Execute import
        startProcessing();
        break;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {currentStage === ImportStage.CONFIGURATION && (
          <ConfigurationStep />
        )}

        {currentStage === ImportStage.PREVIEW && (
          <PreviewStep entities={processedEntities} />
        )}

        <WizardNavigation />
      </form>
    </FormProvider>
  );
}
```

### Dynamic Forms

**Handling dynamic field arrays:**

```typescript
import { useFieldArray } from 'react-hook-form';

function WaypointActionsForm() {
  const { control, register } = useForm<{
    actions: Array<{ type: string; value: number }>;
  }>({
    defaultValues: {
      actions: [{ type: 'hover', value: 5 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'actions',
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <select {...register(`actions.${index}.type`)}>
            <option value="hover">Hover</option>
            <option value="drone-yaw">Drone Yaw</option>
          </select>

          <input
            type="number"
            {...register(`actions.${index}.value`, { valueAsNumber: true })}
          />

          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ type: 'hover', value: 5 })}
      >
        Add Action
      </button>
    </div>
  );
}
```

### Form Validation Patterns

**Cross-field validation:**

```typescript
const missionFormSchema = z.object({
  takeoffAltitude: z.number(),
  landingAltitude: z.number(),
}).refine(
  (data) => data.takeoffAltitude > data.landingAltitude,
  {
    message: 'Takeoff altitude must be greater than landing altitude',
    path: ['takeoffAltitude'],
  }
);

// Async validation
const assetNameSchema = z.string()
  .min(1, 'Name is required')
  .refine(
    async (name) => {
      // Check if name is unique
      const exists = await assetApi.checkNameExists(name);
      return !exists;
    },
    {
      message: 'Asset name already exists',
    }
  );
```

---

## 6. State Synchronization Patterns

### Store ↔ Map Bidirectional Sync

**Challenge:** Keeping Zustand store and map library state in sync without infinite loops.

**Solution from Mission Planner:**

```typescript
// 1. Store state is the source of truth
const takeoffSettings = useMissionStore(
  (state) => state.missionFormState.missionBeingEdited?.mission_meta?.take_off_settings
);

// 2. Watch for changes and sync to map
export const useStoreToMapSync = ({ missionPlanner, enableSync }) => {
  // Track previous values to detect actual changes
  const previousValues = useRef({});

  // Debounce to prevent rapid-fire updates
  const debouncedUpdateTakeoffSettings = useMemo(
    () => debounce(
      (settings) => {
        missionPlanner?.setTakeoffAltitude(settings.altitude);
      },
      300
    ),
    [missionPlanner]
  );

  // Detect changes
  useEffect(() => {
    if (!takeoffSettings || !enableSync) return;

    const prev = previousValues.current.takeoffSettings;
    const hasChanged = !prev || prev.altitude !== takeoffSettings.altitude;

    if (hasChanged) {
      debouncedUpdateTakeoffSettings(takeoffSettings);
      previousValues.current.takeoffSettings = takeoffSettings;
    }
  }, [takeoffSettings, enableSync, debouncedUpdateTakeoffSettings]);
};

// 3. Map events update store
useMissionPlannerEvents({
  missionPlanner,
  onTakeoffAltitudeChange: (altitude) => {
    // Store → Map sync is disabled during map → Store update
    setSyncEnabled(false);
    useMissionStore.getState().updateTakeoffSettings({ altitude);
    setTimeout(() => setSyncEnabled(true), 100);
  },
});
```

**Key patterns for bidirectional sync:**

1. **Direction tracking:** Know which direction is syncing
   ```typescript
   const [syncDirection, setSyncDirection] = useState<'store-to-map' | 'map-to-store' | null>(null);
   ```

2. **Change detection:** Detect actual changes, not just updates
   ```typescript
   const hasChanged = !prev || prev.altitude !== takeoffSettings.altitude;
   ```

3. **Debouncing:** Prevent excessive updates
   ```typescript
   const debouncedUpdate = useMemo(
     () => debounce(updateFn, 300),
     [updateFn]
   );
   ```

4. **Sync inhibition:** Prevent sync during opposing updates
   ```typescript
   setSyncEnabled(false);  // Disable store→map
   // Perform map→store update
   setTimeout(() => setSyncEnabled(true), 100);
   ```

### Store ↔ URL Sync

**Sync store state with URL search params:**

```typescript
function useURLSync<T extends Record<string, any>>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => Record<string, any>,
  encode: (value: any) => string = String,
  decode: (value: string) => any = (v) => v
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL → Store (initial load)
  useEffect(() => {
    const state = store.getState();
    const urlState = selector(state);

    const updates: Partial<T> = {};
    for (const [key, value] of Object.entries(urlState)) {
      const urlValue = searchParams.get(key);
      if (urlValue !== null) {
        updates[key as keyof T] = decode(urlValue);
      }
    }

    if (Object.keys(updates).length > 0) {
      store.setState(updates);
    }
  }, []);

  // Store → URL (on change)
  useEffect(() => {
    const state = store.getState();
    const urlState = selector(state);

    const newParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(urlState)) {
      newParams.set(key, encode(value));
    }

    setSearchParams(newParams, { replace: true });
  }, [store, selector, setSearchParams]);
}

// Usage
useURLSync(
  useAssetListUIStore,
  (state) => ({
    view: state.viewMode,
    sort: state.sortBy,
    order: state.sortOrder,
  })
);
```

### Server State ↔ Client State Sync

**Pattern: Server state is source of truth, client state for optimistic updates:**

```typescript
function useAssetWithOptimisticUpdates(assetId: string) {
  // Server state (from API)
  const { data: serverAsset, isLoading } = useAssetDetail(assetId);

  // Client state (optimistic updates)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Partial<Asset>>({});

  // Merge server and client state
  const asset = useMemo(
    () => serverAsset ? { ...serverAsset.asset, ...optimisticUpdates } : null,
    [serverAsset, optimisticUpdates]
  );

  const updateAsset = useMutation({
    mutationFn: (updates: Partial<Asset>) => {
      // Optimistic update
      setOptimisticUpdates(prev => ({ ...prev, ...updates }));

      return assetApi.updateAsset(assetId, updates);
    },

    onSuccess: (updatedAsset) => {
      // Clear optimistic updates on success
      setOptimisticUpdates({});

      // Update server cache
      queryClient.setQueryData(
        ASSET_QUERY_KEYS.detail(assetId),
        updatedAsset
      );
    },

    onError: (error, updates) => {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const rolledBack = { ...prev };
        for (const key in updates) {
          delete rolledBack[key as keyof Asset];
        }
        return rolledBack;
      });

      toast.error('Failed to update asset');
    },
  });

  return { asset, isLoading, updateAsset };
}
```

### Avoiding Sync Loops

**Common causes of infinite sync loops:**

1. **Circular dependencies in useEffect**
   ```typescript
   // ❌ BAD: Infinite loop
   useEffect(() => {
     setSyncEnabled(false);
     updateStoreFromMap();
     setSyncEnabled(true);  // Triggers again
   }, [syncEnabled, updateStoreFromMap]);

   // ✅ GOOD: Separate concerns
   useEffect(() => {
     if (!syncEnabled) return;
     updateStoreFromMap();
   }, [mapData]);  // Only depends on map data

   useEffect(() => {
     if (!syncEnabled) return;
     updateMapFromStore();
   }, [storeData]);  // Only depends on store data
   ```

2. **Object reference changes**
   ```typescript
   // ❌ BAD: New object on every render
   useEffect(() => {
     setStore({ value: map.value });  // New object every time
   }, [map]);

   // ✅ GOOD: Stable references or specific values
   useEffect(() => {
     if (map.value !== prevValue) {
       setStoreValue(map.value);
     }
   }, [map.value]);
   ```

3. **Missing dependency arrays**
   ```typescript
   // ❌ BAD: Missing deps causes stale closures
   useEffect(() => {
     updateMap(store.value);  // Always uses initial store.value
   }, []);  // Missing store dependency

   // ✅ GOOD: All dependencies listed
   useEffect(() => {
     updateMap(store.value);
   }, [store.value]);
   ```

---

## 7. Performance Optimization

### Progressive Loading

**Load data progressively for faster initial render:**

```typescript
function AssetListPage() {
  // Stage 1: Critical data (immediate)
  const { data: assets, isLoading: assetsLoading } = useAssetList();

  // Stage 2: Important data (after critical)
  const { data: folders } = useFolders({
    enabled: !assetsLoading,  // Only start after assets loaded
  });

  // Stage 3: Nice-to-have data (deferred)
  const { data: statistics } = useAssetStatistics({
    enabled: !!folders,
  });

  // Stage 4: Background data (lowest priority)
  const { data: recommendations } = useRecommendations({
    enabled: !!statistics,
    staleTime: 30 * 60 * 1000,  // Don't refresh often
  });

  return (
    <>
      <AssetList assets={assets} loading={assetsLoading} />
      {folders && <FolderTree folders={folders} />}
      {statistics && <StatisticsCard stats={statistics} />}
      {recommendations && <RecommendationsPanel data={recommendations} />}
    </>
  );
}
```

### Selector Performance

**Optimize selectors to prevent re-renders:**

```typescript
// ❌ BAD: Creates new object every time
export const useFilters = () => {
  const filters = useAssetListUIStore((state) => state.quickFilters);
  const search = useAssetListUIStore((state) => state.searchText);
  return { filters, search };  // New object reference every time
};

// ✅ GOOD: Returns stable references
export const useFilters = () => useAssetListUIStore((state) => ({
  filters: state.quickFilters,  // Same object reference
  search: state.searchText,     // Same primitive
}));

// ✅ BETTER: Use shallow comparison for objects
export const useFilters = () => useAssetListUIStore(
  (state) => ({
    filters: state.quickFilters,
    search: state.searchText,
  }),
  shallow  // Only re-render if values change (not reference)
);

// ✅ BEST: Separate selectors for each value
export const useQuickFilters = () =>
  useAssetListUIStore((state) => state.quickFilters);

export const useSearchText = () =>
  useAssetListUIStore((state) => state.searchText);
```

### Memoization Strategies

**1. useMemo for expensive computations:**

```typescript
const sortedAndFilteredAssets = useMemo(
  () => {
    let result = [...assets];

    // Filter (O(n))
    if (filters.category) {
      result = result.filter(a => a.category === filters.category);
    }

    // Sort (O(n log n))
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return b.createdAt - a.createdAt;
      return 0;
    });

    return result;
  },
  [assets, filters, sortBy]  // Only recompute when deps change
);
```

**2. useCallback for stable function references:**

```typescript
const handleSelectAsset = useCallback((assetId: string) => {
  selectNode(assetId, 'asset', 'main');
}, [selectNode]);  // Stable function

const handleBulkDelete = useCallback((assetIds: string[]) => {
  bulkDeleteAssets.mutate(assetIds);
}, [bulkDeleteAssets]);
```

**3. Component memoization:**

```typescript
// Memoize individual list items
const AssetListItem = memo(({ asset, isSelected, onSelect }) => (
  <div className={isSelected ? 'selected' : ''} onClick={() => onSelect(asset.id)}>
    {asset.name}
  </div>
));

// Usage in list
{assets.map(asset => (
  <AssetListItem
    key={asset.id}
    asset={asset}
    isSelected={selectedIds.has(asset.id)}
    onSelect={handleSelect}
  />
))}
```

### Virtual Scrolling

**Use virtual scrolling for large lists:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualAssetList({ assets }: { assets: Asset[] }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,  // Estimated row height
    overscan: 5,  // Render 5 extra rows above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const asset = assets[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <AssetListItem asset={asset} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Real-time Update Optimization

**Optimize high-frequency updates (telemetry, position):**

```typescript
// 1. Batch rapid updates
function useDronePosition(droneId: string) {
  const [position, setPosition] = useState(null);
  const pendingUpdates = useRef([]);

  useEffect(() => {
    const subscription = droneStream.subscribe(droneId, (newPosition) => {
      pendingUpdates.current.push(newPosition);
    });

    // Flush pending updates every 100ms
    const interval = setInterval(() => {
      if (pendingUpdates.current.length > 0) {
        const latest = pendingUpdates.current[pendingUpdates.current.length - 1];
        setPosition(latest);
        pendingUpdates.current = [];
      }
    }, 100);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [droneId]);

  return position;
}

// 2. Use requestAnimationFrame for visual updates
function useAnimatedValue(target: number) {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let frameId: number;
    let prev = Date.now();
    let value = current;

    const animate = () => {
      const now = Date.now();
      const delta = (now - prev) / 1000;

      // Smooth interpolation
      value = value + (target - value) * 0.1;
      setCurrent(value);

      prev = now;
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return current;
}

// 3. Update store with immutable checks
updateDroneProperty: (droneId, property, value) => {
  const current = get().drones[droneId];
  const currentValue = getValueAtPath(current, property);

  // Only update if value actually changed
  if (!isEqual(currentValue, value)) {
    set((state) => {
      state.drones[droneId] = {
        ...current,
        [property]: value,
      };
    });
  }
}
```

---

## 8. Real-World Examples

### Example 1: Unified Selection System (Asset Management)

**Challenge:** Single selection state across main list, tree view, and map.

**Solution:**

```typescript
// Store: Single source of truth for all selections
interface UnifiedSelectionState {
  selectedNodes: Set<string>;              // All selected IDs (assets + folders)
  nodeTypes: Map<string, NodeType>;        // ID → type mapping
  selectionType: 'assets' | 'folders' | 'mixed';
  selectionVersion: number;                // For cache invalidation
  scrollToAssetId: string | null;          // For tree scroll coordination
  lastSelectionSource: 'map' | 'tree' | 'main' | null;
}

// Selector: Get all selected asset IDs
export const useSelectedAssetIds = () => {
  const getAssetSelection = useAssetListUIStore(state => state.getAssetSelection);
  return getAssetSelection();  // Returns Set<string>
};

// Selector: Check if specific node is selected
export const useIsNodeSelected = () =>
  useAssetListUIStore((state) => state.isNodeSelected);

// Action: Select from map (triggers tree scroll)
selectFromMap: (assetId: string) =>
  set(
    produce((state) => {
      state.unifiedSelection.selectedNodes.clear();
      state.unifiedSelection.selectedNodes.add(assetId);
      state.unifiedSelection.nodeTypes.set(assetId, 'asset');
      state.unifiedSelection.scrollToAssetId = assetId;
      state.unifiedSelection.lastSelectionSource = 'map';
      state.unifiedSelection.selectionVersion++;
    }),
    false,
    'selectFromMap'
  ),

// Component: Tree observes scroll request
function AssetTree() {
  const scrollToAssetId = useScrollToAssetId();
  const clearScrollRequest = useClearScrollRequest();

  useEffect(() => {
    if (scrollToAssetId) {
      scrollToItem(scrollToAssetId);
      clearScrollRequest();
    }
  }, [scrollToAssetId, scrollToItem, clearScrollRequest]);

  // ... tree rendering
}

// Component: Map selects asset
function AssetMap() {
  const selectFromMap = useSelectFromMap();

  const handleMarkerClick = (assetId: string) => {
    selectFromMap(assetId);  // Updates store + triggers tree scroll
  };

  return <Map onMarkerClick={handleMarkerClick} />;
}
```

### Example 2: Mission Editing with Map Sync (Mission Planner)

**Challenge:** Real-time synchronization between editor form and 2D map.

**Solution:**

```typescript
// 1. Store holds mission data
interface MissionState {
  missionFormState: {
    missionBeingEdited: {
      mission_meta: {
        take_off_settings: {
          altitude: number;
          reference_take_off_point: { lat: number; lng: number; alt: number };
        };
        mission_sequence: IMissionSequenceItem[];
      };
    };
  };
}

// 2. Sync hook watches store and updates map
export const useStoreToMapSync = ({ missionPlanner, enableSync }) => {
  const takeoffSettings = useMissionStore(
    (state) => state.missionFormState.missionBeingEdited?.mission_meta?.take_off_settings
  );

  const debouncedUpdateTakeoff = useMemo(
    () => debounce(
      (settings) => {
        missionPlanner?.setTakeoffAltitude(settings.altitude);
      },
      300
    ),
    [missionPlanner]
  );

  useEffect(() => {
    if (!takeoffSettings || !enableSync) return;
    debouncedUpdateTakeoff(takeoffSettings);
  }, [takeoffSettings, enableSync, debouncedUpdateTakeoff]);
};

// 3. Map events update store
useMissionPlannerEvents({
  missionPlanner,
  onTakeoffAltitudeChange: (altitude) => {
    setSyncEnabled(false);  // Disable store→map sync
    updateTakeoffAltitude(altitude);
    setTimeout(() => setSyncEnabled(true), 100);  // Re-enable
  },
});
```

### Example 3: KML Import Workflow (Asset Management)

**Challenge:** Multi-step wizard with state persistence and error handling.

**Solution:**

```typescript
// Store: Workflow state
interface KmlImportState {
  currentStage: ImportStage;
  selectedFile: File | null;
  processingOptions: ProcessingOptions;
  isProcessing: boolean;
  processedEntities: ProcessedEntities | null;
  error: ProcessingError | null;
}

// Wizard component
function KMLImportWizard() {
  const {
    currentStage,
    selectedFile,
    isProcessing,
    setStage,
    setFile,
    startProcessing,
    clearError,
  } = useKmlImportStore();

  const handleFileSelect = (file) => {
    setFile(file);
    clearError();
    setStage(ImportStage.CONFIGURATION);
  };

  const handleConfigure = (options) => {
    setProcessingOptions(options);
    setStage(ImportStage.PREVIEW);
  };

  const handleImport = async () => {
    await startProcessing();
    if (processedEntities) {
      setStage(ImportStage.COMPLETED);
    }
  };

  return (
    <Wizard currentStage={currentStage}>
      <WizardStage stage={ImportStage.FILE_SELECTION}>
        <FileSelectionStage onSelect={handleFileSelect} />
      </WizardStage>

      <WizardStage stage={ImportStage.CONFIGURATION}>
        <ConfigurationStage onNext={handleConfigure} />
      </WizardStage>

      <WizardStage stage={ImportStage.PREVIEW}>
        <PreviewStage
          entities={processedEntities}
          onImport={handleImport}
          isProcessing={isProcessing}
        />
      </WizardStage>

      <WizardStage stage={ImportStage.COMPLETED}>
        <CompletedStage entities={processedEntities} />
      </WizardStage>
    </Wizard>
  );
}
```

### Example 4: Media Gallery with Infinite Scroll

**Challenge:** Large media collections with efficient loading and filtering.

**Solution:**

```typescript
// Query with cursor-based pagination
export function useFilteredMedia(
  assetId: string,
  filters: MediaFilterState,
  search: string
) {
  const apiRequest = useMemo(
    () => buildMediaListRequest(assetId, filters, search),
    [assetId, filters, search]
  );

  return useQuery({
    queryKey: FILTERED_MEDIA_KEYS.filtered(apiRequest),
    queryFn: () => mediaApi.getFilteredMedia(apiRequest),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Gallery component with infinite scroll
function MediaGallery({ assetId }: { assetId: string }) {
  const [filters, setFilters] = useState({ limit: 50, cursor: null });

  const { data, isLoading, hasNextPage } = useFilteredMedia(
    assetId,
    filters,
    ''
  );

  const loadMore = () => {
    if (hasNextPage && data?.cursor) {
      setFilters(prev => ({ ...prev, cursor: data.cursor }));
    }
  };

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={hasNextPage}
      isLoading={isLoading}
    >
      <VirtualGrid
        items={data?.media ?? []}
        renderItem={(media) => <MediaCard key={media.id} media={media} />}
      />
    </InfiniteScroll>
  );
}
```

---

## 9. Anti-Patterns to Avoid

### 1. Storing Derived State

```typescript
// ❌ BAD: Storing filtered list
const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
useEffect(() => {
  setFilteredAssets(assets.filter(a => a.status === 'active'));
}, [assets]);

// ✅ GOOD: Computing derived value
const filteredAssets = useMemo(
  () => assets.filter(a => a.status === 'active'),
  [assets]
);
```

### 2. Prop Drilling

```typescript
// ❌ BAD: Prop drilling through multiple layers
function App() {
  const [theme, setTheme] = useState('light');
  return <Page theme={theme} setTheme={setTheme} />;
}
function Page({ theme, setTheme }) {
  return <Layout theme={theme} setTheme={setTheme} />;
}
function Layout({ theme, setTheme }) {
  return <Toolbar theme={theme} setTheme={setTheme} />;
}

// ✅ GOOD: Using store or context
function App() {
  return <Page />;
}
function Toolbar() {
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);
  return <button onClick={() => setTheme('dark')}>{theme}</button>;
}
```

### 3. Giant Store

```typescript
// ❌ BAD: Everything in one store
interface RootState {
  // 50+ properties for unrelated features
  assets: Asset[];
  missions: Mission[];
  users: User[];
  settings: Settings;
  modals: ModalState;
  // ... many more
}

// ✅ GOOD: Feature-based stores
useAssetListUIStore;    // Asset list UI
useAssetDetailsUIStore; // Asset details UI
useMissionStore;        // Mission planner
useUserPreferencesStore; // User settings
```

### 4. Unnecessary Re-renders

```typescript
// ❌ BAD: Selecting entire store
function AssetList() {
  const store = useAssetListUIStore();  // Re-renders on ANY change

  return <div>{store.viewMode}</div>;
}

// ✅ GOOD: Selecting only needed state
function AssetList() {
  const viewMode = useAssetListUIStore(state => state.viewMode);

  return <div>{viewMode}</div>;
}
```

### 5. Sync Loops

```typescript
// ❌ BAD: Circular updates
useEffect(() => {
  updateMap(store.value);
}, [store.value]);

useEffect(() => {
  setStore(map.value);
}, [map.value]);

// ✅ GOOD: Direction-specific updates with change detection
useEffect(() => {
  if (store.value !== prevValue && syncDirection !== 'map-to-store') {
    setSyncDirection('store-to-map');
    updateMap(store.value);
  }
}, [store.value, prevValue]);
```

### 6. Mixing Client and Server State

```typescript
// ❌ BAD: Duplicating server data in store
const [assets, setAssets] = useState<Asset[]>([]);  // Client copy
useEffect(() => {
  fetchAssets().then(data => setAssets(data));  // Duplicates data
}, []);

// ✅ GOOD: Using TanStack Query for server state
const { data: assets } = useAssets();  // Single source of truth
```

### 7. Missing Error Boundaries

```typescript
// ❌ BAD: No error handling
function AssetDetails({ assetId }: { assetId: string }) {
  const { data: asset } = useAssetDetail(assetId);

  return <div>{asset.name}</div>;  // Crashes if asset is null
}

// ✅ GOOD: Proper error handling
function AssetDetails({ assetId }: { assetId: string }) {
  const { data: asset, isLoading, error } = useAssetDetail(assetId);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!asset) return <NotFound />;

  return <div>{asset.name}</div>;
}
```

### 8. Ignoring Loading States

```typescript
// ❌ BAD: Assuming data exists
const { data: asset } = useAssetDetail(assetId);
return <AssetForm asset={asset} />;  // Crash on first render

// ✅ GOOD: Handle loading state
const { data: asset, isLoading } = useAssetDetail(assetId);
if (isLoading) return <Skeleton />;
return <AssetForm asset={asset} />;
```

---

## 10. State Architecture Checklist

Use this checklist when designing state architecture for new features:

### Initial Planning

- [ ] **Identify all state types** needed for the feature
  - [ ] Local component state (UI-specific)
  - [ ] Global client state (cross-component)
  - [ ] Server state (API data)
  - [ ] URL state (shareable filters)
  - [ ] Form state (user input)

- [ ] **Determine state ownership**
  - [ ] Which components need which state?
  - [ ] Is state shared across unrelated components?
  - [ ] Does state need to persist across routes?

- [ ] **Plan store/slice structure**
  - [ ] One store per feature, or multiple stores?
  - [ ] Will this be shared across apps?
  - [ ] What needs persistence?

### Implementation

- [ ] **Set up TanStack Query for server state**
  - [ ] Define query key hierarchy
  - [ ] Configure staleTime/gcTime
  - [ ] Set up error handling
  - [ ] Add loading states

- [ ] **Create Zustand stores for client state**
  - [ ] Use slice pattern for organization
  - [ ] Add middleware (immer, devtools, persist)
  - [ ] Configure selective persistence
  - [ ] Add versioning and migrations

- [ ] **Implement selectors**
  - [ ] Create granular selectors (no object creation)
  - [ ] Add computed selectors for derived state
  - [ ] Export action selectors
  - [ ] Test selector performance

- [ ] **Set up state synchronization**
  - [ ] Define data flow direction
  - [ ] Implement change detection
  - [ ] Add debouncing where needed
  - [ ] Prevent sync loops

### Testing

- [ ] **Test state updates**
  - [ ] Actions update state correctly
  - [ ] Selectors return expected values
  - [ ] Persistence works

- [ ] **Test state synchronization**
  - [ ] Bidirectional sync works
  - [ ] No infinite loops
  - [ ] Error recovery works

- [ ] **Test edge cases**
  - [ ] Empty states
  - [ ] Error states
  - [ ] Rapid updates
  - [ ] Concurrent mutations

### Performance

- [ ] **Optimize re-renders**
  - [ ] Use granular selectors
  - [ ] Memoize expensive computations
  - [ ] Implement virtual scrolling for large lists
  - [ ] Batch rapid updates

- [ ] **Optimize network requests**
  - [ ] Configure appropriate cache times
  - [ ] Implement optimistic updates
  - [ ] Deduplicate requests
  - [ ] Use request cancellation

### Documentation

- [ ] **Document state architecture**
  - [ ] Explain state type decisions
  - [ ] Document store/slice structure
  - [ ] Add JSDoc to complex actions
  - [ ] Create usage examples

---

## Conclusion

Effective state management in React applications requires understanding the strengths of different tools and using them appropriately:

- **Local state** for component-specific UI
- **Zustand** for global client state with complex synchronization needs
- **TanStack Query** for server state with caching and invalidation
- **React Hook Form** for form validation and user input
- **URL params** for shareable, bookmarkable state

The patterns and examples in this guide are drawn from real implementations in the drone operations platform. Follow these established patterns for consistency, performance, and maintainability.

### Key Takeaways

1. **Separate concerns:** Client state vs server state vs derived state
2. **Choose the right tool:** Each state management solution has its place
3. **Optimize selectors:** Prevent unnecessary re-renders with granular selectors
4. **Sync carefully:** Use change detection, debouncing, and direction tracking
5. **Test thoroughly:** State bugs are often subtle and hard to catch
6. **Document decisions:** Future you (and your team) will thank you

### Further Reading

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Dan Abramov's "Making Sense of React Hooks"](https://overreacted.io/a-complete-guide-to-useeffect/)
- [Kent C. Dodds' "How to Use React Context Effectively"](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
