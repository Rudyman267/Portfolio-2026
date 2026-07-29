# Video Streaming Library

A robust video streaming library that provides a unified interface for managing video streams across different platforms.

## Features

- Platform-agnostic streaming interface
- Built-in state management with Zustand
- Real-time health metrics tracking
- Comprehensive error handling
- Type-safe APIs with Zod validation
- React hooks for easy integration

## Installation

The library is part of the monorepo and can be used directly in other packages.

## Quick Start

```typescript
import { StreamingService, StreamConfig } from '@cloud/video-streaming';

// Create and initialize the service
const streamingService = new StreamingService({
  platform: 'agora',
  config: {
    credentials: {
      appId: 'your-app-id',
      token: 'your-token',
    },
  },
});

await streamingService.initialize();

// Start a stream
await streamingService.startStream('stream1', {
  quality: 'high',
  audio: true,
  video: true,
});

// Listen for events
streamingService.onStreamStarted(({ streamId }) => {
  console.log(`Stream ${streamId} started`);
});

streamingService.onError((error) => {
  console.error('Stream error:', formatErrorMessage(error));
});
```

## React Integration

```typescript
import { useStream, useStreamStatus, useStreamHealth, calculateHealthScore, formatBitrate, formatLatency } from '@cloud/video-streaming';

function StreamMonitor({ streamId }: { streamId: string }) {
  const stream = useStream(streamId);
  const status = useStreamStatus(streamId);
  const health = useStreamHealth(streamId);

  if (!stream) return null;

  return (
    <div>
      <h3>Stream Status: {status}</h3>
      {health && (
        <div>
          <p>Health Score: {calculateHealthScore(health)}%</p>
          <p>Bitrate: {formatBitrate(health.bitrate)}</p>
          <p>Latency: {formatLatency(health.latency)}</p>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Initialization**

   - Always initialize the service before starting streams
   - Handle initialization errors appropriately

   ```typescript
   try {
     await streamingService.initialize();
   } catch (error) {
     if (isStreamError(error)) {
       console.error(formatErrorMessage(error));
     }
   }
   ```

2. **Error Handling**

   - Use the provided error utilities and type guards
   - Set up error handlers for both specific streams and global errors

   ```typescript
   streamingService.onError((error) => {
     if (error.type === 'MEDIA_ERROR') {
       // Handle media-specific errors
     }
   });
   ```

3. **Resource Management**

   - Stop streams when they're no longer needed
   - Monitor stream health regularly

   ```typescript
   // Clean up streams
   useEffect(() => {
     return () => {
       streamingService.stopStream(streamId);
     };
   }, [streamId]);
   ```

4. **Performance Optimization**
   - Use selective store subscriptions with the provided hooks
   - Monitor performance metrics
   ```typescript
   const { updateCount, errorCount } = usePerformanceMetrics();
   ```

## API Reference

### StreamingService

The main facade for interacting with video streams.

#### Methods

- `initialize()`: Initialize the streaming service
- `startStream(streamId: string, config: StreamConfig)`: Start a new stream
- `stopStream(streamId: string)`: Stop an active stream
- `updateStream(streamId: string, config: Partial<StreamConfig>)`: Update stream configuration
- `getStreamHealth(streamId: string)`: Get current health metrics

#### Event Handlers

- `onStreamStarted(handler: (data: { streamId: string }) => void)`
- `onStreamEnded(handler: (data: { streamId: string }) => void)`
- `onStatusChange(handler: (data: { streamId: string; status: StreamStatus }) => void)`
- `onHealthUpdate(handler: (data: { streamId: string; health: HealthMetrics }) => void)`
- `onError(handler: (error: StreamError) => void)`

### React Hooks

- `useStream(streamId: string)`: Get full stream data
- `useStreamStatus(streamId: string)`: Get stream status
- `useStreamHealth(streamId: string)`: Get health metrics
- `useStreamError(streamId: string)`: Get stream-specific errors
- `useGlobalError()`: Get global error state
- `usePerformanceMetrics()`: Get performance monitoring data

### Utility Functions

- `isVideoEnabled(config: StreamConfig)`: Check if video is enabled
- `isAudioEnabled(config: StreamConfig)`: Check if audio is enabled
- `calculateHealthScore(metrics: HealthMetrics)`: Calculate overall health score
- `formatErrorMessage(error: StreamError)`: Format error for display
- `formatResolution(width: number, height: number)`: Format resolution string
- `formatBitrate(bitrate: number)`: Format bitrate for display
- `formatLatency(latency: number)`: Format latency for display
