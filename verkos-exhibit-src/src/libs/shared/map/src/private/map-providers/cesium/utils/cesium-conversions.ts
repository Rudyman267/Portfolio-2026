import {
  Cartesian3,
  Cartographic,
  Color,
  Ellipsoid,
  EllipsoidGeodesic,
  HeightReference,
  Math as CesiumMath,
} from 'cesium';
import { IPosition } from '@map/public/contracts';
import { HeightReferenceEnum } from '@map/public/core';
import { EARTH_RADIUS, POLYGON_SIDE } from '@map/private/contracts';

/**
 * Converts a Position object to Cesium Cartesian3 coordinates
 * Validates that position coordinates are valid numbers before conversion
 */
export function positionToCartesian(position: IPosition): Cartesian3 {
  if (position === null || position === undefined) {
    console.error('Position is null or undefined in positionToCartesian');
    return Cartesian3.fromDegrees(0, 0, 0);
  }

  const { longitude, latitude, altitude } = position;
  if (!isFinite(longitude) || !isFinite(latitude)) {
    console.error('Invalid position coordinates:', position);
    return Cartesian3.fromDegrees(0, 0, 0);
  }

  return Cartesian3.fromDegrees(longitude, latitude, altitude || 0);
}

/**
 * Converts an array of Position objects to an array of Cesium Cartesian3 coordinates
 */
export function positionsToCartesianArray(
  positions: IPosition[]
): Cartesian3[] {
  if (!positions) {
    console.error(
      'Empty or invalid positions array in positionsToCartesianArray'
    );
    return [];
  }

  if (positions.length === 0) {
    return [];
  }

  const flatPositions = positions.flatMap((point) => [
    point.longitude,
    point.latitude,
    point.altitude || 0,
  ]);
  return Cartesian3.fromDegreesArrayHeights(flatPositions);
}

/**
 * Converts a CSS color string to Cesium Color
 */
export function cssColorToColor(cssColor: string): Color {
  return Color.fromCssColorString(cssColor);
}

/**
 * Converts height reference string to Cesium HeightReference enum
 */
export function getHeightReference(
  heightRef?: HeightReferenceEnum
): HeightReference {
  switch (heightRef) {
    case HeightReferenceEnum.CLAMP_TO_GROUND:
      return HeightReference.CLAMP_TO_GROUND;
    case HeightReferenceEnum.RELATIVE_TO_GROUND:
      return HeightReference.RELATIVE_TO_GROUND;
    case HeightReferenceEnum.CLAMP_TO_TERRAIN:
      return HeightReference.CLAMP_TO_TERRAIN;
    case HeightReferenceEnum.RELATIVE_TO_TERRAIN:
      return HeightReference.RELATIVE_TO_TERRAIN;
    case HeightReferenceEnum.CLAMP_TO_3D_TILE:
      return HeightReference.CLAMP_TO_3D_TILE;
    case HeightReferenceEnum.RELATIVE_TO_3D_TILE:
      return HeightReference.RELATIVE_TO_3D_TILE;
    case HeightReferenceEnum.NONE:
    default:
      return HeightReference.NONE;
  }
}

/**
 * Converts a Cesium Cartesian3 to a Position object with longitude, latitude, and altitude
 * @param cartesian The Cartesian3 coordinates to convert
 * @param ellipsoid Optional ellipsoid (defaults to WGS84)
 * @returns Position object with longitude and latitude in degrees, and altitude in meters
 */
export function cartesianToPosition(
  cartesian: Cartesian3,
  ellipsoid = Ellipsoid.WGS84
): IPosition {
  if (
    !cartesian ||
    !Cartesian3.maximumComponent(cartesian) ||
    !cartesian?.x ||
    !cartesian?.y ||
    !cartesian?.z
  ) {
    console.error('Invalid cartesian in cartesianToPosition:', cartesian);
    return { longitude: 0, latitude: 0, altitude: 0 };
  }

  try {
    const cartographic = ellipsoid.cartesianToCartographic(cartesian);

    if (!cartographic) {
      console.error('Failed to convert cartesian to cartographic:', cartesian);
      return { longitude: 0, latitude: 0, altitude: 0 };
    }

    const longitude = (cartographic.longitude * 180) / Math.PI;
    const latitude = (cartographic.latitude * 180) / Math.PI;

    // Check for valid coordinates
    if (!isFinite(longitude) || !isFinite(latitude)) {
      console.error('Invalid coordinates after conversion:', {
        longitude,
        latitude,
      });
      return { longitude: 0, latitude: 0, altitude: 0 };
    }

    return {
      longitude: longitude,
      latitude: latitude,
      altitude: cartographic.height,
    };
  } catch (error) {
    console.error('Error in cartesianToPosition:', error);
    return { longitude: 0, latitude: 0, altitude: 0 };
  }
}

