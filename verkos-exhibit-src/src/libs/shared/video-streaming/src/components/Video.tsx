import * as React from 'react';
const { useEffect, useRef } = React;
import { StreamingService } from '../services/streaming.service';
import { StreamStatus } from '../platforms/streaming-platform.interface';
import { VVMContext } from '../types/vvm-types';
import { SocketState } from '../../../socket/interfaces/socket-state.interface';

export interface VideoProps {
  /**
   * Socket store instance to be passed to the StreamingService
   * This avoids direct imports from the video-streaming library
   */
  socketStore: SocketState;
  /**
   * Device identifier (e.g., "6805e5ff65255daa75491220")
   * This is used to identify the device and construct the API request
   */
  deviceId: string;

  /**
   * Stream identifier (e.g., "165_0_7")
   * This is combined with deviceId to form the streamName parameter in the API request:
   * For example: "6805e5ff65255daa75491220_165_0_7"
   */
  streamId: string;

  /**
   * Optional callback to be notified when stream status changes
   * Can be used by parent components to implement their own UI based on status
   */
  onStatusChange?: (status: StreamStatus, isRefreshing: boolean) => void;

  /**
   * Optional callback to be notified when stream errors occur
   * The isUnavailabilityError parameter indicates if this is just a "stream unavailable"
   * error (which may resolve itself) rather than a fatal error
   */
  onError?: (error: string, isUnavailabilityError: boolean) => void;

  /**
   * Optional reference to access component methods like refreshStream
   */
  videoRef?: React.RefObject<{
    refreshStream: () => Promise<void>;
    getStatus: () => StreamStatus;
    isRefreshing: () => boolean;
    getError: () => string | null;
  }>;

  /**
   * Class name to apply to the container div
   */
  className?: string;
  vvmContext?: VVMContext | null;
}

/**
 * Video component that displays a video stream from a device
 *
 * OPTIMIZATION NOTE:
 * This component is optimized to prevent unnecessary re-renders when streaming status changes.
 *
 * Key optimization strategies:
 * 1. Uses refs instead of state for tracking status, errors, and refreshing state
 * 2. Directly forwards status updates from the platform to parent components
 * 3. Avoids useEffect dependencies that would trigger re-renders
 *
 * This approach significantly reduces renders, especially important when multiple
 * videos are displayed in a grid or when the video status changes frequently.
 *
 * Usage:
 * ```jsx
 * // Example with full stream name in separate parts:
 * // If full stream name is "6805e5ff65255daa75491220_165_0_7"
 * <Video
 *   deviceId="6805e5ff65255daa75491220"
 *   streamId="165_0_7"
 * />
 * ```
 */
/**
 * Video component for displaying video streams from remote devices
 * Optimized to avoid unnecessary re-renders by using refs instead of state for status tracking
 * This improves performance, particularly when multiple video streams are displayed
 */
