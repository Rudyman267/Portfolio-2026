/**
 * Interface representing a geographic position
 */
export interface IPosition {
  /**
   * Latitude in decimal degrees
   */
  latitude: number;

  /**
   * Longitude in decimal degrees
   */
  longitude: number;

  /**
   * Altitude in HAE
   */
  altitude?: number;
}
