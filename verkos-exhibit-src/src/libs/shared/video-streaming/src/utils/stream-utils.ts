import { StreamConfig, StreamError, HealthMetrics } from '../types';

/**
 * Checks if a stream configuration has video enabled
 * @param config Stream configuration to validate
 * @returns True if video streaming is configured
 */
export const isVideoEnabled = (config: StreamConfig): boolean => {
  return (
    config.resolution.width > 0 &&
    config.resolution.height > 0 &&
    config.frameRate > 0
  );
};

/**
 * Checks if a stream configuration has high quality video enabled
 * @param config Stream configuration to validate
 * @returns True if high quality video is configured
 */
export const isHighQualityEnabled = (config: StreamConfig): boolean => {
  return config.latencyMode === 'quality' && config.resolution.width >= 1920;
};

/**
 * Calculates a health score from health metrics
 * @param metrics Health metrics to evaluate
 * @returns Score between 0 and 100
 */
export const calculateHealthScore = (metrics: HealthMetrics): number => {
  const weights = {
    bitrate: 0.4,
    packetLoss: 0.3,
    latency: 0.3,
  };

  // Normalize metrics to 0-100 scale
  const normalizedBitrate = Math.min((metrics.bitrate / 2000000) * 100, 100); // 2Mbps as reference
  const normalizedPacketLoss = Math.max(0, 100 - metrics.packetLoss * 100);
  const normalizedLatency = Math.max(0, 100 - (metrics.latency / 1000) * 100); // 1000ms as reference

  return Math.round(
    normalizedBitrate * weights.bitrate +
      normalizedPacketLoss * weights.packetLoss +
      normalizedLatency * weights.latency
  );
};

/**
 * Creates a user-friendly message from a stream error
 * @param error Stream error to format
 * @returns User-friendly error message
 */
export const formatErrorMessage = (error: StreamError): string => {
  const baseMessage = error.message;
  const details = error.details ? `: ${JSON.stringify(error.details)}` : '';
  return `${error.type} - ${baseMessage}${details}`;
};

/**
 * Formats stream resolution for display
 * @param width Resolution width
 * @param height Resolution height
 * @returns Formatted resolution string (e.g., "1920x1080")
 */
export const formatResolution = (width: number, height: number): string => {
  return `${width}x${height}`;
};

/**
 * Formats bitrate for display
 * @param bitrate Bitrate in bits per second
 * @returns Formatted bitrate string (e.g., "2.5 Mbps")
 */
export const formatBitrate = (bitrate: number): string => {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  }
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(1)} Kbps`;
  }
  return `${bitrate} bps`;
};

/**
 * Formats latency for display
 * @param latency Latency in milliseconds
 * @returns Formatted latency string (e.g., "150ms")
 */
export const formatLatency = (latency: number): string => {
  return `${Math.round(latency)}ms`;
};
