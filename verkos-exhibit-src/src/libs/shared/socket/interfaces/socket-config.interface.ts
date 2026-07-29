export interface SocketConfig {
  url: string;
  path?: string;
  orgId: string; // Organization ID used for all topic subscriptions
  options?: {
    transports?: string[];
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    timeout?: number;
  };
}
