# REST API Call Standards

## Overview

This document outlines the standardized approach for making REST API calls within our monorepo applications. Following these standards ensures consistent error handling, authentication, and data access patterns across all applications.

## Core Principles

1. **Single Source of Truth**: Use the HTTP client from the auth library for all REST calls
2. **Authentication Standardization**: Leverage built-in token management and auth error handling
3. **Centralized API Modules**: Organize API calls by feature module
4. **Caching & Deduplicated Requests**: Use React Query to avoid duplicate network requests
5. **Type Safety**: Ensure all API responses have proper TypeScript interfaces

## HTTP Client Implementation

### Using the Auth Library HTTP Client

All applications should use the HTTP client from the auth-frontend library, which provides:

- Automatic token management
- Standardized error handling
- Organization ID header inclusion
- Email verification handling
- Auth error redirection

```typescript
// Example of accessing the HTTP client
import { useHttp } from 'auth-lib';

function MyComponent() {
  const httpClient = useHttp();

  // Now you can use httpClient.get(), httpClient.post(), etc.
}
```

### HTTP Provider Setup

Each application needs to set up the HTTP provider from the auth library:

```typescript
// In your app's provider component
import { HttpProvider } from 'auth-lib';
import { environment } from '../environments/environment';

// Define how to update router context with auth and HTTP client
// This is typically defined in router.ts
export const setRouterAuthContext = (auth, http) => {
  router.update({
    context: {
      queryClient,
      auth,
      ...(http ? { http } : {}),
    },
  });
};

function AppProviders({ children }) {
  return (
    <AuthProvider authConfig={environment.authConfig}>
      <HttpProvider
        routerConfig={{
          setAuthContext: setRouterAuthContext,
        }}
      >
        {/* Other providers */}
        {children}
      </HttpProvider>
    </AuthProvider>
  );
}
```

## API Module Pattern

### Feature-Based API Organization

API calls should be organized into feature modules:

```
libs/
  feature-modules/
    drones/
      api/
        drones.api.ts  // API functions for drone operations
      hooks/
        use-drones.ts  // React Query hooks using the API functions
      types/
        drone.types.ts // TypeScript interfaces for API data
```

### API Module Implementation

```typescript
// libs/feature-modules/drones/api/drones.api.ts
import { useHttp } from 'auth-lib';
import type { Drone, DroneResponse, DroneSettings } from '../types/drone.types';

/**
 * Hook that provides access to drone-related API operations
 */
export const useDronesApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  const BASE_URL = '/api/drones';

  return {
    /**
     * Fetch all drones for the current organization
     */
    fetchDrones: async (): Promise<DroneResponse> => {
      const response = await httpClient.get<DroneResponse>(BASE_URL);
      return response.data;
    },

    /**
     * Fetch a specific drone by ID
     */
    fetchDroneById: async (id: string): Promise<Drone> => {
      const response = await httpClient.get<Drone>(`${BASE_URL}/${id}`);
      return response.data;
    },

    /**
     * Update drone settings
     */
    updateDrone: async (id: string, settings: Partial<DroneSettings>): Promise<Drone> => {
      const response = await httpClient.patch<Drone>(`${BASE_URL}/${id}`, settings);
      return response.data;
    },

    /**
     * Send command to a drone
     */
    sendCommand: async (id: string, command: DroneCommand): Promise<CommandResponse> => {
      const response = await httpClient.post<CommandResponse>(`${BASE_URL}/${id}/commands`, command);
      return response.data;
    },
  };
};
```

## Data Access Pattern with React Query

### React Query Integration

To provide centralized data access and caching, use React Query hooks that wrap the API calls:

