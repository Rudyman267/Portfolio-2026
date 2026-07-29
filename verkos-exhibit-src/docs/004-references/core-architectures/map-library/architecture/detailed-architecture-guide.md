# Shared Map Library Architecture Guide

This document captures the current implementation of the shared map library after the contracts-driven migration. It explains what each layer owns, how a new feature should be introduced, and how client applications consume the library so that every team member can reason consistently about the runtime wiring, provider implementations, and public surface.

## 1. High-level architecture

```
               +-----------------------------+
               |      Client Application     |
               +-------------+---------------+
                             |
                             v
               +-----------------------------+
               |        Public Layer         |  ←─ re-exports contracts, factories
               +-------------+---------------+
                             |
                             v
               +-----------------------------+
               |        Contracts Layer      |  ←─ pure interfaces, enums, types
               +-------------+---------------+
                             ^
                             |
               +-------------+---------------+
               |        Private Layer         |
               +-------------+---------------+
                             ^
                             |
               +-----------------------------+
               |        Runtime Layer         |  ←─ wires public ↔ private (bootstrap)
               +-----------------------------+
```

- **Contracts** (`libs/shared/map/src/public/contracts/...`) centralize every interface (`IFlytMap`, managers, feature types) plus `MapOptions`, provider abstractions, and shared constants so that public and private layers depend on them without introducing cycles. See `libs/shared/map/src/public/contracts/flyt-map.interface.ts:19-205` and `libs/shared/map/src/public/contracts/base/map-options.interface.ts:22-37` for the current contracts shape.
- **Public** (`libs/shared/map/src/public/...`) exposes a stable surface. The entry point at `libs/shared/map/src/public/index.ts:1-17` re-exports the runtime bootstrap plus contracts and the core factory (currently `createMapInstanceWithProvider` via `map.factory.ts:1-7`). Public code never imports from private.
- **Private** (`libs/shared/map/src/private/...`) implements every contract (`CesiumMap`, managers, services, providers). The Cesium provider factory/instance (`libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts:1-81` and `libs/shared/map/src/private/map-providers/cesium/cesium-map.ts:51-675`) implements `IMapProvider`, holds the provider config, and orchestrates all feature managers.
- **Runtime** (`libs/shared/map/src/runtime/...`) is the only place that knows about both public and private. It bootstraps the provider registry, registers default providers, and exposes `createMapInstanceWithProvider` plus bootstrap helpers. See `libs/shared/map/src/runtime/bootstrap.ts:1-168` for the registry wiring and `libs/shared/map/src/runtime/map-instance.ts:1-53` for the single factory entry point that clients use.

## 2. Directory structure and contract intent

```
libs/shared/map/src/public/
├── contracts/             # Client-facing contracts (public types/interfaces + shared constants)
└── core/
    ├── factories/         # Factories that delegate to runtime helpers
    └── index.ts           # Re-exports for the public package

libs/shared/map/src/private/
├── contracts/             # Internal contracts (IMapProvider, provider registry, provider configs)
├── feature-entities/      # Managers/entities implementing contracts
├── map-providers/         # Cesium/CGM providers, factories and services
└── core/...?              # (Other implementation folders)

libs/shared/map/src/runtime/
└── bootstrap.ts           # Wiring layer that imports both public indexes and private providers
└── map-instance.ts        # Entry used by public factory to get IFlytMap instances
```

- **Public contracts folder** (`libs/shared/map/src/public/contracts/`) holds every contract clients consume directly: feature managers, `MapOptions`, `IFlytMap`, event interfaces, etc. These definitions drive the public API surface and can be re-exported without leaking implementations.
- **Private contracts folder** (`libs/shared/map/src/private/contracts/`) contains wiring contracts that only private code should implement: the provider registry, provider creation context, `ICesiumProviderConfig`, internal helpers like `IFlytMapInternal`. They are accessible to private implementations (e.g., `CesiumMap`, provider factories) but are not exposed to end-user modules.
- **Dependency intent**: Public and private layers both depend on the public contracts folder to stay in sync. Private components may additionally depend on the private contracts (since they represent implementation details and the runtime wiring) but never on public implementation code. Runtime is the only layer that imports from both public and private so it can wire providers into the public-facing factory.

## 3. Dependency flow guarantees

