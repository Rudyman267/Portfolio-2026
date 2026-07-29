# Utility Functions

This directory contains reusable utility functions and helpers.

## Structure

Organize utilities by purpose:

```
utils/
├── date.utils.ts       - Date formatting and manipulation
├── string.utils.ts     - String helpers
├── validation.utils.ts - Validation functions
├── format.utils.ts     - Data formatting
└── dom.utils.ts        - DOM manipulation helpers
```

## Example

```typescript
// utils/date.utils.ts
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD'): string => {
  // Implementation
  return formattedDate;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
```

```typescript
// utils/validation.utils.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

## Best Practices

- Keep functions pure (no side effects)
- Add TypeScript types for all parameters and return values
- Write unit tests for complex utilities
- Document parameters and return values
- Group related functions in the same file
