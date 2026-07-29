# Shared Keyboard Infrastructure

A unified keyboard event system for the FlytBase platform, providing coordinated keyboard input handling across the map library and application layer.

## Features

- ✅ **Single Window Listener** - One global keyboard listener instead of multiple fragmented listeners
- ✅ **Priority-Based Handling** - Higher-priority handlers (e.g., map entity controls) process events first
- ✅ **Mark Handled Pattern** - Handlers can mark events as handled to prevent lower-priority handlers from processing
- ✅ **Deduplicated Events** - KEY_DOWN emits once per key press (ignores browser repeat)
- ✅ **Continuous Movement** - KEY_PRESS events at 60 FPS with pressedKeys array
- ✅ **Framework Agnostic** - Works with React, Vue, or vanilla JavaScript
- ✅ **No Dependencies** - Pure keyboard infrastructure, reusable anywhere

## Installation

This library is part of the monorepo. Import from:

```typescript
import { KeyboardManager, KeyboardEventType, KeyboardEventPriority } from '@flytbase/shared/hardware-controls/keyboard';
```

## Quick Start

### 1. Initialize During App Startup

```typescript
// In your main.tsx or App.tsx
import { KeyboardManager } from '@flytbase/shared/hardware-controls/keyboard';

const keyboardManager = KeyboardManager.getInstance({
  debug: false,
  continuousEventFrequencyInMS: 60,
});

keyboardManager.initialize();
```

### 2. Register Event Handlers

```typescript
import { KeyboardEventType, KeyboardEventPriority } from '@flytbase/shared/hardware-controls/keyboard';

// Register with priority
const unsubscribe = keyboardManager.eventBus.register(
  KeyboardEventType.KEY_DOWN,
  (event) => {
    console.log('Key pressed:', event.key);

    if (shouldHandle(event)) {
      event.markHandled(); // Stop propagation to lower priority
      event.preventDefault(); // Prevent browser default
    }
  },
  KeyboardEventPriority.HIGH,
  'MyComponent'
);

// Cleanup when done
unsubscribe();
```

### 3. Handle Continuous Movement

```typescript
keyboardManager.eventBus.register(
  KeyboardEventType.KEY_PRESS,
  (event) => {
    // Get pressed keys and delta time from event
    const pressedKeys = (event as any).pressedKeys; // ['w', 'd']
    const deltaTime = (event as any).deltaTime; // 0.016

    // Calculate movement
    const movement = calculateMovement(pressedKeys, deltaTime);
    updatePosition(movement);
  },
  KeyboardEventPriority.HIGH
);
```

## API Reference

### KeyboardManager

Singleton that manages the global keyboard listener and coordinates event distribution.

```typescript
class KeyboardManager {
  static getInstance(config?: KeyboardManagerConfig): KeyboardManager;
  static resetInstance(): void;

  initialize(): void;
  dispose(): void;

  readonly eventBus: KeyboardEventBus;
  readonly stateTracker: KeyboardStateTracker;

  getConfig(): Required<KeyboardManagerConfig>;
  updateConfig(config: Partial<KeyboardManagerConfig>): void;
}
```

### KeyboardEventBus

Priority-based event distribution system.

```typescript
class KeyboardEventBus {
  register(eventType: KeyboardEventType, handler: (event: IKeyboardEvent) => void, priority?: number, context?: string): () => void; // Returns unsubscribe function

  emitKeyboardEvent(eventType: KeyboardEventType, event: IKeyboardEvent): void;
}
```

### KeyboardStateTracker

Tracks currently pressed keys.

```typescript
class KeyboardStateTracker {
  keyDown(key: string): void;
  keyUp(key: string): void;

  isKeyPressed(key: string): boolean;
  getPressedKeys(): string[];
  getPressedKeyCount(): number;

  clear(): void;
}
```

## Event Types

### KEY_DOWN

- Emitted ONCE per key press (deduplication of browser repeat)
- Use for discrete actions (e.g., toggle, trigger)

### KEY_UP

- Emitted when key is released

### KEY_PRESS

- Emitted at 60 FPS while keys are held
- Includes `pressedKeys: string[]` array
- Includes `deltaTime: number` for frame-independent movement
- Use for continuous movement

## Priority Levels

```typescript
enum KeyboardEventPriority {
  HIGHEST = 1000, // Critical system handlers
  HIGH = 500, // Map entity controls
  NORMAL = 100, // App-level shortcuts
  LOW = 50, // Global shortcuts
  LOWEST = 0, // Fallback handlers
}
```

## Examples

### Example: Map Entity Control

```typescript
// Map registers with HIGH priority
keyboardManager.eventBus.register(
  KeyboardEventType.KEY_DOWN,
  (event) => {
    if (entityFocused && isMovementKey(event.key)) {
      event.markHandled();
      event.preventDefault();
      // Handle entity movement
    }
  },
  KeyboardEventPriority.HIGH,
  'MapLibrary'
);
```

### Example: Application Shortcuts

```typescript
// App registers with NORMAL priority (lower than map)
keyboardManager.eventBus.register(
  KeyboardEventType.KEY_DOWN,
  (event) => {
    // If map already handled it, skip
    if (event.handled) return;

    if (event.key === 'f') {
      event.markHandled();
      addPhotoAction();
    }
  },
  KeyboardEventPriority.NORMAL,
  'MissionPlanner'
);
```

## Architecture

```
┌────────────────────────────────────────────┐
│  App Initialization                        │
│  KeyboardManager.getInstance().initialize()│
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│  KeyboardManager (Singleton)               │
│  • Single window keydown/keyup listener    │
│  • Deduplicates KEY_DOWN events            │
│  • Emits KEY_PRESS at 60 FPS                │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│  KeyboardEventBus (Priority Distribution)  │
│  • Sorts handlers by priority              │
│  • Stops on markHandled()                  │
└────────────────────────────────────────────┘
          ↓                    ↓
┌────────────────┐    ┌────────────────┐
│ Map (HIGH)     │    │ App (NORMAL)   │
│ Priority: 500  │    │ Priority: 100  │
└────────────────┘    └────────────────┘
```

## Best Practices

1. **Initialize Once**: Call `initialize()` once during app startup
2. **Use Priorities**: Map controls = HIGH, app shortcuts = NORMAL
3. **Mark Handled**: Call `event.markHandled()` to stop propagation
4. **Cleanup**: Always call the unsubscribe function returned by `register()`
5. **Type Guards**: Use `isKeyboardPressEvent()` for KEY_PRESS events

## License

Internal FlytBase library - Not for external distribution
