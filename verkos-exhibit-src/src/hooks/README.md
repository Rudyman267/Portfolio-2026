# Custom Hooks

This directory contains reusable React hooks for your application.

## Structure

Organize hooks by feature or domain:

```
hooks/
├── auth/
│   ├── useAuth.ts           - Authentication hooks
│   └── usePermissions.ts    - Permission checks
├── data/
│   ├── useUsers.ts          - User data fetching
│   └── useFeature.ts        - Feature data hooks
└── ui/
    ├── useModal.ts          - Modal state management
    └── useForm.ts           - Form handling
```

## Example

```typescript
// hooks/data/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api/services/user.service';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
};
```

## Best Practices

- Use React Query for server state
- Use Zustand stores for client state
- Keep hooks focused and single-purpose
- Follow the "use" naming convention
