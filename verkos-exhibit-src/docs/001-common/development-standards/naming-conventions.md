# Naming Conventions

## Status

In Development

## Metadata

- **Created by:** FlytBase Development Team
- **Created on:** 2025-01-17
- **Last updated:** 2025-01-17
- **Version:** 1.0.0

---

## Overview

This document establishes consistent naming conventions across the FlytBase monorepo to ensure code maintainability, readability, and consistency across all modules.

## Core Principles

### 1. Consistency

- Use consistent naming patterns across all layers (database, API, frontend)
- Follow established conventions for each technology stack
- Maintain consistency within each domain and across domains

### 2. Clarity

- Names should be descriptive and self-documenting
- Avoid abbreviations unless they are widely understood
- Use full words over shortened versions when possible

### 3. Predictability

- Follow established patterns so developers can predict naming
- Use consistent prefixes and suffixes
- Maintain logical hierarchies in naming

## Technology-Specific Conventions

### MongoDB Collections and Fields

**Collection Names:**

- Use `camelCase` for collection names
- Use plural nouns for collections
- Examples: `users`, `projects`, `tasks`, `notifications`

**Field Names:**

- Use `camelCase` for all field names
- Use descriptive names that indicate purpose
- Examples: `createdAt`, `updatedAt`, `parentId`, `userId`

**ObjectId References:**

- Use `Id` suffix for ObjectId references
- Examples: `userId`, `projectId`, `createdBy`, `assignedTo`

**Timestamps:**

- Use `createdAt` and `updatedAt` for audit fields
- Use `At` suffix for timestamp fields
- Examples: `startedAt`, `completedAt`, `expiredAt`

### REST API Conventions

**Route Naming:**

- Use `kebab-case` for all API routes
- Use plural nouns for resource endpoints
- Use clear hierarchical structure

```
/api/v1/module-name/resources
/api/v1/module-name/sub-resources
/api/v1/user-management/users
/api/v1/project-management/projects
/api/v1/task-management/tasks
```

**HTTP Methods:**

- `GET` for retrieval operations
- `POST` for creation operations
- `PUT` for full updates
- `PATCH` for partial updates
- `DELETE` for deletion operations

**Query Parameters:**

- Use `camelCase` for query parameters
- Use descriptive names for filters
- Examples: `userId`, `projectId`, `status`, `pageSize`

### JSON/TypeScript Conventions

**Interface Names:**

- Use `PascalCase` for interface names
- Use descriptive names that indicate purpose
- Examples: `User`, `Project`, `Task`, `Notification`

**Property Names:**

- Use `camelCase` for all properties
- Use descriptive names that indicate purpose
- Examples: `userId`, `projectId`, `createdAt`, `metadata`

**Enum Names:**

- Use `PascalCase` for enum names
- Use `SCREAMING_SNAKE_CASE` for enum values
- Examples: `UserStatus.ACTIVE`, `ProjectType.INTERNAL`

**Type Names:**

- Use `PascalCase` for type names
- Use descriptive names with appropriate suffixes
- Examples: `CreateUserRequest`, `ProjectListResponse`, `ValidationResult`

## Domain-Specific Patterns

### Hierarchical Data Structure

**Common Hierarchy Pattern:**

```
Organization → Project → Task
User → Team → Permission
Category → Subcategory → Item
```

**Relationship Fields:**

- Use consistent naming for parent-child relationships
- Use `parentId` for direct parent reference
- Use domain-specific prefixes when needed (e.g., `teamId`, `projectId`)

**Hierarchy Examples:**

```typescript
// Root-level category
{
  id: "category1",
  name: "Main Category",
  parentId: null
}

// Nested subcategory
{
  id: "subcategory1",
  name: "Subcategory A",
  parentId: "category1"
}

// Item in category
{
  id: "item1",
  name: "Sample Item",
  categoryId: "subcategory1"
}
```

### Tags and Metadata

**Tags:**

- Use `tags` array for categorization and filtering
- Use lowercase with hyphens for tag values
- Examples: `["high-priority", "in-progress", "external"]`

**Metadata:**

- Use `metadata` object for extensible properties
- Use `camelCase` for metadata keys
- Examples: `{ customFields: {...}, processingStatus: "complete" }`

## File and Directory Conventions

### Directory Structure

- Use `kebab-case` for directory names
- Use descriptive names that indicate purpose
- Group related files in logical directories

### File Naming

- Use `kebab-case` for file names
- Use appropriate extensions (.ts, .tsx, .md, etc.)
- Use descriptive names that indicate purpose

