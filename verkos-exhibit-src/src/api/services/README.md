# API Services

This directory contains HTTP service functions for communicating with backend APIs.

## Structure

Organize services by feature or domain:

```
services/
├── auth.service.ts       - Authentication-related API calls
├── user.service.ts       - User management API calls
└── feature.service.ts    - Feature-specific API calls
```

## Example

```typescript
// user.service.ts
import { httpClient } from '@auth';
import { API_ENDPOINTS } from '../config/api-endpoints';

export const userService = {
  getProfile: async () => {
    const response = await httpClient.get(API_ENDPOINTS.USER.PROFILE);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await httpClient.put(API_ENDPOINTS.USER.PROFILE, data);
    return response.data;
  },
};
```

## Integration Guide

See `/integrations/api-integration.md` for detailed guidance on creating API services.
