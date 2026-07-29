# TanStack Query Usage Patterns Guide

**Version:** 1.1
**Last Updated:** 2026-01-27
**Target Audience:** React Developers (Junior to Senior)
**TanStack Query Version:** v5.64.x

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Quick Reference](#quick-reference)
3. [Query Key Architecture](#query-key-architecture)
4. [Using Our HTTP Client](#using-our-http-client)
5. [Query Patterns](#query-patterns)
6. [Mutation Patterns](#mutation-patterns)
7. [Caching Strategies](#caching-strategies)
8. [Advanced Patterns](#advanced-patterns)
9. [Real-World Scenarios](#real-world-scenarios)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
11. [Testing Strategies](#testing-strategies)
12. [Codebase Analysis](#codebase-analysis)

---

## Quick Start (5 Minutes)

**Need to fetch data right now?** Copy one of these templates:

### Template 1: Basic Query with HTTP Client (Most Common)

```typescript
// hooks/users/use-users.ts
import { useQuery } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'

export const USERS_KEYS = {
  all: ['users'] as const,
  lists: () => [...USERS_KEYS.all, 'list'] as const,
  detail: (id: string) => [...USERS_KEYS.all, 'detail', id] as const,
} as const

export function useUsers() {
  const httpClient = useHttp() // Our auth library's HTTP client

  return useQuery({
    queryKey: USERS_KEYS.lists(),
    queryFn: async () => {
      const response = await httpClient.get<UserResponse>('/api/users')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Usage in component:
const { data, isLoading, error } = useUsers()
```

### Template 2: Mutation with Invalidation

```typescript
// hooks/users/use-create-user.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'
import { USERS_KEYS } from './use-users'

export function useCreateUser() {
  const queryClient = useQueryClient()
  const httpClient = useHttp()

  return useMutation({
    mutationKey: ['create-user'], // For debugging
    mutationFn: async (userData: CreateUserInput) => {
      const response = await httpClient.post<User>('/api/users', userData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
    },
  })
}
```

### Template 3: Query Options (Reusable Config)

```typescript
// hooks/users/user-options.ts
import { queryOptions } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'

export const userOptions = (id: string) =>
  queryOptions({
    queryKey: USERS_KEYS.detail(id),
    queryFn: async () => {
      const httpClient = useHttp()
      const response = await httpClient.get<User>(`/api/users/${id}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })

// Now reusable in components, prefetch, and route loaders!
export function useUser(id: string) {
  return useQuery(userOptions(id))
}

// In route loader:
loader: async ({ params }) => {
  return await queryClient.fetchQuery(userOptions(params.id))
}
```

**Need something more complex?** → [Browse Advanced Patterns](#advanced-patterns)

---

## Quick Reference

| I need to... | Go to |
|--------------|-------|
| Fetch data with our HTTP client | [Using Our HTTP Client](#using-our-http-client) |
| Create reusable query configs | [Query Options Pattern](#pattern-0-query-options-the-v5-game-changer) |
| Create/Update/Delete data | [Mutation Patterns](#mutation-patterns) |
| Handle pagination | [Infinite Queries](#pattern-7-infinite-queries-with-cursor-pagination) |
| Update data optimistically | [Optimistic Updates](#pattern-2-optimistic-updates-with-rollback) |
| Handle retry logic | [Retry Strategies](#retry-strategies-with-exponential-backoff) |
| Use Suspense boundaries | [Suspense Integration](#pattern-10-suspense-integration) |
| initialData vs placeholderData | [Initial vs Placeholder Data](#initialdata-vs-placeholderdata) |
| Filter/search data | [Server-Side Filtering](#pattern-1-server-side-filtering-with-query-keys) |
| Work with real-time data | [Socket + Query Integration](#scenario-1-real-time-data-with-socketio) |
| Cache data across routes | [Cache Strategies](#caching-strategies) |
| Fix loading states | [Loading State Patterns](#loading-state-patterns) |
| Test my queries | [Testing Strategies](#testing-strategies) |

---

## Query Key Architecture

### The Golden Rule: Hierarchical Structure

Query keys are the foundation of TanStack Query's caching and invalidation system. Follow this hierarchical structure:

```typescript
// ✅ CORRECT - Hierarchical structure
export const RESOURCE_KEYS = {
  all: ['resource'] as const,                    // Base key
  lists: () => [...RESOURCE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...RESOURCE_KEYS.lists(), filters] as const,
  details: () => [...RESOURCE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RESOURCE_KEYS.details(), id] as const,
} as const

// ❌ WRONG - Flat structure
export const RESOURCE_KEYS = {
  list: 'resource-list',  // String keys limit invalidation options
  detail: (id: string) => `resource-${id}`,
}
```

### Benefits of Hierarchical Keys

```typescript
// Invalidate ALL resource queries
queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all })

// Invalidate only list queries
queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.lists() })

// Invalidate specific detail query
queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.detail(id) })
```

### Query Key Best Practices

**DO:**
- ✅ Use `as const` for type inference
- ✅ Include all parameters that affect results
- ✅ Use arrays, not strings
- ✅ Organize hierarchically
- ✅ Define in shared API modules for cross-app usage

**DON'T:**
- ❌ Use JSON.stringify in keys (use objects)
- ❌ Duplicate keys across modules
- ❌ Forget `as const` assertion
- ❌ Define keys in app-specific files if shared

### Real Example from Codebase

```typescript
// From: /apps/mission-planner/src/hooks/mission/use-mission-list.ts
export const MISSION_KEYS = {
  all: ['missions'] as const,
  lists: () => [...MISSION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...MISSION_KEYS.lists(), { filters }] as const,
  details: () => [...MISSION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MISSION_KEYS.details(), id] as const,
} as const
```

---

## Using Our HTTP Client

### Why We Use the Auth Library's HTTP Client

All applications in our monorepo should use the `httpClient` from `@libs/core/auth-frontend`. It provides:

- ✅ Automatic authentication token management
- ✅ Organization ID header injection
- ✅ Standardized error handling
- ✅ Email verification handling
- ✅ Auth error redirection

### HTTP Client Pattern

```typescript
// ❌ WRONG - Don't use fetch directly
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users') // No auth headers!
      return response.json()
    },
  })
}

