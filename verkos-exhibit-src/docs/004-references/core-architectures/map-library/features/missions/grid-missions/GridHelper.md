# GridHelper Service Documentation

## Overview

The GridHelper service is a sophisticated mathematical engine that generates waypoints for grid-based flight patterns. It handles all geometric calculations, coordinate transformations, and path optimizations required for creating efficient aerial survey missions.

## Purpose

This service encapsulates the complex mathematics involved in:

- Converting between coordinate systems
- Generating parallel flight lines
- Finding polygon intersections
- Creating optimized flight patterns
- Managing entry/exit points

## Core Algorithm

The service implements a comprehensive grid generation algorithm that:

1. Transforms geographic coordinates to a planar system
2. Generates parallel transect lines
3. Clips lines to polygon boundaries
4. Optimizes the flight pattern
5. Converts back to geographic coordinates

## Data Structures

### WaypointFE Interface (lines 4-13)

Represents a flight waypoint with:

- **id**: Unique identifier (UUID)
- **lat/lng**: Geographic coordinates
- **alt**: Optional altitude value
- **altDefault**: Flag for default altitude usage
- **speedDefault**: Flag for default speed usage
- **waypointTurnTypeDefault**: Flag for default turn behavior
- **actions**: Array for future action implementations

## Class Properties

### Configuration Properties

#### Grid Parameters

- **\_spacing** (line 35): Private storage for grid line spacing
- **\_angle** (line 36): Private storage for grid rotation angle
- **gridSpacing** (lines 38-44): Getter/setter for spacing value
- **gridAngle** (lines 46-52): Getter/setter for angle value

#### Entry Point Configuration

- **\_startPoint** (line 58): Entry corner selection (0-3)
- **startPoint** (lines 60-66): Getter/setter for entry point

### Working Data Arrays

#### Coordinate Arrays

- **polypath** (line 32): Input polygon vertices in IPosition format
- **polyned** (line 29): Polygon vertices in NED coordinates
- **nedWaypoints** (line 54): Generated waypoints in NED coordinates
- **geoWaypoints** (line 56): Waypoints in geographic coordinates
- **waypoints** (line 55): Final WaypointFE array for output

#### Geometric Processing

- **transect_points** (line 27): Raw transect line segments
- **ordered_transect_lines** (line 24): Organized transect data
- **result_lines** (line 28): Direction-adjusted line segments
- **intersect_lines** (line 30): Lines clipped to polygon
- **transect_lines** (line 31): Final transect segments with camera points

### Mathematical Constants (lines 16-19)

- **M_PI**: Pi constant (3.1415926535)
- **M_DEG_TO_RAD**: Degree to radian conversion factor
- **M_RAD_TO_DEG**: Radian to degree conversion factor
- **CONSTANTS_RADIUS_OF_EARTH**: Earth's radius in meters (6,371,000)

## Main Entry Point

### generateWaypoints() (lines 502-613)

The primary method that orchestrates the entire waypoint generation process:

#### Input Validation (lines 503-511)

- Verifies polypath exists and contains vertices
- Checks gridSpacing is defined
- Returns empty array if prerequisites not met

#### Polygon Preparation (lines 513-520)

- Converts IPosition array to lat/lng format
- Ensures polygon closure (first point equals last)
- Prepares data for processing

#### Coordinate Transformation (lines 527-535)

- Converts all vertices to NED using geotoned()
- Uses first vertex as origin point
- Creates local planar coordinate system

#### Bounding Box Calculation (lines 537-549)

- Finds minimum/maximum X and Y values
- Calculates center point of polygon
- Determines working area dimensions

#### Grid Generation (lines 554-576)

- Creates parallel lines across bounding box
- Spaces lines according to gridSpacing parameter
- Extends lines beyond polygon for complete coverage
- Applies rotation based on gridAngle

#### Processing Pipeline (lines 578-612)

1. Finds line-polygon intersections
2. Adjusts line directions for consistency
3. Creates transect segments
4. Builds complete path
5. Converts to geographic coordinates
6. Generates final waypoints

## Coordinate Transformation Methods

### geotoned() (lines 225-256)

Converts geographic to North-East-Down coordinates:

#### Process:

1. Converts lat/lng to radians
2. Applies spherical trigonometry
3. Calculates arc distance
4. Projects to planar coordinates
5. Returns X,Y in meters from origin

#### Mathematical Basis:

- Uses haversine formula for spherical distance
- Applies azimuthal projection for planar mapping
- Maintains accuracy for survey-scale areas

### nedtogeo() (lines 258-287)

Inverse transformation from NED to geographic:

#### Process:

1. Normalizes coordinates by Earth radius
2. Calculates angular displacement
3. Applies inverse spherical trigonometry
4. Converts radians back to degrees
5. Returns latitude/longitude

## Line Generation and Processing

### Grid Line Creation

#### Initial Line Generation (lines 557-576)

- Starts from left edge of bounding box
- Creates vertical lines at spacing intervals
- Extends lines full height of bounding box
- Continues until right edge reached

#### rotate() (lines 326-349)

Applies rotation to line endpoints:

- Converts angle to radians with sign reversal
- Calculates point relative to center
- Applies 2D rotation matrix
- Returns rotated coordinates

### Intersection Calculations

#### get_intersect_lines() (lines 403-431)

