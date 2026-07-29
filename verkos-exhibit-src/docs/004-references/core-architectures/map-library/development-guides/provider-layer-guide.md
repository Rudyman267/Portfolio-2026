# Development Guide: Provider Layer (Cesium today, others tomorrow)

## Purpose

This guide explains where provider-specific code lives and how it is wired into the library.

Use this when you need to:

- change Cesium initialization, imagery layers, terrain, camera behavior
- add provider-specific configuration options
- add a new provider

## Provider layer responsibilities

The provider layer owns:

- the underlying map runtime (Cesium `Viewer`)
- provider-specific services (events, coordinate conversions, terrain sampling)
- provider-specific base entity implementations (Cesium primitives)
- orchestration of library managers during `initialize()`

## Where the code lives

- Provider implementation:
  - [`libs/shared/map/src/private/map-providers/cesium/`](../../../../libs/shared/map/src/private/map-providers/cesium/)
  - main map class: `cesium-map.ts`
  - provider factory: `cesium-provider-factory.ts`
  - services: `services/` (notably `cesium-map-service.ts`)
  - events: `events/`
  - base entities: `entities/`

- Provider wiring (registration and default selection):
  - [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)

- Provider selection (client calls):
  - [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)

## How provider config flows

Client passes:

- `MapOptions` from [`src/public/contracts/base/map-options.interface.ts`](../../../../libs/shared/map/src/public/contracts/base/map-options.interface.ts)
  - `providerOptions?: Record<string, unknown>`

The Cesium provider factory merges:

- default provider config
- provider config registered during bootstrap
- overrides from `MapOptions.providerOptions`

Source:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts)

## Where managers are created

Provider `initialize()` is responsible for creating and owning:

- provider services (map services + events manager)
- composite manager (constructed with provider services)
- feature managers (constructed with composite manager)

Source:

- [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`initialize`)

## Adding a new provider (high level)

1. Extend `MapProviderType` (internal enum) to add a new provider key
2. Implement a provider factory (`IMapProviderFactory`) for the new provider
3. Implement the provider itself (`IMapProvider`) returning a map instance implementing `IFlytMap`
4. Register it during bootstrap
5. Ensure the public factory can select it via `createMapInstanceWithProvider(...)`

The boundary rule stays the same:

- clients do not import provider classes directly
- runtime wires providers via the provider registry




