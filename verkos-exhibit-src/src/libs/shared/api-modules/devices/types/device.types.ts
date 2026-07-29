export interface Device {
  id: string;
  name: string;
  siteId: string;
  deviceType: string;
  model: string;
}

export type DeviceResponse = Device[];
