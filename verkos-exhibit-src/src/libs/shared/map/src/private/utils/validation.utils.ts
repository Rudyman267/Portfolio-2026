import { IOrientation, IPosition } from '@map/public/contracts';

/**
 * Validate a position object
 * @param position Position to validate
 * @returns True if position is valid
 */
export function isValidPosition(position: unknown): position is IPosition {
  if (!position || typeof position !== 'object') return false;
  const p = position as Record<string, unknown>;

  // Latitude must be between -90 and 90
  if (typeof p.latitude !== 'number' || p.latitude < -90 || p.latitude > 90) {
    return false;
  }

  // Longitude must be between -180 and 180
  if (
    typeof p.longitude !== 'number' ||
    p.longitude < -180 ||
    p.longitude > 180
  ) {
    return false;
  }

  // Altitude is optional but must be a number if provided
  if (p.altitude !== undefined && typeof p.altitude !== 'number') {
    return false;
  }

  return true;
}

/**
 * Validate an orientation object
 * @param orientation Orientation to validate
 * @returns True if orientation is valid
 */
export function isValidOrientation(
  orientation: unknown
): orientation is IOrientation {
  if (!orientation || typeof orientation !== 'object') return false;
  const o = orientation as Record<string, unknown>;

  // Heading must be a number between 0 and 360
  if (typeof o.heading !== 'number' || o.heading < 0 || o.heading > 360) {
    return false;
  }

  // Pitch is optional but must be between -90 and 90 if provided
  if (
    o.pitch !== undefined &&
    (typeof o.pitch !== 'number' || o.pitch < -90 || o.pitch > 90)
  ) {
    return false;
  }

  // Roll is optional but must be between -180 and 180 if provided
  if (
    o.roll !== undefined &&
    (typeof o.roll !== 'number' || o.roll < -180 || o.roll > 180)
  ) {
    return false;
  }

  return true;
}

/**
 * Ensure a position is valid by fixing or providing default values
 * @param position Position to sanitize
 * @returns Sanitized position
 */
export function sanitizePosition(position: Partial<IPosition>): IPosition {
  const result: IPosition = {
    latitude: 0,
    longitude: 0,
  };

  // Clamp latitude to valid range
  if (typeof position.latitude === 'number') {
    result.latitude = Math.max(-90, Math.min(90, position.latitude));
  }

  // Clamp longitude to valid range
  if (typeof position.longitude === 'number') {
    result.longitude = Math.max(-180, Math.min(180, position.longitude));
  }

  // Copy altitude if it's a number
  if (typeof position.altitude === 'number') {
    result.altitude = position.altitude;
  }

  return result;
}

/**
 * Ensure an orientation is valid by fixing or providing default values
 * @param orientation Orientation to sanitize
 * @returns Sanitized orientation
 */
export function sanitizeOrientation(
  orientation: Partial<IOrientation>
): IOrientation {
  const result: IOrientation = {
    heading: 0,
    pitch: 0,
    roll: 0,
  };

  // Normalize heading to 0-360 range
  if (typeof orientation.heading === 'number') {
    result.heading = ((orientation.heading % 360) + 360) % 360;
  }

  // Clamp pitch to valid range if provided
  if (typeof orientation.pitch === 'number') {
    result.pitch = Math.max(-90, Math.min(90, orientation.pitch));
  }

  // Clamp roll to valid range if provided
  if (typeof orientation.roll === 'number') {
    result.roll = Math.max(-180, Math.min(180, orientation.roll));
  }

  return result;
}

/**
 * Validate an array of positions (for paths, polygons, etc.)
 * @param positions Array of positions to validate
 * @param minPoints Minimum number of points required (default: 2)
 * @returns True if the positions array is valid
 */
export function isValidPositionsArray(
  positions: unknown[],
  minPoints = 2
): positions is IPosition[] {
  if (!Array.isArray(positions) || positions.length < minPoints) {
    return false;
  }

  // Check that all items in the array are valid positions
  return positions.every(isValidPosition);
}

/**
 * Ensure an ID is valid by normalizing or generating a new one
 * @param id ID to validate
 * @param prefix Prefix to use if generating a new ID
 * @returns Valid ID
 */
export function ensureValidId(
  id: string | undefined | null,
  prefix = 'entity'
): string {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    // Generate a new ID if none provided or invalid
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
  }

  // Remove any invalid characters
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}
