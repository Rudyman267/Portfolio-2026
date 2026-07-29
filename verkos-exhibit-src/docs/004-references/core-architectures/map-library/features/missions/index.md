# Missions (Feature Docs)

## Purpose

Missions are one of the few areas of the map library with **complex, stateful behavior**, so we document them explicitly.

This section describes **behavior, invariants, and change points**—not class-by-class API listings.

## Documents

- [`shared-concepts.md`](./shared-concepts.md): shared concepts across mission types (altitudes, events, takeoff/reference point)
- [`linear-mission.md`](./linear-missions//linear-mission.md): linear mission view vs planner, state machine, waypoint behavior
- [`grid-mission.md`](./grid-missions//grid-mission.md): polygon-based grid planning, two-click flow, waypoint generation

## Source of truth (code)

- Public contracts:
  - [`libs/shared/map/src/public/contracts/feature-entities/missions/`](../../../../../libs/shared/map/src/public/contracts/feature-entities/missions/)
- Private implementations:
  - [`libs/shared/map/src/private/feature-entities/missions/`](../../../../../libs/shared/map/src/private/feature-entities/missions/)




