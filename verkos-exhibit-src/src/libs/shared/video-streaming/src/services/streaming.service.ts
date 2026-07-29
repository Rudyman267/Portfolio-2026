import {
  StreamingPlatform,
  StreamConfig,
  AgoraConfig,
  MillicastConfig,
  MediaMTXConfig,
  StreamStatus,
  StreamError,
} from '../platforms/streaming-platform.interface';
import { getStreamingConfig } from '../config/StreamingConfig';
// VVM imports
import { VVMTrackingService } from './vvm-tracking.service';
import { getVVMConfig, isVVMEnabled } from '../config/vvm-config';
// Platform mapping utilities
import {
  StreamingProvider,
  createPlatformInstance,
} from '../utils/platform-mapping.utils';

export interface BackendStreamConfiguration {
  provider: StreamingProvider;
  config: {
    appId?: string;
    token?: string;
    channel?: string;
    role?: string; // Agora specific field

    // Millicast config fields
    streamName?: string;
    accountId?: string;
    subscribe_token?: string;
    endPoints?: {
      subscribe_api_url: string;
      publish_api_url?: string;
      rtmp_publish_url?: string;
      rtmps_publish_url?: string;
      whip_endpoint?: string;
    };

    // MediaMTX config fields
    play_whep_url?: string;
    play_rtsp_url?: string;
    stream_id?: string;
    play_token?: string;

    [key: string]: any;
  };
}

/**
 * Enhanced service for managing video streaming with VVM tracking
 * Focuses on core functionality of device/stream handling and VVM integration
 */
export class StreamingService {
  private platform: StreamingPlatform | null = null;
  private initialized = false;
  private currentDeviceId = '';
  private currentStreamId = '';
  // VVM integration
  private vvmService: VVMTrackingService | null = null;
  private currentBackendConfig: BackendStreamConfiguration | null = null;
  constructor(private socketStore?: any) {
    // Initialize VVM service if enabled
    if (isVVMEnabled() && this.socketStore) {
      try {
        const vvmConfig = getVVMConfig();
        this.vvmService = new VVMTrackingService(vvmConfig, this.socketStore);
      } catch (error) {
        console.error(
          '[StreamingService] Failed to initialize VVM service:',
          error
        );
      }
    }
  }

  /**
   * Request a video stream for a specific device
   * @param deviceId Source device identifier
   * @param streamId Stream identifier
   * @param elementId Optional DOM element ID to attach stream
   * @param statusCallback Optional status callback
   * @param errorCallback Optional error callback
   */
  async requestStream(
    deviceId: string,
    streamId: string,
    elementId?: string,
    statusCallback?: (status: StreamStatus) => void,
    errorCallback?: (error: StreamError) => void
  ): Promise<void> {
    try {
      // Video stream requested

      // If already streaming, release the current stream first
      if (this.initialized && this.platform) {
        // Releasing previous stream
        await this.releaseStream();
      }

      // Store current stream identifiers
      this.currentDeviceId = deviceId;
      this.currentStreamId = streamId;

      // 1. Get the streaming configuration from backend
      // Getting stream configuration
      const backendConfig = await this.getStreamConfig(deviceId, streamId);
      this.currentBackendConfig = backendConfig;
      // Received stream configuration

      // Create stream config based on provider
      const streamConfig: StreamConfig = {
        deviceId,
        streamId,
        containerId: elementId,
        platformConfig: backendConfig.config as
          | AgoraConfig
          | MillicastConfig
          | MediaMTXConfig,
      };

      // Initializing streaming platform
      await this.initializePlatform(backendConfig.provider, streamConfig);

      // Register callbacks directly if provided
      if (statusCallback) {
        // Registering status callback
        this.platform!.on('status', statusCallback);
      }

      if (errorCallback) {
        // Registering error callback
        this.platform!.on('error', errorCallback);
      }

      // Platform initialized, subscribing to stream
      await this.platform!.subscribeToStream();

      // Successfully requested stream
    } catch (error) {
      // Failed to request stream - clear any partially set state
      this.currentBackendConfig = null;
      this.currentDeviceId = '';
      this.currentStreamId = '';
      console.error(error);
      throw error;
    }
  }

  /**
   * Release the current video stream and stop VVM tracking
   * @returns A promise that resolves when the stream is released or rejects with an error
   */
  async releaseStream(): Promise<void> {
    if (!this.platform || !this.initialized) {
      return;
    }

    try {
      await this.platform.unsubscribeFromStream();
    } catch (error) {
      console.error(`[StreamingService] Failed to release stream`, error);
      // Don't throw error during cleanup to avoid blocking further cleanup operations
      // Just log it and continue
    }

    // Clean up stream-specific state but keep platform for reuse
    this.currentDeviceId = '';
    this.currentStreamId = '';
    this.currentBackendConfig = null;
  }

  /**
   * Register a status change listener
   * @param callback Function to call when status changes
   * @deprecated Use the statusCallback parameter in requestStream instead
   */
  onStatusChange(callback: (status: StreamStatus) => void): void {
    console.warn(
      `[StreamingService] DEPRECATED: onStatusChange() is deprecated. Pass statusCallback to requestStream() instead.`
    );

    if (!this.platform || !this.initialized) {
      console.warn(
        `[StreamingService] Can't register status listener - platform not initialized`
      );
      return;
    }

    this.platform.on('status', callback);
  }