// ✅ CORRECT - Use our httpClient
export function useUsers() {
  const httpClient = useHttp()

  return useQuery({
    queryKey: USERS_KEYS.lists(),
    queryFn: async () => {
      const response = await httpClient.get<UserResponse>('/api/users')
      return response.data
    },
  })
}
```

### With API Module Pattern

```typescript
// libs/shared/api-modules/users/api/users.api.ts
import { useHttp } from '@libs/core/auth-frontend'

export const useUsersApi = () => {
  const httpClient = useHttp()

  return {
    getUsers: async () => {
      const response = await httpClient.get<UserResponse>('/api/users')
      return response.data
    },

    getUserById: async (id: string) => {
      const response = await httpClient.get<User>(`/api/users/${id}`)
      return response.data
    },

    createUser: async (data: CreateUserInput) => {
      const response = await httpClient.post<User>('/api/users', data)
      return response.data
    },
  }
}

// hooks/users/use-users.ts
export function useUsers() {
  const usersApi = useUsersApi()

  return useQuery({
    queryKey: USERS_KEYS.lists(),
    queryFn: () => usersApi.getUsers(),
  })
}
```

---

## Query Patterns

### Pattern 0: Query Options (The v5 Game-Changer) ⭐ NEW

**When to Use:** You need to reuse query configuration across components, prefetch queries, or use in route loaders.

**Why It Matters:**
- Enables sharing query configs between `useQuery` and `prefetchQuery`
- Critical for TanStack Router route loaders
- Required for SSR scenarios
- Provides full type safety

```typescript
// hooks/users/user-options.ts
import { queryOptions } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'

