# Map Library Architecture (Detailed)

## Purpose

This document provides an **end-to-end runtime walkthrough** of how the map library is bootstrapped and how a map instance is created and wired (provider → managers → entities).

Use this when you need to:

- debug initialization issues (container not found, Cesium not rendering)
- add a new provider or provider option
- understand where managers/entities are instantiated and owned

## Non-goals

- Describing every feature manager API
- Copying implementation code into docs

## Glossary (minimal)

- **Provider**: a map backend implementation (currently **Cesium**) that can produce a map instance implementing `IFlytMap`.
- **Bootstrap**: one-time registration of providers and selection of default provider.
- **Contracts**: the client-facing interfaces/types in [`libs/shared/map/src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/).

## High-level sequence

### 1) Client imports the library

Clients should import from the library public entry:

- [`libs/shared/map/index.ts`](../../../../libs/shared/map/index.ts) → re-exports [`libs/shared/map/src/public/`](../../../../libs/shared/map/src/public/)
- [`libs/shared/map/src/public/index.ts`](../../../../libs/shared/map/src/public/index.ts) → re-exports:
  - runtime bootstrap helpers ([`libs/shared/map/src/runtime/`](../../../../libs/shared/map/src/runtime/))
  - public contracts ([`libs/shared/map/src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/))
  - public core ([`libs/shared/map/src/public/core/`](../../../../libs/shared/map/src/public/core/))

### 2) Client creates a map instance (public factory → runtime)

Client-facing factory is exposed via:

- [`libs/shared/map/src/public/core/factories/map.factory.ts`](../../../../libs/shared/map/src/public/core/factories/map.factory.ts)

This file deliberately **re-exports** the runtime implementation to keep the public layer free of private imports:

- `createMapInstanceWithProvider(...)` is implemented in [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)
- `MapProviderType` is defined in [`libs/shared/map/src/private/contracts/map-providers/map-provider-types.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-types.ts)

### 3) Runtime ensures the library is bootstrapped

When the client calls `createMapInstanceWithProvider(...)`:

1. Runtime calls `ensureBootstrap()` (internal helper)
2. If the library is not bootstrapped, runtime calls `bootstrapMapLibrary()`

Implementation:

- [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)
- [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)

Bootstrap responsibilities (current state):

- register Cesium provider factory into the provider registry
- optionally mark Cesium as the default provider
- provide reset helpers for tests / advanced flows

### 4) Provider registration (bootstrap → provider registry)

`bootstrapMapLibrary()` registers providers into `MapProviderRegistry`.

Implementation:

- [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)
- [`libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts)

Key behavior (by design):

- **Idempotent**: calling bootstrap multiple times is safe (it returns the already-registered state).
- **Explicit default**: bootstrap can mark a provider as default (`setCesiumAsDefault` option).

### 5) Provider resolution (registry → provider instance)

After bootstrap, runtime requests a provider instance from the registry:

- `MapProviderRegistry.getProvider(providerType, context)`

The registry:

- selects the requested provider type (or default if none)
- validates it is registered
- uses the registered factory to create a provider instance

Implementation:

