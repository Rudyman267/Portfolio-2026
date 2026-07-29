# Next Waypoint Approach Settings - Behavior Guide

## Overview

This document explains how Next Waypoint Approach Settings work in the Linear Mission Planner. These settings allow you to control how each waypoint determines its orientation (the direction the drone faces) during mission planning.

## Basic Concepts

### Mission Route Settings

Every mission has a **Route Setting** that applies to all waypoints by default:

- **Along Route**: Drone faces the direction it's traveling
- **Lock Yaw Axis**: Drone maintains the same direction throughout the mission
- **Manual**: Drone maintains the same direction throughout the mission (same as Lock Yaw Axis)

### Waypoint Approach Settings

Each waypoint can either:

1. **Follow Route**: Use the mission's Route Setting (default behavior)
2. **Custom Approach**: Override the mission setting for this specific waypoint

## Custom Approach Modes

When a waypoint uses Custom Approach, you can choose from four modes:

### 1. Along Route

- Waypoint faces the direction it's traveling to the next waypoint
- Similar to mission Route Setting "Along Route"

### 2. Lock Yaw Axis

- Waypoint faces the same direction as the mission reference point
- Similar to mission Route Setting "Lock Yaw Axis"

### 3. Manual

- Waypoint faces the same direction as the mission reference point
- Similar to mission Route Setting "Manual"

### 4. Auto Adjust

- **Current waypoint**: Always faces North (0°)
- **Next waypoint**: Behavior depends on mission Route Setting (see scenarios below)

## Behavior Scenarios

### Scenario 1: Mission Route = Along Route + Waypoint Auto Adjust

**Setup**:

- Mission Route Setting: Along Route
- Waypoint 2 has Custom Approach: Auto Adjust

**Result**:

- Waypoint 1: Faces direction from Waypoint 1 → Waypoint 2 (normal behavior)
- **Waypoint 2: Faces North (0°)** (Auto Adjust behavior)
- **Waypoint 3: Faces direction from Waypoint 3 → Waypoint 4** (modified behavior)
- Waypoint 4: Faces direction from Waypoint 3 → Waypoint 4 (normal behavior)

**Key Point**: Waypoint 3 gets a special calculation - it uses its own position to the next waypoint instead of the usual previous-to-current calculation.

---

### Scenario 2: Mission Route = Lock Yaw Axis + Waypoint Auto Adjust

**Setup**:

- Mission Route Setting: Lock Yaw Axis
- Waypoint 2 has Custom Approach: Auto Adjust

**Result**:

- Waypoint 1: Faces reference direction (normal behavior)
- **Waypoint 2: Faces North (0°)** (Auto Adjust behavior)
- **Waypoint 3: Faces North (0°)** (inherits from Auto Adjust)
- **Waypoint 4: Faces North (0°)** (continues inheritance)

**Key Point**: Auto Adjust creates a "chain effect" - all following waypoints also face North until overridden.

---

### Scenario 3: Mission Route = Lock Yaw Axis + Waypoint Along Route

**Setup**:

- Mission Route Setting: Lock Yaw Axis
- Waypoint 2 has Custom Approach: Along Route

**Result**:

- Waypoint 1: Faces reference direction (normal behavior)
- Waypoint 2: Faces reference direction (current waypoint still follows mission setting)
- **Waypoint 3: Faces direction from Waypoint 2 → Waypoint 3** (special one-time effect)
- Waypoint 4: Faces reference direction (returns to normal Lock Yaw Axis behavior)

**Key Point**: The Along Route approach only affects the immediate next waypoint, then behavior returns to normal.

---

### Scenario 4: Mission Route = Along Route + Waypoint Lock Yaw Axis

**Setup**:

- Mission Route Setting: Along Route
- Waypoint 2 has Custom Approach: Lock Yaw Axis

**Result**:

- Waypoint 1: Faces direction from Waypoint 1 → Waypoint 2 (normal behavior)
- **Waypoint 2: Faces reference direction** (Lock Yaw Axis behavior)
- **Waypoint 3: Faces reference direction** (inherits from previous waypoint)
- **Waypoint 4: Faces reference direction** (continues inheritance)

**Key Point**: Lock Yaw Axis creates inheritance - following waypoints maintain the same direction.

## Edge Cases

### When Affected Waypoint is Last

If the waypoint affected by Auto Adjust is the last waypoint in the mission:

**Example**: 3 waypoints total, Waypoint 2 has Auto Adjust

- Waypoint 1: Normal behavior
- Waypoint 2: Faces North (Auto Adjust)
- **Waypoint 3: Faces North** (no next waypoint available for direction calculation)

**Note**: Waypoint 3 faces North only because there's no Waypoint 4 to calculate direction to, not because of any special rule.

## Quick Reference Table

| Mission Route | Waypoint Approach | Current Waypoint Faces | Next Waypoint Effect     |
| ------------- | ----------------- | ---------------------- | ------------------------ |
| Along Route   | Follow Route      | Travel direction       | Normal behavior          |
| Along Route   | Auto Adjust       | **North (0°)**         | **Modified calculation** |
| Along Route   | Lock Yaw Axis     | Reference direction    | **Inheritance chain**    |
| Lock Yaw Axis | Follow Route      | Reference direction    | Normal behavior          |
| Lock Yaw Axis | Auto Adjust       | **North (0°)**         | **Inheritance chain**    |
| Lock Yaw Axis | Along Route       | Reference direction    | **One waypoint effect**  |

## Key Takeaways

1. **Auto Adjust** always makes the current waypoint face North
2. **Auto Adjust effects** depend on the mission Route Setting:
   - With Along Route: Next waypoint gets modified calculation
   - With Lock Yaw Axis: Next waypoint inherits North direction
3. **Lock Yaw Axis approach** creates inheritance chains
4. **Along Route approach** with Lock Yaw Axis mission only affects one waypoint
5. **Edge cases** occur when there's no next waypoint for calculations

## Need Help?

For technical implementation details, refer to the implementation documentation. For questions about mission planning workflow, consult your mission planning team.
