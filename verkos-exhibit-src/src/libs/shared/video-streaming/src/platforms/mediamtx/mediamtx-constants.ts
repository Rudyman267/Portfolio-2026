/**
 * MediaMTX Platform Constants
 * Centralized configuration for retry logic and connection parameters
 */

/**
 * Reconnection delay configuration for MediaMTX platform
 * Used for exponential backoff when reconnecting after connection failure
 */
export const MEDIAMTX_RECONNECT_DELAY = {
  INITIAL: 5000,
  MAX: 60000,
} as const;

/**
 * WHEP client retry configuration
 * Used for exponential backoff when retrying HTTP requests
 */
export const WHEP_RETRY_DELAY = {
  INITIAL: 2000,
  MAX: 30000,
} as const;
