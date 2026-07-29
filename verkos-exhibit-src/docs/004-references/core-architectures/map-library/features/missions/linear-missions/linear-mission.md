# Missions: Linear Mission

## Purpose

Linear missions cover two related but distinct needs:

- **Planner (interactive)**: create/edit a mission (waypoints, selection/editing, route settings)
- **View (read-only)**: display a completed mission (selection/visibility, no editing)

## Where to look in code

- Contracts:
  - [`libs/shared/map/src/public/contracts/feature-entities/missions/linear-mission/`](../../../../../libs/shared/map/src/public/contracts/feature-entities/missions/linear-mission/)
- Implementations:
  - [`libs/shared/map/src/private/feature-entities/missions/linear-mission/`](../../../../../libs/shared/map/src/private/feature-entities/missions/linear-mission/)
  - Key entry points:
    - manager: `managers/mission-planner-manager.ts`
    - interactive planner: `entities/linear-mission-planner.ts`
    - read-only view: `entities/linear-mission.ts`
    - supporting services: `services/`

## Key invariants (high signal)

- **Only one active planner** at a time:
  - creating/editing a new mission cancels the current mission being edited
  - enforced in `MissionPlannerManager`
- **Planner is state-driven**:
  - there is an initial “awaiting reference point” phase
  - once the reference point exists, waypoint planning is enabled
- **Waypoint selection/editing is exclusive**:
  - at most one waypoint is selected/edited at a time
  - adding/removing waypoints updates selection deterministically (avoid ambiguous UI state)

## Planner: responsibilities

The planner owns:

- reference point placement and updates
- waypoint list management (add/remove/reorder)
- waypoint editing state and interaction behavior
- mission-level settings that apply across waypoints (and the “follow route” override model)
- event emission so UIs can reflect changes

Implementation detail:

- planner uses internal services (`MarkerService`, `StateService`, `OrientationComputationService`) to keep responsibilities separated.
  - directory: [`libs/shared/map/src/private/feature-entities/missions/linear-mission/services/`](../../../../../libs/shared/map/src/private/feature-entities/missions/linear-mission/services/)

## View: responsibilities

The read-only view owns:

- rendering reference point + waypoints + path
- selection toggling (visual change only)
- visibility toggling (show/hide)

It should not:

- modify mission plan data
- expose editing behavior

## Route settings and per-waypoint overrides (why it’s complex)

Linear missions support:

- a mission-level “route setting” model
- per-waypoint “follow route” toggles and approach settings

This creates a dependency chain:

- changing route settings may affect derived behavior for multiple waypoints
- changing a single waypoint may require recomputing a derived orientation for “approach to next waypoint”

Public contract reference (types and enums live here):

- [`libs/shared/map/src/public/contracts/feature-entities/missions/linear-mission/entities/linear-mission-planner.interface.ts`](../../../../../libs/shared/map/src/public/contracts/feature-entities/missions/linear-mission/entities/linear-mission-planner.interface.ts)

## Change guide (where to modify behavior)

- **Selection/edit state bugs**:
  - start with the planner state service: `services/state-service.ts`
- **Yaw/orientation behavior**:
  - start with orientation computation: `services/orientation-computation.service.ts`
- **Visual elements (markers/polylines) behavior**:
  - start with marker service: `services/marker-service.ts`
- **Lifecycle/cleanup issues (leftover markers/paths)**:
  - check entity `remove()` and manager cancellation paths