export const userOptions = (id: string) =>
  queryOptions({
    queryKey: USERS_KEYS.detail(id),
    queryFn: async () => {
      const httpClient = useHttp()
      const response = await httpClient.get<User>(`/api/users/${id}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })

// Now reusable everywhere!
export function useUser(id: string) {
  return useQuery(userOptions(id))
}

// In component with prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const { data: user } = useUser(userId)

  const prefetchUser = () => {
    queryClient.prefetchQuery(userOptions(userId))
  }

  return <Link onMouseEnter={prefetchUser}>{user?.name ?? userId}</Link>
}

// In TanStack Router route loader
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params, context: { queryClient } }) => {
    return await queryClient.fetchQuery(userOptions(params.userId))
  },
  component: UserDetailPage,
})
```

**Key Benefits:**
- Single source of truth for query config
- Type-safe query keys and return types
- Consistent staleTime, retry, etc. across usages
- Enables prefetching without duplication

---

### Pattern 1: Server-Side Filtering with Query Keys

**When to Use:** Large datasets (> 100 items) where client-side filtering is slow

```typescript
// hooks/assets/use-assets.ts
export function useAssets(filters: AssetFilters) {
  const httpClient = useHttp()

  return useQuery({
    queryKey: [...ASSETS_KEYS.lists(), filters], // Object in key works!
    queryFn: () => {
      return httpClient.get<AssetResponse>('/api/assets', {
        params: filters, // Axios/Fetch will serialize
      }).then(r => r.data)
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

**Key Points:**
- Each unique filter combination gets its own cache entry
- Server handles filtering, sorting, pagination
- No need for JSON.stringify - objects in keys work fine

---

### Pattern 2: Client-Side Filtering (use useMemo, not useQuery)

**When to Use:** Small datasets (< 100 items) where client-side filtering is faster

**⚠️ IMPORTANT:** Don't use `useQuery` for client-side filtering - it creates unnecessary cache entries. Use `useMemo` instead.

```typescript
// ❌ WRONG - Creates cache entries for each filter
const { data: filtered } = useQuery({
  queryKey: FILTERED_MISSIONS_KEY(filter),
  queryFn: () => filterMissions(allMissions, filter),
})

// ✅ CORRECT - useMemo for client-side filtering
export function useFilteredMissions(filter: MissionFilter) {
  const { data: allMissions, isLoading } = useMissionList()

  const filteredMissions = useMemo(() => {
    if (!allMissions) return []
    return allMissions.filter((mission) => {
      const matchesSearch = !filter.search ||
        mission.name.toLowerCase().includes(filter.search.toLowerCase())
      const matchesStatus = !filter.status || mission.status === filter.status
      return matchesSearch && matchesStatus
    })
  }, [allMissions, filter])

  return { filteredMissions, allMissions, isLoading }
}
```

**Key Points:**
- `useMemo` for derived/computed data
- No cache pollution
- Filters run synchronously, no async needed

---

### Pattern 3: Select Transformation

**When to Use:** You need to transform data before using it

```typescript
// hooks/flights/use-flight-paths.ts
export function useFlightPaths(flightId: string) {
  const httpClient = useHttp()

  return useQuery({
    queryKey: FLIGHT_PATH_KEYS.flightPaths(flightId),
    queryFn: async () => {
      const response = await httpClient.get<FlightPathResponse>(`/api/flights/${flightId}/path`)
      return response.data
    },
    select: (data) => {
      // Transform data here - cached separately
      return data.map((point) => ({
        latitude: point.lat,
        longitude: point.lon,
        altitude: point.alt,
      }))
    },
    staleTime: 500, // Real-time telemetry
  })
}
```

**Key Points:**
- `select` runs after data is fetched
- Transformed data is cached separately
- Re-running select doesn't cause refetch

---

### Pattern 4: Dependent Queries

**When to Use:** Query B depends on data from Query A

```typescript
// Approach 1: Using enabled flag (Recommended)
export function useUserProfile(userId: string) {
  const httpClient = useHttp()

  const { data: user } = useQuery({
    queryKey: USER_KEYS.detail(userId),
    queryFn: async () => {
      const response = await httpClient.get<User>(`/api/users/${userId}`)
      return response.data
    },
  })

  const { data: profile } = useQuery({
    queryKey: PROFILE_KEYS.detail(user?.profileId),
    queryFn: async () => {
      const response = await httpClient.get<Profile>(`/api/profiles/${user.profileId}`)
      return response.data
    },
    enabled: !!user?.profileId, // Only fetch when profileId exists
  })

  return { user, profile }
}
```

---

### Pattern 5: Parallel Queries with useQueries

**When to Use:** Fetching multiple independent resources simultaneously

```typescript
// hooks/dashboard/use-dashboard-data.ts
import { useQueries } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'

export function useDashboardData() {
  const httpClient = useHttp()

  const results = useQueries({
    queries: [
      {
        queryKey: USERS_KEYS.lists(),
        queryFn: async () => {
          const response = await httpClient.get<UserResponse>('/api/users')
          return response.data
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: MISSIONS_KEYS.lists(),
        queryFn: async () => {
          const response = await httpClient.get<MissionResponse>('/api/missions')
          return response.data
        },
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ASSETS_KEYS.lists(),
        queryFn: async () => {
          const response = await httpClient.get<AssetResponse>('/api/assets')
          return response.data
        },
        staleTime: 5 * 60 * 1000,
      },
    ],
    combine: (results) => ({
      users: results[0].data,
      missions: results[1].data,
      assets: results[2].data,
      isLoading: results.some((r) => r.isLoading),
      errors: results.map((r) => r.error).filter(Boolean),
    }),
  })

  return results
}
```

**Key Points:**
- All queries run in parallel
- `combine` transforms results
- Single loading state for all queries

---

## Mutation Patterns

### Pattern 1: Basic Mutation with Invalidation

```typescript
// hooks/users/use-update-user.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'
import { USERS_KEYS } from './use-users'

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const httpClient = useHttp()

  return useMutation({
    mutationKey: ['update-user'], // For debugging
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await httpClient.patch<User>(`/api/users/${id}`, data)
      return response.data
    },
    onSuccess: (updatedUser, variables) => {
      // Update detail query
      queryClient.setQueryData(USERS_KEYS.detail(variables.id), updatedUser)

      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
    },
  })
}
```

---

### Pattern 2: Optimistic Updates with Rollback

**When to Use:** Updates that should feel instant to the user

```typescript
// hooks/missions/use-toggle-mission-status.ts
export function useToggleMissionStatus() {
  const queryClient = useQueryClient()
  const httpClient = useHttp()

  return useMutation({
    mutationKey: ['toggle-mission-status'],
    mutationFn: async ({ id, disable }: { id: string; disable: boolean }) => {
      const response = await httpClient.patch<SuccessResponse>(`/api/missions/${id}/status`, {
        disabled: disable,
      })
      return response.data
    },

    // Step 1: Cancel outgoing refetches
    onMutate: async ({ id, disable }) => {
      await queryClient.cancelQueries({ queryKey: MISSION_KEYS.detail(id) })
      await queryClient.cancelQueries({ queryKey: MISSION_KEYS.lists() })

      // Step 2: Snapshot previous values
      const previousMission = queryClient.getQueryData(MISSION_KEYS.detail(id))
      const previousMissions = queryClient.getQueryData(MISSION_KEYS.lists())

      // Step 3: Optimistically update cache
      if (previousMission) {
        queryClient.setQueryData(MISSION_KEYS.detail(id), {
          ...previousMission,
          is_disabled: disable,
        })
      }

      if (previousMissions) {
        queryClient.setQueryData(
          MISSION_KEYS.lists(),
          previousMissions.map((mission) =>
            mission.id === id ? { ...mission, is_disabled: disable } : mission
          )
        )
      }

      // Return context with previous values for rollback
      return { previousMission, previousMissions }
    },

    // Step 4: Rollback on error
    onError: (error, { id }, context) => {
      if (context?.previousMission) {
        queryClient.setQueryData(MISSION_KEYS.detail(id), context.previousMission)
      }
      if (context?.previousMissions) {
        queryClient.setQueryData(MISSION_KEYS.lists(), context.previousMissions)
      }
    },

    // Step 5: Refetch on success (optional if setQueryData was sufficient)
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.lists() })
    },
  })
}
```

---

### Pattern 3: Bulk Operations with Multi-Level Updates

**When to Use:** Updating multiple items at once

```typescript
// hooks/missions/use-bulk-operations.ts
export function useBulkOperations() {
  const queryClient = useQueryClient()
  const httpClient = useHttp()

  return useMutation({
    mutationKey: ['bulk-operations'],
    mutationFn: async (request: BulkOperationRequest) => {
      const response = await httpClient.post<SuccessResponse>('/api/missions/bulk', request)
      return response.data
    },

    onMutate: async (request) => {
      // Cancel all affected queries
      await queryClient.cancelQueries({ queryKey: MISSION_KEYS.lists() })
      for (const id of request.missionIds) {
        await queryClient.cancelQueries({ queryKey: MISSION_KEYS.detail(id) })
      }

      // Snapshot all previous states
      const previousMissions = queryClient.getQueryData(MISSION_KEYS.lists())
      const previousDetails: Record<string, IMission> = {}
      for (const id of request.missionIds) {
        previousDetails[id] = queryClient.getQueryData(MISSION_KEYS.detail(id))
      }

      // Optimistic updates based on action type
      if (request.action === 'delete' && previousMissions) {
        queryClient.setQueryData(
          MISSION_KEYS.lists(),
          previousMissions.filter((m) => !request.missionIds.includes(m.id))
        )
      }

      if (request.action === 'disable' && previousMissions) {
        queryClient.setQueryData(
          MISSION_KEYS.lists(),
          previousMissions.map((m) =>
            request.missionIds.includes(m.id)
              ? { ...m, is_disabled: true }
              : m
          )
        )
      }

      return { previousMissions, previousDetails }
    },

    onError: (error, request, context) => {
      // Rollback everything
      if (context?.previousMissions) {
        queryClient.setQueryData(MISSION_KEYS.lists(), context.previousMissions)
      }
      Object.entries(context?.previousDetails ?? {}).forEach(([id, data]) => {
        if (data) {
          queryClient.setQueryData(MISSION_KEYS.detail(id), data)
        }
      })
    },

    onSuccess: (_, request) => {
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.lists() })

      if (request.action === 'delete') {
        for (const id of request.missionIds) {
          queryClient.removeQueries({ queryKey: MISSION_KEYS.detail(id) })
        }
      }
    },
  })
}
```

---

## Caching Strategies

### staleTime vs gcTime

```typescript
// staleTime: Data is considered "fresh" - no refetch during this period
// gcTime: Inactive queries remain in cache before garbage collection

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // These are the defaults
      staleTime: 0,        // Immediately stale
      gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    },
  },
})
```

### Recommended Stale Times by Data Type

| Data Type | staleTime | gcTime | Rationale |
|-----------|-----------|--------|-----------|
| **Real-time (telemetry)** | 0-1s | 1 min | Changes constantly |
| **User-generated content** | 1-5 min | 10 min | Changes by users |
| **Reference data (countries)** | 1 hour+ | Infinity | Rarely changes |
| **User profile** | 5-10 min | 30 min | Occasionally updates |
| **Dashboard data** | 30s-2min | 10 min | Needs freshness |

### Global Query Client Configuration

```typescript
// lib/react-query/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      retry: 1, // Only retry mutations once
    },
  },
})
```

### Retry Strategies with Exponential Backoff

**Why This Matters:** Different errors need different retry strategies. Network errors should retry; 404s should not.

```typescript
// Global configuration with smart defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 404 (Not Found) or 401 (Unauthorized)
        if (error instanceof ApiError) {
          if (error.status === 404 || error.status === 401) {
            return false
          }
        }

        // Retry network errors up to 3 times
        if (error instanceof NetworkError) {
          return failureCount < 3
        }

        // Default: retry once
        return failureCount < 1
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s, 8s... (max 30s)
        return Math.min(1000 * 2 ** attemptIndex, 30000)
      },
    },
  },
})

