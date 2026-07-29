# Shared Libraries

This directory contains shared code that can be used across multiple applications in the monorepo.

## Structure

```
libs/
├── core/           # Core utilities, types, and business logic
├── shared/         # Shared UI components and features
│   ├── layout/     # Layout components (sidebar, header, etc.)
│   └── ui/         # Reusable UI components
└── tsconfig.base.json  # Base TypeScript configuration
```

## Usage

Import shared components and utilities using the configured path aliases:

```typescript
// Import from shared library
import { Sidebar } from '@cloud/shared/layout';
import { Button } from '@cloud/shared/ui';

// Import from core library
import { type User } from '@cloud/core/types';
import { formatDate } from '@cloud/core/utils';
```

## Adding New Libraries

1. Create a new directory under `libs/`
2. Add a `package.json` with appropriate dependencies
3. Create an `index.ts` to export public API
4. Update `tsconfig.base.json` with new path alias if needed

## Guidelines

- Keep shared code focused and minimal
- Avoid circular dependencies
- Document public APIs
- Follow the monorepo's TypeScript and testing standards
- Use proper versioning for shared packages
