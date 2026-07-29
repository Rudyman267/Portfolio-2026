export interface IntruderData {
  sensor_name: string;
  sensor_type: 'ADS-B' | 'RADAR' | 'VISUAL' | string;
  intruder_type: 'AIRCRAFT' | 'DRONE' | 'UNKNOWN' | string;
  source: string;
  icao: string;
  heading: number;
  altitude: number;
  altitude_reference: 'WGS84' | 'AGL' | 'MSL' | string;
  latitude: number;
  longitude: number;
  speed?: number;
  vertical_speed?: number;
  timestamp?: number;
}

export type IntrudersData = Record<string, IntruderData>;