  /**
   * Register an error listener
   * @param callback Function to call when an error occurs
   * @deprecated Use the errorCallback parameter in requestStream instead
   */
  onError(callback: (error: StreamError) => void): void {
    console.warn(
      `[StreamingService] DEPRECATED: onError() is deprecated. Pass errorCallback to requestStream() instead.`
    );

    if (!this.platform || !this.initialized) {
      console.warn(
        `[StreamingService] Can't register error listener - platform not initialized`
      );
      return;
    }

    this.platform.on('error', callback);
  }

  /**
   * Attach the current stream to a DOM element
   * @param elementId DOM element ID to attach to
   */
  async attachToElement(elementId: string): Promise<void> {
    if (!this.platform || !this.initialized) {
      throw new Error('No active stream to attach');
    }

    await this.platform.attachToElement(elementId);
  }

  /**
   * Clean up all resources including VVM service
   */
  async dispose(): Promise<void> {
    if (this.vvmService) {
      try {
        this.vvmService.dispose();
        this.vvmService = null;
      } catch (vvmError) {
        console.error('Error in dispose vvm service', vvmError);
      }
    }

    if (!this.platform || !this.initialized) {
      return;
    }

    try {
      await this.platform.dispose();
      this.platform = null;
      this.initialized = false;
      this.currentDeviceId = '';
      this.currentStreamId = '';
      this.currentBackendConfig = null;
    } catch (error) {
      console.error('[StreamingService] Failed to dispose resources', error);
      throw error;
    }
  }

  /**
   * Get stream configuration from backend
   * Currently hardcoded for testing purposes
   */
  private async getStreamConfig(
    deviceId: string,
    streamId: string
  ): Promise<BackendStreamConfiguration> {
    try {
      // Get the configured endpoint and HTTP client
      const { endpoint, httpClient } = getStreamingConfig();

      // Construct the stream name by combining deviceId and streamId
      // Format: {deviceId}_{streamId} with hyphens replaced by underscores
      const formattedStreamId = streamId.replace(/-/g, '_');
      const streamName = `${deviceId}_${formattedStreamId}`;

      // Format: v2/video-streaming/details?deviceId={deviceId}&streamName={streamName}
      const url = `${endpoint}/v2/video-streaming/details?deviceId=${deviceId}&streamName=${streamName}`;
      const response = await httpClient.get(url);

      const apiResponse = response.data;

      let backendConfig: BackendStreamConfiguration;

      const provider = apiResponse.platform as StreamingProvider;

      if (provider === 'agora') {
        backendConfig = {
          provider,
          config: {
            appId: apiResponse.agora.appid,
            token: apiResponse.agora.rtc_token,
            channel: apiResponse.url.split('&')[0].replace('channel=', ''),
            role: apiResponse.role,
          },
        };
      } else if (provider === 'millicast') {
        backendConfig = {
          provider,
          config: {
            streamName: streamName,
            accountId: deviceId, // Using deviceId as accountId
            subscribe_token: apiResponse.millicast.subscribe_token,
            endPoints: apiResponse.millicast.endPoints,
          },
        };
      } else if (provider === 'mediamtx') {
        backendConfig = {
          provider,
          config: {
            play_whep_url: apiResponse.mediamtx.play_whep_url,
            play_rtsp_url: apiResponse.mediamtx.play_rtsp_url,
            stream_id: apiResponse.mediamtx.stream_id,
            play_token: apiResponse.mediamtx.play_token,
          },
        };
      } else {
        throw new Error(`Unsupported streaming platform: ${provider}`);
      }
      return backendConfig;
    } catch (error) {
      console.error('[StreamingService] Failed to get stream config:', error);

      // For testing purposes, determine which provider to use based on deviceId
      // If deviceId starts with "mill_", use Millicast, otherwise use Agora

      // return {
      //   provider: 'millicast',
      //   config: {
      //     streamName: `67f7bd2c65255daa7544f526_57_0_0`,
      //     accountId: 'account123',
      //     subscribe_token:
      //       '23beae9e126ae1b0b26a8e131f04e828761b48711c9430da79e37ebf917e79ce',
      //     endPoints: {
      //       publish_api_url:
      //         'https://director.millicast.com/api/director/publish',
      //       rtmp_publish_url: 'rtmp://rtmp-auto.millicast.com:1935/v2/pub/',
      //       rtmps_publish_url: 'rtmps://rtmp-auto.millicast.com:443/v2/pub/',
      //       whip_endpoint: 'https://director.millicast.com/api/whip/',
      //       subscribe_api_url:
      //         'https://director.millicast.com/api/director/subscribe',
      //     },
      //   },
      // };
      throw error;
    }
  }

  /**
   * Initialize the streaming platform
   */
  private async initializePlatform(
    provider: StreamingProvider,
    config: StreamConfig
  ): Promise<void> {
    try {
      // Creating platform instance using the utility function
      this.platform = createPlatformInstance(provider);

      if (!this.platform) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Platform instance created, initializing
      await this.platform.initialize(config);

      this.initialized = true;
      // Platform initialized successfully
    } catch (error) {
      // Failed to initialize platform
      console.error(error);
      throw error;
    }
  }

  /**
   * Get VVM service instance (for external access if needed)
   */
  getVVMService(): VVMTrackingService | null {
    return this.vvmService;
  }

  /**
   * Get current backend configuration (for VVM tracking)
   */
  getCurrentBackendConfig(): BackendStreamConfiguration | null {
    return this.currentBackendConfig;
  }

  /**
   * Check if VVM tracking is enabled and available
   */
  isVVMEnabled(): boolean {
    return this.vvmService !== null && this.vvmService.isEnabled();
  }
}