// Per-query override
useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  retry: (failureCount, error) => {
    // Custom retry logic for this specific query
    if (error instanceof ApiError && error.status === 429) {
      // Rate limited - retry with longer delay
      return failureCount < 5
    }
    return failureCount < 2
  },
  retryDelay: (attemptIndex) => {
    // Custom backoff for rate limiting
    return Math.min(1000 * 3 ** attemptIndex, 60000)
  },
})
```

**Retry Decision Tree:**
```
┌─────────────────────────────────────────────────────────────┐
│  Error occurs during fetch                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─ Is 404 (Not Found)? ──YES──► Don't retry (won't change)   │
│  └─ Is 401 (Unauthorized)? ─YES──► Don't retry (auth required)│
│  └─ Is 429 (Rate Limited)? ─YES──► Retry 5x with exponential  │
│  └─ Is 5xx (Server Error)? ─YES──► Retry 2-3x with backoff   │
│  └─ Is Network Error? ────────► Retry 3x with backoff        │
│  └─ Other error? ─────────────► Retry 1x                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Advanced Patterns

### initialData vs placeholderData

**Common Confusion:** When to use which option?

```typescript
// initialData: Prefetched data, NEVER shows loading state
// Use when: You have prefetched data and want to bypass loading

useQuery({
  queryKey: USER_KEYS.detail(id),
  queryFn: fetchUser,
  initialData: prefetchedUser, // Never shows loading skeleton
  // ⚠️ Cache is treated as fresh (staleTime: 0)
})

// placeholderData: Shows while fetching, smooth transitions
// Use when: Switching between items, progressive loading

useQuery({
  queryKey: USER_KEYS.detail(id),
  queryFn: fetchUser,
  placeholderData: keepPreviousData(), // Show previous user while loading next
  // ✅ Still shows loading state, but has fallback data
})

// placeholderData: Static placeholder
useQuery({
  queryKey: USER_KEYS.detail(id),
  queryFn: fetchUser,
  placeholderData: {
    id: 'placeholder',
    name: 'Loading...',
    email: '',
  },
})
```

**Key Differences:**

| Feature | initialData | placeholderData |
|---------|-------------|-----------------|
| Loading state | Never shown | Shown with fallback |
| Cache freshness | Treated as fresh (staleTime: 0) | Respects staleTime |
| Refetch on mount | Yes (if staleTime: 0) | Yes (normal behavior) |
| Use case | Prefetched data | Smooth transitions, skeletons |

---

### Pattern 6: Infinite Queries with Cursor Pagination

**When to Use:** Large datasets with cursor-based pagination

