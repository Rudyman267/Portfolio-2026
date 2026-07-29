# Keyboard Control Architecture for Base Entities

## Document Overview

**Status**: Proposed Architecture  
**Author**: Architecture Team  
**Last Updated**: 2026-01-12  
**Related Documents**:
- [Map Lifecycle Architecture](./map-lifecycle-architecture.md)
- [Entity Lifecycle](./entity-lifecycle.md)
- [Overview](./overview.md)

---

## Table of Contents

1. [Requirement Analysis](#requirement-analysis)
2. [Research Findings](#research-findings)
3. [Architecture Design](#architecture-design)
4. [Implementation Plan](#implementation-plan)
5. [Code Examples](#code-examples)
6. [Usage Patterns](#usage-patterns)
7. [Performance Considerations](#performance-considerations)
8. [Edge Cases & Solutions](#edge-cases--solutions)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Checklist](#implementation-checklist)

---

## Requirement Analysis

### Objective

Enable keyboard control support for base entities in the map library, allowing users to interact with entities using keyboard inputs (e.g., WASD for movement, arrow keys for navigation, +/- for altitude control).

### Key Requirements

1. **Entity Registration** - Entities must register for keyboard events (similar to mouse events)
2. **Entity-Specific Handling** - Each entity type should handle keyboard inputs according to its domain logic
3. **Focus Management** - Only the focused/selected entity should receive keyboard input
4. **Key Combinations** - Support modifier keys (Shift, Ctrl, Alt)
5. **Continuous Movement** - Support holding keys for continuous motion
6. **Architectural Consistency** - Follow existing mouse event patterns

### Target Use Cases

#### Use Case 1: Marker Movement
```typescript
// User clicks on marker to focus it
// User presses 'W' → Marker moves North
// User presses 'S' → Marker moves South
// User presses 'A' → Marker moves West
// User presses 'D' → Marker moves East
// User presses '+' → Marker altitude increases
// User presses '-' → Marker altitude decreases
```

#### Use Case 2: Waypoint Navigation
```typescript
// User selects waypoint
// Arrow keys → Move waypoint in 4 directions
// Shift + Arrow → Move faster
// Ctrl + Arrow → Precise movement (slower)
```

#### Use Case 3: Global Shortcuts
```typescript
// No entity focused
// Ctrl + S → Save mission
// Escape → Clear selection/focus
// Delete → Remove selected entity
```

---

## Research Findings

### Cesium's Keyboard Limitations

**Critical Discovery**: Cesium's `ScreenSpaceEventHandler` **does NOT support keyboard events**.

#### What Cesium Supports
- ✅ Mouse events (LEFT_CLICK, MOUSE_MOVE, MOUSE_DRAG, etc.)
- ✅ Touch events
- ✅ Modifier keys (Shift, Ctrl, Alt) **only with mouse events**

#### What Cesium Does NOT Support
- ❌ Standalone keyboard events (keydown, keyup, keypress)
- ❌ Key-specific event handlers
- ❌ Keyboard event registration system

### Solution: Native JavaScript Event Listeners

Based on Cesium documentation and community practices, the recommended approach is:

1. **Use Browser's Native Keyboard Events**
   - `keydown` - Key is pressed
   - `keyup` - Key is released
   - `keypress` - (deprecated, avoid using)

2. **Attach to Cesium Canvas**
   ```javascript
   const canvas = viewer.canvas;
   canvas.setAttribute('tabindex', '0'); // Make focusable
   canvas.addEventListener('keydown', handler);
   canvas.addEventListener('keyup', handler);
   ```

3. **Integrate with Existing Event System**
   - Route keyboard events through `CesiumEventsManager`
   - Maintain same registration pattern as mouse events
   - Use same event emitter infrastructure

---

## Architecture Design

### Design Philosophy

```
┌─────────────────────────────────────────────────────────┐
│  GOAL: Maintain architectural consistency with mouse    │
│  events while adapting to keyboard event constraints    │
└─────────────────────────────────────────────────────────┘

Existing Pattern (Mouse):
  User Action → Cesium Handler → EventsManager → Entity

New Pattern (Keyboard):
  User Action → Canvas Listener → EventsManager → Entity
               ↑ Different input, but same routing!
```

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│  USER KEYBOARD INPUT (W, A, S, D, etc.)                 │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌───────────────────▼─────────────────────────────────────┐
│  Native Canvas Event Listeners (keydown/keyup)          │
│  - Attached to Cesium canvas element                    │
│  - Canvas must be focused (tabindex=0)                  │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌───────────────────▼─────────────────────────────────────┐
│  CesiumEventsManager (Enhanced)                         │
│  - KeyboardFocusManager (which entity has focus?)       │
│  - KeyboardStateTracker (which keys are pressed?)       │
│  - Continuous Movement Loop (requestAnimationFrame)     │
└───────────────────┬─────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
┌────────▼────────┐  ┌─────────▼──────────┐
│ Entity-Specific │  │ Global Events      │
│ Events          │  │ (no entity focused)│
│ (focused entity)│  │                    │
└────────┬────────┘  └─────────┬──────────┘
         ↓                     ↓
┌────────▼────────┐  ┌─────────▼──────────┐
│ CesiumBaseMarker│  │ Application Code   │
│ handles WASD    │  │ (Ctrl+S, etc.)     │
└─────────────────┘  └────────────────────┘
```

---

## Implementation Plan

### Phase 1: Type Definitions & Event Contracts

#### 1.1 Extend Event Type Enums

**File**: `libs/shared/map/src/private/map-providers/cesium/types/cesium-event-types.ts`

```typescript
export enum CesiumEventType {
  // Existing mouse events
  MOUSE_CLICK = 'MOUSE_CLICK',
  LEFT_DOWN = 'LEFT_DOWN',
  LEFT_UP = 'LEFT_UP',
  MOUSE_DRAG = 'MOUSE_DRAG',
  MOUSE_HOVER = 'MOUSE_HOVER',
  ALT_PLUS_LEFT_DOWN = 'ALT_PLUS_LEFT_DOWN',
  ALT_PLUS_MOUSE_DRAG = 'ALT_PLUS_MOUSE_DRAG',
  ALT_PLUS_LEFT_UP = 'ALT_PLUS_LEFT_UP',
  
  // ✨ NEW: Keyboard events
  KEY_DOWN = 'KEY_DOWN',
  KEY_UP = 'KEY_UP',
  KEY_PRESS = 'KEY_PRESS', // Continuous (while held)
}
```

**File**: `libs/shared/map/src/public/contracts/events/map-event-types.ts`

```typescript
export enum IEventType {
  // ... existing events
  
  // ✨ NEW: Keyboard events
  KEY_DOWN = 'KEY_DOWN',
  KEY_UP = 'KEY_UP',
  KEY_PRESS = 'KEY_PRESS',
  KEYBOARD_FOCUS_CHANGED = 'KEYBOARD_FOCUS_CHANGED',
}
```

#### 1.2 Keyboard Event Data Interface

**File**: `libs/shared/map/src/private/map-providers/cesium/types/keyboard-event-data.ts`

```typescript
import { IPosition } from '@map/public/contracts';

/**
 * Base keyboard event data structure
 * Mirrors native KeyboardEvent properties
 */
export interface IKeyboardEventData {
  /**
   * The key value (e.g., 'w', 'ArrowUp', 'Escape')
   */
  key: string;
  
  /**
   * The physical key code (e.g., 'KeyW', 'ArrowUp', 'Escape')
   */
  code: string;
  
  /**
   * Whether Ctrl key is pressed
   */
  ctrlKey: boolean;
  
  /**
   * Whether Shift key is pressed
   */
  shiftKey: boolean;
  
  /**
   * Whether Alt key is pressed
   */
  altKey: boolean;
  
  /**
   * Whether Meta/Command key is pressed
   */
  metaKey: boolean;
  
  /**
   * Whether this is an auto-repeat event (key held down)
   */
  repeat: boolean;
  
  /**
   * Event timestamp
   */
  timestamp: number;
}

/**
 * Cesium-specific keyboard event data
 * Extends base with entity context
 */
export interface CesiumKeyboardEventData extends IKeyboardEventData {
  /**
   * ID of the entity that has keyboard focus (optional)
   */
  entityId?: string;
  
  /**
   * Current mouse cursor position (optional)
   */
  position?: IPosition;
  
  /**
   * For continuous movement: array of currently pressed keys
   */
  keys?: string[];
}
```

---

### Phase 2: Focus Management System

#### 2.1 KeyboardFocusManager Class

**File**: `libs/shared/map/src/private/map-providers/cesium/events/keyboard-focus-manager.ts`

```typescript
/**
 * Manages keyboard focus for map entities
 * 
 * Key Responsibilities:
 * - Track which entity currently has keyboard focus
 * - Ensure only one entity has focus at a time
 * - Emit focus change events
 * - Provide focus query methods
 * 
 * Design Decisions:
 * - Single focus model (like browser focus)
 * - Focus can be null (no entity focused)
 * - Focus change triggers events for UI updates
 */
export class KeyboardFocusManager {
  private focusedEntityId: string | null = null;
  private focusChangeListeners: Array<(entityId: string | null) => void> = [];
  
  /**
   * Set keyboard focus to an entity
   * 
   * @param entityId - Entity ID to focus, or null to clear focus
   * 
   * @example
   * // Focus a marker
   * focusManager.setFocus('marker-123');
   * 
   * // Clear focus
   * focusManager.setFocus(null);
   */
  setFocus(entityId: string | null): void {
    const previousFocus = this.focusedEntityId;
    
    // No change, skip
    if (previousFocus === entityId) {
      return;
    }
    
    this.focusedEntityId = entityId;
    
    // Notify all listeners of focus change
    this.focusChangeListeners.forEach(listener => {
      try {
        listener(entityId);
      } catch (error) {
        console.error('Error in focus change listener:', error);
      }
    });
  }
  
  /**
   * Get currently focused entity ID
   * 
   * @returns Entity ID or null if no focus
   */
  getFocusedEntity(): string | null {
    return this.focusedEntityId;
  }
  
  /**
   * Check if specific entity has focus
   * 
   * @param entityId - Entity ID to check
   * @returns true if entity has focus
   */
  hasFocus(entityId: string): boolean {
    return this.focusedEntityId === entityId;
  }
  
  /**
   * Clear keyboard focus
   * Convenience method equivalent to setFocus(null)
   */
  clearFocus(): void {
    this.setFocus(null);
  }
  
  /**
   * Register a listener for focus changes
   * 
   * @param listener - Callback receiving new focused entity ID
   * 
   * @example
   * focusManager.onFocusChange((entityId) => {
   *   if (entityId) {
   *     highlightEntity(entityId);
   *   } else {
   *     clearHighlights();
   *   }
   * });
   */
  onFocusChange(listener: (entityId: string | null) => void): void {
    this.focusChangeListeners.push(listener);
  }
  
  /**
   * Unregister a focus change listener
   * 
   * @param listener - Listener to remove
   */
  offFocusChange(listener: (entityId: string | null) => void): void {
    const index = this.focusChangeListeners.indexOf(listener);
    if (index > -1) {
      this.focusChangeListeners.splice(index, 1);
    }
  }
  
  /**
   * Cleanup all listeners
   */
  dispose(): void {
    this.focusedEntityId = null;
    this.focusChangeListeners = [];
  }
}
```

---

### Phase 3: Keyboard State Tracking

#### 3.1 KeyboardStateTracker Class

**File**: `libs/shared/map/src/private/map-providers/cesium/events/keyboard-state-tracker.ts`

```typescript
/**
 * Tracks the state of keyboard keys (pressed/released)
 * 
 * Key Responsibilities:
 * - Track which keys are currently pressed
 * - Track how long keys have been pressed
 * - Support continuous movement (key held down)
 * - Handle key release properly
 * 
 * Design Decisions:
 * - Uses Set for O(1) key lookup
 * - Tracks timestamps for hold duration
 * - Clears state on blur to prevent stuck keys
 */
export class KeyboardStateTracker {
  private pressedKeys = new Set<string>();
  private keyTimestamps = new Map<string, number>();
  
  /**
   * Mark key as pressed
   * Idempotent - safe to call multiple times
   * 
   * @param key - Key identifier (e.g., 'w', 'ArrowUp')
   */
  keyDown(key: string): void {
    if (!this.pressedKeys.has(key)) {
      this.pressedKeys.add(key);
      this.keyTimestamps.set(key, Date.now());
    }
  }
  
  /**
   * Mark key as released
   * 
   * @param key - Key identifier
   */
  keyUp(key: string): void {
    this.pressedKeys.delete(key);
    this.keyTimestamps.delete(key);
  }
  
  /**
   * Check if key is currently pressed
   * 
   * @param key - Key identifier
   * @returns true if key is pressed
   */
  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }
  
  /**
   * Get all currently pressed keys
   * 
   * @returns Array of pressed key identifiers
   */
  getPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }
  
  /**
   * Get duration key has been pressed
   * 
   * @param key - Key identifier
   * @returns Duration in milliseconds, or 0 if not pressed
   */
  getKeyPressDuration(key: string): number {
    const timestamp = this.keyTimestamps.get(key);
    return timestamp ? Date.now() - timestamp : 0;
  }
  
  /**
   * Clear all key states
   * Called when canvas loses focus to prevent "stuck keys"
   */
  clear(): void {
    this.pressedKeys.clear();
    this.keyTimestamps.clear();
  }
  
  /**
   * Check if any movement keys are pressed
   * Helper for continuous movement detection
   * 
   * @returns true if any WASD or arrow keys are pressed
   */
  isMovementKeyPressed(): boolean {
    const movementKeys = [
      'w', 'a', 's', 'd', 
      'W', 'A', 'S', 'D',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ];
    
    return movementKeys.some(key => this.isKeyPressed(key));
  }
  
  /**
   * Check if any altitude control keys are pressed
   * 
   * @returns true if +/- keys are pressed
   */
  isAltitudeKeyPressed(): boolean {
    return this.isKeyPressed('+') || 
           this.isKeyPressed('=') || 
           this.isKeyPressed('-') || 
           this.isKeyPressed('_');
  }
  
  /**
   * Get movement vector from currently pressed keys
   * Returns normalized direction (-1, 0, 1) for each axis
   * 
   * @returns Object with x (longitude), y (latitude), z (altitude) components
   */
  getMovementVector(): { x: number; y: number; z: number } {
    let x = 0; // Longitude (East/West)
    let y = 0; // Latitude (North/South)
    let z = 0; // Altitude (Up/Down)
    
    // North/South
    if (this.isKeyPressed('w') || this.isKeyPressed('W') || this.isKeyPressed('ArrowUp')) {
      y += 1;
    }
    if (this.isKeyPressed('s') || this.isKeyPressed('S') || this.isKeyPressed('ArrowDown')) {
      y -= 1;
    }
    
    // East/West
    if (this.isKeyPressed('d') || this.isKeyPressed('D') || this.isKeyPressed('ArrowRight')) {
      x += 1;
    }
    if (this.isKeyPressed('a') || this.isKeyPressed('A') || this.isKeyPressed('ArrowLeft')) {
      x -= 1;
    }
    
    // Up/Down
    if (this.isKeyPressed('+') || this.isKeyPressed('=')) {
      z += 1;
    }
    if (this.isKeyPressed('-') || this.isKeyPressed('_')) {
      z -= 1;
    }
    
    return { x, y, z };
  }
}
```

---

### Phase 4: Extended CesiumEventsManager

#### 4.1 Add Keyboard Support to CesiumEventsManager

**File**: `libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts`

```typescript
import { KeyboardFocusManager } from './keyboard-focus-manager';
import { KeyboardStateTracker } from './keyboard-state-tracker';

export class CesiumEventsManager implements IEventsManager {
  // Existing properties...
  private handler: ScreenSpaceEventHandler;
  private eventEmitter: EventEmitter;
  private viewer: Viewer;
  private globalEventEmitter: MapEventEmitter;
  private eventEntityMap: Map<CesiumEventType, Set<string>>;
  private mouseDragEntities: Set<string>;
  private mouseHeightDragEntities: Set<string>;
  
  // ✨ NEW: Keyboard management
  private keyboardFocusManager: KeyboardFocusManager;
  private keyboardStateTracker: KeyboardStateTracker;
  private keyboardEventListeners: {
    keydown: ((e: KeyboardEvent) => void) | null;
    keyup: ((e: KeyboardEvent) => void) | null;
  } = { keydown: null, keyup: null };
  
  // Animation frame for continuous movement
  private movementAnimationFrame: number | null = null;
  private readonly MOVEMENT_UPDATE_FPS = 60;
  private lastMovementUpdateTime = 0;
  
  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.eventEmitter = new EventEmitter();
    this.globalEventEmitter = new MapEventEmitter();
    this.eventEntityMap = new Map();
    this.mouseDragEntities = new Set();
    this.mouseHeightDragEntities = new Set();
    
    // ✨ NEW: Initialize keyboard systems
    this.keyboardFocusManager = new KeyboardFocusManager();
    this.keyboardStateTracker = new KeyboardStateTracker();
    
    // Initialize event handlers
    this.initializeEventHandlers();
    this.initializeKeyboardEventHandlers(); // ✨ NEW
    this.initializeCameraOrientationTracking();
    this.initializeHeightReferenceLineVisibility();
  }
  
  /**
   * Initialize keyboard event handlers
   * Attaches native event listeners to Cesium canvas
   */
  private initializeKeyboardEventHandlers(): void {
    const canvas = this.viewer.canvas;
    
    // Make canvas focusable (critical!)
    canvas.setAttribute('tabindex', '0');
    canvas.style.outline = 'none'; // Remove browser focus outline
    
    // Focus canvas initially
    canvas.focus();
    
    // ========================================
    // KEY DOWN Handler
    // ========================================
    this.keyboardEventListeners.keydown = (event: KeyboardEvent) => {
      // Track key state for continuous movement
      this.keyboardStateTracker.keyDown(event.key);
      
      // Get focused entity (if any)
      const focusedEntityId = this.keyboardFocusManager.getFocusedEntity();
      
      // Create event data
      const keyboardData: CesiumKeyboardEventData = {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
        timestamp: Date.now(),
        entityId: focusedEntityId || undefined,
      };
      
      // Emit entity-specific event if entity is focused AND registered
      if (focusedEntityId) {
        this.emitEntityEvent(
          CesiumEventType.KEY_DOWN,
          focusedEntityId,
          keyboardData
        );
      }
      
      // Always emit global event
      this.globalEventEmitter.emitGlobalEvent({
        type: IEventType.KEY_DOWN,
        ...keyboardData,
      });
      
      // Prevent default browser behavior for movement keys
      // This prevents page scrolling with arrow keys
      if (this.isMovementKey(event.key)) {
        event.preventDefault();
      }
      
      // Start continuous movement loop if movement keys are pressed
      if (this.keyboardStateTracker.isMovementKeyPressed() && focusedEntityId) {
        this.startContinuousMovementLoop();
      }
    };
    
    // ========================================
    // KEY UP Handler
    // ========================================
    this.keyboardEventListeners.keyup = (event: KeyboardEvent) => {
      // Update key state
      this.keyboardStateTracker.keyUp(event.key);
      
      // Get focused entity
      const focusedEntityId = this.keyboardFocusManager.getFocusedEntity();
      
      // Create event data
      const keyboardData: CesiumKeyboardEventData = {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        repeat: false,
        timestamp: Date.now(),
        entityId: focusedEntityId || undefined,
      };
      
      // Emit entity-specific event
      if (focusedEntityId) {
        this.emitEntityEvent(
          CesiumEventType.KEY_UP,
          focusedEntityId,
          keyboardData
        );
      }
      
      // Emit global event
      this.globalEventEmitter.emitGlobalEvent({
        type: IEventType.KEY_UP,
        ...keyboardData,
      });
      
      // Stop continuous movement if no movement keys remain pressed
      if (!this.keyboardStateTracker.isMovementKeyPressed()) {
        this.stopContinuousMovementLoop();
      }
    };
    
    // ========================================
    // Attach Event Listeners
    // ========================================
    canvas.addEventListener('keydown', this.keyboardEventListeners.keydown);
    canvas.addEventListener('keyup', this.keyboardEventListeners.keyup);
    
    // ========================================
    // Focus Management
    // ========================================
    
    // Refocus canvas when clicked (important for maintaining keyboard capture)
    canvas.addEventListener('click', () => {
      canvas.focus();
    });
    
    // Clear keyboard state when canvas loses focus
    // This prevents "stuck keys" when user tabs away
    canvas.addEventListener('blur', () => {
      this.keyboardStateTracker.clear();
      this.stopContinuousMovementLoop();
    });
    
    // Emit focus change events
    this.keyboardFocusManager.onFocusChange((entityId) => {
      this.globalEventEmitter.emitGlobalEvent({
        type: IEventType.KEYBOARD_FOCUS_CHANGED,
        entityId,
      });
    });
  }
  
  /**
   * Check if key is a movement key that should prevent default
   */
  private isMovementKey(key: string): boolean {
    const movementKeys = [
      'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      '+', '-', '=', '_'
    ];
    return movementKeys.includes(key);
  }
  
  /**
   * Start continuous movement loop
   * Uses requestAnimationFrame for smooth 60 FPS updates
   */
  private startContinuousMovementLoop(): void {
    // Already running
    if (this.movementAnimationFrame !== null) {
      return;
    }
    
    const update = () => {
      const focusedEntityId = this.keyboardFocusManager.getFocusedEntity();
      
      // Continue only if:
      // 1. An entity has focus
      // 2. Movement keys are pressed
      if (focusedEntityId && this.keyboardStateTracker.isMovementKeyPressed()) {
        const now = Date.now();
        const deltaTime = (now - this.lastMovementUpdateTime) / 1000; // Convert to seconds
        this.lastMovementUpdateTime = now;
        
        const pressedKeys = this.keyboardStateTracker.getPressedKeys();
        const movementVector = this.keyboardStateTracker.getMovementVector();
        
        // Emit continuous movement event
        // Entity handlers will use this to update position
        this.emitEntityEvent(
          CesiumEventType.KEY_PRESS,
          focusedEntityId,
          {
            keys: pressedKeys,
            movementVector,
            deltaTime,
            timestamp: now,
            entityId: focusedEntityId,
          }
        );
        
        // Continue loop
        this.movementAnimationFrame = requestAnimationFrame(update);
      } else {
        // Stop loop if conditions no longer met
        this.stopContinuousMovementLoop();
      }
    };
    
    // Initialize timestamp
    this.lastMovementUpdateTime = Date.now();
    
    // Start loop
    this.movementAnimationFrame = requestAnimationFrame(update);
  }
  
  /**
   * Stop continuous movement loop
   */
  private stopContinuousMovementLoop(): void {
    if (this.movementAnimationFrame !== null) {
      cancelAnimationFrame(this.movementAnimationFrame);
      this.movementAnimationFrame = null;
    }
  }
  
  // ========================================
  // Public API for Focus Management
  // ========================================
  
  /**
   * Set keyboard focus to an entity
   * 
   * @param entityId - Entity ID to focus, or null to clear
   * 
   * @example
   * // Focus entity when clicked
   * eventsManager.setKeyboardFocus('marker-123');
   * 
   * // Clear focus on Escape
   * eventsManager.setKeyboardFocus(null);
   */
  setKeyboardFocus(entityId: string | null): void {
    this.keyboardFocusManager.setFocus(entityId);
  }
  
  /**
   * Get currently focused entity ID
   */
  getKeyboardFocusedEntity(): string | null {
    return this.keyboardFocusManager.getFocusedEntity();
  }
  
  /**
   * Check if entity has keyboard focus
   */
  hasKeyboardFocus(entityId: string): boolean {
    return this.keyboardFocusManager.hasFocus(entityId);
  }
  
  /**
   * Get keyboard state tracker (for advanced usage)
   */
  getKeyboardState(): KeyboardStateTracker {
    return this.keyboardStateTracker;
  }
  
  // ========================================
  // Enhanced Dispose
  // ========================================
  
  dispose(): void {
    // Existing cleanup...
    if (this.handler) {
      this.handler.destroy();
    }
    
    // ... other existing cleanup
    
    // ✨ NEW: Cleanup keyboard listeners
    const canvas = this.viewer.canvas;
    
    if (this.keyboardEventListeners.keydown) {
      canvas.removeEventListener('keydown', this.keyboardEventListeners.keydown);
      this.keyboardEventListeners.keydown = null;
    }
    
    if (this.keyboardEventListeners.keyup) {
      canvas.removeEventListener('keyup', this.keyboardEventListeners.keyup);
      this.keyboardEventListeners.keyup = null;
    }
    
    // Stop animation loop
    this.stopContinuousMovementLoop();
    
    // Clear state
    this.keyboardStateTracker.clear();
    this.keyboardFocusManager.dispose();
    
    // ... rest of existing cleanup
  }
}
```

---

### Phase 5: Add Keyboard Support to CesiumBaseMarker

#### 5.1 Update IMarkerConfig Interface

**File**: `libs/shared/map/src/private/contracts/base-entities/entities/base-marker.interface.ts`

```typescript
export interface IMarkerConfig {
  id?: string;
  position: IPosition;
  style?: MarkerStyle;
  isDraggable?: boolean;
  
  // ✨ NEW: Keyboard control options
  /**
   * Whether marker responds to keyboard input (WASD, arrows, etc.)
   * When true, marker will receive keyboard events when focused
   */
  keyboardControllable?: boolean;
  
  /**
   * Horizontal movement speed in meters per second
   * Default: 10 m/s
   */
  movementSpeed?: number;
  
  /**
   * Vertical (altitude) change speed in meters per second
   * Default: 5 m/s
   */
  altitudeSpeed?: number;
}

export interface IBaseMarker extends IBaseEntity {
  // ... existing properties and methods
  
  // ✨ NEW: Keyboard control methods
  /**
   * Enable or disable keyboard control
   */
  setKeyboardControllable(controllable: boolean): void;
  
  /**
   * Set horizontal movement speed (m/s)
   */
  setMovementSpeed(speed: number): void;
  
  /**
   * Set altitude change speed (m/s)
   */
  setAltitudeSpeed(speed: number): void;
}
```

#### 5.2 Implement Keyboard Support in CesiumBaseMarker

**File**: `libs/shared/map/src/private/map-providers/cesium/entities/cesium-base-marker.ts`

```typescript
export class CesiumBaseMarker implements IBaseMarker {
  // Existing properties...
  protected _id: string;
  protected _position: IPosition;
  protected _style: MarkerStyle;
  protected _visible: boolean;
  protected _draggable: boolean;
  protected _rotateWithCamera: boolean;
  protected entity: Entity | null;
  protected mapServices: ICesiumMapService;
  protected viewer: Viewer;
  protected eventsManager: IEventsManager;
  protected eventEmitter: MapEventEmitter;
  
  // ✨ NEW: Keyboard control properties
  private _keyboardControllable = false;
  private _movementSpeed = 10;  // meters per second
  private _altitudeSpeed = 5;   // meters per second
  
  constructor(mapServices: ICesiumMapService, config: IMarkerConfig) {
    // ... existing initialization
    
    this._id = `cesium-base-marker-${v4()}`;
    this._position = config.position;
    this._style = { ...DEFAULT_BASE_MARKER_STYLE, ...config.style };
    this._draggable = config.isDraggable === true;
    
    // ✨ NEW: Initialize keyboard control
    this._keyboardControllable = config.keyboardControllable ?? false;
    this._movementSpeed = config.movementSpeed ?? 10;
    this._altitudeSpeed = config.altitudeSpeed ?? 5;
    
    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this.eventsManager = mapServices.eventsManager;
    this.eventEmitter = new MapEventEmitter();
    
    this.createEntity();
    this.registerSceneChangeListener();
    this.adjustForSceneMode(this.viewer.scene.mode);
    
    // Set up drag handling if needed
    if (this._draggable) {
      setTimeout(() => this.setDraggable(true), 0);
    }
    
    // ✨ NEW: Set up keyboard handling if needed
    if (this._keyboardControllable) {
      setTimeout(() => this.setKeyboardControllable(true), 0);
    }
  }
  
  // ========================================
  // Keyboard Control Methods
  // ========================================
  
  /**
   * Enable or disable keyboard control
   */
  setKeyboardControllable(controllable: boolean): void {
    this._keyboardControllable = controllable;
    
    if (controllable) {
      this.registerKeyboardEvents();
    } else {
      this.unregisterKeyboardEvents();
    }
  }
  
  /**
   * Set horizontal movement speed
   */
  setMovementSpeed(speed: number): void {
    this._movementSpeed = Math.max(0, speed); // Prevent negative speed
  }
  
  /**
   * Set altitude change speed
   */
  setAltitudeSpeed(speed: number): void {
    this._altitudeSpeed = Math.max(0, speed);
  }
  
  // ========================================
  // Keyboard Event Registration
  // ========================================
  
  /**
   * Register keyboard event handlers
   */
  private registerKeyboardEvents(): void {
    if (!this.entity) {
      console.error('[CesiumBaseMarker] Cannot register keyboard events - entity is null');
      return;
    }
    
    // First unregister any existing handlers (safety)
    this.unregisterKeyboardEvents();
    
    // Register entity for keyboard events
    this.eventsManager.registerEntityForEvent(CesiumEventType.KEY_DOWN, this._id);
    this.eventsManager.registerEntityForEvent(CesiumEventType.KEY_UP, this._id);
    this.eventsManager.registerEntityForEvent(CesiumEventType.KEY_PRESS, this._id);
    
    // Subscribe to keyboard events
    const emitter = this.eventsManager.getEventEmitter();
    
    emitter.addListener(`${CesiumEventType.KEY_DOWN}:${this._id}`, this.handleKeyDown);
    emitter.addListener(`${CesiumEventType.KEY_UP}:${this._id}`, this.handleKeyUp);
    emitter.addListener(`${CesiumEventType.KEY_PRESS}:${this._id}`, this.handleContinuousMovement);
  }
  
  /**
   * Unregister keyboard event handlers
   */
  private unregisterKeyboardEvents(): void {
    if (!this.entity) return;
    
    // Unregister from events manager
    this.eventsManager.unregisterEntityFromEvent(CesiumEventType.KEY_DOWN, this._id);
    this.eventsManager.unregisterEntityFromEvent(CesiumEventType.KEY_UP, this._id);
    this.eventsManager.unregisterEntityFromEvent(CesiumEventType.KEY_PRESS, this._id);
    
    // Remove event listeners
    const emitter = this.eventsManager.getEventEmitter();
    
    emitter.removeListener(`${CesiumEventType.KEY_DOWN}:${this._id}`, this.handleKeyDown);
    emitter.removeListener(`${CesiumEventType.KEY_UP}:${this._id}`, this.handleKeyUp);
    emitter.removeListener(`${CesiumEventType.KEY_PRESS}:${this._id}`, this.handleContinuousMovement);
  }
  
  // ========================================
  // Keyboard Event Handlers
  // ========================================
  
  /**
   * Handle key down event
   * Called once when key is pressed
   */
  private handleKeyDown = (eventData: CesiumKeyboardEventData): void => {
    // Emit event for external listeners (composite/feature layers)
    this.eventEmitter.emit({
      type: IEventType.KEY_DOWN,
      id: this._id,
      data: {
        key: eventData.key,
        code: eventData.code,
        ctrlKey: eventData.ctrlKey,
        shiftKey: eventData.shiftKey,
        altKey: eventData.altKey,
        position: this._position,
      },
    });
    
    // Handle special keys (single press actions)
    switch (eventData.key.toLowerCase()) {
      case 'escape':
        // Clear focus
        this.eventsManager.setKeyboardFocus(null);
        break;
      
      case 'r':
        // Example: Reset to original position (could be implemented)
        break;
    }
  };
  
  /**
   * Handle key up event
   * Called once when key is released
   */
  private handleKeyUp = (eventData: CesiumKeyboardEventData): void => {
    // Emit event for external listeners
    this.eventEmitter.emit({
      type: IEventType.KEY_UP,
      id: this._id,
      data: {
        key: eventData.key,
        position: this._position,
      },
    });
  };
  
  /**
   * Handle continuous movement
   * Called every frame (60 FPS) while movement keys are held
   * 
   * This is where WASD movement logic happens
   */
  private handleContinuousMovement = (eventData: any): void => {
    if (!eventData.keys || eventData.keys.length === 0) {
      return;
    }
    
    const keys = eventData.keys as string[];
    const movementVector = eventData.movementVector || { x: 0, y: 0, z: 0 };
    const deltaTime = eventData.deltaTime || (1 / 60); // Fallback to 60 FPS
    
    // Calculate speed modifiers
    let speedMultiplier = 1.0;
    
    // Shift key: 2x speed
    const hasShift = keys.some(k => k === 'Shift');
    if (hasShift) {
      speedMultiplier = 2.0;
    }
    
    // Ctrl key: 0.5x speed (precise movement)
    const hasCtrl = keys.some(k => k === 'Control');
    if (hasCtrl) {
      speedMultiplier = 0.5;
    }
    
    // Calculate movement deltas
    const effectiveSpeed = this._movementSpeed * speedMultiplier;
    const effectiveAltSpeed = this._altitudeSpeed * speedMultiplier;
    
    // Latitude change (North/South)
    // ~111,320 meters per degree at equator
    const deltaLat = (movementVector.y * effectiveSpeed * deltaTime) / 111320;
    
    // Longitude change (East/West)
    // Adjust for latitude (longitude distance decreases toward poles)
    const latRad = this._position.latitude * Math.PI / 180;
    const deltaLon = (movementVector.x * effectiveSpeed * deltaTime) / 
                     (111320 * Math.cos(latRad));
    
    // Altitude change (Up/Down)
    const deltaAlt = movementVector.z * effectiveAltSpeed * deltaTime;
    
    // Apply movement if any component changed
    if (deltaLat !== 0 || deltaLon !== 0 || deltaAlt !== 0) {
      const newPosition: IPosition = {
        latitude: this._position.latitude + deltaLat,
        longitude: this._position.longitude + deltaLon,
        altitude: Math.max(0, this._position.altitude + deltaAlt), // Prevent negative altitude
      };
      
      // Handle coordinate wrapping and clamping
      newPosition.longitude = this.wrapLongitude(newPosition.longitude);
      newPosition.latitude = this.clampLatitude(newPosition.latitude);
      
      // Update position
      this.setPosition(newPosition);
    }
  };
  
  /**
   * Wrap longitude to [-180, 180] range
   */
  private wrapLongitude(lon: number): number {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
  }
  
  /**
   * Clamp latitude to [-90, 90] range
   */
  private clampLatitude(lat: number): number {
    return Math.max(-90, Math.min(90, lat));
  }
  
  // ========================================
  // Enhanced Click Handler (Auto-Focus)
  // ========================================
  
  /**
   * Handle click event
   * Now also sets keyboard focus when clicked
   */
  private handleClick = (eventData: { position: IPosition }): void => {
    // ✨ NEW: Set keyboard focus when clicked (if keyboard controllable)
    if (this._keyboardControllable) {
      this.eventsManager.setKeyboardFocus(this._id);
    }
    
    // Emit click event (existing behavior)
    this.eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: {
        position: this._position,
      },
    });
  };
  
  // ========================================
  // Enhanced Destroy
  // ========================================
  
  destroy(): void {
    // ✨ NEW: Unregister keyboard events
    this.unregisterKeyboardEvents();
    
    // Clear keyboard focus if this marker has it
    if (this.eventsManager.hasKeyboardFocus(this._id)) {
      this.eventsManager.setKeyboardFocus(null);
    }
    
    // ... existing cleanup
    this.unregisterSceneChangeListener();
    this.unregisterClickEvents();
    this.unregisterDragEvents();
    this.unregisterHoverEvents();
    
    // Reset state
    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;
    this._originalDragAltitude = null;
    this._originalDragAltitudeMode = null;
    
    // Remove entity
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
  }
}
```

---

## Code Examples

### Example 1: Create Keyboard-Controllable Marker

```typescript
import { createMapInstance } from '@libs/shared/map';

// Initialize map
const map = await createMapInstance('map-container');

// Get marker manager
const markerManager = map.getMarkerManager();

// Create keyboard-controllable marker
const marker = markerManager.createMarker({
  position: { 
    latitude: 37.7749, 
    longitude: -122.4194, 
    altitude: 100 
  },
  keyboardControllable: true,   // Enable keyboard control
  movementSpeed: 15,             // 15 m/s horizontal speed
  altitudeSpeed: 5,              // 5 m/s vertical speed
  labelText: 'Controllable Marker',
});

// Click marker to focus it, then use WASD to move
```

### Example 2: Listen to Keyboard Events

```typescript
// Listen to key events from marker
marker.getEventEmitter().addListener(IEventType.KEY_DOWN, (event) => {
  console.log(`Key pressed: ${event.data.key}`);
  
  // Handle custom keys
  if (event.data.key === 'r') {
    // Reset marker to original position
    marker.setPosition(originalPosition);
  }
  
  if (event.data.key === 'h') {
    // Toggle visibility
    marker.setVisibility(!marker.visible);
  }
});

marker.getEventEmitter().addListener(IEventType.KEY_UP, (event) => {
  console.log(`Key released: ${event.data.key}`);
});
```

### Example 3: Global Keyboard Shortcuts

```typescript
// Listen to global keyboard events (when no entity is focused)
map.onGlobalEvent(IEventType.KEY_DOWN, (event) => {
  // Escape: Clear focus
  if (event.key === 'Escape') {
    eventsManager.setKeyboardFocus(null);
    clearSelection();
  }
  
  // Ctrl+S: Save
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveMission();
  }
  
  // Ctrl+Z: Undo
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();
    undo();
  }
  
  // Delete: Remove focused entity
  if (event.key === 'Delete' || event.key === 'Backspace') {
    const focusedId = eventsManager.getKeyboardFocusedEntity();
    if (focusedId) {
      removeEntity(focusedId);
    }
  }
});
```

### Example 4: Focus Management

```typescript
// Manually set focus
eventsManager.setKeyboardFocus('marker-123');

// Check focus
const hasFocus = eventsManager.hasKeyboardFocus('marker-123');
console.log('Marker has focus:', hasFocus);

// Get focused entity
const focusedId = eventsManager.getKeyboardFocusedEntity();
console.log('Currently focused:', focusedId);

// Clear focus
eventsManager.setKeyboardFocus(null);

// Listen to focus changes
map.onGlobalEvent(IEventType.KEYBOARD_FOCUS_CHANGED, (event) => {
  if (event.entityId) {
    highlightEntity(event.entityId);
  } else {
    clearHighlights();
  }
});
```

### Example 5: Custom Movement Logic

```typescript
// Override continuous movement for custom behavior
class CustomMarker extends CesiumBaseMarker {
  private gridSize = 10; // 10 meter grid
  
  protected handleContinuousMovement = (eventData: any): void => {
    const keys = eventData.keys as string[];
    
    // Snap to grid when Shift is held
    if (keys.includes('Shift')) {
      const snappedPosition = {
        latitude: Math.round(this._position.latitude / this.gridSize) * this.gridSize,
        longitude: Math.round(this._position.longitude / this.gridSize) * this.gridSize,
        altitude: this._position.altitude,
      };
      this.setPosition(snappedPosition);
    } else {
      // Default smooth movement
      super.handleContinuousMovement(eventData);
    }
  };
}
```

---

## Usage Patterns

### Pattern 1: Waypoint Editor with Keyboard Navigation

```typescript
// In mission planner app
class WaypointEditor {
  private selectedWaypoint: IWaypoint | null = null;
  
  selectWaypoint(waypoint: IWaypoint): void {
    this.selectedWaypoint = waypoint;
    
    // Set keyboard focus to waypoint marker
    const markerId = waypoint.getMarkerId();
    eventsManager.setKeyboardFocus(markerId);
    
    // Enable keyboard control
    waypoint.setKeyboardControllable(true);
  }
  
  setupKeyboardShortcuts(): void {
    map.onGlobalEvent(IEventType.KEY_DOWN, (event) => {
      // Tab: Cycle through waypoints
      if (event.key === 'Tab') {
        event.preventDefault();
        this.selectNextWaypoint();
      }
      
      // Shift+Tab: Reverse cycle
      if (event.shiftKey && event.key === 'Tab') {
        event.preventDefault();
        this.selectPreviousWaypoint();
      }
      
      // Delete: Remove waypoint
      if (event.key === 'Delete' && this.selectedWaypoint) {
        this.removeWaypoint(this.selectedWaypoint);
      }
    });
  }
}
```

### Pattern 2: Multi-Entity Keyboard Control

```typescript
// Support keyboard control for multiple entity types
interface KeyboardControllableEntity {
  setKeyboardControllable(enabled: boolean): void;
  setMovementSpeed(speed: number): void;
}

class EntityKeyboardController {
  private entities = new Map<string, KeyboardControllableEntity>();
  
  register(entityId: string, entity: KeyboardControllableEntity): void {
    this.entities.set(entityId, entity);
    entity.setKeyboardControllable(true);
  }
  
  unregister(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.setKeyboardControllable(false);
      this.entities.delete(entityId);
    }
  }
  
  setSpeed(speed: number): void {
    this.entities.forEach(entity => {
      entity.setMovementSpeed(speed);
    });
  }
}
```

### Pattern 3: Keyboard-Driven Camera Follow

```typescript
// Make camera follow keyboard-controlled entity
class CameraFollower {
  private followingEntityId: string | null = null;
  
