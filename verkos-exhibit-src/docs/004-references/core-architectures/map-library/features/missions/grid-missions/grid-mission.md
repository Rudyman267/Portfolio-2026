# Missions: Grid Mission

## Purpose

Grid missions provide polygon-based planning where the system generates a “lawnmower/grid” path inside a boundary.

The grid mission planner is complex because it combines:

- interactive polygon editing
- grid generation algorithms
- multiple states for user-driven planning (including edit mode)
- event emission for UI synchronization

## Where to look in code

- Contracts:
  - [`libs/shared/map/src/public/contracts/feature-entities/missions/grid-mission/`](../../../../../libs/shared/map/src/public/contracts/feature-entities/missions/grid-mission/)
- Implementations:
  - [`libs/shared/map/src/private/feature-entities/missions/grid-mission/`](../../../../../libs/shared/map/src/private/feature-entities/missions/grid-mission/)
  - Key entry points:
    - planner: `entities/grid-mission-planner.ts`
    - helper algorithm: `services/grid-helper.service.ts`
    - manager: `managers/grid-mission-manager.ts`

## Planner states (conceptual)

The planner uses a “two-click” setup flow in its interactive mode:

- awaiting first click (start)
- awaiting second click (end / polygon completion)
- ready (polygon exists; grid can be generated and updated)

Additionally, there is an **edit mode** path:

- if initial polygon vertices are provided, the planner skips the two-click flow and initializes directly to “ready”.

## Core objects the planner owns

At runtime, the grid mission planner coordinates composite entities such as:

- boundary polygon (editable)
- polyline(s) representing the generated grid path
- optional takeoff/reference point marker and a connecting polyline
- start/end markers (depending on configuration)

These are created via `ICompositeManager` and are removed/updated by the planner as state changes.

## Grid generation (where complexity lives)

The “grid” (transects, ordering, entry point selection, spacing/angle) is computed by `GridHelper`:

- [`libs/shared/map/src/private/feature-entities/missions/grid-mission/services/grid-helper.service.ts`](../../../../../libs/shared/map/src/private/feature-entities/missions/grid-mission/services/grid-helper.service.ts)

If you change:

- grid spacing semantics
- grid angle semantics
- entry point ordering rules
- polygon-to-transects conversion

…start in `GridHelper`.

## Eventing model

Grid mission planner emits mission-level events so client UIs can reflect changes without polling.

Implementation uses the shared `EventService` pattern used by mission features:

- [`libs/shared/map/src/private/feature-entities/missions/shared/services/event-service.ts`](../../../../../libs/shared/map/src/private/feature-entities/missions/shared/services/event-service.ts)

## Change guide (where to modify behavior)

- **Two-click flow / edit mode initialization**:
  - `entities/grid-mission-planner.ts`
- **Polygon editing and automatic re-generation**:
  - `entities/grid-mission-planner.ts` (polygon event handler wiring)
- **Algorithmic grid output**:
  - `services/grid-helper.service.ts`
- **Visual styling / asset paths**:
  - `missions/shared/constants/` (e.g., mission planner asset paths and styles)




