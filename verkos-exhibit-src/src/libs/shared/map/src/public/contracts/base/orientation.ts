/**
 * Interface representing the orientation of an entity in 3D space
 * Standard orientation interface used across the map library
 */
export interface IOrientation {
  /**
   * Heading (yaw) in degrees, -180 to 180
   * 0 = north, 90 = east, 180 = south, -90 = west
   */
  heading: number;

  /**
   * Pitch in degrees, -90 to 90
   * Positive values point upward, negative values point downward
   */
  pitch: number;

  /**
   * Roll in degrees, -180 to 180
   * Positive values indicate right wing down, negative values indicate left wing down
   */
  roll: number;
}