  followEntity(entityId: string): void {
    this.followingEntityId = entityId;
    
    // Listen to position changes
    map.onGlobalEvent(IEventType.POSITION_CHANGED, (event) => {
      if (event.entityId === this.followingEntityId && event.position) {
        // Pan camera to new position
        map.panTo({ position: event.position });
      }
    });
  }
  
  stopFollowing(): void {
    this.followingEntityId = null;
  }
}
```

---

## Performance Considerations

### 1. Animation Frame Optimization

**Problem**: Continuous movement can fire many position updates per second.

**Solution**: Already implemented via `requestAnimationFrame` at 60 FPS max.

```typescript
private readonly MOVEMENT_UPDATE_FPS = 60;
private lastMovementUpdateTime = 0;

// In update loop:
const now = Date.now();
const deltaTime = (now - this.lastMovementUpdateTime) / 1000;
this.lastMovementUpdateTime = now;
```

### 2. Batch Position Updates

**Problem**: Multiple entities moving simultaneously can cause lag.

**Solution**: Batch updates before rendering.

```typescript
class EntityBatchUpdater {
  private pendingUpdates = new Map<string, IPosition>();
  
  queueUpdate(entityId: string, position: IPosition): void {
    this.pendingUpdates.set(entityId, position);
  }
  