```typescript
// libs/feature-modules/drones/hooks/use-drones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDronesApi } from '../api/drones.api';
import type { DroneSettings } from '../types/drone.types';

// Query keys for consistent cache management
export const DRONES_KEYS = {
  all: ['drones'] as const,
  lists: () => [...DRONES_KEYS.all, 'list'] as const,
  detail: (id: string) => [...DRONES_KEYS.all, 'detail', id] as const,
};

/**
 * Hook for accessing and managing drones data
 */
export function useDrones() {
  const dronesApi = useDronesApi();
  const queryClient = useQueryClient();

  // Query for fetching all drones
  const dronesQuery = useQuery({
    queryKey: DRONES_KEYS.lists(),
    queryFn: dronesApi.fetchDrones,
    staleTime: 60 * 1000, // 1 minute
  });

  // Mutation for updating a drone
  const updateDroneMutation = useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: Partial<DroneSettings> }) => dronesApi.updateDrone(id, settings),
    onSuccess: (updatedDrone) => {
      // Update the drones list query
      queryClient.invalidateQueries({ queryKey: DRONES_KEYS.lists() });
      // Update the individual drone query
      queryClient.setQueryData(DRONES_KEYS.detail(updatedDrone.id), updatedDrone);
    },
  });

  return {
    // Query results
    drones: dronesQuery.data?.drones || [],
    isLoading: dronesQuery.isLoading,
    error: dronesQuery.error,

    // Actions
    updateDrone: updateDroneMutation.mutate,
    isUpdating: updateDroneMutation.isPending,
    refetchDrones: dronesQuery.refetch,
  };
}

/**
 * Hook for accessing a single drone's data
 */
export function useDrone(id: string) {
  const dronesApi = useDronesApi();

  return useQuery({
    queryKey: DRONES_KEYS.detail(id),
    queryFn: () => dronesApi.fetchDroneById(id),
    staleTime: 60 * 1000,
  });
}
```

### Component Usage

Components should access data through the React Query hooks:

```tsx
// Example component using the data hooks
import { useDrones } from '@libs/feature-modules/drones/hooks/use-drones';

export function DroneList() {
  const { drones, isLoading, error, updateDrone } = useDrones();

  if (isLoading) return <div>Loading drones...</div>;
  if (error) return <div>Error loading drones: {error.message}</div>;

  const handleStatusChange = (droneId, newStatus) => {
    updateDrone({ id: droneId, settings: { status: newStatus } });
  };

  return (
    <div className="drone-list">
      <h2>Drones ({drones.length})</h2>
      <ul>
        {drones.map((drone) => (
          <li key={drone.id}>
            <span>{drone.name}</span>
            <StatusBadge status={drone.status} />
            <button onClick={() => handleStatusChange(drone.id, 'ACTIVE')} disabled={drone.status === 'ACTIVE'}>
              Activate
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Error Handling

The auth library's HTTP client already provides standardized error handling. When an error occurs:

1. It maps Axios errors to standardized error objects
2. It handles authentication errors (redirects to login)
3. It checks for email verification issues

Your components should handle these errors appropriately:

```tsx
function MyComponent() {
  const { data, error, isLoading } = useMyDataQuery();

  if (isLoading) return <LoadingSpinner />;

  // Handle common errors
  if (error) {
    if (error.status === 404) {
      return <NotFoundMessage />;
    }

    if (error.status === 403) {
      return <PermissionDeniedMessage />;
    }

    // Generic error handling
    return <ErrorMessage message={error.message} />;
  }

  // Render data normally
  return <DataDisplay data={data} />;
}
```

## Application Setup

To use this pattern in your application:

1. Set up the QueryClient with React Query:

```tsx
// apps/fleet/src/app/providers/AppProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }) {
  return (
    <AuthProvider authConfig={environment.authConfig}>
      <HttpProvider routerConfig={{ setAuthContext: (auth, http) => {} }}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools /> {/* Optional, for development only */}
        </QueryClientProvider>
      </HttpProvider>
    </AuthProvider>
  );
}
```

2. Import and use the data access hooks in your components

## Best Practices

1. **Always use the auth library's HTTP client** - don't import axios directly
2. **Keep API modules focused on data fetching** - business logic belongs elsewhere
3. **Use React Query for all data fetching** - it handles caching and deduplication
4. **Define clear type interfaces** for all API requests and responses
5. **Use query keys consistently** across the application
6. **Handle loading and error states** in your components
7. **Invalidate queries appropriately** when data changes
8. **Use optimistic updates** for a better user experience when appropriate
