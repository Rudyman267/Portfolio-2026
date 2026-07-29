# React Optimization Guidelines for Real-Time Telemetry

## Overview

This document captures the optimization patterns implemented in the drone table component for handling real-time telemetry data. These optimizations are critical for components that receive frequent WebSocket updates.

## Transitioning from Angular to React: Key Differences

When moving from an Angular background to React, several fundamental differences can cause challenges:

### 1. Component Organization Differences

**Angular Approach**:

- Clear separation of components, services, and modules
- Files are typically smaller with clearer responsibilities
- Template (HTML), logic (TS), and styling (CSS) are separate files
- Dependency injection handling relationships between components

**React Approach**:

- More flexible component organization
- Components often contain JSX, logic, and sometimes styles
- Larger components are common, but can be refactored
- Props passing for component relationships

### 2. File Structure for Large Components

Breaking down large React components is necessary for maintainability. In our drone table refactoring, we used this structure:

```
/app/features/drone-management/
  ├── components/
  │   ├── DroneList.tsx (main container, minimal logic)
  │   ├── ui/
  │   │   ├── StatusIndicator.tsx
  │   │   └── other small UI components
  │   └── table/
  │       ├── columns.tsx (column definitions)
  │       ├── DroneTableHeader.tsx
  │       └── other table-specific components
  ├── transformers/
  │   └── drone-table-transformer.ts (data transformation logic)
  └── types/
      └── drone-table.types.ts (interfaces and types)
```

This structure separates concerns while maintaining React patterns:

- Container component handles data fetching and coordination
- UI components handle rendering and interactions
- Transformers handle data processing
- Types provide structure for data

### 3. Angular Services vs. React Hooks

**Angular Services**:

- Singleton services with dependency injection
- Clear separation from components
- Handle data fetching, transformation, and state

**React Hooks**:

- Custom hooks for reusable logic
- Created within the same file or separate files
- Handle data fetching, transformation, and state

In our implementation, we created these hooks to mimic Angular service patterns:

- `useDrones` - central data fetching and state management
- `useMemoizedColumns` - column configuration logic

## Key Optimization Patterns Implemented

### 1. Function Reference Stability with useRef + useCallback

We stabilized function references to prevent unnecessary re-renders using the useRef + useCallback pattern:

```jsx
// Problem: Function recreated on every render when state changes
const isDroneViewed = useCallback(
  (id) => {
    return viewedDrones.includes(id);
  },
  [viewedDrones]
); // Dependency on changing state

// Solution: Cache the state in a ref and create truly stable function
const viewedDronesRef = useRef(viewedDrones);
viewedDronesRef.current = viewedDrones; // Update ref on each render

const isDroneViewed = useCallback((id) => {
  return viewedDronesRef.current.includes(id);
}, []); // Empty dependency array = stable forever
```

This pattern ensures the function reference never changes, even when the underlying data changes.

### 2. Structural Sharing for Object Updates

We implemented structural sharing to only update properties that have changed:

```jsx
// Problem: Creating entirely new objects
const newDroneData = {
  id: drone.id,
  name: drone.name,
  battery: displayBattery,
  altitude: displayAltitude,
  // All other properties
};

// Solution: Only update properties that changed using conditional spreading
newDroneData = {
  ...prevDroneData,
  // Only add properties that have changed
  ...(prevDroneData.name !== newName && { name: newName }),
  ...(prevDroneData.battery !== displayBattery && { battery: displayBattery }),
  // Always update critical properties
  systemState,
  bindingId: drone.bindingId,
};
```

This pattern ensures that only properties that actually changed get new references, allowing React to avoid re-rendering components that display unchanged data.

### 3. Array Reference Stability

We maintain array reference stability by only creating new arrays when data has changed:

```jsx
// Check if data or sorting order changed
if (!hasDataChanged && !hasSortingChanged && previousArray) {
  // Nothing changed, reuse the previous array reference
  finalArray = previousArray;
} else {
  // Create new sorted array only when needed
  finalArray = resultArray.sort(/* sorting logic */);
  // Store for future reference
  previousArray = finalArray;
}
```

This prevents unnecessary re-renders of table components when the data hasn't actually changed.

### 4. Cell-level Memoization

We implemented cell-level memoization to ensure only cells with changed data re-render:

```jsx
// Memoized cell component using React.memo
const MemoizedCell = React.memo(({ cell, row }) => {
  return flexRender(cell.column.columnDef.cell, cell.getContext());
}, arePropsEqual);

// Equality check based on row reference stability
function arePropsEqual(prev, next) {
  return prev.row.original === next.row.original;
}

// Use in DataTable
const OptimizedDataTable = React.memo(({ columns, data, ...rest }) => {
  const cellRenderer = useCallback(({ cell, row }) => {
    return <MemoizedCell cell={cell} row={row} />;
  }, []);

  return <DataTable columns={columns} data={data} {...rest} cellRenderer={cellRenderer} />;
});
```