```typescript
// hooks/assets/use-infinite-assets.ts
export function useInfiniteAssets(options: UseInfiniteAssetsOptions = {}) {
  const { query = {} } = options
  const httpClient = useHttp()

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...ASSETS_KEYS.lists(), 'infinite', query],
    queryFn: async ({ pageParam }) => {
      const response = await httpClient.get<AssetListResponse>('/api/assets', {
        params: {
          ...query,
          cursor: pageParam,
          limit: query.pagination?.limit ?? 50,
        },
      })
      return response.data
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasMore
        ? lastPage.pagination.cursor
        : undefined
    },
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      ...data,
      allAssets: data.pages.flatMap((page) => page.assets ?? []),
      totalAssets: data.pages[0]?.aggregations?.totalCount ?? 0,
    }),
  })

  return {
    ...infiniteQuery,
    isLoadingAll: infiniteQuery.isFetching || infiniteQuery.hasNextPage,
    totalFetched: infiniteQuery.data?.allAssets?.length ?? 0,
  }
}
```

**Usage:**
```typescript
function AssetList() {
  const { data, fetchNextPage, hasNextPage, isLoadingAll } = useInfiniteAssets()

  return (
    <div>
      {data?.allAssets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isLoadingAll}
        >
          {isLoadingAll ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

### Pattern 7: Background Refetching (Polling)

**When to Use:** Real-time data that updates frequently

```typescript
// Approach 1: Fixed interval
useQuery({
  queryKey: ['price', symbol],
  queryFn: () => httpClient.get(`/api/prices/${symbol}`).then(r => r.data),
  refetchInterval: 1000, // Every second
})

// Approach 2: Conditional polling based on data
useQuery({
  queryKey: ['job', jobId],
  queryFn: () => httpClient.get(`/api/jobs/${jobId}`).then(r => r.data),
  refetchInterval: (data) => {
    // Poll faster if job is running
    return data?.status === 'running' ? 1000 : false
  },
})

// Approach 3: Continue polling in background
useQuery({
  queryKey: ['notifications'],
  queryFn: () => httpClient.get('/api/notifications').then(r => r.data),
  refetchInterval: 30 * 1000, // Every 30 seconds
  refetchIntervalInBackground: true, // Keep polling when tab is inactive
})
```

---

### Pattern 8: Prefetching for Performance

**When to Use:** You can predict user behavior

```typescript
// Approach 1: Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient()

  const prefetchUser = () => {
    queryClient.prefetchQuery(userOptions(userId))
  }

  return (
    <Link
      to={`/users/${userId}`}
      onMouseEnter={prefetchUser}
    >
      {userId}
    </Link>
  )
}

// Approach 2: Prefetch related data on success
function useUserProfile(userId: string) {
  const queryClient = useQueryClient()

  const { data: user } = useQuery(userOptions(userId))

  useEffect(() => {
    if (user?.organizationId) {
      queryClient.prefetchQuery(orgOptions(user.organizationId))
    }
  }, [user?.organizationId, queryClient])

  return user
}
```

---

### Pattern 9: Query Cancellation

**When to Use:** Long-running requests that might be superseded

```typescript
// TanStack Query provides AbortSignal automatically
useQuery({
  queryKey: ['search', searchTerm],
  queryFn: async ({ signal }) => {
    const response = await httpClient.get<SearchResponse>(`/api/search?q=${searchTerm}`, {
      signal, // Passed to axios/fetch
    })
    return response.data
  },
  staleTime: 5 * 60 * 1000,
})

// Manual cancellation
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: ({ signal }) => httpClient.get(`/api/search?q=${searchTerm}`, { signal }),
    enabled: searchTerm.length > 2,
  })

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      // Previous request is automatically cancelled when searchTerm changes
    />
  )
}
```

---

### Pattern 10: Suspense Integration ⭐ NEW

**When to Use:** You want to leverage React 18's Suspense for better loading states

```typescript
// hooks/users/use-suspense-users.ts
import { useSuspenseQuery } from '@tanstack/react-query'
import { userOptions } from './user-options'

export function useSuspenseUser(id: string) {
  return useSuspenseQuery(userOptions(id))
}

// Usage with Suspense boundary
function UserDetailPage() {
  // Will suspend until data is ready
  const user = useSuspenseUser(userId)

  return <div>{user.name}</div>
}

// Wrap in Suspense boundary
function App() {
  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserDetailPage userId="123" />
    </Suspense>
  )
}
```

**Benefits:**
- Clean separation of loading logic
- Route-level loading states with TanStack Router
- Better UX with intermediate states

**With TanStack Router:**
```typescript
// routes/users.$userId.tsx
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params, context: { queryClient } }) => {
    // Data will be ready before component renders
    return await queryClient.fetchQuery(userOptions(params.userId))
  },
  component: UserDetailComponent,
})

// Component can use useSuspenseQuery - no loading state!
function UserDetailComponent() {
  const user = useSuspenseUser({ userId: Route.useParams().userId })
  return <div>{user.name}</div> // Data is guaranteed to be available
}
```

---

## Real-World Scenarios

### Scenario 1: Real-Time Data with Socket.IO

**Problem:** WebSocket data needs to sync with Query cache

**Solution:** Separate concerns - Socket for real-time, Query for CRUD

```typescript
// Socket updates Zustand store
useDronesStore.getState().updateDroneProperty(droneId, 'battery', 75)