1. **Public → Contracts**: Public APIs only import from `@map/public/contracts`. No public file imports from private modules, enforcing the outward-facing surface remains implementation-agnostic.
2. **Private → Contracts & Private contracts**: Private implementations import shared contracts plus any private-only contracts (e.g., provider registry interfaces). This ensures private code doesn't accidentally start relying on the public layer.
3. **Runtime → Public + Private**: Runtime bootstrap imports provider factories or other implementations from `libs/shared/map/src/private/...` and the public contracts through the public entry point (`bootstrap.ts` uses `MapProviderRegistry`, `CesiumProviderFactory`, etc.). Runtime registers providers so the public factory (`createMapInstanceWithProvider`) can work purely through contracts.
4. **Clients → Public**: Application code imports `@cloud/shared/map` (public entry) and never touches private implementation folders.

Because of this enforced direction:

```
 Clients → Public → Contracts ← Private ← Runtime (↔ Public)
                     ↑
                     └────────────── Runtime wires private providers
```

public code never sees private implementations, and private code never introduces circular dependencies through the public surface.

## 4. Responsibilities per component

| Layer         | Ownership              | Key responsibilities                                                                                                                                                                                                                                  | Referential files                                                                                                                                                                                                                     |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contracts** | Interfaces/types/enums | Define every public contract (`IFlytMap`, manager interfaces, `MapOptions`, provider registry contracts, and shared constants).                                                                                                                       | `libs/shared/map/src/public/contracts/flyt-map.interface.ts:19-205`, `libs/shared/map/src/public/contracts/base/map-options.interface.ts:22-37`, `libs/shared/map/src/private/contracts/map-providers/map-provider-registry.ts:1-264` |
| **Public**    | Client-facing surface  | Re-export contracts, expose factories (`createMapInstanceWithProvider`, `MapProviderType`), and optionally bootstrap helpers; no implementation details leak here.                                                                                    | `libs/shared/map/src/public/index.ts:1-17`, `libs/shared/map/src/public/core/factories/map.factory.ts:1-7`                                                                                                                            |
| **Private**   | Implementations        | Provide concrete Cesium-based entities, managers, and providers that satisfy the contracts. Each provider (such as Cesium) is built via a factory that merges runtime provider options into `ICesiumProviderConfig` before instantiating `CesiumMap`. | `libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts:1-81`, `libs/shared/map/src/private/map-providers/cesium/cesium-map.ts:51-675`                                                                           |
| **Runtime**   | Wiring layer           | Bootstraps the provider registry, registers default providers (Cesium by default), exposes factory helpers, and enforces idempotent initialization and provider lookups.                                                                              | `libs/shared/map/src/runtime/bootstrap.ts:1-168`, `libs/shared/map/src/runtime/map-instance.ts:1-53`                                                                                                                                  |

## 5. Change scenarios and case studies

The new architecture keeps contracts and implementation strictly separated. Depending on the area you’re touching, follow the guidelines below so that nothing leaks from private to public.

### Case study 1: Adding a feature class

1. **Public contract first** – add or extend the relevant interface inside `libs/shared/map/src/public/contracts/...`. For example, to expose a new `IAnnotationFeature`, document the methods, return types, and events clients will consume. The contract should never mention provider-specific classes (Cesium viewer, CGM models, etc.).
2. **Private implementation** – implement the feature class inside `libs/shared/map/src/private/feature-entities/...`, using the private composite entities, factories, or services already available. The implementation should import only from contracts—never from any public implementation file.
3. **Provider wiring** – ensure `CesiumMap` or the relevant provider attaches the new feature manager. If provider-specific options are required, add them to `MapOptions.providerOptions` (public contract) and propagate through `CesiumProviderFactory` (`libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts:63-80`) to `CesiumMap`.
4. **Runtime exposure** – the public factory (`createMapInstanceWithProvider` in `libs/shared/map/src/runtime/map-instance.ts:34-51`) already routes through `MapProviderRegistry`. No public file should import the provider directly; runtime bootstrapping wires Cesium (or other providers) whenever the client calls into the public entry point.
5. **Client API** – clients interact with `IFlytMap` from `libs/shared/map/src/public/contracts/flyt-map.interface.ts:19-205`, obtain the new manager through its getter, and never touch the implementation class.

### Case study 2: Modifying the composite layer

