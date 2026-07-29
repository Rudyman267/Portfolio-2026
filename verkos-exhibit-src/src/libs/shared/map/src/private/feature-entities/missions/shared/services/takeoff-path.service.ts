import { IPosition, TakeoffMode } from '@map/public/contracts';
import { ITakeoffPathService } from '../interfaces';

/**
 * Utility service for generating flight paths between reference points and waypoints
 * based on different takeoff modes and parameters.
 *
 * This service implements the six different flight path scenarios defined in the
 * takeoff mode requirements specification:
 *
 * SC-1: Direct Ascent - Vertical Climb Then Horizontal
 * SC-2: Direct Ascent - Altitude Overshoot
 * SC-3: Direct Ascent - Reference Higher
 * SC-4: Safe Takeoff - Optimal Efficiency
 * SC-5: Safe Takeoff - Altitude Management
 * SC-6: Safe Takeoff - Elevated Reference
 *
 * @internal
 */
export class TakeoffPathService implements ITakeoffPathService {
  /**
   * Generates a flight path from reference point to first waypoint based on takeoff mode and settings
   *
   * The following scenarios are implemented:
   * - SC-1: Direct Ascent - Vertical climb to first waypoint altitude, then horizontal flight
   * - SC-2: Direct Ascent - Ascend to takeoff altitude, fly horizontally, then descend
   * - SC-3: Direct Ascent - From higher point, ascend by takeoff altitude, fly horizontally, then descend
   * - SC-4: Safe Takeoff - Vertical ascent to safe altitude, then direct flight to first waypoint
   * - SC-5: Safe Takeoff - Vertical ascent, horizontal flight, then descent to first waypoint
   * - SC-6: Safe Takeoff - From higher point, ascend, fly horizontally, then descend
   *
   * @param referencePoint The starting reference point position
   * @param firstWaypoint The first waypoint position
   * @param takeoffMode The takeoff mode (DIRECT_ASCENT or SAFE_TAKEOFF)
   * @param takeoffAltitude The takeoff altitude in meters
   * @returns Array of positions representing the flight path
   */
  public generateTakeoffPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffMode: TakeoffMode,
    takeoffAltitude: number
  ): IPosition[] {
    // Ensure both points have altitude values
    const refAlt = referencePoint.altitude || 0;
    const wpAlt = firstWaypoint.altitude || 0;

    // Ensure the takeoff altitude is at least 2 meters
    if (takeoffAltitude < 2) {
      console.warn(
        'Takeoff altitude was less than 2 meters. Setting to minimum safe value of 2 meters.'
      );
      takeoffAltitude = 2;
    }

    // Calculate altitude difference
    const altitudeDifference = wpAlt - refAlt;

    // Determine which scenario applies
    if (takeoffMode === TakeoffMode.DIRECT_ASCENT) {
      if (refAlt < wpAlt) {
        if (takeoffAltitude <= altitudeDifference) {
          // SC-1: Direct Ascent - Efficient Path
          return this._generateDirectAscentPath(referencePoint, firstWaypoint);
        } else {
          // SC-2: Direct Ascent - Altitude Overshoot
          return this._generateAscentOvershootPath(
            referencePoint,
            firstWaypoint,
            takeoffAltitude
          );
        }
      } else {
        // SC-3: Direct Ascent - Reference Higher
        return this._generateDescendingPath(
          referencePoint,
          firstWaypoint,
          takeoffAltitude
        );
      }
    } else {
      // SAFE_TAKEOFF
      if (refAlt < wpAlt) {
        if (takeoffAltitude <= altitudeDifference) {
          // SC-4: Safe Takeoff - Optimal Efficiency
          return this._generateSafeTakeoffPath(
            referencePoint,
            firstWaypoint,
            takeoffAltitude
          );
        } else {
          // SC-5: Safe Takeoff - Altitude Management
          return this._generateSafeTakeoffOvershootPath(
            referencePoint,
            firstWaypoint,
            takeoffAltitude
          );
        }
      } else {
        // SC-6: Safe Takeoff - Elevated Reference
        return this._generateSafeTakeoffDescendingPath(
          referencePoint,
          firstWaypoint,
          takeoffAltitude
        );
      }
    }
  }

  /**
   * SC-1: Direct Ascent - Efficient Path
   * Creates a path that first ascends to the first waypoint altitude,
   * then connects horizontally to the first waypoint
   *
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position
   * @returns Array of positions for the path
   * @private
   */
  private _generateDirectAscentPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition
  ): IPosition[] {
    // Calculate the altitude directly above the reference point at the same height as the first waypoint
    const verticalAscentPoint = {
      latitude: referencePoint.latitude,
      longitude: referencePoint.longitude,
      altitude: firstWaypoint.altitude,
    };

    // Return a path that first goes up vertically, then horizontally to the waypoint
    return [{ ...referencePoint }, verticalAscentPoint, { ...firstWaypoint }];
  }

  /**
   * SC-2: Direct Ascent - Altitude Overshoot
   * Creates a path that ascends to takeoff altitude, flies horizontally, then descends
   *
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position
   * @param takeoffAltitude The takeoff altitude in meters
   * @returns Array of positions for the path
   * @private
   */
  private _generateAscentOvershootPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffAltitude: number
  ): IPosition[] {
    const refAlt = referencePoint.altitude || 0;
    const targetAltitude = refAlt + takeoffAltitude;

    return [
      { ...referencePoint },
      {
        // Ascent point - directly above reference point
        latitude: referencePoint.latitude,
        longitude: referencePoint.longitude,
        altitude: targetAltitude,
      },
      {
        // Point above first waypoint at target altitude
        latitude: firstWaypoint.latitude,
        longitude: firstWaypoint.longitude,
        altitude: targetAltitude,
      },
      { ...firstWaypoint },
    ];
  }

  /**
   * SC-3: Direct Ascent - Reference Higher
   * Creates a path that ascends from an already high reference point,
   * flies horizontally, then descends to the waypoint
   *
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position
   * @param takeoffAltitude The takeoff altitude in meters
   * @returns Array of positions for the path
   * @private
   */
  private _generateDescendingPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffAltitude: number
  ): IPosition[] {
    const refAlt = referencePoint.altitude || 0;
    const targetAltitude = refAlt + takeoffAltitude; // Always ascend by takeoff altitude

    return [
      { ...referencePoint },
      {
        // Ascent point - directly above reference point
        latitude: referencePoint.latitude,
        longitude: referencePoint.longitude,
        altitude: targetAltitude,
      },
      {
        // Point above first waypoint at target altitude
        latitude: firstWaypoint.latitude,
        longitude: firstWaypoint.longitude,
        altitude: targetAltitude,
      },
      { ...firstWaypoint },
    ];
  }

  /**
   * SC-4: Safe Takeoff - Optimal Efficiency
   * Creates a path that first ascends vertically to safe altitude,
   * then flies directly to the first waypoint
   *
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position
   * @param takeoffAltitude The takeoff altitude in meters
   * @returns Array of positions for the path
   * @private
   */
  private _generateSafeTakeoffPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffAltitude: number
  ): IPosition[] {
    const refAlt = referencePoint.altitude || 0;
    const safeAltitude = refAlt + takeoffAltitude;

    return [
      { ...referencePoint },
      {
        // Vertical ascent to safe altitude
        latitude: referencePoint.latitude,
        longitude: referencePoint.longitude,
        altitude: safeAltitude,
      },
      { ...firstWaypoint },
    ];
  }

  /**
   * SC-5: Safe Takeoff - Altitude Management
   * Creates a path that ascends vertically to safe altitude, flies horizontally,
   * then descends to the waypoint
   *
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position
   * @param takeoffAltitude The takeoff altitude in meters
   * @returns Array of positions for the path
   * @private
   */
  private _generateSafeTakeoffOvershootPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffAltitude: number
  ): IPosition[] {
    const refAlt = referencePoint.altitude || 0;
    const safeAltitude = refAlt + takeoffAltitude;

    return [
      { ...referencePoint },
      {
        // Vertical ascent to safe altitude
        latitude: referencePoint.latitude,
        longitude: referencePoint.longitude,
        altitude: safeAltitude,
      },
      {
        // Horizontal flight to position above waypoint
        latitude: firstWaypoint.latitude,
        longitude: firstWaypoint.longitude,
        altitude: safeAltitude,
      },
      { ...firstWaypoint },
    ];
  }

  /**
   * SC-6: Safe Takeoff - Elevated Reference
   * Creates a path from a higher reference point that first ascends vertically,
   * flies horizontally, then descends to the waypoint
   *
   * @param referencePoint The reference point position
   * @param firstWaypoint The first waypoint position
   * @param takeoffAltitude The takeoff altitude in meters
   * @returns Array of positions for the path
   * @private
   */
  private _generateSafeTakeoffDescendingPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffAltitude: number
  ): IPosition[] {
    const refAlt = referencePoint.altitude || 0;
    const safeAltitude = refAlt + takeoffAltitude; // Always ascend by takeoff altitude

    return [
      { ...referencePoint },
      {
        // Vertical ascent to safe altitude
        latitude: referencePoint.latitude,
        longitude: referencePoint.longitude,
        altitude: safeAltitude,
      },
      {
        // Horizontal flight to position above waypoint
        latitude: firstWaypoint.latitude,
        longitude: firstWaypoint.longitude,
        altitude: safeAltitude,
      },
      { ...firstWaypoint },
    ];
  }

  /**
   * Utility method to create smoother paths with interpolated points
   *
   * @param start Starting position
   * @param end Ending position
   * @param steps Number of interpolation steps
   * @returns Array of interpolated positions
   * @public
   */
  public interpolatePositions(
    start: IPosition,
    end: IPosition,
    steps: number
  ): IPosition[] {
    const result: IPosition[] = [];
    const startAlt = start.altitude || 0;
    const endAlt = end.altitude || 0;

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      result.push({
        latitude: start.latitude + (end.latitude - start.latitude) * ratio,
        longitude: start.longitude + (end.longitude - start.longitude) * ratio,
        altitude: startAlt + (endAlt - startAlt) * ratio,
      });
    }

    return result;
  }

  /**
   * Utility method to create a smoother path with a specified number of points
   *
   * @param positions Array of key positions in the path
   * @param pointsPerSegment Number of points to generate per segment
   * @returns Smoothed path with interpolated points
   * @public
   */
  public createSmoothPath(
    positions: IPosition[],
    pointsPerSegment = 5
  ): IPosition[] {
    if (positions.length < 2) return positions;

    const result: IPosition[] = [positions[0]];

    for (let i = 1; i < positions.length; i++) {
      const interpolated = this.interpolatePositions(
        positions[i - 1],
        positions[i],
        pointsPerSegment
      ).slice(1); // Exclude the first point as it's already included

      result.push(...interpolated);
    }

    return result;
  }
}
