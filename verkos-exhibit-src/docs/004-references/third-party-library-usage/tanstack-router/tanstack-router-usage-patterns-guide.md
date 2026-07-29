# TanStack Router Usage Patterns Guide

**Version:** 1.1 (Revised)
**Last Updated:** 2026-01-27
**Target Audience:** Mixed team (Junior to Senior React developers)
**TanStack Router Version:** v1.131.x

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Prerequisites](#prerequisites)
3. [Quick Reference](#quick-reference)
4. [Core Concepts](#core-concepts)
5. [Monorepo Configuration](#monorepo-configuration)
6. [File-Based Routing Patterns](#file-based-routing-patterns)
7. [Route Types and When to Use Them](#route-types-and-when-to-use-them)
8. [Navigation Patterns]((#navigation-patterns))
9. [Search Parameters vs Local State](#search-parameters-vs-local-state)
10. [Search Parameters with Zod Validation](#search-parameters-with-zod-validation)
11. [Route Protection and Authentication](#route-protection-and-authentication)
12. [Route Loaders and Data Fetching]((#route-loaders-and-data-fetching))
13. [Error Handling](#error-handling)
14. [Code Splitting and Lazy Loading](#code-splitting-and-lazy-loading)
15. [Type Safety Patterns](#type-safety-patterns)
16. [Performance Optimization](#performance-optimization)
17. [Testing Routes](#testing-routes)
18. [Common Patterns for Complex Scenarios](#common-patterns-for-complex-scenarios)
19. [Anti-Patterns & Troubleshooting](#anti-patterns--troubleshooting)
20. [Real-World Examples from Codebase](#real-world-examples-from-codebase)

---

## Quick Start (5 Minutes)

**Need to create a route right now?** Copy one of these templates:

### Template 1: Simple Route (Most Common)

```typescript
// src/routes/index.tsx → /
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <div>Welcome Home</div>
}
```

### Template 2: Dynamic Route with Params

```typescript
// src/routes/users.$userId.tsx → /users/:userId
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$userId')({
  component: UserProfilePage,
})

function UserProfilePage() {
  const { userId } = Route.useParams()
  return <div>User: {userId}</div>
}
```

### Template 3: Protected Layout Route (Our Standard Pattern)

```typescript
// src/routes/_layout.tsx → Wraps all nested routes
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

// Guard function
const requireAuth = async ({ context }: { context: RouterContext }) => {
  if (!context.auth?.isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

export const Route = createFileRoute('/_layout')({
  // HMR-safe loader with guard
  loader: async (loaderContext) => {
    await createLayoutGuardLoader(requireAuth, router)(loaderContext)
    return { guardsPassed: true }
  },
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <div className="app-layout">
      <Header />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
      <Footer />
    </div>
  )
}
```

**Still not sure which to use?** → [Go to Decision Trees](#quick-start-decision-trees)
**Need something more complex?** → [Browse Pattern Catalog](#pattern-catalog)

---

## Prerequisites

This guide assumes familiarity with:

- ✅ React 18+ (hooks, concurrent features)
- ✅ TypeScript basics (generics, type inference)
- ✅ File-based routing concepts
- ✅ Zod schema validation

**New to these concepts?**
- [React Docs: Hooks](https://react.dev/learn#using-hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev/)
- [TanStack Router Docs](https://tanstack.com/router/latest/docs)

**Quick Glossary:**
- **File-Based Routing** - Route structure defined by file system
- **Layout Route** - Route prefixed with `_` that wraps child routes
- **Route Loader** - Function that runs before route renders to prefetch data
- **Search Params** - URL query parameters with schema validation
- **HMR** - Hot Module Replacement (dev server auto-refresh)
- **Outlet** - Component that renders child routes

---

## Quick Reference

| I need to... | Go to |
|--------------|-------|
| Create my first route | [Quick Start](#quick-start-5-minutes) |
| Configure monorepo routing | [Monorepo Config](#monorepo-configuration) |
| Add dynamic URL parameters | [Dynamic Routes](#dynamic-routes) |
| Protect routes with authentication | [Route Protection](#route-protection-and-authentication) |
| Decide: search params vs local state | [Search vs Local State](#search-parameters-vs-local-state) |
| Validate search parameters | [Search Params](#search-parameters-with-zod-validation) |
| Fetch data before render | [Route Loaders]((#route-loaders-and-data-fetching)) |
| Create nested layouts | [Layout Routes](#layout-routes) |
| Handle route errors | [Error Handling](#error-handling) |
| Navigate programmatically | [Navigation Patterns]((#navigation-patterns)) |
| Optimize route performance | [Performance](#performance-optimization) |
| Test routes | [Testing Routes](#testing-routes) |

---

## Core Concepts

TanStack Router is a **type-safe, file-based routing solution** for React that provides:

### Key Features

- **100% TypeScript Inference** - All params, search, and loaders are auto-typed
- **File-Based Routing** - File structure determines URL structure
- **Built-in Data Prefetching** - Route loaders warm TanStack Query cache
- **Search Param Validation** - Zod schemas for type-safe query params
- **Automatic Code Splitting** - Each route is a separate chunk
- **Route Protection** - HMR-safe guard functions for authentication

### How It Works

```
File Structure                          → URL Structure
src/routes/
├── __root.tsx                          → (root layout)
├── index.tsx                           → /
├── _layout.tsx                         → (protected layout wrapper)
├── _layout/
│   ├── index.tsx                       → / (protected home)
│   ├── users.tsx                       → /users
│   └── users/
│       ├── index.tsx                   → /users
│       └── $userId.tsx                 → /users/:userId
├── login.tsx                           → /login (public)
└── signup.tsx                          → /signup (public)
```

### Our Monorepo Standard

```
All apps use the SAME routing pattern:

src/routes/
├── __root.tsx           # Global layout (all apps)
├── _layout.tsx          # Protected layout wrapper (all apps)
├── _layout/             # All protected routes (auth required)
│   ├── index.tsx        # Default protected route
│   └── [feature routes]
└── [public routes]      # login.tsx, signup.tsx, etc.

NOT USED: _authenticated/ directory pattern
(That's a TanStack Router example we don't follow)
```

---

## Monorepo Configuration

### Base Path Configuration (REQUIRED)

All applications in the monorepo **MUST** configure base path:

```typescript
// apps/[app-name]/src/router.ts
import { createRouter } from '@tanstack/react-router'

export const router = createRouter({
  routeTree,
  basepath: '/[app-name]', // REQUIRED for monorepo routing
  context: {
    queryClient,
  },
})
```

**Available Base Paths:**
| Application | Base Path | Port |
|-------------|-----------|------|
| **Fleet** | `/fleet` | 4007 |
| **Mission Planner** | `/mission-planner` | 4008 |
| **Asset Management** | `/asset-management` | 4009 |

**Why This Matters:**
- Prevents route conflicts between apps
- Enables nginx/Traefik routing to correct app
- Allows mounting apps at subpaths in production
- Critical for micro-frontend architecture

---

### Dynamic Auth Context Injection

TanStack Router requires context at creation time, but auth context isn't available until login. We solve this with dynamic injection:

```typescript
// apps/[app-name]/src/router.ts
export const router = createRouter({
  routeTree,
  basepath: '/[app-name]',
  context: {
    queryClient,
    // auth and httpClient injected later
  },
})

// Called after user logs in
export const setRouterAuthContext = (
  auth: AuthContextType,
  httpClient: AxiosInstance
) => {
  router.context = {
    ...router.context,
    auth,
    httpClient,
  }
}
```

**Usage in App.tsx:**
```typescript
useEffect(() => {
  if (isAuthenticated && authContext && httpClient) {
    setRouterAuthContext(authContext, httpClient)
  }
}, [isAuthenticated, authContext, httpClient])
```

**Gotcha:** Routes that need auth BEFORE `setRouterAuthContext` is called will have undefined auth. That's why guards use optional chaining: `context.auth?.isAuthenticated`

---

## File-Based Routing Patterns

### Route File Naming Conventions

| Pattern | File Name | URL Path | Description |
|---------|-----------|----------|-------------|
| **Root Route** | `__root.tsx` | - | Wraps all routes |
| **Layout Route** | `_layout.tsx` | - | Wraps nested routes, no URL segment |
| **Index Route** | `index.tsx` | `/` | Matches parent path exactly |
| **Dynamic Route** | `$param.tsx` | `/:param` | Dynamic parameter |
| **Nested Index** | `_layout/index.tsx` | `/` | Index inside layout |
| **Nested Layout** | `_layout/feature.route.tsx` | `/feature` | Layout for nested routes |
| **Splat Route** | `$.tsx` | `/*` | Catch-all routes |

### Our Monorepo File Organization

```
src/routes/
├── __root.tsx                    # Root layout (REQUIRED)
├── _layout.tsx                   # Protected layout wrapper (REQUIRED)
├── index.tsx                     # Home page redirect (optional)
├── login.tsx                     # Public auth route
├── signup.tsx                    # Public auth route
├── _layout/                      # Protected routes (auth required)
│   ├── index.tsx                 # Dashboard/home
│   ├── users.tsx                 # Users list
│   ├── users/
│   │   ├── index.tsx             # Users list (alternative)
│   │   └── $userId.tsx           # User detail
│   └── settings/
│       ├── index.tsx             # Settings home
│       └── profile.tsx           # Profile settings
```

**Important Notes:**
- We use `_layout.tsx` at root (NOT `_authenticated/` directory)
- All protected routes go under `_layout/`
- Public routes (login, signup) go at root level

### Decision Tree: How to Organize Routes?

```
START: Creating a new route
│
├─ Is this a public route (login, signup)?
│  └─ YES → Place at root: login.tsx, signup.tsx
│
├─ Does it need authentication?
│  └─ YES → Place under _layout/ directory
│
├─ Is it a detail page with params?
│  └─ YES → Use $param.tsx: _layout/users.$userId.tsx
│
├─ Does it share UI with sibling routes?
│  └─ YES → Create _layout/ directory with .route.tsx wrapper
│
└─ Simple protected page?
   └─ YES → Place at _layout/ level: _layout/dashboard.tsx
```

---

## Route Types and When to Use Them

### Quick Start Decision Trees

#### Decision Tree 1: What Route Type Do I Need?

```
START: Creating a route
│
├─ Need to wrap multiple routes with shared UI?
│  └─ YES → Layout Route (_layout.tsx)
│
├─ Need dynamic data from URL?
│  └─ YES → Dynamic Route ($param.tsx)
│
├─ Default page for a section?
│  └─ YES → Index Route (index.tsx)
│
├─ Authentication required?
│  └─ YES → Protected Layout (_layout/ directory)
│
└─ Simple standalone page?
   └─ YES → Basic Route (name.tsx at root or _layout/)
```

---

### Pattern Catalog

#### Pattern 1: Basic Route

**Complexity:** 🟢 Beginner
**Use Case:** Simple standalone pages

```typescript
// src/routes/about.tsx → /about
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About Us</div>
}
```

**When to Use:**
- Public pages (about, contact, pricing)
- Simple informational pages
- No dynamic data or authentication needed

**Real Example:** `apps/fleet/src/routes/login.tsx`

---

#### Pattern 2: Dynamic Route

**Complexity:** 🟢 Beginner
**Use Case:** Detail pages with dynamic parameters

```typescript
// src/routes/_layout/assets.$assetId.tsx → /assets/:assetId
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/assets/$assetId')({
  component: AssetDetailPage,
})

function AssetDetailPage() {
  const { assetId } = Route.useParams()

  return (
    <div>
      <h1>Asset: {assetId}</h1>
      {/* assetId is typed as string */}
    </div>
  )
}
```

**Key Techniques:**
- Use `$` prefix for dynamic segments
- `Route.useParams()` provides typed params
- Works with multiple params: `$orgId/$projectId`

**Real Example:** `apps/asset-management/src/routes/_layout/assets/details.$assetId.tsx`

---

#### Pattern 3: Layout Route (Protected)

**Complexity:** 🟡 Intermediate
**Use Case:** Shared UI across multiple authenticated routes

```typescript
// src/routes/_layout.tsx → Layout wrapper (no URL segment)
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

const requireAuth = async ({ context }) => {
  if (!context.auth?.isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

export const Route = createFileRoute('/_layout')({
  loader: async (loaderContext) => {
    await createLayoutGuardLoader(requireAuth, router)(loaderContext)
    return { guardsPassed: true }
  },
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <div className="app-layout">
      <Header />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
      <Footer />
    </div>
  )
}
```

**Key Features:**
- `_` prefix means no URL segment added
- Wraps all nested routes
- Persists during child navigation
- `<Outlet />` renders matched child route
- HMR-safe guard loader

**Real Example:** All three apps use `_layout.tsx` for authenticated layout

---

#### Pattern 4: Index Route

**Complexity:** 🟢 Beginner
**Use Case:** Default page for a route segment

```typescript
// src/routes/_layout/index.tsx → / (when using _layout)
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/')({
  component: DashboardHome,
})

function DashboardHome() {
  return <div>Dashboard Home</div>
}
```

**When to Use:**
- Default view for a directory
- Home page for a section
- Parent route's default child

**Real Example:** All apps use `_layout/index.tsx` as protected home

---

#### Pattern 5: Nested Layout Route

**Complexity:** 🟡 Intermediate
**Use Case:** Feature-specific layouts within protected area

```typescript
// src/routes/_layout/missions.route.tsx → /missions layout wrapper
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/missions')({
  component: MissionsLayout,
})

function MissionsLayout() {
  return (
    <div className="missions-layout">
      <MissionsSidebar />
      <Outlet />
    </div>
  )
}
```

**Naming Convention:** Use `.route.tsx` suffix for layout wrappers within nested routes.

**Real Example:** `apps/mission-planner/src/routes/_layout/missions.route.tsx`

---

## Navigation Patterns

### Four Type-Safe Navigation Approaches

#### 1. Link Component (For Navigation Menus)

```typescript
import { Link } from '@tanstack/react-router'

// Basic navigation
<Link to="/users">Users</Link>

// With params
<Link to="/users/$userId" params={{ userId: '123' }}>
  View User
</Link>

// With search params
<Link
  to="/assets"
  search={{ tab: 'gallery', page: 2 }}
>
  Assets
</Link>

// Active state styling
<Link
  to="/missions"
  className={({ isActive }) =>
    isActive ? 'text-blue-500' : 'text-gray-500'
  }
>
  Missions
</Link>

// Prefetch on hover
<Link
  to="/dashboard"
  preload="intent"
  prefetch="intent"
>
  Dashboard
</Link>
```

**When to Use:**
- Sidebar and navigation menus
- SEO-critical links
- User-initiated navigation
- Benefits: proper `<a>` tag, CMD+click works, accessible

---

#### 2. useNavigate Hook (Programmatic)

```typescript
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    // Basic navigation
    navigate({ to: '/users' })

    // With params
    navigate({
      to: '/users/$userId',
      params: { userId: '123' },
    })

    // With search params
    navigate({
      to: '/assets',
      search: { tab: 'overview' },
    })

    // Relative navigation
    navigate({ to: '..' }) // Go up one level
    navigate({ to: '../sibling' })

    // Replace instead of push
    navigate({
      to: '/login',
      replace: true,
    })
  }

  return <button onClick={handleClick}>Go</button>
}
```

**When to Use:**
- After form submissions
- Conditional navigation
- Based on state changes
- In event handlers

---

### Our Codebase Navigation Patterns

**How Different Apps Navigate:**

| App | Link Usage | useNavigate Usage | Notes |
|-----|-----------|-------------------|-------|
| **Fleet** | Minimal (sidebars) | Heavy (actions) | Action-oriented dashboard |
| **Mission Planner** | Medium | Medium | Balanced approach |
| **Asset Management** | Medium | Medium | Tab-heavy navigation |

**Why the Difference?**
- **Fleet**: Operations dashboard where most navigation is triggered by actions (select asset, click map marker)
- **Mission Planner**: Mix of menu navigation and action-based navigation
- **Asset Management**: Tab-based navigation with shareable URLs

**Recommendation:** Follow the pattern of the app you're working in, not generic best practices.

---

### Active Route Detection

```typescript
import { useMatches, Link } from '@tanstack/react-router'

function Navigation() {
  const matches = useMatches()

  const isActive = (path: string) => {
    return matches.some((m) => m.pathname.startsWith(path))
  }

  return (
    <nav>
      <Link
        to="/missions"
        className={() =>
          isActive('/missions') ? 'active' : ''
        }
      >
        Missions
      </Link>
    </nav>
  )
}
```

**Real Example:** `apps/fleet/src/app/components/fleet-header/FleetHeader.tsx`

---

## Search Parameters vs Local State

### Decision Matrix

| Criteria | Use Search Params | Use Local State |
|----------|-------------------|-----------------|
| Shareable URL needed | ✅ Yes | ❌ No |
| Browser back/forward support | ✅ Yes | ❌ No |
| Persist across page reloads | ✅ Yes | ❌ No |
| Complex nested objects | ❌ No (URL limit) | ✅ Yes |
| Rapid updates (<100ms) | ❌ No (URL thrash) | ✅ Yes |
| Temporary UI state | ❌ No | ✅ Yes |
| Filter/query state | ✅ Yes | ⚠️ Maybe |
| Tab navigation | ✅ Yes | ⚠️ Maybe |
| Form validation errors | ⚠️ Maybe | ✅ Yes |
| Modal state | ⚠️ Maybe | ✅ Yes |

---

### Search Params Adoption Across Apps

| App | Search Params Usage | Examples | Rationale |
|-----|---------------------|----------|-----------|
| **Asset Management** | Extensive | Tab navigation, filters | Shareable URLs for assets |
| **Mission Planner** | None | Uses local state | Complex mission state doesn't fit in URL |
| **Fleet** | Minimal | Uses local state | Real-time updates make URL state less relevant |

**Why the Difference?**
- **Asset Management**: Needs shareable URLs - users email asset links, browser back/forward through tabs
- **Mission Planner**: Mission state is too complex for URL (waypoints, coordinates, metadata)
- **Fleet**: Real-time telemetry updates would cause excessive URL updates

---

### When to Use Each Pattern

#### Use Search Params When:
```typescript
// ✅ GOOD: Shareable state
const tabSchema = z.object({
  tab: z.enum(['overview', 'details', 'settings']).default('overview')
})

// ✅ GOOD: Filter state
const filterSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

// ✅ GOOD: Pagination
const paginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
})
```

#### Use Local State When:
```typescript
// ✅ GOOD: Temporary UI state
const [isModalOpen, setIsModalOpen] = useState(false)
const [hoveredItem, setHoveredItem] = useState(null)

// ✅ GOOD: Complex objects
const [mission, setMission] = useState({
  waypoints: [],
  metadata: {},
  settings: {},
})

// ✅ GOOD: Rapid updates
const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
```

---

## Search Parameters with Zod Validation

### Basic Search Param Pattern

```typescript
// src/routes/_layout/assets.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'

// Define search schema
const assetSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  query: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
})

export const Route = createFileRoute('/_layout/assets')({
  validateSearch: assetSearchSchema,
  component: AssetsList,
})

function AssetsList() {
  // Types are automatically inferred!
  const search = Route.useSearch()
  const navigate = useNavigate()

  // search.page: number
  // search.limit: number
  // search.query: string | undefined
  // search.status: 'active' | 'inactive' | 'all' | undefined

  return (
    <div>
      <input
        value={search.query || ''}
        onChange={(e) =>
          navigate({
            to: '.',
            search: (prev) => ({ ...prev, query: e.target.value }),
          })
        }
      />
    </div>
  )
}
```

---

### Advanced Search Param Patterns

#### Pattern 1: Tab-Based Navigation with Search Params

```typescript
// src/routes/_layout/assets/details.$assetId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'

const assetDetailsSearchSchema = z.object({
  tab: z.enum(['overview', 'gallery', 'inspection-logs'])
    .optional()
    .default('overview'),
  inspectionLogId: z.string().optional(),
})

export const Route = createFileRoute('/_layout/assets/details/$assetId')({
  validateSearch: assetDetailsSearchSchema,
  component: AssetDetailPage,
})

function AssetDetailPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate()

  return (
    <div>
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({
            to: '.',
            search: (prev) => ({ ...prev, tab: value as typeof prev.tab }),
          })
        }
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="inspection-logs">Logs</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
```

**Real Example:** `apps/asset-management/src/routes/_layout/assets/details.$assetId.tsx`

**Benefits:**
- Shareable URLs: `/assets/123?tab=gallery`
- Browser back/forward works through tabs
- Deep linking to specific tabs

---

#### Pattern 2: Updating Search Params Functionally

```typescript
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  // Update specific params while preserving others
  const nextPage = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, page: prev.page + 1 }),
    })
  }

  // Clear specific params
  const clearFilters = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, query: undefined }),
    })
  }

  // Reset to defaults
  const resetFilters = () => {
    navigate({
      to: '.',
      search: {}, // Resets to schema defaults
    })
  }
}
```

---

## Route Protection and Authentication

### Why HMR-Safe Guard Loaders?

**Problem:** During Hot Module Replacement (HMR), the router reference can become stale, causing "Cannot read property of undefined" errors when guards try to access it.

**Solution:** `createLayoutGuardLoader` lazily accesses the router at runtime instead of capturing it at definition time.

**Without HMR-safe loader:**
```typescript
// ❌ Captures router at definition time (stale after HMR)
loader: async (ctx) => {
  await requireAuth(ctx) // Internal router reference may be stale
}
```

**With HMR-safe loader:**
```typescript
// ✅ Accesses router at runtime (always fresh)
loader: async (ctx) => {
  await createLayoutGuardLoader(guard, router)(ctx)
}
```

---

### Multi-Guard Pattern (Our Standard)

**All three apps use this identical pattern:**

```typescript
// src/routes/_layout.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

// Individual guard functions
const requireAuth = async ({ context }: { context: RouterContext }) => {
  if (!context.auth?.isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

const requireOrg = async ({ context }: { context: RouterContext }) => {
  const org = await fetchOrganization(context.httpClient)
  if (!org) {
    throw redirect({ to: '/no-organization' })
  }
}

const requireSiteAccess = async ({ context }: { context: RouterContext }) => {
  const hasAccess = await checkSiteAccess(context.httpClient)
  if (!hasAccess) {
    throw redirect({ to: '/no-sites' })
  }
}

// Combine guards
const layoutGuard = async (context: any) => {
  await requireAuth(context)
  await requireOrg(context)
  await requireSiteAccess(context)
}

// HMR-safe loader with caching
export const Route = createFileRoute('/_layout')({
  loader: async (loaderContext) => {
    await createLayoutGuardLoader(layoutGuard, router)(loaderContext)
    return { guardsPassed: true, timestamp: Date.now() }
  },
  staleTime: 30 * 60 * 1000, // 30 minutes cache
  gcTime: 30 * 60 * 1000,
  shouldReload: false,
  component: LayoutComponent,
})
```

**Key Features:**
- Sequential guard execution (auth → org → site)
- HMR-safe loader
- 30-minute cache (prevents repeated API calls)
- Feature flag integration

**Real Example:** All three apps use this pattern in `_layout.tsx`

---

### Feature-Flagged Routes

Route-level feature gates for gradual rollouts:

```typescript
// Feature flag guard
const requireFeature = async (
  context: RouterContext,
  feature: FeatureFlag
) => {
  const hasAccess = await checkFeatureFlag(context.httpClient, feature)
  if (!hasAccess) {
    throw redirect({ to: '/feature-not-available' })
  }
}

// Usage with feature flag
export const Route = createFileRoute('/_layout/experimental')({
  loader: async (loaderContext) => {
    await createLayoutGuardLoader(
      (context) => requireFeature(context, FeatureFlag.ExperimentalUI),
      router
    )(loaderContext)
    return { featureAccessGranted: true }
  },
  component: ExperimentalFeature,
})
```

**Real Example:** Fleet uses `FeatureFlag.FleetV2` to gradually roll out the new Fleet interface.

---

### Permission-Based Guards

```typescript
// Guard factory with permission check
const createPermissionGuard = (permission: string) => {
  return async ({ context }: { context: RouterContext }) => {
    const hasPermission = await checkPermission(context.httpClient, permission)
    if (!hasPermission) {
      throw redirect({ to: '/forbidden' })
    }
  }
}

// Usage
export const Route = createFileRoute('/_layout/settings')({
  beforeLoad: createPermissionGuard('settings:write'),
  component: SettingsPage,
})
```

---

## Route Loaders and Data Fetching

### Our Standard Pattern: Prefetch into TanStack Query

**Key Principle:** Loaders are for **prefetching into TanStack Query cache**, NOT direct data fetching.

```typescript
// src/routes/_layout/assets/details.$assetId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/assets/details/$assetId')({
  loader: async ({ params, context }) => {
    const { assetId } = params

    // Prefetch data into TanStack Query cache
    await context.queryClient.ensureQueryData({
      queryKey: ['asset', assetId],
      queryFn: () => fetchAsset(assetId),
    })

    // Return only params, not data
    return { assetId }
  },
  component: AssetDetailPage,
})

function AssetDetailPage() {
  const { assetId } = Route.useLoaderData()

  // Data is already cached, loads instantly
  const { data: asset } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAsset(assetId),
  })

  return <div>{asset?.name}</div>
}
```

**Why This Pattern?**
- TanStack Query handles caching, retries, invalidation
- Components use familiar `useQuery` hooks
- Loader only warms the cache for faster initial render
- Data stays fresh with Query's background refetch
- Single source of truth for data fetching

**NOT Recommended:** Returning data directly from loader

---

### Parallel Data Prefetching

```typescript
loader: async ({ params, context }) => {
  const { userId } = params

  // Prefetch multiple queries in parallel
  await Promise.all([
    context.queryClient.ensureQueryData({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
    }),
    context.queryClient.ensureQueryData({
      queryKey: ['user-posts', userId],
      queryFn: () => fetchUserPosts(userId),
    }),
    context.queryClient.ensureQueryData({
      queryKey: ['user-comments', userId],
      queryFn: () => fetchUserComments(userId),
    }),
  ])

  return { userId }
},
```

---

### Loader Error Handling

```typescript
loader: async ({ params, context }) => {
  try {
    await context.queryClient.ensureQueryData({
      queryKey: ['asset', params.assetId],
      queryFn: async () => {
        const asset = await fetchAsset(params.assetId)
        if (!asset) {
          throw new Error('Asset not found')
        }
        return asset
      },
    })
    return { assetId: params.assetId }
  } catch (error) {
    // Redirect on error
    throw redirect({
      to: '/_layout/assets',
      replace: true
    })
  }
},
```

---

### Loader Caching Strategy

```typescript
export const Route = createFileRoute('/_layout/users')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: () => fetchUsers(),
    })
    return {}
  },

  // Cache guard results for 5 minutes
  staleTime: 5 * 60 * 1000,
  // Keep in memory for 10 minutes
  gcTime: 10 * 60 * 1000,
  // Don't reload on navigation
  shouldReload: false,
})
```

---

## Error Handling

### Route-Level Error Component

```typescript
// src/routes/_layout/assets/details.$assetId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/assets/details/$assetId')({
  loader: async ({ params, context }) => {
    const asset = await fetchAsset(params.assetId)
    if (!asset) {
      throw new Error('Asset not found')
    }
    return { asset }
  },

  errorComponent: ({ error }: { error: Error }) => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2>Asset Not Found</h2>
        <p>{error.message}</p>
        <Link to="/_layout/assets">Back to Assets</Link>
      </div>
    </div>
  ),

  component: AssetDetailPage,
})
```

---

### Global Error Boundary

```typescript
// src/router.ts
const router = createRouter({
  routeTree,
  defaultErrorComponent: ({ error }: { error: Error }) => (
    <ErrorPage error={error} />
  ),
})

// src/App.tsx
import { FBErrorBoundary } from '@libs/shared/errors'

function App() {
  return (
    <FBErrorBoundary environment={environment}>
      <RouterProvider router={router} />
    </FBErrorBoundary>
  )
}
```

**Real Example:** All apps use `FBErrorBoundary` in `App.tsx`

---

### Pending Component (Loading State)

```typescript
// src/routes/__root.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
  pendingComponent: () => <LoadingScreen />,
  notFoundComponent: () => <Navigate to="/_layout" replace />,
})
```

**Real Example:** All apps use `pendingComponent` in `__root.tsx`

---

## Code Splitting and Lazy Loading

### Our Configuration: Manual Control

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    react(),
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      autoCodeSplitting: false, // Manual control
    }),
  ],
})
```

**Why Manual Control?**
- Vite's manual chunk splitting gives better bundle optimization
- Prevents duplicate vendor chunks
- Allows shared dependencies to be properly extracted
- More configuration effort for better bundle sizes

**For most apps:** Keep `autoCodeSplitting: false` and let Vite handle chunks.

---

### Lazy Loading Components Within Routes

```typescript
import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

const HeavyChart = lazy(() => import('./components/HeavyChart'))

export const Route = createFileRoute('/_layout/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  )
}
```

---

## Type Safety Patterns

### Automatic Type Inference

```typescript
// Types are automatically inferred from route definition
export const Route = createFileRoute('/_layout/users/$userId')({
  validateSearch: z.object({
    tab: z.enum(['posts', 'comments']).default('posts'),
  }),
  component: UserProfile,
})

function UserProfile() {
  // All types are inferred automatically
  const { userId } = Route.useParams() // string
  const { tab } = Route.useSearch() // 'posts' | 'comments'
  const data = Route.useLoaderData() // { userId: string }
}
```

---

### Router Context Typing

```typescript
// src/router.ts
import { createRouter } from '@tanstack/react-router'

// Module augmentation for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface RouterContext {
    queryClient: QueryClient
    auth?: AuthContextType
    httpClient?: AxiosInstance
  }
}

export const router = createRouter({
  routeTree,
  basepath: '/[app-name]',
  context: {
    queryClient,
  },
})

// Usage in route
function MyComponent() {
  const { auth, httpClient } = Route.useRouteContext()
  // auth: AuthContextType | undefined
  // httpClient: AxiosInstance | undefined
}
```

**Real Example:** All apps use this pattern in `router.ts`

---

### Type-Safe Navigation

```typescript
import { useNavigate } from '@tanstack/react-router'

// Navigate with full type safety
const navigate = useNavigate()

navigate({
  to: '/_layout/users/$userId',
  params: { userId: '123' }, // Type-checked!
  search: { tab: 'posts' }, // Type-checked!
})

// TypeScript will error if:
// - Param doesn't match route definition
// - Search param doesn't match Zod schema
// - Route doesn't exist
```

---

## Performance Optimization

### Prefetching Strategies

#### Intent-Based Prefetching (Recommended)

```typescript
<Link
  to="/_layout/dashboard"
  preload="intent"  // Prefetch on hover/focus
  prefetch="intent"
>
  Dashboard
</Link>
```

#### Manual Prefetching

```typescript
import { useRouter } from '@tanstack/react-router'

function Navigation() {
  const router = useRouter()

  const handleMouseEnter = () => {
    router.preloadRoute({
      to: '/_layout/dashboard',
    })
  }

  return (
    <Link onMouseEnter={handleMouseEnter} to="/_layout/dashboard">
      Dashboard
    </Link>
  )
}
```

---

### Loader Caching

```typescript
export const Route = createFileRoute('/_layout/users')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: () => fetchUsers(),
    })
    return {}
  },

  // Don't refetch for 5 minutes
  staleTime: 5 * 60 * 1000,
  // Keep in cache for 10 minutes
  gcTime: 10 * 60 * 1000,
  // Don't reload on navigation
  shouldReload: false,
})
```

---

### Structural Sharing

TanStack Router automatically uses structural sharing for loader data:

```typescript
loader: async () => {
  return {
    users: [...users], // New array
    posts: [...posts], // New array
  }
}

// If only 'users' changes, 'posts' reference stays the same
// Components using 'posts' won't re-render
```

---

## Testing Routes

### Test Setup: Router Mocking

```typescript
// __mocks__/@tanstack/react-router.ts
import { vi } from 'vitest'

export const mockNavigate = vi.fn()
export const mockUseParams = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams,
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
```

---

### Unit Testing Navigation

```typescript
import { render, screen } from '@testing-library/react'
import { createMemoryHistory } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'

test('navigates to user profile', async () => {
  const history = createMemoryHistory({
    initialEntries: ['/users'],
  })

  render(<RouterProvider router={router} history={history} />)

  const link = screen.getByText('View Profile')
  await userEvent.click(link)

  expect(history.location.pathname).toBe('/users/123')
})
```

---

### Testing Route Guards

```typescript
test('redirects unauthenticated users', async () => {
  const authContext = { isAuthenticated: false }

  await expect(
    createLayoutGuardLoader(
      requireAuth,
      router
    )({ context: { auth: authContext } })
  ).rejects.toThrow()
})
```

---

### Integration Testing with Playwright

```typescript
test('full navigation flow', async ({ page }) => {
  await page.goto('/')

  await page.click('text=Login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/_layout')
})
```

---

## Common Patterns for Complex Scenarios

### Pattern 1: Modal Routes with Search Params

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'

// Use search params for modal state
const modalSchema = z.object({
  modal: z.enum(['edit', 'delete', 'share']).optional(),
  itemId: z.string().optional(),
})

export const Route = createFileRoute('/_layout/items')({
  validateSearch: modalSchema,
  component: ItemsPage,
})

function ItemsPage() {
  const { modal, itemId } = Route.useSearch()
  const navigate = useNavigate()

  const openEditModal = (id: string) => {
    navigate({
      to: '.',
      search: { modal: 'edit', itemId: id },
    })
  }

  const closeModal = () => {
    navigate({
      to: '.',
      search: { modal: undefined, itemId: undefined },
    })
  }

  return (
    <>
      <ItemList onEdit={openEditModal} />

      {modal === 'edit' && (
        <EditModal itemId={itemId} onClose={closeModal} />
      )}
    </>
  )
}
```

---

### Pattern 2: Context Sharing Across Routes

```typescript
// Define context at router level
const router = createRouter({
  routeTree,
  basepath: '/[app-name]',
  context: {
    auth: authService,
    api: apiClient,
    queryClient: queryClient,
  },
})

// Access in any route
function MyComponent() {
  const { auth, api, queryClient } = Route.useRouteContext()

  useEffect(() => {
    // Use shared context
    api.get('/users')
  }, [api])
}
```

**Real Example:** All apps share QueryClient, Auth, and HttpClient via router context

---

## Anti-Patterns & Troubleshooting

### Anti-Pattern 1: Fetching Data in Components

#### ❌ WRONG

```typescript
function UserProfile() {
  const { userId } = Route.useParams()

  useEffect(() => {
    fetchUser(userId) // Waterfall!
  }, [userId])

  return <div>{/* ... */}</div>
}
```

**Problems:**
- Component renders before data loads
- Waterfall: render → effect → fetch → re-render
- No caching

#### ✅ CORRECT

```typescript
export const Route = createFileRoute('/_layout/users/$userId')({
  loader: async ({ params, context }) => {
    // Prefetch into TanStack Query cache
    await context.queryClient.ensureQueryData({
      queryKey: ['user', params.userId],
      queryFn: () => fetchUser(params.userId),
    })
    return { userId: params.userId }
  },
  component: UserProfile,
})

function UserProfile() {
  const { userId } = Route.useLoaderData()

  // Data already cached, loads instantly
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  return <div>{user?.name}</div>
}
```

---

### Anti-Pattern 2: Ignoring Type Safety

#### ❌ WRONG

```typescript
const params = useParams() as any // Bypasses types
const search = new URLSearchParams(location.search) // Manual parsing
```

**Problems:**
- No type safety
- No autocomplete
- Runtime errors

#### ✅ CORRECT

```typescript
const { userId } = Route.useParams() // Fully typed
const { tab, page } = Route.useSearch() // Fully typed
```

---

### Anti-Pattern 3: Navigation in useEffect Without Dependencies

#### ❌ WRONG

```typescript
useEffect(() => {
  if (!isAuthenticated) {
    navigate({ to: '/login' })
  }
}, []) // Missing isAuthenticated dependency
```

#### ✅ CORRECT

```typescript
// Use beforeLoad in route definition
export const Route = createFileRoute('/_layout')({
  loader: async (loaderContext) => {
    await createLayoutGuardLoader(requireAuth, router)(loaderContext)
    return { authenticated: true }
  },
})
```

---

### Troubleshooting: Routes Not Matching

**Problem:** Route file not being recognized

**Solutions:**
1. Check file naming: `__root.tsx` not `_root.tsx`
2. Check route tree generation: Run `npm run dev` to regenerate `routeTree.gen.ts`
3. Clear cache: Delete `.tanstack` directory
4. Check Vite plugin configuration

---

### Troubleshooting: Types Not Inferred

**Problem:** `Route.useParams()` returns `any`

**Solutions:**
1. Ensure `routeTree.gen.ts` is up to date
2. Check route file exports: `export const Route = createFileRoute(...)`
3. Restart TypeScript server
4. Check `tsconfig.json` paths configuration

---

### Troubleshooting: Base Path Issues

**Problem:** Routes not matching in monorepo

**Solutions:**
1. Verify `basepath` matches app name (e.g., `/fleet`)
2. Check nginx/Traefik configuration
3. Verify port mapping in package.json scripts
4. Check for conflicting routes between apps

---

## Real-World Examples from Codebase

### Example 1: Fleet Application Router Setup

**File:** `apps/fleet/src/router.ts`

```typescript
import { createRouter } from '@tanstack/react-router'

export const router = createRouter({
  routeTree,
  basepath: '/fleet',
  context: {
    queryClient,
  },
})

// Dynamic auth context update
export const setRouterAuthContext = (
  auth: AuthContextType,
  httpClient: AxiosInstance
) => {
  router.context = {
    ...router.context,
    auth,
    httpClient,
  }
}
```

**Key Features:**
- Base path for monorepo routing
- Dynamic auth context injection
- QueryClient integration

---

### Example 2: Protected Layout with Guards

**Files:**
- `apps/fleet/src/routes/_layout.tsx`
- `apps/mission-planner/src/routes/_layout.tsx`
- `apps/asset-management/src/routes/_layout.tsx`

**Pattern:** All three apps use identical guard pattern

```typescript
const layoutGuard = combineGuardFunctions(
  requireAuth,
  requireOrg,
  async (context) => requireFeature(context, FeatureFlag.FleetV2),
  requireSiteAccess
)

export const Route = createFileRoute('/_layout')({
  loader: async (loaderContext) => {
    await createLayoutGuardLoader(layoutGuard, router)(loaderContext)
    return { guardsPassed: true, timestamp: Date.now() }
  },
  staleTime: 30 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  shouldReload: false,
})
```

**Key Features:**
- Sequential guard execution
- HMR-safe loader
- 30-minute cache
- Feature flag integration

---

### Example 3: Tab Navigation with Search Params

**File:** `apps/asset-management/src/routes/_layout/assets/details.$assetId.tsx`

```typescript
const assetDetailsSearchSchema = z.object({
  tab: z.enum(['overview', 'gallery', 'inspection-logs'])
    .optional()
    .default('overview'),
  inspectionLogId: z.string().optional(),
})

export const Route = createFileRoute('/_layout/assets/details/$assetId')({
  validateSearch: assetDetailsSearchSchema,
  component: AssetDetailPage,
})
```

**Key Features:**
- Zod validation for search params
- Default values
- Tab state synchronized with URL
- Shareable URLs for specific tabs

---

### Example 4: Nested Mission Routes

**File:** `apps/mission-planner/src/routes/_layout/missions/`

**Structure:**
```
missions/
├── index.tsx                    → /missions
├── grid/$missionId.tsx          → /missions/grid/:missionId
├── path/$missionId.tsx          → /missions/path/:missionId
└── new/
    ├── grid.tsx                 → /missions/new/grid
    └── path.tsx                 → /missions/new/path
```

**Key Features:**
- Layout route wrapper (`missions.route.tsx`)
- Dynamic parameters
- Nested directory structure
- Type-safe navigation

---

### Example 5: Root Route Configuration

**Files:** All apps have similar `__root.tsx`

```typescript
export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col h-screen w-full">
      <Outlet />
    </div>
  ),
  pendingComponent: () => <LoadingScreen />,
  notFoundComponent: () => <Navigate to="/_layout" replace />,
})
```

**Key Features:**
- Global layout wrapper
- Loading screen for all routes
- 404 redirect to protected home
- Full-height container

---

## Summary & Decision Framework

### Quick Decision Guide

**"What pattern should I use?"**

1. **Simple public page?** → **Basic Route** (`login.tsx` at root)
2. **Detail page with params?** → **Dynamic Route** (`_layout/users.$userId.tsx`)
3. **Shared UI across routes?** → **Layout Route** (`_layout.tsx`)
4. **Need authentication?** → **Protected Layout** (`_layout/` directory + guards)
5. **Tab navigation?** → **Search Params** with Zod validation
6. **Complex nested routes?** → **Nested Layout** (`_layout/missions.route.tsx`)

---

### Route Organization Checklist

- [ ] Configure `basepath` in router.ts
- [ ] Create `__root.tsx` for global layout
- [ ] Create `_layout.tsx` with HMR-safe guards
- [ ] Public routes at root level (`login.tsx`, `signup.tsx`)
- [ ] Protected routes under `_layout/`
- [ ] Use `$param.tsx` for dynamic segments
- [ ] Use `index.tsx` for default pages
- [ ] Use `.route.tsx` for layout wrappers in nested routes
- [ ] Add error components where needed

---

### Best Practices Summary

1. **File-Based Routing** - Let file structure define routes
2. **Base Path** - Always configure for monorepo apps
3. **Type Safety** - Leverage automatic inference
4. **Route Loaders** - Prefetch into TanStack Query cache
5. **Zod Validation** - Schema-based search params
6. **Layout Routes** - Prefix with `_` for wrappers
7. **HMR-Safe Guards** - Use `createLayoutGuardLoader`
8. **Dynamic Context** - Inject auth after login
9. **Search vs Local State** - Choose based on shareability needs
10. **Error Handling** - Add `errorComponent` for route-level errors

---

## Conclusion

TanStack Router provides a modern, type-safe approach to routing in React applications. Its key strengths include:

1. **Type Safety** - 100% inferred TypeScript support
2. **File-Based** - Automatic route generation from file structure
3. **Data Prefetching** - Built-in loaders warm Query cache
4. **Search Params** - Schema-based validation with Zod
5. **Route Protection** - Simple guard functions
6. **Monorepo Support** - Base path configuration for multiple apps

**When to Use TanStack Router:**
- Client-side React applications (SPAs)
- Type safety is a priority
- Complex routing requirements
- Monorepo with multiple apps
- Need for integrated data loading

**When NOT to Use:**
- SSR required (use TanStack Start instead)
- Very simple routing needs

---

## Additional Resources

### Official Documentation
- [TanStack Router Official Docs](https://tanstack.com/router/latest/docs)
- [File-Based Routing Guide](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts)
- [Data Loading Guide](https://tanstack.com/router/v1/docs/framework/react/guide/data-loading)
- [Type Safety Guide](https://tanstack.com/router/v1/docs/framework/react/guide/type-safety)
- [Search Params Guide](https://tanstack.com/router/v1/docs/framework/react/guide/search-params)

### Community Resources
- [TanStack Router Examples](https://github.com/TanStack/router/tree/main/examples)
- [Migration from React Router](https://tanstack.com/router/latest/docs/framework/react/how-to/migrate-from-react-router)

### Blog Posts & Articles
- [The Beauty of TanStack Router](https://tkdodo.eu/blog/the-beauty-of-tan-stack-router)
- [Search Params Are State](https://tanstack.com/blog/search-params-are-state)
- [Context Inheritance](https://tkdodo.eu/blog/context-inheritance-in-tan-stack-router)

---

**Version History:**
- v1.1 (2026-01-27): Revised based on senior engineer critique
  - Added monorepo configuration section
  - Added search params vs local state decision guide
  - Explained HMR-safe guard loader pattern
  - Clarified loader = prefetch pattern
  - Added feature flag routing pattern
  - Expanded testing section
  - Aligned navigation guidance with actual codebase
  - Added search params adoption table
  - Explained dynamic auth context injection
  - Fixed code example imports and types
  - Updated code splitting explanation
  - Clarified auth layout pattern
- v1.0 (2026-01-27): Initial comprehensive guide

**Contributors:** Frontend Architecture Team
**Next Review:** Q2 2026
