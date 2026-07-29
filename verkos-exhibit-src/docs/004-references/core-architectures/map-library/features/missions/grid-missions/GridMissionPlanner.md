# GridMissionPlanner Class Documentation

## Overview

The GridMissionPlanner class is the main orchestrator for creating and managing grid-based flight missions. It provides an interactive interface for users to define survey areas and automatically generates optimized flight paths within those boundaries.

## Purpose

This class serves as the bridge between user interactions and the mathematical calculations needed for grid mission planning. It manages the visual representation, handles user inputs, and coordinates with the GridHelper service for waypoint generation.

## Dependencies

- **IGridMissionPlanner**: Interface that defines the contract for grid mission planning
- **ICompositeManager**: Manages composite entities like polygons and polylines
- **GridHelper**: Service class that handles all mathematical calculations (see GridHelper.md for details)
- **MapEventEmitter**: Event system for reactive updates and component communication
- **UUID**: For generating unique identifiers
- **Event System**: For reactive updates when polygon changes

## Class Structure

### Properties

#### Identity and Configuration

- **id** (line 17): Unique identifier for the mission planner instance, generated using UUID v4
- **position** (line 18): The initial center position where the grid area is created

#### Private Configuration

- **\_gridAngle** (line 23): Stores the rotation angle of the grid pattern in degrees
  - Default value: 0 (North-South orientation)
  - Valid range: -90° to 90°
- **\_gridSpacing** (line 24): Distance between parallel grid lines in meters
  - Default value: 15 meters
  - Must be positive value
- **\_customApproachEnabled** (line 28): Boolean flag indicating if custom approach mode is active
  - Default value: false
- **\_isAwaitingCustomPathClick** (line 29): Boolean flag indicating if waiting for user click to create approach path
  - Default value: false
- **\_editable** (line 30): Boolean flag tracking the current editable state of the grid mission
  - Default value: true
- **options** (line 33): Stores the initial configuration options passed to the constructor
  - Type: IGridMissionOptions

#### Visual Components

- **polygon** (line 21): An FBPolygon instance that represents the survey boundary
  - Editable by users through drag interactions
  - Shows distance labels on edges
  - Initial radius: 25 meters from center
  - Styled with green tint color (MapColor.GREEN_TINT)
- **girdMissionPolyline** (line 27): Visual representation of the generated flight path
  - Note: Contains typo, should be "gridMissionPolyline"
- **gridLines** (line 22): Array of FBPolyline instances for grid visualization
- **customApproachPolyline** (line 31): FBPolyline representing the custom approach path to the grid
  - Type: IFBPolyline | undefined
  - Created when user clicks on map in custom approach mode
  - Connects user-selected start point to grid start point
  - Editable with vertex manipulation (except last vertex which stays connected)
  - Styled with green tint color matching the grid
- **customApproachStartVertex** (line 32): Stores the initial click position for the custom approach
  - Type: IPosition | undefined
- **startMarker** (line 34): Visual marker indicating the start point of the grid mission
  - Type: IFBMarker | undefined
  - Uses custom SVG icon: `/assets/grid-mission/grid_start.svg`
  - Positioned at the first waypoint
- **endMarker** (line 35): Visual marker indicating the end point of the grid mission
  - Type: IFBMarker | undefined
  - Uses custom SVG icon: `/assets/grid-mission/grid_end.svg`
  - Positioned at the last waypoint
  - Only created when there are 2 or more waypoints

#### Internal Components

- **\_compositeManager** (line 19): Reference to the composite manager for creating visual entities
- **\_eventEmitter** (line 20): MapEventEmitter instance for publishing events to external listeners
- **gridHelper** (line 25): Instance of GridHelper service that performs waypoint calculations
- **\_waypoints** (line 26): Array storing the generated waypoints for the mission

## Constructor (lines 37-68)

The constructor initializes a new grid mission planner with the following steps:

1. **Identity Setup**: Generates a unique UUID for the instance (line 41)
2. **Options Storage**: Saves the configuration options (line 42)
3. **Service Initialization**: Creates a new GridHelper instance for calculations (line 43)
4. **Manager References**: Stores composite manager and creates event emitter (lines 44-45)
5. **Position Storage**: Saves the initial position for the grid center (line 46)
6. **Spacing Initialization**: Sets grid spacing from options if provided (lines 49-51)
7. **Polygon Creation**: Creates an editable polygon with:

- Center at the provided position
- Initial radius of 25 meters
- Editable vertices for user adjustment
- Distance labels on edges
- Green tint styling (MapColor.GREEN_TINT) for fill and outline
- Outline width of 5 pixels

8. **Initial Grid Generation**: Calls performGridUpdate() to create initial waypoints (line 66)
9. **Event Registration**: Sets up listeners for polygon changes (line 67)

