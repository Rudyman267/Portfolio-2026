# Common Issues

## Purpose

This document lists high-frequency issues encountered when integrating or extending the map library, with the fastest path to diagnose each.

## Map fails to initialize

### Symptom

- `initialize()` rejects/throws
- map stays blank

### What to check

- **Container sizing**: ensure the container has non-zero width/height
  - Resizable layouts may need a short delay before initialization (see asset-management MapInstance pattern)
- **Provider options**: ensure provider options (e.g. Cesium ion token) are present if required by your environment
- **Bootstrap/provider registry**: runtime should bootstrap automatically, but provider registry errors can still occur

Where to inspect:

- runtime factory: [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)
- bootstrap: [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)
- provider registry: [`libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts)

## “Provider not found” / “No default provider”

### Symptom

- errors mentioning provider not registered, or no default provider is set

### Likely causes

- bootstrap did not run successfully
- registry was reset (tests) without re-bootstrapping
- provider type mismatch (future providers)

Where to inspect:

- [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)
- [`libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts`](../../../../libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts)

## Map instance exists but manager getters throw “not initialized”

### Symptom

- `getDroneManager()` / `getMissionPlannerManager()` etc. throws

### Likely cause

- client code calls manager getters before `await map.initialize()` has completed

Where to inspect:

- provider initialization: [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`initialize`)

## Render loop errors / WebGL errors

### Symptom

- intermittent render failures
- errors from Cesium render loop

### What to do

- subscribe to render errors via the public API:
  - `IFlytMap.onRenderError(...)` / `IFlytMap.offRenderError(...)`
- check Cesium events manager wiring

Where to inspect:

- contract: [`libs/shared/map/src/public/contracts/flyt-map.interface.ts`](../../../../libs/shared/map/src/public/contracts/flyt-map.interface.ts)
- Cesium implementation:
  - [`libs/shared/map/src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts)
  - [`libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts)

## Ghost entities / memory leaks after navigation

### Symptom

- entities remain visible after leaving a screen
- CPU usage grows across navigation

### Likely causes

- missing `dispose()` on unmount
- feature entities not calling `remove()` for owned composites
- composites not destroying base entities

Where to inspect:

- map-level disposal: [`src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts) (`dispose`)
- cascade cleanup pattern:
  - composites: [`src/private/composite-entities/**`](../../../../libs/shared/map/src/private/composite-entities/) (`remove`)
  - features: [`src/private/feature-entities/**`](../../../../libs/shared/map/src/private/feature-entities/) (`remove`)

## Events not firing (click/drag/hover)

### Symptom

- no global click/drag events observed

### What to check

- you are subscribing via `onGlobalEvent` after initialization
- event manager exists (created during provider initialize)

Where to inspect:

- global event bridge: [`src/private/map-providers/cesium/events/cesium-events-manager.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/events/cesium-events-manager.ts)
- provider initialize: [`src/private/map-providers/cesium/cesium-map.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-map.ts)




