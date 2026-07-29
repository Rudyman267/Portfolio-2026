# API Types

This directory contains TypeScript type definitions for API requests and responses.

## Structure

Organize types to match your service files:

```
types/
├── auth.types.ts       - Authentication request/response types
├── user.types.ts       - User-related types
└── feature.types.ts    - Feature-specific types
```

## Example

```typescript
// user.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface UpdateProfileResponse {
  user: User;
  message: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}
```

## Best Practices

- Use interfaces for object shapes
- Use enums for fixed sets of values
- Export all types from a central index.ts if needed
- Keep types close to where they're used
