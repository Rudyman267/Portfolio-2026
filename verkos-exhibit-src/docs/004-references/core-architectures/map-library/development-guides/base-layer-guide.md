# Development Guide: Base Layer (Provider Primitives)

## Purpose

The “base layer” is the provider-primitive layer: points, polylines, polygons, labels, models, etc. It is the lowest level used by composites.

In the current codebase, base entities are exposed through **provider services** (not directly to clients).

Use this guide when you need to:

- change low-level entity behavior (e.g. how a base polyline updates in Cesium)
- add a new primitive type required by composites/features

## Where base-related code lives (today)

### Internal base entity contracts (interfaces)

- [`libs/shared/map/src/private/contracts/base-entities/`](../../../../libs/shared/map/src/private/contracts/base-entities/)

### Provider implementations (Cesium)

- [`libs/shared/map/src/private/map-providers/cesium/entities/`](../../../../libs/shared/map/src/private/map-providers/cesium/entities/)

### Base entity creation (through provider services)

Base entities are created via provider services and base entity manager interfaces:

- [`libs/shared/map/src/private/contracts/services/`](../../../../libs/shared/map/src/private/contracts/services/) (provider services contracts)
- [`libs/shared/map/src/private/map-providers/cesium/services/`](../../../../libs/shared/map/src/private/map-providers/cesium/services/) (implementation)

## Constraints

- Base entity implementations are provider-specific.
- Base entity APIs should not leak provider objects upward.
- Creation should remain centralized through provider services/base entity manager so composites don’t need to know how Cesium primitives are built.

## Lifecycle expectations

- Base entities must implement `destroy()` semantics that fully release provider resources and detach listeners.
- Composites rely on base `destroy()` to make `remove()` correct and complete.




