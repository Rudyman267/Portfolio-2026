# FlytBase Map Library

> A comprehensive 3D mapping library for drone fleet management and robotics applications

## Overview

The FlytBase Map Library provides a powerful, TypeScript-first mapping solution built specifically for drone operations, fleet management, and robotics applications. Built on Cesium for 3D visualization, it offers high-level abstractions while maintaining flexibility and performance.

### Key Features

- **🚁 Drone Visualization** - Real-time 3D drone models with telemetry integration
- **🗺️ Mission Planning** - Linear mission planning with waypoint management
- **🚧 Geofencing** - Circular and polygon zones for operational boundaries
- **📍 Annotations** - Markers, polygons, and polylines for map annotations
- **🎨 Asset Management** - Imagery overlays, terrain, and 3D models
- **⚡ Real-time Updates** - Live telemetry and event-driven architecture
- **🔧 Provider Agnostic** - Abstracted design allows provider flexibility
- **📱 Framework Ready** - React hooks and components included

## Quick Start

### Installation

```bash
# Install the map library
npm install @libs/shared/map

# Peer dependencies (if not already installed)
npm install cesium @types/cesium
```

### Basic Usage

```typescript
import { createMapInstance } from '@libs/shared/map';

// Initialize map
const map = createMapInstance('map-container');
await map.initialize();

// Add a drone
const droneManager = map.getDroneManager();
const drone = droneManager.createDroneModel({
  position: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  modelUri: 'models/drone.glb',
  labelText: 'Drone 1',
});

// Handle events
map.onGlobalEvent('ENTITY_CLICK', (event) => {
  console.log('Clicked entity:', event.entity);
});
```

### React Integration

```typescript
import { useFlytMap, useMapEntities } from '@libs/shared/map/react';

function DroneMap() {
  const map = useFlytMap('map-container');
  const entities = useMapEntities(map);

  return <div id="map-container" style={{ width: '100%', height: '500px' }} />;
}
```

### Import Notes (Post-migration)

- **Public API**: import from `@libs/shared/map` (root entrypoint).
- **Public subpaths**:
  - `@map/types/*`, `@map/utils/*`, `@map/constants/*` now resolve to `libs/shared/map/src/public/core/**`.
  - `@map/public/*` remains supported, but is now a **shim** to the canonical `src/public/**` implementation.
- **Private APIs**: `@map/private/{base,cesium,composite,features}/*` resolve to `libs/shared/map/src/private/**`.

## Architecture

The library follows a layered architecture that provides clear separation of concerns:

```
Application Layer
    ↓
Public API (IFlytMap)
    ↓
Feature Managers (Domain-specific)
    ↓
Composite Entities (FlytBridge)
    ↓
Base Entities (Primitives)
    ↓
Map Provider (Cesium)
```

### Core Components

- **IFlytMap** - Main interface providing access to all functionality
- **Managers** - Domain-specific factories for creating and managing entities
- **Entities** - Map objects with lifecycle management and event handling
- **Event System** - Real-time communication between components
- **Provider Abstraction** - Flexible backend implementation

## Documentation

### 🎯 **New to the Map Library?** → [docs/README.md](docs/README.md)

**Start here for complete navigation and learning paths tailored to your needs.**

### 📚 **Key Documentation**

| Document                                                      | Purpose                     | Best For                       |
| ------------------------------------------------------------- | --------------------------- | ------------------------------ |
| **[📖 docs/README.md](docs/README.md)**                       | Navigation & learning paths | **Everyone - start here**      |
| **[📚 docs/getting-started.md](docs/getting-started.md)**     | Complete learning guide     | Developers new to the library  |
| **[🔧 docs/api/](docs/api/)**                                 | API reference               | Finding specific methods       |
| **[🏗️ docs/architecture/](docs/architecture/)**               | System architecture         | Understanding design decisions |
| **[💡 docs/guides/](docs/guides/)**                           | Usage examples              | Implementing specific features |
| **[⚛️ docs/integration/react.md](docs/integration/react.md)** | React integration           | React developers               |

### 🚀 **Quick Start Paths**

Choose your path based on your immediate needs:

```
🟢 Just Getting Started
README.md → docs/getting-started.md (Getting Started) → Try Quick Start example

🟡 Building a Feature
README.md → docs/README.md → Choose your feature path

🔴 Understanding Architecture
README.md → docs/architecture/overview.md → docs/architecture/detailed-architecture.md
```

## Feature Overview

### Drone Management

Create and manage 3D drone models with real-time telemetry:

```typescript
const drone = map.getDroneManager().createDroneModel({
  position: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
  modelUri: 'models/quadcopter.glb',
  showTrace: true,
  labelText: 'Patrol Drone',
});
```

### Mission Planning

Plan linear missions with waypoints and altitude control:

```typescript
const mission = map.getMissionPlannerManager().createNewLinearMission({
  referencePoint: { latitude: 37.7749, longitude: -122.4194, altitude: 0 },
  routeAltitudeSettings: { cruisingAltitude: 100 },
});
```

### Geofencing

Create operational zones and no-fly zones:

```typescript
const zone = map.getZoneManager().createCircularZone({
  position: { latitude: 37.7749, longitude: -122.4194, altitude: 0 },
  radius: 1000,
  zoneType: 'GEOFENCE',
});
```

### Annotations

Add markers, polygons, and polylines for visualization:

```typescript
const marker = map.getAnnotationManager().createAnnotationMarker({
  position: { latitude: 37.7749, longitude: -122.4194, altitude: 0 },
  labelText: 'Point of Interest',
});
```

## Development

### Setup

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Run tests
nx test shared-map

# Build library
nx build shared-map
```

### Testing

The library maintains comprehensive test coverage:

```bash
# Run all tests
nx test shared-map

# Run tests with coverage
nx test shared-map --coverage

# Run tests in watch mode
nx test shared-map --watch
```

#### Coverage Requirements

- Statements: 80%
- Branches: 75%
- Functions: 75%
- Lines: 80%

### Contributing

1. **Write tests** for all new functionality
2. **Follow TypeScript best practices** with proper type definitions
3. **Use the established patterns** for entity creation and management
4. **Document public APIs** with JSDoc comments
5. **Test across different browsers** and environments

## Browser Support

- **Chrome** 90+ (recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

WebGL 2.0 support is required for 3D visualization.

## Performance Considerations

- **Entity Limits** - Recommended maximum of 100 active entities
- **Update Frequency** - Batch updates for better performance
- **Visibility Management** - Use visibility culling for large datasets
- **Memory Management** - Properly dispose of entities when no longer needed

## Support

- **📋 Issues** - Report bugs and feature requests via GitHub Issues
- **📚 Documentation** - Full documentation available in `/docs`
- **💡 Examples** - Sample implementations in the onboarding guide
- **🤝 Community** - Join discussions with the development team

## License

MIT License - see LICENSE file for details.

---

**Ready to get started?** Check out the [Getting Started Guide](docs/getting-started.md) for a comprehensive walkthrough of all features and best practices.
