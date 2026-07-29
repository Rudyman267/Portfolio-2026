# Development Guide: Composite Layer

## Purpose

Composite entities are reusable building blocks that combine multiple provider “base entities” into a higher-level object (e.g. a polyline with labels + vertices).

Use this guide when you need to:

- add/modify FB* entities (FBPolyline, FBMarker, FBCircle, FBPolygon, FBModel, …)
- understand what composites are allowed to depend on
- ensure removal/cleanup cascades properly

## Where composite code lives

- Implementations:
  - [`libs/shared/map/src/private/composite-entities/entities/`](../../../../libs/shared/map/src/private/composite-entities/entities/)
- Composite manager:
  - [`libs/shared/map/src/private/composite-entities/managers/composite-manager.ts`](../../../../libs/shared/map/src/private/composite-entities/managers/composite-manager.ts)

## Dependencies and constraints

Composite code:

- ✅ uses provider services (`IMapProviderServices`) to create base entities
- ✅ uses internal contracts (`@map/private/contracts`) for base/composite interfaces and styles
- ✅ should remain provider-agnostic (no direct Cesium imports)

Composite code should **not**:

- ❌ import Cesium types directly
- ❌ depend on feature entity implementations
- ❌ expose provider primitives to callers

## Lifecycle expectations

- Composite `remove()` must clean up every base entity it created.
- Composite entities should not require external callers to “clean up subparts”.

Reference example:

- `FBPolyline.remove()` destroys:
  - base polyline + labels + vertex points + distance labels
  - source: [`libs/shared/map/src/private/composite-entities/entities/fb-polyline.ts`](../../../../libs/shared/map/src/private/composite-entities/entities/fb-polyline.ts)

## Common change patterns

### Add a new composite entity

1. Define internal composite contracts if needed (typically under [`src/private/contracts/composite-entities/`](../../../../libs/shared/map/src/private/contracts/composite-entities/))
2. Implement the composite entity under [`src/private/composite-entities/entities/`](../../../../libs/shared/map/src/private/composite-entities/entities/)
3. Add a creation method in `CompositeManager` to standardize creation

### Extend an existing composite entity

Prefer:

- adding behavior internally while preserving the existing interface

Only add new methods if higher layers truly need them (and then update the relevant internal contract).




