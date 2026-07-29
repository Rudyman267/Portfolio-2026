# Socket Client Connection Details

## Overview

This document provides a comprehensive explanation of how the socket client is created, managed, and connected. It focuses on the low-level mechanics of socket connection establishment, lifecycle management, and message handling without business logic.

## Table of Contents

1. [Socket Client Creation](#1-socket-client-creation)
2. [Connection Establishment](#2-connection-establishment)
3. [Connection Lifecycle & Event Handlers](#3-connection-lifecycle--event-handlers)
4. [Reconnection Mechanism](#4-reconnection-mechanism)
5. [Subscription Management (Socket Level)](#5-subscription-management-socket-level)
6. [Message Handling Flow](#6-message-handling-flow)
7. [Connection-Aware Subscriptions](#7-connection-aware-subscriptions)
8. [Disconnection & Cleanup](#8-disconnection--cleanup)
9. [Complete Connection Flow Diagram](#9-complete-connection-flow-diagram)
10. [Key Technical Details](#10-key-technical-details)

---

## 1. Socket Client Creation

### Class Structure

The `SocketClient` class is the core component that manages the actual Socket.IO connection:

```typescript
export class SocketClient {
  private socket: Socket | null = null;  // The actual Socket.IO instance
  private subscriptionRegistry: Map<string, SubscriptionEntry> = new Map();
  
  constructor(
    private readonly config: SocketConfig,
    private readonly handlers: SocketEventHandlers = {}
  ) {}
}
```

**Key Properties:**
- `socket`: Holds the Socket.IO instance. Initially `null` until `connect()` is called.
- `subscriptionRegistry`: Internal Map tracking all topic subscriptions with reference counting.
- `config`: Immutable configuration object containing URL, path, orgId, and options.
- `handlers`: Callback functions for connection events (onConnect, onDisconnect, onReconnect).

### Creation Flow

The SocketClient is instantiated in the Zustand store's `configure()` method:

```typescript
// In socket.store.ts
configure: (config: SocketConfig) => {
  // 1. Validate configuration
  if (!config.url) {
    throw new Error('Socket URL is required in configuration');
  }
  
  // 2. Clean up existing client if any
  const { client: existingClient } = get();
  if (existingClient) {
    existingClient.disconnect();
    set({ client: null, isConnected: false, error: null });
  }
  
  // 3. Create new SocketClient instance
  const client = new SocketClient(config, {
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onReconnect: handleReconnect,
  });
  
  // 4. Store the client instance
  set({ config, client });
}
```

**Important Notes:**
- The Socket.IO connection is **NOT** created at this point.
- The client instance is created, but `this.socket` remains `null`.
- The actual connection happens when `connect()` is called.
- If a client already exists, it's disconnected and cleaned up before creating a new one.

### Configuration Interface

```typescript
export interface SocketConfig {
  url: string;              // Server URL (e.g., 'http://localhost')
  path?: string;             // Socket.IO path (e.g., '/socket/socket.io')
  orgId: string;             // Organization ID for authentication
  options?: {
    transports?: string[];           // Transport methods (default: ['websocket'])
    reconnection?: boolean;           // Enable auto-reconnection (default: true)
    reconnectionAttempts?: number;   // Max reconnection attempts (default: 5)
    reconnectionDelay?: number;       // Initial delay in ms (default: 1000)
    timeout?: number;                 // Connection timeout in ms (default: 20000)
  };
}
```

---

## 2. Connection Establishment

### The `connect()` Method - Step by Step

The `connect()` method is where the actual Socket.IO connection is established:

```typescript
public connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // STEP 1: VALIDATION
      if (!this.config.url) {
        throw new Error('Socket URL is required for connection');
      }

      // STEP 2: BUILD SOCKET.IO OPTIONS
      const socketOptions = {
        path: this.config.path,                    // e.g., '/socket/socket.io'
        transports: this.config.options?.transports ?? ['websocket'],
        reconnection: this.config.options?.reconnection ?? true,
        reconnectionAttempts: this.config.options?.reconnectionAttempts ?? 5,
        reconnectionDelay: this.config.options?.reconnectionDelay ?? 1000,
        timeout: this.config.options?.timeout ?? 20000,
        withCredentials: true,                     // Send cookies with requests
        auth: {
          'org-id': this.config.orgId,            // Auth header sent during handshake
        },
      };

      // STEP 3: CREATE SOCKET.IO INSTANCE
      this.socket = io(this.config.url, socketOptions);
      
      // STEP 4: REGISTER EVENT HANDLERS
      // ... (see next section)
    } catch (error) {
      reject(error);
    }
  });
}
```

### Socket.IO Connection Details

#### 1. Socket.IO Instance Creation

```typescript
this.socket = io(this.config.url, socketOptions);
```

**What happens:**
- `io()` is the Socket.IO client factory function from `socket.io-client`
- Creates a Socket.IO client instance
- **Does NOT immediately connect** - connection is asynchronous
- Returns a Socket instance that will attempt to connect

**Connection URL Construction:**
- Base URL: `config.url` (e.g., `'http://localhost'`)
- Path: `config.path` (e.g., `'/socket/socket.io'`)
- **Full connection URL**: `http://localhost/socket/socket.io`

#### 2. Authentication

```typescript
auth: {
  'org-id': this.config.orgId  // Sent in handshake auth object
}
```

**How it works:**
- The `auth` object is sent during the Socket.IO handshake
- This is **NOT** an HTTP header - it's part of the Socket.IO handshake protocol
- The server receives this during the initial connection negotiation
- Used for server-side authentication and authorization

#### 3. Transport Configuration

```typescript
transports: ['websocket']  // Only WebSocket, no polling fallback
```

**Transport Options:**
- `['websocket']`: Pure WebSocket connection only
- `['polling', 'websocket']`: Try polling first, upgrade to WebSocket
- Default Socket.IO behavior tries polling first, but this config forces WebSocket-only

**Why WebSocket-only?**
- Lower latency
- Full-duplex communication
- More efficient for real-time data
- No fallback to HTTP long-polling

#### 4. Credentials

```typescript
withCredentials: true  // Includes cookies in CORS requests
```

**Purpose:**
- Ensures cookies are sent with cross-origin requests
- Required for authentication cookies to be included
- Important for CORS scenarios

#### 5. Reconnection Settings

```typescript
reconnection: true,                    // Enable automatic reconnection
reconnectionAttempts: 5,              // Max attempts before giving up
reconnectionDelay: 1000,              // Initial delay (ms)
timeout: 20000,                       // Connection timeout (ms)
```

**Default Values:**
- If not specified, Socket.IO uses its own defaults
- These values override Socket.IO defaults
- `reconnectionDelay` is the initial delay; subsequent delays may increase

---

## 3. Connection Lifecycle & Event Handlers

### Event Registration (Inside `connect()`)

After creating the Socket.IO instance, event handlers are registered:

```typescript
// CONNECTION SUCCESS
this.socket.on('connect', () => {
  // 1. Re-subscribe to all pending topics
  this.subscribeAllPendingTopics();
  
  // 2. Notify store handlers
  if (this.handlers.onConnect) {
    this.handlers.onConnect();
  }
  
  // 3. Resolve the promise
  resolve();
});

// CONNECTION ERROR (Initial connection failure)
this.socket.on('connect_error', (error) => {
  reject(error);  // Promise rejects, connection failed
});

// DISCONNECTION
this.socket.on('disconnect', (reason) => {
  // Mark all subscriptions as unsubscribed
  for (const [, entry] of this.subscriptionRegistry.entries()) {
    entry.isSocketSubscribed = false;
  }
  
  // Notify handlers
  if (this.handlers.onDisconnect) {
    this.handlers.onDisconnect(reason);
  }
});

// RECONNECTION (After disconnection)
this.socket.on('reconnect', (attemptNumber) => {
  if (this.handlers.onReconnect) {
    console.log('reconnection');
    this.handlers.onReconnect(attemptNumber);
  }
  // Note: subscribeAllPendingTopics() is called in 'connect' handler
  // which also fires on reconnection
});
```

### Connection States

The socket goes through these states:

1. **Before `connect()`**: 
   - `this.socket = null`
   - No connection exists

2. **After `io()` call**: 
   - Socket.IO instance exists
   - Connection attempt initiated
   - `this.socket.connected === false`

3. **After `'connect'` event**: 
   - `this.socket.connected === true`
   - Connection established
   - Can send/receive messages

4. **After `'disconnect'` event**: 
   - `this.socket.connected === false`
   - Connection lost
   - Reconnection may be in progress

5. **On reconnection**: 
   - `'reconnect'` event fires with attempt number
   - Then `'connect'` event fires again
   - `this.socket.connected === true` again

### Event Handler Flow

```
Socket.IO Event → SocketClient Handler → Store Handler → Application Callbacks
```

**Example Flow:**
1. Socket.IO fires `'connect'` event
2. `SocketClient` handler executes → calls `subscribeAllPendingTopics()`
3. `SocketClient` calls `handlers.onConnect()`
4. Store's `handleConnect()` updates state and executes all registered callbacks
5. Application-level callbacks execute

---

## 4. Reconnection Mechanism

### Socket.IO Built-in Reconnection

The reconnection is handled automatically by Socket.IO based on configuration:

```typescript
reconnection: true,                    // Enable automatic reconnection
reconnectionAttempts: 5,              // Max attempts before giving up
reconnectionDelay: 1000,              // Initial delay (ms)
timeout: 20000,                       // Connection timeout (ms)
```

### Reconnection Flow

1. **Connection Drops**
   - `'disconnect'` event fires
   - All subscriptions marked as `isSocketSubscribed = false`
   - Disconnect handlers execute

2. **Reconnection Attempt**
   - Socket.IO waits `reconnectionDelay` milliseconds (1 second)
   - Attempts to reconnect to the server

3. **On Success**
   - `'reconnect'` event fires with attempt number
   - Then `'connect'` event fires
   - `subscribeAllPendingTopics()` executes
   - All pending subscriptions are re-established

4. **On Failure**
   - Waits and retries
   - Delay may increase exponentially
   - Continues up to `reconnectionAttempts` times

5. **After Max Attempts**
   - Stops trying to reconnect
   - Connection remains disconnected
   - Manual reconnection required

### Reconnection State Management

**Important:** The client tracks subscriptions separately from the socket connection:

```typescript
// On disconnect
this.socket.on('disconnect', (reason) => {
  // Mark subscriptions as unsubscribed (but keep them in registry)
  for (const [, entry] of this.subscriptionRegistry.entries()) {
    entry.isSocketSubscribed = false;
  }
  // ...
});

// On reconnect/connect
this.socket.on('connect', () => {
  // Re-subscribe to all pending topics
  this.subscribeAllPendingTopics();
  // ...
});
```

**Why this matters:**
- Subscriptions created before connection are preserved
- On reconnection, they're automatically re-established
- No need to manually re-subscribe after reconnection
- Components don't need to handle reconnection logic

---

## 5. Subscription Management (Socket Level)

### Subscription Registry Structure

Each subscription is tracked in a registry with detailed metadata:

```typescript
interface SubscriptionEntry {
  count: number;                      // Reference count (multiple subscribers)
  callback: (data: any) => void;      // Socket.IO event listener function
  options?: SubscriptionOptions;      // Throttle/transform options
  userCallbacks: Set<(data: any) => void>;  // Multiple user callbacks
  isSocketSubscribed: boolean;       // Whether actually subscribed to socket
}
```

**Key Fields Explained:**
- `count`: Number of components/subscribers for this topic (reference counting)
- `callback`: The actual function registered with Socket.IO (`socket.on(topic, callback)`)
- `userCallbacks`: Set of user-provided callbacks to invoke when data arrives
- `isSocketSubscribed`: Tracks if the subscription request was sent to the server

### Actual Socket Subscription

When subscribing to a topic, two things happen:

```typescript
private performSocketSubscription(
  topic: string,
  entry: SubscriptionEntry
): void {
  if (this.socket?.connected && !entry.isSocketSubscribed) {
    // 1. EMIT subscription request to server
    this.socket.emit('Subscribe', { topic });
    
    // 2. REGISTER event listener for this topic
    this.socket.on(topic, entry.callback);
    
    // 3. MARK as subscribed
    entry.isSocketSubscribed = true;
  }
}
```

**Step-by-Step:**

1. **`socket.emit('Subscribe', { topic })`**
   - Sends a custom event to the server
   - Tells the server: "Start sending me data for this topic"
   - Server-side handler processes this and begins publishing to the client

2. **`socket.on(topic, entry.callback)`**
   - Registers an event listener with Socket.IO
   - When server emits data on this topic, the callback fires
   - The topic name becomes the event name (e.g., `'drone-123/position'`)

3. **`entry.isSocketSubscribed = true`**
   - Marks that the subscription request was sent
   - Prevents duplicate subscription requests
   - Used to track subscription state across reconnections

**Example:**
```typescript
// Subscribe to drone position updates
const topic = 'drone-123/position';

// 1. Client sends: socket.emit('Subscribe', { topic: 'drone-123/position' })
// 2. Server receives subscription request
// 3. Server starts sending: socket.emit('drone-123/position', { lat: 37.7, lng: -122.4 })
// 4. Client receives: socket.on('drone-123/position', callback) fires
```

### Unsubscription

When unsubscribing, the reverse happens:

```typescript
private unsubscribe(topic: string, userCallback?: (data: any) => void): void {
  const entry = this.subscriptionRegistry.get(topic);
  if (!entry) return;

  // Decrement reference count
  entry.count -= 1;
  
  // Remove specific callback if provided
  if (userCallback) {
    entry.userCallbacks.delete(userCallback);
  }

  // Only unsubscribe from socket when count reaches 0
  if (entry.count <= 0) {
    if (this.socket?.connected && entry.isSocketSubscribed) {
      // 1. REMOVE event listener
      this.socket.off(topic, entry.callback);
      
      // 2. TELL server to stop sending
      this.socket.emit('Unsubscribe', { topic });
    }
    this.subscriptionRegistry.delete(topic);
  }
}
```

**Unsubscription Steps:**

1. **`socket.off(topic, entry.callback)`**
   - Removes the event listener from Socket.IO
   - No more callbacks will fire for this topic

2. **`socket.emit('Unsubscribe', { topic })`**
   - Tells the server to stop sending data for this topic
   - Server-side handler processes this and stops publishing

3. **Remove from registry**
   - Entry is deleted from the subscription registry
   - Memory is freed

**Reference Counting:**
- Multiple components can subscribe to the same topic
- Each subscription increments `count`
- Unsubscribe decrements `count`
- Only when `count === 0` is the actual socket subscription removed

---

## 6. Message Handling Flow

### When Server Sends Data

The complete flow from server to application:

```
Server → Socket.IO → SocketClient → User Callbacks
```

### Detailed Message Flow

**1. Server Emits Message:**
```typescript
// Server-side code
socket.emit('drone-123/position', { lat: 37.7, lng: -122.4 });
```

**2. Socket.IO Receives:**
- Socket.IO client receives the message
- Identifies the event name: `'drone-123/position'`
- Looks up registered listeners for this event

**3. Callback Execution:**
```typescript
// The callback registered in performSocketSubscription
let callback = (data: any) => {
  // Apply transformation if provided
  const transformedData = options?.transform
    ? options.transform(data)
    : data;

  // Notify all registered user callbacks
  const entry = this.subscriptionRegistry.get(topic);
  if (entry) {
    entry.userCallbacks.forEach((cb) => {
      cb(transformedData);
    });
  }
};
```

**4. Data Transformation:**
- If `options.transform` is provided, data is transformed
- Transformation happens before callbacks are invoked
- Useful for data normalization or filtering

**5. Throttling (if enabled):**
```typescript
if (options?.throttle && options.throttle > 0) {
  callback = this.throttle(callback, options.throttle);
}
```

**Throttling Implementation:**
```typescript
private throttle<T>(
  callback: (data: T) => void,
  limit: number
): (data: T) => void {
  let waiting = false;
  let lastData: T | null = null;

  return function throttled(this: any, data: T) {
    if (!waiting) {
      callback.call(this, data);
      waiting = true;
      setTimeout(() => {
        if (lastData !== null) {
          callback.call(this, lastData);
          lastData = null;
        }
        waiting = false;
      }, limit);
    } else {
      lastData = data;  // Store latest data
    }
  };
}
```

**How Throttling Works:**
- First message: Executes immediately, sets `waiting = true`
- Subsequent messages: Stored in `lastData`, not executed
- After `limit` ms: Executes with `lastData`, sets `waiting = false`
- Ensures callback executes at most once per `limit` milliseconds

**6. User Callbacks Invoked:**
- All callbacks in `userCallbacks` Set are invoked
- Each callback receives the (possibly transformed) data
- Callbacks execute synchronously

### Complete Example

```typescript
// 1. Subscribe with transformation and throttling
const unsubscribe = socketClient.subscribe('drone-123/position', {
  throttle: 100,  // Max once per 100ms
  transform: (data) => ({
    latitude: data.lat,
    longitude: data.lng,
    altitude: data.alt || 0
  }),
  callback: (transformedData) => {
    console.log('Position:', transformedData);
    // Update UI, store, etc.
  }
});

// 2. Server sends: { lat: 37.7, lng: -122.4, alt: 100 }
// 3. Transformation: { latitude: 37.7, longitude: -122.4, altitude: 100 }
// 4. Throttling: If called within 100ms, only latest data is used
// 5. Callback executes with transformed data
```

---

## 7. Connection-Aware Subscriptions

### Key Feature

**Subscriptions can be created before connection is established.**

This is a critical feature that makes the system resilient and user-friendly.

### How It Works

**1. Subscription Before Connection:**

```typescript
public subscribe<T>(topic: string, options?: SubscriptionOptions): () => void {
  // ... create or update subscription entry ...
  
  // Register subscription in registry (always works)
  this.subscriptionRegistry.set(topic, newEntry);
  
  // Try to subscribe to socket if connected
  this.performSocketSubscription(topic, newEntry);
  // ↑ This checks: if (this.socket?.connected && !entry.isSocketSubscribed)
}
```

**What happens:**
- Entry is created in `subscriptionRegistry`
- `isSocketSubscribed = false` (not yet subscribed to socket)
- If socket is not connected, `performSocketSubscription` does nothing
- Subscription is "pending" - waiting for connection

**2. On Connection:**

```typescript
private subscribeAllPendingTopics(): void {
  if (!this.socket) return;

  // Subscribe to all topics with active subscribers
  for (const [topic, entry] of this.subscriptionRegistry.entries()) {
    if (entry.count > 0) {
      this.performSocketSubscription(topic, entry);
    }
  }
}
```

**What happens:**
- Called when `'connect'` event fires
- Iterates through all entries in registry
- For each entry with `count > 0`, calls `performSocketSubscription`
- All pending subscriptions are now active

**3. On Reconnection:**

- Same flow as initial connection
- `'connect'` event fires (after `'reconnect'`)
- `subscribeAllPendingTopics()` executes
- All subscriptions are re-established automatically

### Complete Flow Example

```typescript
// Component mounts, socket not yet connected
useEffect(() => {
  // 1. Subscribe to topic (socket not connected yet)
  const unsubscribe = socketClient.subscribe('drone-123/position', {
    callback: (data) => {
      console.log('Position:', data);
    }
  });
  
  // Entry created: { count: 1, isSocketSubscribed: false }
  // performSocketSubscription checks: socket?.connected === false
  // Does nothing, subscription is "pending"
  
  return () => unsubscribe();
}, []);

// Later, connection is established
socketClient.connect();
// → 'connect' event fires
// → subscribeAllPendingTopics() executes
// → performSocketSubscription('drone-123/position', entry)
// → socket.emit('Subscribe', { topic: 'drone-123/position' })
// → socket.on('drone-123/position', callback)
// → isSocketSubscribed = true
// → Subscription is now active!
```

### Benefits

1. **Resilience**: Components can subscribe before connection
2. **Simplicity**: No need to wait for connection before subscribing
3. **Automatic Recovery**: Reconnection automatically re-subscribes
4. **Better UX**: No manual re-subscription logic needed

---

## 8. Disconnection & Cleanup

### Manual Disconnection

The `disconnect()` method performs complete cleanup:

```typescript
public disconnect(): void {
  if (this.socket) {
    // 1. Clear all subscription tracking
    this.subscriptionRegistry.clear();
    
    // 2. Disconnect Socket.IO instance
    this.socket.disconnect();
    
    // 3. Nullify reference
    this.socket = null;
  }
}
```

### What Happens on Disconnect

**1. `subscriptionRegistry.clear()`**
- Removes all subscription entries
- Frees memory
- All reference counts reset

**2. `socket.disconnect()`**
- Closes the WebSocket connection
- Stops Socket.IO reconnection attempts
- Removes all event listeners
- Fires `'disconnect'` event with reason

**3. `this.socket = null`**
- Clears the reference
- Prevents further operations on disconnected socket
- Indicates no connection exists

### Disconnect Event Reasons

Socket.IO provides disconnect reasons:

- `'io server disconnect'`: Server forcefully disconnected
- `'io client disconnect'`: Client manually disconnected
- `'ping timeout'`: Server didn't respond to ping
- `'transport close'`: Connection closed
- `'transport error'`: Transport error occurred

### Cleanup Flow

```
Manual disconnect() call
  ↓
Clear subscription registry
  ↓
socket.disconnect()
  ↓
Socket.IO closes WebSocket
  ↓
'disconnect' event fires
  ↓
Disconnect handlers execute
  ↓
socket = null
```

---

## 9. Complete Connection Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. CONFIGURE PHASE                                      │
│    useSocketStore.configure(config)                     │
│    → Validates config.url                                │
│    → Cleans up existing client (if any)                  │
│    → Creates SocketClient instance                       │
│    → Stores config and client                            │
│    → socket = null (not connected yet)                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CONNECT PHASE                                        │
│    useSocketStore.connect()                              │
│    → SocketClient.connect()                              │
│    → Validates config.url                                │
│    → Builds socketOptions object                         │
│    → Creates: this.socket = io(url, options)           │
│    → Registers event handlers                            │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. HANDSHAKE PHASE                                      │
│    Socket.IO → Server                                    │
│    → HTTP Upgrade Request                                │
│    → Sends auth: { 'org-id': orgId }                    │
│    → Server validates auth                               │
│    → WebSocket connection established                    │
│    → Socket.IO protocol handshake                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CONNECTED PHASE                                      │
│    'connect' event fires                                 │
│    → subscribeAllPendingTopics()                         │
│    → For each pending topic:                             │
│       • socket.emit('Subscribe', { topic })              │
│       • socket.on(topic, callback)                       │
│       • entry.isSocketSubscribed = true                  │
│    → handlers.onConnect()                                │
│    → Store updates: isConnected = true                   │
│    → All registered connect callbacks execute            │
│    → Promise resolves                                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. MESSAGE FLOW                                        │
│    Server → socket.emit(topic, data)                   │
│    → Socket.IO receives message                         │
│    → socket.on(topic) listener fires                    │
│    → Callback processes data                            │
│    → Transform (if provided)                             │
│    → Throttle (if enabled)                              │
│    → Invoke all userCallbacks                           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. DISCONNECTION (if occurs)                            │
│    Connection lost                                       │
│    → 'disconnect' event fires                           │
│    → All entries: isSocketSubscribed = false            │
│    → handlers.onDisconnect(reason)                       │
│    → Store updates: isConnected = false                 │
│    → All registered disconnect callbacks execute        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. RECONNECTION (automatic)                            │
│    Socket.IO waits reconnectionDelay                     │
│    → Attempts reconnection                              │
│    → On success: 'reconnect' event fires                 │
│    → Then 'connect' event fires                        │
│    → subscribeAllPendingTopics() (re-subscribes)        │
│    → All subscriptions restored                         │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Key Technical Details

### Socket.IO Events Used

**Built-in Events:**
- `'connect'`: Connection established (fires on initial connection and reconnection)
- `'connect_error'`: Connection failed (initial connection only)
- `'disconnect'`: Connection lost
- `'reconnect'`: Reconnection successful (fires before `'connect'`)

**Custom Events Emitted:**
- `'Subscribe'`: Request subscription to a topic
  ```typescript
  socket.emit('Subscribe', { topic: 'drone-123/position' });
  ```
- `'Unsubscribe'`: Request unsubscription from a topic
  ```typescript
  socket.emit('Unsubscribe', { topic: 'drone-123/position' });
  ```

**Custom Events Received:**
- Topic names as events (e.g., `'drone-123/position'`)
- Server emits data using topic name as event name
- Client listens using `socket.on(topic, callback)`

### State Tracking

**Socket Instance:**
- `this.socket`: The Socket.IO instance (null when not connected)
- `this.socket.connected`: Boolean connection status (Socket.IO property)

**Subscription Registry:**
- `subscriptionRegistry`: Map<string, SubscriptionEntry>
- Key: Topic string (e.g., `'drone-123/position'`)
- Value: SubscriptionEntry with metadata

**Subscription State:**
- `isSocketSubscribed`: Whether actually subscribed to socket
- `count`: Number of active subscribers (reference count)
- `userCallbacks`: Set of user-provided callbacks

### Reference Counting System

**How it works:**
1. Component A subscribes to topic → `count = 1`
2. Component B subscribes to same topic → `count = 2`
3. Component A unsubscribes → `count = 1`
4. Component B unsubscribes → `count = 0` → Actual socket unsubscription

**Benefits:**
- Prevents duplicate socket subscriptions
- Efficient resource usage
- Multiple components can share same subscription
- Automatic cleanup when no subscribers remain

### Connection State Machine

```
NULL
  ↓ (configure)
CONFIGURED (socket = null)
  ↓ (connect)
CONNECTING (socket exists, connected = false)
  ↓ ('connect' event)
CONNECTED (socket.connected = true)
  ↓ ('disconnect' event)
DISCONNECTED (socket.connected = false)
  ↓ (reconnection)
RECONNECTING
  ↓ ('reconnect' + 'connect')
CONNECTED (again)
  ↓ (disconnect())
NULL (socket = null)
```

### Error Handling

**Connection Errors:**
- `connect_error` event → Promise rejects
- Error stored in store: `error: Error`
- Application can handle and retry

**Subscription Errors:**
- If socket not initialized → Returns no-op unsubscribe function
- If subscription fails → Logs warning, returns no-op function
- Graceful degradation

**Reconnection Errors:**
- After max attempts → Stops trying
- Connection remains disconnected
- Manual intervention required

### Performance Considerations

**Throttling:**
- Reduces callback execution frequency
- Useful for high-frequency topics (e.g., position updates)
- Prevents UI overload

**Reference Counting:**
- Single socket subscription per topic
- Multiple callbacks share same subscription
- Efficient memory usage

**Connection Pooling:**
- Single socket connection for all topics
- No per-topic connections
- Efficient network usage

### Security Considerations

**Authentication:**
- Organization ID sent in handshake auth
- Server validates before allowing connection
- Prevents unauthorized access

**Credentials:**
- `withCredentials: true` includes cookies
- Required for cookie-based authentication
- Important for CORS scenarios

**Topic Scoping:**
- Topics can be organization-scoped
- Server filters data by organization
- Prevents cross-organization data leaks

---

## Summary

This document has covered the complete socket client creation, management, and connection flow:

1. **Socket Client Creation**: Instantiated in store's `configure()` method, but connection not established yet
2. **Connection Establishment**: `connect()` creates Socket.IO instance with proper configuration
3. **Event Handlers**: Registered for connect, disconnect, reconnect events
4. **Reconnection**: Automatic with configurable attempts and delays
5. **Subscriptions**: Reference-counted, connection-aware, automatic re-subscription
6. **Message Flow**: Server → Socket.IO → Transform → Throttle → Callbacks
7. **Cleanup**: Proper disconnection and resource cleanup

The architecture provides a robust, resilient, and efficient real-time communication system with automatic reconnection, reference counting, and connection-aware subscriptions.

# Client-Side Application Integration Guide

This document provides a comprehensive guide to integrating the FlytBase Socket.IO client in a React application. It covers connection setup, authentication, subscription patterns, and real-world implementation examples.

## Table of Contents

1. [Overview](#overview)
2. [Connection Configuration](#connection-configuration)
3. [Authentication Requirements](#authentication-requirements)
4. [Socket Provider Setup](#socket-provider-setup)
5. [Topic Structure](#topic-structure)
6. [Subscription Patterns](#subscription-patterns)
7. [Real-World Implementation Examples](#real-world-implementation-examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The FlytBase socket system uses Socket.IO for real-time bidirectional communication between the client and server. The socket connection provides:

- **Real-time telemetry**: Position, battery, attitude, flight state updates
- **System state monitoring**: Dock/drone connection status, armed state
- **Event notifications**: Alerts, alarms, and status changes

### Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   React Application │     │   FlytBase Server   │
│                     │     │                     │
│  ┌───────────────┐  │     │  ┌───────────────┐  │
│  │SocketProvider │──┼─────┼──│ Socket Server │  │
│  └───────────────┘  │     │  └───────────────┘  │
│         │           │     │         │           │
│  ┌───────────────┐  │     │  ┌───────────────┐  │
│  │  SocketStore  │  │     │  │  Telemetry    │  │
│  │   (Zustand)   │  │     │  │   Services    │  │
│  └───────────────┘  │     │  └───────────────┘  │
│         │           │     │                     │
│  ┌───────────────┐  │     │                     │
│  │  Subscription │  │     │                     │
│  │    Hooks      │  │     │                     │
│  └───────────────┘  │     │                     │
└─────────────────────┘     └─────────────────────┘
```

---

## Connection Configuration

### Socket Configuration Interface

```typescript
interface SocketConfig {
  url: string;           // Socket server URL (e.g., 'https://dev-api.flytbase.com')
  path?: string;         // Socket.IO path (default: '/socket/socket.io')
  orgId: string;         // Organization ID for the connection
  authToken?: string;    // JWT access token for authentication
  options?: {
    transports?: string[];          // ['websocket'] recommended
    reconnection?: boolean;         // Enable automatic reconnection
    reconnectionAttempts?: number;  // Max reconnection attempts
    reconnectionDelay?: number;     // Delay between attempts (ms)
    timeout?: number;               // Connection timeout (ms)
  };
}
```

### Environment Configuration

Socket configuration is typically stored in environment files:

```typescript
// environment.ts
export const environment = {
  socket: {
    url: 'https://dev-api.flytbase.com',
    path: '/socket/socket.io',
  },
  // ... other config
};
```

### Connection Options

| Option | Default | Description |
|--------|---------|-------------|
| `transports` | `['websocket']` | Transport methods (websocket preferred for performance) |
| `reconnection` | `true` | Auto-reconnect on disconnect |
| `reconnectionAttempts` | `10` | Maximum reconnection attempts |
| `reconnectionDelay` | `1000` | Delay between reconnection attempts (ms) |
| `timeout` | `20000` | Connection timeout (ms) |
| `withCredentials` | `true` | Send cookies with requests (set internally) |

---

## Authentication Requirements

### SuperTokens Header-Based Authentication

The FlytBase socket server uses **header-based authentication** with SuperTokens JWT tokens. WebSocket connections don't automatically include HTTP headers or cookies, so the JWT token must be explicitly passed during the socket handshake.

#### Key Points:

1. **WebSockets don't use HTTP headers** - Unlike REST APIs where cookies/headers are sent automatically, WebSocket connections require explicit token passing.

2. **Token must be fetched from SuperTokens** - Use `Session.getAccessToken()` to retrieve the JWT.

3. **Token is passed in the `auth` object** - Socket.IO's `auth` option is used to send credentials during handshake.

### Authentication Flow

```
1. User logs in via SuperTokens
           │
           ▼
2. Session established with access token
           │
           ▼
3. SocketProvider waits for authentication
           │
           ▼
4. Fetch JWT via Session.getAccessToken()
           │
           ▼
5. Configure socket with auth token
           │
           ▼
6. Socket handshake includes:
   - auth.authorization: "Bearer <token>"
   - auth['org-id']: "<organization-id>"
           │
           ▼
7. Server validates token and org-id
           │
           ▼
8. Connection established
```

### Auth Object Structure

```typescript
const auth: Record<string, string> = {
  'org-id': orgId,                      // Required: Organization context
  'authorization': `Bearer ${token}`,   // Required: JWT access token
};
```

### Reference Documentation

- SuperTokens WebSocket verification: https://supertokens.com/docs/additional-verification/session-verification/with-websocket

---

## Socket Provider Setup

The `SocketProvider` component manages the socket connection lifecycle. It must be placed **after** the `AuthProvider` in the component tree.

### Complete SocketProvider Implementation

```tsx
// src/components/providers/SocketProvider.tsx

import { useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@auth';
import { environment } from '@env';
import Session from 'supertokens-auth-react/recipe/session';
import useSocketStore from '@libs/shared/socket/store/socket.store';

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * SocketProvider - Initializes and manages socket connection
 * 
 * This provider:
 * 1. Waits for authentication to be ready (orgId available)
 * 2. Fetches the JWT access token from SuperTokens session
 * 3. Configures the socket client with environment settings and auth token
 * 4. Establishes the socket connection
 * 5. Cleans up on unmount
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const { orgId, isAuthenticated } = useAuth();
  const isInitialized = useRef(false);
  const { configure, connect, disconnect, isConnected } = useSocketStore();

  useEffect(() => {
    // Only initialize once we have orgId and are authenticated
    if (!orgId || !isAuthenticated || isInitialized.current) {
      return;
    }

    // Check if socket config exists in environment
    if (!environment.socket?.url) {
      console.warn('[SocketProvider] Socket URL not configured');
      return;
    }

    const initializeSocket = async () => {
      try {
        // Fetch the JWT access token from SuperTokens session
        const accessToken = await Session.getAccessToken();
        
        if (!accessToken) {
          console.error('[SocketProvider] Failed to get access token');
          return;
        }
        
        // Configure the socket client with auth token
        configure({
          url: environment.socket.url,
          path: environment.socket.path || '/socket/socket.io',
          orgId: orgId,
          authToken: accessToken,
          options: {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
          },
        });

        // Connect to the socket server
        await connect();
        isInitialized.current = true;
      } catch (error) {
        console.error('[SocketProvider] Failed to connect:', error);
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (isInitialized.current) {
        disconnect();
        isInitialized.current = false;
      }
    };
  }, [orgId, isAuthenticated, configure, connect, disconnect]);

  return <>{children}</>;
}
```

### App.tsx Integration

```tsx
// src/App.tsx

import { AuthProvider } from '@auth';
import { SocketProvider } from './components/providers/SocketProvider';

function App() {
  return (
    <AuthProvider>
      <HttpProvider>
        <SocketProvider>
          {/* Your application components */}
        </SocketProvider>
      </HttpProvider>
    </AuthProvider>
  );
}
```

---

## Topic Structure

### Topic Format

Topics follow a hierarchical structure:

```
{device-id}/{topic-type}          # Device-level topics
{binding-id}/{topic-type}         # Binding-level topics
```

### Device-Level Topics (Drone/Dock)

Used for individual device telemetry:

| Topic Type | Description | Example |
|------------|-------------|---------|
| `global_position` | GPS coordinates, altitude, elevation | `{droneId}/global_position` |
| `battery` | Battery percentage, health | `{droneId}/battery` |
| `heartbeat` | Connection status | `{droneId}/heartbeat` |
| `imu_attitude` | Pitch, roll, yaw | `{droneId}/imu_attitude` |
| `flight_state` | Flight mode, armed status | `{droneId}/flight_state` |
| `drone_state` | Comprehensive drone state | `{droneId}/drone_state` |
| `status` | General status info | `{droneId}/status` |

### Binding-Level Topics

Used for system-wide status (dock + drone combined):

| Topic Type | Description | Example |
|------------|-------------|---------|
| `system_state` | Dock/drone connection, armed, operation state | `{bindingId}/system_state` |

### Topic Enums

```typescript
// DroneTopicType - Device-level topics
export enum DroneTopicType {
  Position = 'global_position',
  Status = 'status',
  Battery = 'battery',
  AccessControl = 'access_control_event',
  Diagnostics = 'diagnostics',
  Heartbeat = 'heartbeat',
  ProcessedSyncState = 'processed_zone_sync_state',
  Notification = 'notification',
  Attitude = 'imu_attitude',
  RTHPath = 'navigation/rth_path',
  CompletedGoto = 'completed_goto',
  FlightState = 'flight_state',
  SafetyCommandStatus = 'safety_commands_tracking',
  Weather = 'weather',
  DroneStateData = 'drone_state',
  PayloadsList = 'payloads_list',
}

// SystemTopicType - Binding-level topics
export enum SystemTopicType {
  SystemState = 'system_state',
}
```

---

## Subscription Patterns

### Using the useDroneSubscription Hook

For device-level subscriptions with automatic store updates:

```typescript
import { useDroneSubscription } from '@libs/shared/state/hooks/useDroneSubscription';
import { DroneTopicType } from '@libs/shared/socket/enums/topic-types.enum';

// Subscribe to multiple topics for multiple drones
useDroneSubscription(
  ['drone-id-1', 'drone-id-2'],  // Drone IDs
  [
    DroneTopicType.Position,
    DroneTopicType.Battery,
    DroneTopicType.Heartbeat,
  ],
  { throttle: 100 }  // Optional: throttle updates
);
```

### Direct Socket Subscription

For custom subscriptions (e.g., binding-level topics):

```typescript
import useSocketStore from '@libs/shared/socket/store/socket.store';

function MyComponent() {
  const { client, isConnected } = useSocketStore();

  useEffect(() => {
    if (!client || !isConnected) return;

    const topic = `${bindingId}/system_state`;
    
    const unsubscribe = client.subscribe(topic, {
      throttle: 100,
      callback: (data) => {
        console.log('System state update:', data);
        // Handle the data
      },
    });

    return () => unsubscribe();
  }, [client, isConnected, bindingId]);
}
```

### Subscription Options

```typescript
interface SubscriptionOptions {
  throttle?: number;              // Limit update frequency (ms)
  transform?: (data: any) => any; // Transform data before callback
  callback?: (data: any) => void; // Handler for incoming data
}
```

---

## Real-World Implementation Examples

### Example 1: Multi-Drone Telemetry Subscription

Complete implementation for subscribing to multiple drones:

```typescript
// useMultiDroneSubscription.ts

import { useEffect, useMemo, useRef } from 'react';
import { useDroneSubscription } from '@libs/shared/state/hooks/useDroneSubscription';
import { DroneTopicType, SystemTopicType } from '@libs/shared/socket/enums/topic-types.enum';
import useDronesStore from '@libs/shared/state/stores/drones.store';
import useSocketStore from '@libs/shared/socket/store/socket.store';
import { DeviceBinding } from '@libs/shared/api-modules/drones/types/drone.types';

// Topics needed for multi-drone view
const DRONE_TOPICS: DroneTopicType[] = [
  DroneTopicType.Position,
  DroneTopicType.Battery,
  DroneTopicType.Heartbeat,
  DroneTopicType.FlightState,
  DroneTopicType.Attitude,
  DroneTopicType.Status,
  DroneTopicType.DroneStateData,
];

export function useMultiDroneSubscription(bindings: DeviceBinding[] | undefined) {
  const updateDroneProperty = useDronesStore((state) => state.updateDroneProperty);
  const { client, isConnected } = useSocketStore();

  // Extract drone info from bindings
  const droneInfo = useMemo(() => {
    if (!bindings) return [];
    return bindings.flatMap((binding) => {
      const dock = binding.devices.find((d) => d.device_type === 'DockingStation');
      return binding.devices
        .filter((device) => device.device_type === 'Drone')
        .map((device) => ({
          id: device.id,
          name: device.name,
          bindingId: binding._id,
          dockName: dock?.name,
        }));
    });
  }, [bindings]);

  const droneIds = useMemo(() => droneInfo.map((d) => d.id), [droneInfo]);
  const bindingIds = useMemo(() => [...new Set(droneInfo.map((d) => d.bindingId))], [droneInfo]);

  // Subscribe to device-level topics for all drones
  useDroneSubscription(droneIds, DRONE_TOPICS, { throttle: 100 });

  // Subscribe to binding-level system_state for dock/drone status
  useEffect(() => {
    if (!client || !isConnected || bindingIds.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    bindingIds.forEach((bindingId) => {
      const topic = `${bindingId}/${SystemTopicType.SystemState}`;
      
      const unsubscribe = client.subscribe(topic, {
        throttle: 100,
        callback: (data) => {
          // Find drones in this binding and update their system state
          droneInfo
            .filter((d) => d.bindingId === bindingId)
            .forEach((drone) => {
              updateDroneProperty(drone.id, 'systemState', data);
            });
        },
      });
      
      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [client, isConnected, bindingIds, droneInfo, updateDroneProperty]);

  return { droneIds, droneCount: droneIds.length };
}
```

### Example 2: System State Data Structure

The `system_state` topic provides comprehensive status for a binding:

```typescript
interface SystemStateData {
  _id: string;
  organization_id: string;
  binding_id: string;
  data: {
    dock: {
      state: string;           // e.g., 'MAINTENANCE_MODE', 'STANDBY'
      last_state: string;
      state_transited: boolean;
      connected: boolean;      // Dock online status
    };
    drone: {
      state: string;           // e.g., 'STANDBY', 'RTDS'
      last_state: string;
      state_transited: boolean;
      connected: boolean;      // Drone online status
      armed: boolean;          // Drone armed status
    };
    system: {
      state: string;           // e.g., 'NONOPERATIONAL', 'OPERATIONAL'
      last_state: string;
      state_transited: boolean;
    };
    operation?: {
      state: string;
      flight_id: string;
      mission_metadata?: object;
      // ... additional operation fields
    };
    system_ping?: number;      // Timestamp of last ping
  };
}
```

### Example 3: Using System State for UI

```typescript
function DroneCard({ droneId }) {
  const droneState = useDronesStore((state) => state.drones[droneId]);
  
  // Get status from system_state (binding-level, most reliable)
  const systemStateData = droneState?.systemState?.data;
  const isDroneOnline = systemStateData?.drone?.connected ?? false;
  const isDockOnline = systemStateData?.dock?.connected ?? false;
  const isArmed = systemStateData?.drone?.armed ?? false;
  
  return (
    <div>
      <Badge type={isDroneOnline ? 'success' : 'disabled'}>
        {isDroneOnline ? 'Online' : 'Offline'}
      </Badge>
      <Badge type={isArmed ? 'warning' : 'secondary'}>
        {isArmed ? 'Armed' : 'Disarmed'}
      </Badge>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

#### 1. Socket Connection Fails

**Symptom**: `connect_error` event, connection never establishes

**Possible Causes**:
- Missing or invalid access token
- User not authenticated
- Incorrect socket URL or path
- CORS issues

**Solution**:
```typescript
// Ensure authentication before socket init
if (!isAuthenticated || !orgId) {
  return; // Don't initialize socket yet
}

// Verify token is retrieved
const accessToken = await Session.getAccessToken();
if (!accessToken) {
  console.error('No access token available');
  return;
}
```

#### 2. No Data Received

**Symptom**: Socket connected but no topic data

**Possible Causes**:
- Wrong topic format
- Missing `Subscribe` emit
- Incorrect device/binding ID

**Solution**:
```typescript
// Verify subscription is emitted
// The SocketClient automatically emits 'Subscribe' event
this.socket.emit('Subscribe', { topic });
this.socket.on(topic, callback);
```

#### 3. Duplicate Subscriptions

**Symptom**: Multiple callbacks, memory leaks

**Solution**: The SocketClient uses reference counting. Always call the unsubscribe function:

```typescript
useEffect(() => {
  const unsubscribe = client.subscribe(topic, { callback });
  return () => unsubscribe(); // Always cleanup
}, []);
```

#### 4. Reconnection Issues

**Symptom**: Socket disconnects and doesn't resubscribe

**Solution**: The SocketClient automatically resubscribes on reconnection via `subscribeAllPendingTopics()`. Verify:
- `reconnection: true` in options
- Subscriptions are registered before disconnect

### Debug Logging

Enable console logging to trace socket activity:

```typescript
// SocketClient logs (built-in):
// [SocketClient] Emitting Subscribe for topic: {topic}
// [SocketClient] Socket not connected, deferring subscription for: {topic}

// SocketProvider logs (built-in):
// [SocketProvider] Configuring socket connection...
// [SocketProvider] Access token retrieved successfully
// [SocketProvider] Socket connected successfully
```

### Performance Tips

1. **Use throttling** for high-frequency topics:
   ```typescript
   { throttle: 100 } // Max 10 updates/second
   ```

2. **Subscribe to only needed topics** - Don't subscribe to all topics if you only need position data.

3. **Use binding-level topics** for system status instead of multiple device-level heartbeat subscriptions.

4. **Batch subscriptions** - Subscribe to multiple drones at once rather than in separate effects.

---

## Summary

Key takeaways for socket integration:

1. **Authentication is mandatory** - Fetch JWT via `Session.getAccessToken()` and pass in socket `auth` object
2. **Use the correct socket path** - Default is `/socket/socket.io`
3. **Topic format matters** - Device topics: `{deviceId}/{topic}`, Binding topics: `{bindingId}/{topic}`
4. **system_state is the source of truth** - Use binding-level `system_state` for dock/drone online/armed status
5. **Always cleanup** - Call unsubscribe functions to prevent memory leaks
6. **Use throttling** - For high-frequency telemetry data

For additional examples, see the implementation in:
- `src/components/providers/SocketProvider.tsx`
- `src/components/multi-drone-view/hooks/useMultiDroneSubscription.ts`
- `src/libs/shared/state/hooks/useDroneSubscription.ts`
