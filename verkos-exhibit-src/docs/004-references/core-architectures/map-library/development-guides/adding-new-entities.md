# Development Guide: Adding a New Entity

## Purpose

This is a checklist for adding a new entity type to the map library while keeping boundaries intact.

## Step 0: Choose the right layer

- **Base entity**: a new primitive needed by composites (provider-specific, lowest level)
- **Composite entity**: reusable building block composed of base entities
- **Feature entity**: domain behavior composed of composite entities (what most clients consume)

If the entity is simple and only used within one feature, prefer a **feature entity** (avoid growing composites unnecessarily).

## Step 1: Define the contract (only if needed)

If client apps need to interact with the new entity:

- add/extend a contract in [`libs/shared/map/src/public/contracts/feature-entities/`](../../../../libs/shared/map/src/public/contracts/feature-entities/)

If it is internal-only:

- define it in [`libs/shared/map/src/private/contracts/`](../../../../libs/shared/map/src/private/contracts/) as needed

## Step 2: Implement the entity

### Feature entity

- implement under [`libs/shared/map/src/private/feature-entities/`](../../../../libs/shared/map/src/private/feature-entities/)
- use `ICompositeManager` to create composites
- implement cleanup via `remove()`

### Composite entity

- implement under [`libs/shared/map/src/private/composite-entities/`](../../../../libs/shared/map/src/private/composite-entities/)
- accept `IMapProviderServices` in the constructor
- create base entities through provider services
- implement cleanup via `remove()` that destroys all base entities it created

### Base entity

- define interface under [`libs/shared/map/src/private/contracts/base-entities/`](../../../../libs/shared/map/src/private/contracts/base-entities/)
- implement provider version under `libs/shared/map/src/private/map-providers/<provider>/entities/`
- ensure `destroy()` is correct and complete

## Step 3: Wire it into the system

- If it is a **new manager**:
  - create it under [`src/private/feature-entities/**/managers/`](../../../../libs/shared/map/src/private/feature-entities/managers/)
  - expose it via `IFlytMap` (contract) **only if clients need it**
  - instantiate it during provider `initialize()` (Cesium: [`src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts))

## Step 4: Testing (minimum expectations)

- Unit tests for non-trivial behavior (especially missions, geometry, or lifecycle cleanup)
- Integration tests when cross-layer wiring is involved (provider → manager → entity)

## Step 5: Documentation (only if complex)

Document only if:

- the entity has non-obvious behavior (state machines, constraints, tricky lifecycle)
- contributors routinely need context beyond reading the code

If documented, place it under:

- `docs/002-modules/map-library/features/<feature>/`




