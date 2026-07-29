# Missions: Shared Concepts

## Purpose

This document captures concepts shared across mission implementations (linear/grid), so feature docs can stay concise.

## Contracts vs implementations

- **Contracts** (what client apps depend on):
  - [`libs/shared/map/src/public/contracts/feature-entities/missions/`](../../../../../libs/shared/map/src/public/contracts/feature-entities/missions/)
- **Implementations** (where behavior lives):
  - [`libs/shared/map/src/private/feature-entities/missions/`](../../../../../libs/shared/map/src/private/feature-entities/missions/)

## Reference point / takeoff point

Most mission flows are anchored around a **reference/takeoff point**.

Common responsibilities:

- driving altitude conversions (when a mission stores “relative” altitudes)
- anchoring UI flows (“awaiting reference point” is a common initial state)

Where this shows up:

- Linear mission planner/view: [`libs/shared/map/src/private/feature-entities/missions/linear-mission/`](../../../../../libs/shared/map/src/private/feature-entities/missions/linear-mission/)
- Grid mission planner: [`libs/shared/map/src/private/feature-entities/missions/grid-mission/`](../../../../../libs/shared/map/src/private/feature-entities/missions/grid-mission/)

## Altitude semantics (high level)

Missions deal with multiple altitude interpretations. The library intentionally keeps altitude conversions inside the mission implementations.

Practical guidance:

- if you are adding/changing a mission altitude rule, start in the mission implementation layer ([`src/private/feature-entities/missions/**`](../../../../../libs/shared/map/src/private/feature-entities/missions/))
- do not push provider-specific altitude concepts into public contracts

## Eventing model

Mission entities emit events to allow client UIs to stay in sync without polling.

There are two event categories to keep straight:

- **Map-level events**: user interaction events (click/drag/hover) surfaced via `IFlytMap.onGlobalEvent(...)`.
- **Mission-level events**: mission planner/view events (state changes, waypoint selection changes, etc.).

Implementation note:

- Missions use a shared internal `EventService` in [`libs/shared/map/src/private/feature-entities/missions/shared/services/event-service.ts`](../../../../../libs/shared/map/src/private/feature-entities/missions/shared/services/event-service.ts)

## “Single active planner” constraint

Some mission flows intentionally enforce **only one active mission editor** at a time.

Example:

- Linear mission planning uses `MissionPlannerManager` which cancels an existing planning session before starting a new one.
  - Implementation: [`libs/shared/map/src/private/feature-entities/missions/linear-mission/managers/mission-planner-manager.ts`](../../../../../libs/shared/map/src/private/feature-entities/missions/linear-mission/managers/mission-planner-manager.ts)

## Reuse boundaries

- Mission implementations should use the **composite manager** (`ICompositeManager`) to create:
  - markers (reference points, waypoint markers)
  - polylines (paths)
  - polygons (grid boundaries)

They should not create provider base entities directly.




