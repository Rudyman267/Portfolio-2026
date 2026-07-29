# Map Library Architecture (Overview)

## Purpose

This document describes the **current** architecture of the shared map library ([`libs/shared/map/`](../../../../libs/shared/map/)) at a level that helps engineers:

- reason about **where code belongs**
- avoid breaking **module boundaries**
- extend the library (new features/entities/providers) without reintroducing circular dependencies

## Non-goals

- Re-stating TypeScript interfaces line-by-line
- Documenting every class/method
- Including large code snippets (use code navigation instead)

## Architecture at a glance

The map library is organized into four conceptual layers:

```
Client apps (fleet / mission-planner / flyt-map / asset-management)
  └─ import from `@libs/shared/map` (public entry)
       |
       v
Public layer (stable surface)
  └─ re-exports: public contracts + public core (factories/constants)
       |
       v
Contracts (client-facing contracts)
  └─ interfaces/types used by both client code and implementations
       ^
       |
Private implementations
  └─ Cesium provider, managers, entities, composites
       ^
       |
Runtime wiring (bootstrap + provider selection)
  └─ registers providers + returns `IFlytMap` instances
```

The key property of this design is **dependency direction discipline**:

- **Clients** should never import private implementation modules.
- **Public** should not import private implementations directly (it re-exports runtime indirections).
- **Runtime** is the only layer that is allowed to import/wire private implementations.

## Where each layer lives (in this repo)

### Public layer

- Location: [`libs/shared/map/src/public/`](../../../../libs/shared/map/src/public/)
- What it owns:
  - package entry re-exports ([`libs/shared/map/src/public/index.ts`](../../../../libs/shared/map/src/public/index.ts))
  - public factories/constants/utils ([`libs/shared/map/src/public/core/`](../../../../libs/shared/map/src/public/core/))
  - re-export of client-facing contracts ([`libs/shared/map/src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/))

Key note: the public map factory delegates to runtime to keep the public surface free of private imports:
- [`libs/shared/map/src/public/core/factories/map.factory.ts`](../../../../libs/shared/map/src/public/core/factories/map.factory.ts)

### Contracts (client-facing contracts)

- Location: [`libs/shared/map/src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/)
- What it owns:
  - `IFlytMap` and all client-facing manager/entity contracts
  - `MapOptions` and shared base contracts (position/orientation/events types)

This is the “shared language” between clients and implementations.

### Private implementations

- Location: [`libs/shared/map/src/private/`](../../../../libs/shared/map/src/private/)
- What it owns:
  - concrete managers/entities/composites implementing public contracts
  - provider implementations (currently Cesium) under `map-providers/`

### Runtime wiring

- Location: [`libs/shared/map/src/runtime/`](../../../../libs/shared/map/src/runtime/)
- What it owns:
  - bootstrap/registration of providers (`bootstrapMapLibrary`)
  - creation of `IFlytMap` via provider registry

Concrete files:
- [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)
- [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)

## Provider abstraction (how Cesium is “plugged in”)

The library treats each map provider (Cesium now; others later) as a registered implementation behind a provider registry.

### What happens during bootstrap

- `bootstrapMapLibrary()` registers the Cesium provider factory into the provider registry and optionally marks it as default.
- This is explicitly **idempotent** (safe to call multiple times).

Implementation entry:
- [`libs/shared/map/src/runtime/bootstrap.ts`](../../../../libs/shared/map/src/runtime/bootstrap.ts)

### How map instance creation works

At a high level:

1. Client calls the public factory (exported from `@libs/shared/map`)
2. Public factory calls runtime `createMapInstanceWithProvider(...)`
3. Runtime ensures bootstrap has happened
4. Runtime asks the provider registry for a provider instance and returns it as `IFlytMap`

Implementation entry:
- [`libs/shared/map/src/runtime/map-instance.ts`](../../../../libs/shared/map/src/runtime/map-instance.ts)

## Contracts vs “private contracts” (important nuance)

In the current implementation there are two “contract-like” areas:

- **Public contracts** (client-facing): [`src/public/contracts/`](../../../../libs/shared/map/src/public/contracts/)
- **Private wiring contracts** (internal): [`src/private/contracts/`](../../../../libs/shared/map/src/private/contracts/)

The private contracts exist to support provider wiring (registry/factory/provider interfaces, provider configs, internal helper interfaces) without exposing these to application code.

If a type is needed by application teams, it belongs in **public contracts**.
If it is only needed for provider wiring/implementation, it belongs in **private contracts**.

## Boundary rules (high signal)

- **Clients**
  - ✅ import from `@libs/shared/map` / `@map/public/*`
  - ❌ import from `@map/private/*`
- **Public layer**
  - ✅ re-export public contracts and runtime factory
  - ❌ depend on private implementations
- **Runtime layer**
  - ✅ imports private implementations and registers them
  - ✅ is the only “bridge”
- **Private layer**
  - ✅ implements public contracts
  - ✅ can use private contracts for provider wiring
  - ❌ should not leak private types into public contracts

## Related documents (new IA)

- [`detailed-architecture.md`](./detailed-architecture.md) (next): step-by-step flow from bootstrap → provider → managers → entities
- [`layer-boundaries.md`](./layer-boundaries.md): how to decide “what goes where” for a change
- [`entity-lifecycle.md`](./entity-lifecycle.md): lifecycle and disposal semantics

## Reference sources (legacy, for comparison only)

These were used as inputs, but should not be extended further:

- [`libs/shared/map/docs/architecture/new-architecture-guide.md`](../../../../libs/shared/map/docs/architecture/new-architecture-guide.md) (best “current state” narrative)
- [`libs/shared/map/docs/migration/architecture-redesign-contracts-pattern.md`](../../../../libs/shared/map/docs/migration/architecture-redesign-contracts-pattern.md) (historical migration rationale)