This granular approach ensures that when a single cell's data changes, only that specific cell re-renders instead of the entire row or table.

### 5. Complex Object Comparison

For complex objects like systemState, we used JSON.stringify for deep comparison:

```jsx
// Add systemState reference check to determine if data changed
const hasRenderingDataChanged =
  prevDroneData.battery !== displayBattery ||
  // Other simple property comparisons
  // ...
  // Deep comparison for complex objects
  JSON.stringify(prevDroneData.systemState) !== JSON.stringify(systemState);
```

This ensures we detect changes in nested objects properly, without requiring complex comparison logic.

### 6. Critical Property Handling

We identified and properly handled properties critical for UI indicators:

```jsx
newDroneData = {
  ...prevDroneData,
  // Conditional updates for display properties
  ...(prevDroneData.battery !== displayBattery && { battery: displayBattery }),
  // Always update these properties for UI state indicators
  systemState,
  bindingId: drone.bindingId,
};
```

This ensures that properties needed for connection status and armed status indicators are always up to date, even when implementing reference stability optimizations.

## Debugging and Performance Testing Applied

We implemented temporary debugging logs to trace data flow and verify optimizations:

```jsx
// Debug component renders
console.log(`[DEBUG:COMPONENT] DroneList render #${renderCount.current}`);

// Debug transformer behavior
console.log(`[DEBUG:TRANSFORM] Changed properties: ${changedProps.join(', ')} (out of ${Object.keys(prevDroneData).length} total properties)`);

// Debug reference stability
console.log(`[DEBUG:TABLE] ${sameRefs.length}/${Math.min(data.length, prevData.length)} rows have stable references`);
```

These logs helped identify unnecessary renders and verify our optimizations were working as expected.

## Performance Results and Benefits

The implemented optimizations resulted in:

1. **Cell-Level Updates**: Only cells with changed data re-render
2. **Reduced Render Count**: Components render only when their specific data changes
3. **Smooth Real-Time Updates**: Table remains responsive even with frequent updates
4. **Preserved UI State**: Connection status and armed status indicators work correctly

## Best Practices Derived

Based on our implementation, follow these practices when working with real-time data in React:

1. **Stabilize Function References**: Use the useRef + useCallback pattern for callbacks that access changing state
2. **Implement Structural Sharing**: Only update properties that have actually changed
3. **Maintain Array Stability**: Only create new arrays when content has meaningfully changed
4. **Memoize at Cell Level**: Use cell-level memoization for tables with real-time updates
5. **Handle Complex Objects**: Use JSON.stringify for comparing complex nested objects
6. **Identify Critical Properties**: Always update properties that affect UI state indicators

These patterns ensure efficient handling of real-time data while maintaining UI responsiveness.

## React Project Structure Guidelines Based on Our Experience

To address the challenges of organizing larger React applications, especially when coming from Angular, we've found these approaches helpful:

### 1. Feature-Based Organization

Organize code by feature/domain rather than by function:

```
/app
  /features
    /drone-management     # Everything related to drone management
    /map-visualization    # Everything related to the map
    /user-account         # Everything related to user accounts
  /shared                 # Shared hooks, components, and utilities
```

This helps in:

- Keeping related code together
- Making it easier to understand the application by domain
- Allowing developers to work on specific features with minimal overlap

### 2. Component Decomposition Strategy

When a component grows beyond 300 lines, consider breaking it down:

1. **Identify Self-Contained UI Elements**:

   - Extract status indicators, buttons, cards into separate components

2. **Separate Data Processing**:

   - Move data transformation logic to transformer files
   - Create custom hooks for data fetching and processing

3. **Extract Complex Rendering Logic**:

   - Move table column definitions to separate files
   - Extract form field configurations

4. **Create Subcomponent Directories**:
   - Group related smaller components in a directory
   - Use index.ts files to simplify imports

### 3. Where to Place Logic in React Applications

Instead of Angular's services, place logic in:

1. **Custom Hooks**:

   - Data fetching logic
   - State management
   - Side effects

2. **Transformer Files**:

   - Data formatting and transformation
   - Complex calculations

3. **Utility Functions**:

   - Pure functions for data manipulation
   - Helper functions

4. **Context Providers**:
   - Application-wide state
   - Configuration

### 4. Code Review Checklist for React Components

When reviewing React code:

1. **Component Size**:

   - Is this component too large? (>300 lines is a warning sign)
   - Can it be broken down into smaller components?

2. **State Management**:

   - Is state placed at the appropriate level?
   - Are we avoiding prop drilling with proper state management?

3. **Performance Considerations**:

   - Are expensive operations memoized?
   - Are components re-rendering unnecessarily?

4. **Code Organization**:

   - Is the JSX separate from business logic?
   - Are transformations separated from rendering?

5. **React Patterns**:
   - Are we using hooks correctly?
   - Is the component focused on a single responsibility?

By following these guidelines, we can maintain a more organized and maintainable React codebase while leveraging the strengths of React's component model.
