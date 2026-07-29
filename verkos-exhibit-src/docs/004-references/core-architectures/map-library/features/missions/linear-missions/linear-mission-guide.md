# Linear Mission Guide

This document provides a comprehensive guide for using the Linear Mission interfaces to display and visualize completed linear missions on a map. The Linear Mission is designed specifically for read-only display of completed missions, unlike the LinearMissionPlanner which is focused on creating and editing missions.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)

- [Read-Only Mission View](#read-only-mission-view)
- [Mission Creation Options](#mission-creation-options)
- [Enhanced Waypoint Data](#enhanced-waypoint-data)
- [Takeoff Modes](#takeoff-modes)
- [Selection and Visibility](#selection-and-visibility)
- [Event Handling](#event-handling)

3. [Using the Mission Planner Manager](#using-the-mission-planner-manager)

- [Creating a Linear Mission View](#creating-a-linear-mission-view)
- [Managing Linear Missions](#managing-linear-missions)

4. [Coordinate System and Internal Handling](#coordinate-system-and-internal-handling)

- [RLT to HAE Conversion](#rlt-to-hae-conversion)
- [Visual Styling and Selection States](#visual-styling-and-selection-states)
- [Takeoff Path Visualization](#takeoff-path-visualization)

5. [Working with Linear Missions](#working-with-linear-missions)

- [Selecting and Deselecting Missions](#selecting-and-deselecting-missions)
- [Toggling Mission Visibility](#toggling-mission-visibility)
- [Panning to the Mission](#panning-to-the-mission)
- [Removing Missions](#removing-missions)

6. [Integration Patterns](#integration-patterns)

- [Mission Selection UI](#mission-selection-ui)
- [Mission List Integration](#mission-list-integration)

7. [Advanced Usage Patterns](#advanced-usage-patterns)

- [Mission with Complete Waypoint Data](#mission-with-complete-waypoint-data)
- [Multiple Mission Management](#multiple-mission-management)
- [Dynamic Mission Updates](#dynamic-mission-updates)

8. [Error Handling and Edge Cases](#error-handling-and-edge-cases)

- [Takeoff Altitude Validation](#takeoff-altitude-validation)
- [Handling Missing or Invalid Data](#handling-missing-or-invalid-data)
- [Resource Management](#resource-management)

9. [Best Practices](#best-practices)
10. [Examples](#examples)
11. [Comparison with LinearMissionPlanner](#comparison-with-linearmissionplanner)

## Overview

The LinearMissionView provides a read-only view of a linear mission with a reference point and a series of waypoints connected by a path. It is specifically designed for visualizing completed missions, allowing applications to display them on a map and highlight selected missions. Unlike the LinearMissionPlanner, which focuses on creating and editing missions, the LinearMissionView focuses on displaying and selecting existing missions.

## Core Concepts

### Read-Only Mission View

The `ILinearMissionView` interface represents a read-only view of a linear mission with the following key properties:

```typescript
interface ILinearMissionView {
  readonly id: string;
  readonly referencePoint: IPosition;
  readonly waypoints: ReadonlyArray<WaypointData>;
  readonly isSelected: boolean;
  readonly isVisible: boolean;
  readonly takeoffMode: TakeoffMode;
  readonly takeoffAltitude: number;

  setSelected(selected: boolean): void;

  setVisibility(visible: boolean): void;

  remove(): void;

  panTo(): void;

  onEvent(event: IEventType, callback: () => void): void;
}
```

### Mission Creation Options

When creating a linear mission view, you use the `ILinearMissionOptions` interface:

```typescript
interface ILinearMissionOptions {
  id?: string; // Optional unique identifier (auto-generated if not provided)
  name?: string; // Optional mission name for identification
  referencePoint: IPosition; // Required reference point (starting position)
  waypoints: WaypointData[]; // Array of waypoints defining the mission path
  isVisible?: boolean; // Initial visibility state (default: true)
  isSelected?: boolean; // Initial selection state (default: false)
  takeoffMode: TakeoffMode; // Required takeoff mode
  takeoffAltitude: number; // Required takeoff altitude in meters (minimum 2m)
}
```

### Enhanced Waypoint Data

The `WaypointData` interface includes additional properties for advanced mission features:

```typescript
interface WaypointData {
  position: IPosition; // Geographic coordinates
  orientation?: IOrientation; // Optional heading/attitude information
  properties?: Record<string, unknown>; // Optional additional properties
  followRouteAltitude?: boolean; // Whether this waypoint follows route altitude settings
  deviceYawAction?: IWaypointDeviceYawAction; // Optional device yaw action override
  approachSettings?: IWaypointApproachSettings; // Optional approach settings
}
```

The interface provides read-only access to the mission's data (reference point and waypoints) while allowing limited control through methods like `setSelected`, `setVisibility`, `remove`, and `panTo`.

### Takeoff Modes

The LinearMissionView supports two takeoff modes that determine how the path from the reference point to the first waypoint is visualized:

```typescript
enum TakeoffMode {
  // Direct diagonal path from reference point to first waypoint
  DIRECT_ASCENT = 'direct_ascent',

  // Ascends to a safe altitude before flying to the first waypoint
  SAFE_TAKEOFF = 'safe_takeoff',
}
```

These modes affect how the flight path is visualized:

1. **Direct Ascent Mode**: The path shows a more direct route from reference point to first waypoint, depending on altitude differences.

- When the first waypoint is higher than the reference point and the takeoff altitude is less than or equal to the altitude difference, the path shows a direct diagonal ascent.
- In other cases, the path shows vertical ascent followed by horizontal movement and descent as needed.

2. **Safe Takeoff Mode**: The path always includes a vertical ascent to the specified takeoff altitude before proceeding to the waypoint.

- This creates a more conservative flight path that prioritizes safety through controlled altitude management.
- The actual path shape depends on the relationship between reference point altitude, first waypoint altitude, and takeoff altitude.

Each LinearMissionView must specify both a takeoff mode and a takeoff altitude. The minimum takeoff altitude is 2 meters, enforced for safety reasons. If a value less than 2 meters is provided, it will be automatically adjusted to 2 meters with a console warning.

### Selection and Visibility

LinearMissionView supports two key visual states:

1. **Selection**: When a mission is selected, it uses a highlighted visual style to stand out from other missions on the map. This allows users to identify which mission is currently active or in focus.

2. **Visibility**: Missions can be shown or hidden on the map. This allows applications to control which missions are displayed to avoid visual clutter.

### Event Handling

LinearMissionView includes event handling for user interactions. Currently, only `CLICK` events are supported for mission selection:

```typescript
// Available event types for LinearMissionView
enum IEventType {
  CLICK = 'click',
  // Other event types are available but not currently supported by LinearMissionView:
  // DBL_CLICK, LEFT_DOWN, LEFT_UP, RIGHT_DOWN, RIGHT_UP, MOUSE_MOVE, etc.
}
```

When a user clicks on any part of the mission (reference point, waypoints, or path), the mission can respond by automatically selecting itself and notifying the application through the registered event callback:

```typescript
// Register a click event handler
linearMission.onEvent(IEventType.CLICK, () => {
  console.log('Mission clicked - mission will be automatically selected');
  // Handle mission selection in your application
  handleMissionSelection(linearMission.id);
});
```

**Important Notes:**

- Only one event handler can be registered per mission
- The mission automatically selects itself when clicked (if not already selected)
- The callback is executed after the mission's internal selection logic
- Other event types listed in `IEventType` are not currently supported by LinearMissionView

## Using the Mission Planner Manager

### Creating a Linear Mission View

To create a new linear mission view, you use the `plotLinearMissionView` method from the mission planner manager:

```typescript
import { IMissionPlannerManager } from '@map/public/base/feature-managers';
import { TakeoffMode } from '@map/public/base/feature-entities/mission-planners';

// Get the mission planner manager instance from your map
const missionPlannerManager = mapInstance.getMissionPlannerManager();

// Create a linear mission view with reference point and waypoints
const linearMission = missionPlannerManager.plotLinearMissionView({
  // Reference point (starting position)
  referencePoint: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 100,
  },
  // Array of waypoints
  waypoints: [
    {
      position: { latitude: 37.775, longitude: -122.4195, altitude: 110 },
      orientation: { heading: 45, pitch: 0, roll: 0 },
      // Optional: Additional waypoint properties
      properties: { speed: 5, captureRadius: 10 },
      // Optional: Device yaw action for this waypoint
      deviceYawAction: { value: 90, type: DroneYawActionTypes.NORTH },
      // Optional: Approach settings for this waypoint
      approachSettings: { followRoute: false, mode: NextWaypointApproachMode.LOCK_YAW_AXIS },
    },
    {
      position: { latitude: 37.776, longitude: -122.4196, altitude: 120 },
      // Optional: Whether this waypoint follows route altitude settings (default: true)
      followRouteAltitude: true,
    },
  ],
  // Required: Takeoff mode determines how the path from reference point to first waypoint is generated
  takeoffMode: TakeoffMode.SAFE_TAKEOFF,
  // Required: Takeoff altitude in meters (minimum 2 meters enforced for safety)
  takeoffAltitude: 30,
  // Optional: Set the initial selection state (default: false)
  isSelected: false,
  // Optional: Set the initial visibility (default: true)
  isVisible: true,
  // Optional: Provide a custom ID (default: auto-generated UUID)
  id: 'my-mission-1',
  // Optional: Provide a human-readable name for identification
  name: 'Survey Mission Alpha',
});
```

### Managing Linear Missions

Applications are responsible for maintaining references to created linear missions. Unlike the LinearMissionPlanner, which has a concept of "current mission," the mission planner manager doesn't track which linear missions are currently displayed. This allows multiple missions to be displayed simultaneously.

## Coordinate System and Internal Handling

### RLT to HAE Conversion

LinearMissionView internally handles coordinate system conversion from RLT (Relative to Launch/Takeoff) to HAE (Height Above Ellipsoid) coordinates:

```typescript
// When you provide waypoints in RLT coordinates (relative to takeoff point)
const missionOptions = {
  referencePoint: { latitude: 37.7749, longitude: -122.4194, altitude: 100 }, // RLT
  waypoints: [
    { position: { latitude: 37.775, longitude: -122.4195, altitude: 110 } }, // RLT
    { position: { latitude: 37.776, longitude: -122.4196, altitude: 120 } }, // RLT
  ],
  takeoffMode: TakeoffMode.SAFE_TAKEOFF,
  takeoffAltitude: 30,
};

// LinearMissionView automatically converts these to HAE coordinates internally
const mission = missionPlannerManager.plotLinearMissionView(missionOptions);

// When you access waypoints, they're returned in their original RLT format
console.log(mission.waypoints); // Returns waypoints in RLT coordinates
console.log(mission.referencePoint); // Returns reference point in RLT coordinates
```

### Visual Styling and Selection States

LinearMissionView maintains different visual representations based on selection state:

**Normal State:**

- Reference point: Standard marker with basic styling
- Waypoints: Numbered markers with standard colors
- Path: Standard polyline connecting waypoints

**Selected State:**

- Reference point: Highlighted marker with enhanced visibility
- Waypoints: Enhanced markers with prominent numbering
- Path: Highlighted polyline with increased width and distinct color

### Takeoff Path Visualization

The takeoff path (from reference point to first waypoint) is generated using the `TakeoffPathService` based on your specified takeoff mode and altitude:

```typescript
// The takeoff path is automatically calculated and visualized
// You don't need to manually specify the path points
const mission = missionPlannerManager.plotLinearMissionView({
  referencePoint: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  waypoints: [{ position: { latitude: 37.775, longitude: -122.4195, altitude: 150 } }],
  takeoffMode: TakeoffMode.SAFE_TAKEOFF,
  takeoffAltitude: 50, // Mission will show path: vertical ascent to 50m, then to waypoint
});
```

## Working with Linear Missions

### Selecting and Deselecting Missions

You can select or deselect a mission by calling the `setSelected` method:

```typescript
// Select the mission (highlighted style)
linearMission.setSelected(true);

// Deselect the mission (normal style)
linearMission.setSelected(false);

// Check the current selection state
if (linearMission.isSelected) {
  console.log('Mission is currently selected');
} else {
  console.log('Mission is not selected');
}
```

When a mission is selected, its visual representation (reference point marker, waypoint markers, and path) will be rendered with a highlighted style to make it visually distinct from other missions on the map.

### Toggling Mission Visibility

You can show or hide a mission by calling the `setVisibility` method:

```typescript
// Show the mission
linearMission.setVisibility(true);

// Hide the mission
linearMission.setVisibility(false);

// Check the current visibility
if (linearMission.isVisible) {
  console.log('Mission is currently visible');
} else {
  console.log('Mission is currently hidden');
}
```

Hiding a mission temporarily removes its visual components from the map without deleting them, allowing you to show them again later.

### Panning to the Mission

To focus the map view on a mission, use the `panTo` method:

```typescript
// Center the map view on the mission
linearMission.panTo();
```

This adjusts the camera to show the entire mission path, ensuring that all waypoints and the reference point are visible in the viewport.

### Removing Missions

When you no longer need a mission, call the `remove` method to clean up its resources:

```typescript
// Remove the mission from the map and clean up resources
linearMission.remove();
```

After calling `remove`, the mission is no longer usable, and you should remove any references to it from your application.

## Integration Patterns

### Mission Selection UI

You can integrate the linear mission selection with your UI:

```typescript
// Mission selection button click handler
function handleMissionSelect(missionId) {
  const selectedMission = missions.find((m) => m.id === missionId);

  // Deselect all other missions
  missions.forEach((mission) => {
    if (mission.id !== missionId) {
      mission.setSelected(false);
    }
  });

  // Select the clicked mission
  if (selectedMission) {
    selectedMission.setSelected(true);
    selectedMission.panTo(); // Optionally pan to the selected mission

    // Update UI state
    setActiveMissionId(missionId);
    updateMissionDetails(selectedMission);
  }
}
```

### Mission List Integration

You can integrate with a mission list component in your application:

```typescript
// React component example
function MissionsList({ missions, onMissionSelect }) {
  return (
    <div className="missions-list">
      <h3>Available Missions</h3>
      <ul>
        {missions.map((mission) => (
          <li key={mission.id} className={mission.isSelected ? 'selected' : ''} onClick={() => onMissionSelect(mission.id)}>
            Mission {mission.id.slice(0, 8)} - {mission.waypoints.length} waypoints
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Usage Patterns

### Mission with Complete Waypoint Data

```typescript
// Create a mission with all available waypoint properties
const advancedMission = missionPlannerManager.plotLinearMissionView({
  referencePoint: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  waypoints: [
    {
      position: { latitude: 37.775, longitude: -122.4195, altitude: 110 },
      orientation: { heading: 45, pitch: 0, roll: 0 },
      properties: {
        speed: 5,
        captureRadius: 10,
        actionId: 'take_photo',
        holdTime: 2000,
      },
      followRouteAltitude: true,
      deviceYawAction: { value: 90, type: DroneYawActionTypes.NORTH },
      approachSettings: {
        followRoute: false,
        mode: NextWaypointApproachMode.LOCK_YAW_AXIS,
      },
    },
    {
      position: { latitude: 37.776, longitude: -122.4196, altitude: 120 },
      orientation: { heading: 90, pitch: -15, roll: 0 },
      properties: { speed: 3, captureRadius: 5 },
      followRouteAltitude: false, // This waypoint has independent altitude
    },
  ],
  takeoffMode: TakeoffMode.DIRECT_ASCENT,
  takeoffAltitude: 25,
  name: 'Advanced Survey Mission',
  id: 'advanced-mission-001',
});
```

### Multiple Mission Management

```typescript
// Create a mission manager class for handling multiple missions
class MissionManager {
  private missions: Map<string, ILinearMissionView> = new Map();
  private selectedMissionId: string | null = null;

  addMission(options: ILinearMissionOptions): ILinearMissionView {
    const mission = missionPlannerManager.plotLinearMissionView(options);

    // Register click handler for automatic selection
    mission.onEvent(IEventType.CLICK, () => {
      this.selectMission(mission.id);
    });

    this.missions.set(mission.id, mission);
    return mission;
  }

  selectMission(missionId: string): void {
    // Deselect all missions
    this.missions.forEach((mission) => {
      mission.setSelected(false);
    });

    // Select the target mission
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.setSelected(true);
      mission.panTo();
      this.selectedMissionId = missionId;
    }
  }

  toggleMissionVisibility(missionId: string): void {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.setVisibility(!mission.isVisible);
    }
  }

  removeMission(missionId: string): void {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.remove();
      this.missions.delete(missionId);

      if (this.selectedMissionId === missionId) {
        this.selectedMissionId = null;
      }
    }
  }

  removeAllMissions(): void {
    this.missions.forEach((mission) => mission.remove());
    this.missions.clear();
    this.selectedMissionId = null;
  }
}
```

### Dynamic Mission Updates

```typescript
// While missions are read-only, you can create new missions based on existing ones
function updateMissionWaypoints(originalMission: ILinearMissionView, newWaypoints: WaypointData[]): ILinearMissionView {
  // Remove the original mission
  originalMission.remove();

  // Create a new mission with updated waypoints
  const updatedMission = missionPlannerManager.plotLinearMissionView({
    referencePoint: originalMission.referencePoint,
    waypoints: newWaypoints,
    takeoffMode: originalMission.takeoffMode,
    takeoffAltitude: originalMission.takeoffAltitude,
    isSelected: originalMission.isSelected,
    isVisible: originalMission.isVisible,
    id: originalMission.id, // Reuse the same ID
  });

  return updatedMission;
}
```

## Error Handling and Edge Cases

### Takeoff Altitude Validation

```typescript
// Takeoff altitude is automatically validated and corrected
const mission = missionPlannerManager.plotLinearMissionView({
  referencePoint: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  waypoints: [{ position: { latitude: 37.775, longitude: -122.4195, altitude: 110 } }],
  takeoffMode: TakeoffMode.SAFE_TAKEOFF,
  takeoffAltitude: 1, // Will be automatically corrected to 2 meters
});

console.log(mission.takeoffAltitude); // Output: 2 (minimum enforced)
```

### Handling Missing or Invalid Data

```typescript
// Handle cases where waypoint data might be incomplete
function createSafeMission(options: Partial<ILinearMissionOptions>): ILinearMissionView | null {
  try {
    // Validate required fields
    if (!options.referencePoint || !options.waypoints || !options.takeoffMode) {
      console.error('Missing required mission parameters');
      return null;
    }

    // Ensure waypoints have valid positions
    const validWaypoints = options.waypoints.filter((wp) => wp.position && typeof wp.position.latitude === 'number' && typeof wp.position.longitude === 'number' && typeof wp.position.altitude === 'number');

    if (validWaypoints.length === 0) {
      console.error('No valid waypoints provided');
      return null;
    }

    // Create mission with validated data
    const mission = missionPlannerManager.plotLinearMissionView({
      referencePoint: options.referencePoint,
      waypoints: validWaypoints,
      takeoffMode: options.takeoffMode,
      takeoffAltitude: options.takeoffAltitude || 30, // Default value
      isSelected: options.isSelected || false,
      isVisible: options.isVisible !== false, // Default to true
      id: options.id,
      name: options.name,
    });

    return mission;
  } catch (error) {
    console.error('Failed to create mission:', error);
    return null;
  }
}
```

### Resource Management

```typescript
// Proper cleanup when component unmounts or page changes
class MissionViewer {
  private missions: ILinearMissionView[] = [];

  addMission(options: ILinearMissionOptions): void {
    const mission = missionPlannerManager.plotLinearMissionView(options);
    this.missions.push(mission);
  }

  // Call this when the component unmounts or when navigating away
  cleanup(): void {
    this.missions.forEach((mission) => {
      try {
        mission.remove();
      } catch (error) {
        console.warn('Error removing mission:', error);
      }
    });
    this.missions.length = 0;
  }
}
```

## Best Practices

1. **Resource Management**: Always call `remove()` when you're done with a mission to clean up resources and prevent memory leaks.
2. **Selection Management**: When selecting one mission, deselect others to avoid visual confusion.
3. **Event Registration**: Register click handlers to respond to user interactions with the mission.
4. **Mission Identification**: Use meaningful IDs and names for missions to easily identify them in your application.
5. **Visibility Control**: Use visibility toggling to manage visual complexity when displaying multiple missions.
6. **User Focus**: Use `panTo()` when selecting a mission to ensure it's visible to the user.
7. **Performance**: Be mindful of displaying too many missions simultaneously, as it can impact performance.
8. **Error Handling**: Always validate mission data before creating missions and handle potential errors gracefully.
9. **Coordinate Validation**: Ensure waypoint positions have valid latitude, longitude, and altitude values.
10. **Altitude Considerations**: Remember that takeoff altitude has a minimum of 2 meters for safety.

## Examples

### Complete Example

```typescript
// Get the mission planner manager
const missionPlannerManager = mapInstance.getMissionPlannerManager();

// Create and manage multiple missions
const missions = [];

// Create the first mission
const mission1 = missionPlannerManager.plotLinearMissionView({
  referencePoint: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 100,
  },
  waypoints: [
    {
      position: { latitude: 37.775, longitude: -122.4195, altitude: 110 },
      orientation: { heading: 45, pitch: 0, roll: 0 },
    },
    {
      position: { latitude: 37.776, longitude: -122.4196, altitude: 120 },
    },
  ],
  // Required takeoff settings
  takeoffMode: TakeoffMode.SAFE_TAKEOFF,
  takeoffAltitude: 30,
  isSelected: true, // Start with this mission selected
});

// Add to our mission collection
missions.push(mission1);

// Create a second mission
const mission2 = missionPlannerManager.plotLinearMissionView({
  referencePoint: {
    latitude: 37.7739,
    longitude: -122.4154,
    altitude: 100,
  },
  waypoints: [
    {
      position: { latitude: 37.774, longitude: -122.4155, altitude: 110 },
    },
    {
      position: { latitude: 37.775, longitude: -122.4156, altitude: 120 },
    },
  ],
  // Required takeoff settings - using direct ascent mode for this mission
  takeoffMode: TakeoffMode.DIRECT_ASCENT,
  takeoffAltitude: 20,
});

// Add to our mission collection
missions.push(mission2);

// Set up a selection handler
mission1.onEvent(IEventType.CLICK, () => {
  // Deselect all other missions
  missions.forEach((m) => {
    if (m.id !== mission1.id) {
      m.setSelected(false);
    }
  });

  // This mission is automatically selected in the click handler
  console.log('Mission 1 selected');
  updateMissionPanel(mission1);
});

mission2.onEvent(IEventType.CLICK, () => {
  // Deselect all other missions
  missions.forEach((m) => {
    if (m.id !== mission2.id) {
      m.setSelected(false);
    }
  });

  // This mission is automatically selected in the click handler
  console.log('Mission 2 selected');
  updateMissionPanel(mission2);
});

// Toggle mission visibility example
document.getElementById('toggle-mission1').addEventListener('click', () => {
  mission1.setVisibility(!mission1.isVisible);
  updateVisibilityStatus('mission1', mission1.isVisible);
});

document.getElementById('toggle-mission2').addEventListener('click', () => {
  mission2.setVisibility(!mission2.isVisible);
  updateVisibilityStatus('mission2', mission2.isVisible);
});

// Pan to mission example
document.getElementById('pan-to-mission1').addEventListener('click', () => {
  mission1.panTo();
});

// Cleanup when done
function cleanupMissions() {
  missions.forEach((mission) => mission.remove());
  missions.length = 0; // Clear the array
}
```

### React Component Example

```typescript
// Example React component using the LinearMissionView
import { TakeoffMode } from '@map/public/base/feature-entities/mission-planners';

function MissionViewerComponent() {
  const [missions, setMissions] = useState([]);
  const [activeMissionId, setActiveMissionId] = useState(null);

  useEffect(() => {
    // Initialize map and load missions
    const mapInstance = window.__flytMapInstance;
    const missionPlannerManager = mapInstance.getMissionPlannerManager();

    // Load mission data from your data source
    fetchMissions().then((missionData) => {
      // Create LinearMissionView instances for each mission
      const missionInstances = missionData.map((data) => {
        const mission = missionPlannerManager.plotLinearMissionView({
          referencePoint: data.referencePoint,
          waypoints: data.waypoints,
          // Use takeoff settings from the saved mission data
          takeoffMode: data.takeoffMode || TakeoffMode.SAFE_TAKEOFF,
          takeoffAltitude: data.takeoffAltitude || 30,
          id: data.id,
        });

        // Set up click handler for selection
        mission.onEvent(IEventType.CLICK, () => {
          handleMissionSelect(mission.id);
        });

        return mission;
      });

      setMissions(missionInstances);

      // Select the first mission by default if available
      if (missionInstances.length > 0) {
        handleMissionSelect(missionInstances[0].id);
      }
    });

    // Clean up on unmount
    return () => {
      missions.forEach((mission) => mission.remove());
    };
  }, []);

  const handleMissionSelect = (missionId) => {
    // Deselect all missions
    missions.forEach((mission) => {
      mission.setSelected(mission.id === missionId);
    });

    setActiveMissionId(missionId);

    // Pan to the selected mission
    const mission = missions.find((m) => m.id === missionId);
    if (mission) {
      mission.panTo();
    }
  };

  const handleMissionVisibilityToggle = (missionId) => {
    const mission = missions.find((m) => m.id === missionId);
    if (mission) {
      mission.setVisibility(!mission.isVisible);
      // Force component update
      setMissions([...missions]);
    }
  };

  return (
    <div className = "mission-viewer" >
      <h2>Mission
  Viewer < /h2>

  < div
  className = "fleet-mission" >
    <h3>Available
  Missions < /h3>
  < ul >
  {
    missions.map((mission) => (
      <li key = { mission.id } className = { mission.id === activeMissionId ? 'active' : '' } >
    <span onClick = {()
=>
  handleMissionSelect(mission.id)
}>
  Mission
  {
    mission.id.substring(0, 8)
  }
  </span>

  < button
  onClick = {()
=>
  handleMissionVisibilityToggle(mission.id)
}
  title = { mission.isVisible ? 'Hide' : 'Show' } >
    { mission.isVisible ? '👁️' : '👁️‍🗨️' }
    < /button>

    < button
  onClick = {()
=>
  mission.panTo()
}
  title = "Center on map" >
                🔍
              </button>
              < /li>
))
}
  </ul>
  < /div>

  {
    activeMissionId && (
      <div className = "mission-details" >
        <h3>Selected
    Mission
    Details < /h3>
    {
      (() => {
        const mission = missions.find((m) => m.id === activeMissionId);
        if (!mission) return null;

        return (
          <>
            <p>Waypoints
      :
        {
          mission.waypoints.length
        }
        </p>
        < p >
        Reference
        point:
        {
          mission.referencePoint.latitude.toFixed(5)
        }
      ,
        {
          mission.referencePoint.longitude.toFixed(5)
        }
        </p>
        < p > Takeoff
        Mode: {
          mission.takeoffMode === TakeoffMode.DIRECT_ASCENT ? 'Direct Ascent' : 'Safe Takeoff'
        }
        </p>
        < p > Takeoff
        Altitude: {
          mission.takeoffAltitude
        }
        meters < /p>
        < p > Visible
      :
        {
          mission.isVisible ? 'Yes' : 'No'
        }
        </p>
        < />
      )
        ;
      })()
    }
    </div>
  )
  }
  </div>
)
  ;
}
```

## Comparison with LinearMissionPlanner

The LinearMissionView and LinearMissionPlanner classes serve complementary but distinct roles in the mission lifecycle:

| Feature                | LinearMissionView                                       | LinearMissionPlanner                                                    |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| **Purpose**            | Display and visualize completed missions            | Create and edit missions through an interactive planning process        |
| **Nature**             | Read-only view with selection capability            | Fully editable with robust state management                             |
| **State Management**   | Simple (selected/visible)                           | Complex (AWAITING_REFERENCE/PLANNING states, editing mode)              |
| **Waypoint Editing**   | Not supported                                       | Extensive waypoint creation, editing, reordering functionality          |
| **Reference Point**    | Fixed at creation                                   | Can be set and updated during planning                                  |
| **User Interaction**   | Click to select, pan to view                        | Rich interaction with map for creating and editing waypoints            |
| **Event System**       | Simple click events                                 | Comprehensive event system for all aspects of mission planning          |
| **Simultaneous Use**   | Multiple missions can be displayed simultaneously   | Only one active planning session at a time                              |
| **Visual Styling**     | Normal and selected styles                          | Multiple styles for different waypoint states (normal/selected/editing) |
| **Takeoff Modes**      | Read-only display of takeoff paths                  | Interactive configuration of takeoff modes and altitudes                |
| **Path Visualization** | Single path with takeoff section                    | Real-time path updates based on takeoff settings and waypoint positions |
| **Typical Use Case**   | Viewing completed missions, comparing mission plans | Creating new missions, modifying existing missions                      |

In summary, LinearMissionPlanner is designed for the **creation and editing** phase of mission planning, while LinearMissionView is designed for the **visualization and selection** of completed missions.

The typical workflow would be:

1. Use LinearMissionPlanner to create a new mission or edit an existing one, including setting takeoff mode and altitude
2. When planning is complete, save the mission data (reference point, waypoints, takeoff mode, and takeoff altitude)
3. Later, load the saved mission data and use LinearMissionView to display it on the map with the specified takeoff path

This separation of concerns allows each class to be optimized for its specific role in the mission lifecycle while maintaining a consistent visualization of the planned flight path including takeoff behavior.
