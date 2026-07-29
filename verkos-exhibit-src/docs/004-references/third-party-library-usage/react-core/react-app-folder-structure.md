# React Application Folder Structure Standard

> **Purpose**: Establish a consistent, scalable folder structure for all React applications in the monorepo.
>
> **Status**: Active Standard
>
> **Last Updated**: 2026-01-26

---

## Executive Summary

This document defines the **standardized folder structure** for all React applications in the Cloud Monorepo V2. Based on analysis of three production applications (Fleet, Asset Management, Mission Planner), this standard ensures:

- **Consistency** across all applications
- **Scalability** for features and complexity growth
- **Maintainability** through clear separation of concerns
- **Developer Experience** with predictable file locations
- **Onboarding Efficiency** for new team members

---

## Current Application Analysis

### Application Comparison Matrix

| Metric | Fleet (FlightView) | Asset Management | Mission Planner |
|--------|-------------------|------------------|-----------------|
| **TypeScript Files** | 161 | 247 | 332 |
| **Components** | 62 | 107 | 116 |
| **Custom Hooks** | 20 | 30+ | 40+ |
| **Routes** | 20 | 28 | 22 |
| **Features** | 4 | 3 | 7 |
| **Zustand Stores** | 6 | 6 | 5 |
| **Test Files** | 1 | 16 | 0 |
| **Complexity** | High | Very High | Very High |

### Common Patterns Identified

✅ **Consistent Across All Apps:**
- Feature-driven architecture
- TanStack Router (file-based routing)
- Zustand for client state management
- TanStack Query for server state
- TypeScript strict mode
- Vite build tool with Nx
- Tailwind CSS + shadcn/ui components
- Multi-environment configuration
- Path alias usage

⚠️ **Variations Found:**
- Store organization (flat vs. sliced)
- Hook categorization (client/server/composed vs. flat)
- Component nesting depth
- Testing strategy (minimal vs. comprehensive)
- API layer organization (centralized vs. per-feature)

---

## Standardized Folder Structure

### Root-Level Structure

```
/apps/[app-name]/
├── build/                        # Build utilities (Vite plugins, build scripts)
├── src/                          # Application source code
├── public/                       # Static assets served as-is
├── package.json                  # Package manifest
├── project.json                  # Nx configuration
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript base config
├── tsconfig.app.json            # TypeScript app config
├── tsconfig.spec.json           # TypeScript test config
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.cjs            # ESLint rules
├── vitest.config.ts             # Vitest test configuration
├── components.json              # shadcn/ui component registry
├── index.html                   # HTML entry point
└── README.md                    # App-specific documentation
```

**Note:** Build utilities (Vite plugins, custom build scripts) go in `/build/` directory at root level, NOT in `src/` since they are build-time only code.

---

### Source Directory Structure (`src/`)

```
src/
├── main.tsx                     # React 18 entry point
├── App.tsx                      # Root application component
├── App.test.tsx                 # Root component test (colocated)
├── router.ts                    # TanStack Router configuration
├── routeTree.gen.ts            # Auto-generated route tree (do not edit)
├── index.scss                   # Global styles entry
│
├── app/                         # Application core
│   │
│   ├── api/                     # API integration layer
│   │   ├── config/
│   │   │   └── api-endpoints.ts # Centralized endpoint definitions
│   │   ├── services/            # API service abstractions
│   │   └── types/               # API-specific types
│   │
│   ├── components/              # App-level shared components
│   │   ├── ui/                  # shadcn/ui primitives (generated)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (Radix UI components)
│   │   ├── AppHeader.tsx
│   │   ├── AppHeader.test.tsx   # Colocated test
│   │   └── index.ts
│   │
│   ├── config/                  # App-level configuration
│   │   ├── app-config.ts
│   │   └── index.ts
│   │
│   ├── features/                # Feature modules (see Feature Structure)
│   │   ├── user-management/
│   │   ├── asset-tracking/
│   │   └── mission-planning/
│   │
│   ├── layouts/                 # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── AppLayout.test.tsx   # Colocated test
│   │   └── index.ts
│   │
│   ├── providers/               # Context providers and wrappers
│   │   ├── AppProviders.tsx
│   │   └── index.ts
│   │
│   ├── shared/                  # Shared cross-feature code
│   │   ├── components/          # Shared UI components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── LoadingSpinner.test.tsx
│   │   │   └── index.ts
│   │   ├── constants/           # Application constants
│   │   │   ├── api-routes.constants.ts
│   │   │   └── index.ts
│   │   ├── context/             # React Context providers
│   │   │   ├── theme-context.tsx
│   │   │   └── index.ts
│   │   ├── hooks/               # Shared custom hooks
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-debounce.test.ts
│   │   │   └── index.ts
│   │   ├── services/            # Business logic services
│   │   │   ├── logger.service.ts
│   │   │   ├── logger.service.test.ts
│   │   │   └── index.ts
│   │   ├── store/               # Zustand stores
│   │   │   ├── app-preferences.store.ts
│   │   │   ├── app-preferences.store.test.ts
│   │   │   └── index.ts
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── common.types.ts
│   │   │   └── index.ts
│   │   └── utils/               # Utility functions
│   │       ├── format-date.ts
│   │       ├── format-date.test.ts
│   │       ├── cn.ts            # shadcn className utility
│   │       └── index.ts
│   │
│   └── types/                   # App-level types
│       ├── app.types.ts
│       └── index.ts
│
├── assets/                      # In-source assets (imported in code)
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── environments/                # Environment configurations
│   ├── environment.ts
│   ├── environment.dev.ts
│   ├── environment.stag.ts
│   ├── environment.prod.ts
│   └── environment.eu-prod.ts
│
├── routes/                      # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── index.tsx
│   ├── _layout.tsx
│   ├── _layout/
│   │   └── index.tsx
│   ├── auth/
│   │   └── callback/
│   │       └── google.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   └── verify.tsx
│
└── styles/                      # Global stylesheets
    └── globals.scss
```

