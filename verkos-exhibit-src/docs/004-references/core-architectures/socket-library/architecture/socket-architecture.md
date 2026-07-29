# Socket Architecture

## Overview

The socket architecture provides a robust solution for real-time communication between the client and server. It is designed with a focus on simplicity, flexibility, and efficient handling of socket connections with features like reference counting, automatic reconnection, and throttling of high-frequency events. The architecture also includes centralized event handling and callback management for connection events.

## Design Principles

1. **Separation of Concerns**:

   - Socket client handles only connection management and raw topic subscriptions
   - Socket store manages connection state and event callbacks
   - Topic formatting is separate from the core socket functionality
   - Domain-specific logic stays in the domain layers (like drone state)

2. **Reference Counting**:

   - Multiple components can subscribe to the same topic
   - Only one actual socket subscription is created per unique topic
   - When all subscribers unsubscribe, the socket listener is removed

3. **Centralized Event Management**:

   - Socket store manages arrays of callbacks for connection events
   - Multiple services can register callbacks for the same events
   - Clean unsubscribe mechanism for proper resource management

4. **Resilience**:
   - Automatic reconnection on disconnection
   - Automatic resubscription to active topics
   - Configurable reconnection attempts and timing
   - Proper propagation of connection state changes

## Architecture Diagram

```
┌─────────────────────┐      ┌───────────────────────────────────┐     ┌───────────────────────┐
│                     │      │                                   │     │                       │
│  React Components   │────▶ │   Socket Store                    │────▶│     Socket Client     │
│                     │      │   - Connection State              │     │                       │
└─────────────────────┘      │   - Event Callback Management     │     └───────────────────────┘
           │                 │   - Event Emission                │               ▲
           │                 │                                   │               │
           │                 └───────────────────────────────────┘               │
           │                                 ▲                                   │
           │                                 │                                   │
           │                                 │                                   │
           │                 ┌───────────────────────────────────┐               │
           │                 │                                   │               │
           ▼                 │   Services                        │◀──────────────┘
┌─────────────────┐          │   - Business Logic               │   Connection Events
│ Topic Formatter │          │   - Event Handling               │   (connect, disconnect,
└─────────────────┘          │                                   │    reconnect)
                             └───────────────────────────────────┘
```

## Components

### 1. Socket Client

The core class that manages socket.io connections and subscriptions:

- Creates and maintains the socket connection
- Manages topic subscriptions with reference counting
- Handles reconnection and resubscription
- Notifies the store about connection events
- Provides APIs for subscribing, unsubscribing, and checking connection status

```typescript
// Simple subscription
socketClient.subscribe('topic/path', {
  callback: (data) => {
    // Handle data
  },
});
```

### 2. Socket Store

A Zustand store that provides application-wide access to the socket client:

- Single instance of the socket client
- Connection status tracking
- Centralized event callback management
- Simplified subscription API
- Event emission API
- Organization ID management

```typescript
// Using the socket store
const { subscribe, isConnected, emit } = useSocketStore();

// Subscribe to a topic
subscribe('topic/path', {
  callback: (data) => {
    // Handle data
  },
});

// Register for connection events
const unsubscribe = useSocketStore.getState().onDisconnect((reason) => {
  console.log(`Socket disconnected: ${reason}`);
});

// Emit an event
emit('custom-event', { data: 'payload' });
```

### 3. Topic Formatter

Utility function for constructing topic paths:

- `formatDeviceTopic`: Constructs device-specific topics

```typescript
// Construct a device-specific topic
const topic = formatDeviceTopic(TopicType.Position, 'drone-123');
// Result: 'drone-123/position'
```

### 4. Topic Types

Enums defining the available topic types:

- Consistent naming across the application
- Type safety for topic parameters
- Documentation for available topics

```typescript
// Using topic types
import { TopicType } from '@cloud/shared/socket/enums';

// Position topic type
TopicType.Position; // 'position'
```

## Technical Design

### SocketClient

The `SocketClient` class is designed with the following features:

1. **Reference-Counted Subscriptions**:

   - Multiple components can subscribe to the same topic without duplicate socket listeners
   - Subscriptions are only removed when all subscribers have unsubscribed
   - Each subscription tracks its own set of callbacks

2. **Connection Management**:

   - Automatic reconnection with configurable retry attempts
   - Resubscription to active topics after reconnection
   - Authentication via token and organization ID
   - Connection event notification via handler functions

3. **Performance Optimizations**:
   - Optional throttling for high-frequency events
   - Data transformation capabilities
   - Efficient event routing

### Socket Store

The socket store extends the client functionality with these features:

