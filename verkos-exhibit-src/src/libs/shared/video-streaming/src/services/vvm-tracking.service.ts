/**
 * VVM (Video Viewer Minutes) Tracking Service
 *
 * This service handles VVM tracking functionality using the existing socket infrastructure
 * from the fleet app. It manages session lifecycle, socket communication, and error handling.
 */

import {
  VVMConfig,
  VVMStreamSession,
  VVMStreamParams,
  VVMError,
  VVMErrorType,
  VVMStreamKey,
  StartMonitoringStreamPayload,
  StopMonitoringStreamPayload,
  VideoPingPayload,
  isValidVVMContext,
  PlatformEnum,
  StreamProtocolEnum,
  ScreenTypeEnum,
  VVMContext,
} from '../types/vvm-types';
import { SocketState } from '../../../socket/interfaces/socket-state.interface';
import {
  mapProviderToPlatformEnum,
  mapProviderToProtocolEnum,
} from '../utils/platform-mapping.utils';
import { VVM_SOCKET_EVENTS } from '../types/vvm-events';
import { StreamStatus } from '../platforms/streaming-platform.interface';

/**
 * VVM Tracking Service Class
 *
 * Manages VVM tracking sessions and socket communication for video streams.
 * Integrates with existing socket infrastructure from the fleet app.
 */
export class VVMTrackingService {
  private activeSessions: Map<VVMStreamKey, VVMStreamSession> = new Map();
  private pingIntervals: Map<VVMStreamKey, NodeJS.Timeout> = new Map();
  private config: VVMConfig;
  private socketEventCleanup: (() => void)[] = [];

  constructor(config: VVMConfig, private socketStore: SocketState) {
    this.config = config;
    this.setupSocketEventListeners();
  }

  /**
   * Setup socket event listeners for disconnect/reconnect using socket store
   * Automatically handles VVM session lifecycle based on socket state
   */
  private setupSocketEventListeners(): void {
    if (!this.socketStore) {
      return;
    }
    try {
      // Listen for disconnect events
      const onDisconnect = (reason: string) => {
        console.log(`[VVM] Socket disconnected: ${reason}`);
        this.handleSocketDisconnect();
      };

      // Listen for reconnect events
      const onReconnect = (attemptNumber: number) => {
        console.log(`[VVM] Socket reconnected after ${attemptNumber} attempts`);
        this.handleSocketReconnect();
      };

      // Listen for connection events (initial connect)
      const onConnect = () => {
        // If we have inactive sessions, reactivate them
        const hasInactiveSessions = Array.from(
          this.activeSessions.values()
        ).some((session) => !session.isActive);
        if (hasInactiveSessions) {
          this.handleSocketReconnect();
        }
      };

      // Register event listeners through socket store
      this.socketEventCleanup.push(
        this.socketStore.onConnect(onConnect),
        this.socketStore.onDisconnect(onDisconnect),
        this.socketStore.onReconnect(onReconnect)
      );

      console.log(
        '[VVM] Socket event listeners setup successfully through socket store'
      );
    } catch (error) {
      console.error('[VVM] Failed to setup socket event listeners:', error);
    }
  }
  /**
   * Start VVM monitoring for a video stream
   */
  async startStreamMonitoring(params: VVMStreamParams): Promise<void> {
    const { streamId, deviceId, context } = params;
    if (!this.config.enableVVMTracking) {
      return;
    }

    if (!isValidVVMContext(context)) {
      const error = this.createError(
        VVMErrorType.CONTEXT_ERROR,
        'Invalid VVM context provided',
        streamId,
        deviceId
      );
      throw error;
    }

    if (!this.socketStore || !this.socketStore.isConnected) {
      return; // Gracefully handle missing socket instead of throwing
    }

    const sessionKey = this.createSessionKey(streamId, deviceId);

    // Check if session already exists
    if (this.activeSessions.has(sessionKey)) {
      console.warn(`[VVM] Session already exists for ${sessionKey}`);
      return;
    }

    try {
      // Create session record
      const session: VVMStreamSession = {
        streamId,
        deviceId,
        screenType: params.screenType,
        platform: params.platform,
        protocol: params.protocol,
        startTime: Date.now(),
        isActive: true,
        organizationId: context.organizationId,
        userId: context.userId,
      };

      this.activeSessions.set(sessionKey, session);

      const payload: StartMonitoringStreamPayload = {
        streamId,
        deviceId,
        screenType: params.screenType,
        platform: params.platform,
        protocol: params.protocol,
      };

      this.socketStore.emit(VVM_SOCKET_EVENTS.START_MONITORING_STREAM, payload);

      // Start ping interval
      this.startVideoPing(streamId, deviceId);
    } catch (error) {
      console.error(`[VVM] Failed to start monitoring: ${error}`);
      this.activeSessions.delete(sessionKey);

      const vvmError = this.createError(
        VVMErrorType.UNKNOWN,
        `Failed to start VVM monitoring: ${error}`,
        streamId,
        deviceId,
        error
      );
      throw vvmError;
    }
  }

