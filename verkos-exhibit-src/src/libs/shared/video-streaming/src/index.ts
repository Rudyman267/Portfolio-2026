// Export components
import MemoizedVideo from './components/Video';
export { MemoizedVideo as Video };

// Export configuration
export {
  configureVideoStreaming,
  isStreamingConfigured,
  type StreamingConfiguration,
  type HttpClient,
} from './config/StreamingConfig';

// Export types
export {
  StreamStatus,
  type StreamError,
  type MillicastConfig,
  type AgoraConfig,
  type StreamConfig,
} from './platforms/streaming-platform.interface';

// Export services (mostly for testing/advanced use)
export { StreamingService } from './services/streaming.service';

// Export platform implementations
export { AgoraPlatform } from './platforms/agora/agora-platform';
export { MillicastPlatform } from './platforms/millicast/millicast-platform';
// VVM Configuration
export { configureVVMTracking, isVVMEnabled } from './config/vvm-config';

// VVM Services
export { VVMTrackingService } from './services/vvm-tracking.service';

// VVM Types
export type {
  VVMConfig,
  VVMContext,
  VVMStreamSession,
  VVMStreamParams,
  VVMError,
  VVMStatusUpdate,
  StartMonitoringStreamPayload,
  StopMonitoringStreamPayload,
  VideoPingPayload,
  VVMStreamKey,
} from './types/vvm-types';

// VVM Enums
export {
  ScreenTypeEnum,
  PlatformEnum,
  StreamProtocolEnum,
  VVMErrorType,
  VVMStatus,
} from './types/vvm-types';

// VVM Type Guards & Utilities
export {
  isValidVVMContext,
  isValidVVMConfig,
  DEFAULT_VVM_CONFIG,
  DEFAULT_SCREEN_TYPE,
  VVM_PING_INTERVAL,
} from './types/vvm-types';

// VVM Socket Events
export { VVM_SOCKET_EVENTS } from './types/vvm-events';
