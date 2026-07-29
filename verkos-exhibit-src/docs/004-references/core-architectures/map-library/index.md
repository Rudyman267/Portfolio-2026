# Map Library (Module)

## Purpose

This module documents the **FlytBase Shared Map Library** implemented in [`libs/shared/map/`](../../../libs/shared/map/).

It is written for two audiences:

- **Consumers**: application teams integrating the library (e.g. [`apps/fleet/`](../../../apps/fleet/), [`apps/mission-planner/`](../../../apps/mission-planner/), [`apps/flyt-map/`](../../../apps/flyt-map/)).
- **Contributors**: engineers extending the library (adding features/entities, changing provider behavior, enforcing boundaries).

This documentation intentionally avoids repeating source code. When needed, we link to **source locations** to read the implementation directly.

## What this module covers

- **Architecture**: the current contracts-driven architecture (public/contracts, private/implementations, runtime wiring).
- **How to change the library safely**: where new code should go and why (public vs private; contracts vs implementation).
- **Complex feature docs**: only where behavior is non-trivial (missions).

## What this module does not cover

- Per-class / per-method “API reference” style docs.
- Full source listings or large code snippets.
- Docs that are redundant with TypeScript types and code navigation.

## Source of truth (code)

- **Library root**: [`libs/shared/map/`](../../../libs/shared/map/)
- **Public surface**: [`libs/shared/map/src/public/`](../../../libs/shared/map/src/public/)
  - Contracts (client-facing interfaces/types): [`libs/shared/map/src/public/contracts/`](../../../libs/shared/map/src/public/contracts/)
  - Public factory (re-exports runtime): [`libs/shared/map/src/public/core/factories/map.factory.ts`](../../../libs/shared/map/src/public/core/factories/map.factory.ts)
- **Runtime wiring** (the only place that bridges public + private): [`libs/shared/map/src/runtime/`](../../../libs/shared/map/src/runtime/)
  - Bootstrap and provider registration: [`libs/shared/map/src/runtime/bootstrap.ts`](../../../libs/shared/map/src/runtime/bootstrap.ts)
  - Map instance creation entry: [`libs/shared/map/src/runtime/map-instance.ts`](../../../libs/shared/map/src/runtime/map-instance.ts)
- **Private implementations**: [`libs/shared/map/src/private/`](../../../libs/shared/map/src/private/)
  - Provider implementations (Cesium): [`libs/shared/map/src/private/map-providers/`](../../../libs/shared/map/src/private/map-providers/)
  - Feature entities/managers (missions, drones, zones, etc.): [`libs/shared/map/src/private/feature-entities/`](../../../libs/shared/map/src/private/feature-entities/)
  - Composite entities: [`libs/shared/map/src/private/composite-entities/`](../../../libs/shared/map/src/private/composite-entities/)

## Current architecture (at a glance)

The library follows a **contracts-driven** dependency flow to avoid circular dependencies:

- **Clients** import only from the **public** package surface.
- **Public** depends on **public contracts** and re-exports a runtime factory.
- **Private** implements contracts (and uses private wiring contracts where needed).
- **Runtime** performs bootstrap and provider wiring (and is intentionally the only layer allowed to “know both sides”).

The current canonical architecture description is:
- [`architecture/detailed-architecture-guide.md`](./architecture/detailed-architecture-guide.md)

## Documents (new IA)

### Architecture

- [`architecture/overview.md`](./architecture/overview.md): high-level layering, responsibilities, and boundaries (no code).
- [`architecture/detailed-architecture.md`](./architecture/detailed-architecture.md): end-to-end flow (bootstrap → provider → managers → entities).
- [`architecture/entity-lifecycle.md`](./architecture/entity-lifecycle.md): creation/update/disposal semantics and where to hook changes.
- [`architecture/layer-boundaries.md`](./architecture/layer-boundaries.md): strict boundary rules + "what goes where".
- [`architecture/keyboard-control-architecture.md`](./architecture/keyboard-control-architecture.md): comprehensive design for keyboard control of base entities (WASD movement, focus management, continuous input).
- [`architecture/shared-keyboard-infrastructure-architecture.md`](./architecture/shared-keyboard-infrastructure-architecture.md): **[APPROVED DESIGN]** complete architecture for shared keyboard infrastructure, integration flows, event coordination, and implementation guide for unified keyboard event system across map library and applications.

### Development guides

- [`development-guides/public-vs-private.md`](./development-guides/public-vs-private.md)
- [`development-guides/base-layer-guide.md`](./development-guides/base-layer-guide.md)
- [`development-guides/composite-layer-guide.md`](./development-guides/composite-layer-guide.md)
- [`development-guides/feature-layer-guide.md`](./development-guides/feature-layer-guide.md)
- [`development-guides/provider-layer-guide.md`](./development-guides/provider-layer-guide.md)
- [`development-guides/adding-new-entities.md`](./development-guides/adding-new-entities.md)

### Feature docs (only complex)

- [`features/missions/`](./features/missions/index.md): mission-related behavior and architecture (linear/grid/shared)

### Integration

- [`integration/react-integration.md`](./integration/react-integration.md)
- [`integration/testing-strategies.md`](./integration/testing-strategies.md)

### Troubleshooting

- [`troubleshooting/common-issues.md`](./troubleshooting/common-issues.md)
- [`troubleshooting/debugging-guide.md`](./troubleshooting/debugging-guide.md)