  /**
   * Stop VVM monitoring for a video stream
   */
  async stopStreamMonitoring(
    streamId: string,
    deviceId: string
  ): Promise<void> {
    if (!this.config.enableVVMTracking) {
      return;
    }

    const sessionKey = this.createSessionKey(streamId, deviceId);
    const session = this.activeSessions.get(sessionKey);

    if (!session) {
      console.warn(`[VVM] No active session found for ${sessionKey}`);
      return;
    }

    try {
      if (this.socketStore && this.socketStore.isConnected) {
        const payload: StopMonitoringStreamPayload = {
          streamId,
          deviceId,
        };

        this.socketStore.emit(
          VVM_SOCKET_EVENTS.STOP_MONITORING_STREAM,
          payload
        );
      }

      // Stop ping interval
      this.stopVideoPing(sessionKey);

      // Remove session
      this.activeSessions.delete(sessionKey);
    } catch (error) {
      console.error(`[VVM] Failed to stop monitoring: ${error}`);
      const vvmError = this.createError(
        VVMErrorType.UNKNOWN,
        `Failed to stop VVM monitoring: ${error}`,
        streamId,
        deviceId,
        error
      );
      throw vvmError;
    }
  }

  /**
   * Check if VVM tracking is enabled
   */
  isEnabled(): boolean {
    return this.config.enableVVMTracking;
  }

  /**
   * Handle socket disconnection (called by socket store events)
   */
  handleSocketDisconnect(): void {
    console.log('[VVM] Handling socket disconnection');
    this.pingIntervals.forEach((interval) => clearInterval(interval));
    this.pingIntervals.clear();
    this.activeSessions.forEach((session) => {
      session.isActive = false;
    });
  }

  /**
   * Handle socket reconnection (called by socket store events)
   */
  handleSocketReconnect(): void {
    console.log('[VVM] Handling socket reconnection');

    // Restart monitoring for all sessions that were active
    this.activeSessions.forEach((session) => {
      if (!session.isActive) {
        session.isActive = true;
        session.startTime = Date.now(); // Reset start time

        // Restart ping
        this.startVideoPing(session.streamId, session.deviceId);

        // Re-emit start monitoring using socket store
        if (this.socketStore && this.socketStore.isConnected) {
          const payload: StartMonitoringStreamPayload = {
            streamId: session.streamId,
            deviceId: session.deviceId,
            screenType: session.screenType,
            platform: session.platform,
            protocol: session.protocol,
          };
          this.socketStore.emit(
            VVM_SOCKET_EVENTS.START_MONITORING_STREAM,
            payload
          );
        }
      }
    });
  }