**Key Changes from Current Apps:**
- ✅ **API moved**: `src/api/` → `src/app/api/` (consistency with feature-driven architecture)
- ✅ **shadcn/ui moved**: `src/shadcn/ui/` → `src/app/components/ui/` (it's source code, not build config)
- ✅ **Build utilities**: Moved to `/build/` at root (NOT in `src/`)
- ✅ **Tests colocated**: Tests next to source files (modern best practice)
- ✅ **kebab-case**: All files use kebab-case except React components (PascalCase)

---

### Feature Structure (`app/features/[feature-name]/`)

Each feature is a **self-contained module** with clear boundaries. Here's a complete example of the `user-management` feature:

```
app/features/user-management/
├── index.ts                     # Public API exports (components, hooks only)
│
├── components/                  # Feature-specific React components
│   ├── UserList.tsx             # Main list component
│   ├── UserList.test.tsx        # ✅ Colocated test
│   ├── UserCard.tsx
│   ├── UserCard.test.tsx        # ✅ Colocated test
│   ├── UserForm.tsx
│   ├── UserForm.test.tsx        # ✅ Colocated test
│   ├── dialogs/                 # Nested category (if > 15 components)
│   │   ├── DeleteUserDialog.tsx
│   │   ├── DeleteUserDialog.test.tsx
│   │   ├── EditUserDialog.tsx
│   │   ├── EditUserDialog.test.tsx
│   │   └── index.ts
│   └── index.ts
│
├── hooks/                       # Feature-specific custom hooks
│   ├── client/                  # Browser-only (if > 10 hooks, categorize)
│   │   ├── use-keyboard-shortcuts.ts
│   │   ├── use-keyboard-shortcuts.test.ts
│   │   ├── use-auto-save.ts
│   │   ├── use-auto-save.test.ts
│   │   └── index.ts
│   ├── server/                  # Data fetching (TanStack Query)
│   │   ├── use-user-query.ts
│   │   ├── use-user-query.test.ts
│   │   ├── use-create-user.ts
│   │   ├── use-create-user.test.ts
│   │   ├── use-update-user.ts
│   │   ├── use-delete-user.ts
│   │   └── index.ts
│   ├── composed/                # Combined client + server + store
│   │   ├── use-user-management.ts
│   │   ├── use-user-management.test.ts
│   │   ├── use-user-filters.ts
│   │   └── index.ts
│   └── index.ts
│
├── store/                       # Feature-specific Zustand state
│   ├── user-management.store.ts # Main store
│   ├── user-management.store.test.ts # ✅ Colocated test
│   ├── slices/                  # State slices (if > 100 lines)
│   │   ├── ui-state.slice.ts
│   │   ├── filters.slice.ts
│   │   └── index.ts
│   ├── selectors/               # Derived state (optional)
│   │   ├── user-list.selectors.ts
│   │   ├── user-list.selectors.test.ts
│   │   └── index.ts
│   └── index.ts
│
├── services/                    # Business logic
│   ├── user-crud.service.ts
│   ├── user-crud.service.test.ts # ✅ Colocated test
│   ├── user-validation.service.ts
│   ├── user-validation.service.test.ts
│   └── index.ts
│
├── api/                         # Feature API layer (optional)
│   ├── user-api.ts              # TanStack Query hooks
│   └── index.ts
│
├── types/                       # TypeScript types
│   ├── user.types.ts
│   ├── user-form.types.ts
│   └── index.ts
│
├── constants/                   # Feature constants
│   ├── user-roles.constants.ts
│   ├── user-status.constants.ts
│   └── index.ts
│
├── utils/                       # Feature utilities
│   ├── format-user-name.ts
│   ├── format-user-name.test.ts # ✅ Colocated test
│   ├── validate-email.ts
│   ├── validate-email.test.ts
│   └── index.ts
│
└── validators/                  # Validation rules (optional)
    ├── user-schema.validator.ts
    ├── user-schema.validator.test.ts
    └── index.ts
```

**Feature Structure Notes:**

1. **Colocated Tests** ✅ (Recommended)
   - Tests are placed next to source files (e.g., `UserList.tsx` → `UserList.test.tsx`)
   - Makes tests easy to find and maintain
   - Modern best practice (Jest, Vitest recommend this)

2. **kebab-case Naming** (Except React Components)
   - Files: `use-user-query.ts`, `format-user-name.ts`, `user-crud.service.ts`
   - React Components: `UserList.tsx`, `UserCard.tsx` (PascalCase)
   - Directories: `user-management/`, `dialogs/` (kebab-case)

3. **Hook Categorization** (Optional but Recommended for > 10 hooks)
   - `client/` - Browser-only (DOM, refs, useEffect)
   - `server/` - Data fetching (useQuery, useMutation)
   - `composed/` - Combines client + server + store

4. **Store Slicing** (Optional for > 100 line stores)
   - Break large stores into slices
   - Use selectors for derived state

5. **Nested Components** (Optional for > 15 components)
   - Group related components in subdirectories
   - Example: `dialogs/`, `forms/`, `cards/`

**Alternative: Complex Features with Separated Tests**

For complex features with extensive testing (like Asset Management's kml-import with 16 tests):

```
app/features/kml-import/
├── components/
├── hooks/
├── services/
├── store/
└── __tests__/                   # Separated tests (for complex test suites)
    ├── unit/                    # Unit tests
    │   ├── services/
    │   ├── hooks/
    │   └── utils/
    ├── integration/             # Integration/BDD tests
    │   ├── kml-parsing.test.ts
    │   └── import-workflow.test.ts
    ├── fixtures/                # Test data
    │   ├── simple/
    │   ├── complex/
    │   └── edge-cases/
    └── helpers/                 # Test utilities
        ├── test-setup.ts
        └── mocks.ts
```

**Use separated `__tests__/` when:**
- Feature has 10+ test files
- Need extensive fixtures and helpers
- BDD/integration tests require complex setup

---

### Layout Structure (`app/layouts/`)

```
app/layouts/
├── [AppName]Layout.tsx          # Main app layout wrapper
├── [AppName]Header.tsx          # Application header
├── Footer.tsx                   # Footer component
├── Sidebar.tsx                  # Sidebar navigation
├── sections/                    # Layout sections
│   ├── LeftSection.tsx
│   ├── RightSection.tsx
│   ├── BottomPanel.tsx
│   ├── MainContent.tsx
│   └── index.ts
└── index.ts                     # Layout exports
```

---

### Public Assets Structure (`public/`)

```
public/
├── assets/                      # Organized asset categories
│   ├── icons/                   # Icon collections
│   │   ├── map/                 # Map markers
│   │   ├── ui/                  # UI icons
│   │   └── auth/                # Authentication provider icons
│   ├── images/                  # Images and photos
│   ├── media/                   # Sample media files
│   ├── models/                  # 3D models (if using Cesium)
│   └── diagrams/                # Diagrams and charts
├── favicon.ico                  # Browser favicon
├── manifest.json                # PWA manifest
├── robots.txt                   # SEO robots file
└── _redirects                   # Deployment redirects (Netlify/Vercel)
```

---

## Naming Conventions

### File Naming (kebab-case Standard)

| Type | Convention | Example |
|------|-----------|---------|
| **React Components** | PascalCase | `UserProfile.tsx`, `DroneTable.tsx` |
| **Hooks** | kebab-case with `use-` prefix | `use-auth.ts`, `use-drone-data.ts` |
| **Stores** | kebab-case with `.store.ts` | `user-preferences.store.ts` |
| **Slices** | kebab-case with `.slice.ts` | `ui-state.slice.ts` |
| **Selectors** | kebab-case with `.selectors.ts` | `drone-list.selectors.ts` |
| **Services** | kebab-case with `.service.ts` | `auth.service.ts`, `map-config.service.ts` |
| **Types** | kebab-case with `.types.ts` | `user.types.ts`, `mission.types.ts` |
| **Utils** | kebab-case | `format-date.ts`, `calculate-distance.ts` |
| **Constants** | kebab-case with `.constants.ts` | `api-routes.constants.ts`, `app-config.constants.ts` |
| **Validators** | kebab-case with `.validator.ts` | `altitude.validator.ts`, `email.validator.ts` |
| **Routes** | kebab-case matching URL | `login.tsx`, `user-profile.tsx` |
| **Dynamic Routes** | `$param` syntax | `details.$asset-id.tsx` |
| **Test Files** | Same name with `.test.tsx` or `.spec.tsx` | `UserProfile.test.tsx`, `use-auth.test.ts` |

**Reasoning for kebab-case:**
- ✅ **Cross-OS compatibility**: Avoids case-sensitivity issues (macOS vs Linux)
- ✅ **URL-friendly**: Maps to routes (`/user-profile`)
- ✅ **Web ecosystem standard**: npm packages, CSS classes use kebab-case
- ✅ **Consistent with directories**: Matches folder naming convention
- ❌ **Exception**: React components use PascalCase (React convention)

### Directory Naming

| Type | Convention | Example |
|------|-----------|---------|
| **Feature Directories** | kebab-case | `drone-management`, `asset-details` |
| **Component Categories** | kebab-case | `action-bar`, `table-cells` |
| **Generic Directories** | lowercase single word or kebab-case | `hooks`, `components`, `shared` |

### Variable/Function Naming (Inside Files)

| Type | Convention | Example |
|------|-----------|---------|
| **React Components** | PascalCase | `const UserProfile = () => {}` |
| **Custom Hooks** | camelCase with `use` prefix | `const useDroneData = () => {}` |
| **Functions** | camelCase | `function calculateDistance() {}` |
| **Constants** | SCREAMING_SNAKE_CASE | `const API_BASE_URL = '...'` |
| **Zustand Stores** | camelCase | `const useUserStore = create()` |
| **Type/Interface** | PascalCase | `interface User {}`, `type Asset = {}` |
| **Enums** | PascalCase (name), PascalCase (values) | `enum Status { Active, Inactive }` |

**Note:** File names use kebab-case, but variable/function names inside files follow TypeScript/JavaScript conventions (camelCase/PascalCase).

---

## Naming Convention Rationale

### Why kebab-case for Files?

**1. Cross-OS Compatibility** ✅
- **macOS/Windows**: Case-insensitive filesystems (`UserProfile.ts` = `userprofile.ts`)
- **Linux**: Case-sensitive filesystem (different files!)
- **kebab-case avoids issues**: `user-profile.ts` always the same across all OS
- **Real problem**: `useUserQuery.ts` vs `useUserquery.ts` can cause git conflicts

**2. URL-Friendly** ✅
- Maps directly to routes: `/user-profile` → `user-profile.tsx`
- TanStack Router, Next.js, Remix all use kebab-case for routes
- SEO-friendly URLs (search engines prefer hyphens)

**3. Web Ecosystem Standard** ✅
- **npm packages**: `react-router-dom`, `@tanstack/react-query`, `framer-motion`
- **CSS classes**: `user-card`, `nav-bar`, `btn-primary`
- **HTML attributes**: `data-testid`, `aria-label`
- **Entire web ecosystem** uses kebab-case for filenames and identifiers

**4. Readability** ✅
- `user-management.tsx` easier to read than `userManagement.tsx` or `user_management.tsx`
- Hyphens provide clear word boundaries
- Scans faster in file lists

**5. Consistency with Directories** ✅
- Directories already use kebab-case (`user-management/`)
- Files should match: `user-management/use-user-query.ts`

**6. Industry Practice** ✅
- **React ecosystem**: Most major projects use kebab-case or flat lowercase
  - Next.js: kebab-case for page files
  - Remix: kebab-case for routes
  - Astro: kebab-case for components
  - Svelte: kebab-case for components
- **TypeScript ecosystem**: No official standard, but kebab-case gaining adoption
- **Modern frameworks**: All trending toward kebab-case for files

### Why PascalCase for React Components?

**React Convention** - Official React docs and entire ecosystem use PascalCase for components:
- `UserProfile.tsx`, `DroneTable.tsx`, `Button.tsx`
- Immediately identifies React components vs utilities
- JSX requires PascalCase: `<UserProfile />` vs `<userProfile />`
- Industry-wide standard, non-negotiable

### Why camelCase Inside Files?

**TypeScript/JavaScript Standard:**
- Functions: `calculateDistance()`, `formatDate()`
- Variables: `const userData = ...`
- Hooks: `const useDroneData = () => {}`
- Standard across entire JavaScript ecosystem

### Comparison with Other Conventions

| Convention | Example | Pros | Cons | Verdict |
|------------|---------|------|------|---------|
| **kebab-case** | `use-auth.ts` | Cross-OS, web standard, readable | Different from TS/JS variables | ✅ **Chosen** |
| **camelCase** | `useAuth.ts` | Matches TS/JS | Case-sensitivity issues on Linux | ❌ Rejected |
| **snake_case** | `use_auth.ts` | Readable | Not web standard, uncommon in JS | ❌ Rejected |
| **PascalCase** | `UseAuth.ts` | Clear boundaries | Only for components, confusing | ❌ Rejected (except components) |
| **flatcase** | `useauth.ts` | Simple | Unreadable | ❌ Rejected |

### Real-World Example

```
❌ BAD (mixed conventions):
features/userManagement/
├── UseAuth.ts
├── userCrud.service.ts
├── UserList.tsx
└── user_validation.ts

✅ GOOD (consistent kebab-case):
features/user-management/
├── use-auth.ts              # Hook (kebab-case file)
├── user-crud.service.ts      # Service (kebab-case file)
├── UserList.tsx              # Component (PascalCase - React convention)
└── user-validation.ts        # Util (kebab-case file)
```

---

## State Management Standards

### Zustand Store Organization

**Simple Stores (< 50 lines, single concern):**
```typescript
// Flat structure
src/app/shared/store/
├── user-preferences.store.ts
├── application-context.store.ts
└── index.ts
```

**Complex Stores (> 50 lines, multiple concerns):**
```typescript
// Sliced structure
src/app/features/[feature]/store/
├── [feature].store.ts           # Main store combining slices
├── slices/
│   ├── ui-state.slice.ts
│   ├── data-state.slice.ts
│   └── index.ts
├── selectors/
│   ├── ui.selectors.ts
│   └── index.ts
└── index.ts
```

**Store Pattern:**
```typescript
// [feature].store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';

interface FeatureState {
  // State definition
}

interface FeatureActions {
  // Action definition
}

export const useFeatureStore = create<FeatureState & FeatureActions>()(
  devtools(
    immer((set, get) => ({
      // State and actions
    })),
    { name: 'FeatureStore' }
  )
);
```

### TanStack Query Organization

**App-Level Queries:**
```typescript
// src/api/services/[entity].api.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export const useGetEntity = (id: string) => {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => apiClient.get(`/entities/${id}`),
  });
};
```

**Feature-Level Queries:**
```typescript
// src/app/features/[feature]/api/[feature].api.ts
export const useFeatureQuery = () => {
  return useQuery({
    queryKey: ['feature', 'data'],
    queryFn: fetchFeatureData,
  });
};
```

---

## Hook Organization Standards

### Hook Categories

**1. Client Hooks (`hooks/client/`)** - Browser-only, no data fetching
```typescript
// File: use-auto-scroll.ts
export const useAutoScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // DOM manipulation logic
};

// File: use-intersection-observer.ts
export const useIntersectionObserver = (options) => {
  // Intersection Observer API logic
};

// File: use-keyboard-shortcuts.ts
export const useKeyboardShortcuts = (shortcuts) => {
  // Keyboard event handling
};
```

**2. Server Hooks (`hooks/server/`)** - Data fetching, TanStack Query
```typescript
// File: use-asset-data.ts
export const useAssetData = (id: string) => {
  return useQuery(['asset', id], () => fetchAsset(id));
};

// File: use-mission-list.ts
export const useMissionList = (filters) => {
  return useQuery(['missions', filters], () => fetchMissions(filters));
};

// File: use-user-profile.ts
export const useUserProfile = () => {
  return useQuery(['user'], fetchUserProfile);
};
```

**3. Composed Hooks (`hooks/composed/`)** - Combine client + server + store
```typescript
// File: use-asset-list.ts
export const useAssetList = () => {
  const { data } = useAssetData();           // Server hook
  const filters = useAssetStore(s => s.filters);  // Store
  const { scrollToTop } = useAutoScroll();   // Client hook

  // Combined logic
  return { assets: filteredData, scrollToTop };
};

// File: use-mission-editor.ts
export const useMissionEditor = () => {
  // Combines mission data, editor state, and auto-save
};
```

### Hook Naming Rules

**Function names (inside files) use camelCase:**
- **Boolean returns**: Prefix with `is`, `has`, `can`, `should`
  - `useIsMobile()`, `useHasPermission()`, `useCanEdit()`
- **Data fetching**: No special prefix, describe the data
  - `useDroneList()`, `useAssetDetails()`, `useUserProfile()`
- **Actions**: Verb-based naming
  - `useCreateMission()`, `useUpdateAsset()`, `useDeleteItem()`
- **Effects**: Describe the effect
  - `useAutoSave()`, `useKeyboardShortcuts()`, `useWebSocket()`

**File names use kebab-case with `use-` prefix:**
- `use-auto-scroll.ts` (file) exports `useAutoScroll()` (function)
- `use-drone-list.ts` (file) exports `useDroneList()` (function)
- `use-create-mission.ts` (file) exports `useCreateMission()` (function)

---

## Routing Standards

### TanStack Router File Naming

| Pattern | File Name | URL |
|---------|-----------|-----|
| **Root Route** | `__root.tsx` | - (layout only) |
| **Index Route** | `index.tsx` | `/` |
| **Static Route** | `about.tsx` | `/about` |
| **Nested Route** | `dashboard.home.tsx` | `/dashboard/home` |
| **Dynamic Route** | `users.$userId.tsx` | `/users/:userId` |
| **Catch-All Route** | `docs.$.tsx` | `/docs/*` |
| **Layout Route** | `_layout.tsx` | - (wrapper only) |
| **Layout Children** | `_layout/index.tsx` | Route with layout |

### Route Organization

```
routes/
├── __root.tsx                   # Root layout
├── index.tsx                    # Home page
├── _layout.tsx                  # Protected layout
├── _layout/                     # Protected routes
│   ├── index.tsx                # Main app view
│   ├── [feature].tsx            # Feature routes
│   └── [feature]/
│       └── $id.tsx              # Dynamic segments
├── auth/                        # Auth routes
│   ├── login.tsx
│   └── callback/
│       └── google.tsx
└── error-pages/                 # Error routes
    ├── 404.tsx
    └── restricted.tsx
```

### Route Guards Pattern

```typescript
// _layout.tsx
export const Route = createFileRoute('/_layout')({
  beforeLoad: async ({ context }) => {
    // Authentication check
    const session = await context.auth.getSession();
    if (!session) throw redirect({ to: '/login' });

    // Organization check
    const org = await context.auth.getOrganization();
    if (!org) throw redirect({ to: '/org-not-accessible' });

    // Feature flag check
    const hasAccess = await context.featureFlags.check('FeatureName');
    if (!hasAccess) throw redirect({ to: '/restricted' });
  },
});
```

---

## Component Organization Standards

### Component File Structure

**Single Component:**
```typescript
// ComponentName.tsx
import React from 'react';
import type { ComponentProps } from './ComponentName.types';

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return <div>{/* JSX */}</div>;
};
```

**Component with Types:**
```typescript
// ComponentName.tsx
export interface ComponentNameProps {
  prop1: string;
  prop2: number;
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  return <div>{/* JSX */}</div>;
};
```

**Component Index Export:**
```typescript
// index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

### Component Nesting Guidelines

**Shallow Nesting (Preferred):**
```
components/
├── UserList.tsx
├── UserCard.tsx
├── UserAvatar.tsx
└── index.ts
```

**Deep Nesting (When Logically Grouped):**
```
components/
├── user-table/
│   ├── UserTable.tsx
│   ├── cells/
│   │   ├── NameCell.tsx
│   │   ├── EmailCell.tsx
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

**Rule of Thumb:**
- **< 5 components**: Flat structure
- **5-15 components**: Group by category (cells, actions, headers)
- **> 15 components**: Deep nesting with clear categories

---

## API Layer Standards

### Centralized Endpoint Configuration

```typescript
// api/config/api-endpoints.ts
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // Drones
  DRONES: {
    LIST: '/drones',
    DETAIL: (id: string) => `/drones/${id}`,
    CREATE: '/drones',
    UPDATE: (id: string) => `/drones/${id}`,
    DELETE: (id: string) => `/drones/${id}`,
  },

  // Assets
  ASSETS: {
    LIST: '/assets',
    DETAIL: (id: string) => `/assets/${id}`,
  },
} as const;
```

### API Service Pattern

```typescript
// File: app/api/services/drone.service.ts
import { apiClient } from '@auth/providers/HttpProvider';
import { API_ENDPOINTS } from '@api/config/api-endpoints';

export const droneService = {
  getAll: () => apiClient.get(API_ENDPOINTS.DRONES.LIST),
  getById: (id: string) => apiClient.get(API_ENDPOINTS.DRONES.DETAIL(id)),
  create: (data: DroneInput) => apiClient.post(API_ENDPOINTS.DRONES.CREATE, data),
  update: (id: string, data: DroneInput) => apiClient.put(API_ENDPOINTS.DRONES.UPDATE(id), data),
  delete: (id: string) => apiClient.delete(API_ENDPOINTS.DRONES.DELETE(id)),
};
```

```typescript
// Colocated test: drone.service.test.ts
import { droneService } from './drone.service';
import { apiClient } from '@auth/providers/HttpProvider';

describe('droneService', () => {
  it('should fetch all drones', async () => {
    // Test implementation
  });
});
```

### TanStack Query Integration

```typescript
// File: app/features/drone-management/api/drone-api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { droneService } from '@api/services/drone.service';

export const useGetDrones = () => {
  return useQuery({
    queryKey: ['drones'],
    queryFn: droneService.getAll,
  });
};

export const useCreateDrone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: droneService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drones'] });
    },
  });
};
```

```typescript
// Colocated test: drone-api.test.ts
import { useGetDrones } from './drone-api';
import { renderHook, waitFor } from '@testing-library/react';

describe('useGetDrones', () => {
  it('should fetch drones', async () => {
    // Test implementation
  });
});
```

---

## Testing Standards

### Test Organization (Colocated - Recommended ✅)

**Default approach:** Tests are placed next to source files

```
features/user-management/
├── components/
│   ├── UserList.tsx
│   ├── UserList.test.tsx        # ✅ Colocated
│   ├── UserCard.tsx
│   └── UserCard.test.tsx        # ✅ Colocated
├── hooks/
│   ├── use-user-query.ts
│   └── use-user-query.test.ts   # ✅ Colocated
├── services/
│   ├── user-crud.service.ts
│   └── user-crud.service.test.ts # ✅ Colocated
└── utils/
    ├── format-user-name.ts
    └── format-user-name.test.ts  # ✅ Colocated
```

**Benefits:**
- ✅ Tests easy to find (always next to source)
- ✅ Clear what's being tested
- ✅ Encourages test writing (visible reminder)
- ✅ Modern best practice (Jest, Vitest, React Testing Library recommend)

**Alternative: Separated Tests (For Complex Features)**

Use `__tests__/` directory when feature has 10+ tests with extensive fixtures/helpers:

```
features/kml-import/
├── components/
├── hooks/
├── services/
└── __tests__/                   # Separated (complex test suite)
    ├── unit/                    # Unit tests
    │   ├── services/
    │   │   └── kml-parser.service.test.ts
    │   └── hooks/
    │       └── use-kml-parser.test.ts
    ├── integration/             # Integration/BDD tests
    │   ├── kml-parsing-business-logic.test.ts
    │   └── import-workflow.test.ts
    ├── fixtures/                # Test data
    │   ├── simple/
    │   ├── complex/
    │   └── edge-cases/
    └── helpers/                 # Test utilities
        ├── test-setup.ts
        └── mocks.ts
```

**Use separated `__tests__/` when:**
- Feature has 10+ test files
- Extensive fixtures needed (multiple test data files)
- BDD tests with complex setup
- Shared test helpers across test files

### Test File Naming

| Source File | Test File | Pattern |
|-------------|-----------|---------|
| `UserProfile.tsx` | `UserProfile.test.tsx` | Component test |
| `use-auth.ts` | `use-auth.test.ts` | Hook test |
| `user-crud.service.ts` | `user-crud.service.test.ts` | Service test |
| `format-date.ts` | `format-date.test.ts` | Util test |
| Complex feature | `kml-parsing-business-logic.test.ts` | BDD test (in `__tests__/`) |
| E2E flow | `user-registration.e2e.test.ts` | E2E test |

### Test Coverage Priorities

**High Priority (Must Test):**
1. Business logic services
2. Complex hooks with multiple dependencies
3. Validation rules and parsers
4. State management stores
5. Critical user flows (E2E)

**Medium Priority (Should Test):**
1. UI components with complex logic
2. Utility functions
3. API service layers

**Low Priority (Optional):**
1. Simple presentational components
2. Routing configuration
3. Type definitions

---

## Configuration Standards

### Environment Configuration Pattern

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  wsBaseUrl: 'ws://localhost:3001',
  appName: 'AppName',
  version: '1.0.0',
  features: {
    enableAnalytics: false,
    enableFeatureX: false,
  },
};

export type Environment = typeof environment;
```

```typescript
// environments/environment.prod.ts
import type { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api.production.com',
  wsBaseUrl: 'wss://ws.production.com',
  appName: 'AppName',
  version: '1.0.0',
  features: {
    enableAnalytics: true,
    enableFeatureX: true,
  },
};
```

### Path Aliases Configuration

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@app': resolve(__dirname, './src/app'),
      '@api': resolve(__dirname, './src/app/api'),
      '@features': resolve(__dirname, './src/app/features'),
      '@components': resolve(__dirname, './src/app/components'),
      '@ui': resolve(__dirname, './src/app/components/ui'), // shadcn/ui
      '@shared': resolve(__dirname, './src/app/shared'),
      '@layouts': resolve(__dirname, './src/app/layouts'),
      '@routes': resolve(__dirname, './src/routes'),
      '@assets': resolve(__dirname, './src/assets'),
      '@env': resolve(__dirname, `./src/environments/environment.${mode}.ts`),

      // Monorepo shared libraries
      '@libs': resolve(__dirname, '../../libs'),
      '@auth': resolve(__dirname, '../../libs/core/auth-frontend'),
      '@map/public': resolve(__dirname, '../../libs/shared/map/src/public'),
      '@map/private': resolve(__dirname, '../../libs/shared/map/src/private'),
    },
  },
});
```

```json
// tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@app/*": ["src/app/*"],
      "@api/*": ["src/app/api/*"],
      "@features/*": ["src/app/features/*"],
      "@components/*": ["src/app/components/*"],
      "@ui/*": ["src/app/components/ui/*"],
      "@shared/*": ["src/app/shared/*"],
      "@layouts/*": ["src/app/layouts/*"],
      "@routes/*": ["src/routes/*"],
      "@assets/*": ["src/assets/*"],
      "@env": ["src/environments/environment.ts"]
    }
  }
}
```

**Usage Examples:**
```typescript
// Import shadcn/ui components
import { Button } from '@ui/button';
import { Dialog } from '@ui/dialog';

// Import API utilities
import { API_ENDPOINTS } from '@api/config/api-endpoints';

// Import feature components
import { UserList } from '@features/user-management';

// Import shared utilities
import { formatDate } from '@shared/utils/format-date';
import { cn } from '@shared/utils/cn';
```

---

## Feature Development Checklist

When creating a new feature, ensure the following structure:

- [ ] Create feature directory: `src/app/features/[feature-name]/`
- [ ] Create `index.ts` with public API exports
- [ ] Create `components/` directory with at least one component
- [ ] Create `hooks/` directory (categorize as client/server/composed if > 3 hooks)
- [ ] Create `store/` directory if feature needs state (use slices if > 50 lines)
- [ ] Create `types/` directory for feature-specific types
- [ ] Create `services/` directory for business logic
- [ ] Create `api/` directory if feature has unique API needs
- [ ] Create `__tests__/` directory if feature has complex logic
- [ ] Add route file(s) in `src/routes/` if feature needs routes
- [ ] Update feature flag configuration if needed
- [ ] Add feature documentation to `/docs/002-applications/[app-name]/features/`

---

## Common Anti-Patterns to Avoid

### ❌ Don't: Mix Concerns
```
Bad:
src/components/UserProfile.tsx  (component + API calls + business logic)
```

### ✅ Do: Separate Concerns
```
Good:
src/app/features/user/components/UserProfile.tsx  (component only)
src/app/features/user/hooks/useUserProfile.ts     (API + logic)
```

---

### ❌ Don't: Deep Nesting Without Reason
```
Bad:
src/app/features/user/components/profile/view/header/avatar/UserAvatar.tsx
```

### ✅ Do: Logical Grouping
```
Good:
src/app/features/user/components/UserAvatar.tsx
```

---

### ❌ Don't: Inconsistent Naming
```
Bad:
UserProfile.tsx
user-card.tsx
User_List.tsx
```

### ✅ Do: Consistent PascalCase
```
Good:
UserProfile.tsx
UserCard.tsx
UserList.tsx
```

---

### ❌ Don't: Global State for Everything
```
Bad:
useGlobalStore() // One giant store for entire app
```

### ✅ Do: Feature-Specific Stores
```
Good:
useUserStore()
useMissionStore()
useAssetStore()
```

---

### ❌ Don't: Relative Import Hell
```
Bad:
import { Component } from '../../../../../../../shared/components/Component';
```

### ✅ Do: Path Aliases
```
Good:
import { Component } from '@shared/components/Component';
```

---

## Frequently Asked Questions

### Q: When should I create a new feature vs. adding to existing?

**Create New Feature When:**
- Functionality is isolated and independent
- Feature can be toggled on/off independently
- Domain logic is distinct (e.g., missions vs. assets)

**Add to Existing Feature When:**
- Functionality extends existing feature
- Shares significant state and logic
- Natural extension of current domain

---

### Q: How deep should component nesting go?

**Guidelines:**
- **Shallow (1-2 levels)**: Preferred for most cases
- **Medium (3-4 levels)**: Acceptable for complex features
- **Deep (5+ levels)**: Avoid; refactor into multiple features

---

### Q: Should all hooks be categorized as client/server/composed?

**No. Categorization is optional:**
- **< 5 hooks**: Flat structure is fine
- **5-10 hooks**: Consider categorization for clarity
- **> 10 hooks**: Categorization highly recommended

---

### Q: Where should shared types go?

**Shared Across Features:** `src/app/shared/types/`
**Feature-Specific:** `src/app/features/[feature]/types/`
**API-Specific:** `src/api/types/`
**Domain-Wide:** Consider `@libs/shared/types/` for monorepo

---

### Q: How should I organize test files?

**Colocated (Recommended ✅):**
```
components/
├── UserCard.tsx
└── UserCard.test.tsx          # ✅ Next to source
```

**Benefits:**
- Tests easy to find
- Encourages test writing
- Modern best practice

**Separated (For Complex Features):**
```
features/complex-feature/
├── components/
├── hooks/
└── __tests__/                 # Only for 10+ tests
    ├── unit/
    ├── integration/
    ├── fixtures/
    └── helpers/
```

**Use separated only when:**
- Feature has 10+ test files
- Extensive fixtures needed
- BDD tests with complex setup

**Default:** Always use colocated unless you have a complex test suite.

---

## Tooling and Automation

### File Generation Scripts

**Create Feature:**
```bash
npm run generate:feature -- --name=my-feature --app=fleet
```

**Create Component:**
```bash
npm run generate:component -- --name=MyComponent --feature=my-feature
```

**Create Hook:**
```bash
npm run generate:hook -- --name=useMyHook --feature=my-feature --type=composed
```

### Linting Rules

**Enforce Structure:**
```javascript
// eslint.config.cjs
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        '../*',  // Prevent relative imports beyond parent
        '../../*',  // Force use of path aliases
      ],
    }],
  },
};
```

---

## Related Documentation

- [React Context API Patterns](./react-context-api-patterns.md)
- [Code Standards](./code-standards.md)
- [Testing Standards](../testing-standards/)
- [Component Guidelines](./component-guidelines.md)
- [State Management Patterns](./state-management-patterns.md)
- [API Integration Guide](./api-integration-guide.md)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-26 | 1.1.0 | **Major Revision**<br>- ✅ Standardized on kebab-case for all files (except React components)<br>- ✅ Moved shadcn/ui to `src/app/components/ui/` (it's source code)<br>- ✅ Moved build utilities to `/build/` at root (not in src)<br>- ✅ Moved API to `src/app/api/` (consistency with feature-driven architecture)<br>- ✅ Added complete feature structure example with all subdirectories<br>- ✅ Standardized on colocated tests (next to source files)<br>- ✅ Added comprehensive kebab-case rationale section<br>- ✅ Updated all code examples to use kebab-case<br>- ✅ Updated path aliases to reflect new structure |
| 2026-01-26 | 1.0.0 | Initial standardization based on Fleet, Asset Management, and Mission Planner analysis |

---

## Approval

This standard was established through analysis of three production applications and represents the consensus structure moving forward.

**Approved by:** Engineering Team
**Effective Date:** 2026-01-26
**Last Major Update:** 2026-01-26 (v1.1.0 - kebab-case standardization)
**Review Cycle:** Quarterly