1. **Centralized Event Callback Management**:

   - Maintains arrays of callbacks for connection events (connect, disconnect, reconnect)
   - Provides methods to register/unregister callbacks
   - Returns unsubscribe functions for proper cleanup

2. **Connection State Propagation**:

   - Updates `isConnected` state based on socket events
   - Notifies all registered callbacks when connection state changes

3. **Event Emission**:
   - Provides a clean API for emitting socket events
   - Encapsulates access to the underlying socket

### Topic Structure

The socket client itself doesn't enforce any specific topic structure, allowing for flexibility in how topics are organized. Domain-specific layers define their own topic structures.

Currently, in our drone telemetry implementation, we use a device-specific structure:

```
{device-id}/{topic-type}
```

Example: `drone-123/position`

However, the architecture supports other topic structures as needed for different use cases (e.g., global topics, hierarchical topics, etc.).

## Consumer Implementation

The domain layers (like drone state) consume the socket architecture:

1. Import the necessary components:

   ```typescript
   import { TopicType } from '@cloud/shared/socket/enums';
   import { formatDeviceTopic } from '@cloud/shared/socket/utils';
   import useSocketStore from '@cloud/shared/socket/store/socket.store';
   ```

2. Construct topics using the formatters:

   ```typescript
   const topic = formatDeviceTopic(TopicType.Position, droneId);
   ```

3. Subscribe to topics:

   ```typescript
   const { subscribe } = useSocketStore();
   const unsubscribe = subscribe(topic, {
     callback: (data) => {
       // Process data
     },
   });
   ```

4. Register for connection events:

   ```typescript
   const { onConnect, onDisconnect, onReconnect } = useSocketStore.getState();

   // Register callbacks
   const cleanupFunctions = [
     onConnect(() => {
       console.log('Socket connected');
       // Perform actions on connect
     }),
     onDisconnect((reason) => {
       console.log(`Socket disconnected: ${reason}`);
       // Handle disconnection
     }),
     onReconnect((attemptNumber) => {
       console.log(`Socket reconnected after ${attemptNumber} attempts`);
       // Handle reconnection
     }),
   ];
   ```

5. Emit events:

   ```typescript
   const { emit } = useSocketStore();

   // Emit a custom event
   emit('start-monitoring', { deviceId: 'device-123' });
   ```

6. Clean up on unmount:

   ```typescript
   useEffect(() => {
     // Subscribe
     const unsubscribe = subscribe(topic, {...});

     // Register for connection events
     const connectUnsubscribe = onConnect(() => {...});
     const disconnectUnsubscribe = onDisconnect(() => {...});

     // Return cleanup function
     return () => {
       unsubscribe();
       connectUnsubscribe();
       disconnectUnsubscribe();
     };
   }, [topic]);
   ```

## Best Practices

1. **Always unsubscribe** when components unmount or dependencies change
2. **Use the formatter** to create consistent topic strings
3. **Apply throttling** for high-frequency topics to reduce processing overhead
4. **Use consistent topic naming** across the application
5. **Prefer the utilities** over manually constructing topic strings
6. **Handle connection status** in the UI to provide feedback to users
7. **Keep transformation logic** in the domain layer, not in the socket client
8. **Register for connection events** at the service level, not in individual components
9. **Use the emit method** from the socket store instead of accessing the raw socket
10. **Centralize connection event handling** in domain-specific services

## Implementation Details

### Socket Client

```typescript
class SocketClient {
  private socket: Socket | null = null;

  constructor(
    private readonly config: SocketConfig,
    private readonly handlers: {
      onConnect?: () => void;
      onDisconnect?: (reason: string) => void;
      onReconnect?: (attemptNumber: number) => void;
    } = {}
  ) {}

  // Socket event handlers
  private setupSocketEvents(): void {
    this.socket?.on('connect', () => {
      // Handle subscriptions
      this.subscribeAllPendingTopics();

      // Notify through handler
      if (this.handlers.onConnect) {
        this.handlers.onConnect();
      }
    });

    this.socket?.on('disconnect', (reason) => {
      // Update internal state
      for (const [, entry] of this.subscriptionRegistry.entries()) {
        entry.isSocketSubscribed = false;
      }

      // Notify through handler
      if (this.handlers.onDisconnect) {
        this.handlers.onDisconnect(reason);
      }
    });

    this.socket?.on('reconnect', (attemptNumber) => {
      // Notify through handler
      if (this.handlers.onReconnect) {
        this.handlers.onReconnect(attemptNumber);
      }
    });
  }
}
```

### Socket Store

