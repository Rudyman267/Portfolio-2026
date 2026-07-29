# React Integration

## Purpose

This document describes recommended React integration patterns for the map library.

It is intentionally “how to integrate” rather than a hook cookbook with lots of code.

## Source of truth (examples in apps)

Existing patterns worth referencing:

- [`apps/asset-management/src/app/shared/map/MapInstance.tsx`](../../../../apps/asset-management/src/app/shared/map/MapInstance.tsx) (MapInstance component with global registry + ref-counted disposal)
- [`apps/mission-planner/src/components/Map/MapInstance.tsx`](../../../../apps/mission-planner/src/components/Map/MapInstance.tsx) (MapInstance with org settings + 2D default)

## Required lifecycle steps

### 1) Provide a stable container

- Ensure the map container has a **stable ID** (string)
- Ensure the container has **non-zero width/height**
- In resizable layouts, consider waiting briefly for layout to settle before initialization
  - (asset-management uses a short delay for this reason)

### 2) Create the instance through the public factory

Client apps should create maps through the public entry using:

- `createMapInstanceWithProvider(MapProviderType.CESIUM, containerId, mapOptions)`

Where:

- `containerId` is the DOM element ID
- `mapOptions` is `MapOptions` from `@map/public` / public contracts

### 3) Always initialize before use

Treat initialization as mandatory:

- call `await instance.initialize()` before using managers or interacting with the map

### 4) Dispose on unmount

On component unmount:

- call `instance.dispose()`

If your application may mount/unmount multiple React components against the same container ID, use a **ref-counted registry** so only the last consumer disposes the map (see asset-management pattern).

## Configuration guidance

### Provider options (Cesium)

Use `MapOptions.providerOptions` to pass provider-specific overrides without importing private types.

Example real-world use:

- passing Cesium ion token via `providerOptions.ionAccessToken`
  - see [`apps/asset-management/src/app/shared/map/MapInstance.tsx`](../../../../apps/asset-management/src/app/shared/map/MapInstance.tsx) and [`apps/fleet/src/app/shared/context/map-context.tsx`](../../../../apps/fleet/src/app/shared/context/map-context.tsx)

### Base map configuration

Client apps typically source base map configuration from organization settings and pass:

- `MapOptions.baseMapConfig`

## Recommended React architecture

### Prefer a “MapInstance + children” pattern

Keep a single component responsible for:

- creating the map instance
- awaiting initialization
- disposing it on unmount

Then render “map feature components” as children only after readiness (so children can safely assume managers exist).

### Keep the map instance in context

Most apps should expose:

- `mapInstance`
- `isReady / isInitialized`
- `containerId`

…through a React context for consistent usage across the app.

## Common pitfalls

- **Creating multiple map instances for the same container**
  - fix: registry/ref-counting keyed by container ID
- **Initializing before layout is stable (0x0 container)**
  - fix: ensure sizing, wait for layout settle, or initialize after mount + measurement
- **Using the instance before `initialize()` resolves**
  - fix: gate children on readiness