- Composite entities (`FBPolyline`, `BaseEntity`, etc.) live entirely inside the private layer (`libs/shared/map/src/private/composite-entities/...`). Any change to their behavior stays private.
- The only contracts that should reference the composite layer are located in `libs/shared/map/src/public/contracts/composite-entities/...` and define abstract operations such as `setPositions()`, `show()`, etc. You should never expose additional implementation-only behaviors through public contracts unless absolutely necessary.
- Because composites feed into feature managers (annotation, asset, mission), you can update private managers to consume the modified composites. Public contracts remain unchanged unless the change impacts the contract surface.
- In short: keep composites private, and only add new contract methods when the public API needs to describe new behavior. Otherwise, keep the change internal.

### Case study 3: Adjusting CGM or other provider-specific implementations

- Provider implementations reside under `libs/shared/map/src/private/map-providers/...` and rely on the provider contracts (`libs/shared/map/src/private/contracts/map-providers/...`).
- Any CGM-specific option, validation, or helper should live inside `MapOptions.providerOptions` (public) and be merged by the provider factory before instantiating the provider. Clients pass options through the public `MapOptions` interface, not private classes.
- Changes to CGM itself (new viewer lifecycle, CGM services, etc.) are contained within private map providers. They never reach the public surface; only contracts such as `IMapProvider`, `MapProviderCreationContext`, and `ICesiumProviderConfig` are shared via `@map/private/contracts`.
- The runtime bootstrap (`libs/shared/map/src/runtime/bootstrap.ts:84-168`) registers each provider factory. When a new CGM provider is added, implement its factory, register it during bootstrap, and expose its `MapProviderType` if needed for clients to request it explicitly.

### Surface discipline reminders

- **Public never imports private** – even when adding helper utilities, keep them under public contracts and re-export from `libs/shared/map/src/public/index.ts:1-17`.
- **Private can import contracts and private contracts** – use the private contracts folder only when implementation wiring requires additional context (provider registry interfaces, creation contexts). Public contracts remain untouched.
- **Runtime is the gatekeeper** – it wires providers, registers them, and ensures the one-way dependency graph remains intact.

Following these case studies keeps the architecture predictable for future contributors and prevents leaking implementation details into clients.

## 6. Client consumption pattern

1. **Import from the public package** – clients always import from `@cloud/shared/map` (i.e. `libs/shared/map/src/public/index.ts:1-17`), which exposes the bootstrap helpers, contracts, and factories without exposing private implementations.
2. **Pick the provider and container** – call `createMapInstanceWithProvider(MapProviderType.CESIUM, containerId, mapOptions)` from `libs/shared/map/src/public/core/factories/map.factory.ts:1-7`/`libs/shared/map/src/runtime/map-instance.ts:34-51`. `mapOptions` can include `viewMode`, `baseMapConfig`, and `providerOptions` for provider-specific settings (`libs/shared/map/src/public/contracts/base/map-options.interface.ts:22-37`).
3. **Initialize the returned `IFlytMap`** – the runtime returns a provider instance that implements `IFlytMap` (`libs/shared/map/src/public/contracts/flyt-map.interface.ts:19-205`). Clients must call `await map.initialize()` before interacting with any managers.
4. **Consume managers and utilities** – use the various manager getters on `IFlytMap` (asset, mission, annotation, grid mission, etc.) documented in `IFlytMap`. All feature managers return interfaces defined in contracts, so the client code stays provider-agnostic while private implementations handle the details.
5. **Pass provider options when needed** – embed provider-specific overrides inside `mapOptions.providerOptions`. They flow through `createMapInstanceWithProvider`, the provider registry, and the provider factory so that Cesium gets the right config without the client importing private types. `CesiumProviderFactory` merges these overrides into `ICesiumProviderConfig` before constructing `CesiumMap` (`libs/shared/map/src/private/map-providers/cesium/cesium-provider-factory.ts:63-80`).
6. **Optional bootstrap control** – bootstrap helpers (`bootstrapMapLibrary`, `resetBootstrap`, `isLibraryBootstrapped`) are exported from the runtime through the public entry, allowing advanced flows to initialize or reset the registry manually if the default side effect is insufficient (`libs/shared/map/src/public/index.ts:4-17`).

## 7. Summary

The current architecture enforces a one-way dependency order via contracts, keeps implementation details private, and exposes a small runtime factory for clients. Public code never imports private modules, runtime is the only layer that bridges public and private, and `MapProviderRegistry` plus `CesiumProviderFactory` ensure providers can be registered, configured, or swapped without touching client code. Follow the workflow above when building a new feature or provider so that the separation of concerns remains intact.
