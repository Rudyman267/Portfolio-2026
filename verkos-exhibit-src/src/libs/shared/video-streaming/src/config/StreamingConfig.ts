/**
 * Video streaming configuration system
 */

// Type for the HTTP client that handles authenticated requests
export type HttpClient = {
  get: (url: string) => Promise<any>;
};

// Configuration interface - keeping it minimal
export interface StreamingConfiguration {
  /**
   * API endpoint base URL for streaming services
   */
  endpoint: string;

  /**
   * HTTP client that handles authentication
   */
  httpClient: HttpClient;
}

// Store for the current configuration
let currentConfig: StreamingConfiguration | null = null;

/**
 * Configure the video streaming library
 * Should be called once at application startup
 */
export function configureVideoStreaming(config: StreamingConfiguration): void {
  if (!config.endpoint) {
    throw new Error('[StreamingConfig] Endpoint URL is required');
  }

  if (!config.httpClient) {
    throw new Error('[StreamingConfig] HTTP client is required');
  }

  currentConfig = { ...config };
}

/**
 * Get the current streaming configuration
 * @throws Error if configuration hasn't been initialized
 */
export function getStreamingConfig(): StreamingConfiguration {
  if (!currentConfig) {
    throw new Error(
      '[StreamingConfig] Video streaming not configured. Call configureVideoStreaming() first.'
    );
  }

  return currentConfig;
}

/**
 * Check if the streaming library has been configured
 */
export function isStreamingConfigured(): boolean {
  return !!currentConfig;
}
