# Development Guide: Feature Layer

## Purpose

Feature entities represent **domain concepts** (missions, drones, zones, annotations, assets, …). They coordinate composites into user-meaningful behavior.

Use this guide when you need to:

- change mission planning behavior
- change drone visualization behavior
- add a new domain feature manager/entity

## Where feature code lives

### Public contracts (what clients call)

- [`libs/shared/map/src/public/contracts/feature-entities/`](../../../../libs/shared/map/src/public/contracts/feature-entities/)

### Private implementations

- [`libs/shared/map/src/private/feature-entities/`](../../../../libs/shared/map/src/private/feature-entities/)

Example: mission planning implementation

- [`libs/shared/map/src/private/feature-entities/missions/`](../../../../libs/shared/map/src/private/feature-entities/missions/)

## Dependencies and constraints

Feature implementations:

- ✅ use composite manager (`ICompositeManager`) to create composites
- ✅ implement public contracts (so client code stays stable)
- ✅ keep provider details hidden (no Cesium imports)

Feature code should not:

- ❌ create provider base entities directly (go through composites/provider services)
- ❌ expose composite/base internals unless absolutely required

## Lifecycle expectations

- Feature entities must own the composites they create.
- Feature `remove()` should cascade: remove composites, which remove base entities.

Reference example:

- `MissionPlannerManager.removePlottedLinearMissionView(...)` removes a plotted mission by calling `mission.remove()`
  - [`libs/shared/map/src/private/feature-entities/missions/linear-mission/managers/mission-planner-manager.ts`](../../../../libs/shared/map/src/private/feature-entities/missions/linear-mission/managers/mission-planner-manager.ts)

## When to write feature documentation

Write feature docs only when behavior is non-trivial (missions are the canonical example).

For simple feature entities (e.g. straightforward markers), prefer code + types over prose docs.




