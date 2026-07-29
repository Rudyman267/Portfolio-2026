# Map Library Integration (Cesium 3D)

## Overview

Integrate Cesium-based 3D map library from `@libs/shared/map`.

## Reference Apps

- **mission-planner** - Mission planning, waypoints, 3D visualization
- **flyt-map** - Standalone map with annotations

## Prerequisites

### 1. Install Vite Cesium Plugin

Already configured in `vite.config.ts` (uncomment if needed):

```typescript
import cesium from 'vite-plugin-cesium';

plugins: [
  cesium(), // Add this
  // ...
];
```

### 2. Add Cesium Token to Environment

**File**: `src/environments/environment.dev.ts`

```typescript
export const environment = {
  // ... existing config
  cesium: {
    ionToken: 'your-cesium-ion-token',
  },
};
```

### 3. Import Map Components

```typescript
import { MapProvider } from '@/contexts/MapContext';
// Or copy from: apps/mission-planner/src/contexts/MapContext.tsx
```

## Quick Usage

### 1. Add MapProvider (Optional)

```typescript
// App.tsx
<HttpProvider>
  <MapProvider>
    {' '}
    {/* Add for app-wide map state */}
    <RouterProvider router={router} />
  </MapProvider>
</HttpProvider>
```

### 2. Use Map in Component

```typescript
import { Map } from '@map/public';

function MyMapPage() {
  return (
    <div className="h-screen w-full">
      <Map
        initialPosition={{
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: 1000,
        }}
        onReady={(viewer) => {
          console.log('Map ready:', viewer);
        }}
      />
    </div>
  );
}
```

## Map Assets

Copy map assets to `public/assets/map/` from mission-planner if needed.

## Performance Tips

- Lazy load map component
- Limit entity count for performance
- Use clustering for many markers

## Reference

- **Full Implementation**: `apps/mission-planner/src/components/Map/`
- **Map Library Docs**: `/libs/shared/map/docs/`
