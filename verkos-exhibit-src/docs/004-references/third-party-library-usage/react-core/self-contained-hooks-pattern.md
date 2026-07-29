# Self-Contained Hooks Pattern

## Overview

The Self-Contained Hooks Pattern is a React architecture pattern that prevents unnecessary component re-renders by moving side effects (like map plotting, data processing, etc.) inside hooks rather than returning data that triggers re-renders in components.

## Problem Statement

Traditional data hooks return state that causes consuming components to re-render on every data change, even when the component doesn't need to update its UI. This leads to performance issues, especially with frequently updating data like telemetry, annotations, or real-time position updates.

### Example of the Problem

```typescript
// ❌ PROBLEMATIC PATTERN
const MapComponent = () => {
  // This causes re-renders when annotations change
  const { annotations, isLoading, error } = useAnnotations();

  // This runs AFTER re-render, causing more work
  useEffect(() => {
    if (!annotationManager || !annotations) return;

    // Heavy plotting operations run on every re-render
    plotAnnotations(annotations);
  }, [annotations, annotationManager]);

  return null; // Component doesn't even render UI!
};
```

**Problems:**

- Component re-renders on every data change
- Heavy operations run after re-render
- Poor performance with frequent updates
- Unnecessary React overhead

## Solution: Self-Contained Hooks

Move side effects inside the hook itself, accessing required dependencies internally, and return minimal or no data to prevent re-renders.

### Implementation Pattern

```typescript
// ✅ GOOD PATTERN - Self-Contained Hook
export function useAnnotationPlotting() {
  // 1. Fetch data internally
  const { data: annotations, isLoading, error } = useQuery(/* ... */);

  // 2. Access required managers/dependencies internally
  const { mapInstance, isInitialized } = useMapInstance();
  const annotationManager = useMemo(() => {
    return isInitialized && mapInstance ? mapInstance.getAnnotationManager() : null;
  }, [isInitialized, mapInstance]);

  // 3. Handle side effects internally
  useEffect(() => {
    if (!annotationManager || !annotations) return;

    // Direct store access - no component state updates
    const clearCollection = useMapEntitiesStore.getState().clearCollection;
    const addToStore = useMapEntitiesStore.getState().addMapEntityToStore;

    clearCollection('annotationCollection');
    annotations.forEach((annotation) => {
      const marker = annotationManager.createAnnotationMarker({
        position: {
          latitude: annotation.lat,
          longitude: annotation.lng,
          altitude: annotation.alt || 0,
        },
        color: annotation.color,
        labelText: annotation.description,
      });
      addToStore('annotationCollection', marker.id, annotation._id);
    });
  }, [annotations, annotationManager]);

  // 4. Return minimal state (or nothing)
  return { isLoading, error }; // No data that causes re-renders
}
```

```typescript
// ✅ CLEAN COMPONENT USAGE
const MapComponent = () => {
  // Zero re-renders from annotation changes!
  useAnnotationPlotting();

  // Component focuses only on its own concerns
  return null;
};
```

## Benefits

### Performance Benefits

- **Zero Re-renders**: Components don't re-render on data changes
- **Direct Updates**: Side effects happen without React overhead
- **Efficient Operations**: Heavy operations run only when necessary

### Architecture Benefits

- **Separation of Concerns**: Data logic separate from UI logic
- **Self-Contained**: All related logic in one place
- **Reusable**: Hook can be used anywhere without setup
- **Testable**: Hook logic isolated and easy to test

### Developer Experience

- **Simple Usage**: Just call the hook, no parameters needed
- **No Boilerplate**: No useEffect setup in components
- **Clear Intent**: Hook name describes what it does

## Use Cases

### Real-time Data Plotting

```typescript
export function useSensorMapIntegration() {
  const { sensors } = useSensors();
  const sensorPositions = useSensorsStore((state) => state.sensors);
  const { mapInstance, isInitialized } = useMapInstance();

  const annotationManager = useMemo(() => (isInitialized && mapInstance ? mapInstance.getAnnotationManager() : null), [isInitialized, mapInstance]);

  useEffect(() => {
    if (!annotationManager) return;

    // Plot sensor markers directly
    const sensorsWithPositions = sensors
      .map((sensor) => ({
        ...sensor,
        position: sensorPositions[sensor._id],
      }))
      .filter((sensor) => sensor.position);

    // Clear and re-plot
    const clearCollection = useMapEntitiesStore.getState().clearCollection;
    clearCollection('sensorCollection');

    sensorsWithPositions.forEach((sensor) => {
      const marker = annotationManager.createAnnotationMarker({
        position: sensor.position,
        labelText: sensor.name,
      });
    });
  }, [sensors, sensorPositions, annotationManager]);
}
```

### Drone Position Updates

