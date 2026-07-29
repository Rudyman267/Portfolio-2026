# Linear Mission Feature Entities - Architecture & Implementation Guide

**Document Version**: 1.0
**Last Updated**: 2025-12-25
**Authors**: Map Library Team
**Status**: Production

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Components](#architecture-components)
3. [LinearMissionView (Read-Only View)](#linearmission-read-only-view)
4. [LinearMissionPlanner (Interactive Editor)](#linearmissionplanner-interactive-editor)
5. [MarkerService - Visual Management](#markerservice---visual-management)
6. [StateService - State Machine](#stateservice---state-machine)
7. [OrientationComputationService - Yaw Calculation](#orientationcomputationservice---yaw-calculation)
8. [Complete Data Flow Examples](#complete-data-flow-examples)
9. [Key Algorithms Summary](#key-algorithms-summary)
10. [Performance Considerations](#performance-considerations)

---

## Overview

The linear mission system provides comprehensive mission planning capabilities for drone operations. It consists of **two main modes**:

1. **LinearMissionView (Read-only View)** - For displaying completed/plotted missions
2. **LinearMissionPlanner (Interactive Editor)** - For creating and editing missions

### File Structure

```
libs/shared/map/src/
├── private/feature-entities/missions/
│   ├── linear-mission/
│   │   ├── entities/
│   │   │   ├── linear-mission.ts (433 lines)
│   │   │   └── linear-mission-planner.ts (2000+ lines)
│   │   ├── managers/
│   │   │   └── mission-planner-manager.ts (200+ lines)
│   │   └── services/
│   │       ├── marker-service.ts (400+ lines)
│   │       ├── state-service.ts (150+ lines)
│   │       └── orientation-computation.service.ts (300+ lines)
│   ├── shared/
│   │   ├── constants/
│   │   │   ├── mission-planner.constants.ts
│   │   │   └── mission-view-styles.constants.ts
│   │   ├── services/
│   │   │   ├── event-service.ts
│   │   │   ├── takeoff-path.service.ts
│   │   │   └── debug-service.ts
│   │   └── utils/
│   │       └── mission-svg-utils.ts
└── public/contracts/feature-entities/missions/
    └── linear-mission/
        ├── entities/
        │   ├── linear-mission.interface.ts
        │   ├── linear-mission-planner.interface.ts
        │   └── linear-mission-options.interface.ts
        └── managers/
            └── mission-planner-manager.interface.ts
```

**Total Codebase**: ~7,140 lines across the linear-mission module

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   LinearMissionPlanner                       │
│  (2000+ lines - Interactive editing)                        │
├─────────────────────────────────────────────────────────────┤
│  Core Data:                                                  │
│  • _referencePoint: IPosition                               │
│  • _waypointsData: WaypointData[]                           │
│  • _takeoffMode, _takeoffAltitude                           │
├─────────────────────────────────────────────────────────────┤
│  Services (Dependency Injection):                           │
│  ├─ MarkerService → Visual elements management             │
│  ├─ StateService → State machine & transitions             │
│  ├─ EventService → Event pub/sub system                    │
│  ├─ OrientationComputationService → Yaw calculations       │
│  └─ TakeoffPathService → Flight path generation            │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Components

### 1. Main Entities

#### LinearMissionView (implements ILinearMissionView)

- **Purpose**: Read-only view of completed/plotted missions
- **File**: `libs/shared/map/src/private/feature-entities/missions/linear-mission/entities/linear-mission.ts`
- **Lines**: 433 lines
- **Key Properties**:
  - `id`: Unique identifier
  - `referencePoint`: Starting position (IPosition)
  - `waypoints`: Array of WaypointData (readonly)
  - `takeoffMode`: TakeoffMode enum (DIRECT_ASCENT | SAFE_TAKEOFF)
  - `takeoffAltitude`: Altitude in meters
  - `isSelected`, `isVisible`: State flags

#### LinearMissionPlanner (implements ILinearMissionPlanner)

- **Purpose**: Interactive mission planning and editing interface
- **File**: `libs/shared/map/src/private/feature-entities/missions/linear-mission/entities/linear-mission-planner.ts`
- **Lines**: 2000+ lines
- **Lifecycle States**:
  - `AWAITING_REFERENCE`: Initial state, waiting for reference point
  - `PLANNING`: Reference set, can add/edit waypoints

### 2. Manager: MissionPlannerManager

**Single Active Mission Model**: Only one linear mission can be planned at a time

**Core Responsibilities**:

- `createNewLinearMission(options)`: Create new planner
- `editLinearMission(refPoint, waypoints, options)`: Load for editing
- `getCurrentLinearMission()`: Get active planner
- `plotLinearMissionView(options)`: Create read-only view
- `getPlottedLinearMissionViewById(id)`: Retrieve by ID
- `getAllPlottedLinearMissionView()`: Get all views
- `removePlottedLinearMissionView(id)`: Delete view

### 3. Services Layer

#### MarkerService (400+ lines)

**Manages all visual map elements**:

- `_referenceMarker`: IFBMarker for starting point
- `_waypointMarkers`: IFBMarker[] array for waypoints
- `_takeoffPath`: IFBPolyline from reference to first waypoint
- `_waypointPath`: IFBPolyline connecting waypoints
- `_orientationModel`: IFBModel for 3D drone visualization

#### StateService (150+ lines)

**State Machine Implementation**:

- Manages `LinearMissionPlannerState` transitions
- Tracks `selectedWaypointIndex` (-1 = none)
- Tracks `editingWaypointIndex` (-1 = none)
- Validates state transitions

#### OrientationComputationService (300+ lines)

**Advanced device yaw calculation**:

- Three priority levels for yaw computation
- Trajectory-based calculation
- Waypoint-specific overrides
- Route inheritance logic

#### EventService (Generic, Shared)

**Generic event management** for both Linear and Grid missions

#### TakeoffPathService (100+ lines)

**Flight path generation** between reference point and first waypoint

---

## LinearMissionView (Read-Only View)

### Purpose

Display completed/plotted missions with selection and visibility toggle capabilities.

### Core Properties

```typescript
// Public readonly interface
public readonly id: string;
public readonly referencePoint: IPosition;
public readonly waypoints: ReadonlyArray<WaypointData>;  // HAE converted
public readonly takeoffMode: TakeoffMode;
public readonly takeoffAltitude: number;

// Internal state
private _isSelected = false;
private _isVisible = true;

// Coordinate storage (CRITICAL DESIGN)
private _originalRltWaypoints: ReadonlyArray<WaypointData>;  // Stored as RLT
private _convertedHaeWaypoints: WaypointData[];               // Converted to HAE for display
```

### Coordinate System Conversion Logic

**Key Insight**: Waypoints are stored **internally as RLT** (Relative To Launch) but **displayed as HAE** (Height Above Ellipsoid).

```typescript
// Constructor logic (lines 128-137)
this._originalRltWaypoints = structuredClone(options.waypoints); // Deep copy RLT data

// Convert RLT → HAE for visualization
this._convertedHaeWaypoints = this._convertWaypointsToHAE(structuredClone(this._originalRltWaypoints));

this.waypoints = this._convertedHaeWaypoints; // Public property shows HAE
```

**Conversion Algorithm** (lines 453-471):

```typescript
private _convertWaypointsToHAE(rltWaypoints): WaypointData[] {
  return rltWaypoints.map((waypoint) => {
    const haePosition: IPosition = {
      ...waypoint.position,
      altitude: (this.referencePoint?.altitude ?? 0) + (waypoint.position?.altitude ?? 0)
      //        ^^^^ Reference altitude (HAE)    ^^^^ Waypoint altitude (RLT offset)
    };

    return { ...waypoint, position: haePosition };
  });
}
```

**Why This Matters**: The drone flies in RLT mode (relative altitudes from takeoff), but the map displays in HAE (absolute altitudes above Earth's ellipsoid).

### Visual Entity Creation Flow

```
Constructor
  └─> _initializeEntities()
       ├─> _createReferencePointMarker()
       │    └─> IFBMarker with REFERENCE_POINT_STYLE
       ├─> _createWaypointMarkers()
       │    └─> Loop through waypoints
       │         └─> IFBMarker with numbered SVG (if selected)
       ├─> _createMissionPath()
       │    ├─> Generate takeoff path using TakeoffPathService
       │    ├─> Combine: [takeoffPath] + [remainingWaypoints]
       │    └─> IFBPolyline with combined positions
       └─> _registerEventHandlers()
            └─> Click events on all markers/path → setSelected(true) + callback
```

### Path Generation Algorithm

**Location**: `linear-mission.ts` lines 358-408

**Critical Logic**: The mission path consists of:

1. **Takeoff path**: Reference point → First waypoint (with altitude management)
2. **Waypoint path**: First waypoint → ... → Last waypoint

```typescript
private _createMissionPath(): void {
  // Get first waypoint
  const firstWaypoint = this.waypoints[0].position;

  // Generate takeoff path using TakeoffPathService
  const takeoffPath = this._takeoffPathService.generateTakeoffPath(
    this.referencePoint,      // Start position
    firstWaypoint,            // End position
    this.takeoffMode,         // DIRECT_ASCENT | SAFE_TAKEOFF
    this.takeoffAltitude      // Minimum altitude (2m enforced)
  );

  // Get remaining waypoint positions
  const waypointPositions = this.waypoints.map(wp => wp.position);

  // Combine paths, avoiding duplication of first waypoint
  const allPositions = [...takeoffPath, ...waypointPositions.slice(1)];
  //                                    ^^^^^^^^^^^^^^^^^^^^^^^ Skip first (already in takeoffPath)

  // Create polyline
  this._missionPath = this._compositeManager.createFBPolyline({
    positions: allPositions,
    style: this._isSelected ? SELECTED_PATH_STYLE : PATH_STYLE,
    labelText: this._missionName,
    visible: this._isVisible
  });
}
```

### Selection State Management

**Location**: `linear-mission.ts` lines 177-217

```typescript
public setSelected(selected: boolean): void {
  if (this._isSelected === selected) return;  // No-op if unchanged

  this._isSelected = selected;
  const selectedAsPrimitive = Boolean(selected);  // Ensure primitive boolean

  // 1. Update reference point marker image
  const refImagePath = selectedAsPrimitive
    ? SELECTED_REFERENCE_POINT_STYLE.image
    : REFERENCE_POINT_STYLE.image;
  this._referencePointMarker.updateImage(refImagePath);

  // 2. Update waypoint markers (with dynamic numbering)
  this._waypointMarkers.forEach((marker, index) => {
    if (selectedAsPrimitive) {
      const waypointNumber = index + 1;  // 1-based numbering
      const dynamicSvgUrl = MissionSvgUtils.getLinearMissionWPMarker(waypointNumber);
      marker.updateImage(dynamicSvgUrl);  // Show numbered marker
    } else {
      marker.updateImage(this.WAYPOINT_STYLE.image);  // Show generic marker
    }
  });

  // 3. Update mission path style
  this._missionPath.setStyle(
    selectedAsPrimitive ? SELECTED_PATH_STYLE : PATH_STYLE
  );
}
```

**Styling Differences**:

- **Unselected**: Gray path (#959595, 3px), generic markers
- **Selected**: Blue path (#3388ff, 4px), numbered markers (1, 2, 3...)

### Key Methods

| Method                            | Purpose                       | Location      |
| --------------------------------- | ----------------------------- | ------------- |
| `setSelected(selected: boolean)`  | Toggle selection highlighting | lines 177-217 |
| `setVisibility(visible: boolean)` | Show/hide mission on map      | lines 224-235 |
| `remove()`                        | Dispose and clean up          | lines 241-257 |
| `panTo()`                         | Center map on mission         | lines 263-268 |
| `onEvent(event, callback)`        | Event subscription            | lines 276-279 |

---

## LinearMissionPlanner (Interactive Editor)

### Purpose

Interactive mission planning and editing interface with full CRUD operations on waypoints.

### Core Data Storage

**Location**: `linear-mission-planner.ts`

```typescript
// Stored in RLT (Relative To Launch) coordinates
private _referencePoint: IPosition | null;
private _waypointsData: WaypointData[] = [];
private _takeoffMode: TakeoffMode;
private _takeoffAltitude: number;
private _routeSettings: IMissionRouteSettings;
```

### Lifecycle States

```
AWAITING_REFERENCE ─────> PLANNING
       ^                     │
       └─────────────────────┘
         (cancel/complete)
```

### Waypoint States

- `NORMAL`: Default, non-interacting
- `SELECTED`: Highlighted, ready for editing
- `EDITING`: Currently being modified (only one at a time)

### Core Features

#### 1. Reference Point Management

```typescript
/**
 * Set initial reference point (transition to PLANNING state)
 */
setReferencePoint(position: IPosition): boolean

/**
 * Modify existing reference point
 */
updateReferencePoint(position: IPosition): boolean
```

#### 2. Waypoint Management

```typescript
/**
 * Append waypoint to end
 */
addWaypoint(position: IPosition, properties?: Record<string, unknown>): boolean

/**
 * Insert waypoint at specific index
 */
insertWaypoint(index: number, position: IPosition, properties?: Record<string, unknown>): boolean

/**
 * Delete waypoint
 */
removeWaypoint(index: number): boolean

/**
 * Modify waypoint properties
 */
updateWaypoint(index: number, properties: Partial<WaypointData>): boolean

/**
 * Rearrange waypoint sequence
 */
reorderWaypoint(fromIndex: number, toIndex: number): boolean

/**
 * Retrieve waypoint data
 */
getWaypoints(): ReadonlyArray<WaypointData>
getWaypoint(index: number): WaypointData | undefined
```

#### 3. Selection & Editing

```typescript
/**
 * Select single waypoint
 */
selectWaypoint(index: number): boolean

/**
 * Start editing selected waypoint
 */
enterEditMode(): boolean

/**
 * End editing, keep selected
 */
exitEditMode(): boolean
```

#### 4. Visibility & Takeoff

```typescript
/**
 * Toggle map display
 */
setVisibility(visible: boolean): void

/**
 * Set takeoff behavior
 */
setTakeoffMode(mode: TakeoffMode): void

/**
 * Set minimum altitude (2m enforced)
 */
setTakeoffAltitude(altitude: number): void
```

#### 5. Mission Completion

```typescript
/**
 * Finalize and return mission data
 */
completeMission(): CompletedMissionData | null

/**
 * Abort without saving
 */
cancelMission(): void
```

**CompletedMissionData Structure**:

```typescript
{
  referencePoint: IPosition,
  waypoints: WaypointData[],
  takeoffMode: TakeoffMode,
  takeoffAltitude: number,
  properties?: Record<string, unknown>
}
```

#### 6. Advanced Orientation Control

```typescript
/**
 * Get full orientation (heading/pitch/roll)
 */
computeWaypointOrientation(index: number): IOrientation

/**
 * Get mission-specific yaw/gimbal data
 */
computeWaypointOrientationData(index: number): IWaypointOrientation

/**
 * Get base yaw before user offsets
 */
computeBaseDeviceYaw(index: number): number
```

#### 7. Altitude Management

```typescript
/**
 * Change altitude type/value for route
 */
updateRouteAltitudeSettings(settings: IRouteAltitudeSettings): void

/**
 * Toggle per-waypoint altitude sync with route
 */
updateWaypointFollowRoute(index: number, followRoute: boolean): void

/**
 * Batch terrain sampling for AGL
 */
getWaypointsWithExtendedPosition(): Promise<IExtendedPosition[]>

/**
 * Individual AGL calculation
 */
getWaypointExtendedPosition(index: number): Promise<IExtendedPosition>

/**
 * Convenience AGL getter
 */
getWaypointAGLAltitude(index: number): Promise<number | null>
```

#### 8. Route Settings

```typescript
/**
 * Get readonly route settings
 */
get missionRouteSettings(): IMissionRouteSettings

/**
 * Get readonly altitude settings
 */
get routeAltitudeSettings(): IRouteAltitudeSettings

/**
 * Change device yaw mode
 */
updateMissionRouteSettings(settings: IMissionRouteSettings): void
```

#### 9. Device Yaw Actions (Per-Waypoint Overrides)

```typescript
/**
 * Set custom yaw for specific waypoint
 */
updateDeviceYawActionValue(index: number, value: number, type: DroneYawActionTypes): void

/**
 * Remove yaw override
 */
clearDeviceYawAction(index: number): void

/**
 * Check if override exists
 */
hasDeviceYawAction(index: number): boolean
```

**Supported Types**:

- `FLIGHT_PATH`: Offset from trajectory direction
- `NORTH`: Absolute angle from North

#### 10. Waypoint Approach Settings

```typescript
/**
 * Set route vs custom approach
 */
updateWaypointApproachFollowRoute(index: number, followRoute: boolean): void

/**
 * Set approach mode
 */
updateWaypointApproachMode(index: number, mode: NextWaypointApproachMode): void

/**
 * Retrieve settings
 */
getWaypointApproachSettings(index: number): IWaypointApproachSettings
```

**Approach Modes**:

- `ALONG_ROUTE`: Follow trajectory
- `LOCK_YAW_AXIS`: Lock to reference bearing
- `MANUAL`: Manual specification
- `AUTO_ADJUST`: Current waypoint points North, next depends on route

#### 11. Navigation

```typescript
/**
 * Navigate to specific waypoint (1-based numbering)
 */
panToWaypoint(waypointNumber: number): void

/**
 * Show entire mission overview
 */
panToMission(): void
```

#### 12. Resource Management

```typescript
/**
 * Clean up all resources (event listeners, visual elements)
 */
dispose(): void
```

---

## MarkerService - Visual Management

### Purpose

Centralized management of all map visual elements with automatic path updates on position changes.

**Location**: `libs/shared/map/src/private/feature-entities/missions/linear-mission/services/marker-service.ts`
**Lines**: 400+ lines

### Entity Tracking

```typescript
// Visual elements
private _referenceMarker: IFBMarker | null = null;
private _waypointMarkers: IFBMarker[] = [];
private _takeoffPath: IFBPolyline | null = null;     // Reference → First waypoint
private _waypointPath: IFBPolyline | null = null;    // Waypoint → ... → Last
private _orientationModel: IFBModel | null = null;   // 3D drone model for editing

// Position tracking for auto-updates
private _referencePointPosition: IPosition | null = null;
private _waypointPositions: Map<number, IPosition> = new Map();
private _autoUpdatePath = true;  // Enable/disable automatic path redraw

// Event callbacks
private _positionChangeCallback: ((entityId, position) => void) | null;
private _markerClickCallback: ((entityId, waypointIndex?) => void) | null;
private _altDownCallback, _altUpCallback: ((entityId) => void) | null;
```

### Event Handling Architecture

**Location**: `marker-service.ts` lines 74-159

**Critical Pattern**: Event listeners are stored in a map for proper cleanup.

```typescript
private _eventListeners: Map<string, (event: IEvent) => void> = new Map();

private _setupMarkerEventHandlers(marker: IFBMarker, id: string): void {
  // 1. Position change listener
  const posListener = (event: IEvent) => {
    const newPosition = event?.data?.position || marker.position;
    const entityId = event?.id;

    // Handle internally first
    this._handleMarkerPositionChange(entityId, newPosition);

    // Then call external callback
    if (this._positionChangeCallback) {
      this._positionChangeCallback(entityId, newPosition);
    }
  };

  // 2. Click listener
  const clickListener = (event: IEvent) => {
    if (this._markerClickCallback) {
      if (this._waypointMarkers.includes(marker)) {
        const currentIndex = this._waypointMarkers.indexOf(marker);
        this._markerClickCallback(event.id, currentIndex);  // Pass index for waypoints
      } else {
        this._markerClickCallback(event.id);  // Reference point has no index
      }
    }
  };

  // Store for later removal
  this._eventListeners.set(`${id}-position`, posListener);
  this._eventListeners.set(`${id}-click`, clickListener);

  // Register on marker
  marker.getEventEmitter().addListener(IEventType.POSITION_CHANGED, posListener);
  marker.getEventEmitter().addListener(IEventType.CLICK, clickListener);

  // 3. Special Alt key handling for reference point (altitude dragging)
  if (id.includes('reference-point')) {
    const altDownListener = () => this._altDownCallback?.(id);
    const altUpListener = () => this._altUpCallback?.(id);

    this._eventListeners.set(`${id}-alt-down`, altDownListener);
    this._eventListeners.set(`${id}-alt-up`, altUpListener);

    marker.getEventEmitter().addListener(IEventType.ALT_PLUS_LEFT_DOWN, altDownListener);
    marker.getEventEmitter().addListener(IEventType.ALT_PLUS_LEFT_UP, altUpListener);
    marker.getEventEmitter().addListener(IEventType.LEFT_UP, altUpListener);  // Fallback
  }
}
```

### Automatic Path Update System

**Location**: `marker-service.ts` lines 908-1039

**Key Feature**: When user drags a marker, paths automatically redraw.

```typescript
private _handleMarkerPositionChange(entityId: string, position: IPosition): void {
  // Check if it's reference marker
  if (entityId.endsWith('-reference-point')) {
    this._referencePointPosition = { ...position };

    if (this._autoUpdatePath) {
      this._updateMissionPathFromStoredPositions();  // Redraw takeoff path
    }
    return;
  }

  // Check if it's a waypoint marker
  const waypointRegex = /waypoint-(\d+)$/;
  const match = entityId.match(waypointRegex);

  if (match) {
    const waypointIndex = parseInt(match[1], 10);
    this._waypointPositions.set(waypointIndex, { ...position });

    if (this._autoUpdatePath) {
      this._updateMissionPathFromStoredPositions();  // Redraw entire path
    }
  }
}

private _updateMissionPathFromStoredPositions(takeoffMode?, takeoffAltitude?): void {
  if (!this._referencePointPosition || !this._missionPath) return;

  // Collect all waypoint positions in order
  const waypointPositions: IPosition[] = [];
  for (let i = 0; i < this._waypointMarkers.length; i++) {
    const position = this._waypointPositions.get(i);
    if (position) waypointPositions.push(position);
  }

  // Update takeoff path (reference → first waypoint)
  if (this._takeoffPath && waypointPositions.length > 0) {
    const firstWaypoint = waypointPositions[0];

    if (takeoffMode && takeoffAltitude) {
      // Generate complex takeoff path
      const takeoffPathService = new TakeoffPathService();
      const takeoffPath = takeoffPathService.generateTakeoffPath(
        this._referencePointPosition,
        firstWaypoint,
        takeoffMode,
        takeoffAltitude
      );
      this._takeoffPath.setPositions(takeoffPath);
    } else {
      // Simple direct path
      this._takeoffPath.setPositions([this._referencePointPosition, firstWaypoint]);
    }
  }

  // Update waypoint path (connecting only waypoints)
  if (this._waypointPath) {
    this._waypointPath.setPositions(waypointPositions);
  }
}
```

### Waypoint Insertion/Removal Logic

**Location**: `marker-service.ts` lines 406-744

**Complex Operation**: When inserting/removing, all subsequent waypoints must:

1. Renumber their IDs
2. Renumber their visual markers (SVGs)
3. Shift their stored positions

```typescript
public insertWaypointMarker(id: string, position: IPosition, index: number): IFBMarker {
  // Create new marker
  const marker = this._compositeManager.createFBMarker({
    id: `${id}-waypoint-${index}`,
    position,
    style: { image: MissionSvgUtils.getLinearMissionPlannerWPMarker(index + 1) }
  });

  // Insert into array
  this._waypointMarkers.splice(index, 0, marker);

  // Shift positions for all subsequent waypoints
  for (let i = this._waypointMarkers.length - 1; i > index; i--) {
    const prevPos = this._waypointPositions.get(i - 1);
    if (prevPos) {
      this._waypointPositions.set(i, { ...prevPos });
    }
  }

  // Add new position
  this._waypointPositions.set(index, { ...position });

  // Update IDs for all markers from insertion point onwards
  this.updateWaypointIds(id, index + 1);

  // Update visual numbers (SVGs) for all markers from insertion point
  this._updateWaypointNumbers(index);

  // Redraw path
  this._updateMissionPathFromStoredPositions();

  return marker;
}
```

### Waypoint State Visual Updates

**Location**: `marker-service.ts` lines 550-585

**Three Visual States**: NORMAL, SELECTED, EDITING

```typescript
public updateWaypointState(index: number, state: WaypointState): void {
  const marker = this._waypointMarkers[index];
  const waypointNumber = index + 1;

  let svgUrl: string;
  switch (state) {
    case WaypointState.NORMAL:
      svgUrl = MissionSvgUtils.getLinearMissionPlannerWPMarker(waypointNumber);
      break;
    case WaypointState.SELECTED:
      svgUrl = MissionSvgUtils.getLinearMissionPlannerSelectedWPMarker(waypointNumber);
      break;
    case WaypointState.EDITING:
      svgUrl = MissionSvgUtils.getLinearMissionPlannerEditWPMarker(waypointNumber);
      break;
  }

  marker.updateImage(svgUrl);
  marker.setVisibility(true);  // Always visible
}
```

### Key Methods

| Method                     | Purpose                         | Lines     |
| -------------------------- | ------------------------------- | --------- |
| `createReferenceMarker()`  | Create reference point marker   | 202-232   |
| `createWaypointMarker()`   | Create numbered waypoint marker | 354-393   |
| `insertWaypointMarker()`   | Insert waypoint at index        | 406-457   |
| `removeWaypointMarker()`   | Remove waypoint by index        | 696-744   |
| `updateWaypointState()`    | Change visual state             | 550-585   |
| `createTakeoffPath()`      | Create takeoff polyline         | 289-313   |
| `createWaypointPath()`     | Create waypoint polyline        | 321-345   |
| `updateMissionPath()`      | Update all paths                | 592-620   |
| `ensureOrientationModel()` | Create/update 3D model          | 466-511   |
| `cleanupEntities()`        | Dispose all resources           | 1052-1112 |

---

## StateService - State Machine

### Purpose

Manages mission planner state transitions with validation.

**Location**: `libs/shared/map/src/private/feature-entities/missions/linear-mission/services/state-service.ts`
**Lines**: 150+ lines

### State Machine

```
AWAITING_REFERENCE ─────> PLANNING
       ^                     │
       └─────────────────────┘
         (cancel/complete)
```

**States**:

- `AWAITING_REFERENCE`: Initial state, waiting for user to click reference point
- `PLANNING`: Reference set, can add/edit/remove waypoints

### Core State Tracking

```typescript
private _state: LinearMissionPlannerState = LinearMissionPlannerState.AWAITING_REFERENCE;
private _selectedIndex = -1;   // Which waypoint is selected (-1 = none)
private _editingIndex = -1;    // Which waypoint is being edited (-1 = none)
```

### State Transition Validation

**Location**: `state-service.ts` lines 97-113

```typescript
private _isValidTransition(fromState, toState): boolean {
  switch (fromState) {
    case AWAITING_REFERENCE:
      // Can only go to PLANNING (when reference point is set)
      return toState === PLANNING;

    case PLANNING:
      // Can go back to AWAITING_REFERENCE (when canceling/completing)
      return toState === AWAITING_REFERENCE;

    default:
      return false;
  }
}

public transitionToState(newState): boolean {
  if (!this._isValidTransition(this._state, newState)) {
    return false;  // Invalid transition rejected
  }

  if (this._state === newState) return true;  // Already in state

  const oldState = this._state;
  this._state = newState;

  // Emit STATE_CHANGED event
  this._eventService.emitEvent(STATE_CHANGED, { oldState, newState });

  return true;
}
```

### Edit Mode Management

**Location**: `state-service.ts` lines 152-181

**Constraint**: Only ONE waypoint can be in edit mode at a time.

```typescript
public enterEditMode(): boolean {
  if (this._state !== PLANNING) return false;  // Must be in PLANNING state
  if (this._selectedIndex === -1) return false;  // Must have selected waypoint
  if (this._editingIndex === this._selectedIndex) return false;  // Already editing

  this._editingIndex = this._selectedIndex;
  return true;
}

public exitEditMode(): boolean {
  if (this._editingIndex === -1) return false;  // Not in edit mode

  this._editingIndex = -1;  // Clear editing state
  return true;
}
```

### Key Methods

| Method                        | Purpose                      | Returns |
| ----------------------------- | ---------------------------- | ------- |
| `transitionToState(newState)` | Change state with validation | boolean |
| `canAddWaypoints()`           | Check if can add waypoints   | boolean |
| `canEditWaypoints(count)`     | Check if can edit waypoints  | boolean |
| `selectWaypoint(index)`       | Update selection             | boolean |
| `enterEditMode()`             | Enter edit mode              | boolean |
| `exitEditMode()`              | Exit edit mode               | boolean |
| `reset()`                     | Reset to initial state       | void    |

---

## OrientationComputationService - Yaw Calculation

### Purpose

Computes device yaw (heading) for each waypoint with complex priority hierarchy.

**Location**: `libs/shared/map/src/private/feature-entities/missions/linear-mission/services/orientation-computation.service.ts`
**Lines**: 300+ lines

### Priority Hierarchy (Highest → Lowest)

```
1. Waypoint-specific deviceYawAction    ← Override for specific waypoint
2. Waypoint approach settings            ← How drone approaches THIS waypoint
3. Route device yaw mode                 ← Mission-wide default setting
```

### Main Computation Entry Point

**Location**: `orientation-computation.service.ts` lines 37-74

```typescript
public computeDeviceYaw(
  waypointIndex: number,
  waypointsData: WaypointData[],
  referencePoint: IPosition,
  routeDeviceYawMode: DeviceYawRouteSettingsMode
): number {
  // Validate inputs
  if (waypointIndex < 0 || waypointIndex >= waypointsData.length) return 0;
  if (!referencePoint) return 0;

  // Get effective yaw considering approach settings
  const effectiveYaw = this._computeWithApproachSettings(
    waypointIndex,
    waypointsData,
    referencePoint,
    routeDeviceYawMode
  );

  return this._normalizeYaw(effectiveYaw);  // Normalize to -180° to 180°
}
```

### Priority 1: Device Yaw Action Override

**Location**: lines 115-132, 691-726

**Two Types**:

1. **NORTH**: Absolute angle (e.g., 45° from North)
2. **FLIGHT_PATH**: Relative offset from flight path (e.g., +30° from trajectory)

```typescript
// In _computeWithApproachSettings (Priority 1 check)
if (waypoint.deviceYawAction) {
  const computedAngle = this._computeAngleFromDeviceYawAction(
    waypoint.deviceYawAction,
    waypointIndex,
    waypointsData,
    referencePoint,
    routeDeviceYawMode
  );
  return computedAngle;
}

// Implementation of _computeAngleFromDeviceYawAction
private _computeAngleFromDeviceYawAction(deviceYawAction, ...): number {
  const { value, type } = deviceYawAction;

  if (type === NORTH) {
    // Absolute angle: Use value directly
    return this._normalizeYaw(value);
  } else if (type === FLIGHT_PATH) {
    // Relative offset: Add to base flight path direction
    const baseDeviceYaw = this._computeBaseDeviceYawWithoutOverride(...);
    const finalAngle = baseDeviceYaw + value;
    return this._normalizeYaw(finalAngle);
  }
}
```

**Example**:

- Waypoint has `deviceYawAction = { value: 30, type: FLIGHT_PATH }`
- Base flight path direction: 45° (Northeast)
- Final yaw: 45° + 30° = 75°

### Priority 2: Approach Settings

**Location**: lines 134-216

**Approach Settings** control how the drone approaches the NEXT waypoint.

**Four Modes**:

1. **ALONG_ROUTE**: Follow trajectory direction
2. **LOCK_YAW_AXIS**: Lock to reference → first waypoint bearing
3. **MANUAL**: Same as LOCK_YAW_AXIS
4. **AUTO_ADJUST**: Current waypoint points North (0°), next waypoint behavior depends on route

**Effective Approach Settings**:

```typescript
private _getEffectiveApproachSettings(waypointIndex, waypointsData, routeDeviceYawMode) {
  const waypoint = waypointsData[waypointIndex];

  if (waypoint.approachSettings) {
    // Use stored settings
    return waypoint.approachSettings;
  }

  // Default: Follow route with mode matching route setting
  return {
    followRoute: true,
    nextWaypointApproachMode: this._mapRouteSettingToApproachMode(routeDeviceYawMode)
  };
}
```

**Special Case: ALONG_ROUTE + LOCK_YAW_AXIS** (lines 152-175):

**Scenario**: Route is "along route", but current waypoint has approach setting "lock yaw axis".

**Behavior**:

- **Current waypoint**: Keeps route-based angle (trajectory direction)
- **Next waypoint**: Inherits locked angle from current

```typescript
const isSpecialAlongRouteLockCase =
  routeDeviceYawMode === ALONG_ROUTE &&
  approachSettings.nextWaypointApproachMode === LOCK_YAW_AXIS &&
  !approachSettings.followRoute;

if (isSpecialAlongRouteLockCase) {
  // Current waypoint follows route settings
  return this._findEffectiveYawForWaypoint(...);
}
```

**Auto-Adjust Implementation** (lines 376-401):

```typescript
private _computeAutoAdjustYaw(waypointIndex, waypointsData, routeDeviceYawMode): number {
  // Current waypoint ALWAYS points to North (0°)

  // Next waypoint behavior depends on route:
  // - ALONG_ROUTE route → Next uses modified trajectory (current→next+1)
  // - LOCK_YAW_AXIS/MANUAL route → Next inherits 0°

  return 0;  // Current waypoint points North
}
```

### Priority 3: Route Device Yaw Mode

**Location**: lines 408-582

**Three Modes**:

1. **ALONG_ROUTE**: Each waypoint computes trajectory-based yaw
2. **LOCK_YAW_AXIS**: All waypoints inherit reference → first waypoint bearing
3. **MANUAL**: Same as LOCK_YAW_AXIS

**Inheritance Logic**:

```typescript
private _findEffectiveYawForWaypoint(targetIndex, ...): number {
  // Check if previous waypoint's approach settings affect this one
  if (targetIndex > 0) {
    const prevApproachSettings = this._getEffectiveApproachSettings(targetIndex - 1, ...);

    if (!prevApproachSettings.followRoute && prevApproachSettings.nextWaypointApproachMode) {
      const prevMode = prevApproachSettings.nextWaypointApproachMode;

      // NEXT WAYPOINT EFFECT handling
      if (prevMode === AUTO_ADJUST) {
        if (routeDeviceYawMode === ALONG_ROUTE) {
          // Use modified trajectory: WP(target-1) → WP(target+1)
          return this._computeModifiedTrajectoryForAutoAdjust(...);
        } else {
          // Inherit 0° from previous AUTO_ADJUST waypoint
          return 0;
        }
      }

      if (prevMode === LOCK_YAW_AXIS || prevMode === MANUAL) {
        // Inherit previous waypoint's angle
        const prevWaypointYaw = this._findEffectiveYawForWaypoint(targetIndex - 1, ...);
        return prevWaypointYaw;
      }
    }
  }

  // For ALONG_ROUTE mode: Each waypoint computes own yaw
  if (routeDeviceYawMode === ALONG_ROUTE) {
    return this._computeAlongRouteYaw(targetIndex, waypointsData, referencePoint);
  }

  // For LOCK_YAW_AXIS/MANUAL: Inherit reference → first waypoint angle
  return this._computeLockYawAxisYaw(waypointsData, referencePoint);
}
```

### Trajectory-Based Calculation

**Location**: lines 639-658

```typescript
private _computeAlongRouteYaw(index, waypointsData, referencePoint): number {
  let fromPosition: IPosition;
  let toPosition: IPosition;

  if (index === 0) {
    // First waypoint: Reference → WP0
    fromPosition = referencePoint;
    toPosition = waypointsData[0].position;
  } else {
    // Subsequent: WP(i-1) → WP(i)
    fromPosition = waypointsData[index - 1].position;
    toPosition = waypointsData[index].position;
  }

  return this._normalizeYaw(calculateBearing(fromPosition, toPosition));
}
```

**calculateBearing** uses Haversine formula to compute true bearing between two lat/lon points.

### Modified Trajectory for AUTO_ADJUST

**Location**: lines 590-633

**Special Algorithm**: When previous waypoint is AUTO_ADJUST with ALONG_ROUTE route.

```typescript
private _computeModifiedTrajectoryForAutoAdjust(targetIndex, ...): number {
  // Previous waypoint (targetIndex - 1) is AUTO_ADJUST
  // Current waypoint (targetIndex) should use: WP(target) → WP(target+1)

  if (targetIndex + 1 < waypointsData.length) {
    const fromPosition = waypointsData[targetIndex].position;      // Current waypoint
    const toPosition = waypointsData[targetIndex + 1].position;    // Next waypoint

    return this._normalizeYaw(calculateBearing(fromPosition, toPosition));
  } else {
    // No next waypoint, point to North
    return 0;
  }
}
```

**Why**: AUTO_ADJUST says "current waypoint points North, but next waypoint should follow trajectory". So next waypoint uses `current → next+1` direction instead of `previous → current`.

### Normalization

**Location**: lines 761-763

```typescript
private _normalizeYaw(yaw: number): number {
  return ((((yaw + 180) % 360) + 360) % 360) - 180;
  //      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //      Ensures result is in range [-180, 180]
}
```

**Examples**:

- Input: 270° → Output: -90°
- Input: -200° → Output: 160°
- Input: 45° → Output: 45°

---

## Complete Data Flow Examples

### Scenario: User Creates Linear Mission

```
1. User clicks map → Reference point set
   ├─> LinearMissionPlanner.setReferencePoint(position)
   ├─> StateService.transitionToState(PLANNING)
   ├─> MarkerService.createReferenceMarker(id, position)
   │    ├─> _setupMarkerEventHandlers() → Position change tracking
   │    └─> Store _referencePointPosition
   └─> EventService.emitEvent(REFERENCE_POINT_ADDED)

2. User clicks map → First waypoint added
   ├─> LinearMissionPlanner.addWaypoint(position)
   ├─> _waypointsData.push({ position, orientation, properties })
   ├─> MarkerService.createWaypointMarker(id, position, 0)
   │    ├─> Generate SVG with number "1"
   │    ├─> _setupMarkerEventHandlers()
   │    ├─> _waypointPositions.set(0, position)
   │    └─> _updateMissionPathFromStoredPositions()
   │         ├─> TakeoffPathService.generateTakeoffPath(ref, wp0, mode, altitude)
   │         └─> Update _takeoffPath polyline
   ├─> OrientationComputationService.computeDeviceYaw(0, ...)
   │    └─> Returns bearing from reference → WP0
   └─> EventService.emitEvent(WAYPOINT_ADDED, { index: 0, data })

3. User clicks map → Second waypoint added
   ├─> LinearMissionPlanner.addWaypoint(position)
   ├─> _waypointsData.push({ position, ... })
   ├─> MarkerService.createWaypointMarker(id, position, 1)
   │    ├─> Generate SVG with number "2"
   │    └─> _updateMissionPathFromStoredPositions()
   │         ├─> Update _takeoffPath (ref → WP0)
   │         └─> Update _waypointPath ([WP0, WP1])
   ├─> OrientationComputationService.computeDeviceYaw(1, ...)
   │    └─> Returns bearing from WP0 → WP1 (if ALONG_ROUTE)
   │        OR reference → WP0 (if LOCK_YAW_AXIS)
   └─> EventService.emitEvent(WAYPOINT_ADDED, { index: 1, data })

4. User selects waypoint 1 → Enter edit mode
   ├─> LinearMissionPlanner.selectWaypoint(1)
   ├─> StateService.selectWaypoint(1) → _selectedIndex = 1
   ├─> MarkerService.updateWaypointState(1, SELECTED)
   │    └─> Update SVG to selected style with number "2"
   ├─> EventService.emitEvent(WAYPOINT_SELECTED, { index: 1 })
   │
   ├─> LinearMissionPlanner.enterEditMode()
   ├─> StateService.enterEditMode() → _editingIndex = 1
   ├─> MarkerService.updateWaypointState(1, EDITING)
   │    └─> Update SVG to editing style with number "2"
   ├─> MarkerService.ensureOrientationModel(id, waypoint, orientation)
   │    ├─> Create IFBModel (3D drone)
   │    ├─> Position at waypoint location
   │    └─> Set attitude based on computed orientation
   └─> EventService.emitEvent(WAYPOINT_EDIT_STARTED, { index: 1 })

5. User drags waypoint 1 → Position updates
   ├─> Marker position change event fires
   ├─> MarkerService._handleMarkerPositionChange('waypoint-1', newPosition)
   │    ├─> _waypointPositions.set(1, newPosition)
   │    └─> _updateMissionPathFromStoredPositions()
   │         └─> Redraw _waypointPath with new positions
   ├─> _positionChangeCallback(entityId, newPosition)
   ├─> LinearMissionPlanner.updateWaypoint(1, { position: newPosition })
   │    ├─> _waypointsData[1].position = newPosition
   │    ├─> OrientationComputationService.computeDeviceYaw(1, ...)
   │    ├─> MarkerService.updateOrientationModel(newPosition, newOrientation)
   │    └─> EventService.emitEvent(WAYPOINT_UPDATED, { index: 1 })
   └─> UI updates in real-time

6. User completes mission
   ├─> LinearMissionPlanner.completeMission()
   ├─> Validate: minimum 2 waypoints, reference point set
   ├─> Return CompletedMissionData {
   │      referencePoint,
   │      waypoints: _waypointsData,
   │      takeoffMode,
   │      takeoffAltitude,
   │      properties
   │   }
   ├─> StateService.transitionToState(AWAITING_REFERENCE) → Reset
   ├─> MarkerService.cleanupEntities()
   │    ├─> Remove all markers
   │    ├─> Remove all paths
   │    ├─> Remove orientation model
   │    ├─> Clear event listeners
   │    └─> Clear position tracking maps
   └─> EventService.emitEvent(MISSION_COMPLETED)
```

---

## Key Algorithms Summary

### 1. Coordinate Conversion (RLT ↔ HAE)

```
RLT → HAE: HAE_altitude = reference_altitude + RLT_altitude
HAE → RLT: RLT_altitude = HAE_altitude - reference_altitude
```

### 2. Bearing Calculation

```javascript
// Haversine formula for true bearing
bearing = atan2(sin(Δlon) * cos(lat2), cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(Δlon)) * (180 / PI);
```

### 3. Yaw Priority Resolution

```
1. Check waypoint.deviceYawAction
   └─> YES → Compute based on type (NORTH/FLIGHT_PATH)
   └─> NO → Continue to step 2

2. Check waypoint.approachSettings
   └─> followRoute = false + nextWaypointApproachMode set
       └─> Compute based on approach mode
   └─> followRoute = true
       └─> Continue to step 3

3. Use route device yaw mode
   └─> ALONG_ROUTE → Trajectory-based
   └─> LOCK_YAW_AXIS → Reference → first waypoint
   └─> MANUAL → Same as LOCK_YAW_AXIS
```

### 4. Path Auto-Update

```
Position Change Event
  ↓
Identify entity (reference/waypoint-N)
  ↓
Update stored position map
  ↓
Rebuild path from stored positions
  ├─> Takeoff: generateTakeoffPath(ref, wp0, mode, altitude)
  └─> Waypoint: [wp0, wp1, ..., wpN]
  ↓
Set new positions on polylines
```

---

## Performance Considerations

### 1. Event Listener Management

- All listeners stored in `_eventListeners` map for proper cleanup
- Prevents memory leaks when markers are removed

### 2. Position Caching

- `_referencePointPosition` and `_waypointPositions` cache positions
- Avoids querying marker positions repeatedly

### 3. Auto-Update Toggle

- `_autoUpdatePath` can disable automatic redraws
- Useful for batch operations (add multiple waypoints without redrawing each time)

### 4. Defensive Copying

- `structuredClone()` used for deep copying waypoint data
- Prevents accidental mutations of original data

### 5. SVG Marker Caching

- `MissionSvgUtils` generates SVG data URLs dynamically
- Could be optimized with caching for frequently used numbers

### 6. Browser Support

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+
- **Requires**: WebGL 2.0 support

### 7. Entity Limits

- Recommended maximum of 100 active entities
- Update strategy: Batch updates for better performance
- Visibility management: Use visibility culling for large datasets
- Memory management: Proper entity disposal critical (memory leak risk)

---

## Data Structures Reference

### WaypointData

```typescript
{
  position: IPosition;
  orientation?: IOrientation;
  properties?: Record<string, unknown>;
  followRouteAltitude?: boolean;      // Sync with route settings
  deviceYawAction?: IWaypointDeviceYawAction;  // Custom yaw override
  approachSettings?: IWaypointApproachSettings; // Route vs custom approach
}
```

### IPosition

```typescript
{
  latitude: number;
  longitude: number;
  altitude: number;
}
```

### IOrientation

```typescript
{
  heading: number; // Device yaw for mission
  pitch: number; // Gimbal tilt
  roll: number; // Bank angle
}
```

### IWaypointOrientation (Mission-Specific)

```typescript
{
  deviceYaw: number; // Device yaw angle
  gimbalYaw: number; // Gimbal pan (currently 0)
  gimbalTilt: number; // Gimbal tilt (currently 0)
}
```

### IRouteAltitudeSettings

```typescript
{
  type: 'RLT' | 'AGL';  // Relative To Launch or Above Ground Level
  value: number;
  onlyTypeChanged?: boolean;
}
```

### IMissionRouteSettings

```typescript
{
  deviceYawRouteSetting: {
    mode: DeviceYawRouteSettingsMode;
  }
}
```

### ILinearMissionPlannerOptions

```typescript
{
  id?: string;
  initialReferencePoint?: IPosition;  // Triggers PLANNING state
  takeoffMode: TakeoffMode;           // DIRECT_ASCENT | SAFE_TAKEOFF
  takeoffAltitude: number;            // Minimum 2 meters
  routeAltitudeSettings: IRouteAltitudeSettings;
  routeDeviceYawMode: DeviceYawRouteSettingsMode;
  routeSettings?: IMissionRouteSettings;  // Deprecated, use routeDeviceYawMode
}
```

---

## Event Types

### LinearMissionPlannerEventType

```typescript
enum LinearMissionPlannerEventType {
  REFERENCE_POINT_ADDED = 'reference_point_added',
  REFERENCE_POINT_CHANGED = 'reference_point_changed',
  WAYPOINT_ADDED = 'waypoint_added',
  WAYPOINT_REMOVED = 'waypoint_removed',
  WAYPOINT_UPDATED = 'waypoint_updated',
  WAYPOINT_SELECTED = 'waypoint_selected',
  WAYPOINT_EDIT_STARTED = 'waypoint_edit_started',
  WAYPOINT_EDIT_ENDED = 'waypoint_edit_ended',
  STATE_CHANGED = 'state_changed',
  MISSION_VISIBILITY_CHANGED = 'mission_visibility_changed',
  MISSION_VALIDATION_FAILED = 'mission_validation_failed',
  MISSION_CANCELLED = 'mission_cancelled',
  MISSION_DISTANCE_CHANGED = 'mission_distance_changed',
  ROUTE_SETTINGS_CHANGED = 'route_settings_changed',
  WAYPOINTS_ALTITUDE_UPDATED = 'waypoints_altitude_updated',
}
```

---

## Integration Points with Map Library

### 1. With Composite Manager (ICompositeManager)

- Creates and manages map entities (markers, polylines, models)
- Provides map service access
- Handles entity lifecycle

### 2. With Map Events (IEventType, IMapEventData)

- Global map click events
- Entity-specific events (marker clicks, position changes)
- Altitude drag operations

### 3. With Map Services

- Map provider services for rendering
- Terrain sampling for AGL altitude calculations
- Camera/view control for panning operations

### 4. With Contracts

- Uses public interfaces for type safety
- Implements specific interfaces (ILinearMissionPlanner, ILinearMissionView)
- Exports contracts for external consumption

---

## Summary of Relationships

```
IMissionPlannerManager (public interface)
    ↓
MissionPlannerManager (implementation)
    ├─→ Manages: ILinearMissionPlanner active instance
    ├─→ Manages: ILinearMissionView collection
    └─→ Uses: ICompositeManager

ILinearMissionPlanner (public interface)
    ↓
LinearMissionPlanner (implementation, 2000+ lines)
    ├─→ Uses: MarkerService (visual elements)
    ├─→ Uses: StateService (state transitions)
    ├─→ Uses: EventService (event management)
    ├─→ Uses: OrientationComputationService (yaw calculations)
    ├─→ Uses: TakeoffPathService (flight paths)
    ├─→ Uses: DebugService (logging)
    └─→ Stores: WaypointData[], IPosition reference, settings

ILinearMissionView (public interface)
    ↓
LinearMissionView (implementation, 433 lines)
    ├─→ Uses: ICompositeManager
    ├─→ Uses: TakeoffPathService
    ├─→ Stores: readonly waypoints, referencePoint
    └─→ Provides: read-only visualization
```

---

## Conclusion

The linear mission feature entities provide a robust, well-architected system for mission planning with:

- ✅ Clear separation of concerns (service-based architecture)
- ✅ Robust state management with validation
- ✅ Flexible yaw computation with priority hierarchy
- ✅ Automatic visual updates on position changes
- ✅ Proper event handling and cleanup
- ✅ Coordinate system conversion handling (RLT ↔ HAE)
- ✅ Comprehensive altitude management (RLT, HAE, AGL)
- ✅ Advanced orientation control with waypoint-specific overrides

**Key Design Decisions**:

1. **Single Active Mission Model**: Ensures focused UI, prevents conflicts
2. **RLT Internal Storage**: Consistency, easier coordinate handling
3. **Service-Based Architecture**: Separation of concerns (markers, state, events)
4. **Approach Settings**: Allows per-waypoint yaw overrides while maintaining route defaults
5. **AGL Computation**: Lazy-loaded for performance, terrain-aware altitude
6. **Generic EventService**: Reusable for both Linear and Grid missions
7. **SVG-Based Markers**: Lightweight, numbered waypoint identification

This architecture provides a robust, extensible foundation for mission planning with clear separation between planning (interactive) and viewing (read-only) modes.
