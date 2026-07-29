import { IPosition } from '@map/public/contracts';

/**
 * Earth radius in meters at the equator
 */
const EARTH_RADIUS_M = 6378137;

/**
 * Calculate distance between two positions in meters using Haversine formula
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Distance in meters
 */
export function calculateDistance(pos1: IPosition, pos2: IPosition): number {
  const R = EARTH_RADIUS_M;
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Calculate the bearing/heading from one position to another
 * @param from Start position
 * @param to End position
 * @returns Bearing in degrees (0-360, where 0 is north)
 */
export function calculateBearing(from: IPosition, to: IPosition): number {
  const φ1 = (from.latitude * Math.PI) / 180;
  const φ2 = (to.latitude * Math.PI) / 180;
  const λ1 = (from.longitude * Math.PI) / 180;
  const λ2 = (to.longitude * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);

  const bearing = ((θ * 180) / Math.PI + 360) % 360; // in degrees
  return bearing;
}

/**
 * Format distance in appropriate units (meters or kilometers)
 * @param meters Distance in meters
 * @returns Formatted string with appropriate units
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(2)}km`;
  }
}

/**
 * Calculate the midpoint between two positions
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Midpoint position
 */
export function calculateMidpoint(pos1: IPosition, pos2: IPosition): IPosition {
  return {
    latitude: (pos1.latitude + pos2.latitude) / 2,
    longitude: (pos1.longitude + pos2.longitude) / 2,
    altitude: ((pos1.altitude || 0) + (pos2.altitude || 0)) / 2,
  };
}

export function generateSquareFromCenter(
  center: IPosition,
  radius: number
): IPosition[] {
  const metersPerDegreeLat = 111139;
  const metersPerDegreeLon =
    111139 * Math.cos((center.latitude * Math.PI) / 180);

  const deltaLat = radius / metersPerDegreeLat;
  const deltaLon = radius / metersPerDegreeLon;

  const positions: IPosition[] = [
    // Top-left corner
    {
      latitude: center.latitude + deltaLat,
      longitude: center.longitude - deltaLon,
    },
    // Top-right corner
    {
      latitude: center.latitude + deltaLat,
      longitude: center.longitude + deltaLon,
    },
    // Bottom-right corner
    {
      latitude: center.latitude - deltaLat,
      longitude: center.longitude + deltaLon,
    },
    // Bottom-left corner
    {
      latitude: center.latitude - deltaLat,
      longitude: center.longitude - deltaLon,
    },
  ];

  return positions;
}
