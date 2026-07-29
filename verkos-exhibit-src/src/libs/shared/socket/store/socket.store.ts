import { create } from 'zustand';
import { SocketClient, SubscriptionOptions } from '../socket-client';
import { SocketConfig } from '../interfaces/socket-config.interface';
import { SocketState } from '../interfaces/socket-state.interface';

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
    reconnectCallbacks.forEach((callback) => callback(attemptNumber));
  };
  return {
    client: null,
    isConnected: false,
    error: null,
    config: null,

    configure: (config: SocketConfig) => {
      if (!config.url) {
        throw new Error('Socket URL is required in configuration');
      }
      // Clean up existing client before creating new one
      const { client: existingClient } = get();
      if (existingClient) {
        existingClient.disconnect();
        set({ client: null, isConnected: false, error: null });
      }
      const client = new SocketClient(config, {
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onReconnect: handleReconnect,
      });

      set({ config, client });
    },

    connect: async () => {
      const { client } = get();
      if (!client) {
        throw new Error(
          'Socket client not configured. Call configure() first.'
        );
      }

      try {
        await client.connect();
        set({ error: null });
      } catch (error) {
        set({ error: error as Error, isConnected: false });
        throw error;
      }
    },

    disconnect: () => {
      const { client } = get();
      if (client) {
        client.disconnect();
        set({ client: null, isConnected: false });
      }
    },

    subscribe: <T>(topic: string, options?: SubscriptionOptions) => {
      const { client } = get();
      if (!client) {
        throw new Error('Socket client not initialized');
      }

      return client.subscribe<T>(topic, options);
    },

    getActiveSubscriptions: () => {
      const { client } = get();
      if (!client) {
        return [];
      }

      return client.getActiveSubscriptions();
    },

    getOrgId: () => {
      const { config } = get();
      if (!config) {
        throw new Error('Socket configuration not set');
      }

      if (!config.orgId) {
        throw new Error('Organization ID is not configured');
      }

      return config.orgId;
    },

    emit: (event: string, data: any) => {
      const { client } = get();
      if (client) {
        const socket = client.getSocket();
        if (socket) {
          socket.emit(event, data);
        }
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
  };
});

export default useSocketStore;
