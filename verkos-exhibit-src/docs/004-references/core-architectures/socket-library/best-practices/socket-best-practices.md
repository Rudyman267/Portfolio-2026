# Socket Best Practices

## Managing Callbacks Efficiently

While our socket implementation efficiently handles reference counting for subscriptions (ensuring only one actual socket connection per unique topic), multiple components subscribing to the same topic can still lead to multiple callbacks being registered. This document outlines best practices for managing callbacks efficiently.

## The Challenge

Consider this scenario:

1. Component A subscribes to `drone-123/position` with callback A
2. Component B subscribes to `drone-123/position` with callback B
3. Component C subscribes to `drone-123/position` with callback C

The socket client will create only one actual socket subscription, but will register and call all three callbacks whenever data arrives. This can lead to:

- Redundant processing of the same data
- Potential performance issues with many callbacks
- Duplicate state updates

## Recommended Approach

### 1. Centralized State Management

Use a centralized state management layer (like the drone state store) that:

- Makes a single subscription per topic
- Updates a central store
- Allows components to selectively access only the data they need

```typescript
// Inside state layer (e.g., useDroneData.ts)
function useDroneData() {
  useEffect(() => {
    // One subscription that updates central store
    const unsubscribe = socketStore.subscribe(topic, {
      callback: (data) => {
        // Update central store once
        updateDroneState(data);
      },
    });

    return unsubscribe;
  }, [topic]);

  // Components can access specific parts of the state
  return {
    getDronePosition: (droneId) => state.drones[droneId]?.position,
    getDroneBattery: (droneId) => state.drones[droneId]?.battery,
    // ...other selectors
  };
}
```

### 2. Component-Specific Selectors

Components should use selectors to access only the specific data they need:

```typescript
function BatteryIndicator({ droneId }) {
  // Only subscribes to battery changes, not all drone data
  const battery = useDronesStore((state) => state.drones[droneId]?.battery);

  return <div>{battery?.level}%</div>;
}
```

### 3. Domain-Specific Hooks

Create domain-specific hooks that abstract subscription management:

```typescript
// High-level hook that components actually use
function useDronePosition(droneId) {
  // This hook doesn't create subscriptions directly
  // It just selects from the store that's already subscribed
  return useDronesStore((state) => state.drones[droneId]?.position);
}

// Usage in component
function PositionDisplay({ droneId }) {
  const position = useDronePosition(droneId);

  return (
    <div>
      <div>Lat: {position?.latitude}</div>
      <div>Lng: {position?.longitude}</div>
    </div>
  );
}
```

## Implementation Example

Here's how this should be structured in the codebase:

### 1. Socket Layer (Already Implemented)

- Handles raw socket connections
- Manages reference counting for subscriptions
- Accepts and calls multiple callbacks per topic

> **Important**: While the socket layer has the capability to handle multiple callbacks per topic, our state layer implementation should prevent this by not exposing callback options to consumers.

### 2. State Layer

```typescript
// In drone state module
function initializeDroneSubscriptions(droneIds, topics) {
  // Keep track of unsubscribe functions
  const unsubscribeFunctions = [];

  // Subscribe to each topic for each drone
  droneIds.forEach((droneId) => {
    topics.forEach((topic) => {
      // Create full topic path
      const fullTopic = formatDeviceTopic(topic, droneId);

      // ONE subscription per unique topic
      const unsubscribe = socketStore.subscribe(fullTopic, {
        callback: (data) => {
          // Update central store
          dronesStore.updateDroneProperty(droneId, topic, data);
        },
      });

      unsubscribeFunctions.push(unsubscribe);
    });
  });

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach((fn) => fn());
  };
}
```

### 3. Component Layer

```typescript
// Component NEVER subscribes directly
function DroneComponent({ droneId }) {
  // Just use selectors to get the data
  const position = useDronesStore((state) => state.drones[droneId]?.position);
  const battery = useDronesStore((state) => state.drones[droneId]?.battery);

  return (
    <div>
      <PositionDisplay position={position} />
      <BatteryIndicator level={battery?.level} />
    </div>
  );
}
```

## API Design: Preventing Callback Leakage

Our drone state API is explicitly designed to prevent consumers from passing their own callbacks by simply not including the callback option in the API at all:

```typescript
// The API defines its own options type without a callback option
function useDrones(
  droneIds: string | string[],
  topics: TopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
    // No callback option at all!
  }
) {
  // ...implementation
}
```

This design ensures that:

1. The drone state layer has full control over updating state
2. Consumers cannot bypass the central state by providing direct callbacks
3. All data flows through a single path, maintaining consistency

## Benefits of This Approach

1. **Single Source of Truth**: All components read from the same state
2. **Performance**: Only one callback processes incoming data
3. **Consistency**: Prevents duplicate or conflicting updates
4. **Separation of Concerns**: Components focus on rendering, state layer on data management
5. **Simplicity**: Components don't need to manage subscriptions
6. **Enforced Architecture**: API design prevents circumventing the pattern

## Anti-Patterns to Avoid

1. **Direct Component Subscriptions**: Components should not subscribe directly to socket topics

   ```typescript
   // DON'T DO THIS
   function BadComponent({ droneId }) {
     useEffect(() => {
       const unsubscribe = socketStore.subscribe(formatDeviceTopic('position', droneId), { callback: (data) => setPosition(data) });
       return unsubscribe;
     }, [droneId]);
   }
   ```

2. **Duplicate State**: Don't keep the same data in multiple state stores

   ```typescript
   // DON'T DO THIS
   const [position, setPosition] = useState(null);
   // This creates parallel state that can get out of sync with the store
   ```

3. **One Component, One Subscription**: Don't create a new module/state for each component's needs
   ```typescript
   // DON'T DO THIS
   // Creating separate hooks that each make their own subscriptions
   function useDronePosition(droneId) {
     /* makes its own subscription */
   }
   function useDroneBattery(droneId) {
     /* makes its own subscription */
   }
   ```

By following these best practices, we can ensure efficient use of socket resources while maintaining a clean, maintainable architecture.
