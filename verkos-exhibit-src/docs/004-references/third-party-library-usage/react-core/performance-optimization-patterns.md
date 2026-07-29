# Performance Optimization - Patterns & Best Practices

> **Concise guide for optimizing React applications in the drone operations platform**
>
> Target Audience: Senior React Engineers

---

## Table of Contents

1. [Performance Philosophy](#1-performance-philosophy)
2. [Component-Level Optimizations](#2-component-level-optimizations)
3. [Rendering Optimizations](#3-rendering-optimizations)
4. [State Management Optimizations](#4-state-management-optimizations)
5. [Map & 3D Rendering Performance](#5-map--3d-rendering-performance)
6. [Real-time Data Optimizations](#6-real-time-data-optimizations)
7. [Build & Bundle Optimizations](#7-build--bundle-optimizations)
8. [Monitoring & Profiling](#8-monitoring--profiling)
9. [Real-World Examples](#9-real-world-examples)
10. [Performance Checklist](#10-performance-checklist)
11. [Anti-Patterns](#11-anti-patterns)

---

## 1. Performance Philosophy

### Core Principles

**Evidence > Assumptions**
- Profile first (React DevTools, Lighthouse)
- Measure FCP, LCP, TTI, TBT, CLS

**Optimize Critical Path**
- Prioritize above-the-fold content
- Lazy load non-critical features

**Progressive Enhancement**
- Fast UI first, advanced features later
- Graceful degradation

### Performance Budgets

**Target Metrics**
- FCP: < 1.8s, LCP: < 2.5s
- TTI: < 3.8s, TBT: < 200ms
- CLS: < 0.1

**Bundle Sizes**
- Initial JS: < 200KB gzipped
- Route chunks: < 100KB gzipped

---

## 2. Component-Level Optimizations

### 2.1 React.memo

**When to Use**
- Frequent renders with same props
- Expensive components (complex calc, large lists)
- Leaf components in frequently updating trees

**When NOT to Use**
- Infrequently rendered components
- Props that change every render
- Simple, cheap components

**Example: MediaCard**
```typescript
// Memoized with custom comparison
export const MediaCard = React.memo<MediaCardProps>(({ media, onView, onSelectionChange }) => {
  const isSelected = useMediaGalleryStore((state) =>
    state.mediaSelection.selectedMedia.includes(media._id)
  );
  // ... component logic
}, (prevProps, nextProps) => {
  return prevProps.media._id === nextProps.media._id &&
         prevProps.media.thumbnailUrl === nextProps.media.thumbnailUrl;
});
```

**Best Practices**
- Custom comparison for complex props
- Stable props (useCallback, useMemo)
- Profile before optimizing

### 2.2 useMemo

**When to Use**
- Expensive computations (> 16ms)
- Derived state that doesn't change often
- Complex filtering/sorting on large datasets

**Example: Asset List Filtering**
```typescript
function AssetList({ assets, filters }) {
  const filtered = useMemo(() =>
    assets.filter(asset =>
      filters.categories.includes(asset.category) &&
      filters.statuses.includes(asset.status)
    ),
    [assets, filters.categories, filters.statuses]
  );
  return <div>{filtered.map(...)}</div>;
}
```

**Best Practices**
- Include all dependencies
- Use Zustand selectors instead

### 2.3 useCallback

**When to Use**
- Functions passed to memoized children
- Functions in useEffect/useMemo dependencies
- Event handlers needing stable references

**Example: Event Handlers**
```typescript
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Empty deps - functional update
  return <MemoizedChild onClick={handleClick} />;
}
```

**Advanced: Stable References for Real-time Data**
```typescript
function DroneTable() {
  const [viewedDrones, setViewedDrones] = useState<string[]>([]);
  const viewedDronesRef = useRef(viewedDrones);
  viewedDronesRef.current = viewedDrones;

  const isDroneViewed = useCallback((id: string) => {
    return viewedDronesRef.current.includes(id);
  }, []); // Stable forever

  return <DataTable isViewed={isDroneViewed} />;
}
```

### 2.4 Premature Optimization - Avoid

**Anti-Patterns**
- Memoizing simple components
- useMemo for trivial calculations
- useCallback without memoized children

**Rule**: Profile first, optimize later

---

## 3. Rendering Optimizations

### 3.1 Virtual Scrolling

**When to Use**
- Lists with > 100 items
- Performance degradation with full rendering

**React Window Implementation**
```typescript
import { FixedSizeList } from 'react-window';

function VirtualizedAssetList({ assets }: { assets: AssetMinimal[] }) {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <AssetCard asset={assets[index]} />
    </div>
  ), [assets]);

  return (
    <FixedSizeList
      height={600}
      itemCount={assets.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

**Best Practices**
- Use overscan for buffer items
- Implement skeleton placeholders
- Test with 1000+ items

### 3.2 Pagination & Infinite Scroll

**Cursor-based Pagination**
```typescript
function useInfiniteAssets(query: AssetQuery) {
  return useInfiniteQuery({
    queryKey: ['assets', query],
    queryFn: ({ pageParam = 0 }) =>
      fetchAssets({ ...query, pagination: { limit: 50, cursor: pageParam } }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

**Infinite Scroll with Intersection Observer**
```typescript
function MediaInfiniteGrid({ mediaGroups, onLoadMore, hasNextPage }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(sentinelRef, {
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isLoadingMore) {
      onLoadMore();
    }
  }, [isIntersecting, hasNextPage, isLoadingMore, onLoadMore]);

  return (
    <div className="h-full overflow-auto">
      {Object.entries(mediaGroups).map(([groupLabel, mediaData]) => (
        <FlexibleMediaGroup key={groupLabel} {...props} />
      ))}
      {hasNextPage && (
        <div ref={sentinelRef} className="h-1 w-full" />
      )}
    </div>
  );
}
```

### 3.3 Lazy Loading

**Route Splitting**
```typescript
const AssetDetailsPage = lazy(() =>
  import('@/app/features/asset-details/components/pages/asset-details-page/AssetDetailsPage')
);

const assetDetailsRoute = createRoute({
  path: '/assets/$assetId',
  component: () => (
    <Suspense fallback={<AssetDetailsSkeleton />}>
      <AssetDetailsPage />
    </Suspense>
  ),
});
```

**Component Splitting**
```typescript
const HeavyMapComponent = lazy(() => import('./HeavyMapComponent'));

function AssetWorkspace() {
  const [showMap, setShowMap] = useState(false);
  return (
    <div>
      <button onClick={() => setShowMap(true)}>Show Map</button>
      {showMap && (
        <Suspense fallback={<MapSkeleton />}>
          <HeavyMapComponent />
        </Suspense>
      )}
    </div>
  );
}
```

**Best Practices**
- Always provide Suspense fallback
- Use skeleton screens
- Preload critical routes

### 3.4 Suspense Boundaries

**Strategic Placement**
```typescript
function AssetDetailsPage({ assetId }: Props) {
  return (
    <div>
      <Suspense fallback={<AssetHeaderSkeleton />}>
        <AssetDetailsHeader assetId={assetId} />
      </Suspense>
      <Suspense fallback={<TabSkeleton />}>
        <AssetGalleryTab assetId={assetId} />
      </Suspense>
    </div>
  );
}
```

---

## 4. State Management Optimizations

### 4.1 Zustand Selectors

**Individual Primitive Selectors**
```typescript
// ❌ BAD: Object selector - re-renders on any state change
const useMediaGallery = () => useMediaGalleryStore((state) => state);

// ✅ GOOD: Individual primitive selectors
export const useFilterSearch = () =>
  useMediaGalleryStore((state) => state.filterSearch);

export const useSelectedMediaCount = () =>
  useMediaGalleryStore((state) => state.mediaSelection.selectedMedia.length);

// ✅ GOOD: Computed selector
export const useHasActiveFilters = () =>
  useMediaGalleryStore((state) => {
    return (
      state.filterSearch.length > 0 ||
      state.filterMediaTypes.length > 0
    );
  });
```

**Version-Aware Selectors**
```typescript
export const useSelectedMediaIds = () =>
  useMediaGalleryStore((state) => state.mediaSelection.selectedMedia);

function MediaGallery() {
  const selectedIds = useSelectedMediaIds();
  const isMediaSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);
  return <MediaCardList isSelected={isMediaSelected} />;
}
```

### 4.2 TanStack Query Keys

**Hierarchical Query Keys**
```typescript
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetQuery) =>
    [...assetKeys.lists(), filters] as const,
  detail: (id: string) =>
    [...assetKeys.all, 'detail', id] as const,
};

// Usage
function useAsset(assetId: string) {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: () => fetchAsset(assetId),
  });
}

// Invalidation
function updateAsset(assetId: string, data: Partial<Asset>) {
  return useMutation({
    mutationFn: () => updateAssetApi(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: assetKeys.detail(assetId),
      });
    },
  });
}
```

### 4.3 Progressive Loading

**Data Tiering**
```typescript
interface AssetMinimal {
  _id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
}

interface AssetDetail extends AssetMinimal {
  description: string;
  specifications: Record<string, unknown>;
}

// Query hooks
function useAssetList() {
  return useQuery<AssetMinimal[]>({
    queryKey: ['assets', 'list'],
    queryFn: () => fetchAssets({ includeFields: 'minimal' }),
  });
}

function useAssetDetail(assetId: string) {
  return useQuery<AssetDetail>({
    queryKey: ['assets', 'detail', assetId],
    queryFn: () => fetchAssetDetail(assetId),
    enabled: !!assetId,
  });
}
```

### 4.4 Batch Updates

**Zustand Batch Updates**
```typescript
// ✅ Single batched update
function updateMultipleFilters() {
  useMediaGalleryStore.setState((state) => ({
    ...state,
    filterSearch: 'drone',
    filterMediaTypes: ['image'],
    filterLensTypes: ['wide-angle'],
  }));
  // Single re-render
}
```

**TanStack Query Batch Invalidation**
```typescript
function onAssetUpdate(assetId: string) {
  queryClient.invalidateQueries({
    queryKey: assetKeys.detail(assetId),
  });
}
```

---

## 5. Map & 3D Rendering Performance

### 5.1 Entity Lifecycle Management

**Proper Entity Lifecycle**
```typescript
function AssetMapManager({ assets }: Props) {
  const mapInstance = useMapInstance();
  const entitiesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!mapInstance) return;

    const currentAssetIds = new Set(assets.map(a => a._id));

    // Remove entities for assets no longer in list
    entitiesRef.current.forEach((entityId, assetId) => {
      if (!currentAssetIds.has(assetId)) {
        mapInstance.removeEntity(entityId);
        entitiesRef.current.delete(assetId);
      }
    });

    // Add entities for new assets
    assets.forEach(asset => {
      if (!entitiesRef.current.has(asset._id)) {
        const entityId = mapInstance.addAssetMarker(asset);
        entitiesRef.current.set(asset._id, entityId);
      }
    });

    return () => {
      entitiesRef.current.forEach((entityId) => {
        mapInstance.removeEntity(entityId);
      });
      entitiesRef.current.clear();
    };
  }, [mapInstance, assets]);

  return null;
}
```

### 5.2 Viewport Culling

**Only Render Visible Entities**
```typescript
function MapViewportManager() {
  const mapInstance = useMapInstance();
  const [visibleBounds, setVisibleBounds] = useState<Bounds>();

  useEffect(() => {
    if (!mapInstance) return;

    const updateBounds = () => {
      const bounds = mapInstance.getViewportBounds();
      setVisibleBounds(bounds);
    };

    const listener = mapInstance.addEventListener('viewportChanged', updateBounds);
    updateBounds();

    return () => mapInstance.removeEventListener(listener);
  }, [mapInstance]);

  const visibleAssets = useMemo(() =>
    assets.filter(asset =>
      visibleBounds && isPointInBounds(asset.position, visibleBounds)
    ),
    [assets, visibleBounds]
  );

  return <AssetEntities assets={visibleAssets} />;
}
```

### 5.3 Clustering

**Cluster Nearby Assets**
```typescript
function AssetClusterManager({ assets }: Props) {
  const mapInstance = useMapInstance();
  const clustersRef = useRef<Map<string, Cluster>>(new Map());

  useEffect(() => {
    if (!mapInstance) return;

    const clusters = clusterAssets(assets, {
      maxDistance: 100, // meters
      minClusterSize: 5,
    });

    // Update cluster markers
    clusters.forEach(cluster => {
      const existing = clustersRef.current.get(cluster.id);
      if (!existing || shouldUpdateCluster(existing, cluster)) {
        const marker = mapInstance.addClusterMarker(cluster);
        clustersRef.current.set(cluster.id, marker);
      }
    });

    // Remove old clusters
    clustersRef.current.forEach((marker, clusterId) => {
      if (!clusters.find(c => c.id === clusterId)) {
        mapInstance.removeMarker(marker);
        clustersRef.current.delete(clusterId);
      }
    });
  }, [mapInstance, assets]);

  return null;
}
```

### 5.4 LOD (Level of Detail)

**Adjust Detail by Zoom Level**
```typescript
function AssetLODManager({ assets }: Props) {
  const mapInstance = useMapInstance();
  const [zoomLevel, setZoomLevel] = useState(0);

  useEffect(() => {
    if (!mapInstance) return;

    const listener = mapInstance.addEventListener('zoomChanged', (e) => {
      setZoomLevel(e.zoomLevel);
    });

    return () => mapInstance.removeEventListener(listener);
  }, [mapInstance]);

  const renderStrategy = useMemo(() => {
    if (zoomLevel < 10) return 'markers-only';
    if (zoomLevel < 14) return 'markers-labels';
    if (zoomLevel < 16) return 'markers-labels-status';
    return 'full-detail';
  }, [zoomLevel]);

  return <AssetEntities assets={assets} detailLevel={renderStrategy} />;
}
```

### 5.5 Update Batching

**Batch Map Updates**
```typescript
function MapUpdateBatcher({ updates }: Props) {
  const mapInstance = useMapInstance();
  const updatesRef = useRef<AssetUpdate[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    updatesRef.current.push(...updates);

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      if (!mapInstance) return;

      const batch = updatesRef.current.splice(0);
      mapInstance.batchUpdateEntities(batch);
    }, 100);

    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [updates, mapInstance]);

  return null;
}
```

---

## 6. Real-time Data Optimizations

### 6.1 Throttling and Debouncing

**Debounce Implementation**
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

// Different delays for different operations
const DEBOUNCE_DELAYS = {
  takeoffSettings: 300,
  referencePoint: 500,
  waypoints: 200,
  metadata: 1000,
} as const;
```

**Throttle Implementation**
```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  } as T;
}

// Usage
const throttledUpdateDronePosition = throttle(
  (position: Position) => updateDronePosition(position),
  100
);
```

**Best Practices**
- Debounce user input (search, filters)
- Throttle real-time updates (position, telemetry)
- Clear timeouts on unmount

### 6.2 Update Batching

**Batch Real-time Updates**
```typescript
function TelemetryManager() {
  const updatesRef = useRef<DroneUpdate[]>([]);
  const batchIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    batchIntervalRef.current = setInterval(() => {
      if (updatesRef.current.length === 0) return;

      const batch = updatesRef.current.splice(0);
      applyTelemetryBatch(batch);
    }, 50);

    return () => clearInterval(batchIntervalRef.current);
  }, []);

  const handleTelemetry = (update: DroneUpdate) => {
    updatesRef.current.push(update);
  };

  return <SocketListener onTelemetry={handleTelemetry} />;
}
```

### 6.3 Selective Subscriptions

**Subscribe Only to Needed Data**
```typescript
function useDroneBattery(droneId: string) {
  return useDronesStore(
    (state) => state.drones[droneId]?.battery?.total_percentage
  );
}

// Equality check for minimal updates
function useDronePosition(droneId: string) {
  const prevPosition = useRef<Position>();

  return useDronesStore((state) => {
    const position = state.drones[droneId]?.globalPosition?.position;

    if (prevPosition.current && position) {
      const distance = calculateDistance(prevPosition.current, position);
      if (distance < 1) return prevPosition.current;
    }

    prevPosition.current = position;
    return position;
  });
}
```

---

## 7. Build & Bundle Optimizations

### 7.1 Code Splitting

**Route-Based Splitting**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'tanstack-vendor': ['@tanstack/react-query', '@tanstack/react-router'],
          'map-vendor': ['cesium', 'resium'],
          'asset-management': [
            /\/apps\/asset-management\/src\/app\/features/
          ],
        },
      },
    },
  },
});
```

**Component Splitting**
```typescript
const HeavyMap = lazy(() => import('./HeavyMap'));
const VideoPlayer = lazy(() => import('./VideoPlayer'));
```

### 7.2 Tree Shaking

**ESM vs CommonJS**
```typescript
// ✅ GOOD: Tree-shakeable
import { Button } from '@libs/shared/ui/fb-components';

// ❌ BAD: Entire bundle imported
const components = require('@libs/shared/ui/fb-components');
```

**Named Exports**
```typescript
// ✅ GOOD: Named exports
export const Button = () => { /* ... */ };
export const Input = () => { /* ... */ };

// ❌ BAD: Default export
export default { Button: () => { /* ... */ } };
```

### 7.3 Bundle Analysis

**Analyze Bundle Size**
```bash
npm run build -- --mode analyze
npm install rollup-plugin-visualizer -D
```

**Bundle Budgets**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkSizeWarningLimit: 500, // KB
      },
    },
  },
});
```

---

## 8. Monitoring & Profiling

### 8.1 React DevTools Profiler

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log({ id, phase, actualDuration, baseDuration });
};

function ProfiledAssetList() {
  return (
    <Profiler id="AssetList" onRender={onRenderCallback}>
      <AssetList />
    </Profiler>
  );
}
```

### 8.2 Why Did You Render

```typescript
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (import.meta.env.DEV && typeof window !== 'undefined') {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
  });
}

MediaCard.whyDidYouRender = true;
```

### 8.3 Custom Performance Hooks

**Render Count**
```typescript
function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
}
```

**Core Web Vitals**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric: unknown) {
  console.log(metric);
}

getCLS(reportWebVitals);
getFID(reportWebVitals);
getLCP(reportWebVitals);
getFCP(reportWebVitals);
getTTFB(reportWebVitals);
```

### 8.4 API Response Time

```typescript
function useApiResponseTime<T>(
  query: UseQueryResult<T>
): UseQueryResult<T> & { responseTime?: number } {
  const startTime = useRef<number>();

  useEffect(() => {
    if (query.isLoading && !startTime.current) {
      startTime.current = performance.now();
    }

    if (!query.isLoading && startTime.current) {
      const responseTime = performance.now() - startTime.current;
      console.log(`API Response Time: ${responseTime}ms`);
      startTime.current = undefined;
    }
  }, [query.isLoading]);

  return query;
}
```

---

## 9. Real-World Examples

### 9.1 Fleet View: Real-time Drone Table

**Problem**: 10+ WebSocket updates/second causing excessive re-renders.

**Solution**:
```typescript
// Structural sharing for updates
newDroneData = {
  ...prevDroneData,
  ...(prevDroneData.name !== newName && { name: newName }),
  ...(prevDroneData.battery !== displayBattery && { battery: displayBattery }),
  systemState,
  bindingId: drone.bindingId,
};

// Cell-level memoization
const MemoizedCell = React.memo(({ cell, row }) => {
  return flexRender(cell.column.columnDef.cell, cell.getContext());
}, (prev, next) => {
  return prev.row.original === next.row.original;
});

// Stable functions
const viewedDronesRef = useRef(viewedDrones);
viewedDronesRef.current = viewedDrones;

const isDroneViewed = useCallback((id: string) => {
  return viewedDronesRef.current.includes(id);
}, []);
```

**Results**: 80% reduction in re-renders, smooth updates at 10Hz

### 9.2 Asset Management: Unified Selection

**Problem**: Selection state scattered across views causing inconsistency.

**Solution**:
```typescript
// Unified state in Zustand
export const useSelectedMediaIds = () =>
  useMediaGalleryStore((state) => state.mediaSelection.selectedMedia);

export const useSelectedMediaCount = () =>
  useMediaGalleryStore((state) => state.mediaSelection.selectedMedia.length);

// Stable actions
export const useToggleNode = () =>
  useMediaGalleryStore((state) => state.toggleNode);
```

**Results**: Single source of truth, minimal re-renders, consistent state

### 9.3 Mission Planner: Sync-Direction Store

**Problem**: Bidirectional sync causing infinite loops.

**Solution**:
```typescript
const DEBOUNCE_DELAYS = {
  takeoffSettings: 300,
  referencePoint: 500,
  waypoints: 200,
  metadata: 1000,
} as const;

const debouncedUpdateTakeoffSettings = useMemo(
  () => debounce(updateMissionPlannerTakeoffSettings, DEBOUNCE_DELAYS.takeoffSettings),
  [updateMissionPlannerTakeoffSettings]
);

// Track previous values
const previousValues = useRef<{ takeoffSettings?: ITakeOffSettings }>({});

useEffect(() => {
  const prev = previousValues.current.takeoffSettings;
  if (!prev || prev.altitude !== takeoffSettings.altitude) {
    debouncedUpdateTakeoffSettings(takeoffSettings);
    previousValues.current.takeoffSettings = { ...takeoffSettings };
  }
}, [takeoffSettings, debouncedUpdateTakeoffSettings]);
```

**Results**: Eliminated infinite loops, 60% reduction in map updates

### 9.4 Media Gallery: Infinite Scroll

**Problem**: Inefficient infinite scroll causing layout shifts.

**Solution**:
```typescript
const sentinelRef = useRef<HTMLDivElement>(null);
const { isIntersecting } = useIntersectionObserver(sentinelRef, {
  threshold: 0.1,
  rootMargin: '100px',
});

useEffect(() => {
  if (isIntersecting && hasNextPage && !isLoadingMore) {
    onLoadMore();
  }
}, [isIntersecting, hasNextPage, isLoadingMore, onLoadMore]);
```

**Results**: Smooth scrolling, pre-loads content, consistent performance

---

## 10. Performance Checklist

### Component Level
- [ ] Profiled before optimizing
- [ ] React.memo used only when necessary
- [ ] useMemo for expensive calculations (> 16ms)
- [ ] useCallback for functions passed to memoized children
- [ ] Stable prop references (no inline objects/arrays)
- [ ] Proper dependency arrays

### Rendering Level
- [ ] Virtual scrolling for lists > 100 items
- [ ] Lazy loading for routes and heavy components
- [ ] Suspense boundaries at component boundaries
- [ ] Skeleton screens for loading states
- [ ] Image lazy loading (`loading="lazy"`)

### State Management Level
- [ ] Individual primitive selectors in Zustand
- [ ] Hierarchical query keys in TanStack Query
- [ ] Appropriate stale times per data type
- [ ] Progressive loading (minimal vs detail)
- [ ] Batch updates where possible

### Real-time Data Level
- [ ] Throttled high-frequency updates
- [ ] Debounced user input
- [ ] Selective subscriptions
- [ ] Update batching for bulk changes

### Map & 3D Level
- [ ] Entity lifecycle management
- [ ] Viewport culling
- [ ] Clustering for nearby entities
- [ ] LOD based on zoom
- [ ] Batched map updates

### Build Level
- [ ] Code splitting by route
- [ ] Vendor chunks separated
- [ ] Tree shaking enabled (ESM)
- [ ] Bundle size < 200KB (initial)
- [ ] Bundle analysis performed

### Monitoring Level
- [ ] React DevTools Profiler used
- [ ] Core Web Vitals tracked
- [ ] Custom performance hooks in place
- [ ] Analytics for performance metrics

---

## 11. Anti-Patterns

### 1. Premature Memoization
```typescript
// ❌ BAD: Memoizing trivial computation
const sum = useMemo(() => a + b, [a, b]);

// ✅ GOOD: Direct computation
const sum = a + b;
```

### 2. Missing Dependencies
```typescript
// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchUserData(userId);
}, []); // Missing userId

// ✅ GOOD: All dependencies included
useEffect(() => {
  fetchUserData(userId);
}, [userId]);
```

### 3. Inline Event Handlers
```typescript
// ❌ BAD: New function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ GOOD: Stable callback
const handleClick = useCallback(() => {
  // ...
}, [id]);
<button onClick={handleClick}>Click</button>
```

### 4. Derived State in useEffect
```typescript
// ❌ BAD: Deriving state in useEffect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ GOOD: Derive during render
const fullName = `${firstName} ${lastName}`;
```

### 5. Giant Components
```typescript
// ❌ BAD: 500+ line component
function GiantComponent() {
  // 500 lines of logic
}

// ✅ GOOD: Split into smaller components
function GiantComponent() {
  return (
    <>
      <ComponentHeader />
      <ComponentBody />
      <ComponentFooter />
    </>
  );
}
```

### 6. Prop Drilling
```typescript
// ❌ BAD: Prop drilling through 5 levels
function App() {
  return <Level1 user={user} />;
}
function Level1({ user }) {
  return <Level2 user={user} />;
}

// ✅ GOOD: Use context or state management
const UserContext = createContext<User | null>(null);
function App() {
  return (
    <UserContext.Provider value={user}>
      <Level1 />
    </UserContext.Provider>
  );
}
```

### 7. Unstable Object References
```typescript
// ❌ BAD: New object on every render
<Component filter={{ category: 'drone' }} />

// ✅ GOOD: Stable reference
const filter = useMemo(() => ({ category: 'drone' }), []);
<Component filter={filter} />
```

### 8. Over-Optimization
```typescript
// ❌ BAD: Optimizing before measuring
function Component() {
  const value = useMemo(() => Math.random(), []); // Why?
}

// ✅ GOOD: Optimize based on measurements
function Component() {
  // Profile first, optimize hot paths only
  const value = Math.random();
}
```

---

## Conclusion

Performance optimization requires:
1. **Measure first** - Use profiler tools to identify bottlenecks
2. **Optimize strategically** - Focus on critical path and user-perceived performance
3. **Verify improvements** - Measure before and after optimization
4. **Document decisions** - Explain why optimization was necessary

**Clear code > clever optimizations**. Optimize only when measurements indicate it's necessary.

---

## Related Documentation

- [React Real-time Optimization](/docs/004-references/third-party-library-usage/react-core/react-realtime-optimization.md)
- [Zustand Best Practices](/docs/004-references/third-party-library-usage/zustand/zustand.doc.md)
- [TanStack Query Guidelines](/docs/004-references/third-party-library-usage/tanstack-query/tanstack-query.doc.md)
- [Development Principles](/docs/001-common/development-standards/development-principles.md)
