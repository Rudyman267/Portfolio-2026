import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng';
import {
  AgoraConfig,
  StreamConfig,
  StreamError,
  StreamingPlatform,
  StreamStatus,
} from '../streaming-platform.interface';

/**
 * Implementation of the StreamingPlatform interface for Agora
 * Focused on subscribing to remote streams (receive-only)
 * Simplified approach based on stable implementation
 */
export class AgoraPlatform implements StreamingPlatform {
  private client: IAgoraRTCClient | null = null;
  private appId = '';
  private token = '';
  private channelName = '';
  private streamId = '';
  private deviceId = '';
  private containerId?: string;
  private streamStatus: StreamStatus = StreamStatus.STOPPED;
  private remoteUser?: IAgoraRTCRemoteUser;
  private currentUserId?: UID; // Track current user ID

  // Event listeners
  private statusListeners: Array<(status: StreamStatus) => void> = [];
  private errorListeners: Array<(error: StreamError) => void> = [];

  /**
   * Initialize the Agora platform with full configuration
   */
  async initialize(config: StreamConfig): Promise<void> {
    try {
      const { deviceId, streamId, containerId, platformConfig } = config;
      const agoraConfig = platformConfig as AgoraConfig;

      this.appId = agoraConfig.appId;
      this.token = agoraConfig.token;
      this.channelName = agoraConfig.channel;
      this.streamId = streamId;
      this.deviceId = deviceId;
      this.containerId = containerId;

      // Use VP9 codec for better quality
      AgoraRTC.setLogLevel(4);
      this.client = AgoraRTC.createClient({
        mode: 'live',
        codec: 'vp9',
      });
    } catch (error) {
      console.error('[Agora] Initialization failed', error);
      throw this.createError(
        1001,
        'Failed to initialize Agora platform',
        error
      );
    }
  }

