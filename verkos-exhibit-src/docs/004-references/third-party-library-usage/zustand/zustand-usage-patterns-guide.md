# Zustand Usage Patterns Guide

**Version:** 2.0 (Revised)
**Last Updated:** 2026-01-27
**Target Audience:** Mixed team (Junior to Senior React developers)
**Zustand Version:** v5.0.x

---

## 🚀 Quick Start (5 Minutes)

**Need to create a store right now?** Copy one of these templates:

### Template 1: Simple Store (Most Common)

```typescript
// stores/ui-store.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

// Usage in component:
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
const toggleSidebar = useUIStore((state) => state.toggleSidebar)
```

### Template 2: Store with Persistence

```typescript
// stores/preferences.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface PreferencesState {
  theme: 'light' | 'dark'
  language: string
  setTheme: (theme: 'light' | 'dark') => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'user-preferences',
    }
  )
)
```

**Still not sure which to use?** → [Go to Decision Trees](#quick-start-decision-trees)
**Need something more complex?** → [Browse Pattern Catalog](#pattern-catalog)

---

## Prerequisites

This guide assumes familiarity with:

- ✅ React hooks (useState, useEffect, useMemo)
- ✅ TypeScript basics (interfaces, generics)
- ✅ localStorage API basics

**New to these concepts?**
- [React Docs: Hooks](https://react.dev/learn#using-hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

**Quick Glossary:**
- **Middleware** - Functions that wrap your store to add capabilities (persistence, debugging)
- **Selector** - A function that extracts specific data from the store
- **Hydration** - Loading persisted state when the app starts
- **Partialize** - Selecting which parts of state to persist
- **Immer** - Library enabling "mutable" syntax that produces immutable updates

---

## Quick Reference

| I need to... | Go to |
|--------------|-------|
| Create my first store | [Quick Start](#quick-start-5-minutes) |
| Decide which pattern to use | [Decision Trees](#quick-start-decision-trees) |
| Persist user preferences | [Pattern 3: Domain Store](#pattern-3-domain-state-store-with-persistence-medium-high) |
| Debug state changes | [DevTools Middleware](#devtools-middleware) |
| Handle large collections (1000+ items) | [Pattern 5: Unified Selection](#pattern-5-unified-selection-store-advanced) |
| Split a large store | [Pattern 4: Multi-Slice](#pattern-4-multi-slice-store-advanced) |
| Fix "state not updating" | [Troubleshooting](#troubleshooting-store-not-updating) |
| Test my stores | [Testing](#testing-zustand-stores) |
| Optimize performance | [Selector Patterns](#selector-patterns--performance) |

---

## Table of Contents

1. [Quick Start Decision Trees](#quick-start-decision-trees)
2. [Pattern Catalog](#pattern-catalog)
   - Basic Patterns (1-3)
   - Advanced Patterns (4-6)
3. [Deep Dive: Store Structure](#deep-dive-store-structure)
4. [Deep Dive: Middleware Composition](#deep-dive-middleware-composition)
5. [Deep Dive: Persistence Strategies](#deep-dive-persistence-strategies)
6. [Selector Patterns & Performance](#selector-patterns--performance)
7. [Testing Zustand Stores](#testing-zustand-stores)
8. [Anti-Patterns & Troubleshooting](#anti-patterns--troubleshooting)
9. [Real-World Examples from Codebase](#real-world-examples-from-codebase)

---

## Quick Start Decision Trees

### Decision Tree 1: Do I Need Zustand?

```
START: Need to manage state
├─ Is this server data (API responses)?
│  └─ YES → Use TanStack Query, NOT Zustand
│
├─ Is this just local component state (< 3 related values)?
│  └─ YES → Use useState/useReducer, NOT Zustand
│
├─ Shared across components but simple?
│  ├─ Only 2-3 components in same subtree?
│  │  └─ Use React Context (example: theme provider)
│  │
│  └─ 4+ components OR spread across app?
│     └─ YES → Use Zustand ✅
│     └─ Example: Shopping cart in header, checkout, product page
│
├─ Complex state logic?
│  ├─ 5+ related state values with dependencies?
│  │  └─ YES → Use Zustand ✅
│  │
│  └─ State updates depend on previous state?
│     └─ YES → Use Zustand ✅
│
└─ Need persistence (localStorage)?
   └─ YES → Use Zustand with persist middleware ✅
```

**Golden Rule:** Zustand is for **UI state** shared across multiple components. Server state belongs in TanStack Query.

---

### Decision Tree 2: Which Store Pattern?

```
START: Creating a Zustand store
│
├─ Simple toggle or single value (< 50 lines)?
│  └─ YES → Pattern 1: Minimal Store
│     ├─ No middleware
│     └─ Example: camera-tracking.store.ts
│
├─ Managing multiple collections with lookups?
│  └─ YES → Pattern 2: Collections Store
│     ├─ Use Record<string, T> for O(1) lookups
│     ├─ Add devtools + immer middleware
│     └─ Example: map-entities.store.ts
│
├─ Business domain data that needs persistence?
│  └─ YES → Pattern 3: Domain Store
│     ├─ Use persist + devtools + immer
│     ├─ Implement validation + migration
│     └─ Example: application-context.store.ts
│
├─ Will it be > 500 lines or many concerns?
│  └─ YES → Pattern 4: Multi-Slice Store
│     ├─ Create separate slice files
│     ├─ Compose in main store
│     └─ Example: Mission Planner (7 slices)
│
├─ Complex selection (mixed entity types)?
│  └─ YES → Pattern 5: Unified Selection Store
│     ├─ Use Set + Map for performance
│     ├─ Version tracking for cache invalidation
│     └─ Example: asset-list-ui.store.ts
│
└─ Custom localStorage needs?
   └─ YES → Pattern 6: Custom Storage Utilities
      ├─ Manual storage helpers
      ├─ Fine-grained control
      └─ Example: Fleet View localStorage.ts
```

---

### Decision Tree 3: Which Middleware Do I Need?

⚠️ **IMPORTANT:** Start with NO middleware. Add only what you need.

```
START: Do I need middleware?
│
├─ Need to debug state changes?
│  └─ YES → Add devtools (development only)
│     └─ Stack: devtools(store)
│
├─ Have nested objects/arrays?
│  └─ YES → Add immer
│     └─ Stack: devtools(immer(store))
│
├─ Need to persist state across sessions?
│  └─ YES → Add persist
│     └─ Stack: persist(devtools(immer(store)))
│
└─ Default: No middleware for simple stores
```

**Middleware Stacks:**
- **Minimal:** No middleware
- **Development:** `devtools`
- **With Nesting:** `devtools → immer`
- **Production:** `persist → devtools → immer`

⚠️ **DO NOT use `subscribeWithSelector`** unless you have external (non-React) subscriptions like WebSocket sync. It's not needed for React components.

---

## Pattern Catalog

### Basic Patterns (Common Use Cases)

---

### Pattern 1: Minimal Store (Simple)

**Complexity:** 🟢 Beginner
**Lines of Code:** < 100
**Middleware:** None

**When to Use:**
- Single boolean or primitive value
- 1-3 simple actions
- No persistence needed
- No debugging complexity

**When NOT to Use:**
- Nested objects or arrays
- Need Redux DevTools
- Complex state logic

**Example:**
```typescript
// stores/camera-tracking.store.ts
import { create } from 'zustand'

interface CameraTrackingState {
  isTracking: boolean
  setTracking: (isTracking: boolean) => void
}

export const useCameraTrackingStore = create<CameraTrackingState>((set) => ({
  isTracking: false,
  setTracking: (isTracking) => set({ isTracking }),
}))
```

**Usage:**
```typescript
function CameraControls() {
  const isTracking = useCameraTrackingStore((state) => state.isTracking)
  const setTracking = useCameraTrackingStore((state) => state.setTracking)

  return (
    <button onClick={() => setTracking(!isTracking)}>
      {isTracking ? 'Stop Tracking' : 'Start Tracking'}
    </button>
  )
}
```

**Real Example:** `apps/fleet/src/app/shared/store/camera-tracking.store.ts` (Fleet View)

---

### Pattern 2: Collections Management Store (Medium)

**Complexity:** 🟡 Intermediate
**Lines of Code:** 200-500
**Middleware:** `devtools → immer`

**When to Use:**
- Managing 3+ collections (drones, docks, markers)
- Need O(1) lookups by ID
- Frequent add/remove operations
- Need debugging with DevTools

**When NOT to Use:**
- Simple list rendering
- Collections don't need fast lookups
- No complex mutations

**Example:**
```typescript
// stores/map-entities.store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface MapEntitiesState {
  droneMarkerCollection: Record<string, string>
  dockMarkerCollection: Record<string, string>
  nfzCollection: Record<string, string>
  lastRefreshTimestamp: number

  addMapEntity: <K extends keyof Omit<MapEntitiesState, 'addMapEntity' | 'removeEntity' | 'hasMapEntity' | 'clearCollection' | 'triggerMapRefresh'>>(
    collectionName: K,
    id: string,
    mapId: string
  ) => void
  removeEntity: <K extends keyof Omit<MapEntitiesState, 'addMapEntity' | 'removeEntity' | 'hasMapEntity' | 'clearCollection' | 'triggerMapRefresh'>>(
    collectionName: K,
    id: string
  ) => void
  hasMapEntity: <K extends keyof Omit<MapEntitiesState, 'addMapEntity' | 'removeEntity' | 'hasMapEntity' | 'clearCollection' | 'triggerMapRefresh'>>(
    collectionName: K,
    id: string
  ) => boolean
  clearCollection: <K extends keyof Omit<MapEntitiesState, 'addMapEntity' | 'removeEntity' | 'hasMapEntity' | 'clearCollection' | 'triggerMapRefresh'>>(
    collectionName: K
  ) => void
  triggerMapRefresh: () => void
}

export const useMapEntitiesStore = create<MapEntitiesState>()(
  devtools(
    immer((set, get) => ({
      droneMarkerCollection: {},
      dockMarkerCollection: {},
      nfzCollection: {},
      lastRefreshTimestamp: Date.now(),

      addMapEntity: (collectionName, id, mapId) =>
        set(
          (state) => {
            (state[collectionName] as Record<string, string>)[id] = mapId
          },
          false,
          `mapEntities/${String(collectionName)}/add/${id}`
        ),

      removeEntity: (collectionName, id) =>
        set(
          (state) => {
            delete (state[collectionName] as Record<string, string>)[id]
          },
          false,
          `mapEntities/${String(collectionName)}/remove/${id}`
        ),

      hasMapEntity: (collectionName, id) => {
        const collection = get()[collectionName] as Record<string, string>
        return id in collection
      },

      clearCollection: (collectionName) =>
        set(
          (state) => {
            state[collectionName] = {} as any
          },
          false,
          `mapEntities/${String(collectionName)}/clear`
        ),

      triggerMapRefresh: () =>
        set({ lastRefreshTimestamp: Date.now() }),
    })),
    { name: 'Map Entities Store' }
  )
)
```

**Key Techniques:**
- Generic methods with `keyof` for type safety
- DevTools action naming: `mapEntities/drones/add/drone-123`
- Timestamp-based refresh trigger for dependent components
- Immer allows direct mutations: `state.collection[id] = value`

**Real Example:** `apps/fleet/src/app/shared/store/map-entities.store.ts` (Fleet View)

---

### Pattern 3: Domain State Store with Persistence (Medium-High)

**Complexity:** 🟡 Intermediate-Advanced
**Lines of Code:** 300-800
**Middleware:** `persist → devtools → immer`

**When to Use:**
- Business domain data (users, sites, organizations)
- Need persistence across sessions
- Async operations (API calls)
- Schema evolution expected

**When NOT to Use:**
- Real-time streaming data
- Sensitive data (passwords, tokens)
- Temporary UI state

**Example:**
```typescript
// stores/application-context.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface ApplicationContextState {
  // Domain data
  activeSite: ISite | null
  activeOrganization: Organization | null

  // Collections
  recentSites: ISite[]
  availableSites: ISite[]

  // Metadata
  lastSiteAccess: Record<string, ISODateString>

  // Loading states
  isChangingSite: boolean
  error: string | null

  // Actions
  setActiveSite: (site: ISite) => Promise<void>
  updateRecentSites: (site: ISite) => void
  clearApplicationContext: () => void
}

const isValidPersistedState = (state: unknown): state is Partial<ApplicationContextState> => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false

  const s = state as any
  if (s.activeSite && (typeof s.activeSite !== 'object' || Array.isArray(s.activeSite))) return false
  if (s.recentSites && !Array.isArray(s.recentSites)) return false

  return true
}

export const useApplicationContextStore = create<ApplicationContextState>()(
  persist(
    devtools(
      immer((set, get) => ({
        // Initial state
        activeSite: null,
        activeOrganization: null,
        recentSites: [],
        availableSites: [],
        lastSiteAccess: {},
        isChangingSite: false,
        error: null,

        // Async action with proper error handling
        setActiveSite: async (site) => {
          set((state) => {
            state.isChangingSite = true
            state.error = null
          })

          try {
            // Validate site exists
            const exists = get().availableSites.some((s) => s._id === site._id)
            if (!exists) {
              throw new Error('Site not found in available sites')
            }

            set((state) => {
              state.activeSite = site
              state.lastSiteAccess[site._id] = new Date().toISOString()
              state.isChangingSite = false
              state.error = null
            })

            // Update recent sites
            get().updateRecentSites(site)
          } catch (error) {
            set((state) => {
              state.isChangingSite = false
              state.error = error instanceof Error ? error.message : 'Unknown error'
            })
            // Don't re-throw - let UI handle error from state
          }
        },

        updateRecentSites: (site) => {
          set((state) => {
            // Remove if exists
            state.recentSites = state.recentSites.filter((s) => s._id !== site._id)
            // Add to front
            state.recentSites.unshift(site)
            // Keep only last 5
            state.recentSites = state.recentSites.slice(0, 5)
          })
        },

        clearApplicationContext: () => {
          set({
            activeSite: null,
            activeOrganization: null,
            recentSites: [],
            lastSiteAccess: {},
          })
        },
      })),
      { name: 'application-context' }
    ),
    {
      name: 'application-context-store',
      storage: createJSONStorage(() => localStorage),

      // Only persist specific fields
      partialize: (state) => ({
        activeSite: state.activeSite,
        recentSites: state.recentSites,
        lastSiteAccess: state.lastSiteAccess,
        // DON'T persist: availableSites (fetched), loading states, errors
      }),

      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (!isValidPersistedState(persistedState)) {
          console.warn('Invalid persisted state, using defaults')
          return {} as ApplicationContextState
        }
        return persistedState as ApplicationContextState
      },
    }
  )
)

// Custom selector hooks
export const useActiveSite = () =>
  useApplicationContextStore((state) => state.activeSite)

export const useRecentSites = () =>
  useApplicationContextStore((state) => state.recentSites)

export const useHasActiveSite = () =>
  useApplicationContextStore((state) => !!state.activeSite)
```

**Key Techniques:**
- **Selective Persistence:** Only persist necessary data
- **Validation:** Check persisted state before hydration
- **Error State:** Store errors in state, don't throw
- **Custom Hooks:** Narrow selectors for performance
- **Schema Migration:** Version tracking for future changes

**Real Example:** `apps/asset-management/src/store/application-context.store.ts` (Asset Management)

---

### Advanced Patterns

---

### Pattern 4: Multi-Slice Store (Advanced)

**Complexity:** 🔴 Advanced
**Lines of Code:** 500-2000+ (total)
**Middleware:** `devtools → persist → slices`

**When to Use:**
- Store would exceed 500 lines
- Multiple distinct concerns in one domain
- Team working on different features
- Need modular, testable code

**When NOT to Use:**
- Store is < 500 lines
- Single cohesive concern
- Simple state structure

**Example:**
```typescript
// store/store.ts (Main store)
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createUISlice, UISlice } from './slices/ui-slice'
import { createMissionSlice, MissionSlice } from './slices/mission-slice'
import { createFilterSlice, FilterSlice } from './slices/filter-slice'
import { createSelectionSlice, SelectionSlice } from './slices/selection-slice'

type RootState = UISlice & MissionSlice & FilterSlice & SelectionSlice

export const useMissionStore = create<RootState>()(
  devtools(
    persist(
      (...args) => ({
        ...createUISlice(...args),
        ...createMissionSlice(...args),
        ...createFilterSlice(...args),
        ...createSelectionSlice(...args),
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
)

// store/slices/ui-slice.ts
import { StateCreator } from 'zustand'

export interface UISlice {
  uiPreferences: {
    currentView: 'list' | 'edit' | 'create'
    selectedSite: ISite | null
  }

  setCurrentView: (view: 'list' | 'edit' | 'create') => void
  setSelectedSite: (site: ISite | null) => void
}

export const createUISlice: StateCreator<
  UISlice, // This slice
  [],      // Middleware mutators
  [],      // Effects
  UISlice  // Return type
> = (set) => ({
  uiPreferences: {
    currentView: 'list',
    selectedSite: null,
  },

  setCurrentView: (view) =>
    set((state) => ({
      uiPreferences: { ...state.uiPreferences, currentView: view },
    })),

  setSelectedSite: (site) =>
    set((state) => ({
      uiPreferences: { ...state.uiPreferences, selectedSite: site },
    })),
})

// store/slices/mission-slice.ts
import { StateCreator } from 'zustand'
import { produce } from 'immer'

export interface MissionSlice {
  allMissions: IMission[]
  dirtyMissionIds: Record<string, boolean>

  setAllMissions: (missions: IMission[]) => void
  getMissionById: (id: string) => IMission | undefined
  markMissionAsDirty: (id: string) => void
}

export const createMissionSlice: StateCreator<
  MissionSlice,
  [],
  [],
  MissionSlice
> = (set, get) => ({
  allMissions: [],
  dirtyMissionIds: {},

  setAllMissions: (missions) =>
    set(produce((state: MissionSlice) => {
      state.allMissions = missions
    })),

  getMissionById: (id) => {
    return get().allMissions.find((m) => m.id === id)
  },

  markMissionAsDirty: (id) =>
    set(produce((state: MissionSlice) => {
      state.dirtyMissionIds[id] = true
    })),
})
```

**Key Techniques:**
- **Slice Composition:** Spread multiple slices into single store
- **Type Safety:** `StateCreator<SliceType>` for each slice
- **Modular Files:** Each concern in separate file
- **Selective Persistence:** Only persist filters + UI preferences
- **Cross-Slice Access:** Use `get()` to access other slices

**Cross-Slice Communication (Type-Safe):**
```typescript
// For slices that need to call other slice methods:
export interface ValidationSlice {
  errors: ValidationError[]
  validateMissions: () => void
}

export const createValidationSlice: StateCreator<
  ValidationSlice & MissionSlice, // Combined type for access
  [],
  [],
  ValidationSlice // This slice's contribution
> = (set, get) => ({
  errors: [],

  validateMissions: () => {
    const missions = get().allMissions // Type-safe access!
    const errors = validateMissionData(missions)
    set({ errors })
  },
})
```

**Real Example:** Mission Planner store with 7 slices

---

### Pattern 5: Unified Selection Store (Advanced)

**Complexity:** 🔴 Advanced
**Lines of Code:** 400-800
**Middleware:** `persist → devtools → immer`

**When to Use:**
- Multi-view selection (tree + grid + map)
- Mixed entity selection (assets + folders)
- Need O(1) lookups and type safety
- Selection state coordinated across views

**When NOT to Use:**
- Single-entity-type selection
- Simple checkbox lists
- No performance requirements

**Example:**
```typescript
// stores/asset-list-ui.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

type NodeType = 'asset' | 'folder'
type SelectionType = 'assets' | 'folders' | 'mixed'

interface UnifiedSelectionState {
  selectedNodes: Set<string>           // O(1) contains checks
  nodeTypes: Map<string, NodeType>     // Type-safe tracking
  selectionType: SelectionType         // Inferred selection type
  selectionVersion: number             // Cache invalidation
  multiSelectMode: boolean
}

interface AssetListUIState {
  unifiedSelection: UnifiedSelectionState

  // Actions
  selectNode: (nodeId: string, nodeType: NodeType) => void
  toggleNode: (nodeId: string, nodeType: NodeType) => void
  clearSelection: () => void

  // Getters
  getAssetSelection: () => Set<string>
  isSelected: (nodeId: string) => boolean
  getSelectionCount: () => number
}

export const useAssetListUIStore = create<AssetListUIState>()(
  persist(
    devtools(
      immer((set, get) => ({
        unifiedSelection: {
          selectedNodes: new Set<string>(),
          nodeTypes: new Map<string, NodeType>(),
          selectionType: 'assets',
          selectionVersion: 0,
          multiSelectMode: false,
        },

        selectNode: (nodeId, nodeType) =>
          set((state) => {
            if (!state.unifiedSelection.multiSelectMode) {
              // Single-select mode: clear existing selection
              state.unifiedSelection.selectedNodes.clear()
              state.unifiedSelection.nodeTypes.clear()
            }

            state.unifiedSelection.selectedNodes.add(nodeId)
            state.unifiedSelection.nodeTypes.set(nodeId, nodeType)
            state.unifiedSelection.selectionVersion++

            // Update selection type
            const types = new Set(state.unifiedSelection.nodeTypes.values())
            if (types.size === 2) {
              state.unifiedSelection.selectionType = 'mixed'
            } else {
              state.unifiedSelection.selectionType = types.has('asset') ? 'assets' : 'folders'
            }
          }),

        toggleNode: (nodeId, nodeType) =>
          set((state) => {
            if (state.unifiedSelection.selectedNodes.has(nodeId)) {
              // Deselect
              state.unifiedSelection.selectedNodes.delete(nodeId)
              state.unifiedSelection.nodeTypes.delete(nodeId)
            } else {
              // Select
              if (!state.unifiedSelection.multiSelectMode) {
                state.unifiedSelection.selectedNodes.clear()
                state.unifiedSelection.nodeTypes.clear()
              }
              state.unifiedSelection.selectedNodes.add(nodeId)
              state.unifiedSelection.nodeTypes.set(nodeId, nodeType)
            }

            state.unifiedSelection.selectionVersion++
          }),

        clearSelection: () =>
          set((state) => {
            state.unifiedSelection.selectedNodes.clear()
            state.unifiedSelection.nodeTypes.clear()
            state.unifiedSelection.selectionVersion++
          }),

        // Zero-copy getter - returns internal Set directly
        getAssetSelection: () => {
          const state = get()
          const assetSelection = new Set<string>()

          // Direct Set iteration (no array conversion)
          for (const nodeId of state.unifiedSelection.selectedNodes) {
            if (state.unifiedSelection.nodeTypes.get(nodeId) === 'asset') {
              assetSelection.add(nodeId)
            }
          }

          return assetSelection
        },

        isSelected: (nodeId) => {
          return get().unifiedSelection.selectedNodes.has(nodeId)
        },

        getSelectionCount: () => {
          return get().unifiedSelection.selectedNodes.size
        },
      })),
      {
        name: 'asset-list-ui-store',
        serialize: {
          options: {
            map: true, // Enable Set/Map serialization for DevTools
          },
        },
      }
    ),
    {
      name: 'asset-list-ui-storage',
      storage: createJSONStorage(() => localStorage),

      // DON'T persist selection state (session-only)
      partialize: (state) => ({}),

      version: 1,
    }
  )
)
```

**Key Techniques:**
- **Set for Performance:** O(1) contains checks vs O(n) for arrays
- **Map for Type Safety:** Track node type for each ID
- **Version Tracking:** Increment on every change for selector cache invalidation
- **Zero-Copy Getters:** Return internal Set directly (no array conversion)
- **Direct Iteration:** Loop Set without intermediate arrays

**Performance Benefits:**
```
Operation                    | Array (1000 items) | Set    | Speedup
-----------------------------|--------------------| -------|--------
Check if selected            | ~0.01ms (O(n))     | <0.001ms (O(1)) | 10-50x faster
Add to selection             | ~0.001ms           | <0.001ms | Similar
Remove from selection        | ~0.01ms (O(n))     | <0.001ms (O(1)) | 10-50x faster
```

**Real Example:** `apps/asset-management/src/features/asset-list/stores/asset-list-ui.store.ts` (Asset Management)

---

### Pattern 6: Custom Storage Utilities (Alternative)

**Complexity:** 🟡 Intermediate
**Lines of Code:** 100-300
**Middleware:** None (manual storage)

**When to Use:**
- Legacy codebase compatibility
- Need fine-grained control over storage timing
- Custom serialization requirements
- Performance optimization for specific fields

**When NOT to Use:**
- Starting fresh (use `persist` middleware instead)
- Standard persistence needs
- Want automatic hydration

**Example:**
```typescript
// utils/localStorage.ts
export const STORAGE_KEYS = {
  VIEWED_BINDINGS: 'fleetView.viewedBindingIds',
  SELECTED_FEED_TYPE: 'fleetView.selectedFeedType',
} as const

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : defaultValue
  } catch (error) {
    console.error(`Failed to read from localStorage: ${key}`, error)
    return defaultValue
  }
}

export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error)
    return false
  }
}

// stores/fleet-view.store.ts
import { create } from 'zustand'
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/localStorage'

interface FleetViewState {
  viewedBindingIds: string[]
  pinnedBindingId: string | null

  // Actions with manual persistence
  viewBinding: (id: string) => void
  hideBinding: (id: string) => void
  loadViewedBindingsFromStorage: () => void
}

export const useFleetViewStore = create<FleetViewState>((set, get) => ({
  viewedBindingIds: [],
  pinnedBindingId: null,

  viewBinding: (id) => {
    set((state) => {
      const newViewedBindings = [...state.viewedBindingIds, id]

      // Manual persistence in action
      saveToStorage(STORAGE_KEYS.VIEWED_BINDINGS, newViewedBindings)

      return { viewedBindingIds: newViewedBindings }
    })
  },

  hideBinding: (id) => {
    set((state) => {
      const newViewedBindings = state.viewedBindingIds.filter((bindingId) => bindingId !== id)

      // Manual persistence in action
      saveToStorage(STORAGE_KEYS.VIEWED_BINDINGS, newViewedBindings)

      return { viewedBindingIds: newViewedBindings }
    })
  },

  loadViewedBindingsFromStorage: () => {
    const savedBindingIds = getFromStorage<string[]>(
      STORAGE_KEYS.VIEWED_BINDINGS,
      []
    )
    set({ viewedBindingIds: savedBindingIds })
  },
}))

// Usage in component initialization:
useEffect(() => {
  useFleetViewStore.getState().loadViewedBindingsFromStorage()
}, [])
```

**Benefits:**
- Fine-grained control over when storage happens
- Custom error handling per key
- Easy to migrate existing localStorage code
- No middleware overhead

**Drawbacks:**
- Manual persistence calls in every action
- Easy to forget to persist
- No automatic hydration
- More boilerplate

**Real Example:** `apps/fleet/src/app/shared/store/fleetViewStore.ts` (Fleet View)

---

## Deep Dive: Store Structure

### When to Create Multiple Stores

**Rule of Thumb:** Create separate stores for **different concerns** that don't need atomic updates.

#### Separate Stores ✅

```typescript
// stores/ui-preferences.store.ts
// Concern: User interface settings
export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      density: 'comfortable',
      // Only UI-related state
    }),
    { name: 'ui-preferences' }
  )
)

// stores/aircraft-data.store.ts
// Concern: Business domain data
export const useAircraftDataStore = create<AircraftState>((set) => ({
  aircraft: [],
  telemetry: {},
  // Only business data
}))
```

**Why?** Different persistence needs, update frequencies, and concerns.

#### Combined Store (Slices) ✅

```typescript
// store/mission-store.ts
// All related to mission planning - needs coordination
export const useMissionStore = create<RootState>()(
  devtools(
    persist(
      (...args) => ({
        ...createWaypointSlice(...args),      // Waypoint editing
        ...createMissionMetadataSlice(...args), // Mission details
        ...createValidationSlice(...args),      // Validation state
      }),
      { name: 'mission-planner' }
    )
  )
)
```

**Why?** Mission metadata and waypoints need atomic updates.

---

### Domain vs UI State Separation

**Golden Rule:** Never mix business domain state with UI state in the same store.

#### ❌ BAD (Mixed Concerns)

```typescript
interface FleetState {
  // Domain data
  aircraft: Aircraft[]
  missions: Mission[]

  // UI state (WRONG!)
  selectedAircraftId: string | null
  isModalOpen: boolean
  filterText: string
}
```

**Problems:**
- Hard to persist correctly
- Validation logic mixed with UI logic
- Testing becomes complex

#### ✅ GOOD (Separated Concerns)

```typescript
// stores/fleet-data.store.ts (Domain)
interface FleetDataState {
  aircraft: Aircraft[]
  missions: Mission[]

  updateAircraft: (id: string, data: Partial<Aircraft>) => void
}

export const useFleetDataStore = create<FleetDataState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'fleet-data',
      partialize: (state) => ({
        aircraft: state.aircraft,
        missions: state.missions,
      }),
    }
  )
)

// stores/fleet-ui.store.ts (UI)
interface FleetUIState {
  selectedAircraftId: string | null
  isModalOpen: boolean
  filterText: string

  selectAircraft: (id: string | null) => void
  toggleModal: () => void
}

export const useFleetUIStore = create<FleetUIState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'fleet-ui',
      partialize: (state) => ({
        filterText: state.filterText, // Persist filter only
        // DON'T persist: selectedAircraftId, isModalOpen (session state)
      }),
    }
  )
)
```

**Benefits:**
- Clear separation of concerns
- Easy to test business logic
- UI state doesn't pollute domain data
- Different persistence strategies

---

## Deep Dive: Middleware Composition

### Standard Middleware Stack

**Correct Order (Outside → Inside):**
```
persist → devtools → immer → store
```

**Why This Order?**
1. **persist (outermost)** - Intercepts all state changes for storage
2. **devtools** - Debugging layer sees actual state changes
3. **immer (innermost)** - Closest to core logic, enables mutation syntax

**Examples:**

**Minimal (Development):**
```typescript
create()(devtools(stateCreator, { name: 'MyStore' }))
```

**Standard (With Nested State):**
```typescript
create()(devtools(immer(stateCreator), { name: 'MyStore' }))
```

**Production (With Persistence):**
```typescript
create()(
  persist(
    devtools(
      immer(stateCreator),
      { name: 'MyStore' }
    ),
    {
      name: 'my-store-storage',
      partialize: (state) => ({...}),
    }
  )
)
```

---

### DevTools Middleware

**Conditional DevTools (Production-Ready):**
```typescript
import { create, StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

const isDevelopment = process.env.NODE_ENV === 'development'

interface AppState {
  count: number
  increment: () => void
}

const stateCreator: StateCreator<AppState> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

export const useAppStore = create<AppState>()(
  isDevelopment
    ? devtools(stateCreator, { name: 'AppStore' })
    : stateCreator
)
```

**Action Naming:**
```typescript
export const useMapStore = create<MapState>()(
  devtools(
    immer((set) => ({
      markers: {},

      addMarker: (id, marker) =>
        set(
          (state) => {
            state.markers[id] = marker
          },
          false, // Don't replace state
          `map/markers/add/${id}` // Descriptive action name
        ),
    })),
    { name: 'MapStore' }
  )
)
```

---

### Immer Middleware

**When to Use Immer:**
- Deep nested objects (3+ levels)
- Frequent array mutations (push, splice, filter)
- Complex state updates across multiple properties

**When NOT to Use Immer:**
- Shallow state (1-2 levels)
- Simple primitives
- Performance-critical hot paths (immer adds ~2-10x overhead)

#### Without Immer (Verbose)

```typescript
updateMission: (missionId, waypointId, updates) =>
  set((state) => ({
    missions: state.missions.map((mission) =>
      mission.id === missionId
        ? {
            ...mission,
            waypoints: mission.waypoints.map((wp) =>
              wp.id === waypointId
                ? { ...wp, ...updates }
                : wp
            ),
          }
        : mission
    ),
  }))
```

#### With Immer (Clean)

```typescript
updateMission: (missionId, waypointId, updates) =>
  set((state) => {
    const mission = state.missions.find((m) => m.id === missionId)
    const waypoint = mission?.waypoints.find((w) => w.id === waypointId)
    if (waypoint) {
      Object.assign(waypoint, updates)
    }
  })
```

**Performance Note:** Immer adds ~2-10x overhead for simple updates. For deeply nested structures, the improved developer experience and reduced bugs often outweigh the performance cost. The automatic structural sharing can help prevent unnecessary React re-renders, making the overall app faster despite slower state updates.

---

## Deep Dive: Persistence Strategies

### What to Persist vs Not Persist

#### ✅ PERSIST

- User preferences (theme, language, layout)
- Recent items (searches, sites, files)
- Filter selections (categories, date ranges)
- UI state (collapsed panels, column widths)
- Draft data (unsaved forms)

#### ❌ DON'T PERSIST

- Loading states (`isLoading`, `isPending`)
- Error states (`error`, `validationErrors`)
- Sensitive data (passwords, tokens, API keys)
- Temporary UI (modal open/close, hover states)
- Real-time data (WebSocket connections, telemetry)
- Large datasets (> 5MB - use IndexedDB instead)

---

### Schema Versioning & Migration

**Problem:** State structure changes between releases. Old persisted data causes crashes.

**Solution:** Version tracking with migration functions.

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Version history
interface StateV1 {
  userName: string
}

interface StateV2 {
  user: {
    firstName: string
    lastName: string
  }
}

interface StateV3 {
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

type CurrentState = StateV3

export const useUserStore = create<CurrentState>()(
  persist(
    (set) => ({
      user: {
        firstName: '',
        lastName: '',
        email: '',
      },
    }),
    {
      name: 'user-storage',
      version: 3, // Current version

      migrate: (persistedState: any, version: number) => {
        // Migration from v1 → v2
        if (version === 1) {
          const v1State = persistedState as StateV1
          persistedState = {
            user: {
              firstName: v1State.userName.split(' ')[0] || '',
              lastName: v1State.userName.split(' ')[1] || '',
            },
          }
          version = 2
        }

        // Migration from v2 → v3
        if (version === 2) {
          const v2State = persistedState as StateV2
          persistedState = {
            user: {
              ...v2State.user,
              email: '', // Add default email
            },
          }
        }

        return persistedState as CurrentState
      },
    }
  )
)
```

---

## Selector Patterns & Performance

### Atomic Selectors (Default Pattern)

**Rule:** Always select single values, never create new objects in selectors.

#### ❌ BAD (Creates new object every render)

```typescript
const { users, loading } = useUserStore((state) => ({
  users: state.users,
  loading: state.loading,
}))
// New object reference every time → unnecessary re-renders
```

#### ✅ GOOD (Atomic selections)

```typescript
const users = useUserStore((state) => state.users)
const loading = useUserStore((state) => state.loading)
// Stable references → only re-renders when values change
```

---

### useShallow for Multiple Values

When you need multiple values from the store:

```typescript
import { useShallow } from 'zustand/react/shallow'

// WHY DOES THIS WORK?
//
// Without useShallow:
//   1. Selector returns NEW object { users, loading, error }
//   2. React sees different object reference → re-render
//   3. Happens even if users, loading, error are unchanged
//
// With useShallow:
//   1. Compares object CONTENTS (shallow equality)
//   2. Only re-renders if users, loading, OR error actually changed
//   3. Example: If only 'theme' changes elsewhere, this component doesn't re-render

const { users, loading, error } = useUserStore(
  useShallow((state) => ({
    users: state.users,
    loading: state.loading,
    error: state.error,
  }))
)
```

**How it works:** Shallow equality comparison prevents re-renders when object reference changes but content is same.

---

### Performance Optimization Checklist

#### ✅ DO

- Use atomic selectors (single values)
- Extract selector functions for reuse
- Use `useShallow` for multiple values
- Memoize expensive computations with `useMemo`
- Use Set/Map for large collections (O(1) lookups)
- Increment version numbers for cache invalidation

#### ❌ DON'T

- Create new objects/arrays in selectors
- Select entire store: `const store = useStore()`
- Use nested selectors without `useShallow`
- Compute derived state in render
- Use arrays for large collections requiring lookups

---

## Testing Zustand Stores

### Setup: Store Reset Between Tests

```typescript
// __mocks__/zustand.ts
import { act } from '@testing-library/react'
import * as zustand from 'zustand'

const { create: actualCreate, createStore: actualCreateStore } =
  jest.requireActual<typeof zustand>('zustand')

export const storeResetFns = new Set<() => void>()

const createUncurried = <T>(stateCreator: zustand.StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}

export const create = (<T>(stateCreator: zustand.StateCreator<T>) =>
  typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried) as typeof zustand.create

// setupTests.ts
import { storeResetFns } from './__mocks__/zustand'

afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn())
  })
})
```

---

### Testing Store Actions

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAircraftStore } from './aircraft-store'

describe('AircraftStore', () => {
  it('should add aircraft', () => {
    const { result } = renderHook(() => useAircraftStore())

    act(() => {
      result.current.addAircraft({
        id: '1',
        name: 'Aircraft 1',
        status: 'active',
      })
    })

    expect(result.current.aircraft).toHaveLength(1)
    expect(result.current.aircraft[0]).toEqual({
      id: '1',
      name: 'Aircraft 1',
      status: 'active',
    })
  })

  it('should reset between tests', () => {
    const { result } = renderHook(() => useAircraftStore())

    // Store should be empty (reset from previous test)
    expect(result.current.aircraft).toHaveLength(0)
  })
})
```

---

## Anti-Patterns & Troubleshooting

### Anti-Pattern 1: Creating Store in Component

#### ❌ WRONG

```typescript
function MyComponent() {
  // WRONG! Creates new store every render
  const useStore = create((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))

  const count = useStore((state) => state.count)

  return <div>{count}</div>
}
```

**Problem:** Store is recreated on every render → data loss.

#### ✅ CORRECT

```typescript
// Define store OUTSIDE component
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

function MyComponent() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}
```

---

### Anti-Pattern 2: Using Stale Values in Async

#### ❌ WRONG (Stale Value)

```typescript
const useStore = create((set, get) => ({
  count: 0,
  incrementAsync: async () => {
    const currentCount = get().count // Read early ⚠️
    await delay(1000)
    set({ count: currentCount + 1 }) // Use stale value!
  },
}))
```

**Problem:** If `incrementAsync` is called twice quickly, both read same initial value → lost update.

#### ✅ CORRECT (Functional Update)

```typescript
const useStore = create((set) => ({
  count: 0,
  incrementAsync: async () => {
    await delay(1000)
    // Functional update always has latest state
    set((state) => ({ count: state.count + 1 }))
  },
}))
```

---

### Troubleshooting: Store Not Updating

**Symptom:** Actions called but UI doesn't update.

**Causes:**

1. **Forgot to call `set()`**
   ```typescript
   // ❌ WRONG
   addItem: (item) => {
     state.items.push(item) // Direct mutation (no set())
   }

   // ✅ CORRECT
   addItem: (item) =>
     set((state) => ({
       items: [...state.items, item],
     }))
   ```

2. **Mutating state without immer**
   ```typescript
   // ❌ WRONG (without immer)
   addItem: (item) =>
     set((state) => {
       state.items.push(item) // Direct mutation requires immer
       return state
     })

   // ✅ CORRECT (with immer)
   addItem: (item) =>
     set((state) => {
       state.items.push(item) // Immer makes this safe
     })
   ```

---

## Real-World Examples from Codebase

### Example 1: Simple Store (Camera Tracking)

**File:** `apps/fleet/src/app/shared/store/camera-tracking.store.ts`

**Complexity:** 🟢 Beginner (11 lines)

**Use Case:** Boolean toggle for camera tracking mode.

```typescript
import { create } from 'zustand'

interface CameraTrackingState {
  isTracking: boolean
  setTracking: (isTracking: boolean) => void
}

export const useCameraTrackingStore = create<CameraTrackingState>((set) => ({
  isTracking: false,
  setTracking: (isTracking) => set({ isTracking }),
}))
```

**Why This Pattern:**
- No middleware needed (simple boolean)
- No persistence (session-only state)
- No debugging complexity

---

### Example 2: Collections Store (Map Entities)

**File:** `apps/fleet/src/app/shared/store/map-entities.store.ts`

**Complexity:** 🟡 Intermediate (200+ lines)

**Use Case:** Managing 12 map entity collections (drones, docks, NFZs, etc.).

**Key Features:**
- Generic methods with type safety
- DevTools action naming
- Immer for mutations
- Trigger mechanism for dependent updates

---

### Example 3: Mission Planner (Multi-Slice Advanced)

**Files:**
- `apps/mission-planner/src/store/store.ts` (main)
- 7 slice files

**Complexity:** 🔴 Advanced (7 slices, 2500+ total lines)

**Use Case:** Complex mission editing with waypoints, validation, and multi-selection.

---

### Example 4: Asset Management (Enterprise Pattern)

**File:** `apps/asset-management/src/store/application-context.store.ts`

**Complexity:** 🔴 Advanced (4-layer middleware, schema versioning)

**Use Case:** Business domain state with persistence and migration.

---

## Summary & Decision Framework

### Quick Decision Guide

**"What pattern should I use?"**

1. **< 50 lines, simple state?** → **Pattern 1: Minimal Store** (no middleware)
2. **Managing collections with lookups?** → **Pattern 2: Collections Store** (devtools + immer)
3. **Business domain with persistence?** → **Pattern 3: Domain Store** (persist + devtools + immer)
4. **> 500 lines?** → **Pattern 4: Multi-Slice Store** (separate files)
5. **Complex selection with performance needs?** → **Pattern 5: Unified Selection** (Set + Map)
6. **Legacy localStorage code?** → **Pattern 6: Custom Storage Utilities**

---

### Middleware Quick Reference

| Scenario | Middleware Stack |
|----------|-----------------|
| Simple boolean toggle | None |
| Nested objects/arrays | `devtools → immer` |
| Need debugging | `devtools` (conditional) |
| User preferences | `persist → devtools → immer` |
| Production app | `persist → devtools → immer` |

⚠️ **DO NOT use `subscribeWithSelector`** for new projects unless you have external (non-React) subscriptions.

---

### When to Split Stores

**Split into multiple stores when:**
- ✅ Different concerns (UI vs domain vs map)
- ✅ Different persistence needs
- ✅ Different update frequencies
- ✅ Independent features

**Use single store with slices when:**
- ✅ Related concerns requiring coordination
- ✅ Atomic updates needed
- ✅ Shared validation logic
- ✅ Same persistence strategy

---

## Conclusion

This guide provides comprehensive patterns for Zustand usage across simple to advanced scenarios. Follow these principles:

1. **Start Simple** - Use minimal pattern until complexity demands more
2. **Separate Concerns** - Domain vs UI, never mix
3. **Persist Selectively** - Only what's necessary
4. **Measure Performance** - Profile before optimizing
5. **Use Types** - TypeScript prevents runtime errors
6. **Test Thoroughly** - Stores are easy to test in isolation

---

**Version History:**
- v2.0 (2026-01-27): Critical revisions based on codebase review
  - Removed Redux migration (not relevant)
  - Fixed subscribeWithSelector recommendations
  - Added Quick Start section
  - Added Pattern 6 (Custom Storage Utilities)
  - Fixed performance claims
  - Improved technical accuracy
- v1.0 (2026-01-26): Initial comprehensive guide

**Contributors:** Frontend Architecture Team
**Next Review:** Q2 2026
