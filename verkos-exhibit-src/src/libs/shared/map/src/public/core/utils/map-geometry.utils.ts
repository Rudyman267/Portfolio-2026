import { IPosition } from '@map/public/contracts';

const EARTH_RADIUS_M = 6378137;

export function calculateDistanceInMeters(pos1: IPosition, pos2: IPosition) {
  const lat1 = (pos1.latitude * Math.PI) / 180;
  const lat2 = (pos2.latitude * Math.PI) / 180;
  const deltaLat = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const deltaLon = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const groundDistance = EARTH_RADIUS_M * c;
  const altitudeDelta = (pos2.altitude ?? 0) - (pos1.altitude ?? 0);
  return Math.hypot(groundDistance, altitudeDelta);
}