- [`libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts)

### 6) Provider factory creates a provider instance (Cesium)

For Cesium, the registered factory is:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts)

Key responsibilities:

- merges provider-specific overrides from `MapOptions.providerOptions` into the provider config
- constructs `CesiumMap(containerId, mapOptions, providerConfig)`

Related public configuration contract:

- [`libs/shared/map/src/public/contracts/base/map-options.interface.ts`](../../../../libs/shared/map/src/public/contracts/base/map-options.interface.ts) (`MapOptions`)

### 7) Provider instance is an `IFlytMap` (returned to client)

The provider instance returned by the registry exposes `provider.mapInstance`.

In Cesium’s case:

- `CesiumMap` implements `IMapProvider<IFlytMapInternal, ICesiumProviderConfig>`
- and `mapInstance` returns `this`

So runtime returns the Cesium map instance as the public contract type:

- [`libs/shared/map/src/public/contracts/flyt-map.interface.ts`](../../../../libs/shared/map/src/public/contracts/flyt-map.interface.ts) (`IFlytMap`)

### 8) Client calls `initialize()` (and this is where managers are created)

The library returns a map object immediately, but **it is not ready** until:

- `await map.initialize()`

In the Cesium provider, `initialize()` is the main orchestration point:

- creates the Cesium map service
- creates provider services
- creates the composite manager
- creates feature managers (drone/mission/zone/annotation/etc.)
- marks the map as initialized

Implementation:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`CesiumMap.initialize()`)

### 9) Manager usage (client-facing surface)

After initialization, client code interacts with managers via the `IFlytMap` contract:

- `getDroneManager()`, `getMissionPlannerManager()`, `getZoneManager()`, etc.

Contract location:

- [`libs/shared/map/src/public/contracts/flyt-map.interface.ts`](../../../../libs/shared/map/src/public/contracts/flyt-map.interface.ts)

Implementation location for managers/entities:

- [`libs/shared/map/src/private/feature-entities/`](../../../../libs/shared/map/src/private/feature-entities/)
- [`libs/shared/map/src/private/composite-entities/`](../../../../libs/shared/map/src/private/composite-entities/)

### 10) Disposal

When a map instance is no longer needed, clients should call:

- `map.dispose()`

Implementation:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`dispose()`)

**Important**: entity-level disposal and map-level disposal are separate concerns. See [`entity-lifecycle.md`](./entity-lifecycle.md) in this module for the responsibility split.

## Key runtime “handoff points” (where to debug)

| Symptom | Most likely stage | Where to inspect |
|--------|--------------------|------------------|
| Provider not found / default missing | Registry resolution | [`src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts) |
| Map created but never initializes | Provider initialization | [`src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`initialize`) |
| Container not found / zero size issues | Cesium service setup | [`src/private/map-providers/cesium/services/`](../../../../libs/shared/map/src/private/map-providers/cesium/services/) (and `CesiumMapService`) |
| Options not taking effect | Provider option merge | [`src/private/map-providers/cesium/cesium-provider-factory.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts) + `MapOptions` |
| Events not firing | Cesium events manager wiring | [`src/private/map-providers/cesium/events/`](../../../../libs/shared/map/src/private/map-providers/cesium/events/) |

## Extension scenarios (how the architecture supports change)

### Add a new provider

At a high level:

1. Define a new provider type (extend `MapProviderType`)
2. Implement a provider factory (`IMapProviderFactory`)
3. Register it during bootstrap (`bootstrapMapLibrary`)
4. Allow clients to pick it via `createMapInstanceWithProvider(newType, ...)`

Primary reference sources:

- [`src/private/contracts/map-providers/`](../../../../libs/shared/map/src/private/contracts/map-providers/) (registry + provider interfaces)
- [`src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts) (registration)
- [`src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts) (creation)

### Add provider-specific configuration

Provider-specific options must flow through the **public** `MapOptions.providerOptions`, and be interpreted inside the provider factory.

Source of truth:

- [`src/public/contracts/base/map-options.interface.ts`](../../../../libs/shared/map/src/public/contracts/base/map-options.interface.ts)
- [`src/private/map-providers/cesium/cesium-provider-factory.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts)

### Add a new feature manager / entity

High level:

1. Add/extend a public contract under [`src/public/contracts/feature-entities/`](../../../../libs/shared/map/src/public/contracts/feature-entities/)
2. Implement it under [`src/private/feature-entities/`](../../../../libs/shared/map/src/private/feature-entities/)
3. Wire it into the provider’s initialization (`CesiumMap.initialize()`)

## Related documents (new IA)

- [`overview.md`](./overview.md): architectural layers and responsibilities
- [`layer-boundaries.md`](./layer-boundaries.md): “what goes where” rules
- [`entity-lifecycle.md`](./entity-lifecycle.md): create/update/dispose responsibilities and guarantees


