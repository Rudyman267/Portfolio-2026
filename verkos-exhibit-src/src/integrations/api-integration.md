# API Integration

## Overview

Create REST API service layer using patterns from shared libraries.

## Reference Apps

All apps use this pattern - see `mission-planner/src/api/` for comprehensive example

## Quick Setup

### 1. Define Endpoints

**File**: `src/api/config/api-endpoints.ts`

```typescript
export const API_ENDPOINTS = {
  USERS: {
    LIST: 'v3/users/list',
    GET: (id: string) => `v3/users/${id}`,
    CREATE: 'v3/users/create',
    UPDATE: (id: string) => `v3/users/${id}`,
    DELETE: (id: string) => `v3/users/${id}`,
  },
};
```

### 2. Create Service

**File**: `src/api/services/user.service.ts`

```typescript
import { API_ENDPOINTS } from '../config/api-endpoints';

export const userService = {
  getAll: async () => {
    // httpClient is available from router context after auth
    const { httpClient } = router.options.context;
    const response = await httpClient.get(API_ENDPOINTS.USERS.LIST);
    return response.data;
  },

  getById: async (id: string) => {
    const { httpClient } = router.options.context;
    const response = await httpClient.get(API_ENDPOINTS.USERS.GET(id));
    return response.data;
  },

  create: async (data: CreateUserRequest) => {
    const { httpClient } = router.options.context;
    const response = await httpClient.post(API_ENDPOINTS.USERS.CREATE, data);
    return response.data;
  },
};
```

### 3. Define Types

**File**: `src/api/types/user.types.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
}
```

### 4. Use with React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { userService } from '@/api/services/user.service';

function UsersComponent() {
  // Fetch data
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  // Mutations
  const createUser = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return <div>{/* UI */}</div>;
}
```

## File Organization

```
api/
├── config/
│   └── api-endpoints.ts    - Centralized endpoints
├── services/
│   ├── user.service.ts     - User API calls
│   └── feature.service.ts  - Feature API calls
└── types/
    ├── user.types.ts       - User types
    └── feature.types.ts    - Feature types
```

## Auth Headers

HttpProvider automatically adds auth headers via interceptors. No manual token management needed.

## Reference

See `apps/mission-planner/src/api/` for complete implementation
