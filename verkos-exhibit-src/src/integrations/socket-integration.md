# Socket.IO Real-Time Integration

## Overview

Add real-time WebSocket communication using Socket.IO client from `@libs/shared/socket`.

## Reference Apps

- **fleet** - Real-time drone monitoring, video streams
- **mission-planner** - Live mission updates, telemetry

## Quick Setup

### 1. Import Socket Client

```typescript
import { useDroneSubscription } from '@libs/shared/socket';
import { SOCKET_TOPICS } from '@libs/shared/socket/enums';
```

### 2. Use Subscription Hooks

```typescript
function MyComponent() {
  const { data, isConnected } = useDroneSubscription({
    droneId: 'drone-123',
    onData: (telemetry) => {
      console.log('Received:', telemetry);
    },
  });

  return <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>;
}
```

### 3. Update Zustand Store (Optional)

```typescript
import { useDroneStore } from '@/store/slices/drone.slice';

function MyComponent() {
  const updateDrone = useDroneStore((state) => state.updateDrone);

  useDroneSubscription({
    droneId: 'drone-123',
    onData: (telemetry) => {
      updateDrone(telemetry); // Update store
    },
  });
}
```

## Available Subscriptions

From `@libs/shared/socket`:

- `useDroneSubscription` - Drone telemetry
- `useDockingStationSubscription` - Docking station status
- `useSensorSubscription` - Sensor data streams

## Common Patterns

- Subscribe in useEffect hooks
- Unsubscribe on component unmount
- Update Zustand stores, not local state
- Show connection status to user

## Example from Fleet

See: `apps/fleet/src/app/features/dashboard/` for real-world usage
