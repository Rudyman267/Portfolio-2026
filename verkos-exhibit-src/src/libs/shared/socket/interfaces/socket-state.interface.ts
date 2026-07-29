import { SocketClient, SubscriptionOptions } from '../socket-client';
import { SocketConfig } from './socket-config.interface';

export interface SocketState {
  client: SocketClient | null;
  isConnected: boolean;
  error: Error | null;
  config: SocketConfig | null;
  configure: (config: SocketConfig) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: <T>(topic: string, options?: SubscriptionOptions) => () => void;
  getActiveSubscriptions: () => { topic: string; count: number }[];
  getOrgId: () => string;
  emit: (event: string, data: any) => void;
  onConnect: (callback: () => void) => () => void;
  onDisconnect: (callback: (reason: string) => void) => () => void;
  onReconnect: (callback: (attemptNumber: number) => void) => () => void;
}