// Query handles API operations
const { data: missions } = useQuery({
  queryKey: MISSION_KEYS.lists(),
  queryFn: () => missionApi.getMissions(),
})
```

**When to Invalidate from Socket Events:**
```typescript
// socket-client.ts
socket.on('mission:created', (newMission) => {
  // Update Zustand store for real-time view
  useMissionsStore.getState().addMission(newMission)

  // Also update Query cache so CRUD operations stay in sync
  queryClient.setQueryData(MISSION_KEYS.lists(), (oldData) => {
    if (!oldData) return [newMission]
    return [...oldData, newMission]
  })
})
```

**Key Points:**
- Socket updates flow through Zustand stores
- Query cache manages REST API responses
- Invalidate queries when socket events modify data
- Each system handles its domain

---

### Scenario 2: Map + Query Cache Synchronization

**Problem:** Optimistic updates need to update both map and cache

**Solution:** Dual-state updates with separate rollback contexts

```typescript
// From: /apps/mission-planner/src/hooks/mission/use-delete-mission.ts
export function useDeleteMission() {
  const { mapInstance, isMapReady } = useMapContext()
  const queryClient = useQueryClient()
  const httpClient = useHttp()

  return useMutation({
    mutationKey: ['delete-mission'],
    mutationFn: async (id: string) => {
      const response = await httpClient.delete<SuccessResponse>(`/api/missions/${id}`)
      return response.data
    },

    onMutate: async (id: string) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: MISSION_KEYS.detail(id) })
      await queryClient.cancelQueries({ queryKey: MISSION_KEYS.lists() })

      const previousMissions = queryClient.getQueryData(MISSION_KEYS.lists())

      // Optimistic map update
      let previousMapVisibility: boolean | null = null
      let mapUpdateSucceeded = false

      try {
        const missionPlannerManager = mapInstance?.getMissionPlannerManager()
        const missionOnMap = missionPlannerManager?.getPlottedLinearMissionView(id)

        if (missionOnMap && isMapReady) {
          previousMapVisibility = missionOnMap.isVisible
          missionOnMap.setVisibility(false)
          mapUpdateSucceeded = true
        }
      } catch (mapError) {
        console.error('Failed to hide mission on map:', mapError)
        // Continue with server delete even if map fails
      }

      // Optimistic cache update
      queryClient.setQueryData(
        MISSION_KEYS.lists(),
        previousMissions.filter((m) => m.id !== id)
      )

      return { previousMissions, previousMapVisibility, mapUpdateSucceeded }
    },

    onError: (error, id, context) => {
      // Rollback map visibility
      if (context?.mapUpdateSucceeded && context?.previousMapVisibility !== null) {
        try {
          const missionPlannerManager = mapInstance?.getMissionPlannerManager()
          const missionOnMap = missionPlannerManager?.getPlottedLinearMissionView(id)
          if (missionOnMap) {
            missionOnMap.setVisibility(context.previousMapVisibility)
          }
        } catch (rollbackError) {
          console.error('Failed to rollback map:', rollbackError)
        }
      }

      // Rollback cache
      if (context?.previousMissions) {
        queryClient.setQueryData(MISSION_KEYS.lists(), context.previousMissions)
      }
    },

    onSuccess: (_, id) => {
      // Remove from map
      const missionPlannerManager = mapInstance?.getMissionPlannerManager()
      missionPlannerManager?.removePlottedLinearMissionView(id)

      // Clean up cache
      queryClient.removeQueries({ queryKey: MISSION_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.lists() })
    },
  })
}
```

---

### Scenario 3: Multi-Application Query Sharing

**Problem:** Multiple apps need to share queries

**Solution:** Shared API modules with consistent query keys

```typescript
// libs/shared/api-modules/drones/hooks/use-missions.ts
// Shared across Mission Planner, Fleet View, Asset Management

export const MISSION_KEYS = {
  all: ['missions'] as const,
  lists: () => [...MISSION_KEYS.all, 'list'] as const,
  detail: (id: string) => [...MISSION_KEYS.all, 'detail', id] as const,
} as const

export const missionOptions = (id?: string) =>
  queryOptions({
    queryKey: id ? MISSION_KEYS.detail(id) : MISSION_KEYS.lists(),
    queryFn: async () => {
      const httpClient = useHttp()
      if (id) {
        const response = await httpClient.get<IMission>(`/api/missions/${id}`)
        return response.data
      }
      const response = await httpClient.get<IMission[]>('/api/missions')
      return response.data
    },
  })

export const useMissionList = () => useQuery(missionOptions())

// Any app can invalidate shared queries
queryClient.invalidateQueries({ queryKey: MISSION_KEYS.all })
// This refetches missions in ALL consuming apps
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using useQuery Directly in Components

**❌ WRONG:**
```typescript
function UserList() {
  const httpClient = useHttp()
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await httpClient.get('/api/users')
      return response.data
    },
  })
}
```

**✅ CORRECT:**
```typescript
// Create custom hook
function useUsers() {
  const httpClient = useHttp()
  return useQuery({
    queryKey: USERS_KEYS.lists(),
    queryFn: async () => {
      const response = await httpClient.get<UserResponse>('/api/users')
      return response.data
    },
  })
}

function UserList() {
  const { data } = useUsers()
}
```

---

### Anti-Pattern 2: Improper Loading State Handling

**❌ WRONG (Shows loading on every refetch):**
```typescript
const { isLoading, data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

if (isLoading) return <LoadingSpinner /> // Jumps to loading on refetch
```

**✅ CORRECT (Show background loading, keep old data):**
```typescript
const { isLoading, data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

// Show initial loading only
if (isLoading && !data) return <LoadingSpinner />

// Show data (stale or fresh)
return <UserList data={data} />
```

---

### Anti-Pattern 3: Data Fetching in useEffect

**❌ WRONG:**
```typescript
useEffect(() => {
  httpClient.get('/api/users').then(setData)
}, [])
```

**✅ CORRECT:**
```typescript
useQuery({
  queryKey: ['users'],
  queryFn: () => httpClient.get('/api/users').then(r => r.data),
})
```

---