**Examples:**

```
src/features/user-management/
src/features/project-dashboard/
src/shared/components/
docs/module-name/
```

### Component Files

- Use `PascalCase` for component file names
- Match component name to file name
- Use `.tsx` extension for React components

**Examples:**

```
UserForm.tsx
ProjectTreeComponent.tsx
DashboardView.tsx
```

## Import and Export Conventions

### Import Paths

- Use `@libs/` notation for shared libraries
- Use relative paths for local imports
- Group imports logically (external, internal, relative)

**Examples:**

```typescript
// External imports
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal shared imports
import { Button } from '@libs/shared/ui/fb-components';
import { User } from '@libs/shared/types';

// Relative imports
import { useUserCrud } from '../hooks/useUserCrud';
```

### Export Patterns

- Use named exports for components and utilities
- Use default exports sparingly
- Create barrel exports (index.ts) for clean imports

## Database Schema Conventions

### Collection Design

- Use `camelCase` for collection names
- Use plural nouns for collection names
- Design for query efficiency

### Index Naming

- Use descriptive names for indexes
- Include field names in index names
- Use consistent prefixes

**Examples:**

```
users_email_1
projects_userId_status_1
tasks_projectId_assignedTo_1
```

### Relationship Fields

- Use consistent naming for foreign key references
- Always include the referenced collection name
- Use `Id` suffix for ObjectId references

## Error Handling Conventions

### Error Codes

- Use `SCREAMING_SNAKE_CASE` for error codes
- Use descriptive names that indicate error type
- Group by domain/module

**Examples:**

```
USER_NOT_FOUND
INVALID_PARENT_ID
ACCESS_DENIED
VALIDATION_FAILED
```

### Error Messages

- Use clear, user-friendly messages
- Include relevant context
- Avoid technical jargon in user-facing messages

## Validation Conventions

### Field Validation

- Use consistent validation patterns
- Provide clear error messages
- Validate at appropriate layers

### Schema Validation

- Use consistent schema patterns
- Include appropriate constraints
- Document validation rules

## Examples

### Complete Entity Example

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  teamId: string;
  organizationId: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  tags: string[];
  preferences: {
    theme?: string;
    notifications?: boolean;
    language?: string;
    timezone?: string;
    customFields?: Record<string, any>;
  };
  permissions: {
    modules?: string[];
    actions?: string[];
    restrictions?: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

### Complete API Route Example

```
GET /api/v1/user-management/users?teamId=team1&organizationId=org1&status=active&pageSize=50
```

### Complete Database Collection Example

```javascript
// Collection: users
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john.doe@example.com",
  teamId: ObjectId("..."),
  organizationId: ObjectId("..."),
  role: "developer",
  status: "active",
  profile: {
    firstName: "John",
    lastName: "Doe",
    avatar: "https://example.com/avatar.jpg",
    bio: "Software developer with 5 years experience"
  },
  tags: ["senior", "full-stack", "team-lead"],
  preferences: {
    theme: "dark",
    notifications: true,
    language: "en",
    timezone: "UTC",
    customFields: {
      workingHours: "9-5",
      location: "Remote"
    }
  },
  permissions: {
    modules: ["projects", "tasks", "reports"],
    actions: ["create", "read", "update", "delete"],
    restrictions: ["admin-only-features"]
  },
  createdAt: "2023-01-15T10:30:00Z",
  updatedAt: "2023-01-15T10:30:00Z",
  createdBy: ObjectId("...")
}
```

## Migration Guidelines

### Updating Existing Code

1. Update field names to follow camelCase convention
2. Update API routes to use kebab-case
3. Update component imports to use @libs notation
4. Update database schemas to use camelCase fields
5. Update interface definitions to match new conventions
6. Replace domain-specific examples with generic patterns

### Backward Compatibility

- Plan migration strategy for existing data
- Provide migration scripts where necessary
- Document breaking changes
- Maintain API versioning during transitions

## Enforcement

### Code Review

- Verify naming conventions in code reviews
- Use linting rules to enforce conventions
- Provide feedback on naming inconsistencies

### Automated Checks

- Use ESLint rules for TypeScript/JavaScript
- Use database migration validators
- Use API contract validation

### Documentation

- Keep this document updated
- Provide examples for new patterns
- Document exceptions and rationale

This document serves as the foundation for consistent naming across the FlytBase monorepo. All modules and applications should follow these conventions to ensure maintainability and consistency across the entire codebase.
