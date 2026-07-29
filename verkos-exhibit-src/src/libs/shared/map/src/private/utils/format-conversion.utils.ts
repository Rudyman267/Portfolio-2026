import { IOrientation, IPosition } from '@map/public/contracts';

/**
 * Interface representing a Cartesian3 coordinate (x, y, z)
 */
export interface ICartesian3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert a position to a string
 * @param position Position to convert
 * @returns String representation in 'latitude,longitude,altitude' format
 */
export function positionToString(position: IPosition): string {
  return `${position.latitude},${position.longitude},${position.altitude || 0}`;
}

/**
 * Parse a string into a position
 * @param str String in 'latitude,longitude,altitude' format
 * @returns Parsed position object
 */
export function stringToPosition(str: string): IPosition {
  const [latitude, longitude, altitude] = str.split(',').map(Number);
  return { latitude, longitude, altitude };
}

/**
 * Convert a position to a Cartesian3 object
 * This is a simplified conversion for demonstration
 * Real implementation would use proper geospatial calculations
 * @param position Position to convert
 * @returns Cartesian3 representation
 */
export function positionToCartesian(position: IPosition): ICartesian3 {
  // Simplified conversion for demonstration
  // In a real implementation, this would use proper Earth-centered, Earth-fixed (ECEF) conversion
  const latRad = (position.latitude * Math.PI) / 180;
  const lonRad = (position.longitude * Math.PI) / 180;
  const radius = 6378137; // Earth radius in meters at equator
  const altitude = position.altitude || 0;

  const x = (radius + altitude) * Math.cos(latRad) * Math.cos(lonRad);
  const y = (radius + altitude) * Math.cos(latRad) * Math.sin(lonRad);
  const z = (radius + altitude) * Math.sin(latRad);

  return { x, y, z };
}

/**
 * Convert a Cartesian3 object to a position
 * This is a simplified conversion for demonstration
 * Real implementation would use proper geospatial calculations
 * @param cartesian Cartesian3 coordinates
 * @returns Position representation
 */
export function cartesianToPosition(cartesian: ICartesian3): IPosition {
  // Simplified conversion for demonstration
  // In a real implementation, this would use proper ECEF to geodetic conversion
  const { x, y, z } = cartesian;
  const radius = 6378137; // Earth radius in meters at equator

  const p = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, p);
  const lonRad = Math.atan2(y, x);
  const altitude = Math.sqrt(x * x + y * y + z * z) - radius;

  return {
    latitude: (latRad * 180) / Math.PI,
    longitude: (lonRad * 180) / Math.PI,
    altitude,
  };
}

/**
 * Format a position for display
 * @param position Position to format
 * @param digits Number of decimal digits to include
 * @returns Formatted string
 */
export function formatPositionForDisplay(
  position: IPosition,
  digits = 6
): string {
  const lat = position.latitude.toFixed(digits);
  const lon = position.longitude.toFixed(digits);
  const alt =
    position.altitude !== undefined ? position.altitude.toFixed(1) : 'N/A';

  return `Lat: ${lat}°, Lon: ${lon}°, Alt: ${alt}m`;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Format an orientation for display
 * @param orientation Orientation to format
 * @param digits Number of decimal digits to include
 * @returns Formatted string
 */
export function formatOrientationForDisplay(
  orientation: IOrientation,
  digits = 2
): string {
  const heading = orientation.heading.toFixed(digits);
  const pitch = orientation.pitch?.toFixed(digits) || 'N/A';
  const roll = orientation.roll?.toFixed(digits) || 'N/A';

  return `Heading: ${heading}°, Pitch: ${pitch}°, Roll: ${roll}°`;
}