## Property Accessors

### Grid Angle (lines 71-81)

- **Getter**: Returns the current grid angle value
- **Setter**:
  - Validates that the new angle is different from current
  - Updates the internal angle value
  - Automatically triggers grid regeneration via performGridUpdate()

### Grid Spacing (lines 84-94)

- **Getter**: Returns the current spacing value
- **Setter**:
  - Validates the new spacing is different and positive
  - Updates the internal spacing value
  - Automatically triggers grid regeneration

### Custom Approach Enabled (lines 97-99)

- **Getter**: Returns whether custom approach mode is enabled
- Indicates if the user can create a custom approach path to the grid

### Is Awaiting Custom Path Click (lines 102-104)

- **Getter**: Returns whether the system is waiting for a map click
- When true, the next map click will create the custom approach polyline

### Custom Approach Position Count (lines 107-109)

- **Getter**: Returns the number of positions in the custom approach polyline
- Returns 0 if no custom approach exists

These accessors implement the reactive pattern - any change to these properties automatically updates the visual grid.

## Core Methods

### performGridUpdate() (lines 330-344)

The central method responsible for regenerating the grid whenever parameters change:

1. Retrieves current polygon vertex positions
2. Configures GridHelper with current angle and spacing
3. Provides polygon boundary to GridHelper
4. Calls GridHelper.generateWaypoints() to calculate new waypoints
5. Stores the generated waypoints
6. **Updates custom approach endpoint** if it exists to maintain connection
7. Updates visual representation via plotGridLines()

This method is called automatically when:

- Grid angle changes
- Grid spacing changes
- Polygon vertices are modified by user
- Custom approach is disabled

### Event Handling

#### registerEventHandlers() (lines 111-117)

Sets up event listeners for polygon modifications:

- Listens for POSITION_CHANGED events from the polygon
- When vertices are dragged, automatically calls performGridUpdate()
- Ensures grid always matches current polygon boundary

#### getEventEmitter() (lines 300-302)

Returns a listen-only instance of the event emitter:

- Allows external components to subscribe to grid mission events
- Returns read-only instance to prevent external event emission
- Used for notifying about position changes and custom approach updates

## Interface Implementation Methods

### updateGridAngle(angle: number) (lines 183-185)

Public method for external components to update grid angle:

- Uses the angle setter which triggers automatic updates
- Part of IGridMissionPlanner interface contract

### updateGridSpacing(spacing: number) (lines 188-190)

Public method for external components to update spacing:

- Uses the spacing setter which includes validation
- Part of IGridMissionPlanner interface contract

### updateGrid(options?: Partial<IGridMissionOptions>) (lines 193-202)

Flexible method for batch updates:

- Accepts optional parameters object
- Currently supports gridSpacing updates
- Calls performGridUpdate() after parameter updates
- Useful for updating multiple parameters without multiple regenerations

### setCustomApproach(enabled: boolean) (lines 252-278)

Controls the custom approach mode:

- **When enabled**:
  - Only allows activation if grid is editable
  - Cleans up any existing custom approach
  - Sets flag to await user click on map
  - If not editable, logs warning and prevents activation
- **When disabled**:
  - Removes custom approach polyline
  - Resets awaiting click flag
  - Regenerates standard grid pattern

### handleCustomApproachClick(position: IPosition) (lines 281-297)

Handles map click events when in custom approach mode:

1. Validates that system is awaiting click and waypoints exist
2. Gets the current grid start position
3. Creates custom approach polyline from click position to grid start
4. Resets awaiting click flag
5. Approach polyline is automatically editable (except last vertex)

### getCompleteMissionPath() (lines 305-327)

Returns the complete mission path including custom approach:

1. Creates empty mission path array
2. If custom approach exists, adds all approach positions except last (to avoid duplication)
3. Adds all grid waypoints
4. Returns combined path for mission execution
5. Approach path waypoints come before grid waypoints

## Visualization Methods

### drawStartMarker(position: IPosition) (lines 154-162)

Creates a visual marker for the mission start point:

- Creates an FBMarker using the composite manager
- Positioned at the provided position (first waypoint)
- Uses custom SVG icon from `/assets/grid-mission/grid_start.svg`
- Height reference set to NONE

### drawEndMarker(position: IPosition) (lines 164-172)

Creates a visual marker for the mission end point:

- Creates an FBMarker using the composite manager
- Positioned at the provided position (last waypoint)
- Uses custom SVG icon from `/assets/grid-mission/grid_end.svg`
- Height reference set to NONE
- Only drawn when there are multiple waypoints to avoid overlap with start marker

### plotGridLines(waypoints: WaypointFE[]) (lines 131-152)

