import { useRef, useState, useCallback, useEffect } from 'react';
import { StreamingService } from '../services/streaming.service';
import {
  StreamStatus,
  StreamError,
} from '../platforms/streaming-platform.interface';

export interface VideoStreamRef {
  refreshStream: () => Promise<void>;
  getStatus: () => StreamStatus;
  isRefreshing: () => boolean;
  getError: () => string | null;
}

interface UseVideoStreamProps {
  deviceId: string;
  streamId: string;
}

export function useVideoStream({ deviceId, streamId }: UseVideoStreamProps) {
  // Reference to the streaming service instance
  const serviceRef = useRef<StreamingService | null>(null);

  // Container ref - will be passed to the Video component
  const containerRef = useRef<HTMLDivElement>(null);

  // Public ref - will be returned for external control
  const videoStreamRef = useRef<VideoStreamRef>({
    refreshStream: async () => {
      if (isRefreshing) return;
      await refreshStream();
    },
    getStatus: () => status,
    isRefreshing: () => isRefreshing,
    getError: () => error,
  });

  // State tracking
  const [status, setStatus] = useState<StreamStatus>(StreamStatus.INITIALIZING);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status change handler - internal use only
  const handleStatusChange = useCallback(
    (newStatus: StreamStatus) => {
      setStatus(newStatus);

      // If we get to streaming state, we're no longer refreshing
      if (newStatus === StreamStatus.STREAMING) {
        setIsRefreshing(false);
      }
    },
    []
  );

  // Error handler - internal use only
  const handleError = useCallback((err: StreamError) => {
    setError(err.message);

    // Only set ERROR status if it's not a "waiting for stream" type error
    if (
      !err.message.includes('auto-connect') &&
      !err.message.includes('not currently live')
    ) {
      setStatus(StreamStatus.ERROR);
    }

    // Error occurred, so we're no longer refreshing
    setIsRefreshing(false);
  }, []);

  // Function to request stream - used for initial load and refresh
  const initStream = useCallback(
    async (service: StreamingService) => {
      const containerId = `video-container-${deviceId}-${streamId}`;

      try {
        // Setting initial status
        setStatus(StreamStatus.INITIALIZING);
        setError(null);

        // Requesting stream with callbacks
        await service.requestStream(
          deviceId,
          streamId,
          containerId,
          handleStatusChange,
          handleError
        );
      } catch (err: any) {
        const errorMsg =
          typeof err === 'object'
            ? err.message || JSON.stringify(err)
            : String(err);
        setError(errorMsg);
        setStatus(StreamStatus.ERROR);
        setIsRefreshing(false);
      }
    },
    [deviceId, streamId, handleStatusChange, handleError]
  );

  // Function to refresh the stream - exposed via ref
  const refreshStream = useCallback(async () => {
    // Don't allow refreshing if we're already refreshing or initializing
    if (isRefreshing || status === StreamStatus.INITIALIZING) {
      return;
    }

    setIsRefreshing(true);

    try {
      // Get the existing service
      const service = serviceRef.current;
      if (!service) {
        console.error('No service instance available for refresh');
        setIsRefreshing(false);
        return;
      }

      // Release the current stream
      await service.releaseStream();

      // Request a new stream using the same service instance
      await initStream(service);
    } catch (err: any) {
      console.error(err);
      setError(
        typeof err === 'object' ? err.message || 'Refresh failed' : String(err)
      );
      setStatus(StreamStatus.ERROR);
      setIsRefreshing(false);
    }
  }, [isRefreshing, status, initStream]);

  // Initialize the stream on mount and when deviceId/streamId changes
  useEffect(() => {
    // Create service instance if it doesn't exist
    if (!serviceRef.current) {
      serviceRef.current = new StreamingService();
    }

    // Always initialize the stream when deviceId or streamId changes
    initStream(serviceRef.current);

    // Cleanup function - runs on unmount and when deviceId/streamId changes
    return () => {
      if (serviceRef.current) {
        serviceRef.current
          .releaseStream()
          .then(() => {
            // Only dispose on complete unmount, not on props change
            if (!deviceId || !streamId) {
              return serviceRef.current?.dispose();
            }
            return Promise.resolve();
          })
          .catch((err) => {
            console.error('Error during cleanup:', err);
          });
      }
    };
  }, [deviceId, streamId, initStream]);

  // Update the ref methods whenever dependencies change
  useEffect(() => {
    videoStreamRef.current = {
      refreshStream,
      getStatus: () => status,
      isRefreshing: () => isRefreshing,
      getError: () => error,
    };
  }, [refreshStream, status, isRefreshing, error]);

  // Helper function to check if error is just unavailability
  const isStreamUnavailabilityError = useCallback((errorMsg: string | null) => {
    return (
      !!errorMsg &&
      (errorMsg.includes('unavailable') ||
        errorMsg.includes('will auto-connect') ||
        errorMsg.includes('not currently live') ||
        errorMsg.includes('automatically establish'))
    );
  }, []);

  return {
    // States for rendering overlays
    status,
    error,
    isRefreshing,
    isStreamUnavailabilityError: isStreamUnavailabilityError(error),

    // Refs for control and rendering
    containerRef,
    videoStreamRef,

    // Methods
    refreshStream,
  };
}