  flush(): void {
    this.pendingUpdates.forEach((position, entityId) => {
      const entity = getEntity(entityId);
      entity?.setPosition(position);
    });
    
    this.pendingUpdates.clear();
    viewer.scene.requestRender(); // Single render call
  }
}
```

### 3. Prevent Redundant Updates

**Problem**: Setting position when it hasn't changed wastes cycles.

**Solution**: Check for actual change before updating.

```typescript
private handleContinuousMovement = (eventData: any): void => {
  // ... calculate deltas
  
  // Skip if no actual movement
  if (deltaLat === 0 && deltaLon === 0 && deltaAlt === 0) {
    return; // No update needed
  }
  
  this.setPosition(newPosition);
};
```

### 4. Throttle Non-Critical Events

**Problem**: KEY_DOWN events fire rapidly when key is held.

**Solution**: Handle continuous movement separately, throttle discrete events.

```typescript
private lastKeyDownEmit = 0;
private readonly KEY_DOWN_THROTTLE = 100; // ms

private handleKeyDown = (eventData: any): void => {
  const now = Date.now();
  
  // Throttle rapid key down events
  if (now - this.lastKeyDownEmit < this.KEY_DOWN_THROTTLE) {
    return;
  }
  
  this.lastKeyDownEmit = now;
  this.eventEmitter.emit({ /* ... */ });
};
```

---

## Edge Cases & Solutions

### Edge Case 1: Page Scroll with Arrow Keys

**Problem**: Arrow keys scroll the page instead of moving entity.

**Solution**: Call `preventDefault()` for movement keys.

```typescript
if (this.isMovementKey(event.key)) {
  event.preventDefault(); // Prevent page scroll
}
```

### Edge Case 2: Focus Loss

**Problem**: Canvas loses focus when user clicks outside, causing "stuck keys".

**Solution**: Clear keyboard state on blur, refocus on click.

```typescript
canvas.addEventListener('blur', () => {
  this.keyboardStateTracker.clear();
  this.stopContinuousMovementLoop();
});

