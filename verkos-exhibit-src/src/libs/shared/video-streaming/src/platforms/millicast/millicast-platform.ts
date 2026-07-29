import {
  MillicastConfig,
  StreamConfig,
  StreamError,
  StreamingPlatform,
  StreamStatus,
} from '../streaming-platform.interface';
import { View, Director } from '@millicast/sdk';

/**
 * Implementation of the StreamingPlatform interface for Millicast
 * Focused on subscribing to remote streams (video-only)
 * Based on Millicast SDK examples: https://github.com/millicast/millicast-sdk
 */
export class MillicastPlatform implements StreamingPlatform {
  private millicastView: any = null;
  private streamName = '';
  private accountId = '';
  private subscriberToken = '';
  private deviceId = '';
  private streamId = '';
  private containerId?: string;
  private streamStatus: StreamStatus = StreamStatus.STOPPED;
  private videoElement: HTMLVideoElement | null = null;
  private pendingStream: MediaStream | null = null;
  private hasVideo = true; // Video-only implementation
  private hasAudio = false; // Audio disabled as per requirements

  // Event listeners
  private statusListeners: Array<(status: StreamStatus) => void> = [];
  private errorListeners: Array<(error: StreamError) => void> = [];

  /**
   * Initialize the Millicast platform with full configuration
   */
  async initialize(config: StreamConfig): Promise<void> {
    try {
      const { deviceId, streamId, containerId, platformConfig } = config;
      const millicastConfig = platformConfig as MillicastConfig;

      this.streamName = millicastConfig.streamName;
      this.accountId = millicastConfig.accountId;
      this.subscriberToken = millicastConfig.subscribe_token;
      this.deviceId = deviceId;
      this.streamId = streamId;
      this.containerId = containerId;

      // // Configure Millicast logging
      // Logger.setLevel(Logger.DEBUG);
    } catch (error) {
      console.error('[Millicast] Initialization failed', error);
      throw this.createError(
        1001,
        'Failed to initialize Millicast platform',
        error
      );
    }
  }

