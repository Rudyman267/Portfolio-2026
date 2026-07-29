# Shared Keyboard Infrastructure Architecture

**Version**: 1.2  
**Date**: January 13, 2026  
**Status**: Design Approved - Ready for Implementation  
**Last Updated**: January 13, 2026 - Replaced requestAnimationFrame with setInterval for predictable timing

---

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Architecture](#architecture)
4. [Library Structure](#library-structure)
5. [Integration Flow](#integration-flow)
6. [Component Details](#component-details)
7. [Event Flow Diagrams](#event-flow-diagrams)
8. [Implementation Guide](#implementation-guide)
9. [Migration Strategy](#migration-strategy)
10. [Testing Strategy](#testing-strategy)

---

## ⚡ Quick Reference: What's New in v1.1

### Core Improvements

| Feature | v1.0 | v1.1 (Current) |
|---------|------|----------------|
| **KEY_DOWN Events** | Multiple events (browser repeat) | ✅ ONE event per key (deduplicated) |
| **Loop Trigger** | `isMovementKeyPressed()` | ✅ `pressedKeyCount > 0` (cleaner) |
| **KEY_PRESS Data** | No pressedKeys array | ✅ Includes `pressedKeys: string[]` |
| **Key Bindings** | Hardcoded strings | ✅ Enum-based (`MapKeyboardKey`) |
| **Consumer Pattern** | Query stateTracker | ✅ Get data from event |

### Code Impact

**Before (v1.0)**:
```typescript
// Multiple KEY_DOWN events for same key (browser repeat)
handleKeyDown() { /* ... */ } // Fires 10+ times while held

// Query state tracker
const keys = keyboardManager.stateTracker.getPressedKeys();

// Hardcoded keys
if (key === 'w') { /* ... */ }
```

**After (v1.1)**:
```typescript
// ONE KEY_DOWN event per key (deduplicated)
handleKeyDown() { /* ... */ } // Fires ONCE on initial press

// Get from event
const keys = event.pressedKeys; // In KEY_PRESS handler

// Enum-based keys
if (key === MapKeyboardKey.MOVE_NORTH) { /* ... */ }
```

### Migration Path

✅ **Backward Compatible** - Existing code continues to work  
✅ **Opt-In** - New features are additions, not breaking changes  
✅ **Recommended** - Update to v1.1 patterns for cleaner code

---

## Overview

### Purpose

This document defines the architecture for a **shared keyboard infrastructure** that coordinates keyboard input across the FlytBase platform. The system provides a unified event bus that both the map library and application layer can consume, eliminating conflicts between multiple keyboard listeners and enabling priority-based event handling.

### Goals

- **Single Window Listener**: One global keyboard listener instead of multiple fragmented listeners
- **Priority-Based Handling**: Higher-priority handlers (e.g., map entity controls) process events first
- **Mark Handled Pattern**: Handlers can mark events as handled to prevent lower-priority handlers from processing
- **Reusable Infrastructure**: Pure keyboard state tracking, usable across any application
- **Clean Integration**: Map library and apps integrate without conflicts
- **Zero Breaking Changes**: Mission Planner keyboard-command-bus adapts to use new infrastructure

### Key Features

✅ Unified keyboard event system  
✅ Numeric priority-based event routing  
✅ Shared state tracking for continuous movement  
✅ Map-specific focus management  
✅ Clean separation: shared infrastructure vs. map-specific logic  
✅ Framework-agnostic design  
✅ Opt-in for map library (default: disabled)  
✅ **Deduplicated KEY_DOWN events** (ignores browser repeat)  
✅ **Enum-based key bindings** for type safety and easy configuration  
✅ **pressedKeys array** in KEY_PRESS events for comprehensive key state

---

## Design Principles

### 1. Separation of Concerns

**Shared Library (`libs/shared/hardware-controls/keyboard`):**
- Pure keyboard event infrastructure
- Window listener management
- Event distribution via priority bus
- Key state tracking (which keys are pressed)
- **NO** map-specific logic
- **NO** Cesium dependencies

**Map Library (`libs/shared/map`):**
- Entity focus management (map concept)
- Movement calculation (WASD → vector)
- Keyboard-to-map-event bridging
- Entity keyboard control logic

**Application (`apps/mission-planner`):**
- Command routing (keyboard-command-bus)
- Application shortcuts
- UI-specific keyboard handlers

### 2. Dependency Direction

```
┌─────────────────────────────────────┐
│  Shared Keyboard Infrastructure    │  ← Pure, reusable
│  (libs/shared/hardware-controls)    │
└─────────────────────────────────────┘
          ↑                 ↑
          │                 │
          │                 │
┌─────────────────┐  ┌─────────────────┐
│  Map Library    │  │  Application    │
│  (optional)     │  │  (consumes)     │
└─────────────────┘  └─────────────────┘
```

### 3. Opt-In Architecture

- Shared keyboard library can work **standalone** (no map required)
- Map library can work **without keyboard** (default: disabled)
- Application initializes keyboard infrastructure
- Map library receives keyboard manager via bootstrap options

---

## Architecture

### High-Level Component Diagram

```
┌────────────────────────────────────────────────────────────────┐
│  App Initialization (main.tsx)                                 │
│  ├─ Initialize KeyboardManager                                 │
│  ├─ Bootstrap Map Library (optional keyboard)                  │
│  └─ Initialize App Keyboard Handlers                           │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│  libs/shared/hardware-controls/keyboard/                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  KeyboardManager (Singleton)                             │ │
│  │  • Single window keydown/keyup listener                  │ │
│  │  • Continuous event loop (setInterval)                   │ │
│  │  • Manages lifecycle                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  KeyboardEventBus                                        │ │
│  │  • Priority-based event routing (numeric)                │ │
│  │  • Sorted listener execution (highest → lowest)          │ │
│  │  • Stop propagation on markHandled()                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  KeyboardStateTracker                                    │ │
│  │  • Track pressed keys (Set<string>)                      │ │
│  │  • Query key state (isKeyPressed)                        │ │
│  │  • Get all pressed keys                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                            ↓
          ┌─────────────────┴─────────────────┐
          ↓                                   ↓
┌─────────────────────────┐       ┌──────────────────────────┐
│  Map Library            │       │  Application             │
│  Priority: 500 (HIGH)   │       │  Priority: 100 (NORMAL)  │
│                         │       │                          │
│  CesiumEventsManager    │       │  keyboard-command-bus    │
│  ├─ Focus Manager       │       │  ├─ Command routing      │
│  ├─ Movement Calculator │       │  ├─ App shortcuts        │
│  └─ Entity events       │       │  └─ Component handlers   │
└─────────────────────────┘       └──────────────────────────┘
```

### Event Priority Model

```
Priority Value | Handler Type          | Examples
---------------|-----------------------|---------------------------
1000+          | HIGHEST (system)      | Debug tools, dev overrides
500            | HIGH (map controls)   | Entity movement (WASD)
100            | NORMAL (app)          | Mission planner shortcuts
50             | LOW (global)          | Help menu, global actions
0              | LOWEST (fallback)     | Default handlers
```

**Rule**: Higher priority runs first. If `event.markHandled()` is called, lower-priority handlers are skipped.

---

## Library Structure

### File Organization

```
libs/shared/hardware-controls/
└── keyboard/
    ├── src/
    │   ├── index.ts                          # Public exports
    │   ├── keyboard-manager.ts               # Singleton manager
    │   ├── keyboard-event-bus.ts             # Priority-based event bus
    │   ├── keyboard-state-tracker.ts         # Key state tracking
    │   └── types/
    │       ├── keyboard-events.ts            # Event type definitions
    │       └── keyboard-config.ts            # Configuration types
    ├── README.md                             # Usage documentation
    ├── project.json                          # Nx configuration
    ├── tsconfig.json                         # TypeScript config
    └── tsconfig.lib.json                     # Library-specific tsconfig
```

### Public API

```typescript
// libs/shared/hardware-controls/keyboard/src/index.ts

export { KeyboardManager } from './keyboard-manager';
export { KeyboardEventBus } from './keyboard-event-bus';
export { KeyboardStateTracker } from './keyboard-state-tracker';

export * from './types/keyboard-events';
export * from './types/keyboard-config';
```

---

## Integration Flow

### 1. App Initialization

**File**: `apps/mission-planner/src/main.tsx`

```typescript
import { KeyboardManager } from '@flytbase/shared/hardware-controls/keyboard';
import { bootstrapMapLibrary } from '@flytbase/shared/map';
import { initializeMissionPlannerKeyboardHandlers } from './hooks/keyboard/keyboard-command-bus';

// Step 1: Initialize shared keyboard infrastructure
const keyboardManager = KeyboardManager.getInstance({
  debug: process.env.NODE_ENV === 'development',
  continuousEventFrequencyInMS: 60,
  ignoreTargetSelectors: ['INPUT', 'TEXTAREA', '[contenteditable="true"]'],
});

// Attach window listener
keyboardManager.initialize();

// Step 2: Bootstrap map library with keyboard support
bootstrapMapLibrary({
  enableKeyboardControls: true,           // Opt-in (default: false)
  keyboardManager: keyboardManager,       // Pass instance
  cesiumApiKey: process.env.CESIUM_KEY,
  // ... other options
});

// Step 3: Initialize app-level keyboard handlers
initializeMissionPlannerKeyboardHandlers(keyboardManager);

// Step 4: Render app
ReactDOM.render(<App />, document.getElementById('root'));
```

**Key Points**:
- App controls when keyboard manager initializes
- Map library is optional consumer
- App keyboard handlers registered after map

---

### 2. Map Library Bootstrap

**File**: `libs/shared/map/src/runtime/bootstrap.ts`

```typescript
import { KeyboardManager } from '@flytbase/shared/hardware-controls/keyboard';

export interface BootstrapOptions {
  // ... existing options
  
  /**
   * Enable keyboard controls for map entities
   * Default: false (opt-in)
   */
  enableKeyboardControls?: boolean;
  
  /**
   * Keyboard manager instance (required if enableKeyboardControls is true)
   */
  keyboardManager?: KeyboardManager;
}

export function bootstrapMapLibrary(options: BootstrapOptions): BootstrapResult {
  const config: Required<BootstrapOptions> = {
    enableKeyboardControls: false, // Default: disabled
    keyboardManager: null,
    ...options,
  };

  // Validate keyboard options
  if (config.enableKeyboardControls && !config.keyboardManager) {
    throw new Error(
      '[MapLibrary] enableKeyboardControls requires keyboardManager instance. ' +
      'Initialize KeyboardManager.getInstance() and pass it in bootstrap options.'
    );
  }

  // Store in runtime context
  const runtimeContext = {
    // ... existing context
    keyboardManager: config.enableKeyboardControls 
      ? config.keyboardManager 
      : null,
  };

  // Store in global context
  setRuntimeContext(runtimeContext);

  // ... rest of bootstrap logic

  return {
    success: true,
    context: runtimeContext,
  };
}
```

---

### 3. Map Provider Factory

**File**: `libs/shared/map/src/private/map-providers/cesium/cesium-map-provider.ts`

```typescript
import { getRuntimeContext } from '../../../runtime';

export class CesiumMapProvider implements IMapProvider {
  private viewer: Viewer;
  private eventsManager: CesiumEventsManager;

  constructor(config: CesiumMapConfig) {
    // Create Cesium viewer
    this.viewer = new Viewer(config.containerId, {
      // ... cesium options
    });

    // Get runtime context
    const runtimeContext = getRuntimeContext();

    // Create events manager with optional keyboard support
    this.eventsManager = new CesiumEventsManager(
      this.viewer,
      runtimeContext.keyboardManager // null if keyboard disabled
    );

    // ... rest of initialization
  }

  // ... rest of provider implementation
}
```

---

### 4. CesiumEventsManager Integration

**File**: `libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts`

```typescript
import { 
  KeyboardManager, 
  KeyboardEventType, 
  IKeyboardEvent 
} from '@flytbase/shared/hardware-controls/keyboard';
import { KeyboardFocusManager } from './keyboard-focus-manager';
import { MovementCalculator } from './movement-calculator';

export class CesiumEventsManager implements IEventsManager {
  private viewer: Viewer;
  private keyboardManager: KeyboardManager | null;
  
  // Map-specific keyboard infrastructure
  private keyboardFocusManager: KeyboardFocusManager | null = null;
  private movementCalculator: MovementCalculator | null = null;
  
  // Unsubscribe functions
  private keyboardUnsubscribers: Array<() => void> = [];

  constructor(viewer: Viewer, keyboardManager: KeyboardManager | null) {
    this.viewer = viewer;
    this.keyboardManager = keyboardManager;

    // Initialize mouse events (always enabled)
    this.initializeMouseEvents();

    // Initialize keyboard events (only if keyboard manager provided)
    if (this.keyboardManager) {
      this.initializeKeyboardEvents();
    }
  }

  /**
   * Initialize keyboard event handlers
   * Registers with HIGH priority (500) on shared keyboard bus
   */
  private initializeKeyboardEvents(): void {
    if (!this.keyboardManager) return;

    console.log('[CesiumEventsManager] Initializing keyboard controls');

    // Create map-specific managers
    this.keyboardFocusManager = new KeyboardFocusManager();
    this.movementCalculator = new MovementCalculator();

    // Register for KEY_DOWN events (HIGH priority: 500)
    const unsubKeyDown = this.keyboardManager.eventBus.register(
      KeyboardEventType.KEY_DOWN,
      (event: IKeyboardEvent) => this.handleKeyDown(event),
      500, // HIGH priority (map controls)
      'CesiumEventsManager'
    );

    // Register for KEY_UP events (HIGH priority: 500)
    const unsubKeyUp = this.keyboardManager.eventBus.register(
      KeyboardEventType.KEY_UP,
      (event: IKeyboardEvent) => this.handleKeyUp(event),
      500, // HIGH priority
      'CesiumEventsManager'
    );

    // Register for KEY_PRESS events (continuous movement)
    const unsubKeyPress = this.keyboardManager.eventBus.register(
      KeyboardEventType.KEY_PRESS,
      (event: IKeyboardEvent) => this.handleContinuousMovement(event),
      500, // HIGH priority
      'CesiumEventsManager'
    );

    // Store unsubscribers for cleanup
    this.keyboardUnsubscribers.push(unsubKeyDown, unsubKeyUp, unsubKeyPress);
  }

  /**
   * Handle KEY_DOWN event
   * Only handles if:
   * 1. Entity has keyboard focus
   * 2. Key is a movement key (WASD, ZC, QE)
   */
  private handleKeyDown(event: IKeyboardEvent): void {
    const focusedEntityId = this.keyboardFocusManager?.getFocusedEntity();

    // Check if we should handle this key
    if (focusedEntityId && this.isMovementKey(event.key)) {
      // Mark as handled (prevents app from processing)
      event.markHandled();
      event.preventDefault();

      // Emit map-specific event to focused entity
      this.emitEntityEvent(CesiumEventType.KEY_DOWN, focusedEntityId, {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        timestamp: event.timestamp,
      });

      return;
    }

    // Special: Escape clears focus
    if (event.key === 'Escape' && focusedEntityId) {
      event.markHandled();
      event.preventDefault();
      this.keyboardFocusManager?.clearFocus();
      return;
    }

    // If not handled, event continues to lower priority handlers (app)
  }

  /**
   * Handle KEY_UP event
   */
  private handleKeyUp(event: IKeyboardEvent): void {
    const focusedEntityId = this.keyboardFocusManager?.getFocusedEntity();

    if (focusedEntityId && this.isMovementKey(event.key)) {
      event.markHandled();
      event.preventDefault();

      this.emitEntityEvent(CesiumEventType.KEY_UP, focusedEntityId, {
        key: event.key,
        timestamp: event.timestamp,
      });
    }
  }

  /**
   * Handle continuous movement (KEY_PRESS) - v1.1
   * Emitted 60 times per second while ANY keys held
   */
  private handleContinuousMovement(event: IKeyboardEvent): void {
    const focusedEntityId = this.keyboardFocusManager?.getFocusedEntity();

    if (!focusedEntityId) return;

    // ✅ NEW v1.1: Get pressed keys from event (not stateTracker!)
    // pressedKeys array is included in KEY_PRESS events
    const pressedKeys = (event as any).pressedKeys as string[];
    const deltaTime = (event as any).deltaTime as number;

    // Or use type guard (recommended):
    // if (isKeyboardPressEvent(event)) {
    //   const pressedKeys = event.pressedKeys;
    //   const deltaTime = event.deltaTime;
    // }

    // Calculate movement vector (map-specific logic)
    const movementVector = this.movementCalculator!.calculateMovement(pressedKeys);

    // No movement? Skip
    if (movementVector.x === 0 && 
        movementVector.y === 0 && 
        movementVector.z === 0 && 
        movementVector.rotation === 0) {
      return;
    }

    // Mark as handled
    event.markHandled();

    // Emit continuous movement event to focused entity
    this.emitEntityEvent(CesiumEventType.KEY_PRESS, focusedEntityId, {
      movementVector,
      deltaTime,
      pressedKeys,
      timestamp: event.timestamp,
    });
  }

  /**
   * Check if key is a movement key - v1.1
   * Uses enum-based helper for type safety
   */
  private isMovementKey(key: string): boolean {
    return isMovementKey(key); // Use centralized enum-based function
  }

  /**
   * Public API: Set keyboard focus to an entity
   */
  setKeyboardFocus(entityId: string | null): void {
    this.keyboardFocusManager?.setFocus(entityId);
  }

  /**
   * Public API: Get currently focused entity
   */
  getKeyboardFocusedEntity(): string | null {
    return this.keyboardFocusManager?.getFocusedEntity() || null;
  }

  /**
   * Public API: Check if entity has focus
   */
  hasKeyboardFocus(entityId: string): boolean {
    return this.keyboardFocusManager?.hasFocus(entityId) || false;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    // Unsubscribe from keyboard events
    this.keyboardUnsubscribers.forEach(unsub => unsub());
    this.keyboardUnsubscribers = [];

    // Cleanup map-specific managers
    this.keyboardFocusManager?.clearFocus();
    this.keyboardFocusManager = null;
    this.movementCalculator = null;

    // ... existing cleanup (mouse events, etc.)
  }
}
```

---

### 5. Mission Planner Integration

**File**: `apps/mission-planner/src/hooks/keyboard/keyboard-command-bus.ts`

```typescript
import { 
  KeyboardManager, 
  KeyboardEventType, 
  IKeyboardEvent 
} from '@flytbase/shared/hardware-controls/keyboard';
import EventEmitter from 'eventemitter3';

// Existing command enum and types (NO CHANGES)
export enum KeyboardCommand {
  SELECT_ALL = 'SELECT_ALL',
  CLEAR_SELECTION = 'CLEAR_SELECTION',
  COPY = 'COPY',
  PASTE = 'PASTE',
  DELETE = 'DELETE',
  // ... rest of commands
}

export type KeyboardCommandEvent = {
  handled: boolean;
  markHandled: () => void;
};

// Existing command bus (NO CHANGES)
export const keyboardCommandBus = new EventEmitter<KeyboardCommandEventMap>();

// NEW: Store unsubscribe function
let unsubscribe: (() => void) | null = null;

/**
 * Initialize mission planner keyboard handlers
 * Registers with NORMAL priority (100) on shared keyboard bus
 * 
 * Called from main.tsx after KeyboardManager is initialized
 */
export function initializeMissionPlannerKeyboardHandlers(
  keyboardManager: KeyboardManager
): void {
  console.log('[MissionPlanner] Initializing keyboard handlers');

  // Register with NORMAL priority (lower than map's HIGH 500)
  unsubscribe = keyboardManager.eventBus.register(
    KeyboardEventType.KEY_DOWN,
    (event: IKeyboardEvent) => handleKeyDown(event),
    100, // NORMAL priority (app shortcuts)
    'MissionPlannerApp'
  );
}

/**
 * Handle KEY_DOWN event from shared keyboard manager
 */
function handleKeyDown(event: IKeyboardEvent): void {
  // If map already handled it, skip
  if (event.handled) {
    return;
  }

  // Don't intercept shortcuts when typing in inputs/textareas
  if (event.originalEvent && isTypingTarget(event.originalEvent.target)) {
    return;
  }

  // Convert to native KeyboardEvent for existing logic
  const nativeEvent = event.originalEvent;
  if (!nativeEvent) return;

  // Use existing command resolution logic (NO CHANGES)
  const commands = resolveCommands(nativeEvent);
  if (!commands || !commands.length) return;

  const commandEvent: KeyboardCommandEvent = {
    handled: false,
    markHandled: () => {
      commandEvent.handled = true;
    },
  };

  // Emit to existing command bus (NO CHANGES)
  for (const command of commands) {
    keyboardCommandBus.emit(command, commandEvent);
    if (commandEvent.handled) break;
  }

  // Only prevent default if a consumer explicitly handled this command
  if (commandEvent.handled) {
    event.markHandled(); // Mark for shared system
    event.preventDefault();
  }
}

/**
 * Cleanup keyboard handlers
 */
export function disposeMissionPlannerKeyboardHandlers(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// EXISTING FUNCTIONS (NO CHANGES)
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' || 
    el.tagName === 'TEXTAREA' || 
    el.isContentEditable
  );
}

function resolveCommands(event: KeyboardEvent): KeyboardCommand[] {
  // ... existing implementation (NO CHANGES)
}
```

**Key Points**:
- ✅ Zero changes to `resolveCommands()` logic
- ✅ Zero changes to `keyboardCommandBus` usage
- ✅ Components using `useKeyboardCommands()` need no changes
- ✅ Only adapted to consume shared keyboard manager

---

## Component Details

### KeyboardManager (Shared Library)

**File**: `libs/shared/hardware-controls/keyboard/src/keyboard-manager.ts`

**Responsibilities**:
- Singleton instance management
- Attach/detach window keyboard listener
- Create and distribute `IKeyboardEvent` wrappers
- Track key state via `KeyboardStateTracker`
- **Deduplicate KEY_DOWN events** (ignore browser's native key repeat)
- Run continuous event loop (60 FPS) while ANY keys are held
- Emit KEY_PRESS events with `pressedKeys` array
- Emit events via `KeyboardEventBus`
- Handle focus loss (clear stuck keys)

**Core Logic Changes** (v1.1):
1. ✅ **Deduplication**: KEY_DOWN only emits on FIRST press (ignores browser repeat)
2. ✅ **Simplified Loop Trigger**: Starts when `pressedKeys.size > 0` (any keys, not just movement)
3. ✅ **Enhanced KEY_PRESS**: Includes `pressedKeys: string[]` array for comprehensive state
4. ✅ **Clean Stop**: Loop stops immediately when `pressedKeys.size === 0`

**Key Methods**:
```typescript
class KeyboardManager {
  static getInstance(config?: KeyboardManagerConfig): KeyboardManager
  static resetInstance(): void
  
  initialize(): void
  dispose(): void
  
  readonly eventBus: KeyboardEventBus
  readonly stateTracker: KeyboardStateTracker
  
  getConfig(): Required<KeyboardManagerConfig>
  updateConfig(config: Partial<KeyboardManagerConfig>): void
}
```

**Lifecycle**:
```
getInstance() → initialize() → [active] → dispose()
```

**Core Event Handling Logic** (Pseudocode):

```typescript
/**
 * Handle native keydown event - REVISED WITH DEDUPLICATION AND TIMESTAMP REFRESH
 */
private handleKeyDown(nativeEvent: KeyboardEvent): void {
  // 1. Check if typing in input field
  if (this.shouldIgnoreEvent(nativeEvent)) return;

  // 2. Clean up orphaned keys (keys released without keyup event)
  this.cleanupOrphanedKeys(nativeEvent);

  const key = nativeEvent.key.toLowerCase();
  const hasModifiers = this.hasModifierKeys(nativeEvent);
  const isAlreadyPressed = this.stateTracker.isKeyPressed(key);

  // ✅ NEW: Check if key is ALREADY pressed
  if (isAlreadyPressed) {
    // 🔧 FIX: Refresh timestamp to prevent stale key cleanup
    // Even if we skip the event, the key is actively being pressed
    this.stateTracker.refreshKeyTimestamp(key);

    // 🔧 FIX: Allow key events with modifiers to bypass deduplication
    // This enables repeated Cmd+Backspace, Ctrl+C, etc. to work correctly
    if (!hasModifiers) {
      // No modifiers: This is a browser repeat event, skip it
      this.log(`⏭️  Skipping keydown (already pressed, no modifiers): ${key}`);
      return; // SKIP event emission (no duplicate KEY_DOWN!)
    } else {
      // Has modifiers: Allow the event (user might be repeatedly pressing Cmd+Key)
      this.log(`✨ Re-emitting KEY_DOWN (has modifiers): ${key}`);
      // Continue to emit event below
    }
  } else {
    // New key press
    this.log(`⬇️  KEY_DOWN (new): ${key}`);
  }

  // 3. Track key state (adds to pressedKeys Set if not already there)
  this.stateTracker.keyDown(key);

  // 4. Create wrapped event
  const keyboardEvent = this.createKeyboardEvent(nativeEvent);

  // 5. Emit KEY_DOWN to event bus (ONCE per key press, or with modifiers)
  this.eventBus.emitKeyboardEvent(KeyboardEventType.KEY_DOWN, keyboardEvent);

  // ✅ NEW: Start continuous loop if ANY keys pressed
  if (this.stateTracker.getPressedKeyCount() > 0) {
    this.startContinuousEventLoop();
  }
}

/**
 * Handle native keyup event - REVISED WITH CLEAN STOP
 */
private handleKeyUp(nativeEvent: KeyboardEvent): void {
  if (this.shouldIgnoreEvent(nativeEvent)) return;

  const key = nativeEvent.key.toLowerCase();
  
  // 1. Track key state (removes from pressedKeys Set)
  this.stateTracker.keyUp(key);

  // 2. Create wrapped event
  const keyboardEvent = this.createKeyboardEvent(nativeEvent);

  // 3. Emit KEY_UP to event bus
  this.eventBus.emitKeyboardEvent(KeyboardEventType.KEY_UP, keyboardEvent);

  // ✅ NEW: Stop continuous loop if NO keys are pressed
  if (this.stateTracker.getPressedKeyCount() === 0) {
    this.stopContinuousEventLoop();
    this.log('🛑 All keys released - stopped continuous loop');
  }
}

/**
 * Continuous event loop - REVISED WITH pressedKeys ARRAY AND setInterval
 */
private startContinuousEventLoop(): void {
  if (this.continuousIntervalId !== null) return; // Already running

  let lastEventTime = Date.now();

  const emitContinuousEvent = () => {
    const now = Date.now();
    const deltaTime = (now - lastEventTime) / 1000; // Seconds since last event
    lastEventTime = now;

    // ✅ NEW: Check if ANY keys pressed (not just movement keys)
    const pressedKeyCount = this.stateTracker.getPressedKeyCount();
    
    // Stop loop if no keys pressed
    if (pressedKeyCount === 0) {
      this.stopContinuousEventLoop();
      return;
    }

    // Get all currently pressed keys as array
    const pressedKeys = this.stateTracker.getPressedKeys();

    // ✅ NEW: Create KEY_PRESS event with pressedKeys array
    const keyboardEvent: IKeyboardEvent = {
      key: pressedKeys.join('+'),  // "w+d"
      // ... other fields
      repeat: true,
    };

    // ✅ NEW: Attach pressedKeys array and deltaTime
    (keyboardEvent as any).pressedKeys = pressedKeys; // ['w', 'd']
    (keyboardEvent as any).deltaTime = deltaTime; // Actual time since last event

    // Emit KEY_PRESS event
    this.eventBus.emitKeyboardEvent(KeyboardEventType.KEY_PRESS, keyboardEvent);
  };

  // ✅ UPDATED: Use setInterval for predictable, consistent timing
  this.continuousIntervalId = window.setInterval(
    emitContinuousEvent,
    this.intervalDuration
  );
}
```

**Key Behavior Changes**:

| Scenario | Old Behavior | New Behavior (v1.1) |
|----------|--------------|---------------------|
| User holds 'W' | Multiple KEY_DOWN events (browser repeat) | ONE KEY_DOWN, then continuous KEY_PRESS events ✅ |
| Loop mechanism | `requestAnimationFrame` (unpredictable) | `setInterval` (predictable timing) ✅ |
| Loop trigger | Checks `isMovementKeyPressed()` | Checks `pressedKeyCount > 0` ✅ |
| KEY_PRESS data | No pressedKeys array | Includes `pressedKeys: string[]` ✅ |
| Loop stop | Checks movement keys | Checks `pressedKeyCount === 0` ✅ |
| Modifier key combos | Single emission (Cmd+Backspace) | Multiple emissions (enables repeating) ✅ |
| Timestamp refresh | Keys held > 5s marked stale | Timestamp refreshed on every keydown (prevents false stale detection) ✅ |

---

### KeyboardEventBus (Shared Library)

**File**: `libs/shared/hardware-controls/keyboard/src/keyboard-event-bus.ts`

**Responsibilities**:
- Store registered listeners with priorities
- Sort listeners by priority (highest first)
- Emit events to listeners in priority order
- Stop propagation if `event.markHandled()` called
- Handle listener errors gracefully

**Key Methods**:
```typescript
class KeyboardEventBus {
  register(
    eventType: KeyboardEventType,
    handler: (event: IKeyboardEvent) => void,
    priority: number,
    context?: string
  ): () => void // Returns unsubscribe function
  
  emitKeyboardEvent(
    eventType: KeyboardEventType,
    event: IKeyboardEvent
  ): void
  
  clearListeners(eventType: KeyboardEventType): void
  clearAllListeners(): void
}
```

**Priority Handling**:
```typescript
// Listeners sorted by priority
listeners = [
  { priority: 500, handler: mapHandler, context: 'CesiumEventsManager' },
  { priority: 100, handler: appHandler, context: 'MissionPlanner' },
  { priority: 50,  handler: globalHandler, context: 'GlobalShortcuts' },
];

// Emit event
for (const listener of listeners) {
  listener.handler(event);
  if (event.handled) break; // Stop if handled
}
```

---

### KeyboardStateTracker (Shared Library)

**File**: `libs/shared/hardware-controls/keyboard/src/keyboard-state-tracker.ts`

**Responsibilities**:
- Track currently pressed keys (Set)
- Track key press timestamps
- Query key state
- Calculate press duration
- Clear all keys (on focus loss)

**Key Methods**:
```typescript
class KeyboardStateTracker {
  keyDown(key: string): void
  keyUp(key: string): void
  refreshKeyTimestamp(key: string): void  // ✨ NEW: Update timestamp for already-pressed key
  
  isKeyPressed(key: string): boolean
  getPressedKeys(): string[]
  getKeyPressDuration(key: string): number
  
  clear(): void
  isMovementKeyPressed(): boolean
  getPressedKeyCount(): number
}
```

**Usage**:
```typescript
// User presses W, then D (diagonal movement)
stateTracker.keyDown('w');
stateTracker.keyDown('d');

// Query state
stateTracker.getPressedKeys(); // ['w', 'd']
stateTracker.isKeyPressed('w'); // true
stateTracker.isMovementKeyPressed(); // true

// User releases W
stateTracker.keyUp('w');
stateTracker.getPressedKeys(); // ['d']
```

---

### KeyboardFocusManager (Map Library)

**File**: `libs/shared/map/src/private/map-providers/cesium/events/keyboard-focus-manager.ts`

**⚠️ NOT in shared library - This is map-specific!**

**Responsibilities**:
- Track which entity currently has keyboard focus
- Single focus model (only one entity at a time)
- Emit focus change events
- Manage focus listeners

**Key Methods**:
```typescript
class KeyboardFocusManager {
  setFocus(entityId: string | null): void
  getFocusedEntity(): string | null
  hasFocus(entityId: string): boolean
  clearFocus(): void
  
  onFocusChange(listener: (entityId: string | null) => void): () => void
  offFocusChange(listener: (entityId: string | null) => void): void
}
```

**Why map-specific?**
- "Entity" is a map library concept
- Focus is about which map entity receives keyboard input
- Shared library has no knowledge of entities

---

### Map Key Bindings (Enum-Based) - NEW in v1.1

**File**: `libs/shared/map/src/private/map-providers/cesium/events/keyboard-keys.enum.ts`

**⚠️ NOT in shared library - This is map-specific!**

**Purpose**:
- Centralize map keyboard key bindings as type-safe enums
- Easy to change key mappings in future
- Reusable across map library components
- Self-documenting key bindings

**Key Enum Definition**:

```typescript
/**
 * Map library keyboard keys
 * Centralized enum for all keyboard-controlled actions
 */
export enum MapKeyboardKey {
  // Horizontal movement
  MOVE_NORTH = 'w',
  MOVE_SOUTH = 's',
  MOVE_EAST = 'd',
  MOVE_WEST = 'a',
  
  // Altitude
  ALTITUDE_UP = 'c',
  ALTITUDE_DOWN = 'z',
  
  // Rotation (for models/drones)
  ROTATE_LEFT = 'q',
  ROTATE_RIGHT = 'e',
  
  // Control
  CLEAR_FOCUS = 'Escape',
}

/**
 * Group keys by action type
 */
export const MAP_KEYBOARD_KEYS = {
  MOVEMENT_HORIZONTAL: [
    MapKeyboardKey.MOVE_NORTH,
    MapKeyboardKey.MOVE_SOUTH,
    MapKeyboardKey.MOVE_EAST,
    MapKeyboardKey.MOVE_WEST,
  ] as const,
  
  MOVEMENT_ALTITUDE: [
    MapKeyboardKey.ALTITUDE_UP,
    MapKeyboardKey.ALTITUDE_DOWN,
  ] as const,
  
  MOVEMENT_ROTATION: [
    MapKeyboardKey.ROTATE_LEFT,
    MapKeyboardKey.ROTATE_RIGHT,
  ] as const,
  
  CONTROL: [
    MapKeyboardKey.CLEAR_FOCUS,
  ] as const,
} as const;

/**
 * All movement keys (for quick checks)
 */
export const ALL_MOVEMENT_KEYS = [
  ...MAP_KEYBOARD_KEYS.MOVEMENT_HORIZONTAL,
  ...MAP_KEYBOARD_KEYS.MOVEMENT_ALTITUDE,
  ...MAP_KEYBOARD_KEYS.MOVEMENT_ROTATION,
] as const;

/**
 * Type-safe movement key check
 */
export function isMovementKey(key: string): boolean {
  return ALL_MOVEMENT_KEYS.includes(key.toLowerCase() as any);
}

/**
 * Type-safe control key check
 */
export function isControlKey(key: string): boolean {
  return MAP_KEYBOARD_KEYS.CONTROL.includes(key as any);
}
```

**Usage in CesiumEventsManager**:

```typescript
import { MapKeyboardKey, isMovementKey, isControlKey } from './keyboard-keys.enum';

export class CesiumEventsManager {
  private handleKeyDown(event: IKeyboardEvent): void {
    const focusedEntityId = this.keyboardFocusManager?.getFocusedEntity();

    // Check using enum-based helper
    if (focusedEntityId && isMovementKey(event.key)) {
      event.markHandled();
      event.preventDefault();
      // Handle movement...
    }

    // Control keys using enum
    if (event.key === MapKeyboardKey.CLEAR_FOCUS && focusedEntityId) {
      event.markHandled();
      event.preventDefault();
      this.keyboardFocusManager?.clearFocus();
    }
  }
}
```

**Benefits**:
- ✅ **Type Safety**: IDE autocomplete for all keys
- ✅ **Centralized**: Change keys in one place
- ✅ **Reusable**: Import enum anywhere in map library
- ✅ **Documentation**: Self-documenting key bindings
- ✅ **Refactoring**: Easy to find all usages
- ✅ **Future-Proof**: Easy to add new keys or change existing ones

---

### MovementCalculator (Map Library)

**File**: `libs/shared/map/src/private/map-providers/cesium/events/movement-calculator.ts`

**⚠️ NOT in shared library - This is map-specific!**

**Responsibilities**:
- Convert pressed keys → movement vector
- Use enum-based key bindings (MapKeyboardKey)
- Normalize diagonal movement
- Return unit vectors

**Key Methods**:
```typescript
interface MovementVector {
  x: number;      // Longitude direction (-1, 0, +1)
  y: number;      // Latitude direction (-1, 0, +1)
  z: number;      // Altitude direction (-1, 0, +1)
  rotation: number; // Rotation direction (-1, 0, +1)
}

class MovementCalculator {
  calculateMovement(pressedKeys: string[]): MovementVector
  isMovementKey(key: string): boolean
}
```

**Implementation with Enums** (v1.1):
```typescript
import { MapKeyboardKey, MAP_KEYBOARD_KEYS } from './keyboard-keys.enum';

export class MovementCalculator {
  /**
   * Calculate movement vector from pressed keys
   * Uses enum-based key bindings for type safety
   */
  calculateMovement(pressedKeys: string[]): MovementVector {
    let x = 0, y = 0, z = 0, rotation = 0;

    pressedKeys.forEach(key => {
      const lowerKey = key.toLowerCase();
      
      // Horizontal movement (using enums)
      if (lowerKey === MapKeyboardKey.MOVE_NORTH) y += 1;
      if (lowerKey === MapKeyboardKey.MOVE_SOUTH) y -= 1;
      if (lowerKey === MapKeyboardKey.MOVE_EAST) x += 1;
      if (lowerKey === MapKeyboardKey.MOVE_WEST) x -= 1;

      // Altitude (using enums)
      if (lowerKey === MapKeyboardKey.ALTITUDE_UP) z += 1;
      if (lowerKey === MapKeyboardKey.ALTITUDE_DOWN) z -= 1;

      // Rotation (using enums)
      if (lowerKey === MapKeyboardKey.ROTATE_LEFT) rotation -= 1;
      if (lowerKey === MapKeyboardKey.ROTATE_RIGHT) rotation += 1;
    });

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }

    return { x, y, z, rotation };
  }

  /**
   * Check if key is a movement key (using enum constants)
   */
  isMovementKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return (
      MAP_KEYBOARD_KEYS.MOVEMENT_HORIZONTAL.includes(lowerKey as any) ||
      MAP_KEYBOARD_KEYS.MOVEMENT_ALTITUDE.includes(lowerKey as any) ||
      MAP_KEYBOARD_KEYS.MOVEMENT_ROTATION.includes(lowerKey as any)
    );
  }
}
```

**Example**:
```typescript
// User holds W + D (move North-East)
const vector = calculator.calculateMovement(['w', 'd']);
// Returns: { x: 0.707, y: 0.707, z: 0, rotation: 0 }
// (normalized diagonal)

// User holds W + Z (move North + altitude down)
const vector = calculator.calculateMovement(['w', 'z']);
// Returns: { x: 0, y: 1, z: -1, rotation: 0 }
```

**Why map-specific?**
- WASD → lat/lng is a map library choice
- Other apps might use different bindings
- Movement vector is a map concept
- Key bindings defined as enums for easy modification

---

### CesiumBaseMarker Integration

**File**: `libs/shared/map/src/private/map-providers/cesium/entities/cesium-base-marker.ts`

**Changes**:
- Register for keyboard events (KEY_DOWN, KEY_UP, KEY_PRESS)
- Handle continuous movement from KEY_PRESS events
- Auto-focus on click
- Clear focus on destroy

**Pseudocode**:
```typescript
class CesiumBaseMarker implements IBaseMarker {
  private _movementSpeed = 10; // m/s
  private _altitudeSpeed = 5;  // m/s
  private _keyboardControllable = false;

  constructor(mapServices: ICesiumMapService, marker: IMarkerConfig) {
    // ... existing initialization

    // Opt-in keyboard control
    this._keyboardControllable = marker.keyboardControllable ?? false;

    if (this._keyboardControllable) {
      this.registerKeyboardEvents();
      this.registerClickFocus();
    }
  }

  private registerKeyboardEvents(): void {
    // Listen for continuous movement (60 FPS)
    this.eventsManager.on(
      CesiumEventType.KEY_PRESS, 
      this._id, 
      (eventData) => this.handleContinuousMovement(eventData)
    );

    // Listen for discrete key presses
    this.eventsManager.on(
      CesiumEventType.KEY_DOWN, 
      this._id, 
      (eventData) => this.handleKeyDown(eventData)
    );

    // Listen for key releases
    this.eventsManager.on(
      CesiumEventType.KEY_UP, 
      this._id, 
      (eventData) => this.handleKeyUp(eventData)
    );
  }

  private handleContinuousMovement(eventData: any): void {
    const { movementVector, deltaTime } = eventData;

    // Calculate horizontal movement (lat/lng)
    if (movementVector.x !== 0 || movementVector.y !== 0) {
      const distance = this._movementSpeed * deltaTime; // meters
      
      // Convert to degrees
      // 1 degree latitude ≈ 111,320 meters
      const deltaLat = (movementVector.y * distance) / 111320;
      
      // Longitude varies with latitude
      const latRad = this._position.latitude * Math.PI / 180;
      const deltaLon = (movementVector.x * distance) / (111320 * Math.cos(latRad));

      this._position.latitude += deltaLat;
      this._position.longitude += deltaLon;
    }

    // Calculate altitude movement
    if (movementVector.z !== 0) {
      const deltaAlt = movementVector.z * this._altitudeSpeed * deltaTime;
      this._position.altitude += deltaAlt;
    }

    // Apply position update
    this.setPosition(this._position);

    // Emit external event for listeners
    this.eventEmitter.emit({
      type: IEventType.KEY_PRESS,
      id: this._id,
      data: {
        movementVector,
        position: this._position,
      },
    });
  }

  private handleKeyDown(eventData: any): void {
    // Discrete actions on key press
    // Examples: toggle visibility, reset position, etc.
    
    // Emit external event
    this.eventEmitter.emit({
      type: IEventType.KEY_DOWN,
      id: this._id,
      data: {
        key: eventData.key,
        position: this._position,
      },
    });
  }

  private handleKeyUp(eventData: any): void {
    // Emit external event
    this.eventEmitter.emit({
      type: IEventType.KEY_UP,
      id: this._id,
      data: {
        key: eventData.key,
        position: this._position,
      },
    });
  }

  private registerClickFocus(): void {
    // Auto-focus on click
    this.eventsManager.on(
      CesiumEventType.LEFT_CLICK, 
      this._id, 
      () => {
        this.eventsManager.setKeyboardFocus(this._id);
      }
    );
  }

  destroy(): void {
    // Clear focus if this entity had it
    if (this.eventsManager.hasKeyboardFocus(this._id)) {
      this.eventsManager.setKeyboardFocus(null);
    }

    // Unregister event listeners
    this.eventsManager.off(CesiumEventType.KEY_PRESS, this._id);
    this.eventsManager.off(CesiumEventType.KEY_DOWN, this._id);
    this.eventsManager.off(CesiumEventType.KEY_UP, this._id);
    this.eventsManager.off(CesiumEventType.LEFT_CLICK, this._id);

    // ... existing cleanup
  }

  // Public API for configuration
  setMovementSpeed(speed: number): void {
    this._movementSpeed = speed;
  }

  setAltitudeSpeed(speed: number): void {
    this._altitudeSpeed = speed;
  }

  setKeyboardControllable(controllable: boolean): void {
    if (controllable && !this._keyboardControllable) {
      this.registerKeyboardEvents();
      this.registerClickFocus();
    } else if (!controllable && this._keyboardControllable) {
      // Unregister...
    }
    this._keyboardControllable = controllable;
  }
}
```

---

## Event Flow Diagrams

### Complete Event Flow: User Presses 'W' (Entity Focused) - v1.1 with Deduplication

```
┌──────────────────────────────────────────────────────────────────┐
│  User Presses 'W' Key (First Time)                               │
│  (Entity has keyboard focus)                                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  1. KeyboardManager (Window Listener)                            │
│     • Captures native KeyboardEvent                              │
│     • ✅ NEW: Check isKeyPressed('w')? NO (not in pressedKeys)   │
│     • Calls stateTracker.keyDown('w') → pressedKeys = ['w']      │
│     • Wraps in IKeyboardEvent with coordination methods          │
│     • Emits KeyboardEventType.KEY_DOWN to event bus (ONCE!)      │
│     • ✅ NEW: Check pressedKeyCount > 0? YES                     │
│     • Starts continuous event loop (setInterval)                │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  ⚡ Browser Repeats 'W' Keydown (Native Repeat - ~500ms later)   │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  1a. KeyboardManager (Window Listener - Repeat Handling)         │
│     • Captures repeated KeyboardEvent                            │
│     • ✅ NEW: Check isKeyPressed('w')? YES (already in set!)     │
│     • ⏭️  SKIP event emission (deduplicate!)                     │
│     • return early (no KEY_DOWN event for repeat)                │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. KeyboardEventBus (Priority Distribution)                     │
│     • Get listeners for KEY_DOWN, sorted by priority             │
│     • Listeners: [                                               │
│         { priority: 500, handler: mapHandler },                  │
│         { priority: 100, handler: appHandler }                   │
│       ]                                                          │
│     • Call highest priority first (map)                          │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. CesiumEventsManager (Priority: 500)                          │
│     • Check keyboardFocusManager.getFocusedEntity()              │
│     • Entity focused? ✅ YES (marker-123)                        │
│     • isMovementKey('w')? ✅ YES                                 │
│     • Call event.markHandled() ← Stops propagation               │
│     • Call event.preventDefault()                                │
│     • Emit internal event: CesiumEventType.KEY_DOWN → marker-123 │
└──────────────────────────────────────────────────────────────────┘
          ↓                                    ↓
┌─────────────────────────┐    ┌──────────────────────────────────┐
│ 4a. KeyboardEventBus    │    │ 4b. CesiumBaseMarker             │
│     • Check event.handled│    │     (marker-123)                │
│     • ✅ TRUE            │    │     • Receives KEY_DOWN event   │
│     • ❌ SKIP app handler│    │     • No immediate action       │
│       (priority 100)     │    │     • Wait for KEY_PRESS        │
└─────────────────────────┘    └──────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  5. KeyboardManager (Continuous Event Loop - setInterval) v1.1   │
│     • setInterval callback fires (~16.67ms later for 60 FPS)     │
│     • ✅ NEW: Check pressedKeyCount > 0? YES (not just movement) │
│     • Get pressedKeys: ['w']                                     │
│     • Calculate deltaTime: actual time since last event          │
│     • ✅ NEW: Create KEY_PRESS event with:                       │
│       - key: 'w'                                                 │
│       - pressedKeys: ['w'] ✅ (array attached to event)          │
│       - deltaTime: ~0.016 ✅ (actual measured time)              │
│     • Emit KeyboardEventType.KEY_PRESS to event bus              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  6. CesiumEventsManager (KEY_PRESS Handler) v1.1                 │
│     • Get focusedEntity: marker-123                              │
│     • ✅ NEW: Get pressedKeys from event: event.pressedKeys      │
│     •   (no longer needs to query stateTracker!)                 │
│     • Call movementCalculator.calculateMovement(['w'])           │
│     • Returns: { x: 0, y: 1, z: 0, rotation: 0 } ← North        │
│     • Call event.markHandled()                                   │
│     • Emit internal event: CesiumEventType.KEY_PRESS → marker-123│
│       with movementVector and deltaTime                          │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  7. CesiumBaseMarker.handleContinuousMovement()                  │
│     • Receive: { movementVector, deltaTime }                     │
│     • Calculate horizontal distance:                             │
│       distance = movementSpeed (10 m/s) × deltaTime (0.016s)     │
│       distance = 0.16 meters                                     │
│     • Convert to degrees:                                        │
│       deltaLat = (1 × 0.16) / 111320 = 0.00000144 degrees        │
│     • Update position:                                           │
│       newLat = currentLat + 0.00000144                           │
│     • Call setPosition(newPosition)                              │
│     • Update Cesium billboard position                           │
│     • Marker moves North! ✅                                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  8. Loop Continues v1.1 (setInterval)                            │
│     • setInterval fires again (~16.67ms later for 60 FPS)        │
│     • ✅ NEW: Check pressedKeyCount > 0? YES                     │
│     •   (no longer checks specific movement keys)                │
│     • Repeat steps 5-7 (60 times per second)                     │
│     • ⚡ Predictable, consistent timing with setInterval          │
│     • Marker continues moving smoothly North                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  9. User Releases 'W' Key v1.1                                   │
│     • KeyboardManager captures keyup                             │
│     • Calls stateTracker.keyUp('w') → pressedKeys = []           │
│     • Emits KeyboardEventType.KEY_UP                             │
│     • ✅ NEW: Check pressedKeyCount === 0? YES                   │
│     •   (clean stop condition)                                   │
│     • Stop continuous event loop immediately                     │
│     • Marker stops moving ✅                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

### Event Flow: User Presses 'W' (No Entity Focused)

```
┌──────────────────────────────────────────────────────────────────┐
│  User Presses 'W' Key                                            │
│  (No entity has keyboard focus)                                  │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  1. KeyboardManager (Window Listener)                            │
│     • Captures native KeyboardEvent                              │
│     • Wraps in IKeyboardEvent                                    │
│     • Calls stateTracker.keyDown('w')                            │
│     • Emits KeyboardEventType.KEY_DOWN to event bus              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. KeyboardEventBus (Priority Distribution)                     │
│     • Call highest priority first (map - priority 500)           │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. CesiumEventsManager (Priority: 500)                          │
│     • Check keyboardFocusManager.getFocusedEntity()              │
│     • Entity focused? ❌ NO (returns null)                       │
│     • isMovementKey('w')? ✅ YES, but no entity focused          │
│     • Do NOT call event.markHandled()                            │
│     • Do NOT call event.preventDefault()                         │
│     • ✅ LET EVENT CONTINUE to next priority                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  4. KeyboardEventBus                                             │
│     • Check event.handled → ❌ FALSE                             │
│     • ✅ CONTINUE to next priority (app - priority 100)          │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  5. Mission Planner Keyboard Handler (Priority: 100)            │
│     • Check event.handled → ❌ FALSE                             │
│     • Check isTypingTarget() → ❌ FALSE                          │
│     • Call resolveCommands(event)                                │
│     • Check if 'W' maps to any command                           │
│     • ❌ No command for plain 'W' key                            │
│     • Do NOT call event.markHandled()                            │
│     • ✅ LET EVENT CONTINUE (no-op)                              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  6. Result                                                       │
│     • Event not handled by anyone                                │
│     • Browser default behavior (if any)                          │
│     • No action taken ✅                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

### Event Flow: User Presses 'F' (Add Photo Action)

```
┌──────────────────────────────────────────────────────────────────┐
│  User Presses 'F' Key (Add Photo Action)                        │
│  (Entity may or may not have focus - doesn't matter)            │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  1. KeyboardManager (Window Listener)                            │
│     • Captures native KeyboardEvent                              │
│     • Wraps in IKeyboardEvent                                    │
│     • Emits KeyboardEventType.KEY_DOWN to event bus              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. CesiumEventsManager (Priority: 500)                          │
│     • isMovementKey('f')? ❌ NO ('f' not in WASD/ZC/QE)          │
│     • Do NOT call event.markHandled()                            │
│     • ✅ LET EVENT CONTINUE to app                               │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. Mission Planner Keyboard Handler (Priority: 100)            │
│     • Check event.handled → ❌ FALSE                             │
│     • Call resolveCommands(event)                                │
│     • Plain 'f' key → ADD_WAYPOINT_ACTION_PHOTO                  │
│     • Create commandEvent                                        │
│     • Emit to keyboardCommandBus                                 │
│     • Component handles command, calls commandEvent.markHandled()│
│     • Call event.markHandled() (for shared system)               │
│     • Call event.preventDefault()                                │
│     • Photo action added! ✅                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

### Event Flow: User Presses 'Escape' (Clear Focus)

```
┌──────────────────────────────────────────────────────────────────┐
│  User Presses 'Escape' Key                                       │
│  (Entity has keyboard focus)                                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  1. KeyboardManager (Window Listener)                            │
│     • Captures native KeyboardEvent                              │
│     • Emits KeyboardEventType.KEY_DOWN to event bus              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. CesiumEventsManager (Priority: 500)                          │
│     • Check keyboardFocusManager.getFocusedEntity()              │
│     • Entity focused? ✅ YES (marker-123)                        │
│     • event.key === 'Escape'? ✅ YES                             │
│     • Call keyboardFocusManager.clearFocus()                     │
│     • Call event.markHandled()                                   │
│     • Call event.preventDefault()                                │
│     • Focus cleared! ✅                                          │
│     • Entity no longer receives keyboard input                   │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. KeyboardEventBus                                             │
│     • Check event.handled → ✅ TRUE                              │
│     • ❌ SKIP app handler (priority 100)                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Guide

### Phase 1: Create Shared Keyboard Library

**Duration**: 2-3 days

**Tasks**:
1. Create library structure: `libs/shared/hardware-controls/keyboard/`
2. Implement `KeyboardManager` (singleton, window listener, continuous loop)
3. Implement `KeyboardEventBus` (priority-based routing)
4. Implement `KeyboardStateTracker` (key state tracking)
5. Define types (`IKeyboardEvent`, `KeyboardEventType`, etc.)
6. Write README with usage examples
7. Add unit tests for each component

**Acceptance Criteria**:
- ✅ Library can be initialized standalone (no map dependency)
- ✅ Multiple handlers can register at different priorities
- ✅ `markHandled()` stops propagation to lower-priority handlers
- ✅ Continuous KEY_PRESS events emit at 60 FPS while keys held
- ✅ State tracker accurately tracks pressed/released keys
- ✅ Focus loss clears stuck keys

**Testing**:
```typescript
// Example unit test
describe('KeyboardManager', () => {
  it('should emit KEY_DOWN event to registered handlers', () => {
    const manager = KeyboardManager.getInstance();
    manager.initialize();
    
    const handler = jest.fn();
    manager.eventBus.register(KeyboardEventType.KEY_DOWN, handler, 100);
    
    // Simulate keydown
    const event = new KeyboardEvent('keydown', { key: 'w' });
    window.dispatchEvent(event);
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'w',
        handled: false,
      })
    );
  });
  
  it('should respect priority order', () => {
    const manager = KeyboardManager.getInstance();
    manager.initialize();
    
    const callOrder: number[] = [];
    
    manager.eventBus.register(
      KeyboardEventType.KEY_DOWN, 
      () => callOrder.push(100), 
      100
    );
    
    manager.eventBus.register(
      KeyboardEventType.KEY_DOWN, 
      () => callOrder.push(500), 
      500
    );
    
    // Simulate keydown
    const event = new KeyboardEvent('keydown', { key: 'w' });
    window.dispatchEvent(event);
    
    expect(callOrder).toEqual([500, 100]); // Higher priority first
  });
  
  it('should stop propagation when markHandled called', () => {
    const manager = KeyboardManager.getInstance();
    manager.initialize();
    
    const highPriorityHandler = jest.fn((event) => {
      event.markHandled();
    });
    const lowPriorityHandler = jest.fn();
    
    manager.eventBus.register(KeyboardEventType.KEY_DOWN, highPriorityHandler, 500);
    manager.eventBus.register(KeyboardEventType.KEY_DOWN, lowPriorityHandler, 100);
    
    // Simulate keydown
    const event = new KeyboardEvent('keydown', { key: 'w' });
    window.dispatchEvent(event);
    
    expect(highPriorityHandler).toHaveBeenCalled();
    expect(lowPriorityHandler).not.toHaveBeenCalled(); // Skipped!
  });
});
```

---

### Phase 2: Update Map Library Bootstrap

**Duration**: 1 day

**Tasks**:
1. Update `BootstrapOptions` to include keyboard options
2. Add validation for keyboard options
3. Store keyboard manager in runtime context
4. Update `CesiumMapProvider` to pass keyboard manager to events manager
5. Update documentation

**Changes**:
```typescript
// libs/shared/map/src/runtime/bootstrap.ts

export interface BootstrapOptions {
  // ... existing
  enableKeyboardControls?: boolean;
  keyboardManager?: KeyboardManager;
}

// libs/shared/map/src/private/map-providers/cesium/cesium-map-provider.ts

this.eventsManager = new CesiumEventsManager(
  this.viewer,
  runtimeContext.keyboardManager // May be null
);
```

**Testing**:
- ✅ Bootstrap with `enableKeyboardControls: false` (default)
- ✅ Bootstrap with `enableKeyboardControls: true` and valid keyboard manager
- ✅ Bootstrap with `enableKeyboardControls: true` but missing keyboard manager (should throw)

---

### Phase 3: Implement Map-Specific Components

**Duration**: 2-3 days

**Tasks**:
1. Create `KeyboardFocusManager` in map library
2. Create `MovementCalculator` in map library
3. Update `CesiumEventsManager` to register keyboard handlers
4. Implement keyboard event handling logic
5. Add public API methods (`setKeyboardFocus`, etc.)
6. Update `IEventsManager` interface

**Files**:
- `libs/shared/map/src/private/map-providers/cesium/events/keyboard-focus-manager.ts` (NEW)
- `libs/shared/map/src/private/map-providers/cesium/events/movement-calculator.ts` (NEW)
- `libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts` (UPDATE)

**Testing**:
- ✅ Focus manager: set/get/clear focus
- ✅ Focus manager: single focus model (setting new focus clears old)
- ✅ Movement calculator: WASD → correct vector
- ✅ Movement calculator: diagonal normalization
- ✅ Events manager: registers keyboard handlers only if keyboard manager provided
- ✅ Events manager: handles KEY_DOWN/KEY_UP/KEY_PRESS correctly
- ✅ Events manager: marks events as handled when entity focused

---

### Phase 4: Update CesiumBaseMarker

**Duration**: 1-2 days

**Tasks**:
1. Add `keyboardControllable` option to `IMarkerConfig`
2. Register keyboard event listeners in marker
3. Implement `handleContinuousMovement()` for smooth movement
4. Implement `handleKeyDown()` for discrete actions
5. Auto-focus on click
6. Clear focus on destroy
7. Add public API methods for configuration

**Changes**:
```typescript
// libs/shared/map/src/private/contracts/base-entities/entities/base-marker.interface.ts

export interface IMarkerConfig {
  // ... existing
  keyboardControllable?: boolean;
  movementSpeed?: number; // m/s
  altitudeSpeed?: number; // m/s
}

export interface IBaseMarker extends IBaseEntity {
  // ... existing
  setKeyboardControllable(controllable: boolean): void;
  setMovementSpeed(speed: number): void;
  setAltitudeSpeed(speed: number): void;
}
```

**Testing**:
- ✅ Marker with `keyboardControllable: true` registers keyboard events
- ✅ Marker moves correctly when WASD pressed (while focused)
- ✅ Marker altitude changes when ZC pressed
- ✅ Marker auto-focuses on click
- ✅ Focus clears when marker destroyed
- ✅ Marker does NOT respond to keyboard when not focused
- ✅ Movement speed configurable
- ✅ Frame-independent movement (same speed at 30 FPS vs 60 FPS)

---

### Phase 5: Integrate with Mission Planner

**Duration**: 1-2 days

**Tasks**:
1. Update `main.tsx` to initialize `KeyboardManager`
2. Update `keyboard-command-bus.ts` to consume keyboard manager
3. Update mission planner bootstrap call with keyboard options
4. Test existing keyboard shortcuts still work
5. Test keyboard shortcuts are blocked when entity focused

**Changes**:
```typescript
// apps/mission-planner/src/main.tsx

const keyboardManager = KeyboardManager.getInstance();
keyboardManager.initialize();

bootstrapMapLibrary({
  enableKeyboardControls: true,
  keyboardManager: keyboardManager,
  // ...
});

initializeMissionPlannerKeyboardHandlers(keyboardManager);

// apps/mission-planner/src/hooks/keyboard/keyboard-command-bus.ts

export function initializeMissionPlannerKeyboardHandlers(
  keyboardManager: KeyboardManager
): void {
  // Register with NORMAL priority
}
```

**Testing**:
- ✅ All existing keyboard shortcuts work (Tab, Arrows, F, B, X, etc.)
- ✅ WASD moves focused marker (not triggers app shortcuts)
- ✅ When marker not focused, all app shortcuts work normally
- ✅ Escape clears marker focus and restores app shortcuts
- ✅ Components using `useKeyboardCommands()` need no changes

---

### Phase 6: Documentation & Examples

**Duration**: 1 day

**Tasks**:
1. Update map library README with keyboard control instructions
2. Create example in flyt-map validation tool
3. Add keyboard controls to mission planner UI (help menu)
4. Update keyboard shortcuts config to reflect new movement keys
5. Create migration guide for other apps (fleet, asset-management)

**Deliverables**:
- ✅ README in shared keyboard library
- ✅ Integration guide in map library docs
- ✅ Example implementation in flyt-map tool
- ✅ Updated keyboard shortcuts popover in mission planner

---

## Migration Strategy

### For Existing Apps

**Mission Planner** (Already integrated in Phase 5):
- ✅ Minimal changes to existing code
- ✅ `keyboard-command-bus.ts` adapted to consume new system
- ✅ No changes needed in components
- ✅ Existing `useKeyboardCommands()` hook works as-is

**Fleet & Asset Management**:

If these apps need keyboard shortcuts:

1. **Install shared keyboard library**:
   ```typescript
   import { KeyboardManager } from '@flytbase/shared/hardware-controls/keyboard';
   ```

2. **Initialize in main.tsx**:
   ```typescript
   const keyboardManager = KeyboardManager.getInstance();
   keyboardManager.initialize();
   ```

3. **Register app-specific handlers**:
   ```typescript
   keyboardManager.eventBus.register(
     KeyboardEventType.KEY_DOWN,
     (event) => {
       // Handle shortcuts...
     },
     100, // NORMAL priority
     'FleetApp'
   );
   ```

4. **If using map with keyboard**:
   ```typescript
   bootstrapMapLibrary({
     enableKeyboardControls: true,
     keyboardManager: keyboardManager,
   });
   ```

### Backward Compatibility

**✅ Zero Breaking Changes**:
- Map library defaults to `enableKeyboardControls: false`
- Apps without keyboard manager continue working
- Mission Planner keyboard shortcuts unchanged
- Existing keyboard-command-bus stays intact

**Optional Migration Path**:
```typescript
// Old way (still works)
enableKeyboardCommandListener(); // Mission planner only

// New way (recommended)
const keyboardManager = KeyboardManager.getInstance();
keyboardManager.initialize();
initializeMissionPlannerKeyboardHandlers(keyboardManager);
```

---

## Testing Strategy

### Unit Tests

**Shared Keyboard Library**:
- ✅ KeyboardManager: initialization, disposal, event emission
- ✅ KeyboardEventBus: priority ordering, markHandled stopping propagation
- ✅ KeyboardStateTracker: key up/down tracking, query methods

**Map Library**:
- ✅ KeyboardFocusManager: set/get/clear focus, single focus model
- ✅ MovementCalculator: key → vector conversion, normalization
- ✅ CesiumEventsManager: keyboard event handling, entity routing

**Entities**:
- ✅ CesiumBaseMarker: movement calculations, auto-focus, cleanup

### Integration Tests

**Map + Keyboard**:
- ✅ Bootstrap map with keyboard enabled
- ✅ Create keyboard-controllable marker
- ✅ Simulate key press → marker moves
- ✅ Clear focus → marker stops moving

**App + Keyboard + Map**:
- ✅ Initialize keyboard manager
- ✅ Bootstrap map with keyboard
- ✅ Register app handlers
- ✅ Verify priority: map handles WASD, app handles F/B/X
- ✅ Verify focus: entity focused blocks app, no entity allows app

### Manual Testing

**Mission Planner**:
1. Open mission planner
2. Create a waypoint
3. Click waypoint marker on map
4. Press WASD → marker moves
5. Press ZC → altitude changes
6. Press Escape → focus clears, marker stops moving
7. Press F → photo action added (app shortcut works)
8. Click different waypoint → focus transfers
9. Delete waypoint → focus clears automatically

**Edge Cases**:
- ✅ Alt+Tab away from browser → keys cleared
- ✅ Hold W, then Alt+Tab, then return → W not stuck
- ✅ Type in input field → shortcuts ignored
- ✅ Multiple markers → only focused one moves
- ✅ Delete focused marker → focus clears
- ✅ Rapid key presses → no stuck keys

---

## Performance Considerations

### Continuous Event Loop

**FPS Configuration**:
- Default: 60 FPS (16.67ms per frame)
- Configurable via `KeyboardManagerConfig.continuousEventFrequencyInMS`

**Optimization** (v1.1):
```typescript
// ✅ NEW: Only run loop if ANY keys pressed (simplified logic)
if (stateTracker.getPressedKeyCount() > 0) {
  this.startContinuousEventLoop();
} else {
  this.stopContinuousEventLoop();
}

// Deduplication prevents unnecessary event emissions
// Browser repeat events are ignored (no duplicate KEY_DOWN)
```

**Frame Budget**:
- Event emission: ~0.5ms
- Movement calculation: ~0.1ms
- Position update: ~1ms
- **Total**: ~1.6ms per frame (well under 16.67ms budget)

### Memory Usage

**Shared Keyboard Library**:
- KeyboardManager: ~1 KB (singleton)
- KeyboardStateTracker: ~1 KB (Set of strings)
- KeyboardEventBus: ~5 KB (listener array)
- **Total**: ~7 KB overhead

**Per Entity**:
- KeyboardFocusManager: ~0.5 KB (single ID + listeners)
- Event listeners: ~2 KB per entity
- **Total**: ~2.5 KB per keyboard-controllable entity

### Event Bus Performance

**Listener Sorting**:
- Sorted once on registration (O(n log n))
- Emission is O(n) where n = number of listeners
- Typical case: 2-3 listeners (map + app + global)
- **Impact**: Negligible

**Event Object Creation**:
- One `IKeyboardEvent` wrapper per native event
- Reused `markHandled` closure
- **Impact**: Minimal GC pressure

---

## Security Considerations

### Input Validation

**Key Names**:
- Normalized to lowercase
- No special processing needed
- Browser provides trusted `KeyboardEvent`

**Event Target Filtering**:
```typescript
// Ignore events from input fields
const ignoreTargets = ['INPUT', 'TEXTAREA', '[contenteditable]'];
if (ignoreTargets.includes(target.tagName)) {
  return; // Don't process
}
```

### XSS Prevention

**No Dynamic Code**:
- No `eval()` or `Function()` constructors
- All key mappings are static
- Event data is typed (TypeScript)

**Context Isolation**:
- Each handler runs in its own try-catch
- Handler errors don't affect other handlers
- Failed handlers logged, not thrown

---

## Future Enhancements

### Configurable Key Bindings

**Current**: WASD, ZC, QE hardcoded in `MovementCalculator`

**Future**: User-configurable key bindings
```typescript
// User preferences
const keyBindings = {
  moveNorth: ['w', 'ArrowUp'],
  moveSouth: ['s', 'ArrowDown'],
  // ...
};

// Pass to MovementCalculator
const calculator = new MovementCalculator(keyBindings);
```

### Multi-Entity Selection

**Current**: Single focus model (one entity at a time)

**Future**: Multi-select with WASD moving all selected
```typescript
// Focus manager tracks active entity + selection
class KeyboardFocusManager {
  private focusedEntityId: string | null;
  private selectedEntityIds: Set<string>;
  
  moveAllSelected(vector: MovementVector): void {
    this.selectedEntityIds.forEach(id => {
      // Move entity...
    });
  }
}
```

### Keyboard Macro Recording

**Future**: Record and replay keyboard sequences
```typescript
const recorder = keyboardManager.startRecording();
// User performs actions...
const macro = recorder.stop();

// Replay
macro.replay();
```

### Gamepad Support

**Future**: Extend hardware-controls to support gamepad
```typescript
libs/shared/hardware-controls/
├── keyboard/
├── gamepad/      // NEW
└── mouse/        // NEW
```

---

## Appendix

### Type Definitions

**IKeyboardEvent** (Shared Library):
```typescript
export interface IKeyboardEventData {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  timestamp: number;
  originalEvent?: KeyboardEvent;
}

export interface IKeyboardEvent extends IKeyboardEventData {
  // Coordination methods
  handled: boolean;
  markHandled: () => void;
  preventDefault: () => void;
  stopPropagation: () => void;
}
```

**✅ NEW: IKeyboardPressEvent** (Shared Library - v1.1):
```typescript
/**
 * Extended event data for KEY_PRESS events
 * 
 * KEY_PRESS events include additional data for continuous movement:
 * - pressedKeys: Array of all currently pressed keys
 * - deltaTime: Seconds since last frame (for frame-independent movement)
 */
export interface IKeyboardPressEvent extends IKeyboardEvent {
  pressedKeys: string[];  // ✅ Array of pressed keys: ['w', 'd', 'z']
  deltaTime: number;      // Seconds since last frame: 0.016
}

/**
 * Type guard to check if event is a KEY_PRESS event
 */
export function isKeyboardPressEvent(
  event: IKeyboardEvent
): event is IKeyboardPressEvent {
  return 'pressedKeys' in event && 'deltaTime' in event;
}
```

**KeyboardEventType** (Shared Library):
```typescript
export enum KeyboardEventType {
  KEY_DOWN = 'KEY_DOWN',   // Discrete press (emitted ONCE per key)
  KEY_UP = 'KEY_UP',       // Discrete release
  KEY_PRESS = 'KEY_PRESS', // Continuous (60 FPS while held, includes pressedKeys array)
}
```

**MovementVector** (Map Library):
```typescript
export interface MovementVector {
  x: number;      // Longitude direction (-1, 0, +1)
  y: number;      // Latitude direction (-1, 0, +1)
  z: number;      // Altitude direction (-1, 0, +1)
  rotation: number; // Rotation direction (-1, 0, +1)
}
```

### Key Bindings Reference

| Key(s) | Action | Context | Priority |
|--------|--------|---------|----------|
| W/A/S/D | Move marker (lat/lng) | Map (entity focused) | 500 (HIGH) |
| Z/C | Altitude down/up | Map (entity focused) | 500 (HIGH) |
| Q/E | Rotate left/right | Map (entity focused, models) | 500 (HIGH) |
| Escape | Clear focus | Map (entity focused) | 500 (HIGH) |
| F | Add photo action | App | 100 (NORMAL) |
| B | Add start video action | App | 100 (NORMAL) |
| X | Add stop video action | App | 100 (NORMAL) |
| H | Add hover action | App | 100 (NORMAL) |
| Y | Add drone yaw action | App | 100 (NORMAL) |
| Space | Toggle action panel | App | 100 (NORMAL) |
| Tab | Select next waypoint | App | 100 (NORMAL) |
| Arrows | Navigate waypoints/actions | App | 100 (NORMAL) |
| Ctrl/Cmd+M | Toggle multi-select | App | 100 (NORMAL) |
| Ctrl/Cmd+C | Copy waypoints | App | 100 (NORMAL) |
| Ctrl/Cmd+V | Paste waypoints | App | 100 (NORMAL) |
| Delete | Delete selected | App | 100 (NORMAL) |

---

## Questions & Answers

**Q: Why not put FocusManager in shared library?**  
A: "Focus" is a map concept (which entity receives input). Shared library has no knowledge of entities. Different apps might have different focus models (single, multi, hierarchical).

**Q: Why not put MovementCalculator in shared library?**  
A: WASD → lat/lng is a map library choice. Other apps might use WASD for different purposes (UI navigation, camera control, etc.). Shared library provides raw key state; map interprets it.

**Q: Can I use keyboard library without map?**  
A: Yes! Shared keyboard library is standalone. Any app can use it for keyboard shortcuts.

**Q: Can I use map without keyboard?**  
A: Yes! Keyboard is opt-in via `enableKeyboardControls: false` (default).

**Q: What if app needs custom priority?**  
A: Use any numeric value (0-999+). Map uses 500, app uses 100. You could use 250 for "between map and app" priority.

**Q: How do I debug keyboard events?**  
A: Enable debug mode:
```typescript
KeyboardManager.getInstance({ debug: true });
// Logs all key events, priorities, handlers
```

**Q: Can handlers modify the event?**  
A: Handlers receive the same `IKeyboardEvent` object. Calling `markHandled()` affects subsequent handlers. Other properties are read-only (except via `preventDefault`/`stopPropagation`).

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | System Design Team | Initial architecture design |
| 1.1 | 2026-01-12 | System Design Team | **Major enhancements**: <br>• Added KEY_DOWN deduplication (ignores browser repeat)<br>• Simplified loop trigger (pressedKeyCount > 0)<br>• Added pressedKeys array to KEY_PRESS events<br>• Added enum-based key bindings (MapKeyboardKey)<br>• Updated all pseudocode and event flow diagrams<br>• Added IKeyboardPressEvent type definition |
| 1.2 | 2026-01-13 | System Design Team | **Event loop optimization**: <br>• Replaced `requestAnimationFrame` with `setInterval`<br>• Provides predictable, consistent timing<br>• Eliminates 3-4 extra events at loop start<br>• More reliable for keyboard-driven movement |

---

## Summary of v1.1 Changes

### Core Logic Improvements

1. **✅ KEY_DOWN Deduplication**
   - Only emit KEY_DOWN on FIRST key press
   - Ignore browser's native key repeat
   - Result: ONE KEY_DOWN event per actual key press

2. **✅ Simplified Loop Trigger**
   - Start loop when `pressedKeyCount > 0` (any keys)
   - No longer checks "isMovementKeyPressed"
   - Result: Cleaner, more maintainable logic

3. **✅ Enhanced KEY_PRESS Events**
   - Include `pressedKeys: string[]` array
   - Include `deltaTime: number` for frame-independent movement
   - Result: Consumers get all pressed keys in one event

4. **✅ Enum-Based Key Bindings**
   - New `MapKeyboardKey` enum for type safety
   - Centralized key definitions in map library
   - Easy to change key mappings in future
   - Result: Type-safe, maintainable key bindings

5. **✅ Clean Stop Condition**
   - Stop loop immediately when `pressedKeyCount === 0`
   - No extra frames or checks
   - Result: Precise loop lifecycle

### Migration Notes

**Backward Compatible**: Existing code continues to work. New features are opt-in.

**Recommended Updates for Consumers**:
```typescript
// OLD: Query state tracker
const pressedKeys = keyboardManager.stateTracker.getPressedKeys();

// NEW: Get from event (preferred in v1.1)
const pressedKeys = (event as any).pressedKeys; // In KEY_PRESS handler
// or with type guard:
if (isKeyboardPressEvent(event)) {
  const pressedKeys = event.pressedKeys;
  const deltaTime = event.deltaTime;
}
```

---

**Status**: ✅ Design Approved - Ready for Implementation  
**Next Steps**: Begin Phase 1 (Create Shared Keyboard Library with v1.1 enhancements)