```typescript
export function useDronePositionPlotting() {
  const dronesData = useAllDronesIntegratedData();
  const { mapInstance, isInitialized } = useMapInstance();

  const droneManager = useMemo(() => (isInitialized && mapInstance ? mapInstance.getDroneManager() : null), [isInitialized, mapInstance]);

  useEffect(() => {
    if (!droneManager) return;

    Object.entries(dronesData).forEach(([droneId, data]) => {
      if (data.position) {
        // Update drone position directly
        const droneModel = droneManager.getDroneModel(droneId);
        if (droneModel) {
          droneModel.updatePosition(data.position);
        } else {
          droneManager.createDroneModel({
            id: droneId,
            position: data.position,
          });
        }
      }
    });
  }, [dronesData, droneManager]);
}
```

## Best Practices

### 1. Internal Dependencies

Always access managers and stores internally rather than passing them as parameters:

```typescript
// ✅ Good - Internal access
export function useMapDataPlotting() {
  const { mapInstance } = useMapInstance();
  const manager = useMemo(() => mapInstance?.getManager(), [mapInstance]);
  // ...
}

// ❌ Avoid - External parameters
export function useMapDataPlotting({ manager }) {
  // Requires setup in every component
}
```

### 2. Store Access

Use direct store access to avoid triggering component updates:

```typescript
// ✅ Good - Direct store access
const addToStore = useMapEntitiesStore.getState().addMapEntityToStore;
addToStore('collection', entityId, data);

// ❌ Avoid - Component state updates
const { addMapEntityToStore } = useMapEntitiesStore();
addMapEntityToStore('collection', entityId, data);
```

### 3. Return Policy

Only return essential state that components actually need:

```typescript
// ✅ Good - Minimal returns
return { isLoading, error };

// ✅ Good - Nothing if not needed
return; // or no return statement

// ❌ Avoid - Data that causes re-renders
return { data, processedData, computedValues };
```

### 4. Hook Naming

Use descriptive names that indicate the hook handles side effects:

```typescript
// ✅ Good names
useAnnotationPlotting();
useSensorMapIntegration();
useDronePositionUpdates();

// ❌ Unclear names
useAnnotations();
useSensors();
useDrones();
```

## When to Use This Pattern

### Perfect For:

- **Map plotting operations**
- **Real-time data visualization**
- **Telemetry processing**
- **Side effects that don't affect UI**
- **High-frequency data updates**

### Not Suitable For:

- **UI state management**
- **Form data handling**
- **Component-specific state**
- **Data that drives UI rendering**

## Migration Strategy

### Step 1: Identify Problematic Hooks

Look for hooks that return data used only in useEffect:

```typescript
// 🔍 Identify this pattern
const { data } = useDataHook();
useEffect(() => {
  processingFunction(data);
}, [data]);
```

### Step 2: Move Logic to Hook

Move the useEffect logic inside the hook:

```typescript
// ✅ Move to hook
export function useDataProcessing() {
  const { data } = useDataHook();

  useEffect(() => {
    processingFunction(data);
  }, [data]);

  return; // No data returned
}
```

### Step 3: Update Component

Replace data hook with processing hook:

```typescript
// ✅ Clean component
const Component = () => {
  useDataProcessing(); // No re-renders!
  return <div>Component UI</div>;
};
```

## Testing

### Testing Self-Contained Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { useAnnotationPlotting } from './useAnnotationPlotting';

test('should plot annotations when data changes', () => {
  const mockManager = createMockAnnotationManager();

  renderHook(() => useAnnotationPlotting(), {
    wrapper: ({ children }) => <MockMapProvider manager={mockManager}>{children}</MockMapProvider>,
  });

  // Assert plotting operations were called
  expect(mockManager.createAnnotationMarker).toHaveBeenCalled();
});
```

## Common Pitfalls

### 1. Forgetting Internal Access

```typescript
// ❌ Wrong - Requires external setup
export function useMapHook(manager) {
  // Hook requires parameter
}

// ✅ Right - Self-contained
export function useMapHook() {
  const manager = useInternalManager();
  // Hook is self-contained
}
```

### 2. Returning Too Much Data

```typescript
// ❌ Wrong - Causes re-renders
return { data, processedData, metadata };

// ✅ Right - Minimal returns
return { isLoading, error };
```

### 3. Component State Updates

```typescript
// ❌ Wrong - Triggers re-renders
const { addToStore } = useStore();

// ✅ Right - Direct access
const addToStore = useStore.getState().addToStore;
```

## Conclusion

The Self-Contained Hooks Pattern is a powerful architectural approach for building performant React applications that handle real-time data and side effects. By keeping side effects inside hooks and returning minimal state, we can eliminate unnecessary re-renders and improve application performance significantly.

This pattern is especially valuable in map-based applications, real-time dashboards, and any application that processes high-frequency data updates.
