export interface VVMConfig {
  enableVVMTracking: boolean;
  pingInterval: number; // default: 5000ms
}
export interface VVMContext {
  organizationId: string;
  userId: string;
  screenType?: ScreenTypeEnum;
}

export interface VVMStreamSession {
  streamId: string; // payload-index
  deviceId: string; // device identifier
  screenType: ScreenTypeEnum;
  platform: PlatformEnum;
  protocol: StreamProtocolEnum;
  startTime: number; // timestamp when session started
  isActive: boolean; // session status
  organizationId: string; // for VVM tracking
  userId: string; // for VVM tracking
}
export interface VVMStreamParams {
  streamId: string; // payload-index
  deviceId: string; // device identifier
  screenType: ScreenTypeEnum;
  platform: PlatformEnum;
  protocol: StreamProtocolEnum;
  context: VVMContext; // context from consuming app
}
export interface StartMonitoringStreamPayload {
  streamId: string; // payload-index
  deviceId: string; // device identifier
  screenType: ScreenTypeEnum;
  platform: PlatformEnum;
  protocol: StreamProtocolEnum;
}
export interface StopMonitoringStreamPayload {
  streamId: string; // payload-index
  deviceId: string; // device identifier
}
export interface VideoPingPayload {
  timestamp: number; // current timestamp
  deviceId: string; // device identifier
  streamId: string; // payload-index
}

export enum ScreenTypeEnum {
  FLEET_VIEW = 'fleet-view',
  UNKNOWN = 'unknown',
  // Additional screen types can be added here as needed
}

export enum PlatformEnum {
  AGORA = 'agora',
  ANTMEDIA = 'antmedia',
  MILLICAST = 'millicast',
  MEDIAMTX = 'mediamtx',
  UNKNOWN = 'unknown',
}

export enum StreamProtocolEnum {
  WEB_RTC = 'webrtc',
  RTMP = 'rtmp',
  RTSP = 'rtsp',
  UNKNOWN = 'unknown',
}

export enum VVMErrorType {
  EXHAUSTED = 'VVM_EXHAUSTED',
  SOCKET_ERROR = 'SOCKET_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  UNKNOWN = 'UNKNOWN',
}
export interface VVMError {
  type: VVMErrorType;
  message: string;
  streamId?: string;
  deviceId?: string;
  timestamp: number;
  originalError?: any;
}

export enum VVMStatus {
  INACTIVE = 'inactive',
  STARTING = 'starting',
  ACTIVE = 'active',
  STOPPING = 'stopping',
  ERROR = 'error',
  EXHAUSTED = 'exhausted',
}
export interface VVMStatusUpdate {
  streamId: string;
  deviceId: string;
  status: VVMStatus;
  error?: VVMError;
  timestamp: number;
}
export function isValidVVMContext(context: any): context is VVMContext {
  return !!(
    context &&
    typeof context.organizationId === 'string' &&
    typeof context.userId === 'string' &&
    context.organizationId.length > 0 &&
    context.userId.length > 0
  );
}

export function isValidVVMConfig(config: any): config is VVMConfig {
  return !!(
    config &&
    typeof config.enableVVMTracking === 'boolean' &&
    typeof config.pingInterval === 'number' &&
    config.pingInterval >= VVM_PING_INTERVAL.MINIMUM
  );
}

export type VVMStreamKey = `${string}_${string}`; // deviceId_streamId format
export const VVM_PING_INTERVAL = {
  MINIMUM: 1000, // 1 second minimum
  DEFAULT: 5000, // 5 seconds default
} as const;

export const DEFAULT_VVM_CONFIG: VVMConfig = {
  enableVVMTracking: true,
  pingInterval: VVM_PING_INTERVAL.DEFAULT, // 5 seconds
};
export const DEFAULT_SCREEN_TYPE = ScreenTypeEnum.FLEET_VIEW;
