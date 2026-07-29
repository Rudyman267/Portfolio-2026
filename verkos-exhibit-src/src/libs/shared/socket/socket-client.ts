import { io, Socket } from 'socket.io-client';
import type { SocketConfig } from './interfaces/socket-config.interface';

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onReconnect?: (attemptNumber: number) => void;
}

/**
 * Options for a subscription
 */
export interface SubscriptionOptions {
  throttle?: number; // Optional throttling in milliseconds
  transform?: (data: any) => any; // Optional data transformation
  callback?: (data: any) => void; // Optional callback for receiving data
}

/**
 * Internal subscription registry entry
 */
interface SubscriptionEntry {
  count: number; // Number of active subscribers
  callback: (data: any) => void; // Actual socket callback
  options?: SubscriptionOptions; // Options for this subscription
  userCallbacks: Set<(data: any) => void>; // User-provided callbacks
  isSocketSubscribed: boolean; // Track if actually subscribed to socket
}

/**
 * Enhanced Socket Client with reference counting and improved subscription management
 */
export class SocketClient {
  private socket: Socket | null = null;

  // Track subscriptions with reference counting
  private subscriptionRegistry: Map<string, SubscriptionEntry> = new Map();

  constructor(
    private readonly config: SocketConfig,
    private readonly handlers: SocketEventHandlers = {}
  ) {}

  /**
   * Initialize socket connection
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.config.url) {
          throw new Error('Socket URL is required for connection');
        }

        const socketOptions = {
          path: this.config.path,
          transports: this.config.options?.transports ?? ['websocket'],
          reconnection: this.config.options?.reconnection ?? true,
          reconnectionAttempts: this.config.options?.reconnectionAttempts ?? 5,
          reconnectionDelay: this.config.options?.reconnectionDelay ?? 1000,
          timeout: this.config.options?.timeout ?? 20000,
          withCredentials: true,
          auth: {
            'org-id': this.config.orgId,
          },
        };

        // Socket options configured

        this.socket = io(this.config.url, socketOptions);

        this.socket.on('connect', () => {
          // Socket connected successfully

          // Subscribe to all pending topics (handles both initial connection and reconnection)
          this.subscribeAllPendingTopics();

          // Notify through handler
          if (this.handlers.onConnect) {
            this.handlers.onConnect();
          }

          resolve();
        });

        this.socket.on('connect_error', (error) => {
          // Socket connection error occurred
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          for (const [, entry] of this.subscriptionRegistry.entries()) {
            entry.isSocketSubscribed = false;
          }

          if (this.handlers.onDisconnect) {
            this.handlers.onDisconnect(reason);
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          if (this.handlers.onReconnect) {
            console.log('reconnection');
            this.handlers.onReconnect(attemptNumber);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe all pending topics when connection is established
   */
  private subscribeAllPendingTopics(): void {
    if (!this.socket) return;

    // Subscribe to all topics with active subscribers that aren't yet socket-subscribed
    for (const [topic, entry] of this.subscriptionRegistry.entries()) {
      if (entry.count > 0) {
        this.performSocketSubscription(topic, entry);
      }
    }
  }

  /**
   * Apply throttling to a callback function
   */
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
        lastData = data;
      }
    };
  }

  /**
   * Helper method to perform actual socket subscription
   * @param topic The topic to subscribe to
   * @param entry The subscription entry
   */
  private performSocketSubscription(
    topic: string,
    entry: SubscriptionEntry
  ): void {
    if (this.socket?.connected && !entry.isSocketSubscribed) {
      this.socket.emit('Subscribe', { topic });
      this.socket.on(topic, entry.callback);
      entry.isSocketSubscribed = true;
    }
  }

  /**
   * Subscribe to a specific topic using reference counting
   * Connection-aware - works before, during, and after connection
   * @param topic The full topic path to subscribe to
   * @param options Optional configuration for this subscription
   * @returns Unsubscribe function
   */
  public subscribe<T>(
    topic: string,
    options?: SubscriptionOptions
  ): () => void {
    // Get or create user callback from options
    const userCallback = options?.callback;

    // Check if we already have this subscription
    const entry = this.subscriptionRegistry.get(topic);

    if (entry) {
      // Increment reference count for existing subscription
      entry.count += 1;

      // If a callback was provided, add it to the set of user callbacks
      if (userCallback) {
        entry.userCallbacks.add(userCallback);
      }

      // Try to subscribe to socket if not already done
      this.performSocketSubscription(topic, entry);
    } else {
      // Create base callback for the socket.io event
      let callback = (data: any) => {
        // Apply transformation if provided
        const transformedData = options?.transform
          ? options.transform(data)
          : data;

        // Notify all registered callbacks with the data
        const entry = this.subscriptionRegistry.get(topic);
        if (entry) {
          entry.userCallbacks.forEach((cb) => {
            cb(transformedData);
          });
        }
      };

      // Apply throttling if requested
      if (options?.throttle && options.throttle > 0) {
        callback = this.throttle(callback, options.throttle);
      }

      // Create a new Set of user callbacks
      const userCallbacks = new Set<(data: any) => void>();

      // If a callback was provided, add it to the set
      if (userCallback) {
        userCallbacks.add(userCallback);
      }

      // Register the new subscription (always, regardless of connection state)
      const newEntry: SubscriptionEntry = {
        count: 1,
        callback,
        options,
        userCallbacks,
        isSocketSubscribed: false,
      };

      this.subscriptionRegistry.set(topic, newEntry);

      // Try to subscribe to socket if connected
      this.performSocketSubscription(topic, newEntry);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(topic, userCallback);
  }

  /**
   * Unsubscribe from a topic
   * @param topic The topic to unsubscribe from
   * @param userCallback Optional specific callback to remove
   */
  private unsubscribe(topic: string, userCallback?: (data: any) => void): void {
    const entry = this.subscriptionRegistry.get(topic);
    if (!entry) return;

    // Decrement reference count
    entry.count -= 1;

    // If a specific callback was provided, remove it from the set
    if (userCallback) {
      entry.userCallbacks.delete(userCallback);
    }

    // Only remove the actual subscription when count reaches 0
    if (entry.count <= 0) {
      if (this.socket?.connected && entry.isSocketSubscribed) {
        this.socket.off(topic, entry.callback);
        this.socket.emit('Unsubscribe', { topic });
      }
      this.subscriptionRegistry.delete(topic);
    }
  }

  /**
   * Disconnect socket
   */
  public disconnect(): void {
    if (this.socket) {
      // Clear subscription registry
      this.subscriptionRegistry.clear();

      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get information about active subscriptions
   */
  public getActiveSubscriptions(): { topic: string; count: number }[] {
    const result: { topic: string; count: number }[] = [];

    for (const [topic, entry] of this.subscriptionRegistry.entries()) {
      if (entry.count > 0) {
        result.push({
          topic,
          count: entry.count,
        });
      }
    }

    return result;
  }
}
