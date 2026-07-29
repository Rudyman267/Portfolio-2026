# Development Guide: Public vs Private (and Contracts)

## Purpose

This guide answers the day-to-day question:

> “Where should I put this change so we don’t leak implementation details or create circular dependencies?”

It is written for contributors working inside [`libs/shared/map/`](../../../../libs/shared/map/).

## The rule of thumb

- If **client applications** need to import it, it belongs in **public contracts**.
- If it is an **implementation detail**, it belongs in **private**.
- If it is **wiring/bootstrap**, it belongs in **runtime**.

## Where things live

### Public entry + public core

- [`libs/shared/map/src/public/`](../../../../libs/shared/map/src/public/)
  - `index.ts`: public export surface
  - `core/`: public constants/utils/factories (should not import private implementations)

### Public contracts (client-facing)

- [`libs/shared/map/src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/)
  - `flyt-map.interface.ts` (`IFlytMap`)
  - `base/` (e.g. `MapOptions`, `IPosition`)
  - `feature-entities/` (manager/entity interfaces for clients)
  - `events/` (event types payloads used by clients)

**Contract quality bar**:

- no Cesium imports/types
- no references to private modules
- stable, “behavioral” API (describe what, not how)

### Private implementations

- [`libs/shared/map/src/private/`](../../../../libs/shared/map/src/private/)
  - `feature-entities/`: domain behavior (missions, drones, zones…)
  - `composite-entities/`: reusable building blocks (FBPolyline, FBMarker…)
  - `map-providers/`: provider implementations (Cesium)
  - `utils/`: internal utilities

### Runtime wiring

- [`libs/shared/map/src/runtime/`](../../../../libs/shared/map/src/runtime/)
  - `bootstrap.ts`: provider registration (idempotent)
  - `map-instance.ts`: creates a provider instance and returns it as `IFlytMap`

## “Private contracts” (internal wiring)

The library also contains:

- [`libs/shared/map/src/private/contracts/`](../../../../libs/shared/map/src/private/contracts/)

These are **internal-only** contracts that support provider wiring and internal composition (provider registry, base entity interfaces, composite entity interfaces, services).

Client apps should never import from here.

## Decision checklist

### You are changing a type / interface

- **Clients need it?** → add/modify in [`src/public/contracts/**`](../../../../libs/shared/map/src/public/contracts/)
- **Only internal wiring needs it?** → add/modify in [`src/private/contracts/**`](../../../../libs/shared/map/src/private/contracts/)

### You are changing behavior

- **Pure behavior change (no contract change)** → implement in [`src/private/**`](../../../../libs/shared/map/src/private/)
- **Behavior change that requires new public methods/options**:
  - change the contract in [`src/public/contracts/**`](../../../../libs/shared/map/src/public/contracts/)
  - implement it in [`src/private/**`](../../../../libs/shared/map/src/private/)
  - wire it in provider initialization if needed ([`src/private/map-providers/**`](../../../../libs/shared/map/src/private/map-providers/))

### You are changing bootstrap/provider selection

- change [`src/runtime/**`](../../../../libs/shared/map/src/runtime/) (bootstrap/registry usage)

## Common mistakes

- **Adding a Cesium type to a public contract**
  - fix: replace with an abstract type or a behavioral method; keep Cesium types private.
- **Client imports `@map/private/*`**
  - fix: expose the needed contract in [`src/public/contracts/**`](../../../../libs/shared/map/src/public/contracts/).
- **Public factory imports a private provider directly**
  - fix: move the wiring into runtime and export runtime helpers from public core.




