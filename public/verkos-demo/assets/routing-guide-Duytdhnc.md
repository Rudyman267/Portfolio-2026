# How to Create Routes

## Overview

This guide explains how to create new routes in the template app using TanStack Router's file-based routing system.

## Reference App

**mission-planner** - Complex routing with nested layouts and route guards

## Quick Start

### 1. Understanding File-Based Routing

Routes are created by adding files to the `src/routes/` directory. The file structure determines the URL structure.

```
src/routes/
├── __root.tsx          → Root layout for all routes
├── _layout.tsx         → Protected layout (requires auth)
├── _layout/
│   ├── index.tsx       → /flytbase-app-template/ (home page)
│   ├── guides.tsx      → /flytbase-app-template/guides
│   └── settings.tsx    → /flytbase-app-template/settings (example)
├── login.tsx           → /flytbase-app-template/login
└── logout.tsx          → /flytbase-app-template/logout
```

### 2. Creating a Simple Route

**File**: `src/routes/_layout/settings.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="fb-h1 text-text-1 mb-4">Settings</h1>
      <p className="fb-body-2 text-text-2">Your settings page content goes here.</p>
    </div>
  );
}

export const Route = createFileRoute('/_layout/settings')({
  component: SettingsPage,
});
```

### 3. Route with Parameters

**File**: `src/routes/_layout/users/$userId.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';

function UserDetailPage() {
  const { userId } = Route.useParams();

  return (
    <div className="p-6">
      <h1 className="fb-h1 text-text-1 mb-4">User {userId}</h1>
    </div>
  );
}

export const Route = createFileRoute('/_layout/users/$userId')({
  component: UserDetailPage,
});
```

### 4. Route with Data Loading

```typescript
import { createFileRoute } from '@tanstack/react-router';

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

function UserDetailPage() {
  const { userId } = Route.useParams();
  const user = Route.useLoaderData();

  return (
    <div className="p-6">
      <h1 className="fb-h1 text-text-1 mb-4">{user.name}</h1>
      <p className="fb-body-2 text-text-2">{user.email}</p>
    </div>
  );
}

export const Route = createFileRoute('/_layout/users/$userId')({
  component: UserDetailPage,
  loader: async ({ params }) => {
    return await fetchUser(params.userId);
  },
});
```

### 5. Nested Layouts

**File**: `src/routes/_layout/settings/_layout.tsx`

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router';

function SettingsLayout() {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-background-level-1 border-r border-outline-primary">
        <nav className="p-4">{/* Navigation items */}</nav>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_layout/settings/_layout')({
  component: SettingsLayout,
});
```

### 6. Route with Search Params

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().optional().default(1),
  search: z.string().optional(),
});

function UsersListPage() {
  const { page, search } = Route.useSearch();

  return (
    <div className="p-6">
      <h1 className="fb-h1 text-text-1 mb-4">Users</h1>
      <p className="fb-body-2 text-text-2">
        Page: {page}, Search: {search || 'none'}
      </p>
    </div>
  );
}

export const Route = createFileRoute('/_layout/users/')({
  component: UsersListPage,
  validateSearch: searchSchema,
});
```

## Navigation

### Using Link Component

```typescript
import { Link } from '@tanstack/react-router';

<Link to="/settings" className="fb-body-2 text-primary-200 hover:text-primary-states-hover">
  Go to Settings
</Link>;
```

### Programmatic Navigation

```typescript
import { useNavigate } from '@tanstack/react-router';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: '/settings' });
  };

  return <button onClick={handleClick}>Go to Settings</button>;
}
```

## Route Guards

Routes under `_layout/` are automatically protected by authentication guards defined in `src/routes/_layout.tsx`:

- `requireAuth` - Validates user session
- `requireOrg` - Validates organization access

No additional setup needed for protected routes!

## Best Practices

1. **Use File-Based Routing** - Follow the file structure convention
2. **Colocate Route Files** - Keep route-specific components close to route files
3. **Type-Safe Params** - Use TypeScript for route parameters
4. **Loading States** - Use `pendingComponent` for loading indicators
5. **Error Boundaries** - Use `errorComponent` for error handling
6. **Cache Strategy** - Configure `staleTime` and `gcTime` for data caching

## Common Patterns

### Modal Routes

```typescript
// src/routes/_layout/users/$userId/edit.tsx
export const Route = createFileRoute('/_layout/users/$userId/edit')({
  component: EditUserModal,
});
```

### Index Routes

```typescript
// src/routes/_layout/settings/index.tsx
export const Route = createFileRoute('/_layout/settings/')({
  component: SettingsHome,
});
```

## Auto-Generated Route Tree

TanStack Router automatically generates `src/routeTree.gen.ts` based on your route files. Don't edit this file manually!