canvas.addEventListener('click', () => {
  canvas.focus(); // Refocus canvas
});
```

### Edge Case 3: Coordinate Wrapping

**Problem**: Longitude wraps at ±180°, latitude clamps at ±90°.

**Solution**: Implement wrapping and clamping logic.

```typescript
private wrapLongitude(lon: number): number {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

private clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}
```

### Edge Case 4: Multiple Modifiers

**Problem**: User holds Shift+Ctrl simultaneously.

**Solution**: Define precedence or combine effects.

```typescript
let speedMultiplier = 1.0;

// Shift: 2x faster
if (event.shiftKey) {
  speedMultiplier = 2.0;
}

// Ctrl: 0.5x slower (overrides Shift)
if (event.ctrlKey) {
  speedMultiplier = 0.5;
}

// Alt: Special mode (highest priority)
if (event.altKey) {
  // Custom behavior
}
```

### Edge Case 5: Numeric Keypad vs Top Row

**Problem**: '+' and '-' keys exist in two places.

**Solution**: Handle both key codes.

```typescript
const isAltitudeUp = 
  event.key === '+' || 
  event.key === '=' || 
  event.code === 'NumpadAdd';

const isAltitudeDown = 
  event.key === '-' || 
  event.key === '_' || 
  event.code === 'NumpadSubtract';
