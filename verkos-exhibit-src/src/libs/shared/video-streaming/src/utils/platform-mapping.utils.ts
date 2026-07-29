import { StreamingPlatform } from '../platforms/streaming-platform.interface';
import { AgoraPlatform } from '../platforms/agora/agora-platform';
import { MillicastPlatform } from '../platforms/millicast/millicast-platform';
import { MediaMTXPlatform } from '../platforms/mediamtx/mediamtx-platform';
import { PlatformEnum, StreamProtocolEnum } from '../types/vvm-types';

/**
 * Known streaming platform providers
 */
export type StreamingProvider =
  | 'agora'
  | 'millicast'
  | 'antmedia'
  | 'mediamtx'
  | string;

/**
 * Map a provider string to a platform enum
 * @param provider The provider string to map
 * @returns The corresponding platform enum or UNKNOWN
 */
export function mapProviderToPlatformEnum(
  provider: StreamingProvider | undefined
): PlatformEnum {
  if (!provider) {
    return PlatformEnum.UNKNOWN;
  }

  const platformMap: Record<string, PlatformEnum> = {
    agora: PlatformEnum.AGORA,
    millicast: PlatformEnum.MILLICAST,
    antmedia: PlatformEnum.ANTMEDIA,
    mediamtx: PlatformEnum.MEDIAMTX,
  };

  return platformMap[provider] || PlatformEnum.UNKNOWN;
}

/**
 * Map a provider string to a protocol enum
 * @param provider The provider string to map
 * @returns The corresponding protocol enum or UNKNOWN
 */
export function mapProviderToProtocolEnum(
  provider: StreamingProvider | undefined
): StreamProtocolEnum {
  if (!provider) {
    return StreamProtocolEnum.UNKNOWN;
  }

  switch (provider) {
    case 'agora':
    case 'millicast':
      return StreamProtocolEnum.WEB_RTC;
    case 'antmedia':
      return StreamProtocolEnum.RTMP;
    case 'mediamtx':
      return StreamProtocolEnum.RTSP;
    default:
      return StreamProtocolEnum.UNKNOWN;
  }
}

/**
 * Create a platform instance based on the provider
 * @param provider The provider string
 * @returns A new platform instance or null if provider is not supported
 */
export function createPlatformInstance(
  provider: StreamingProvider
): StreamingPlatform | null {
  switch (provider) {
    case 'agora':
      return new AgoraPlatform();
    case 'millicast':
      return new MillicastPlatform();
    case 'mediamtx':
      return new MediaMTXPlatform();
    default:
      return null;
  }
}

/**
 * Get the supported providers for streaming
 * @returns Array of supported provider strings
 */
export function getSupportedProviders(): StreamingProvider[] {
  return ['agora', 'millicast', 'mediamtx'];
}
