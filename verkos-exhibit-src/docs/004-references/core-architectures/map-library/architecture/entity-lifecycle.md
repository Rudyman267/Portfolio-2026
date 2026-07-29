# Map Library Architecture: Entity & Map Lifecycle

## Purpose

This document defines the lifecycle expectations for:

- a **map instance** (`IFlytMap`)
- **entities** created through managers (feature → composite → base)

Use this when:

- debugging memory leaks / “ghost entities”
- adding a new entity type and deciding what owns cleanup
- deciding whether a change belongs in base/composite/feature

## Non-goals

- A full catalog of every entity type
- Documenting every method on every interface

## Map instance lifecycle (client perspective)

### 1) Create

- Client calls `createMapInstanceWithProvider(...)` via the public factory.
- A provider instance is returned immediately (not yet initialized).

Key code:

- Runtime creation: [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)

### 2) Initialize

- Client must call `await map.initialize()` before using managers.
- Provider initialization is where the provider’s services and managers are created.

Key code:

- Cesium provider: [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`initialize`)

### 3) Use (steady state)

- Client obtains managers via the `IFlytMap` getters and performs operations.
- Entities are updated through entity methods (not through “update-by-id” manager APIs).

Key contract:

- [`libs/shared/map/src/public/contracts/flyt-map.interface.ts`](../../../../libs/shared/map/src/public/contracts/flyt-map.interface.ts)

### 4) Dispose

- Client calls `map.dispose()` when the map is no longer needed.
- Provider is responsible for cleanup of:
  - Cesium viewer and related resources
  - events manager
  - long-lived services
  - any remaining internal state

Key code:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`dispose`)

## Entity lifecycle (library perspective)

The library uses a layered entity model:

- **Feature entities** (domain objects): missions, drones, zones, annotations, assets, …
- **Composite entities**: FBPolyline/FBMarker/FBPolygon/FBModel/…
- **Base entities**: provider primitives (Cesium entities wrapped in base interfaces)

### Creation ownership (who creates what)

| Layer | Created by | Depends on |
|------|------------|------------|
| Feature | feature managers / feature entity constructors | composite manager |
| Composite | composite manager / composite constructors | provider services (base entity manager + map services) |
| Base | base entity manager (provider services) | provider implementation (Cesium) |

Reality in code (examples to follow in your editor):

- Composite creates base entities via provider services:
  - [`libs/shared/map/src/private/composite-entities/entities/fb-polyline.ts`](../../../../libs/shared/map/src/private/composite-entities/entities/fb-polyline.ts)
- Feature entities create composite entities via `ICompositeManager`:
  - [`libs/shared/map/src/private/feature-entities/drones/entities/drone-model.ts`](../../../../libs/shared/map/src/private/feature-entities/drones/entities/drone-model.ts)
  - [`libs/shared/map/src/private/feature-entities/missions/linear-mission/entities/linear-mission.ts`](../../../../libs/shared/map/src/private/feature-entities/missions/linear-mission/entities/linear-mission.ts)

### Update ownership (who updates what)

Rule of thumb:

- Updates should happen by calling methods on the entity instance you already have.
- Changes cascade downward:
  - feature → composite → base → provider primitives

Example pattern:

- feature entity updates a composite model/trace
  - see `DroneModel.updatePosition(...)` in [`src/private/feature-entities/drones/entities/drone-model.ts`](../../../../libs/shared/map/src/private/feature-entities/drones/entities/drone-model.ts)

### Removal / cleanup ownership (who cleans up what)

Key invariant:

- Removal cascades downward and should not require the caller to know internals.

Concrete pattern we rely on:

- **Feature entities** expose a `remove()`-style method and use it to clean up their composites.
- **Composite entities** expose a `remove()` method and use it to `destroy()` their base entities.
- **Base entities** expose a `destroy()` method that removes provider primitives (Cesium entities) and detaches listeners.

Example (composite cleanup):

- `FBPolyline.remove()` destroys:
  - the base polyline
  - labels
  - vertex points / virtual points
  - distance labels

Source:

- [`libs/shared/map/src/private/composite-entities/entities/fb-polyline.ts`](../../../../libs/shared/map/src/private/composite-entities/entities/fb-polyline.ts) (`remove`)

Example (feature cleanup):

- `DroneModel.remove()` removes:
  - the composite model
  - the composite trace polyline

Source:

- [`libs/shared/map/src/private/feature-entities/drones/entities/drone-model.ts`](../../../../libs/shared/map/src/private/feature-entities/drones/entities/drone-model.ts) (`remove`)

## Lifecycle design constraints

### Avoid “double ownership”

If a feature entity owns a composite entity, don’t also keep a second registry elsewhere that tries to delete it independently.

### Prefer explicit cleanup

Wherever the library exposes a `remove()`/`destroy()` method, callers should use it rather than relying on garbage collection.

### Keep async timing explicit

Some composite entities use deferred initialization for editable shapes (e.g. delayed creation of vertex points).

If you change that behavior, update:

- the composite entity implementation
- any feature entities that assume immediate availability

## Related documents

- [`detailed-architecture.md`](./detailed-architecture.md) (where objects are created and wired)
- [`layer-boundaries.md`](./layer-boundaries.md) (where code belongs)




