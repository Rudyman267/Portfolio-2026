# Video Streaming Integration

## Overview

Integrate video streaming using Millicast SDK and Agora RTC from `@libs/shared/video-streaming`.

## Reference App

**fleet** - Multi-camera video wall, live drone feeds

## Quick Setup

### 1. Import Video Components

```typescript
import { VideoPlayer } from '@libs/shared/video-streaming';
import { StreamStatus } from '@libs/shared/video-streaming/types';
```

### 2. Render Video Player

```typescript
function VideoFeed() {
  const [status, setStatus] = useState<StreamStatus>('connecting');

  return (
    <VideoPlayer
      streamId="drone-camera-1"
      platform="millicast" // or 'agora'
      onStatusChange={setStatus}
      onError={(error) => console.error('Stream error:', error)}
    />
  );
}
```

### 3. Multi-Stream Layout

```typescript
function VideoWall() {
  const streamIds = ['cam-1', 'cam-2', 'cam-3', 'cam-4'];

  return (
    <div className="grid grid-cols-2 gap-4">
      {streamIds.map((streamId) => (
        <VideoPlayer key={streamId} streamId={streamId} platform="millicast" />
      ))}
    </div>
  );
}
```

## Common Patterns

- Show loading state during stream initialization
- Display connection quality indicators
- Handle reconnection automatically
- Provide fallback for stream failures

## Reference

See `apps/fleet/src/app/features/video-wall/` for complete implementation