```typescript
const useSocketStore = create<SocketState>((set, get) => {
  // Private callback arrays (only accessible within the store)
  const connectCallbacks: (() => void)[] = [];
  const disconnectCallbacks: ((reason: string) => void)[] = [];
  const reconnectCallbacks: ((attemptNumber: number) => void)[] = [];

  // Wrapper functions that execute all callbacks
  const handleConnect = () => {
    set({ isConnected: true });
    connectCallbacks.forEach((callback) => callback());
  };

  const handleDisconnect = (reason: string) => {
    set({ isConnected: false });
    disconnectCallbacks.forEach((callback) => callback(reason));
  };

  const handleReconnect = (attemptNumber: number) => {
    set({ isConnected: true });
    reconnectCallbacks.forEach((callback) => callback(attemptNumber));
  };

  return {
    // State
    client: null,
    isConnected: false,
    error: null,
    config: null,

    // Configuration
    configure: (config: SocketConfig) => {
      if (!config.url) {
        throw new Error('Socket URL is required in configuration');
      }

      // Create client with our wrapper handlers
      const client = new SocketClient(config, {
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onReconnect: handleReconnect,
      });

      set({ config, client });
    },

    // Connect to socket
    connect: async () => {
      const { client } = get();
      if (!client) throw new Error('Socket client not configured');

      try {
        await client.connect();
        // Note: isConnected is set by the handleConnect callback
      } catch (error) {
        set({ error: error as Error, isConnected: false });
        throw error;
      }
    },

    // Event registration methods
    onConnect: (callback: () => void) => {
      connectCallbacks.push(callback);
      return () => {
        const index = connectCallbacks.indexOf(callback);
        if (index !== -1) {
          connectCallbacks.splice(index, 1);
        }
      };
    },

    onDisconnect: (callback: (reason: string) => void) => {
      disconnectCallbacks.push(callback);
      return () => {
        const index = disconnectCallbacks.indexOf(callback);
        if (index !== -1) {
          disconnectCallbacks.splice(index, 1);
        }
      };
    },

    onReconnect: (callback: (attemptNumber: number) => void) => {
      reconnectCallbacks.push(callback);
      return () => {
        const index = reconnectCallbacks.indexOf(callback);
        if (index !== -1) {
          reconnectCallbacks.splice(index, 1);
        }
      };
    },

    // Emit events
    emit: (event: string, data: any) => {
      const { client } = get();
      if (client) {
        const socket = client.getSocket();
        if (socket) {
          socket.emit(event, data);
        }
      }
    },
  };
});
```

## Usage Scenarios

### Scenario 1: Service Initialization and Cleanup

```typescript
class ExampleService {
  private cleanupFunctions: Array<() => void> = [];

  constructor(private socketStore: SocketState) {
    // Register event callbacks
    this.cleanupFunctions.push(
      socketStore.onConnect(() => this.handleConnect()),
      socketStore.onDisconnect((reason) => this.handleDisconnect(reason)),
      socketStore.onReconnect((attempts) => this.handleReconnect(attempts))
    );
  }

  // Cleanup when service is destroyed
  destroy(): void {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
  }

  private handleConnect(): void {
    console.log('Socket connected, resuming operations');
    // Service-specific logic...
  }

  private handleDisconnect(reason: string): void {
    console.log(`Socket disconnected: ${reason}, pausing operations`);
    // Service-specific logic...
  }

  private handleReconnect(attempts: number): void {
    console.log(`Socket reconnected after ${attempts} attempts, restoring state`);
    // Service-specific logic...
  }
}
```

### Scenario 2: Multiple Services Responding to Events

When the socket disconnects:

1. The Socket Client detects the disconnect event
2. It marks all subscriptions as not socket-subscribed
3. It notifies the Socket Store via the handler function
4. The Socket Store updates its `isConnected` state to `false`
5. The Socket Store executes all registered disconnect callbacks
6. Each service's disconnect callback is executed with the disconnect reason
7. Each service performs its own specific handling:
   - VVMTrackingService marks sessions as inactive
   - NotificationService pauses notification delivery
   - DataSyncService queues updates for later transmission

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has clear responsibilities
2. **Centralized State Management**: Connection state is managed in one place
3. **Event Propagation**: Events flow naturally through the layers
4. **Multiple Listeners**: Multiple services can respond to the same events
5. **Clean API**: Services interact with sockets through a consistent interface
6. **Proper Cleanup**: Unsubscribe functions enable proper resource management
7. **Testability**: Each layer can be tested in isolation
8. **Simplified Client Implementation**: Socket client only needs to call single handler functions
9. **Centralized Event Management**: All event callbacks are managed by the store
