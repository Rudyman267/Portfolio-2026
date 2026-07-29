# Debugging Guide

## Purpose

This document provides a step-by-step debugging approach for issues in:

- runtime wiring (bootstrap/provider registry)
- provider initialization (Cesium)
- manager/entity lifecycle

## Step 1: Confirm you are importing from the right place

Client apps should import from:

- `@libs/shared/map` / `@map/public`

They should not import from:

- `@map/private`

## Step 2: Confirm lifecycle order

Required order:

1. create instance via `createMapInstanceWithProvider(...)`
2. `await instance.initialize()`
3. use managers/entities
4. `instance.dispose()` on unmount

If manager getters throw, you likely skipped step 2.

## Step 3: Debug provider registry issues

Provider registry problems typically manifest as:

- “provider not registered”
- “no default provider”

Key code:

- runtime bootstrap: [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)
- runtime creation: [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)
- registry: [`libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts)

What to check:

- `bootstrapMapLibrary()` returns success
- Cesium provider is registered and default is set (in typical flows)

If you are in tests:

- calling `resetBootstrap()` clears the registry and requires re-bootstrap

## Step 4: Debug provider initialization (Cesium)

Provider initialize is the orchestration point:

- Cesium map service creation
- events manager creation
- composite manager creation
- feature manager creation

Key code:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`initialize`)
- [`libs/shared/map/src/private/map-providers/cesium/services/cesium-map-service.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/services/cesium-map-service.ts)

If the viewer is created but interaction is broken:

- inspect events manager:
  - [`libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts)

## Step 5: Debug render issues

Use the public render error hook:

- `IFlytMap.onRenderError(listener)`

This is implemented through the provider’s events manager and is a better first step than relying on console logs scattered across code.

Key code:

- contract: [`libs/shared/map/src/public/contracts/flyt-map.interface.ts`](../../../../libs/shared/map/src/public/contracts/flyt-map.interface.ts)
- implementation:
  - [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts)
  - [`libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts)

## Step 6: Debug lifecycle leaks (entities remain after leaving)

Use the cascade rule:

- feature `remove()` removes composites
- composite `remove()` destroys base entities
- base `destroy()` releases provider primitives and listeners

Start at:

- [`docs/002-modules/map-library/architecture/entity-lifecycle.md`](../architecture/entity-lifecycle.md)

Practical checks:

- confirm your React component unmount calls `dispose()`
- confirm any mission/drone/zone entities you create are removed when they should be

## Entity-specific debugging (start at feature layer)

If the issue is specific to an entity/feature behavior (not bootstrap/provider wiring), follow:

- [`entity-debugging-guide.md`](./entity-debugging-guide.md)




