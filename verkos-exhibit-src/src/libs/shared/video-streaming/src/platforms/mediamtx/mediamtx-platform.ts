import {
  MediaMTXConfig,
  StreamConfig,
  StreamError,
  StreamingPlatform,
  StreamStatus,
} from '../streaming-platform.interface';
import { WHEPClient } from './whep-client';
import { MEDIAMTX_RECONNECT_DELAY } from './mediamtx-constants';

/**
 * Implementation of StreamingPlatform for MediaMTX using WHEP protocol
 * Provides WebRTC-based streaming via WHEP (WebRTC-HTTP Egress Protocol)
 */
export class MediaMTXPlatform implements StreamingPlatform {
  private whepClient: WHEPClient | null = null;
  private pc: RTCPeerConnection | null = null;
  private deviceId = '';
  private streamId = '';
  private containerId?: string;
  private whepUrl = '';
  private streamStatus: StreamStatus = StreamStatus.STOPPED;
  private videoElement: HTMLVideoElement | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  private statusListeners: Array<(status: StreamStatus) => void> = [];
  private errorListeners: Array<(error: StreamError) => void> = [];

  /**
   * Initialize the MediaMTX platform with configuration
   */
  async initialize(config: StreamConfig): Promise<void> {
    try {
      const { deviceId, streamId, containerId, platformConfig } = config;
      const mediamtxConfig = platformConfig as MediaMTXConfig;

      this.deviceId = deviceId;
      this.streamId = streamId;
      this.containerId = containerId;
      this.whepUrl = mediamtxConfig.play_whep_url;

      console.error('[MediaMTX] Platform initialized', {
        deviceId,
        streamId,
      });
    } catch (error) {
      console.error('[MediaMTX] Initialization failed', error);
      throw this.createError(
        1001,
        'Failed to initialize MediaMTX platform',
        error
      );
    }
  }

  /**
   * Subscribe to the stream using WHEP protocol
   */
  async subscribeToStream(): Promise<void> {
    try {
      this.updateStreamStatus(StreamStatus.INITIALIZING);

      if (this.containerId) {
        await this.attachToElement(this.containerId);
      }

      this.updateStreamStatus(StreamStatus.CONNECTING);

      this.pc = new RTCPeerConnection({
        bundlePolicy: 'max-bundle',
      });

      this.pc.ontrack = (event: RTCTrackEvent) => {
        console.error('[MediaMTX] Received track', event.track.kind);
        if (event.track.kind === 'video' && this.videoElement) {
          this.videoElement.srcObject = event.streams[0];
          this.videoElement.muted = true;
          this.videoElement.autoplay = true;

          this.videoElement.onloadedmetadata = () => {
            this.updateStreamStatus(StreamStatus.STREAMING);
          };
        }
      };

      this.pc.oniceconnectionstatechange = () => {
        const state = this.pc?.iceConnectionState;
        console.error('[MediaMTX] ICE connection state', state);

        if (state === 'failed' || state === 'disconnected') {
          this.updateStreamStatus(StreamStatus.ERROR);
          this.notifyError(
            this.createError(
              2002,
              'Connection lost. Attempting to reconnect...'
            )
          );
          this.scheduleReconnect();
        } else if (state === 'connected') {
          this.updateStreamStatus(StreamStatus.STREAMING);
          // Reset reconnect attempts on successful connection
          this.reconnectAttempts = 0;
        }
      };

      this.pc.addTransceiver('video', { direction: 'recvonly' });

      this.whepClient = new WHEPClient();

      const urlObj = new URL(this.whepUrl);
      const token = urlObj.searchParams.get('token') || '';

      await this.whepClient.view(this.pc, this.whepUrl, this.streamId, token);

      // Reset reconnect attempts on successful subscription
      this.reconnectAttempts = 0;

      console.error('[MediaMTX] Successfully subscribed to stream');
    } catch (error) {
      console.error('[MediaMTX] Failed to subscribe to stream', error);
      this.updateStreamStatus(StreamStatus.WAITING_FOR_STREAM);

      this.notifyError(
        this.createError(
          2001,
          'Video stream is currently unavailable. The system will automatically establish connection when the stream becomes available.',
          error
        )
      );

      this.scheduleReconnect();
    }
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 5s, 10s, 20s, 40s, 60s (capped)
    const exponentialDelay = Math.min(
      MEDIAMTX_RECONNECT_DELAY.INITIAL *
        Math.pow(2, this.reconnectAttempts - 1),
      MEDIAMTX_RECONNECT_DELAY.MAX
    );

    console.error(
      '[MediaMTX] Scheduling reconnect',
      `attempt ${this.reconnectAttempts}, in ${exponentialDelay}ms`
    );

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;

      await this.cleanup(false);

      try {
        await this.subscribeToStream();
      } catch (error) {
        console.error('[MediaMTX] Reconnect failed', error);
      }
    }, exponentialDelay);
  }

  /**
   * Unsubscribe from the stream
   */
  async unsubscribeFromStream(): Promise<void> {
    await this.cleanup(true);
  }

  /**
   * Clean up resources
   */
  private async cleanup(stopReconnect: boolean): Promise<void> {
    if (stopReconnect && this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.whepClient) {
      try {
        await this.whepClient.stop();
      } catch (error) {
        console.error('[MediaMTX] Error stopping WHEP client', error);
      }
      this.whepClient = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      this.videoElement.srcObject = null;
    }

    if (stopReconnect) {
      this.updateStreamStatus(StreamStatus.STOPPED);
    }
  }

  /**
   * Get current stream status
   */
  getStreamStatus(): StreamStatus {
    return this.streamStatus;
  }

  /**
   * Attach stream to a DOM element
   */
  async attachToElement(elementId: string): Promise<void> {
    try {
      const container = document.getElementById(elementId);
      if (!container) {
        throw this.createError(3002, `Element with ID ${elementId} not found`);
      }

      container.innerHTML = '';

      const video = document.createElement('video');
      video.id = `mediamtx-video-${this.streamId}`;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';

      container.appendChild(video);
      this.videoElement = video;

      console.error('[MediaMTX] Video element attached');
    } catch (error) {
      console.error('[MediaMTX] Failed to attach to element', error);
      throw this.createError(3003, 'Failed to attach stream to element', error);
    }
  }

  /**
   * Clean up all resources
   */
  async dispose(): Promise<void> {
    await this.cleanup(true);
    this.statusListeners = [];
    this.errorListeners = [];
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
    const oldStatus = this.streamStatus;
    this.streamStatus = status;

    console.error('[MediaMTX] Status changed', oldStatus, '→', status);

    this.statusListeners.forEach((listener) => {
      if (listener) {
        listener(status);
      }
    });
  }

  /**
   * Notify error listeners
   */
  private notifyError(error: StreamError): void {
    console.error('[MediaMTX] Notifying error', error.message);

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