  /**
   * Subscribe to the stream (using config provided during initialization)
   */
  async subscribeToStream(): Promise<void> {
    if (!this.client) {
      throw this.createError(1002, 'Agora client not initialized');
    }

    try {
      // Update stream status
      this.updateStreamStatus(StreamStatus.INITIALIZING);

      // Setup event handlers
      this.setupEvents();

      // Join the channel
      await this.client.join(this.appId, this.channelName, this.token, null);

      const clientOptions = { level: 2 };
      await this.client.setClientRole('audience', clientOptions);

      // Update status to connecting
      this.updateStreamStatus(StreamStatus.CONNECTING);
    } catch (error) {
      console.error('[Agora] Failed to subscribe to stream', error);

      // Check if this is a stream availability error
      const isStreamUnavailable =
        (error as any)?.message &&
        ((error as any).message.includes('timeout') ||
          (error as any).message.includes('rejected') ||
          (error as any).message.includes('failed to connect'));

      if (isStreamUnavailable) {
        this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);
        this.notifyError(
          this.createError(
            5001,
            'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.',
            error
          )
        );
      } else {
        this.updateStreamStatus(StreamStatus.ERROR);
        throw this.createError(2001, 'Failed to subscribe to stream', error);
      }
    }
  }

  /**
   * Unsubscribe from the stream (leave channel)
   */
  async unsubscribeFromStream(): Promise<void> {
    try {
      if (!this.client || this.streamStatus === StreamStatus.STOPPED) {
        return;
      }

      // Leave channel
      await this.client.leave();

      // Update status
      this.updateStreamStatus(StreamStatus.STOPPED);
      this.remoteUser = undefined;
      this.currentUserId = undefined;
    } catch (error) {
      console.error('[Agora] Failed to unsubscribe from stream', error);
      throw this.createError(2002, 'Failed to unsubscribe from stream', error);
    }
  }

  /**
   * Get current stream status
   */
  getStreamStatus(): StreamStatus {
    return this.streamStatus;
  }

  /**
   * Attach the stream to a DOM element
   */
  async attachToElement(elementId: string): Promise<void> {
    try {
      if (!this.remoteUser?.videoTrack) {
        throw this.createError(3001, 'Video track not available');
      }

      const element = document.getElementById(elementId);
      if (!element) {
        throw this.createError(3002, `Element with ID ${elementId} not found`);
      }

      // Clean DOM element before attaching
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }

      // Play video in the element
      this.remoteUser.videoTrack.play(elementId, { fit: 'contain' });
    } catch (error) {
      console.error('[Agora] Failed to attach stream to element', error);
      throw this.createError(3003, 'Failed to attach stream to element', error);
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    try {
      // Unsubscribe if needed
      if (this.streamStatus !== StreamStatus.STOPPED) {
        await this.unsubscribeFromStream();
      }

      // Reset listeners and state
      this.statusListeners = [];
      this.errorListeners = [];
      this.client = null;
      this.streamStatus = StreamStatus.STOPPED;
      this.remoteUser = undefined;
      this.currentUserId = undefined;
    } catch (error) {
      console.error('[Agora] Failed to dispose platform', error);
      throw this.createError(4001, 'Failed to dispose Agora platform', error);
    }
  }

  /**
   * Register event listeners
   */
  on(event: 'status', callback: (status: StreamStatus) => void): void;
  on(event: 'error', callback: (error: StreamError) => void): void;
  on(event: string, callback: any): void {
    if (event === 'status') {
      this.statusListeners.push(callback);
    } else if (event === 'error') {
      this.errorListeners.push(callback);
    }
  }

  /**
   * Set up all event handlers in one place - following the stable app approach
   */
  private setupEvents(): void {
    if (!this.client) return;

    // Remove any existing listeners
    this.client.removeAllListeners();

    // Simplified connection state handler - only focus on major states
    this.client.on('connection-state-change', (state) => {
      // Only update status for major state changes
      if (state === 'DISCONNECTED') {
        this.updateStreamStatus(StreamStatus.STOPPED);
      }
      // Don't update status for CONNECTING/CONNECTED to reduce flickering
      // Video availability will be determined by user-published event
    });

    // Simple error handler
    this.client.on('error', (err: any) => {
      console.error('[Agora] Client error:', err);

      // Only update to error state for real errors
      if (err.message && !err.message.includes('no users in channel')) {
        this.updateStreamStatus(StreamStatus.ERROR);
        this.notifyError(this.createError(5001, err.message, err));
      }
    });

    // Handle when a user publishes video
    this.client.on('user-published', async (user, mediaType) => {
      try {
        // Only care about video
        if (mediaType === 'video') {
          // Store the user ID for tracking
          this.currentUserId = user.uid;

          // Subscribe to the user's video
          await this.client!.subscribe(user, mediaType);

          // Store the remote user object to access videoTrack
          this.remoteUser = user;

          // Update status to streaming
          this.updateStreamStatus(StreamStatus.STREAMING);

          // If container ID is provided, automatically attach
          if (this.containerId && user.videoTrack) {
            await this.attachToElement(this.containerId);
          }
        }
      } catch (error) {
        console.error('[Agora] Failed to subscribe to video', error);
      }
    });

    // Handle when the current user unpublishes video
    this.client.on('user-unpublished', (user, mediaType) => {
      // Only care about video and the current user
      if (mediaType === 'video' && this.currentUserId === user.uid) {
        // Update to waiting state
        this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);
        this.notifyError(
          this.createError(
            5002,
            'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.',
            new Error('Video unpublished')
          )
        );
      }
    });

    // Handle when the current user leaves
    this.client.on('user-left', (user) => {
      // Only care if it's the user we're tracking
      if (this.currentUserId === user.uid) {
        // Update to waiting state
        this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);
        this.notifyError(
          this.createError(
            5002,
            'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.',
            new Error('User left channel')
          )
        );
      }
    });
  }

  /**
   * Update stream status and notify listeners
   * Only update if status has actually changed
   */
  private updateStreamStatus(status: StreamStatus): void {
    // Skip if status hasn't changed
    if (this.streamStatus === status) return;

    // Update internal state
    this.streamStatus = status;

    // Notify listeners
    this.statusListeners.forEach((listener) => {
      if (typeof listener === 'function') {
        listener(status);
      }
    });
  }

  /**
   * Notify error listeners
   */
  private notifyError(error: StreamError): void {
    this.errorListeners.forEach((listener) => {
      if (typeof listener === 'function') {
        listener(error);
      }
    });
  }

  /**
   * Create a standardized error object
   */
  private createError(
    code: number,
    message: string,
    details?: unknown
  ): StreamError {
    return { code, message, details };
  }
}
