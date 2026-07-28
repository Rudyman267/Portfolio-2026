# How to Create Components

## Overview

This guide explains how to create React components following FlytBase standards and best practices.

## Reference App

**mission-planner** - Extensive component library with complex UI patterns

## Component Structure

### Basic Component Template

**File**: `src/components/MyComponent/MyComponent.tsx`

```typescript
/**
 * MyComponent Component
 *
 * Brief description of what this component does.
 *
 * @example
 * <MyComponent title="Hello" onClose={() => {}} />
 */

import React from 'react';

interface MyComponentProps {
  /**
   * The title to display
   */
  title: string;

  /**
   * Optional subtitle
   */
  subtitle?: string;

  /**
   * Callback when component is closed
   */
  onClose?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, subtitle, onClose, className = '' }) => {
  return (
    <div className={`bg-background-level-1 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="fb-h2 text-text-1">{title}</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-surface rounded transition-colors">
            <i className="fa-solid fa-xmark text-text-2"></i>
          </button>
        )}
      </div>

      {subtitle && <p className="fb-body-3 text-text-2">{subtitle}</p>}
    </div>
  );
};

export default MyComponent;
```

### Component with State

```typescript
import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
  onValueChange?: (value: number) => void;
}

const Counter: React.FC<CounterProps> = ({ initialValue = 0, onValueChange }) => {
  const [count, setCount] = useState(initialValue);

  const handleIncrement = () => {
    const newValue = count + 1;
    setCount(newValue);
    onValueChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = count - 1;
    setCount(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className="flex items-center gap-3 bg-background-level-1 rounded-lg p-3">
      <button onClick={handleDecrement} className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-surface-hover rounded transition-colors">
        <i className="fa-solid fa-minus text-text-1"></i>
      </button>

      <span className="fb-h3 text-text-1 min-w-[3ch] text-center">{count}</span>

      <button onClick={handleIncrement} className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-surface-hover rounded transition-colors">
        <i className="fa-solid fa-plus text-text-1"></i>
      </button>
    </div>
  );
};

export default Counter;
```

### Component with Hooks

```typescript
import React, { useEffect } from 'react';
import { useUserProfile } from '@libs/shared/api-modules';

const UserProfileCard: React.FC = () => {
  const { userProfile, isLoading, error } = useUserProfile();

  useEffect(() => {
    if (userProfile) {
      console.log('User profile loaded:', userProfile);
    }
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <i className="fa-solid fa-spinner fa-spin text-text-2"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container rounded-lg p-3">
        <span className="fb-body-3 text-error-30">Failed to load profile</span>
      </div>
    );
  }

  return (
    <div className="bg-background-level-1 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center">
          <span className="fb-h3 text-white">{userProfile?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <h3 className="fb-body-1 text-text-1">{userProfile?.name}</h3>
          <p className="fb-body-4 text-text-2">{userProfile?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
```

## Design System Integration

### Using FlytBase Colors

```typescript
// Background levels
bg - background; // Main background
bg - background - level - 1; // Slightly elevated
bg - background - level - 2; // More elevated
bg - background - level - 3; // Even more elevated

// Text colors
text - text - 1; // Primary text (84% opacity)
text - text - 2; // Secondary text (54% opacity)
text - text - disabled; // Disabled text (24% opacity)

// Primary colors
bg - primary - 200; // Primary background
text - primary - 200; // Primary text
hover: bg - primary - states - hover;

// Surface (hover states)
bg - surface;
hover: bg - surface - hover;

// Borders
border - outline - primary; // Primary border (12% opacity)
border - outline - secondary; // Secondary border (8% opacity)
```

### Using FontAwesome Icons

```typescript
// Import not needed - FontAwesome is globally available

// Solid icons
<i className="fa-solid fa-user"></i>
<i className="fa-solid fa-gear"></i>
<i className="fa-solid fa-xmark"></i>
<i className="fa-solid fa-check"></i>

// Regular icons
<i className="fa-regular fa-heart"></i>

// Light icons
<i className="fa-light fa-star"></i>

// Icon sizing
text-xs    // Extra small
text-sm    // Small
text-base  // Base size
text-lg    // Large
text-xl    // Extra large
```

### Using Typography

```typescript
// Headings
fb - h1, fb - h2, fb - h3, fb - h4, fb - h5, fb - h6;

// Body text
fb - body - 1; // Regular body (16px)
fb - body - 2; // Regular body (14px)
fb - body - 3; // Regular body (13px)
fb - body - 4; // Regular body (12px)
fb - body - 5; // Medium weight (14px)
fb - body - 6; // Medium weight (12px)
```

## Component Organization

```
src/components/
├── MyFeature/
│   ├── MyFeature.tsx           → Main component
│   ├── components/             → Sub-components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── hooks/                  → Feature-specific hooks
│   │   └── useMyFeature.ts
│   ├── types.ts                → Type definitions
│   └── __tests__/              → Tests
│       └── MyFeature.test.tsx
```

## Best Practices

1. **Always use TypeScript** - Define proper interfaces for props
2. **Document components** - Add JSDoc comments explaining purpose and usage
3. **Use FlytBase design tokens** - Don't hardcode colors or spacing
4. **Make components reusable** - Accept className prop for customization
5. **Handle loading and error states** - Always show appropriate feedback
6. **Use semantic HTML** - Choose appropriate elements for accessibility
7. **Add ARIA labels** - For icons and interactive elements
8. **Memoize expensive computations** - Use useMemo and useCallback when needed
9. **Keep components focused** - Single responsibility principle
10. **Export named exports** - Avoid default exports for better tree-shaking

## Common Patterns

### Button Component

```typescript
<button className="bg-primary-200 hover:bg-primary-states-hover text-white fb-body-2 px-4 py-2 rounded-lg transition-colors">
  <i className="fa-solid fa-plus mr-2"></i>
  Add Item
</button>
```

### Card Component

```typescript
<div className="bg-background-level-1 rounded-lg border border-outline-primary p-4">
  <h3 className="fb-h3 text-text-1 mb-2">Card Title</h3>
  <p className="fb-body-3 text-text-2">Card content</p>
</div>
```

### Input Component

```typescript
<div className="flex flex-col gap-1.5">
  <label className="fb-body-5 text-text-1">Username</label>
  <input type="text" className="bg-background-level-2 border border-outline-primary rounded-lg px-3 py-2 fb-body-2 text-text-1 focus:border-primary-200 outline-none" placeholder="Enter username" />
</div>
```
