import { IPosition, TakeoffMode } from '@map/public/contracts';

/**
 * Interface defining the TakeoffPathService for generating flight paths between
 * reference points and waypoints based on different takeoff modes and parameters.
 *
 * @internal
 */
export interface ITakeoffPathService {
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
  generateTakeoffPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffMode: TakeoffMode,
    takeoffAltitude: number
  ): IPosition[];

  /**
   * Utility method to create smoother paths with interpolated points
   *
   * @param start Starting position
   * @param end Ending position
   * @param steps Number of interpolation steps
   * @returns Array of interpolated positions
   */
  interpolatePositions(
    start: IPosition,
    end: IPosition,
    steps: number
  ): IPosition[];

  /**
   * Utility method to create a smoother path with a specified number of points
   *
   * @param positions Array of key positions in the path
   * @param pointsPerSegment Number of points to generate per segment
   * @returns Smoothed path with interpolated points
   */
  createSmoothPath(
    positions: IPosition[],
    pointsPerSegment?: number
  ): IPosition[];
}