const Video: React.FC<VideoProps> = ({
  deviceId,
  streamId,
  onStatusChange,
  onError,
  videoRef,
  className = '',
  vvmContext,
  socketStore,
}: VideoProps) => {
  // Render counter to verify the component doesn't re-render unnecessarily
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // Keep this log as an alert for potential re-render issues
  if (renderCountRef.current > 1) {
    console.warn('[VIDEO] CoreVideo re-rendered:', {
      renderCount: renderCountRef.current,
      deviceId,
      streamId,
      instanceId: `${deviceId}-${streamId}`,
    });
  }

  // Container ref for the video element
  const containerRef = useRef<HTMLDivElement>(null);

  // Streaming service instance - created once and reused
  const serviceRef = useRef<StreamingService | null>(null);

  // Using refs instead of state to prevent unnecessary re-renders
  // This is key to preventing the component from re-rendering when statuses change
  const statusRef = useRef<StreamStatus>(StreamStatus.INITIALIZING);
  const errorRef = useRef<string | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  // VVM-related refs
  const vvmContextRef = useRef<VVMContext | null>(vvmContext ?? null);

  // Function to request stream - defined outside useEffect so we can reuse it for refresh
  const initStream = async (service: StreamingService) => {
    // Always use the current values from refs, not the props
    // This is critical for the "freeze component" approach to work
    const currentDeviceId = deviceIdRef.current;
    const currentStreamId = streamIdRef.current;

    const containerId = `video-container-${currentDeviceId}-${currentStreamId}`;

    // Video stream initialization
    try {
      // Setting initial values using refs
      statusRef.current = StreamStatus.INITIALIZING;
      errorRef.current = null;
      isRefreshingRef.current = false;

      // Define status handler that uses refs and directly forwards callbacks
      const statusHandler = (newStatus: StreamStatus) => {
        // Update ref without triggering a re-render
        statusRef.current = newStatus;

        // If we get to streaming state, we're no longer refreshing
        if (newStatus === StreamStatus.STREAMING) {
          isRefreshingRef.current = false;
        }

        // Handle VVM tracking for status changes
        if (serviceRef.current) {
          const vvmService = serviceRef.current.getVVMService();
          if (vvmService && vvmContextRef.current) {
            // Get backend config for VVM tracking
            const backendConfig = serviceRef.current.getCurrentBackendConfig();
            if (backendConfig) {
              vvmService
                .handleStreamStatusChange(
                  currentStreamId,
                  currentDeviceId,
                  newStatus,
                  backendConfig,
                  vvmContextRef.current
                )
                .catch((error) => {
                  console.error('VVM handling failed:', error);
                });
            }
          }
        }

        // Immediately forward the status to parent
        if (onStatusChange) {
          onStatusChange(newStatus, isRefreshingRef.current);
        }
      };

      // Define error handler that uses refs and directly forwards callbacks
      const errorHandler = (err: any) => {
        // Store error in ref without triggering a re-render
        errorRef.current = err.message;

        // Only set ERROR status if it's not a "waiting for stream" type error
        if (
          !err.message.includes('auto-connect') &&
          !err.message.includes('not currently live')
        ) {
          // Update status ref
          statusRef.current = StreamStatus.ERROR;

          // Directly notify parent of status change
          if (onStatusChange) {
            onStatusChange(StreamStatus.ERROR, isRefreshingRef.current);
          }
        }

        // Error occurred, so we're no longer refreshing
        isRefreshingRef.current = false;

        // Notify parent about error
        if (onError) {
          onError(err.message, isStreamUnavailabilityError(err.message));
        }
      };

      // Requesting stream with callbacks - use ref values
      await service.requestStream(
        currentDeviceId,
        currentStreamId,
        containerId,
        statusHandler,
        errorHandler
      );
    } catch (err: any) {
      const errorMsg =
        typeof err === 'object'
          ? err.message || JSON.stringify(err)
          : String(err);

      // Store error in ref
      errorRef.current = errorMsg;

      // Update status ref
      statusRef.current = StreamStatus.ERROR;

      // Not refreshing anymore
      isRefreshingRef.current = false;

      // Notify parents directly
      if (onStatusChange) {
        onStatusChange(StreamStatus.ERROR, false);
      }

      if (onError) {
        onError(errorMsg, isStreamUnavailabilityError(errorMsg));
      }
    }
  };

  // Function to refresh the stream - this will be called from the UI
  const refreshStream = async () => {
    // Don't allow refreshing if we're already refreshing or initializing
    if (
      isRefreshingRef.current ||
      statusRef.current === StreamStatus.INITIALIZING
    ) {
      // Already refreshing, ignoring request
      return;
    }

    // Refreshing stream
    isRefreshingRef.current = true;

    // Notify parent about refreshing status change
    if (onStatusChange) {
      onStatusChange(statusRef.current, true);
    }

    try {
      // Get the existing service
      const service = serviceRef.current;
      if (!service) {
        // Cannot refresh - no service instance
        console.error('No service instance available for refresh');
        isRefreshingRef.current = false;
        return;
      }

      // Release the current stream
      // Releasing current stream before refresh
      await service.releaseStream();

      // Request a new stream using the same service instance
      // Re-requesting stream
      await initStream(service);
    } catch (err: any) {
      // Error during refresh
      console.error(err);

      const errorMsg =
        typeof err === 'object' ? err.message || 'Refresh failed' : String(err);

      // Store error in ref
      errorRef.current = errorMsg;

      // Update status ref
      statusRef.current = StreamStatus.ERROR;

      // Not refreshing anymore
      isRefreshingRef.current = false;

      // Notify parents directly
      if (onStatusChange) {
        onStatusChange(StreamStatus.ERROR, false);
      }

      if (onError) {
        onError(errorMsg, isStreamUnavailabilityError(errorMsg));
      }
    }
  };

  // Track props in refs to ensure streaming uses latest values

  // REMOVED: No longer tracking status with state
  /*
  useEffect(() => {
    // Status is now tracked with ref, so no need for this effect
  }, []);
  */

  // No longer tracking state changes with effects since we're using refs

  // Initialize on mount only - store deviceId/streamId in refs
  // This is critical for the "freeze component" approach to work
  const deviceIdRef = useRef(deviceId);
  const streamIdRef = useRef(streamId);

  // Run only on mount
  useEffect(() => {
    // Create service instance
    serviceRef.current = new StreamingService(socketStore);

    // Initialize the stream
    initStream(serviceRef.current);

    // Cleanup function - runs on unmount only
    return () => {
      // Cleaning up stream
      if (serviceRef.current) {
        serviceRef.current
          .releaseStream()
          .then(() => {
            return serviceRef.current?.dispose();
          })
          .catch((err) => {
            console.error('Error during cleanup:', err);
          });
      }
    };
  }, []); // Empty dependencies - run only on mount/unmount

  // Update the refs if props change (though with our freeze approach, this shouldn't re-render)
  useEffect(() => {
    deviceIdRef.current = deviceId;
    streamIdRef.current = streamId;
    vvmContextRef.current = vvmContext ?? null;
  }, [deviceId, streamId, vvmContext]);

  // Helper function to check if error message indicates stream is just unavailable
  const isStreamUnavailabilityError = (errorMsg: string | null) => {
    return (
      !!errorMsg &&
      (errorMsg.includes('unavailable') ||
        errorMsg.includes('will auto-connect') ||
        errorMsg.includes('not currently live') ||
        errorMsg.includes('automatically establish'))
    );
  };

  // REMOVED: Error notification now happens directly in handlers
  // This is another key part of the fix - removing state dependencies
  /*
  React.useEffect(() => {
    // Error notifications now happen directly in the handlers
  }, [onError]);
  */

  // Expose methods via ref if provided - no dependencies on state
  React.useImperativeHandle(
    videoRef,
    () => ({
      refreshStream,
      getStatus: () => statusRef.current,
      isRefreshing: () => isRefreshingRef.current,
      getError: () => errorRef.current,
    }),
    [refreshStream] // Only depends on refreshStream function
  );

  // REMOVED: No longer need this effect since we directly forward status in the handler
  // This is a key part of the fix - removing the effect dependency on status
  /*
  React.useEffect(() => {
    // This effect was removed as part of the POC fix
    // Status updates now go directly from handler to parent without state updates
  }, [isRefreshing, onStatusChange]);
  */

  return (
    <div
      ref={containerRef}
      className={`w-full relative overflow-hidden bg-background-level-1 rounded-md aspect-video ${className}`}
    >
      <div
        id={`video-container-${deviceId}-${streamId}`}
        className="relative w-full h-full max-w-full max-h-full overflow-hidden z-10 [&>video]:w-full [&>video]:h-full [&>video]:object-contain [&>video]:max-w-full [&>video]:max-h-full"
      />
    </div>
  );
};

// Completely freeze the Video component after first render
// This is a standard React pattern when you have a component that should NEVER re-render
// All updates are handled via refs, so no re-renders are needed
const MemoizedVideo = React.memo(Video, () => {
  // This comparison function always returns true, which means "never re-render"
  // This is appropriate because:
  // 1. All state updates are handled with refs, not state
  // 2. All communication with parent happens via callbacks, not props
  // 3. The visual appearance doesn't need to change based on new props

  // IMPORTANT: We always return true to prevent re-renders regardless of prop changes
  // This is the key optimization - the component NEVER re-renders after initial mount
  return true; // Always skip re-renders, even when props change
});

// Export both the named and default exports for backward compatibility
export { MemoizedVideo as Video };
export default MemoizedVideo;
