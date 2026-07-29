// Type declarations for @millicast/sdk
// This is a stub module to satisfy TypeScript - actual implementation uses the npm package

declare module '@millicast/sdk' {
  export interface SubscriberOptions {
    streamAccountId: string;
    streamName: string;
    subscriberToken?: string;
  }

  export interface SubscriberResponse {
    urls: string[];
    jwt: string;
  }

  export interface ConnectOptions {
    events?: string[];
    pinnedSourceId?: string;
    excludedSourceIds?: string[];
    disableAudio?: boolean;
    disableVideo?: boolean;
    layer?: {
      spatialLayerId?: number;
      temporalLayerId?: number;
    };
  }

  export class View {
    constructor(streamName: string, tokenGenerator: () => Promise<SubscriberResponse>, mediaElement?: HTMLVideoElement | null, autoReconnect?: boolean);
    
    connect(options?: ConnectOptions): Promise<void>;
    
    stop(): Promise<void>;
    
    reconnect(): Promise<void>;
    
    isActive(): boolean;
    
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
  }

  export class Director {
    static getSubscriber(
      streamName: string,
      accountId: string,
      subscriberToken?: string
    ): Promise<SubscriberResponse>;
  }

  export default {
    View,
    Director
  };
}