```

### Edge Case 6: Entity Deleted While Focused

**Problem**: Focused entity is removed, focus manager holds stale ID.

**Solution**: Clear focus in entity's `destroy()` method.

```typescript
destroy(): void {
  // Clear focus if this entity has it
  if (this.eventsManager.hasKeyboardFocus(this._id)) {
    this.eventsManager.setKeyboardFocus(null);
  }
  
  // ... rest of cleanup
}
```

---

## Testing Strategy

### Unit Tests

#### Test Suite 1: KeyboardFocusManager

```typescript
describe('KeyboardFocusManager', () => {
  let focusManager: KeyboardFocusManager;
  
  beforeEach(() => {
    focusManager = new KeyboardFocusManager();
  });
  
  test('should set focus to entity', () => {
    focusManager.setFocus('entity-1');
    expect(focusManager.getFocusedEntity()).toBe('entity-1');
    expect(focusManager.hasFocus('entity-1')).toBe(true);
  });
  
  test('should clear focus', () => {
    focusManager.setFocus('entity-1');
    focusManager.clearFocus();
    expect(focusManager.getFocusedEntity()).toBeNull();
  });
  
  test('should emit focus change event', () => {
    const listener = jest.fn();
    focusManager.onFocusChange(listener);
    
    focusManager.setFocus('entity-1');
    expect(listener).toHaveBeenCalledWith('entity-1');
    
    focusManager.setFocus('entity-2');
    expect(listener).toHaveBeenCalledWith('entity-2');
  });
  
  test('should not emit event when focus unchanged', () => {
    const listener = jest.fn();
    focusManager.onFocusChange(listener);
    
    focusManager.setFocus('entity-1');
    focusManager.setFocus('entity-1'); // Same entity
    
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
```

#### Test Suite 2: KeyboardStateTracker

```typescript
describe('KeyboardStateTracker', () => {
  let tracker: KeyboardStateTracker;
  
  beforeEach(() => {
    tracker = new KeyboardStateTracker();
  });
  
  test('should track key press', () => {
    tracker.keyDown('w');
    expect(tracker.isKeyPressed('w')).toBe(true);
  });
  
  test('should track key release', () => {
    tracker.keyDown('w');
    tracker.keyUp('w');
    expect(tracker.isKeyPressed('w')).toBe(false);
  });
  
  test('should get all pressed keys', () => {
    tracker.keyDown('w');
    tracker.keyDown('a');
    
    const pressed = tracker.getPressedKeys();
    expect(pressed).toContain('w');
    expect(pressed).toContain('a');
    expect(pressed).toHaveLength(2);
  });
  
  test('should detect movement keys', () => {
    expect(tracker.isMovementKeyPressed()).toBe(false);
    
    tracker.keyDown('w');
    expect(tracker.isMovementKeyPressed()).toBe(true);
    
    tracker.keyUp('w');
    expect(tracker.isMovementKeyPressed()).toBe(false);
  });
  
  test('should calculate movement vector', () => {
    tracker.keyDown('w'); // North
    tracker.keyDown('d'); // East
    
    const vector = tracker.getMovementVector();
    expect(vector.y).toBe(1);  // North
    expect(vector.x).toBe(1);  // East
    expect(vector.z).toBe(0);  // No altitude change
  });
  
  test('should clear all keys', () => {
    tracker.keyDown('w');
    tracker.keyDown('a');
    
    tracker.clear();
    
    expect(tracker.getPressedKeys()).toHaveLength(0);
  });
});
```

#### Test Suite 3: CesiumBaseMarker Keyboard

```typescript
describe('CesiumBaseMarker Keyboard', () => {
  let marker: CesiumBaseMarker;
  let mockMapServices: ICesiumMapService;
  
  beforeEach(() => {
    mockMapServices = createMockMapServices();
    
    marker = new CesiumBaseMarker(mockMapServices, {
      position: { latitude: 0, longitude: 0, altitude: 0 },
      keyboardControllable: true,
      movementSpeed: 10,
      altitudeSpeed: 5,
    });
  });
  
  test('should register keyboard events when enabled', () => {
    const spy = jest.spyOn(mockMapServices.eventsManager, 'registerEntityForEvent');
    
    marker.setKeyboardControllable(true);
    
    expect(spy).toHaveBeenCalledWith(CesiumEventType.KEY_DOWN, marker.id);
    expect(spy).toHaveBeenCalledWith(CesiumEventType.KEY_UP, marker.id);
    expect(spy).toHaveBeenCalledWith(CesiumEventType.KEY_PRESS, marker.id);
  });
  
  test('should unregister keyboard events when disabled', () => {
    const spy = jest.spyOn(mockMapServices.eventsManager, 'unregisterEntityFromEvent');
    
    marker.setKeyboardControllable(false);
    
    expect(spy).toHaveBeenCalledWith(CesiumEventType.KEY_DOWN, marker.id);
    expect(spy).toHaveBeenCalledWith(CesiumEventType.KEY_UP, marker.id);
    expect(spy).toHaveBeenCalledWith(CesiumEventType.KEY_PRESS, marker.id);
  });
  
  test('should move marker north on W key', () => {
    const initialLat = marker.position.latitude;
    
    // Simulate KEY_PRESS event with 'w' key
    const eventData = {
      keys: ['w'],
      movementVector: { x: 0, y: 1, z: 0 },
      deltaTime: 1.0, // 1 second
    };
    
    marker['handleContinuousMovement'](eventData);
    
    expect(marker.position.latitude).toBeGreaterThan(initialLat);
  });
  
  test('should set keyboard focus on click', () => {
    const spy = jest.spyOn(mockMapServices.eventsManager, 'setKeyboardFocus');
    
    marker['handleClick']({ position: marker.position });
    
    expect(spy).toHaveBeenCalledWith(marker.id);
  });
  
  test('should clear focus on destroy', () => {
    mockMapServices.eventsManager.setKeyboardFocus(marker.id);
    
    const spy = jest.spyOn(mockMapServices.eventsManager, 'setKeyboardFocus');
    
    marker.destroy();
    
    expect(spy).toHaveBeenCalledWith(null);
  });
});
```

### Integration Tests

```typescript
describe('Keyboard Control Integration', () => {
  let map: IFlytMap;
  let marker: IBaseMarker;
  
  beforeAll(async () => {
    map = await createMapInstance('test-container');
  });
  
  afterAll(() => {
    map.dispose();
  });
  
  test('should focus marker on click and respond to keyboard', async () => {
    // Create marker
    marker = map.getMarkerManager().createMarker({
      position: { latitude: 0, longitude: 0, altitude: 0 },
      keyboardControllable: true,
    });
    
    // Simulate click
    const clickEvent = new MouseEvent('click', { /* ... */ });
    canvas.dispatchEvent(clickEvent);
    
    // Check focus
    const focusedId = map.eventsManager.getKeyboardFocusedEntity();
    expect(focusedId).toBe(marker.id);
    
    // Simulate 'w' key press
    const keyEvent = new KeyboardEvent('keydown', { key: 'w' });
    canvas.dispatchEvent(keyEvent);
    
    // Wait for movement update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check position changed
    expect(marker.position.latitude).toBeGreaterThan(0);
  });
});
```

### Manual Testing Checklist

- [ ] Single key press (W, A, S, D)
- [ ] Key combinations (W+D, W+A)
- [ ] Key hold (continuous movement)
- [ ] Arrow keys
- [ ] Altitude keys (+/-)
- [ ] Modifier keys (Shift, Ctrl)
- [ ] Focus switching between entities
- [ ] Focus clearing (Escape)
- [ ] Multiple entities simultaneously
- [ ] Entity removal while focused
- [ ] Canvas focus loss and recovery
- [ ] Coordinate wrapping at poles/dateline
- [ ] Speed configuration changes
- [ ] Keyboard + mouse interaction
- [ ] Global shortcuts (Ctrl+S, Delete, etc.)

---

## Implementation Checklist

### Phase 1: Foundation ✅

- [ ] Add keyboard event types to `CesiumEventType` enum
- [ ] Add keyboard event types to `IEventType` enum
- [ ] Create `IKeyboardEventData` interface
- [ ] Create `CesiumKeyboardEventData` interface
- [ ] Export from appropriate index files

### Phase 2: Focus Management ✅

- [ ] Create `KeyboardFocusManager` class
- [ ] Implement `setFocus()` method
- [ ] Implement `getFocusedEntity()` method
- [ ] Implement `hasFocus()` method
- [ ] Implement `onFocusChange()` listener system
- [ ] Write unit tests for focus manager

### Phase 3: State Tracking ✅

- [ ] Create `KeyboardStateTracker` class
- [ ] Implement `keyDown()` / `keyUp()` methods
- [ ] Implement `isKeyPressed()` method
- [ ] Implement `getPressedKeys()` method
- [ ] Implement `getMovementVector()` helper
- [ ] Implement `clear()` method
- [ ] Write unit tests for state tracker

### Phase 4: Events Manager Extension ✅

- [ ] Add `KeyboardFocusManager` instance to `CesiumEventsManager`
- [ ] Add `KeyboardStateTracker` instance to `CesiumEventsManager`
- [ ] Implement `initializeKeyboardEventHandlers()`
- [ ] Attach `keydown` listener to canvas
- [ ] Attach `keyup` listener to canvas
- [ ] Implement continuous movement loop
- [ ] Add `setKeyboardFocus()` public method
- [ ] Add `getKeyboardFocusedEntity()` public method
- [ ] Add `hasKeyboardFocus()` public method
- [ ] Update `dispose()` to cleanup keyboard listeners
- [ ] Test canvas focus management
- [ ] Test blur event handling

### Phase 5: Base Marker Integration ✅

- [ ] Update `IMarkerConfig` interface with keyboard options
- [ ] Update `IBaseMarker` interface with keyboard methods
- [ ] Add keyboard control properties to `CesiumBaseMarker`
- [ ] Implement `setKeyboardControllable()` method
- [ ] Implement `setMovementSpeed()` method
- [ ] Implement `setAltitudeSpeed()` method
- [ ] Implement `registerKeyboardEvents()` private method
- [ ] Implement `unregisterKeyboardEvents()` private method
- [ ] Implement `handleKeyDown()` handler
- [ ] Implement `handleKeyUp()` handler
- [ ] Implement `handleContinuousMovement()` handler
- [ ] Implement WASD movement logic
- [ ] Implement altitude control (+/-)
- [ ] Implement coordinate wrapping/clamping
- [ ] Update `handleClick()` to set focus
- [ ] Update `destroy()` to cleanup keyboard state
- [ ] Write unit tests for marker keyboard control

### Phase 6: Documentation & Examples ✅

- [ ] Update API documentation
- [ ] Add usage examples to README
- [ ] Document keyboard shortcuts
- [ ] Add troubleshooting guide
- [ ] Create migration guide for existing code

### Phase 7: Testing ✅

- [ ] Write unit tests for all new classes
- [ ] Write integration tests
- [ ] Manual testing of all key combinations
- [ ] Test focus management edge cases
- [ ] Test performance with multiple entities
- [ ] Test cleanup/disposal scenarios
- [ ] Cross-browser testing

### Phase 8: Optional Enhancements 🔮

- [ ] Add visual focus indicator (highlight)
- [ ] Add on-screen keyboard hint overlay
- [ ] Add keyboard control for other entity types (waypoints, polygons)
- [ ] Add configurable key bindings
- [ ] Add gamepad support
- [ ] Add accessibility features (screen reader support)

---

## Future Enhancements

### 1. Configurable Key Bindings

Allow users to customize keyboard shortcuts:

```typescript
interface KeyBindingConfig {
  moveNorth: string[];      // Default: ['w', 'ArrowUp']
  moveSouth: string[];      // Default: ['s', 'ArrowDown']
  moveEast: string[];       // Default: ['d', 'ArrowRight']
  moveWest: string[];       // Default: ['a', 'ArrowLeft']
  moveUp: string[];         // Default: ['+', '=']
  moveDown: string[];       // Default: ['-', '_']
}

class KeyBindingManager {
  private bindings: KeyBindingConfig;
  
  setBinding(action: keyof KeyBindingConfig, keys: string[]): void {
    this.bindings[action] = keys;
  }
  
  isActionKey(action: keyof KeyBindingConfig, key: string): boolean {
    return this.bindings[action].includes(key);
  }
}
```

### 2. Keyboard Control for Other Entities

Extend to waypoints, polygons, models:

```typescript
// Waypoint with keyboard snap-to-grid
class KeyboardWaypoint extends Waypoint {
  handleContinuousMovement(eventData: any) {
    if (this.snapToGrid) {
      // Snap movement to grid
    }
  }
}

// Polygon with keyboard vertex editing
class KeyboardPolygon extends Polygon {
  handleKeyDown(eventData: any) {
    if (event.key === 'Tab') {
      this.selectNextVertex();
    }
  }
}
```

### 3. Gamepad Support

Add gamepad controller support:

```typescript
class GamepadManager {
  private connectedGamepads: Gamepad[] = [];
  
  initialize(): void {
    window.addEventListener('gamepadconnected', (e) => {
      this.connectedGamepads.push(e.gamepad);
    });
  }
  
  poll(): void {
    const gamepad = this.connectedGamepads[0];
    if (!gamepad) return;
    
    // Left stick: Movement
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];
    
    // Emit movement events
    // ...
  }
}
```

### 4. Visual Focus Indicator

Highlight focused entity:

```typescript
class FocusIndicator {
  private indicator: Entity | null = null;
  
  show(entityPosition: IPosition): void {
    // Create highlight ring around entity
    this.indicator = viewer.entities.add({
      position: positionToCartesian(entityPosition),
      ellipse: {
        semiMajorAxis: 10,
        semiMinorAxis: 10,
        material: Cesium.Color.YELLOW.withAlpha(0.5),
      },
    });
  }
  
  hide(): void {
    if (this.indicator) {
      viewer.entities.remove(this.indicator);
      this.indicator = null;
    }
  }
}
```

---

## Conclusion

This architecture provides a comprehensive, performant, and maintainable solution for keyboard control of map entities. It:

✅ Maintains consistency with existing mouse event patterns
✅ Uses native JavaScript keyboard events (Cesium limitation)
✅ Implements robust focus management
✅ Supports continuous movement with proper frame timing
✅ Handles all edge cases (focus loss, coordinate wrapping, etc.)
✅ Scales to multiple entity types
✅ Provides clean separation of concerns
✅ Includes comprehensive testing strategy

The implementation follows SOLID principles and can be extended to support additional features like configurable key bindings, gamepad support, and visual indicators.

---

**Next Steps**: Review this document, provide feedback, and approve for implementation.