Converts waypoint data into visual representation:

1. Calls removeGrid() to clean up existing visualization
2. Maps waypoints to IPosition format (latitude/longitude)
3. Creates FBPolyline using composite manager with green tint styling
4. Polyline connects all waypoints showing the flight path
5. Draws start marker at the first waypoint (if waypoints exist)
6. Draws end marker at the last waypoint (if more than 1 waypoint exists)

### removeGrid() (lines 119-129)

Cleanup method for grid visualization:

- Retrieves existing polyline by ID and removes it
- Removes start marker if it exists
- Removes end marker if it exists
- Resets gridLines array

### clearGridLines() (lines 174-180)

Alternative cleanup method for grid lines:

- Iterates through gridLines array
- Removes each line individually
- Clears the array

## Mission Lifecycle Methods

### cancelMission() (lines 508-514)

Called when user cancels the mission:

- **Calls cleanupCustomApproach()** to remove custom approach if exists
- Calls clearGridLines() to remove grid visualization
- Removes the polygon boundary from map
- Cleans up all visual elements

## Visibility and Editability Control

### setVisibility(visible: boolean) (lines 205-235)

Controls the visibility of all grid mission components:

- Sets polygon boundary visibility
- Sets grid polyline (flight path) visibility
- **Sets custom approach polyline visibility**
- Sets grid lines visibility (if any)
- Sets start marker visibility
- Sets end marker visibility
- Ensures all visual elements are shown/hidden together

### setEditable(editable: boolean) (lines 238-249)

Controls the editability of the grid mission and its components:

- **Stores editable state** in \_editable property
- Sets polygon boundary editability
- **Sets custom approach polyline editability** (synchronized with grid)
- When set to false:
  - Prevents polygon vertex dragging
  - Locks custom approach polyline vertices
  - Disables custom approach mode creation
- When set to true:
  - Enables polygon vertex manipulation
  - Allows custom approach polyline editing
  - Permits custom approach mode activation

## Visual Markers

### Start and End Markers

The GridMissionPlanner now includes visual markers to clearly indicate the start and end points of the grid mission:

#### Start Marker