  /**
   * Dispose service and cleanup
   * Note: Does not disconnect socket as it's shared with other services
   */
  dispose(): void {
    // Cleanup socket event listeners first
    this.socketEventCleanup.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('[VVM] Error cleaning up socket event listener:', error);
      }
    });
    this.socketEventCleanup = [];
    // Stop all ping intervals
    this.pingIntervals.forEach((interval) => clearInterval(interval));
    this.pingIntervals.clear();
    // Stop all active sessions
    this.activeSessions.forEach((_, key) => {
      const [streamId, deviceId] = key.split('_');
      this.stopStreamMonitoring(streamId, deviceId);
    });
    // Clear sessions
    this.activeSessions.clear();
    // Note: Socket is managed by @libs/shared/socket - don't disconnect
  }

  /**
   * Start video ping for keep-alive
   */
  private startVideoPing(streamId: string, deviceId: string): void {
    const sessionKey = this.createSessionKey(streamId, deviceId);

    // Clear existing interval if any
    this.stopVideoPing(sessionKey);

    const interval = setInterval(() => {
      if (this.socketStore && this.socketStore.isConnected) {
        const payload: VideoPingPayload = {
          timestamp: Date.now(),
          deviceId,
          streamId,
        };
        this.socketStore.emit(
          VVM_SOCKET_EVENTS.START_SENDING_VIDEO_PING,
          payload
        );
      } else {
        // Socket disconnected, stop ping
        this.stopVideoPing(sessionKey);
      }
    }, this.config.pingInterval);

    this.pingIntervals.set(sessionKey, interval);
  }

  /**
   * Stop video ping
   */
  private stopVideoPing(sessionKey: VVMStreamKey): void {
    const interval = this.pingIntervals.get(sessionKey);
    if (interval) {
      clearInterval(interval);
      this.pingIntervals.delete(sessionKey);
    }
  }

  /**
   * Create session key from streamId and deviceId
   */
  private createSessionKey(streamId: string, deviceId: string): VVMStreamKey {
    return `${streamId}_${deviceId}`;
  }

  /**
   * Create structured VVM error
   */
  private createError(
    type: VVMErrorType,
    message: string,
    streamId?: string,
    deviceId?: string,
    originalError?: any
  ): VVMError {
    return {
      type,
      message,
      streamId,
      deviceId,
      timestamp: Date.now(),
      originalError,
    };
  }

  /**
   * Handle stream status changes and start VVM tracking when streaming begins
   * Called from Video.tsx when status changes occur
   * @param streamId The stream identifier
   * @param deviceId The device identifier
   * @param status The current stream status
   * @param backendConfig The backend configuration to determine platform/protocol
   * @param vvmContext The VVM context for tracking
   */
  async handleStreamStatusChange(
    streamId: string,
    deviceId: string,
    status: StreamStatus,
    backendConfig: any,
    vvmContext: VVMContext
  ): Promise<void> {
    // Only start VVM tracking when stream status becomes STREAMING
    if (status === StreamStatus.STREAMING && vvmContext) {
      const sessionKey = this.createSessionKey(streamId, deviceId);
      // Check if VVM tracking is already started for this session
      if (this.activeSessions.has(sessionKey)) {
        return;
      }
      try {
        await this.startStreamMonitoring({
          streamId,
          deviceId,
          screenType: vvmContext.screenType || ScreenTypeEnum.UNKNOWN,
          platform: this.determinePlatform(backendConfig),
          protocol: this.determineProtocol(backendConfig),
          context: vvmContext,
        });
      } catch (vvmError) {
        console.error('[VVM] Failed to start VVM tracking:', vvmError);
      }
    } else if (
      (status === StreamStatus.STOPPED ||
        status === StreamStatus.ERROR ||
        status === StreamStatus.WAITING_FOR_STREAM) &&
      vvmContext
    ) {
      const sessionKey = this.createSessionKey(streamId, deviceId);
      if (this.activeSessions.has(sessionKey)) {
        this.stopStreamMonitoring(streamId, deviceId);
      }
    }
  }

  /**
   * Determine VVM platform enum from backend configuration
   */
  private determinePlatform(backendConfig: any): PlatformEnum {
    if (!backendConfig) {
      return PlatformEnum.UNKNOWN;
    }
    return mapProviderToPlatformEnum(backendConfig.provider);
  }

  /**
   * Determine VVM protocol enum from platform
   */
  private determineProtocol(backendConfig: any): StreamProtocolEnum {
    if (!backendConfig) {
      return StreamProtocolEnum.UNKNOWN;
    }

    // Use the utility function for protocol mapping
    return mapProviderToProtocolEnum(backendConfig.provider);
  }
}
