# Testing Strategy (Map Library)

## Purpose

This document defines the required testing workflow for any development in the shared map library ([`libs/shared/map/`](../../../../libs/shared/map/)).

**Core principle**: changes must be validated in an interface-driven way to ensure the map library remains **rigid**, **provider-safe**, and **not dependent on client-app-specific calls**.

## Non-goals

- Repeating repository-wide testing standards

Reference:

- [`docs/001-common/testing-standards/`](../../../../docs/001-common/testing-standards/)

## The required workflow (gated)

### Gate 1 — Visual validation in Flyt Map (mandatory)

Before writing/merging tests or integrating into client apps, validate the change in **Flyt Map**:

- App: [`apps/flyt-map/`](../../../../apps/flyt-map/)
- Why Flyt Map exists: [`apps/flyt-map/docs/flyt-map-guide.md`](../../../../apps/flyt-map/docs/flyt-map-guide.md)

Flyt Map is the **map library validation tool**. It is intentionally built to:

- create and manipulate entities across **Base**, **Composite**, and **Feature** layers
- expose UI controls for **public methods and parameters** that entities/managers expose
- validate behavior visually and interactively on a real Cesium-backed map

Key implementation anchors:

- Map initialization uses the shared map library: [`apps/flyt-map/src/app/MapContainer.tsx`](../../../../apps/flyt-map/src/app/MapContainer.tsx)
- Entity validation UI is organized by layer:
  - base: [`apps/flyt-map/src/entities/base/`](../../../../apps/flyt-map/src/entities/base/)
  - composite: [`apps/flyt-map/src/entities/composite/`](../../../../apps/flyt-map/src/entities/composite/)
  - feature: [`apps/flyt-map/src/entities/feature/`](../../../../apps/flyt-map/src/entities/feature/)

**Pass criteria (Gate 1)**:

- the behavior is correct visually (rendering, interactions, events, lifecycle)
- the change can be exercised through Flyt Map UI controls using the **entity/manager interfaces**
- no client-app-specific assumptions are required (no “works only in mission-planner” type coupling)

### Gate 2 — Unit tests / integration tests (required for non-trivial changes)

After Flyt Map visual validation passes:

- add **unit tests** for pure logic (math/geometry/state machines/conversions)
- add **integration tests** when the behavior spans boundaries (manager → entity → lifecycle, runtime wiring)

Guidance by change type:

- **Core logic / algorithms** (grid generation, bearing, conversions): unit tests in/near the relevant service/module
- **Stateful feature behavior** (mission planners): unit tests for state transitions + critical invariants
- **Lifecycle changes** (remove/destroy/dispose): integration tests to ensure cleanup cascades correctly
- **Runtime wiring** (bootstrap/registry/provider selection): integration tests around:
- bootstrap idempotency
  - provider registration / default selection
  - error cases (provider not found, no default provider)

Code areas commonly involved:

- runtime wiring:
- [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)
  - [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)
  - provider registry: [`libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts)
- provider implementation (Cesium):
  - [`libs/shared/map/src/private/map-providers/cesium/`](../../../../libs/shared/map/src/private/map-providers/cesium/)
- feature/composite implementations:
  - feature: [`libs/shared/map/src/private/feature-entities/`](../../../../libs/shared/map/src/private/feature-entities/)
  - composite: [`libs/shared/map/src/private/composite-entities/`](../../../../libs/shared/map/src/private/composite-entities/)

**Pass criteria (Gate 2)**:

- tests cover the new/changed behavior at the appropriate layer
- tests protect critical invariants (no regressions across layers)

### Gate 3 — Client app integration (last)

Only after Gate 1 and Gate 2:

- integrate into client apps and validate the real workflows.

Common client apps:

- [`apps/fleet/`](../../../../apps/fleet/)
- [`apps/mission-planner/`](../../../../apps/mission-planner/)
- [`apps/asset-management/`](../../../../apps/asset-management/)

**Pass criteria (Gate 3)**:

- client apps work without needing special “escape hatches” into private map code
- no new coupling introduced (clients should not need `@map/private/*`)

## Why this order matters

- **Flyt Map first** ensures changes are validated against **interfaces**, not against one client’s incidental usage patterns.
- **Tests second** ensure the validated behavior stays stable over time.
- **Client apps last** ensures integration remains clean and the library stays provider-agnostic and maintainable.
