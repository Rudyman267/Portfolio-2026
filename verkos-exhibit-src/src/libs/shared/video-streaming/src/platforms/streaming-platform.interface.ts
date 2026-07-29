export type BasePlatformConfig = object;

export interface AgoraConfig extends BasePlatformConfig {
  appId: string;
  token: string;
  channel: string;
  role?: string; // Agora specific field
}

export interface MillicastConfig extends BasePlatformConfig {
  streamName: string;
  accountId: string;
  subscribe_token: string;
  endPoints?: {
    subscribe_api_url: string;
    publish_api_url?: string;
    rtmp_publish_url?: string;
    rtmps_publish_url?: string;
    whip_endpoint?: string;
  };
}

export interface MediaMTXConfig extends BasePlatformConfig {
  play_whep_url: string;
  play_rtsp_url?: string;
  stream_id?: string;
  play_token?: string;
}

// Combined stream configuration
export interface StreamConfig {
  deviceId: string;
  streamId: string;
  containerId?: string;
  platformConfig: BasePlatformConfig;
}

export enum StreamStatus {
  INITIALIZING = 'INITIALIZING', // Loading
  CONNECTING = 'CONNECTING', // Loading
  STREAMING = 'STREAMING', // Started
  STOPPED = 'STOPPED', // Video stopped
  ERROR = 'ERROR', // Something went wrong, refresh
  WAITING_FOR_STREAM = 'WAITING_FOR_STREAM', // Waiting for stream, auto-retry, if take longer
}

export interface StreamError {
  code: number;
  message: string;
  details?: unknown;
}

/**
 * Generic interface for video streaming platforms
 * Focused on subscribing to remote streams only
 */
export interface StreamingPlatform {
  /**
   * Initialize the streaming platform with all configuration
   * @param config Complete streaming configuration including credentials and stream IDs
   */
  initialize(config: StreamConfig): Promise<void>;

  /**
   * Subscribe to the stream (using config provided during initialization)
   */
  subscribeToStream(): Promise<void>;

  /**
   * Unsubscribe from the stream
   */
  unsubscribeFromStream(): Promise<void>;

  /**
   * Get the current status of the stream
   */
  getStreamStatus(): StreamStatus;

  /**
   * Attach the stream to a DOM element
   * @param elementId DOM element ID to attach to
   */
  attachToElement(elementId: string): Promise<void>;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;

  /**
   * Register an event listener
   * @param event Event name
   * @param callback Function to call when event occurs
   */
  on(event: 'status', callback: (status: StreamStatus) => void): void;
  on(event: 'error', callback: (error: StreamError) => void): void;
}
