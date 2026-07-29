# Map Library Architecture: Layer Boundaries (“What goes where”)

## Purpose

This document tells contributors **where code should live** in the map library, and which dependency directions are allowed.

If you follow this, you:

- avoid circular dependencies
- keep the public API stable
- keep provider implementations swappable

## Non-goals

- Listing every file/class in the library
- Teaching Cesium itself

## The 4 layers (conceptual)

- **Public**: what client apps import
- **Public contracts**: client-facing interfaces/types
- **Private**: implementations (entities/managers/providers)
- **Runtime**: wiring/bootstrapping (the intentional bridge)

## Folder mapping (actual code)

| Concept | Path | What belongs here |
|--------|------|-------------------|
| **Public entry** | [`libs/shared/map/src/public/`](../../../../libs/shared/map/src/public/) | Package exports, public factories, public constants/utils |
| **Public contracts (client-facing)** | [`libs/shared/map/src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/) | `IFlytMap`, `MapOptions`, manager/entity interfaces, event types for clients |
| **Private implementations** | [`libs/shared/map/src/private/`](../../../../libs/shared/map/src/private/) | Feature entities/managers, composite entities, Cesium provider, Cesium services |
| **Private “wiring contracts” (internal)** | [`libs/shared/map/src/private/contracts/`](../../../../libs/shared/map/src/private/contracts/) | Provider registry interfaces/configs, internal entity contracts used only inside the library/runtime |
| **Runtime wiring** | [`libs/shared/map/src/runtime/`](../../../../libs/shared/map/src/runtime/) | Bootstrap + provider registration + `createMapInstanceWithProvider` |

## Dependency rules (the important part)

### Client apps

- ✅ **Allowed**: import from `@libs/shared/map` / `@map/public/*`
- ❌ **Forbidden**: import from `@map/private/*`

### Public layer ([`src/public`](../../../../libs/shared/map/src/public))

- ✅ **Allowed**:
  - import/re-export from [`src/public/contracts`](../../../../libs/shared/map/src/public/contracts)
  - re-export runtime factory helpers (to avoid direct private imports)
- ❌ **Forbidden**:
  - importing implementation modules from [`src/private/**`](../../../../libs/shared/map/src/private/)

Reality check: [`src/public`](../../../../libs/shared/map/src/public) currently contains **no** `@map/private` imports.

### Runtime layer ([`src/runtime`](../../../../libs/shared/map/src/runtime))

- ✅ **Allowed**:
  - import `MapProviderRegistry`, `MapProviderType`, provider configs from [`src/private/contracts`](../../../../libs/shared/map/src/private/contracts)
  - import provider factories from [`src/private/map-providers/**`](../../../../libs/shared/map/src/private/map-providers/)
  - import public contract types where needed (e.g. `MapOptions`)
- ✅ **This is the only bridge layer** by design.

### Private layer ([`src/private`](../../../../libs/shared/map/src/private))

- ✅ **Allowed**:
  - import client-facing contract types from [`src/public/contracts`](../../../../libs/shared/map/src/public/contracts) (so implementations satisfy the public interfaces)
  - import internal wiring contracts from [`src/private/contracts`](../../../../libs/shared/map/src/private/contracts)
  - import provider libraries (Cesium) only inside provider implementation areas (e.g. [`src/private/map-providers/cesium/**`](../../../../libs/shared/map/src/private/map-providers/cesium/))
- ❌ **Forbidden**:
  - re-exporting private implementation types through the public package surface
  - “leaking” Cesium types into public contracts

## “What goes where” decision guide

### If you are changing the **public API**

Put it in:

- [`src/public/contracts/**`](../../../../libs/shared/map/src/public/contracts/) (contracts)
- and optionally expose convenience exports via [`src/public/index.ts`](../../../../libs/shared/map/src/public/index.ts)

Do not:

- reference Cesium types
- reference private contracts
- require client code to import from `@map/private/*`

### If you are changing **behavior without changing the public contract**

Put it in:

- [`src/private/**`](../../../../libs/shared/map/src/private/) (implementation)

This includes:

- bugfixes in entities/managers
- performance improvements
- styling defaults used internally

### If you are adding **provider-specific behavior**

Put it in:

- `src/private/map-providers/<provider>/` (e.g. [`src/private/map-providers/cesium/`](../../../../libs/shared/map/src/private/map-providers/cesium/))

Expose configuration to clients via:

- `MapOptions.providerOptions` in [`src/public/contracts/base/map-options.interface.ts`](../../../../libs/shared/map/src/public/contracts/base/map-options.interface.ts)

Then consume/merge those options in:

- provider factory (e.g. [`src/private/map-providers/cesium/cesium-provider-factory.ts`](../../../../libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts))

### If you are adding a **new provider**

Put it in:

- `src/private/map-providers/<new-provider>/` (e.g. [`src/private/map-providers/cesium/`](../../../../libs/shared/map/src/private/map-providers/cesium/))

Wire it in:

- [`src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts) (register provider factory and config)

Expose selection to clients via:

- `MapProviderType` (internal enum lives under [`src/private/contracts/map-providers/`](../../../../libs/shared/map/src/private/contracts/map-providers/) and is re-exported by the public factory)

## Common boundary violations (anti-patterns)

- **Public depends on private**:
  - “fix” by moving the wiring into runtime and exporting a runtime entry from public.
- **Contracts mention provider types**:
  - e.g. returning `Cesium.Viewer` from `IFlytMap` is a leak; replace with an abstract/behavioral contract.
- **Client imports private**:
  - introduce a public contract type instead, or extend an existing public contract.

## Related documents

- [`overview.md`](./overview.md)
- [`detailed-architecture.md`](./detailed-architecture.md)
- [`entity-lifecycle.md`](./entity-lifecycle.md)