  /**
   * Subscribe to the stream (using config provided during initialization)
   * Following the GitHub example implementation exactly
   */
  async subscribeToStream(): Promise<void> {
    try {
      // Debug: See if listeners are already registered when we start
      // Debug: checking listener counts

      // Update stream status
      this.updateStreamStatus(StreamStatus.INITIALIZING);

      // Create the video element if containerId is provided
      // For Millicast we MUST create the video element BEFORE subscribing
      if (this.containerId) {
        await this.attachToElement(this.containerId);
      }

      // Create a new viewer - follows the GitHub example exactly
      this.newViewer();

      // Update status to connecting
      this.updateStreamStatus(StreamStatus.CONNECTING);

      // Connect to the stream - using the same options as GitHub example for video-only
      const connectOptions = {
        disableAudio: true, // Disable audio as per requirement
        disableVideo: false,
      };

      await this.millicastView.connect(connectOptions);
    } catch (error) {
      console.error('[Millicast] Failed to subscribe to stream', error);

      // Provide a user-friendly message for "stream not being published" errors
      if (error) {
        // Use dedicated status for waiting/auto-retry state
        this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);

        // Instead of throwing, notify the error with a friendly message but keep trying
        this.notifyError(
          this.createError(
            2001,
            'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.',
            error
          )
        );

        // Continue retrying the connection rather than throwing
        // The SDK's internal reconnection mechanism will keep trying
        return;
      }

      // For other errors, update status and throw
      this.updateStreamStatus(StreamStatus.ERROR);
      throw this.createError(2001, 'Failed to subscribe to stream', error);
    }
  }

  /**
   * Create a new Millicast viewer
   * Follows the GitHub example newViewer() function exactly
   */
  private newViewer(): void {
    // Create token generator function - exact same approach as GitHub
    const tokenGenerator = () =>
      Director.getSubscriber(
        this.streamName,
        this.accountId,
        this.subscriberToken
      );

    // Create the View instance - following GitHub example
    this.millicastView = new View(this.streamName, tokenGenerator);

    // Set up event handlers exactly as in GitHub example
    this.millicastView.on('broadcastEvent', (event: any) => {
      // Handle broadcast events
      if (event.name === 'inactive') {
        this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);
        this.notifyError(
          this.createError(
            5002,
            'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.',
            new Error('Stream inactive')
          )
        );
      } else if (event.name === 'active') {
        // When the stream becomes active, update the status to indicate we're streaming
        // This will clear any error or waiting state that might be displayed
        this.updateStreamStatus(StreamStatus.STREAMING);
      }
    });

    // Handle track events exactly like GitHub example
    this.millicastView.on('track', (event: any) => {
      // Following GitHub example logic for track handling
      if (this.hasVideo && event.track.kind === 'video') {
        this.addStream(event.streams[0]);
        this.updateStreamStatus(StreamStatus.STREAMING);
      }
    });

    // Handle other events
    this.millicastView.on('stopped', () => {
      this.updateStreamStatus(StreamStatus.STOPPED);
    });

    this.millicastView.on('connectionError', (error: any) => {
      console.error('[Millicast] Connection error:', error);

      // Treat almost all Millicast connection errors as stream unavailability (waiting for stream)
      // Only truly fatal errors should show the error state
      const isFatalError =
        error &&
        error.message &&
        (error.message.includes('authentication failed') ||
          error.message.includes('unauthorized') ||
          error.message.includes('forbidden'));

      if (isFatalError) {
        // Only for fatal errors like authentication issues, show error state
        this.notifyError(this.createError(5001, error.message, error));
        this.updateStreamStatus(StreamStatus.ERROR);
      } else {
        // For all other connection errors, use the waiting for stream state
        const errorMessage =
          'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.';
        this.notifyError(this.createError(5001, errorMessage, error));
        this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);
      }
    });
  }

  /**
   * Add stream to video element
   * Follows the GitHub example addStream() function exactly
   */
  private addStream(stream: MediaStream): void {
    if (!this.videoElement) {
      this.pendingStream = stream;
      return;
    }

    try {
      // Following GitHub example addStream() function exactly
      if (this.videoElement.srcObject) {
        // If we already have a stream, follow GitHub example for stream switching
        const tmp = this.videoElement.cloneNode(true) as HTMLVideoElement;
        tmp.srcObject = stream;

        // Wait for metadata to load before replacing
        tmp.addEventListener('loadedmetadata', () => {
          if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.parentNode.replaceChild(tmp, this.videoElement);
            this.videoElement = tmp;
          }
        });
      } else {
        // Simple case - no existing stream
        this.videoElement.srcObject = stream;
      }

      // Ensure video plays - following GitHub example
      this.videoElement.muted = true;
      const playPromise = this.videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('[Millicast] Error playing video:', error);
        });
      }
    } catch (error) {
      console.error('[Millicast] Error adding stream:', error);
      this.notifyError(this.createError(6001, 'Error adding stream', error));
    }
  }

  /**
   * Unsubscribe from the stream
   */
  async unsubscribeFromStream(): Promise<void> {
    try {
      if (!this.millicastView || this.streamStatus === StreamStatus.STOPPED) {
        return;
      }

      // Disconnect from the stream
      await this.millicastView.stop();
      this.millicastView = null;

      // Clean up video element
      if (this.videoElement && this.videoElement.srcObject) {
        this.videoElement.srcObject = null;
      }

      // Update status
      this.updateStreamStatus(StreamStatus.STOPPED);
    } catch (error) {
      console.error('[Millicast] Failed to unsubscribe from stream', error);
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
      // Get the container element
      const container = document.getElementById(elementId);
      if (!container) {
        throw this.createError(3002, `Element with ID ${elementId} not found`);
      }

      // Clear the container
      container.innerHTML = '';

      // Create video element
      const video = document.createElement('video');
      video.id = `millicast-video-${this.streamId}`;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true; // Video only, no audio
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';

      // Add video element to container
      container.appendChild(video);
      this.videoElement = video;

      // If we have a pending stream, attach it now
      if (this.pendingStream) {
        this.addStream(this.pendingStream);
        this.pendingStream = null;
      }
    } catch (error) {
      console.error('[Millicast] Failed to attach stream to element', error);
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
      this.millicastView = null;
      this.streamStatus = StreamStatus.STOPPED;
      this.pendingStream = null;
    } catch (error) {
      console.error('[Millicast] Failed to dispose platform', error);
      throw this.createError(
        4001,
        'Failed to dispose Millicast platform',
        error
      );
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
   * Update stream status and notify listeners
   */
  private updateStreamStatus(status: StreamStatus): void {
    // Update internal state
    const oldStatus = this.streamStatus;
    this.streamStatus = status;

    // Status changed notification

    // Notify listeners
    this.statusListeners.forEach((listener, index) => {
      if (listener) {
        // Notifying listener about status change
        listener(status);
      }
    });
  }

  /**
   * Notify error listeners
   */
  private notifyError(error: StreamError): void {
    // Notifying about error

    this.errorListeners.forEach((listener, index) => {
      if (typeof listener === 'function') {
        // Sending error to specific listener
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
