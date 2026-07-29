# Keyboard Shortcuts Integration

## Overview

Add global keyboard shortcut handling using KeyboardContext provider.

## Reference App

**mission-planner** - Extensive keyboard shortcuts for mission editing

## Quick Setup

### 1. Create KeyboardContext

**File**: `src/contexts/KeyboardContext.tsx`

Copy from: `apps/mission-planner/src/contexts/KeyboardContext.tsx`

### 2. Add to App.tsx Provider Hierarchy

```typescript
<HttpProvider>
  <KeyboardProvider>
    {' '}
    {/* Add here */}
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  </KeyboardProvider>
</HttpProvider>
```

### 3. Define Shortcuts Config

**File**: `src/config/keyboard-shortcuts.ts`

```typescript
export const KEYBOARD_SHORTCUTS = {
  SAVE: { key: 's', ctrl: true },
  CANCEL: { key: 'Escape' },
  DELETE: { key: 'Delete' },
};
```

### 4. Use in Components

```typescript
import { useKeyboard } from '@/contexts/KeyboardContext';

function MyComponent() {
  const { registerShortcut } = useKeyboard();

  useEffect(() => {
    const unregister = registerShortcut({
      key: 's',
      ctrl: true,
      callback: () => handleSave(),
    });

    return unregister;
  }, []);
}
```

## Files to Copy

1. `apps/mission-planner/src/contexts/KeyboardContext.tsx` → `src/contexts/`
2. `apps/mission-planner/src/config/keyboard-shortcuts.ts` → `src/config/`

## Common Patterns

- Use Ctrl/Cmd for primary actions
- Use Esc for cancel/close
- Use event.preventDefault() to avoid browser conflicts
- Show keyboard hints in UI tooltips
