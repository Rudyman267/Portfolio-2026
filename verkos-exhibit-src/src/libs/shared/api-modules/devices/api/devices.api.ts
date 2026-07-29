import axios from 'axios';
import { Device, DeviceResponse } from '../types/device.types';

const BASE_URL = '/api/devices';

export const fetchDevices = async (): Promise<DeviceResponse> => {
  const response = await axios.get<DeviceResponse>(BASE_URL);
  return response.data;
};
