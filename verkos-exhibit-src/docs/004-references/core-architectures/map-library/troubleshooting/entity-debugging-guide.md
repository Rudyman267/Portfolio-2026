# Entity Debugging Guide (Feature → Flyt Map → Composite → Base)

## Purpose

This guide provides the **fastest** and **most reliable** debugging workflow for entity-related issues in the map library.

The key idea is to debug **from the top of the abstraction down**:

1. Start at the **feature layer** and validate inputs/parameters
2. Reproduce in **Flyt Map** (the map library validation tool) using the same configuration
3. If it’s not a feature-layer issue, drop to the **composite layer**
4. Only then investigate the **base/provider layer**

This avoids wasting time debugging in a client app when the same issue can be reproduced and inspected in Flyt Map.

## Why this order matters

- Feature entities are where **intent** and **configuration** enter the system (options, state transitions, invariants).
- Flyt Map validates behavior through the **public interfaces** without client-app-specific coupling.
- Composite entities are often the source of “visual shape” issues (paths, markers, polygons, labels, vertex editing).
- Base/provider issues are the lowest level and are the most expensive to diagnose (Cesium primitives, render loop, event plumbing).

## Step 1: Start at the feature layer (validate parameters)

### Goal

Prove that the **right configuration** is being passed to the feature you’re debugging.

### What to check (high signal)

- **Options shape**: are you passing the correct options for the feature entity/manager contract?
- **Defaults**: are defaults being applied unexpectedly (e.g., visibility, clampToGround, styles)?
- **State assumptions**: does the feature require an initialization/transition sequence (e.g., mission planners)?
- **Lifecycle calls**: are `remove()` / `dispose()` paths correct for the feature being tested?

### Where to inspect

- Feature implementations:
  - [`libs/shared/map/src/private/feature-entities/`](../../../../libs/shared/map/src/private/feature-entities/)
- Feature contracts:
  - [`libs/shared/map/src/public/contracts/feature-entities/`](../../../../libs/shared/map/src/public/contracts/feature-entities/)

If you can’t explain the behavior using the feature’s inputs/state, don’t jump layers yet—find the exact parameters being passed.

## Step 2: Reproduce in Flyt Map (same configuration)

### Goal

Reproduce the issue using the **same inputs** in Flyt Map so you can debug without the noise of a client app.

Flyt Map is the map library validation app:

- App root: [`apps/flyt-map/`](../../../../apps/flyt-map/)
- Why it exists: [`apps/flyt-map/docs/flyt-map-guide.md`](../../../../apps/flyt-map/docs/flyt-map-guide.md)

Key anchoring implementation points:

- Map initialization uses the shared map library:
  - [`apps/flyt-map/src/app/MapContainer.tsx`](../../../../apps/flyt-map/src/app/MapContainer.tsx)
- Entity testing is organized by layer:
  - base: [`apps/flyt-map/src/entities/base/`](../../../../apps/flyt-map/src/entities/base/)
  - composite: [`apps/flyt-map/src/entities/composite/`](../../../../apps/flyt-map/src/entities/composite/)
  - feature: [`apps/flyt-map/src/entities/feature/`](../../../../apps/flyt-map/src/entities/feature/)

### What to do in Flyt Map

- Select the entity type and apply the **same options** you used in the client app.
- Run the same sequence of operations (create → update → interaction → remove).
- Confirm whether the issue reproduces.

### Interpreting the result

- **If the issue reproduces in Flyt Map**: it is almost certainly a **map library** issue (contracts/implementation), not a client integration issue.
- **If it does not reproduce**: then the client app is likely:
  - passing different parameters than expected
  - performing steps in a different order
  - or depending on app-specific state that is not represented in the map library interface

## Step 3: If it’s not feature-level, drop to the composite layer

### When to do this

After you have verified:

- the feature inputs are correct, and
- the issue reproduces in Flyt Map (or the behavior is clearly internal)

Composite layer is the best next target for:

- polyline/polygon/circle editing issues
- vertex handles / distance labels / helper markers issues
- “shape not updating” bugs that are downstream of a feature entity

Where to inspect:

- Composite implementations:
  - [`libs/shared/map/src/private/composite-entities/`](../../../../libs/shared/map/src/private/composite-entities/)
- Composite contracts (internal):
  - [`libs/shared/map/src/private/contracts/composite-entities/`](../../../../libs/shared/map/src/private/contracts/composite-entities/)

## Step 4: Base/provider layer (last)

Only after you’ve ruled out feature + composite behavior should you inspect the base/provider layer.

This is usually required for:

- Cesium entity primitives not updating
- render loop / WebGL issues
- input events not firing (click/drag/hover plumbing)

Where to inspect:

- Provider implementation:
  - [`libs/shared/map/src/private/map-providers/cesium/`](../../../../libs/shared/map/src/private/map-providers/cesium/)
- Base entity contracts:
  - [`libs/shared/map/src/private/contracts/base-entities/`](../../../../libs/shared/map/src/private/contracts/base-entities/)

For render-specific failures, also use the public render error hooks:

- `IFlytMap.onRenderError(listener)` / `IFlytMap.offRenderError(listener)`
  - contract: [`libs/shared/map/src/public/contracts/flyt-map.interface.ts`](../../../../libs/shared/map/src/public/contracts/flyt-map.interface.ts)

## “Client app debugging” is the last resort

If Flyt Map reproduces the issue, debug in Flyt Map first.

Only debug in client apps when:

- the issue cannot be expressed through the map library public interfaces, or
- the bug is demonstrably in the client integration layer (state sync, UI timing, container sizing).

## Related documents

- [`debugging-guide.md`](./debugging-guide.md)
- [`common-issues.md`](./common-issues.md)
- Testing workflow (Flyt Map gate): [`docs/002-modules/map-library/integration/testing-strategies.md`](../integration/testing-strategies.md)