### Anti-Pattern 4: Mapping Fetched Data to Zustand/Redux

**❌ WRONG:**
```typescript
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
useEffect(() => {
  if (data) setUsers(data) // Duplicating state!
}, [data])
```

**✅ CORRECT:** Let TanStack Query manage the state directly

---

### Anti-Pattern 5: Query Key Duplication

**❌ WRONG:**
```typescript
// In mission-planner
export const MISSION_KEYS = { lists: () => ['missions'] }

// In shared api-modules
export const MISSION_KEYS = { all: ['missions'] }
// Same data, different keys = cache misses
```

**✅ CORRECT:** Use shared query keys from `libs/shared/api-modules`

---

### Anti-Pattern 6: Missing Query Invalidation

**❌ WRONG:**
```typescript
const mutation = useMutation({
  mutationFn: updateMission,
  onSuccess: () => {
    // No invalidation - UI shows stale data
  },
})
```

**✅ CORRECT:**
```typescript
const mutation = useMutation({
  mutationFn: updateMission,
  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: MISSION_KEYS.lists() })
    queryClient.setQueryData(MISSION_KEYS.detail(variables.id), updatedData)
  },
})
```

---

### Anti-Pattern 7: Using useQuery for Client-Side Filtering ⭐ NEW

**❌ WRONG:**
```typescript
// Creates unnecessary cache entries
const { data: filtered } = useQuery({
  queryKey: FILTERED_MISSIONS_KEY(filter),
  queryFn: () => filterMissions(allMissions, filter),
  enabled: !!allMissions,
})
```

**✅ CORRECT:**
```typescript
// No cache pollution, synchronous
const filtered = useMemo(() => filterMissions(allMissions, filter), [allMissions, filter])
```

---

### Anti-Pattern 8: Not Using mutationKey ⭐ NEW

**❌ WRONG:**
```typescript
const mutation = useMutation({
  mutationFn: updateMission,
  // No mutationKey - hard to debug in DevTools
})
```

**✅ CORRECT:**
```typescript
const mutation = useMutation({
  mutationKey: ['update-mission'], // Shows in DevTools
  mutationFn: updateMission,
})
```

---

## Loading State Patterns

### Understanding Query States

```typescript
const { isLoading, isPending, isFetching, data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

// isLoading: true only on initial fetch (alias for isPending)
// isPending: same as isLoading (v5 preferred name)
// isFetching: true on ANY fetch (initial + refetch + background)
// data: undefined initially, then has value (even if stale)
```

### Loading State Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  Component Mounts                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Is initial fetch? ──YES──► Show loading skeleton       │
│  │                                                           │
│  └─ Has cached data? ──YES──► Show stale data               │
│                                    └─ Background refetch   │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Pattern

```typescript
function UserList() {
  const { isLoading, data, error, refetch } = useUsers()

  // Initial loading state
  if (isLoading && !data) {
    return <UserListSkeleton />
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message="Failed to load users"
        onRetry={() => refetch()}
      />
    )
  }

  // Success state (show data even if stale)
  return (
    <div>
      <UserListItems users={data ?? []} />
      {isLoading && <LoadingSpinner size="sm" />}
    </div>
  )
}
```

---

## Testing Strategies

### Testing Custom Hooks

```typescript
// hooks/users/__tests__/use-users.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsers } from '../use-users'
import { server } from '@mocks/msw/node'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // Disable retries for tests
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Swallow errors in tests
    },
  })

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('useUsers', () => {
  it('should fetch users successfully', async () => {
    const { result } = renderHook(() => useUsers(), { wrapper })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify data
    expect(result.current.data).toEqual(expectedUsers)
  })

  it('should handle errors', async () => {
    server.use(
      http.get('/api/users', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { result } = renderHook(() => useUsers(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })

  it('should handle optimistic updates', async () => {
    const { result } = renderHook(() => useUpdateUser(), { wrapper })

    // Trigger mutation
    act(() => {
      result.current.mutate({ id: '1', data: { name: 'Updated' } })
    })

    // Verify optimistic update happened
    await waitFor(() => {
      expect(result.current.variables).toEqual({ id: '1', data: { name: 'Updated' } })
    })
  })
})
```

---

## Codebase Analysis

### Current State (As of 2026-01-27)

#### ✅ **What We're Doing Well**

1. **Hierarchical Query Keys** - Consistent structure across apps
   - Example: `MISSION_KEYS.all`, `MISSION_KEYS.lists()`, `MISSION_KEYS.detail(id)`

2. **Optimistic Updates** - Proper rollback logic in mission mutations
   - Files: `use-toggle-mission-status.ts`, `use-bulk-operations.ts`

3. **Complex Mutations** - Multi-level cache management
   - File: `use-bulk-operations.ts` handles delete/enable/disable with proper snapshots

4. **Map Integration** - Dual-state updates for map + cache
   - File: `use-delete-mission.ts` handles map visibility separately from cache

5. **Custom Error Classes** - Type-safe error handling
   - Example: `AssetApiError`, `MediaApiError`

#### ⚠️ **Areas Needing Improvement**

1. **Query Key Duplication**
   - `MISSION_KEYS` defined in multiple places with different structures
   - `ASSETS_QUERY_KEYS` vs `ASSET_QUERY_KEYS` inconsistency

2. **Missing Invalidations**
   - Flight operations mutations have NO cache invalidation
   - File: `/libs/shared/api-modules/drones/hooks/use-flight-operations.ts`

3. **Console-Only Error Handling**
   - Many mutations only `console.error` without user feedback
   - No toast notifications or error boundaries

4. **Inconsistent stale Times**
   - Zones: `staleTime: 0` for rarely-changing data
   - Assets: 1 minute vs 5 minutes across different apps

