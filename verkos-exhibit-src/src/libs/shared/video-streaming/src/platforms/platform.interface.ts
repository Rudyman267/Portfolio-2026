import { StreamStatus } from './streaming-platform.interface';

/**
 * Basic types for the streaming platform
 */
export interface StreamConfig {
  sourceId: string; // Device/entity ID
  streamId: string; // Stream identifier
  containerId?: string; // DOM element ID to attach the stream to
}

export interface StreamError {
  code: number;
  message: string;
}

/**
 * Base interface for streaming platforms
 */
export interface StreamingPlatform {
  /**
   * Initialize the platform with credentials
   */
  initialize(config: { appId: string; [key: string]: any }): Promise<void>;

  /**
   * Start a video stream
   */
  startStream(config: StreamConfig): Promise<void>;

  /**
   * Stop a video stream
   */
  stopStream(streamId: string): Promise<void>;

  /**
   * Get the current status of a stream
   */
  getStreamStatus(streamId: string): StreamStatus;

  /**
   * Attach a stream to a DOM element
   */
  attachToElement(streamId: string, elementId: string): Promise<void>;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;

  /**
   * Register an event listener
   */
  on(
    event: 'status',
    callback: (streamId: string, status: StreamStatus) => void
  ): void;
  on(
    event: 'error',
    callback: (streamId: string, error: StreamError) => void
  ): void;
}
