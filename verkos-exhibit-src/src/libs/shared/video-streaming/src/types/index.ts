import { z } from 'zod';

/**
 * Enumeration for different stream status states
 * @description Represents the possible states of a video stream
 */
export const StreamStatusSchema = z.enum([
  'INITIALIZING',
  'CONNECTING',
  'STREAMING',
  'PAUSED',
  'STOPPED',
  'ERROR',
]);

export type StreamStatus = z.infer<typeof StreamStatusSchema>;

/**
 * Schema for stream configuration
 * @description Defines the configuration options for initializing a video stream
 */
export const StreamConfigSchema = z.object({
  streamId: z.string().min(1),
  resolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  frameRate: z.number().int().min(1).max(60),
  bitrate: z.number().int().positive().optional(),
  codec: z.enum(['h264', 'vp8', 'vp9']).optional(),
  latencyMode: z.enum(['low', 'normal', 'quality']).default('normal'),
});

export type StreamConfig = z.infer<typeof StreamConfigSchema>;

/**
 * Schema for stream health metrics
 * @description Defines the structure for monitoring stream health and performance
 */
export const HealthMetricsSchema = z.object({
  timestamp: z.number(),
  bitrate: z.number().nonnegative(),
  packetLoss: z.number().min(0).max(100),
  latency: z.number().nonnegative(),
  frameRate: z.number().nonnegative(),
  resolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export type HealthMetrics = z.infer<typeof HealthMetricsSchema>;

/**
 * Schema for stream error classification
 * @description Defines the structure for stream-related errors
 */
export const StreamErrorSchema = z.object({
  code: z.number().int(),
  type: z.enum([
    'CONNECTION_ERROR',
    'MEDIA_ERROR',
    'AUTHENTICATION_ERROR',
    'CONFIGURATION_ERROR',
    'RESOURCE_ERROR',
  ]),
  message: z.string(),
  timestamp: z.number(),
  details: z.record(z.unknown()).optional(),
});

export type StreamError = z.infer<typeof StreamErrorSchema>;

/**
 * Example usage:
 * ```typescript
 * const config: StreamConfig = {
 *   streamId: "stream-123",
 *   resolution: { width: 1280, height: 720 },
 *   frameRate: 30,
 *   latencyMode: "low"
 * };
 *
 * // Validate configuration
 * const validatedConfig = StreamConfigSchema.parse(config);
 * ```
 */