5. **Not Using queryOptions**
   - Missing v5's most important feature for type safety
   - Can't share configs between useQuery and route loaders

6. **Missing mutationKey**
   - Hard to debug mutations in DevTools
   - Can't track specific mutation instances

#### 📋 **Priority Action Items**

**Critical (Must Fix):**
1. Adopt `queryOptions` pattern for all shared queries
2. Fix all examples to use `httpClient` from auth library
3. Add Suspense integration patterns
4. Implement proper retry strategies with exponential backoff

**High Priority:**
5. Consolidate duplicate query keys into shared modules
6. Add invalidations to all flight operation mutations
7. Replace console.error with toast notifications
8. Add mutationKey to all mutations for debugging
9. Set appropriate stale times for static data

**Medium Priority:**
10. Implement server-side filtering for large datasets
11. Abstract optimistic update boilerplate into utilities
12. Add `placeholderData` examples where appropriate

**Low Priority:**
13. Create consistent hook return type interfaces
14. Implement skeleton loading patterns
15. Add proper error boundaries

---

## Summary & Best Practices

### Do's

- ✅ Use `queryOptions` for reusable query configurations
- ✅ Always use `httpClient` from auth library
- ✅ Use hierarchical query keys with `as const`
- ✅ Create custom hooks for all queries/mutations
- ✅ Implement optimistic updates with proper rollback
- ✅ Set appropriate stale times based on data volatility
- ✅ Invalidate queries after mutations
- ✅ Use enabled flag for conditional queries
- ✅ Handle loading states properly (show stale data during refetch)
- ✅ Use select for data transformation
- ✅ Add mutationKey for debugging
- ✅ Use `useMemo` for client-side filtering (NOT useQuery)
- ✅ Implement retry strategies with exponential backoff
- ✅ Use Suspense boundaries for better loading states

### Don'ts

- ❌ Use fetch directly - always use our httpClient
- ❌ Use useQuery directly in components - create custom hooks
- ❌ Use useQuery for client-side filtering - use useMemo
- ❌ Fetch data in useEffect
- ❌ Duplicate query keys across modules
- ❌ Use console.error only - show user feedback
- ❌ Show loading skeleton on every refetch
- ❌ Forget to invalidate queries after mutations
- ❌ Use staleTime: 0 for rarely-changing data
- ❌ Mix server state with client state (use Zustand for UI)
- ❌ Forget mutationKey - makes debugging harder
- ❌ Retry 404s or 401s - they won't succeed
- ❌ Use `initialData` when you mean `placeholderData`

---

## Quick Reference Card

```typescript
// ===== QUERY OPTIONS (v5 Essential) =====
import { queryOptions } from '@tanstack/react-query'
import { useHttp } from '@libs/core/auth-frontend'

export const userOptions = (id: string) =>
  queryOptions({
    queryKey: USERS_KEYS.detail(id),
    queryFn: async () => {
      const httpClient = useHttp()
      const response = await httpClient.get<User>(`/api/users/${id}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })

// Usage
const { data } = useQuery(userOptions(userId))
await queryClient.prefetchQuery(userOptions(userId))

// ===== QUERY WITH HTTP CLIENT =====
const { data, isLoading, error } = useQuery({
  queryKey: USERS_KEYS.lists(),
  queryFn: async () => {
    const httpClient = useHttp()
    const response = await httpClient.get<UserResponse>('/api/users')
    return response.data
  },
  enabled: !!userId,
  staleTime: 5 * 60 * 1000,
})

// ===== MUTATION WITH OPTIMISTIC UPDATE =====
const mutation = useMutation({
  mutationKey: ['update-user'],
  mutationFn: async (data: UpdateUserInput) => {
    const httpClient = useHttp()
    const response = await httpClient.patch<User>('/api/users', data)
    return response.data
  },
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: USERS_KEYS.all })
    const previous = queryClient.getQueryData(USER_KEYS.detail(variables.id))
    queryClient.setQueryData(USER_KEYS.detail(variables.id), optimisticData)
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(USER_KEYS.detail(variables.id), context.previous)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: USERS_KEYS.all })
  },
})

// ===== RETRY WITH BACKOFF =====
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: (failureCount, error) => {
    if (error?.status === 404) return false // Don't retry
    if (error?.status === 429) return failureCount < 5 // Rate limit
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})

// ===== INFINITE QUERY =====
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ASSETS_KEYS.lists(),
  queryFn: ({ pageParam }) => fetchData(pageParam),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

// ===== SUSPENSE QUERY =====
const data = useSuspenseQuery(userOptions(userId))

// ===== PLACEHOLDER DATA =====
useQuery({
  queryKey: USER_KEYS.detail(userId),
  queryFn: fetchUser,
  placeholderData: keepPreviousData(), // Smooth transitions
})

// ===== CLIENT-SIDE FILTERING =====
const filtered = useMemo(
  () => allData.filter(item => item.active),
  [allData]
)
```

---

**Version History:**
- v1.1 (2026-01-27): Added critical fixes - queryOptions, httpClient, Suspense, retry strategies, initialData vs placeholderData
- v1.0 (2026-01-27): Initial comprehensive guide based on codebase analysis and industry best practices

**Related Documents:**
- [Zustand Usage Patterns](/docs/004-references/third-party-library-usage/zustand/zustand-usage-patterns-guide.md)
- [React Hooks Patterns](/docs/001-common/development-standards/react-hooks-patterns-and-best-practices.md)
- [State Management Patterns](/docs/001-common/standards/state-management-patterns.md)
- [REST API Call Standards](/docs/004-references/third-party-library-usage/tanstack-query/rest-api-standards.md)

**Contributors:** Frontend Architecture Team
**Next Review:** Q2 2026