export function convertToCartesian3Array(
  coordinates: Array<IPosition>
): Array<Cartesian3> {
  if (!coordinates || coordinates.length === 0) {
    return [];
  }

  // Convert to Cartesian3, handling both Point3D and Position formats
  return coordinates
    .map((point) => {
      // Check if this is a Position object (has longitude/latitude properties)
      if ('longitude' in point && 'latitude' in point) {
        const position = point as IPosition;

        if (!isFinite(position.longitude) || !isFinite(position.latitude)) {
          console.error(
            'Invalid position in convertToCartesian3Array:',
            position
          );
          return Cartesian3.ZERO;
        }

        return positionToCartesian(position);
      }
      // It's a Point3D object (has lat/lng properties)
      else if ('lat' in point && 'lng' in point) {
        const point3d = point as IPosition;

        if (!isFinite(point3d.latitude) || !isFinite(point3d.longitude)) {
          console.error('Invalid point in convertToCartesian3Array:', point);
          return Cartesian3.ZERO;
        }

        const position: IPosition = {
          latitude: point3d.latitude,
          longitude: point3d.longitude,
          altitude: point3d.altitude || 0,
        };

        return positionToCartesian(position);
      } else {
        console.error('Unknown coordinate format:', point);
        return Cartesian3.ZERO;
      }
    })
    .filter((cartesian) => cartesian !== Cartesian3.ZERO); // Remove any invalid points
}

export function convertToPoint3D(coordinate: Cartesian3): IPosition {
  const cartographic = Cartographic.fromCartesian(coordinate);
  const latitude = CesiumMath.toDegrees(cartographic.latitude);
  const longitude = CesiumMath.toDegrees(cartographic.longitude);
  const altitude = 0;

  return { latitude, longitude, altitude };
}

export function getPolygonCoordinates(
  coordinate: IPosition | IPosition[]
): IPosition[] {
  if (Array.isArray(coordinate)) {
    if (coordinate.length < 3) {
      throw new Error('Polygon requires at least 3 positions');
    }
    return coordinate;
  }

  const polygonCoords = [];

  // Convert distance to radians
  const angularDistance = POLYGON_SIDE / EARTH_RADIUS;
  let bearing = 45;

  // Convert start coordinates to radians
  const centerLatRad = (coordinate.latitude * Math.PI) / 180;
  const centerLngRad = (coordinate.longitude * Math.PI) / 180;

  for (let i = 0; i < 4; i++) {
    const bearingRad = (bearing * Math.PI) / 180;
    // Calculate new latitudes and longitudes
    const newLat = Math.asin(
      Math.sin(centerLatRad) * Math.cos(angularDistance) +
        Math.cos(centerLatRad) *
          Math.sin(angularDistance) *
          Math.cos(bearingRad)
    );
    const newLng =
      centerLngRad +
      Math.atan2(
        Math.sin(bearingRad) *
          Math.sin(angularDistance) *
          Math.cos(centerLatRad),
        Math.cos(angularDistance) - Math.sin(centerLatRad) * Math.sin(newLat)
      );

    // Convert back to degrees
    const latitude = (newLat * 180) / Math.PI;
    const longitude = (newLng * 180) / Math.PI;
    polygonCoords.push({ latitude, longitude, altitude: 0 });

    bearing += 90;
  }
  return polygonCoords;
}

/**
 * Converts degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two geographic positions in meters
 * Uses Cesium's native Cartesian3.distance for accurate calculation
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Distance in meters
 */
export function calculateDistanceInMeters(
  pos1: IPosition,
  pos2: IPosition
): number {
  // Convert both positions to Cartesian3
  const cartesian1 = positionToCartesian(pos1);
  const cartesian2 = positionToCartesian(pos2);

  // Use Cesium's built-in distance calculation
  return Cartesian3.distance(cartesian1, cartesian2);
}

/**
 * Calculate the surface distance between two geographic positions
 * This uses Cesium's geodesic calculations for accurate distance
 *
 * @param position1 The first position
 * @param position2 The second position
 * @returns The distance in meters
 */
export function calculateDistance(
  position1: IPosition,
  position2: IPosition
): number {
  const cartographic1 = Cartographic.fromDegrees(
    position1.longitude,
    position1.latitude
  );

  const cartographic2 = Cartographic.fromDegrees(
    position2.longitude,
    position2.latitude
  );

  const geodesic = new EllipsoidGeodesic(cartographic1, cartographic2);
  return geodesic.surfaceDistance;
}
