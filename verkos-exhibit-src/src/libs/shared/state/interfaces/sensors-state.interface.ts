export enum SensorType {
  CasiaG = '0',
  PingUSB = '1',
  AirSense = '2',
  UNKNOWN = '-1',
}

export interface SensorState {
  id: string;
  hardware_id: string;
  device_latitude: number;
  device_longitude: number;
  device_altitude: number;
  device_range: number;
  online_status: boolean;
  sensor_type: SensorType;
}

export interface SensorsState {
  sensors: Record<string, SensorState>;
  updateSensorData: (sensorId: string, data: SensorState) => void;
  updateSensorProperty: (
    sensorId: string,
    propertyPath: string,
    value: any
  ) => void;
}
