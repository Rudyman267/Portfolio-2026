# Socket Client Implementation

## Overview

The `SocketClient` class provides a robust implementation for real-time socket communication. It handles the complexities of socket.io connections, subscription management, and efficient event handling with a clean, topic-based API.

## Key Features

- **Advanced Subscription Management**: Reference counting for topics to prevent duplicate listeners
- **Connection Resilience**: Automatic reconnection and resubscription
- **Performance Optimization**: Optional throttling for high-frequency messages
- **Flexible Callbacks**: Support for multiple callbacks per topic
- **Data Transformation**: Optional transformation of incoming data

## API Reference

### Constructor

```typescript
constructor(private readonly config: SocketConfig)
```

Creates a new SocketClient instance with the provided configuration.

#### Parameters

- `config`: The socket connection configuration

### Connection Methods

#### connect

```typescript
public connect(): Promise<void>
```

Establishes a connection to the socket server using the provided configuration.

#### disconnect

```typescript
public disconnect(): void
```

Disconnects from the socket server and cleans up all subscriptions.

#### isConnected

```typescript
public isConnected(): boolean
```

Returns the current connection status.

#### getSocket

```typescript
public getSocket(): Socket | null
```

Returns the underlying socket.io Socket instance if connected.

### Subscription Methods

#### subscribe

```typescript
public subscribe<T>(
  topic: string,
  options?: SubscriptionOptions
): () => void
```

Subscribes to a specific topic with reference counting. Returns an unsubscribe function.

##### Parameters

- `topic`: The full topic path to subscribe to
- `options`: Optional configuration for the subscription:
  - `throttle`: Optional throttling in milliseconds
  - `transform`: Optional data transformation function
  - `callback`: Optional callback for receiving data

#### getActiveSubscriptions

```typescript
public getActiveSubscriptions(): { topic: string; count: number }[]
```

Returns information about all active subscriptions and their reference counts.

## Usage Examples

### Basic Connection

```typescript
const client = new SocketClient({
  url: 'https://socket-server.com',
  path: '/socket.io',
  orgId: 'organization-123',
});

// Connect to the socket server
// Authentication is handled automatically via cookies
await client.connect();
```

### Simple Subscription

```typescript
// Subscribe to a position topic
const unsubscribe = client.subscribe('drone-123/telemetry/position', {
  callback: (data) => {
    console.log(`Position update:`, data);
  },
});

// Later, unsubscribe when no longer needed
unsubscribe();
```

### Topic Construction

For application-specific topic formatting, use the provided utility function:

```typescript
import { formatDeviceTopic } from '@cloud/shared/socket/utils';
import { TopicType } from '@cloud/shared/socket/enums';

// Device-specific topic
const deviceTopic = formatDeviceTopic(TopicType.Position, 'drone-123');
// Result: 'drone-123/position'
```

### Throttled Subscription

```typescript
// Subscribe to high-frequency data with throttling
client.subscribe('drone-123/position', {
  throttle: 200, // Limit to at most one update every 200ms
  callback: (data) => {
    updatePositionOnMap(data);
  },
});
```

### Data Transformation

```typescript
// Subscribe with data transformation
client.subscribe('drone-123/position', {
  transform: (rawData) => ({
    lat: rawData.lat,
    lng: rawData.lng,
    altitude: rawData.alt,
    timestamp: new Date(),
  }),
  callback: (transformedData) => {
    updateMap(transformedData);
  },
});
```

## Internal Implementation Details

### Reference Counting

The SocketClient maintains a subscription registry that tracks:

- The number of active subscribers per topic
- The socket.io callback for each topic
- Options for each subscription
- Set of user-provided callbacks

This allows multiple components to subscribe to the same topic without creating multiple socket listeners.

### Reconnection Handling

Upon reconnection after a disconnect:

1. The client automatically resubscribes to all active topics
2. Existing callbacks continue to receive data
3. No action is required from subscribers

### Throttling Implementation

For high-frequency topics, the throttle option limits how often callbacks are triggered:

1. The first message is processed immediately
2. During the throttle period, only the most recent message is stored
3. After the throttle period, the most recent message is processed
4. This reduces processing load while ensuring the latest data is always used