Main intersection processor:

1. Iterates through each transect line
2. Finds all polygon intersections
3. Keeps furthest apart intersection pairs
4. Stores valid line segments

#### find_intersect_points() (lines 351-368)

Finds all intersections for a single line:

- Tests line against each polygon edge
- Collects all intersection points
- Handles polygon closure

#### get_line_intersects() (lines 370-402)

Mathematical line-line intersection:

- Uses parametric line equations
- Checks for parallel lines
- Validates intersection within segments
- Returns exact intersection point

## Path Optimization

### Direction Management

#### adjust_line_direction() (lines 442-473)

Ensures consistent transect directions:

1. Calculates angle of first line
2. Compares subsequent line angles
3. Reverses lines if angle difference > 1 radian
4. Creates uniform flight direction

### Snake Pattern Creation

#### create_transects() (lines 143-223)

Generates efficient back-and-forth pattern:

1. **Line Alternation** (lines 149-153):

   - Odd lines: reverse start/end points
   - Creates snake/boustrophedon pattern
   - Minimizes travel between transects

2. **Camera Points** (lines 194, 200):

   - Adds camera trigger positions
   - Marks as is_camera = true
   - Currently placeholders for future use

3. **Lead-in/Overshoot** (lines 180-220):
   - Adds approach distance before line start
   - Adds overrun distance after line end
   - Currently unused (values not set)

### Entry Point Optimization

#### adjustTransectsToEntryPointLocation() (lines 68-98)

Optimizes pattern based on starting corner:

**Entry Points:**

- 0: Bottom-left corner
- 1: Bottom-right corner
- 2: Top-right corner (default)
- 3: Top-left corner

**Adjustments:**

- Reverses point order within transects
- Reverses transect sequence
- Minimizes initial travel distance

#### reverseTransectOrder() (lines 101-107)

Reverses the sequence of transects:

- Last transect becomes first
- Maintains internal point order
- Used for entry point optimization

#### reverseInternalTransectPoints() (lines 110-119)

Reverses points within each transect:

- End point becomes start point
- Maintains transect sequence
- Changes flight direction

## Utility Methods

### Angle Clamping

#### clampGridAngle90() (lines 432-440)

Restricts angle to valid range:

- Limits to -90° to 90°
- Prevents pattern reversal
- Adjusts by ±180° if outside range
- Maintains intuitive behavior

### Path Assembly

#### create_path() (lines 475-482)

Concatenates all transect points:

- Flattens 2D array of transects
- Creates single path array
- Maintains sequential order

#### convert_path_to_geo() (lines 288-310)

Transforms NED path to geographic:

- Uses polygon origin as reference
- Applies nedtogeo() to each point
- Preserves camera flags

### Waypoint Generation

#### plot_waypoints() (lines 312-324)

Filters path for plottable points:

- Removes camera trigger points
- Creates clean waypoint list
- Prepares for visualization

#### create_mission() (lines 484-500)

Generates final waypoint objects:

- Creates WaypointFE instances
- Assigns unique IDs
- Sets default flags
- Filters camera points

## Mathematical Foundation

### Coordinate System

- **NED (North-East-Down)**: Local tangent plane coordinate system
- **Origin**: First polygon vertex
- **Units**: Meters from origin
- **Orientation**: North = positive X, East = positive Y

### Geometric Operations

- **Line-Line Intersection**: Parametric equation solution
- **Point Rotation**: 2D transformation matrix
- **Polygon Clipping**: Intersection with boundary edges

### Optimization Techniques

- **Snake Pattern**: Alternating directions minimize travel
- **Entry Point Selection**: Start from nearest corner
- **Direction Consistency**: Uniform angles reduce turns

## Current Limitations

1. **Fixed Parameters**:

   - Overshoot/lead-in values not configurable
   - Camera spacing hardcoded

2. **Single Polygon**:

   - No support for multiple areas
   - No hole handling

3. **2D Only**:

   - No terrain following
   - Fixed altitude assumption

4. **Entry Points**:
   - Limited to 4 corners
   - No custom entry positions

## Performance Considerations

### Optimizations

- Single-pass coordinate transformation
- Pre-calculated bounding box
- Early validation returns
- Efficient intersection testing

### Complexity

- O(n\*m) for intersections (n = transects, m = polygon edges)
- O(n) for coordinate transformations
- O(n log n) potential for optimized intersection algorithms

## Integration Notes

### Used By

- GridMissionPlanner class for waypoint generation
- Called via performGridUpdate() method

### Dependencies

- IPosition interface for coordinate data
- UUID for waypoint identification

### Configuration

- Grid spacing: Set via gridSpacing property
- Grid angle: Set via gridAngle property
- Entry point: Set via startPoint property (not currently exposed)

## Future Enhancement Opportunities

1. **Configurable Parameters**:

   - Expose overshoot/lead-in distances
   - Variable camera trigger spacing
   - Custom altitude profiles

2. **Advanced Patterns**:

   - Spiral patterns
   - Adaptive spacing
   - Terrain following

3. **Multi-Polygon Support**:

   - Handle multiple areas
   - Support exclusion zones
   - Optimize transitions between areas

4. **Performance Improvements**:
   - Spatial indexing for intersections
   - Parallel processing for large grids
   - Caching for repeated calculations
