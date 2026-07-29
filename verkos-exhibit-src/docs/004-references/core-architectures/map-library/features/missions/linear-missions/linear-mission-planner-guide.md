# Linear Mission Planner Guide

This document provides a comprehensive guide for using the Linear Mission Planner interfaces to create and manage linear missions with waypoints on a map. The Linear Mission Planner is designed specifically for the planning phase of linear missions.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)

- [Mission Planner States](#mission-planner-states)
- [Waypoint States](#waypoint-states)
- [Waypoints](#waypoints)
- [Events](#events)

3. [Using the Mission Planner Manager](#using-the-mission-planner-manager)

- [Creating a New Linear Mission](#creating-a-new-linear-mission)
- [Loading an Existing Linear Mission for Editing](#loading-an-existing-linear-mission-for-editing)
- [Managing Linear Mission Planners](#managing-linear-mission-planners)

4. [Working with Linear Missions](#working-with-linear-missions)

- [Setting and Updating Reference Points](#setting-and-updating-reference-points)
- [Adding and Managing Waypoints](#adding-and-managing-waypoints)
- [Selecting and Editing Waypoints](#selecting-and-editing-waypoints)
- [Orientation and Route Settings](#orientation-and-route-settings)
- [Route Altitude Settings](#route-altitude-settings)
- [Reordering Waypoints](#reordering-waypoints)
- [Navigation and Visibility](#navigation-and-visibility)
- [Completing or Canceling the Mission](#completing-or-canceling-the-mission)

5. [AGL Support and Extended Position](#agl-support-and-extended-position)

- [Understanding AGL vs RLT](#understanding-agl-vs-rlt)
- [Getting Extended Position Data](#getting-extended-position-data)
- [Working with Terrain-Aware Altitudes](#working-with-terrain-aware-altitudes)

6. [Event Handling](#event-handling)

- [Subscribing to Events](#subscribing-to-events)
- [Available Event Types](#available-event-types)
- [Event Data Structure](#event-data-structure)

7. [Integration Patterns](#integration-patterns)

- [Map Click Integration](#map-click-integration)
- [Form Integration](#form-integration)
- [UI State Management](#ui-state-management)

8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

## Overview

The Linear Mission Planner provides a comprehensive toolset for creating and editing linear missions with waypoints. It follows a state-based approach where missions transition through different states during planning:

1. **AWAITING_REFERENCE**: Initial state waiting for a reference point to be set
2. **PLANNING**: Active planning state where waypoints can be added and modified

The planner provides a rich set of operations for waypoint management and emits events to keep your UI in sync with the mission state. When planning is complete, it returns the completed mission data and removes the planning visualization from the map.

## Core Concepts

### Mission Planner States

The `LinearMissionPlannerState` enum defines the possible states of a mission planner:

```typescript
enum LinearMissionPlannerState {
  AWAITING_REFERENCE, // No reference point yet
  PLANNING, // Has reference, adding waypoints
}
```

These states control which operations are allowed at different points in the mission planning lifecycle:

- In `AWAITING_REFERENCE` state, most operations are restricted until a reference point is set.
- In `PLANNING` state, waypoints can be added, modified, or removed freely.

### Waypoint States

Individual waypoints can exist in one of three states:

```typescript
enum WaypointState {
  NORMAL, // Default, non-selected state
  SELECTED, // Highlighted, but not being edited
  EDITING, // Currently being modified (position or properties)
}
```

Important waypoint state rules:

- Only one waypoint can be in SELECTED or EDITING state at a time
- A waypoint must first be SELECTED before it can enter EDITING state
- A waypoint in EDITING state is also considered to be in SELECTED state
- When a new waypoint is added, it automatically becomes SELECTED
- When a waypoint is removed, the previous waypoint (if any) becomes SELECTED

### Waypoints

Waypoints represent points along the mission path and include position and optional properties:

```typescript
interface WaypointData {
  position: IPosition; // Geographic coordinates
  orientation?: IOrientation; // Optional heading/attitude information
  properties?: Record<string, unknown>; // Optional additional properties
  followRouteAltitude?: boolean; // Whether this waypoint follows route altitude settings (default: true)
}
```

### Completed Mission Data

When planning is finished, the planner returns a `CompletedMissionData` object containing the final mission configuration:

```typescript
interface CompletedMissionData {
  referencePoint: IPosition;
  waypoints: WaypointData[];
  takeoffMode: TakeoffMode;
  takeoffAltitude: number;
  properties?: Record<string, unknown>;
}
```

### Events

The planner emits events for all significant state changes and operations. Events follow a standardized format defined by the `LinearMissionPlannerEventType` enum and `LinearMissionPlannerEventData` interface.

## Using the Mission Planner Manager

The `IMissionPlannerManager` interface provides methods for creating, retrieving, and managing linear mission planning. **Important**: Only one linear mission can be planned at a time.

### Creating a New Linear Mission

To create a new linear mission from scratch:

```typescript
import { IMissionPlannerManager, TakeoffMode } from '@libs/shared/map/public/base/feature-managers';

// Get the mission planner manager instance (implementation-specific)
const missionPlannerManager: IMissionPlannerManager = /* ... */;

// Create a new linear mission with default takeoff settings (starts in AWAITING_REFERENCE state)
// If another linear mission is currently being planned, it will be cancelled first
const missionPlanner = missionPlannerManager.createNewLinearMission({
  takeoffMode: TakeoffMode.DIRECT_ASCENT,
  takeoffAltitude: 0,
  // Route altitude settings are mandatory
  routeAltitudeSettings: {
    type: 'RLT', // RLT or AGL
    value: 100   // Altitude in meters
  },
  // Route device yaw mode is mandatory
  routeDeviceYawMode: DeviceYawRouteSettingsMode.ALONG_ROUTE
});
```

You can also create a linear mission with an initial reference point, which will start it in the `PLANNING` state:

```typescript
// Create a linear mission with reference point (starts in PLANNING state)
const missionPlanner = missionPlannerManager.createNewLinearMission({
  initialReferencePoint: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 100,
  },
  takeoffMode: TakeoffMode.DIRECT_ASCENT,
  takeoffAltitude: 0,
  routeAltitudeSettings: {
    type: 'RLT',
    value: 100,
  },
  routeDeviceYawMode: DeviceYawRouteSettingsMode.ALONG_ROUTE,
});
```

You can configure takeoff settings when creating a new mission:

```typescript
// Create a mission with SAFE_TAKEOFF mode and custom takeoff altitude
const missionPlanner = missionPlannerManager.createNewLinearMission({
  initialReferencePoint: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 100,
  },
  takeoffMode: TakeoffMode.SAFE_TAKEOFF,
  takeoffAltitude: 30, // Safe takeoff altitude in meters (minimum 2 meters enforced)
  routeAltitudeSettings: {
    type: 'AGL', // Use AGL for terrain following
    value: 120, // 120 meters above ground
  },
  routeDeviceYawMode: DeviceYawRouteSettingsMode.LOCK_YAW_AXIS,
});
```

### Loading an Existing Linear Mission for Editing

To load an existing linear mission for editing:

```typescript
// Load an existing linear mission with waypoints and required takeoff settings
// If another linear mission is currently being planned, it will be cancelled first
const missionPlanner = missionPlannerManager.editLinearMission(
  // Reference point
  { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  // Waypoints array
  [
    {
      position: { latitude: 37.775, longitude: -122.4195, altitude: 110 },
      orientation: { heading: 45, pitch: 0, roll: 0 },
    },
    {
      position: { latitude: 37.776, longitude: -122.4196, altitude: 120 },
    },
  ],
  // Required takeoff settings
  {
    takeoffMode: TakeoffMode.DIRECT_ASCENT,
    takeoffAltitude: 0,
    routeAltitudeSettings: {
      type: 'RLT',
      value: 100,
    },
    routeDeviceYawMode: DeviceYawRouteSettingsMode.ALONG_ROUTE,
  }
);
```

Here's another example with SAFE_TAKEOFF mode:

```typescript
// Load a linear mission with SAFE_TAKEOFF mode
const missionPlanner = missionPlannerManager.editLinearMission(
  // Reference point
  { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  // Waypoints array
  [
    {
      position: { latitude: 37.775, longitude: -122.4195, altitude: 110 },
      orientation: { heading: 45, pitch: 0, roll: 0 },
    },
    {
      position: { latitude: 37.776, longitude: -122.4196, altitude: 120 },
    },
  ],
  // Required takeoff settings
  {
    takeoffMode: TakeoffMode.SAFE_TAKEOFF,
    takeoffAltitude: 30,
    routeAltitudeSettings: {
      type: 'AGL',
      value: 120,
    },
    routeDeviceYawMode: DeviceYawRouteSettingsMode.LOCK_YAW_AXIS,
  }
);
```

### Getting the Current Linear Mission

Since only one linear mission can be planned at a time, the manager provides a method to get the currently active linear mission:

```typescript
// Get the current linear mission being planned, if any
const currentMission = missionPlannerManager.getCurrentLinearMission();

if (currentMission) {
  console.log('Currently editing a linear mission with', currentMission.waypointCount, 'waypoints');
} else {
  console.log('No linear mission currently being planned');

  // Create a new one if needed
  const newMission = missionPlannerManager.createNewLinearMission();
}
```

## Working with Linear Missions

Once you have a linear mission planner instance, you can use its methods to manage the mission.

### Setting and Updating Reference Points

For new missions that start in the `AWAITING_REFERENCE` state, you need to set a reference point:

```typescript
// Set reference point (transitions to PLANNING state)
missionPlanner.setReferencePoint({
  latitude: 37.7749,
  longitude: -122.4194,
  altitude: 100,
});
```

For missions already in the `PLANNING` state, you can update the reference point:

```typescript
// Update reference point
missionPlanner.updateReferencePoint({
  latitude: 37.775,
  longitude: -122.4195,
  altitude: 110,
});
```

### Takeoff Configuration

The Linear Mission Planner supports two takeoff modes:

```typescript
enum TakeoffMode {
  // The aircraft will ascend to the start point altitude and fly to the start point directly
  DIRECT_ASCENT = 'direct_ascent',

  // The aircraft will ascend to the safe takeoff altitude before flying to the start point
  SAFE_TAKEOFF = 'safe_takeoff',
}
```

**Important Note about Takeoff Altitude:** A minimum takeoff altitude of 2 meters is enforced for safety reasons. If you attempt to set a takeoff altitude less than 2 meters, it will be automatically adjusted to 2 meters with a console warning. This applies both when creating a new mission and when updating the takeoff altitude during planning.

These takeoff modes determine how the aircraft will behave during the initial phase of the mission:

- **Direct Ascent**: The aircraft will ascend to the start point altitude and fly to the start point directly.
- **Safe Takeoff**: The aircraft will ascend to the safe takeoff altitude before flying to the start point.
  - If the safe takeoff altitude is greater than the first waypoint altitude, the aircraft will maintain the safe takeoff altitude, fly directly above the first waypoint, and then descend to the waypoint altitude.
  - If the safe takeoff altitude is less than the first waypoint altitude, the aircraft will ascend to the waypoint altitude after takeoff and then fly to the first waypoint directly.

Takeoff settings are mandatory and must be configured when creating or loading a mission (as shown in the earlier examples). You can access these settings through the mission planner instance:

```typescript
// Get the current takeoff mode
const takeoffMode = missionPlanner.takeoffMode;
console.log(`Takeoff mode: ${takeoffMode}`);

// Get the safe takeoff altitude (relevant for SAFE_TAKEOFF mode)
const takeoffAltitude = missionPlanner.takeoffAltitude;
console.log(`Safe takeoff altitude: ${takeoffAltitude}m`);
```

You can also update these settings during mission planning using the following methods:

```typescript
// Update the takeoff mode to SAFE_TAKEOFF
try {
  missionPlanner.setTakeoffMode(TakeoffMode.SAFE_TAKEOFF);
  console.log('Takeoff mode updated to SAFE_TAKEOFF');
} catch (error) {
  console.error('Failed to update takeoff mode:', error.message);
}

// Update the safe takeoff altitude to 30 meters
try {
  missionPlanner.setTakeoffAltitude(30);
  console.log('Safe takeoff altitude updated to 30 meters');
  // Note: A minimum of 2 meters is enforced - if you provide a value less than 2,
  // it will be automatically set to 2 meters with a console warning
} catch (error) {
  console.error('Failed to update takeoff altitude:', error.message);
}
```

Note that these methods can only be called while the mission is in the PLANNING state.

These settings will be included in the completed mission data when you finish planning.

### Adding and Managing Waypoints

Once a mission is in the `PLANNING` state, you can add and manage waypoints:

```typescript
// Add a waypoint at the end of the mission
const waypointIndex = missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 110 }, { orientation: { heading: 45, pitch: 0, roll: 0 } });

// Insert a waypoint at a specific index
missionPlanner.insertWaypoint(
  1, // Insert as the second waypoint
  { latitude: 37.776, longitude: -122.4196, altitude: 120 }
);

// Update a waypoint
missionPlanner.updateWaypoint(0, {
  position: { latitude: 37.777, longitude: -122.4197, altitude: 130 },
  orientation: { heading: 90, pitch: 0, roll: 0 },
});

// Remove a waypoint
missionPlanner.removeWaypoint(1);
```

Before performing operations, you can check if they're allowed in the current state:

```typescript
if (missionPlanner.canAddWaypoints()) {
  missionPlanner.addWaypoint({
    latitude: 37.775,
    longitude: -122.4195,
    altitude: 110,
  });
}
```

### Selecting and Editing Waypoints

The planner provides methods for selecting waypoints and putting them in edit mode:

```typescript
// Get the current selected and editing waypoint indices
const selectedIndex = missionPlanner.selectedWaypointIndex;
const editingIndex = missionPlanner.editingWaypointIndex;

// Select a waypoint
// This will deselect any previously selected waypoint
missionPlanner.selectWaypoint(0);

// Put the selected waypoint into edit mode
// Returns true if successful, false if no waypoint is selected
const success = missionPlanner.enterEditMode();

// Exit edit mode (waypoint remains selected)
missionPlanner.exitEditMode();
```

Waypoint selection and editing can be triggered both through method calls and direct map interactions. A waypoint will be visually represented differently based on its state:

- **NORMAL**: Default styling
- **SELECTED**: Highlighted styling to indicate selection
- **EDITING**: Special styling to indicate it's being edited

When a waypoint is in edit mode, it can be modified both through direct map manipulation (dragging) and form inputs.

### Orientation and Route Settings

The Linear Mission Planner provides advanced orientation capabilities that allow you to control device yaw (heading) behavior for waypoints. This includes three different yaw computation modes and the ability to compute orientation data for individual waypoints.

#### Mission Route Settings

Route settings control how device orientation is computed for all waypoints in the mission. These settings are applied at the mission level and affect how waypoint orientation is calculated:

```typescript
// Get current mission route settings
const routeSettings = missionPlanner.missionRouteSettings;
console.log('Current yaw mode:', routeSettings.deviceYawRouteSettingsMode);

// Available yaw computation modes
enum DeviceYawRouteSettingsMode {
  ALONG_ROUTE = 'along_route', // Yaw follows the trajectory direction
  LOCK_YAW_AXIS = 'lock_yaw_axis', // Yaw locked to a specific value
  MANUAL = 'manual', // Manual control for each waypoint
}
```

You can update the route device yaw mode to change how orientation is computed:

```typescript
// Set route to follow trajectory direction
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE);

// Lock yaw to reference point → first waypoint angle
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.LOCK_YAW_AXIS);

// Use manual orientation control (same as LOCK_YAW_AXIS for now)
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.MANUAL);

// Access current route device yaw mode
const currentMode = missionPlanner.routeDeviceYawMode;
console.log('Current device yaw mode:', currentMode);
```

#### Yaw Computation Modes

**ALONG_ROUTE Mode**: The device yaw is automatically computed based on the trajectory direction between waypoints. This is useful for missions where the camera or sensors should always face the direction of travel.

**LOCK_YAW_AXIS Mode**: The device yaw is locked to a specific angle for all waypoints. This is useful when you want the drone to maintain a constant orientation regardless of flight direction.

**MANUAL Mode**: Each waypoint can have its own manually-specified orientation. This provides maximum flexibility for complex missions.

#### Computing Waypoint Orientation

You can compute the orientation for any waypoint based on the current route settings:

```typescript
// Compute orientation for a specific waypoint (0-based index)
const orientation = missionPlanner.computeWaypointOrientation(0);
const orientationData = missionPlanner.computeWaypointOrientationData(0);

console.log('Computed orientation for map:', {
  heading: orientation.heading,
  pitch: orientation.pitch,
  roll: orientation.roll,
});

console.log('Computed mission data:', {
  deviceYaw: orientationData.deviceYaw,
  gimbalYaw: orientationData.gimbalYaw,
  gimbalTilt: orientationData.gimbalTilt,
});
```

The computed orientation includes:

- **pitch**: Pitch angle in degrees
- **roll**: Roll angle in degrees
- **deviceYaw**: Device heading/yaw in degrees (-180 to 180)
- **gimbalYaw**: Gimbal yaw control in degrees
- **gimbalTilt**: Gimbal tilt control in degrees

#### Route Settings Events

When route settings are updated, the planner emits a `ROUTE_SETTINGS_CHANGED` event:

```typescript
missionPlanner.onEvent(LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED, (data) => {
  console.log('Route settings updated:', data.routeSettings);

  // Update UI to reflect new settings
  updateOrientationControls(data.routeSettings);
});
```

#### Practical Usage Examples

**Example 1: Survey Mission with Along-Route Orientation**

```typescript
// Set up for a survey mission where camera follows flight path
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE);

// Add waypoints - orientation will be computed automatically
missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 110 });
missionPlanner.addWaypoint({ latitude: 37.776, longitude: -122.4196, altitude: 110 });

// Check computed orientation for first waypoint
const orientation = missionPlanner.computeWaypointOrientation(0);
const orientationData = missionPlanner.computeWaypointOrientationData(0);
console.log('Waypoint 0 heading for map:', orientation.heading, 'degrees');
console.log('Waypoint 0 device yaw:', orientationData.deviceYaw, 'degrees');
```

**Example 2: Inspection Mission with Locked Orientation**

```typescript
// Set up for building inspection with locked orientation
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.LOCK_YAW_AXIS);

// All waypoints will maintain the same heading (reference point → first waypoint angle)
missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 110 });
missionPlanner.addWaypoint({ latitude: 37.776, longitude: -122.4196, altitude: 110 });

// The locked angle is automatically calculated from reference point to first waypoint
const lockedOrientation = missionPlanner.computeWaypointOrientation(0);
const lockedOrientationData = missionPlanner.computeWaypointOrientationData(0);
console.log('All waypoints heading for map:', lockedOrientation.heading, 'degrees');
console.log('All waypoints device yaw:', lockedOrientationData.deviceYaw, 'degrees');
```

**Example 3: Manual Orientation Control**

```typescript
// Set up for manual control (currently same behavior as LOCK_YAW_AXIS)
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.MANUAL);

// Add waypoints - orientation computed based on reference → first waypoint angle
missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 110 });
missionPlanner.addWaypoint({ latitude: 37.776, longitude: -122.4196, altitude: 110 });

// In manual mode, you can still add custom orientation data to waypoints
// Note: The deviceYaw from route settings takes precedence for orientation model
missionPlanner.addWaypoint(
  { latitude: 37.777, longitude: -122.4197, altitude: 110 },
  {
    orientation: {
      pitch: 0,
      roll: 0,
      gimbalYaw: 0,
      gimbalTilt: -30, // Tilt camera down 30 degrees
    },
  }
);
```

#### Advanced Device Yaw Actions

The Linear Mission Planner provides advanced device yaw action capabilities that allow you to override the mission-level orientation settings for individual waypoints. This enables fine-grained control over drone orientation at specific points in the mission.

##### Device Yaw Action Types

Device yaw actions support two different reference modes:

```typescript
enum DroneYawActionTypes {
  FLIGHT_PATH = 'flight_path', // Yaw relative to flight path direction
  NORTH = 'north', // Yaw relative to true north (absolute)
}
```

##### Managing Device Yaw Actions

You can set, update, and clear device yaw actions for individual waypoints:

```typescript
// Set device yaw action for waypoint 0 to face 90 degrees from north
const success = missionPlanner.updateDeviceYawActionValue(0, 90, DroneYawActionTypes.NORTH);

// Set device yaw action for waypoint 1 to face 45 degrees from flight path
missionPlanner.updateDeviceYawActionValue(1, 45, DroneYawActionTypes.FLIGHT_PATH);

// Check if a waypoint has a device yaw action
const hasAction = missionPlanner.hasDeviceYawAction(0);
console.log('Waypoint 0 has device yaw action:', hasAction);

// Clear device yaw action for waypoint 0 (reverts to mission route settings)
missionPlanner.clearDeviceYawAction(0);
```

##### Device Yaw Action Validation

Device yaw actions have specific validation rules:

- **Value Range**: -180 to 180 degrees
- **Type Validation**: Must be valid `DroneYawActionTypes` enum value
- **Waypoint Index**: Must be valid waypoint index (0-based)
- **State Restriction**: Can only be set during PLANNING state

```typescript
// Example with error handling
try {
  const success = missionPlanner.updateDeviceYawActionValue(0, 200, DroneYawActionTypes.NORTH);
  if (!success) {
    console.error('Failed to set device yaw action - invalid value or waypoint');
  }
} catch (error) {
  console.error('Error setting device yaw action:', error.message);
}
```

##### Device Yaw Action Hierarchy

Device yaw actions work in a hierarchical system:

1. **Mission Route Settings** (Base level): Applied to all waypoints by default
2. **Waypoint Approach Settings** (Mid level): Per-waypoint route following behavior
3. **Device Yaw Actions** (Top level): Per-waypoint orientation overrides

When a waypoint has a device yaw action, it takes precedence over both mission route settings and waypoint approach settings.

```typescript
// Example showing hierarchy
// 1. Set mission-level route settings
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE);

// 2. Set waypoint approach settings
missionPlanner.updateWaypointApproachMode(0, NextWaypointApproachMode.LOCK_YAW_AXIS);

// 3. Set device yaw action (this will override the above settings for waypoint 0)
missionPlanner.updateDeviceYawActionValue(0, 90, DroneYawActionTypes.NORTH);

// The final orientation for waypoint 0 will be 90 degrees from north
const orientation = missionPlanner.computeWaypointOrientation(0);
console.log('Final orientation:', orientation);
```

#### Waypoint Approach Settings

Waypoint approach settings provide per-waypoint control over route following behavior. This allows you to customize how individual waypoints interact with the mission's overall route settings.

##### Approach Settings Interface

```typescript
interface IWaypointApproachSettings {
  followRoute: boolean; // Whether waypoint follows mission route settings
  mode: NextWaypointApproachMode; // Custom approach mode for this waypoint
}

enum NextWaypointApproachMode {
  LOCK_YAW_AXIS = 'lock_yaw_axis', // Lock yaw to specific angle
  ALONG_ROUTE = 'along_route', // Follow trajectory direction
  MANUAL = 'manual', // Manual control
}
```

##### Managing Waypoint Approach Settings

```typescript
// Update waypoint approach follow route setting
await missionPlanner.updateWaypointApproachFollowRoute(0, false); // Independent from route
await missionPlanner.updateWaypointApproachFollowRoute(1, true); // Follow route settings

// Update waypoint approach mode
const success = missionPlanner.updateWaypointApproachMode(0, NextWaypointApproachMode.LOCK_YAW_AXIS);

// Get waypoint approach settings
const approachSettings = missionPlanner.getWaypointApproachSettings(0);
if (approachSettings) {
  console.log('Follow route:', approachSettings.followRoute);
  console.log('Approach mode:', approachSettings.mode);
}

// Check if waypoint is following route
const isFollowingRoute = missionPlanner.isWaypointFollowingRoute(0);
console.log('Waypoint 0 follows route:', isFollowingRoute);
```

##### Practical Approach Settings Examples

**Example 1: Mixed Route Following**

```typescript
// Set mission-level route settings
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE);

// Make waypoint 0 follow route settings
await missionPlanner.updateWaypointApproachFollowRoute(0, true);

// Make waypoint 1 independent with locked yaw
await missionPlanner.updateWaypointApproachFollowRoute(1, false);
missionPlanner.updateWaypointApproachMode(1, NextWaypointApproachMode.LOCK_YAW_AXIS);

// Result: waypoint 0 follows trajectory, waypoint 1 locks to reference→first waypoint angle
```

**Example 2: Custom Approach Modes**

```typescript
// Set up inspection mission with custom approach for specific waypoints
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE);

// Normal waypoints follow route
await missionPlanner.updateWaypointApproachFollowRoute(0, true);
await missionPlanner.updateWaypointApproachFollowRoute(2, true);

// Inspection waypoint uses locked yaw for consistent orientation
await missionPlanner.updateWaypointApproachFollowRoute(1, false);
missionPlanner.updateWaypointApproachMode(1, NextWaypointApproachMode.LOCK_YAW_AXIS);
```

#### Base Device Yaw Computation

The `computeBaseDeviceYaw()` method provides access to the underlying trajectory-based yaw calculation before any waypoint-specific overrides are applied.

```typescript
// Get base device yaw for waypoint (based on trajectory direction)
const baseYaw = missionPlanner.computeBaseDeviceYaw(0);
console.log('Base device yaw for waypoint 0:', baseYaw, 'degrees');

// Compare with final computed orientation
const finalOrientation = missionPlanner.computeWaypointOrientation(0);
console.log('Final orientation heading:', finalOrientation.heading, 'degrees');

// The difference shows the impact of waypoint-specific overrides
const yawDifference = finalOrientation.heading - baseYaw;
console.log('Yaw adjustment from overrides:', yawDifference, 'degrees');
```

This is particularly useful for:

- Understanding the base trajectory-based orientation
- Debugging orientation calculations
- Implementing custom orientation logic
- Analyzing the impact of waypoint-specific overrides

### Route Altitude Settings

The Linear Mission Planner provides advanced altitude management capabilities that allow you to control how waypoint altitudes are managed throughout the mission. This includes support for both RLT (Relative to Launch/Takeoff) and AGL (Above Ground Level) altitude modes.

#### Understanding Altitude Modes

The planner supports two altitude reference modes:

```typescript
interface IRouteAltitudeSettings {
  type: 'RLT' | 'AGL'; // Altitude reference type
  value: number; // Altitude value in meters
}
```

**RLT (Relative to Launch/Takeoff)**: Altitudes are specified relative to the takeoff/reference point. This is the traditional drone flight mode where the aircraft maintains a consistent altitude above the launch point.

**AGL (Above Ground Level)**: Altitudes are specified relative to the terrain directly below each waypoint. This mode is terrain-aware and automatically adjusts the aircraft's altitude to maintain a consistent height above the changing ground elevation.

#### Accessing and Updating Route Altitude Settings

You can access and modify the route altitude settings during mission planning:

```typescript
// Get current route altitude settings
const altitudeSettings = missionPlanner.routeAltitudeSettings;
console.log('Current altitude mode:', altitudeSettings.type);
console.log('Current altitude value:', altitudeSettings.value);

// Update to AGL mode with 100m above ground
await missionPlanner.updateRouteAltitudeSettings({
  type: 'AGL',
  value: 100,
});

// Update to RLT mode with 50m above takeoff point
await missionPlanner.updateRouteAltitudeSettings({
  type: 'RLT',
  value: 50,
});
```

#### Per-Waypoint Altitude Control

Individual waypoints can be configured to either follow the route altitude settings or maintain their own independent altitude:

```typescript
// Check if a waypoint follows route altitude settings
const waypoint = missionPlanner.getWaypoint(0);
console.log('Follows route altitude:', waypoint.followRouteAltitude);

// Toggle waypoint follow-route behavior
await missionPlanner.updateWaypointFollowRoute(0, false); // Independent altitude
await missionPlanner.updateWaypointFollowRoute(0, true); // Follow route settings
```

#### Altitude Settings Events

When route altitude settings are updated, the planner emits events to notify your application:

```typescript
// Listen for route altitude changes
missionPlanner.onEvent(LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED, (data) => {
  console.log('Route altitude settings updated:', data.routeSettings);

  // Update UI to reflect new settings
  updateAltitudeControls(data.routeSettings);
});

// Listen for waypoint altitude updates (emitted when settings change affect waypoints)
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINTS_ALTITUDE_UPDATED, (data) => {
  console.log('Waypoints altitude data updated');
  console.log('Updated waypoints:', data.waypointsWithExtendedPosition);

  // Update waypoint list UI with new altitude information
  updateWaypointsList(data.waypointsWithExtendedPosition);
});
```

#### Practical Usage Examples

**Example 1: Terrain-Following Survey Mission**

```typescript
// Set up AGL mode for terrain following
await missionPlanner.updateRouteAltitudeSettings({
  type: 'AGL',
  value: 120, // 120 meters above ground
});

// Add waypoints - they will automatically maintain 120m AGL
missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 120 });
missionPlanner.addWaypoint({ latitude: 37.776, longitude: -122.4196, altitude: 120 });

// The actual flight altitude will vary based on terrain elevation
```

**Example 2: Mixed Altitude Mission**

```typescript
// Set default RLT mode
await missionPlanner.updateRouteAltitudeSettings({
  type: 'RLT',
  value: 100, // 100 meters above takeoff
});

// Add waypoints that follow route settings
missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 100 });
missionPlanner.addWaypoint({ latitude: 37.776, longitude: -122.4196, altitude: 100 });

// Make the second waypoint independent (e.g., for a specific inspection point)
await missionPlanner.updateWaypointFollowRoute(1, false);

// Update the independent waypoint to a specific altitude
missionPlanner.updateWaypoint(1, {
  position: { latitude: 37.776, longitude: -122.4196, altitude: 150 },
});
```

**Example 3: Dynamic Altitude Adjustment**

```typescript
// Start with RLT mode
await missionPlanner.updateRouteAltitudeSettings({
  type: 'RLT',
  value: 80,
});

// Add several waypoints
missionPlanner.addWaypoint({ latitude: 37.775, longitude: -122.4195, altitude: 80 });
missionPlanner.addWaypoint({ latitude: 37.776, longitude: -122.4196, altitude: 80 });
missionPlanner.addWaypoint({ latitude: 37.777, longitude: -122.4197, altitude: 80 });

// Later, switch to AGL mode - all waypoints that follow route settings will update
await missionPlanner.updateRouteAltitudeSettings({
  type: 'AGL',
  value: 120,
});

// Waypoints are now automatically adjusted to maintain 120m AGL
```

#### Important Notes

- Route altitude settings can only be updated while the mission is in the PLANNING state
- When switching between RLT and AGL modes, all waypoints that have `followRouteAltitude: true` will be automatically updated
- Waypoints with `followRouteAltitude: false` maintain their manually set altitudes regardless of route settings changes
- AGL altitude calculations require terrain data and may take a moment to process
- The WAYPOINTS_ALTITUDE_UPDATED event is emitted after bulk altitude updates for efficient UI synchronization

### Reordering Waypoints

You can change the order of waypoints in the mission:

```typescript
// Move waypoint from index 0 to index 2
missionPlanner.reorderWaypoint(0, 2);
```

### Navigation and Visibility

The Linear Mission Planner provides navigation and visibility control features that help with mission management and user experience.

#### Mission Visibility Control

You can show or hide the entire mission visualization on the map:

```typescript
// Hide the mission visualization
missionPlanner.setVisibility(false);

// Show the mission visualization
missionPlanner.setVisibility(true);

// Check current visibility state
const isVisible = missionPlanner.isVisible;
console.log('Mission is visible:', isVisible);
```

When visibility changes, the planner emits a visibility changed event:

```typescript
missionPlanner.onEvent(LinearMissionPlannerEventType.MISSION_VISIBILITY_CHANGED, (data) => {
  console.log('Mission visibility changed');

  // Update UI controls to reflect new visibility state
  updateVisibilityToggle(missionPlanner.isVisible);
});
```

#### Waypoint Navigation

You can programmatically navigate the map to specific waypoints:

```typescript
// Pan to the first waypoint (waypoint numbers are 1-based)
const success = missionPlanner.panToWaypoint(1);

if (success) {
  console.log('Map panned to waypoint 1');
} else {
  console.log('Failed to pan - waypoint may not exist');
}

// Pan to the last waypoint
const lastWaypointNumber = missionPlanner.waypointCount;
missionPlanner.panToWaypoint(lastWaypointNumber);
```

**Important**: The `panToWaypoint` method uses 1-based waypoint numbers (not 0-based indices). For example:

- Waypoint number 1 corresponds to waypoint index 0
- Waypoint number 2 corresponds to waypoint index 1
- And so on...

You can also pan to the entire mission to view all waypoints and the complete path:

```typescript
// Pan to the entire mission (shows all waypoints and path)
const success = missionPlanner.panToMission();

if (success) {
  console.log('Map panned to show entire mission');
} else {
  console.log('Failed to pan to mission - mission may be empty');
}
```

The `panToMission()` method automatically calculates the optimal view that encompasses:

- The reference point
- All waypoints
- The complete mission path
- Appropriate zoom level and centering

#### Mission Distance Information

You can access the total distance of the mission path:

```typescript
// Get the total mission distance in meters
const totalDistance = missionPlanner.missionDistance;
console.log(`Mission total distance: ${totalDistance.toFixed(2)} meters`);

// Convert to other units if needed
const distanceInKm = totalDistance / 1000;
console.log(`Mission total distance: ${distanceInKm.toFixed(2)} kilometers`);
```

The mission distance is automatically calculated and cached for performance. It includes:

- Distance from reference point to first waypoint
- Distance between consecutive waypoints
- The total path length the aircraft will travel

#### Practical Usage Examples

**Example 1: Mission Review Interface**

```typescript
// Create a mission review interface
function createMissionReviewUI() {
  const totalDistance = missionPlanner.missionDistance;
  const waypointCount = missionPlanner.waypointCount;

  // Display mission statistics
  console.log(`Mission Overview:
    - ${waypointCount} waypoints
    - ${(totalDistance / 1000).toFixed(2)} km total distance
    - Estimated flight time: ${estimateFlightTime(totalDistance)} minutes`);

  // Create waypoint navigation buttons
  for (let i = 1; i <= waypointCount; i++) {
    createWaypointButton(i, () => {
      missionPlanner.panToWaypoint(i);
    });
  }
}
```

**Example 2: Mission Presentation Mode**

```typescript
// Toggle between edit and presentation modes
function togglePresentationMode(isPresentationMode) {
  if (isPresentationMode) {
    // Hide mission for clean presentation
    missionPlanner.setVisibility(false);

    // Focus on individual waypoints one by one
    let currentWaypoint = 1;
    const interval = setInterval(() => {
      if (currentWaypoint <= missionPlanner.waypointCount) {
        missionPlanner.panToWaypoint(currentWaypoint);
        currentWaypoint++;
      } else {
        clearInterval(interval);
        // Show mission again at the end
        missionPlanner.setVisibility(true);
      }
    }, 3000); // 3 seconds per waypoint
  } else {
    // Return to normal editing mode
    missionPlanner.setVisibility(true);
  }
}
```

**Example 3: Distance-Based Waypoint Management**

```typescript
// Add waypoints with distance constraints
function addWaypointWithDistanceCheck(position) {
  // Calculate what the new distance would be
  const currentDistance = missionPlanner.missionDistance;

  // Temporarily add waypoint to check distance
  const waypointIndex = missionPlanner.addWaypoint(position);
  const newDistance = missionPlanner.missionDistance;

  const segmentDistance = newDistance - currentDistance;

  // Check if segment is too long
  if (segmentDistance > MAX_SEGMENT_DISTANCE) {
    // Remove waypoint and show warning
    missionPlanner.removeWaypoint(waypointIndex);

    console.warn(`Segment too long: ${segmentDistance.toFixed(2)}m exceeds maximum of ${MAX_SEGMENT_DISTANCE}m`);

    // Pan to the problematic area
    missionPlanner.panToWaypoint(missionPlanner.waypointCount);

    return false;
  }

  console.log(`Waypoint added. Segment distance: ${segmentDistance.toFixed(2)}m`);
  return true;
}
```

#### Notes on Navigation and Visibility

- Visibility changes affect all mission visualization elements (waypoints, paths, reference point)
- The `panToWaypoint` method smoothly animates the map to the target waypoint
- Mission distance is calculated in real-time as waypoints are added, removed, or modified
- Distance calculations include 3D distances when waypoints have different altitudes
- Navigation methods return boolean values to indicate success or failure

### Completing or Canceling the Mission

When you're done planning, you can complete the mission to return the final data:

```typescript
// Complete the mission and get the final data
// (This also removes the mission visualization from the map)
// Note: This will validate that the mission has a reference point and at least 2 waypoints
const missionData = missionPlanner.completeMission();

console.log('Reference Point:', missionData.referencePoint);
console.log('Waypoints:', missionData.waypoints);
console.log('Takeoff Mode:', missionData.takeoffMode);
console.log('Takeoff Altitude:', missionData.takeoffAltitude);

// Use the mission data for further processing
saveMissionToDatabase(missionData);
```

If you need to cancel the mission planning without saving:

```typescript
// Cancel mission planning and clean up resources
missionPlanner.cancelMission();
```

## AGL Support and Extended Position

The Linear Mission Planner provides comprehensive support for AGL (Above Ground Level) altitude calculations and extended position data. This advanced feature enables terrain-aware mission planning and provides detailed altitude information for both waypoints and reference points.

### Understanding AGL vs RLT

The planner supports two altitude reference systems:

**RLT (Relative to Launch/Takeoff)**: Traditional altitude mode where all altitudes are specified relative to the takeoff point. This is simpler but doesn't account for terrain variations.

**AGL (Above Ground Level)**: Terrain-aware altitude mode where altitudes are specified relative to the ground elevation directly below each point. This enables consistent ground clearance across varying terrain.

```typescript
// RLT Example: All waypoints at 100m above takeoff point
// Actual ground clearance varies with terrain
const rltWaypoint = {
  position: { latitude: 37.775, longitude: -122.4195, altitude: 100 }, // 100m above takeoff
};

// AGL Example: All waypoints at 100m above ground
// Actual altitude above takeoff varies with terrain
const aglWaypoint = {
  position: { latitude: 37.775, longitude: -122.4195, altitude: 100 }, // 100m above ground
};
```

### Getting Extended Position Data

Extended position data includes both the original position and computed AGL altitude information. This data is essential for terrain-aware mission planning and validation.

#### Individual Waypoint Extended Position

```typescript
// Get extended position data for a specific waypoint
const extendedWaypoint = await missionPlanner.getWaypointExtendedPosition(0);

if (extendedWaypoint) {
  console.log('Original waypoint data:', extendedWaypoint);
  console.log('Extended position info:', extendedWaypoint.extendedPosition);
  console.log('AGL altitude:', extendedWaypoint.extendedPosition.aglAltitude);

  // Extended position includes original IPosition plus AGL
  const extendedPos = extendedWaypoint.extendedPosition;
  console.log(`Position: ${extendedPos.latitude}, ${extendedPos.longitude}`);
  console.log(`Original altitude: ${extendedPos.altitude}m`);
  console.log(`AGL altitude: ${extendedPos.aglAltitude}m`);
}
```

#### All Waypoints Extended Position

```typescript
// Get extended position data for all waypoints
const allExtendedWaypoints = await missionPlanner.getWaypointsWithExtendedPosition();

allExtendedWaypoints.forEach((waypoint, index) => {
  const agl = waypoint.extendedPosition.aglAltitude;
  console.log(`Waypoint ${index}: ${agl.toFixed(1)}m AGL`);
});

// Use for terrain analysis
const minAGL = Math.min(...allExtendedWaypoints.map((w) => w.extendedPosition.aglAltitude));
const maxAGL = Math.max(...allExtendedWaypoints.map((w) => w.extendedPosition.aglAltitude));

console.log(`AGL range: ${minAGL.toFixed(1)}m - ${maxAGL.toFixed(1)}m`);
```

#### Reference Point Extended Position

```typescript
// Get extended position data for the reference point
const refExtended = await missionPlanner.getReferencePointExtendedPosition();

console.log('Reference point AGL:', refExtended.aglAltitude);
console.log('Reference point position:', {
  latitude: refExtended.latitude,
  longitude: refExtended.longitude,
  altitude: refExtended.altitude,
  aglAltitude: refExtended.aglAltitude,
});
```

### Convenience Methods for AGL Data

For cases where you only need the AGL altitude values, convenience methods are available:

```typescript
// Get AGL altitude for a specific waypoint
const waypointAGL = await missionPlanner.getWaypointAGLAltitude(0);
console.log(`Waypoint 0 AGL: ${waypointAGL}m`);

// Get AGL altitude for reference point
const referenceAGL = await missionPlanner.getReferencePointAGL();
console.log(`Reference point AGL: ${referenceAGL}m`);
```

### Working with Terrain-Aware Altitudes

Extended position data enables sophisticated terrain analysis and mission validation:

#### Terrain Clearance Validation

```typescript
async function validateTerrainClearance(minimumClearance = 30) {
  const waypoints = await missionPlanner.getWaypointsWithExtendedPosition();
  const referencePoint = await missionPlanner.getReferencePointExtendedPosition();

  const issues = [];

  // Check reference point
  if (referencePoint.aglAltitude < minimumClearance) {
    issues.push(`Reference point too low: ${referencePoint.aglAltitude.toFixed(1)}m AGL`);
  }

  // Check all waypoints
  waypoints.forEach((waypoint, index) => {
    const agl = waypoint.extendedPosition.aglAltitude;
    if (agl < minimumClearance) {
      issues.push(`Waypoint ${index} too low: ${agl.toFixed(1)}m AGL`);
    }
  });

  if (issues.length > 0) {
    console.warn('Terrain clearance issues found:', issues);
    return false;
  }

  console.log('All points meet minimum clearance requirements');
  return true;
}
```

#### Terrain Profile Analysis

```typescript
async function analyzeTerrainProfile() {
  const waypoints = await missionPlanner.getWaypointsWithExtendedPosition();

  if (waypoints.length < 2) {
    console.log('Need at least 2 waypoints for terrain profile analysis');
    return;
  }

  console.log('Terrain Profile Analysis:');
  console.log('========================');

  waypoints.forEach((waypoint, index) => {
    const pos = waypoint.extendedPosition;
    const groundElevation = pos.altitude - pos.aglAltitude;

    console.log(`Waypoint ${index}:`);
    console.log(`  Coordinates: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`);
    console.log(`  Ground elevation: ${groundElevation.toFixed(1)}m MSL`);
    console.log(`  Flight altitude: ${pos.altitude.toFixed(1)}m MSL`);
    console.log(`  AGL altitude: ${pos.aglAltitude.toFixed(1)}m`);
    console.log('');
  });

  // Calculate terrain variation
  const groundElevations = waypoints.map((w) => w.extendedPosition.altitude - w.extendedPosition.aglAltitude);

  const minElevation = Math.min(...groundElevations);
  const maxElevation = Math.max(...groundElevations);
  const elevationChange = maxElevation - minElevation;

  console.log(`Terrain variation: ${elevationChange.toFixed(1)}m`);
  console.log(`Elevation range: ${minElevation.toFixed(1)}m - ${maxElevation.toFixed(1)}m MSL`);
}
```

#### Dynamic AGL Adjustment

```typescript
async function adjustMissionForAGL(targetAGL = 100) {
  // Switch to AGL mode with desired altitude
  await missionPlanner.updateRouteAltitudeSettings({
    type: 'AGL',
    value: targetAGL,
  });

  console.log(`Mission adjusted to maintain ${targetAGL}m AGL`);

  // Verify the adjustment
  const waypoints = await missionPlanner.getWaypointsWithExtendedPosition();
  const aglValues = waypoints.map((w) => w.extendedPosition.aglAltitude);

  console.log('AGL altitudes after adjustment:');
  aglValues.forEach((agl, index) => {
    console.log(`  Waypoint ${index}: ${agl.toFixed(1)}m AGL`);
  });

  return aglValues;
}
```

### Extended Position Events

When waypoint altitude data is updated (due to route settings changes or terrain recalculation), the planner emits events with extended position information:

```typescript
// Listen for bulk altitude updates
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINTS_ALTITUDE_UPDATED, async (data) => {
  console.log('Waypoint altitudes updated');

  // The event includes pre-calculated extended position data
  const extendedWaypoints = data.waypointsWithExtendedPosition;

  if (extendedWaypoints) {
    console.log('Updated AGL altitudes:');
    extendedWaypoints.forEach((waypoint, index) => {
      const agl = waypoint.extendedPosition.aglAltitude;
      console.log(`  Waypoint ${index}: ${agl.toFixed(1)}m AGL`);
    });

    // Update UI with new altitude data
    updateWaypointAltitudeDisplay(extendedWaypoints);
  }
});
```

### Best Practices for AGL Support

1. **Async Operations**: All extended position methods are asynchronous due to terrain data processing
2. **Caching**: Extended position data is computed on-demand; cache results when possible
3. **Error Handling**: Terrain data may not be available for all locations; handle null/undefined results
4. **Performance**: Use bulk operations (`getWaypointsWithExtendedPosition`) instead of individual calls when possible
5. **Validation**: Always validate AGL altitudes for safety compliance
6. **Event Handling**: Subscribe to `WAYPOINTS_ALTITUDE_UPDATED` for efficient UI updates

### Limitations and Considerations

- AGL calculations require terrain data availability for the mission area
- Terrain data resolution may vary by geographic region
- AGL calculations are performed asynchronously and may take time for large missions
- Extended position data represents a snapshot at calculation time; recalculate after significant mission changes
- Some remote areas may have limited or no terrain data available

## Event Handling

### Subscribing to Events

The mission planner emits events that you can subscribe to using the `onEvent` method. The event system uses the internal `MapEventEmitter` to handle events, but this is abstracted away from you as a user.

```typescript
// Subscribe to an event
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, (data) => {
  console.log(`Waypoint added at index ${data.waypointIndex}`);
  // Update UI or perform other actions
});

// Unsubscribe from an event
const handler = (data) => {
  console.log(`Waypoint added at index ${data.waypointIndex}`);
};
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, handler);
missionPlanner.offEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, handler);
```

> **Important Note**: The `offEvent` method may not always remove the exact handler you registered, especially if you're using anonymous functions. For best results, always store your event handlers in named variables when you plan to unregister them later.

### Available Event Types

The `LinearMissionPlannerEventType` enum defines all available event types:

```typescript
enum LinearMissionPlannerEventType {
  REFERENCE_POINT_ADDED = 'linearMissionPlanner:referencePointAdded',
  REFERENCE_POINT_CHANGED = 'linearMissionPlanner:referencePointChanged',
  WAYPOINT_ADDED = 'linearMissionPlanner:waypointAdded',
  WAYPOINT_REMOVED = 'linearMissionPlanner:waypointRemoved',
  WAYPOINT_UPDATED = 'linearMissionPlanner:waypointUpdated',
  WAYPOINT_SELECTED = 'linearMissionPlanner:waypointSelected',
  WAYPOINT_EDIT_STARTED = 'linearMissionPlanner:waypointEditStarted',
  WAYPOINT_EDIT_ENDED = 'linearMissionPlanner:waypointEditEnded',
  STATE_CHANGED = 'linearMissionPlanner:stateChanged',
  MISSION_VISIBILITY_CHANGED = 'linearMissionPlanner:visibilityChanged',
  MISSION_VALIDATION_FAILED = 'linearMissionPlanner:validationFailed',
  MISSION_CANCELLED = 'linearMissionPlanner:cancelled',
  ROUTE_SETTINGS_CHANGED = 'linearMissionPlanner:routeSettingsChanged',
  WAYPOINTS_ALTITUDE_UPDATED = 'linearMissionPlanner:waypointsAltitudeUpdated',
}
```

### Event Data Structure

Events include relevant data about the action that occurred. Each event callback receives a `LinearMissionPlannerEventData` object with properties specific to the event type:

```typescript
interface LinearMissionPlannerEventData {
  eventType: LinearMissionPlannerEventType;
  waypointIndex?: number; // For waypoint-related events
  waypointData?: WaypointData; // For waypoint-related events
  oldState?: LinearMissionPlannerState; // For STATE_CHANGED events
  newState?: LinearMissionPlannerState; // For STATE_CHANGED events
  validationErrors?: string[]; // For MISSION_VALIDATION_FAILED events
  routeSettings?: IMissionRouteSettings; // For ROUTE_SETTINGS_CHANGED events
  waypointsWithExtendedPosition?: WaypointDataWithExtendedPosition[]; // For WAYPOINTS_ALTITUDE_UPDATED events
  // Other event-specific properties
}
```

The event system handles all the necessary type conversions internally, so you can safely use the properties of the event data object without worrying about the underlying implementation details.

## Integration Patterns

### Map Click Integration

The Linear Mission Planner includes built-in map click handling. This means you don't need to manually register map click event handlers - the planner automatically:

1. Sets the reference point when clicked in AWAITING_REFERENCE state
2. Adds waypoints when clicked in PLANNING state (when not clicking on existing entities)
3. Cleans up event handlers when disposed

This automatic map click handling works as follows:

```typescript
// The planner automatically handles map clicks internally
const missionPlanner = missionPlannerManager.createNewLinearMission();

// No need to manually register map click handlers
// Just create the planner and it will handle map interactions

// You only need to subscribe to events to update your UI
missionPlanner.onEvent(LinearMissionPlannerEventType.REFERENCE_POINT_ADDED, (data) => {
  console.log('Reference point has been set automatically from map click');
  // Update your UI as needed
});

missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, (data) => {
  console.log(`New waypoint added at index ${data.waypointIndex} from map click`);
  // Update your UI as needed
});
```

If you need to customize map click behavior beyond the default implementation, you can:

1. Create your own map click handler
2. Use the provided methods from the mission planner to implement custom logic
3. Be sure to manually register and unregister your handlers

### Form Integration

You can integrate the planner with form controls for editing waypoint properties:

```typescript
// Form updates mission
function updateWaypointFromForm(index, properties) {
  if (!missionPlanner) return;

  // If not already in edit mode for this waypoint, select and enter edit mode
  if (missionPlanner.selectedWaypointIndex !== index) {
    missionPlanner.selectWaypoint(index);
  }

  if (missionPlanner.editingWaypointIndex !== index) {
    missionPlanner.enterEditMode();
  }

  // Update the waypoint
  missionPlanner.updateWaypoint(index, properties);
}

// Mission updates form
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_SELECTED, (data) => {
  const waypoint = missionPlanner.getWaypoint(data.waypointIndex);
  if (waypoint) {
    populateForm(waypoint);
  }
});

// Handle edit mode changes
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_EDIT_STARTED, (data) => {
  // Update UI to show waypoint is in edit mode
  highlightFormForEditing(data.waypointIndex);
  enableFormControls();
});

missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_EDIT_ENDED, (data) => {
  // Update UI to show waypoint is no longer in edit mode
  unhighlightFormForEditing();
  disableFormControls();
});
```

### UI State Management

You can keep UI components in sync with the mission planner state:

```typescript
// Update UI when the mission state changes
missionPlanner.onEvent(LinearMissionPlannerEventType.STATE_CHANGED, (data) => {
  updateUIForState(data.newState);

  // Enable/disable UI controls based on state
  addWaypointButton.disabled = !missionPlanner.canAddWaypoints();
  editWaypointButton.disabled = missionPlanner.selectedWaypointIndex === -1;
  completeButton.disabled = missionPlanner.waypointCount < 2; // Minimum 2 waypoints required
});

// Update UI when waypoints are selected or edited
missionPlanner.onEvent(LinearMissionPlannerEventType.WAYPOINT_SELECTED, (data) => {
  // Update UI to show selected waypoint
  updateSelectedWaypointUI(data.waypointIndex);

  // Enable edit button since a waypoint is now selected
  editWaypointButton.disabled = false;
});

// Handle validation failures
missionPlanner.onEvent(LinearMissionPlannerEventType.MISSION_VALIDATION_FAILED, (data) => {
  // Show validation errors in UI
  showValidationErrors(data.validationErrors);
});
```

## Error Handling

The mission planner interfaces use exceptions for error conditions:

```typescript
try {
  // This will throw if not in PLANNING state
  missionPlanner.addWaypoint(position);
} catch (error) {
  console.error('Failed to add waypoint:', error.message);
  // Show error in UI
  showErrorNotification(error.message);
}
```

You can use the status check methods to avoid errors:

```typescript
if (missionPlanner.canAddWaypoints()) {
  try {
    missionPlanner.addWaypoint(position);
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
} else {
  showNotification('Cannot add waypoints in the current state');
}
```

Common error cases to handle:

1. Attempting to complete a mission with fewer than 2 waypoints
2. Attempting to enter edit mode when no waypoint is selected
3. Attempting to add waypoints before setting a reference point
4. Attempting to select a waypoint at an invalid index
5. Setting device yaw action values outside the valid range (-180 to 180 degrees)
6. Attempting to update approach settings for non-existent waypoints
7. Calling state-restricted methods (device yaw actions, approach settings) outside PLANNING state

### Advanced Error Handling

For advanced features, additional error handling is recommended:

```typescript
// Device yaw action error handling
try {
  const success = missionPlanner.updateDeviceYawActionValue(0, 270, DroneYawActionTypes.NORTH);
  if (!success) {
    console.error('Failed to set device yaw action - check waypoint index and value range');
  }
} catch (error) {
  if (error.message.includes('Invalid yaw value')) {
    console.error('Yaw value must be between -180 and 180 degrees');
  } else if (error.message.includes('Invalid waypoint index')) {
    console.error('Waypoint index out of range');
  } else {
    console.error('Unexpected error:', error.message);
  }
}

// Approach settings error handling
try {
  await missionPlanner.updateWaypointApproachFollowRoute(0, false);
} catch (error) {
  if (error.message.includes('Invalid state')) {
    console.error('Approach settings can only be updated during PLANNING state');
  } else {
    console.error('Failed to update approach settings:', error.message);
  }
}

// Base device yaw computation error handling
try {
  const baseYaw = missionPlanner.computeBaseDeviceYaw(0);
  console.log('Base yaw:', baseYaw);
} catch (error) {
  if (error.message.includes('Invalid waypoint index')) {
    console.error('Cannot compute base yaw for invalid waypoint index');
  } else {
    console.error('Failed to compute base yaw:', error.message);
  }
}
```

### Validation Patterns

For robust applications, implement validation patterns:

```typescript
// Validate device yaw action before setting
function setDeviceYawActionSafely(waypointIndex: number, value: number, type: DroneYawActionTypes) {
  // Check state
  if (missionPlanner.state !== LinearMissionPlannerState.PLANNING) {
    throw new Error('Device yaw actions can only be set during PLANNING state');
  }

  // Check waypoint index
  if (waypointIndex < 0 || waypointIndex >= missionPlanner.waypointCount) {
    throw new Error(`Invalid waypoint index: ${waypointIndex}`);
  }

  // Check value range
  if (value < -180 || value > 180) {
    throw new Error(`Invalid yaw value: ${value}. Must be between -180 and 180 degrees`);
  }

  // Check type
  if (!Object.values(DroneYawActionTypes).includes(type)) {
    throw new Error(`Invalid yaw action type: ${type}`);
  }

  // Set the action
  return missionPlanner.updateDeviceYawActionValue(waypointIndex, value, type);
}
```

## Best Practices

1. **Use State Checks**: Always check if operations are allowed before attempting them.
2. **Handle Events Efficiently**: Subscribe only to the events you need.
3. **Manage Resources**: Call `cancelMission()` when you're done with a mission planner.
4. **Validate Inputs**: Ensure positions and other data are valid before passing them to the planner.
5. **Preserve User Context**: Keep track of the selected and editing waypoint indices for a better user experience.
6. **Error Recovery**: Provide clear error messages and recovery options when operations fail.
7. **UI Synchronization**: Keep your UI in sync with the mission state through events.
8. **Data Handling**: Properly save or process the returned mission data when planning is completed.
9. **Edit Mode Management**: Always exit edit mode properly before completing or canceling the mission.
10. **Selection Flow**: Respect the waypoint state flow (NORMAL → SELECTED → EDITING) in your UI.
11. **Leverage Built-in Map Handling**: The planner includes automatic map click handlers, so there's no need to manually implement basic map interactions.

## Examples

### Complete Workflow Example

```typescript
// Get the mission planner manager
const missionPlannerManager: IMissionPlannerManager = /* ... */;

// Create a new linear mission
const missionPlanner = missionPlannerManager.createNewLinearMission({
  takeoffMode: TakeoffMode.DIRECT_ASCENT,
  takeoffAltitude: 0,
  routeAltitudeSettings: {
    type: 'RLT',
    value: 100
  },
  routeDeviceYawMode: DeviceYawRouteSettingsMode.ALONG_ROUTE
});

// Set up event listeners
missionPlanner.onEvent(
  LinearMissionPlannerEventType.STATE_CHANGED,
  (data) => {
    console.log(`State changed: ${data.oldState} -> ${data.newState}`);
    updateUIForState(data.newState);
  }
);

missionPlanner.onEvent(
  LinearMissionPlannerEventType.WAYPOINT_ADDED,
  (data) => {
    console.log(`Waypoint added at index ${data.waypointIndex}`);
    refreshWaypointsList();
  }
);

missionPlanner.onEvent(
  LinearMissionPlannerEventType.WAYPOINT_SELECTED,
  (data) => {
    console.log(`Waypoint selected at index ${data.waypointIndex}`);
    highlightWaypointInUI(data.waypointIndex);
  }
);

missionPlanner.onEvent(
  LinearMissionPlannerEventType.WAYPOINT_EDIT_STARTED,
  (data) => {
    console.log(`Waypoint editing started at index ${data.waypointIndex}`);
    showEditingUI(data.waypointIndex);
  }
);

missionPlanner.onEvent(
  LinearMissionPlannerEventType.WAYPOINT_EDIT_ENDED,
  (data) => {
    console.log(`Waypoint editing ended at index ${data.waypointIndex}`);
    hideEditingUI();
  }
);

missionPlanner.onEvent(
  LinearMissionPlannerEventType.WAYPOINTS_ALTITUDE_UPDATED,
  (data) => {
    console.log('Waypoint altitudes updated');
    // Update UI with new altitude data
    if (data.waypointsWithExtendedPosition) {
      updateWaypointAltitudeDisplay(data.waypointsWithExtendedPosition);
    }
  }
);

// Set reference point (from map click or form input)
missionPlanner.setReferencePoint({
  latitude: 37.7749,
  longitude: -122.4194,
  altitude: 100
});

// Now in PLANNING state, add waypoints
missionPlanner.addWaypoint({
  latitude: 37.775,
  longitude: -122.4195,
  altitude: 110
});

missionPlanner.addWaypoint({
  latitude: 37.776,
  longitude: -122.4196,
  altitude: 120
});

// Update takeoff settings based on mission requirements
missionPlanner.setTakeoffMode(TakeoffMode.SAFE_TAKEOFF);
missionPlanner.setTakeoffAltitude(50);
console.log(`Updated takeoff mode: ${missionPlanner.takeoffMode}`);
console.log(`Updated takeoff altitude: ${missionPlanner.takeoffAltitude}m`);

// Configure orientation settings for the mission
missionPlanner.updateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE);
console.log('Route device yaw mode:', missionPlanner.routeDeviceYawMode);

// Compute orientation for waypoints based on route settings
const waypoint0Orientation = missionPlanner.computeWaypointOrientation(0);
const waypoint1Orientation = missionPlanner.computeWaypointOrientation(1);
const waypoint0Data = missionPlanner.computeWaypointOrientationData(0);
const waypoint1Data = missionPlanner.computeWaypointOrientationData(1);
console.log('Waypoint 0 orientation for map:', waypoint0Orientation);
console.log('Waypoint 1 orientation for map:', waypoint1Orientation);
console.log('Waypoint 0 mission data:', waypoint0Data);
console.log('Waypoint 1 mission data:', waypoint1Data);

// Work with route altitude settings
console.log('Current altitude settings:', missionPlanner.routeAltitudeSettings);

// Switch to AGL mode for terrain following
await missionPlanner.updateRouteAltitudeSettings({
  type: 'AGL',
  value: 120
});

// Get extended position data for terrain analysis
const extendedWaypoints = await missionPlanner.getWaypointsWithExtendedPosition();
extendedWaypoints.forEach((waypoint, index) => {
  console.log(`Waypoint ${index} AGL: ${waypoint.extendedPosition.aglAltitude.toFixed(1)}m`);
});

// Check mission distance
const totalDistance = missionPlanner.missionDistance;
console.log(`Mission total distance: ${(totalDistance / 1000).toFixed(2)} km`);

// Pan to specific waypoint
missionPlanner.panToWaypoint(1); // Pan to first waypoint (1-based)

// This waypoint will be automatically selected after adding
console.log('Selected waypoint index:', missionPlanner.selectedWaypointIndex);

// Enter edit mode for the selected waypoint
if (missionPlanner.selectedWaypointIndex !== -1) {
  missionPlanner.enterEditMode();
  console.log('Editing waypoint index:', missionPlanner.editingWaypointIndex);

  // Update the waypoint while in edit mode
  missionPlanner.updateWaypoint(missionPlanner.editingWaypointIndex, {
    position: {
      latitude: 37.776,
      longitude: -122.4196,
      altitude: 125 // Changed altitude
    }
  });

  // Exit edit mode when done
  missionPlanner.exitEditMode();
}

// Select a different waypoint
missionPlanner.selectWaypoint(0);

// Reorder waypoints if needed
missionPlanner.reorderWaypoint(0, 1);

// Complete the mission when done and get the final data
try {
  const missionData = missionPlanner.completeMission();

  // Save or use the completed mission data
  saveMissionToDatabase(missionData);
} catch (error) {
  // Handle validation failure
  console.error('Failed to complete mission:', error.message);
}
```

### Integration with React Component

```typescript
// Example React component using the linear mission planner
function LinearMissionPlannerComponent() {
  const [missionPlanner, setMissionPlanner] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [missionState, setMissionState] = useState('AWAITING_REFERENCE');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [completedData, setCompletedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [routeSettings, setRouteSettings] = useState(null);
  const [altitudeSettings, setAltitudeSettings] = useState(null);
  const [missionDistance, setMissionDistance] = useState(0);
  const [extendedWaypoints, setExtendedWaypoints] = useState([]);

  useEffect(() => {
    // Check if there's already an active linear mission
    let planner = missionPlannerManager.getCurrentLinearMission();

    if (!planner) {
      // Create a new one if none exists
      planner = missionPlannerManager.createNewLinearMission();
      // Map click handling is built into the mission planner
      // No need to manually set up map click handlers
    }

    // Set up event listeners
    planner.onEvent(LinearMissionPlannerEventType.WAYPOINT_ADDED, () => {
      setWaypoints(planner.getWaypoints());
      setSelectedIndex(planner.selectedWaypointIndex);
    });

    planner.onEvent(LinearMissionPlannerEventType.WAYPOINT_REMOVED, () => {
      setWaypoints(planner.getWaypoints());
      setSelectedIndex(planner.selectedWaypointIndex);
    });

    planner.onEvent(LinearMissionPlannerEventType.WAYPOINT_UPDATED, () => {
      setWaypoints(planner.getWaypoints());
    });

    planner.onEvent(LinearMissionPlannerEventType.WAYPOINT_SELECTED, (data) => {
      setSelectedIndex(data.waypointIndex);
      setEditingIndex(-1); // Clear editing state
    });

    planner.onEvent(LinearMissionPlannerEventType.WAYPOINT_EDIT_STARTED, (data) => {
      setEditingIndex(data.waypointIndex);
    });

    planner.onEvent(LinearMissionPlannerEventType.WAYPOINT_EDIT_ENDED, () => {
      setEditingIndex(-1);
    });

    planner.onEvent(LinearMissionPlannerEventType.STATE_CHANGED, (data) => {
      setMissionState(data.newState);
    });

    planner.onEvent(LinearMissionPlannerEventType.MISSION_VALIDATION_FAILED, (data) => {
      setValidationErrors(data.validationErrors || []);
    });

    planner.onEvent(LinearMissionPlannerEventType.ROUTE_SETTINGS_CHANGED, (data) => {
      setRouteSettings(data.routeSettings);
    });

    planner.onEvent(LinearMissionPlannerEventType.WAYPOINTS_ALTITUDE_UPDATED, (data) => {
      if (data.waypointsWithExtendedPosition) {
        setExtendedWaypoints(data.waypointsWithExtendedPosition);
      }
    });

    // Initialize component state
    setWaypoints(planner.getWaypoints());
    setMissionState(planner.state);
    setSelectedIndex(planner.selectedWaypointIndex);
    setEditingIndex(planner.editingWaypointIndex);
    setRouteSettings(planner.missionRouteSettings);
    setAltitudeSettings(planner.routeAltitudeSettings);
    setMissionDistance(planner.missionDistance);
    setMissionPlanner(planner);

    // Clean up on unmount
    return () => {
      if (planner && !completedData) {
        planner.cancelMission();
        // Event handler cleanup is handled automatically in dispose()
      }
    };
  }, []);

  // No need for map click handler - handled internally by the planner
  // Just focus on UI interaction methods

  const handleWaypointSelect = (index) => {
    if (!missionPlanner) return;
    missionPlanner.selectWaypoint(index);
  };

  const handleEditModeToggle = () => {
    if (!missionPlanner) return;

    if (missionPlanner.editingWaypointIndex === -1) {
      // Enter edit mode if not already in it
      missionPlanner.enterEditMode();
    } else {
      // Exit edit mode if already in it
      missionPlanner.exitEditMode();
    }
  };

  const handleWaypointUpdate = (index, properties) => {
    if (!missionPlanner) return;

    // Make sure we're in edit mode for this waypoint
    if (missionPlanner.editingWaypointIndex !== index) {
      missionPlanner.selectWaypoint(index);
      missionPlanner.enterEditMode();
    }

    missionPlanner.updateWaypoint(index, properties);
  };

  const handleUpdateTakeoffSettings = () => {
    if (!missionPlanner) return;

    try {
      // Update takeoff mode
      missionPlanner.setTakeoffMode(TakeoffMode.SAFE_TAKEOFF);
      // Update takeoff altitude
      missionPlanner.setTakeoffAltitude(50);
      console.log('Takeoff settings updated');
    } catch (error) {
      console.error('Error updating takeoff settings:', error.message);
    }
  };

  const handleUpdateRouteDeviceYawMode = (mode) => {
    if (!missionPlanner) return;

    try {
      // Update route device yaw mode using new API
      missionPlanner.updateRouteDeviceYawMode(mode);
      console.log('Route device yaw mode updated to:', mode);
    } catch (error) {
      console.error('Error updating route device yaw mode:', error.message);
    }
  };

  const handleComputeOrientation = (index) => {
    if (!missionPlanner) return;

    try {
      const orientation = missionPlanner.computeWaypointOrientation(index);
      console.log(`Waypoint ${index} orientation:`, orientation);
      return orientation;
    } catch (error) {
      console.error('Error computing orientation:', error.message);
    }
  };

  const handleUpdateAltitudeSettings = async (type, value) => {
    if (!missionPlanner) return;

    try {
      await missionPlanner.updateRouteAltitudeSettings({ type, value });
      setAltitudeSettings(missionPlanner.routeAltitudeSettings);
      setMissionDistance(missionPlanner.missionDistance);
      console.log('Altitude settings updated');
    } catch (error) {
      console.error('Error updating altitude settings:', error.message);
    }
  };

  const handleGetExtendedPosition = async () => {
    if (!missionPlanner) return;

    try {
      const extended = await missionPlanner.getWaypointsWithExtendedPosition();
      setExtendedWaypoints(extended);
      console.log('Extended position data:', extended);
    } catch (error) {
      console.error('Error getting extended position:', error.message);
    }
  };

  const handlePanToWaypoint = (waypointNumber) => {
    if (!missionPlanner) return;

    const success = missionPlanner.panToWaypoint(waypointNumber);
    if (success) {
      console.log(`Panned to waypoint ${waypointNumber}`);
    } else {
      console.warn(`Failed to pan to waypoint ${waypointNumber}`);
    }
  };

  const handleToggleVisibility = () => {
    if (!missionPlanner) return;

    const currentVisibility = missionPlanner.isVisible;
    missionPlanner.setVisibility(!currentVisibility);
    console.log(`Mission visibility: ${!currentVisibility}`);
  };

  const handleCompleteMission = () => {
    if (!missionPlanner) return;

    try {
      setValidationErrors([]);
      // Get the completed mission data and remove from map
      const data = missionPlanner.completeMission();
      setCompletedData(data);

      // Do something with the data (save, send to server, etc.)
      console.log('Linear mission completed with data:', data);
    } catch (error) {
      console.error('Error completing linear mission:', error.message);
    }
  };

  const handleCancelMission = () => {
    if (!missionPlanner) return;
    missionPlanner.cancelMission();
    setMissionPlanner(null);
  };

  return (
    <div>
      <h2>Linear
  Mission
  Planner < /h2>
  < p > State
:
  {
    missionState
  }
  </p>
  < p > Selected
  Waypoint: {
    selectedIndex === -1 ? 'None' : selectedIndex
  }
  </p>
  < p > Editing
  Waypoint: {
    editingIndex === -1 ? 'None' : editingIndex
  }
  </p>
  < p > Route
  Mode: {
    routeSettings?.deviceYawRouteSettingsMode || 'Not set'
  }
  </p>
  < p >
  Altitude
  Mode: {
    altitudeSettings?.type || 'Not set'
  }
  ({ altitudeSettings?.value || 0
}
  m
)
  </p>
  < p > Mission
  Distance: {
    (missionDistance / 1000).toFixed(2)
  }
  km < /p>
  < p > Visibility
:
  {
    missionPlanner?.isVisible ? 'Visible' : 'Hidden'
  }
  </p>

  {
    validationErrors.length > 0 && (
      <div className = "validation-errors" >
        <h3>Validation
    Errors < /h3>
    < ul >
    {
      validationErrors.map((error, i) => (
        <li key = { i } > { error } < /li>
      ))
    }
    < /ul>
    < /div>
  )
  }

  {
    !completedData && (
      <>
        <Map onClick = { handleMapClick } > {/* Map visualization components */ } < /Map>

        < WaypointsList
    waypoints = { waypoints }
    selectedIndex = { selectedIndex }
    editingIndex = { editingIndex }
    onSelect = { handleWaypointSelect }
    />

    < div
    className = "waypoint-actions" >
    <button onClick = { handleEditModeToggle }
    disabled = { selectedIndex === -1
  }>
    {
      editingIndex !== -1 ? 'Exit Edit Mode' : 'Enter Edit Mode'
    }
    </button>
    < /div>

    < div
    className = "orientation-controls" >
      <h3>Orientation
    Settings < /h3>
    < div
    className = "route-settings" >
    <button onClick = {()
  =>
    handleUpdateRouteDeviceYawMode(DeviceYawRouteSettingsMode.ALONG_ROUTE)
  }
    disabled = {!
    missionPlanner || missionPlanner.state !== LinearMissionPlannerState.PLANNING
  }>
    Along
    Route
    Mode
    < /button>
    < button
    onClick = {()
  =>
    handleUpdateRouteDeviceYawMode(DeviceYawRouteSettingsMode.LOCK_YAW_AXIS)
  }
    disabled = {!
    missionPlanner || missionPlanner.state !== LinearMissionPlannerState.PLANNING
  }>
    Lock
    Yaw
    Mode
    < /button>
    < button
    onClick = {()
  =>
    handleUpdateRouteDeviceYawMode(DeviceYawRouteSettingsMode.MANUAL)
  }
    disabled = {!
    missionPlanner || missionPlanner.state !== LinearMissionPlannerState.PLANNING
  }>
    Manual
    Mode
    < /button>
    < /div>
    < div
    className = "orientation-computation" >
    <button onClick = {()
  =>
    handleComputeOrientation(selectedIndex)
  }
    disabled = { selectedIndex === -1
  }>
    Compute
    Selected
    Waypoint
    Orientation
    < /button>
    < /div>
    < /div>

    < div
    className = "altitude-controls" >
      <h3>Altitude
    Settings < /h3>
    < div
    className = "altitude-buttons" >
    <button onClick = {()
  =>
    handleUpdateAltitudeSettings('RLT', 100)
  }
    disabled = {!
    missionPlanner || missionPlanner.state !== LinearMissionPlannerState.PLANNING
  }>
    RLT
    Mode(100
    m
  )
    </button>
    < button
    onClick = {()
  =>
    handleUpdateAltitudeSettings('AGL', 120)
  }
    disabled = {!
    missionPlanner || missionPlanner.state !== LinearMissionPlannerState.PLANNING
  }>
    AGL
    Mode(120
    m
  )
    </button>
    < button
    onClick = { handleGetExtendedPosition }
    disabled = {!
    missionPlanner
  }>
    Get
    AGL
    Data
    < /button>
    < /div>
    < /div>

    < div
    className = "navigation-controls" >
      <h3>Navigation & Visibility < /h3>
      < div
    className = "navigation-buttons" >
    <button onClick = {()
  =>
    handlePanToWaypoint(1)
  }
    disabled = {!
    missionPlanner || missionPlanner.waypointCount === 0
  }>
    Pan
    to
    First
    Waypoint
    < /button>
    < button
    onClick = {()
  =>
    handlePanToWaypoint(missionPlanner?.waypointCount || 1)
  }
    disabled = {!
    missionPlanner || missionPlanner.waypointCount === 0
  }>
    Pan
    to
    Last
    Waypoint
    < /button>
    < button
    onClick = { handleToggleVisibility }
    disabled = {!
    missionPlanner
  }>
    Toggle
    Visibility
    < /button>
    < /div>
    < /div>

    < div
    className = "mission-actions" >
    <button onClick = { handleUpdateTakeoffSettings }
    disabled = {!
    missionPlanner || missionPlanner.state !== LinearMissionPlannerState.PLANNING
  }>
    Update
    Takeoff
    Settings
    < /button>

    < button
    onClick = { handleCompleteMission }
    disabled = {!
    missionPlanner || missionPlanner.state === LinearMissionPlannerState.AWAITING_REFERENCE || missionPlanner.waypointCount < 2
  }>
    Complete
    Mission
    < /button>

    < button
    onClick = { handleCancelMission } > Cancel
    Mission < /button>
    < /div>

    {
      extendedWaypoints.length > 0 && (
        <div className = "extended-waypoints" >
          <h3>AGL
      Altitude
      Data < /h3>
      < ul >
      {
        extendedWaypoints.map((waypoint, index) => (
          <li key = { index } >
            Waypoint
      {
        index
      }
    :
      {
        waypoint.extendedPosition.aglAltitude.toFixed(1)
      }
      m
      AGL
      < /li>
    ))
    }
      </ul>
      < /div>
    )
    }
    </>
  )
  }

  {
    completedData && (
      <div className = "mission-complete" >
        <h3>Linear
    Mission
    Planning
    Complete < /h3>
    < p > Reference
    Point: {
      JSON.stringify(completedData.referencePoint)
    }
    </p>
    < p > Waypoints
  :
    {
      completedData.waypoints.length
    }
    </p>
    < pre > { JSON.stringify(completedData, null, 2) } < /pre>
    < /div>
  )
  }
  </div>
)
  ;
}
```

This documentation provides a comprehensive guide to using the Linear Mission Planner interfaces for creating linear missions. The planner is focused solely on the planning phase of linear missions, and when planning is completed, it returns the mission data and removes itself from the map.