- **Icon**: Custom SVG with "S" label (`/assets/grid-mission/grid_start.svg`)
- **Position**: First waypoint in the mission path
- **Color**: Blue (#3A9BF3)
- **Purpose**: Shows where the drone will begin the survey pattern

#### End Marker

- **Icon**: Custom SVG with "E" label (`/assets/grid-mission/grid_end.svg`)
- **Position**: Last waypoint in the mission path
- **Color**: Red (#FF5252)
- **Purpose**: Shows where the drone will complete the survey pattern
- **Condition**: Only displayed when there are 2 or more waypoints

### Marker Management

- Markers are automatically created when waypoints are generated
- Markers are removed when the grid is cleared or mission is cancelled
- Marker visibility is controlled along with other grid components
- Markers update position automatically when grid parameters change

## Event System

The GridMissionPlanner implements a comprehensive event system for component communication:

### Event Emitter Architecture

- **\_eventEmitter** (line 20): MapEventEmitter instance for publishing events
- **getEventEmitter()** (lines 300-302): Returns listen-only instance for external subscriptions
- Prevents external components from emitting events directly

### Event Types Emitted

1. **POSITION_CHANGED Events**:

- Emitted when polygon vertices are modified
- Emitted when custom approach is created (lines 388-395)
- Emitted when custom approach positions change (lines 477-484)
- Emitted when custom approach is removed (lines 498-505)
- Contains metadata about source and position count

### Event Flow

1. **Polygon Events**: Polygon position changes trigger performGridUpdate()
2. **Custom Approach Events**: Forwarded through forwardCustomApproachEvents()
3. **External Subscriptions**: Components use getEventEmitter() to listen for updates

## Integration with GridHelper

The GridMissionPlanner delegates all mathematical calculations to the GridHelper service:

1. **Waypoint Generation**: GridHelper handles complex geometry calculations
2. **Coordinate Transformations**: GridHelper converts between geographic and planar coordinates
3. **Pattern Optimization**: GridHelper creates efficient snake patterns
4. **Intersection Calculations**: GridHelper determines valid flight segments

The separation of concerns ensures:

- GridMissionPlanner focuses on user interaction and visualization
- GridHelper handles pure mathematical computations
- Clean architecture with single responsibilities

## Custom Approach Path Feature

### Overview

The GridMissionPlanner supports creating a custom approach path that connects a user-selected starting point to the beginning of the grid survey pattern. This allows operators to define specific entry routes to the survey area.

### Key Components

#### Private Methods for Custom Approach

##### getGridStartPosition() (lines 347-357)

- Returns the position of the first grid waypoint
- Used to determine where the custom approach should connect
- Returns undefined if no waypoints exist

##### createCustomApproachPolyline(startPos, gridStart) (lines 360-396)

- Creates an editable polyline from user click to grid start
- Stores the start vertex for reference
- **Respects current editability state** of the grid
- Applies green tint styling to match grid appearance
- Sets up vertex handling to lock the connection point
- Calls setupCustomApproachVertexHandling() for special vertex behavior
- Forwards events via forwardCustomApproachEvents()
- Emits initial POSITION_CHANGED event for custom approach creation

##### setupCustomApproachVertexHandling() (lines 399-434)

- Configures special event handling for the approach polyline
- **Prevents the last vertex from being dragged** (maintains connection)
- Monitors POSITION_CHANGED events
- Forces last position back to grid start if modified
- Uses 10ms timeout to avoid recursive updates

##### updateApproachEndpoint() (lines 437-458)

- Updates the approach polyline endpoint when grid moves
- Called automatically during performGridUpdate()
- Maintains connection as grid parameters change
- Only updates if position actually changed (optimization)

##### forwardCustomApproachEvents() (lines 461-487)

- Forwards events from custom approach polyline to main event emitter
- Listens for POSITION_CHANGED events
- Emits events with custom approach metadata including position count
- Enables external components to track custom approach changes

##### cleanupCustomApproach() (lines 490-506)

- Removes the custom approach polyline from the map
- Resets stored start vertex to undefined
- Emits POSITION_CHANGED event with positionCount: 0
- Called when:
  - Custom approach is disabled
  - Mission is cancelled
  - New custom approach is created (replaces old)

### Editability Synchronization

The custom approach feature is fully synchronized with the grid's editability:

1. **When Grid is Editable**:

- Custom approach can be enabled
- Approach polyline vertices can be dragged (except last)
- New vertices can be added to approach path

2. **When Grid is Not Editable**:

- Custom approach toggle is disabled in UI
- Existing approach polyline becomes locked
- Cannot create new custom approach
- Warning logged if user attempts to enable

### Custom Approach Workflow

1. **Enable Custom Approach**: Toggle the "Custom Approach" switch in properties panel
2. **Click on Map**: Click anywhere on the map to set the approach start point
3. **Automatic Connection**: A polyline is created from click point to grid start
4. **Edit Path**:

- Drag vertices to adjust the approach path
- Add new vertices by dragging virtual vertices
- Last vertex remains locked to grid start

5. **Grid Updates**: When grid is moved or rotated, approach endpoint follows automatically
6. **Mission Compilation**: Use `getCompleteMissionPath()` to get combined waypoints

## Usage Flow

1. **Creation**: External component creates GridMissionPlanner with position
2. **Initial Display**: Polygon appears with default grid
3. **User Interaction**: User can:

- Drag polygon vertices to reshape boundary
- Adjust grid spacing via properties panel
- Adjust grid angle via properties panel
- **Enable custom approach mode and create approach path**

4. **Real-time Updates**: Any change triggers immediate grid regeneration
5. **Custom Approach** (optional):

- Enable custom approach toggle
- Click on map to set approach start
- Edit approach path as needed

6. **Completion**: User can complete or cancel mission

## Current Limitations

1. **Fixed Polygon Size**: Initial radius hardcoded to 25 meters
2. **Missing Altitude Support**: No altitude configuration implemented
3. **Typo in Property Name**: "girdMissionPolyline" should be "gridMissionPolyline"
4. **Limited Grid Lines Usage**: gridLines array exists but has limited visualization

## Completed Features

✅ **Custom Approach Path**: Users can now create custom approach paths to the grid
✅ **Editability Synchronization**: Grid and approach editability are fully synchronized
✅ **Dynamic Connection**: Approach endpoint automatically follows grid start position
✅ **Vertex Locking**: Last vertex of approach polyline stays connected to grid
✅ **Mission Path Compilation**: `getCompleteMissionPath()` returns combined waypoints
✅ **Event System**: Comprehensive event emitter system for component communication
✅ **Visual Markers**: Start and end markers for clear mission visualization

## Future Enhancements

1. Implement full grid line visualization within polygon
2. Add altitude configuration support for custom approach
3. Enhanced mission export with file formats (KML, CSV, etc.)
4. Support for multiple polygons
5. Entry point selection UI for grid corners
6. Camera trigger configuration
7. Fix typo: rename "girdMissionPolyline" to "gridMissionPolyline"
8. Add interactive marker dragging for custom start/end points
9. Support for custom marker icons based on mission type
10. Multiple approach paths support
11. Approach path templates/presets
12. Add completeMission() method implementation for mission finalization
