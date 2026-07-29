import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SensorsState,
  SensorState,
  SensorType,
} from '../interfaces/sensors-state.interface';
import { isEqual } from 'lodash';

const useSensorsStore = create<SensorsState>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        sensors: {},

        updateSensorData: (sensorId: string, data: SensorState) =>
          set(
            (state) => {
              const currentSensor = state.sensors[sensorId];

              if (!currentSensor || !isEqual(currentSensor, data)) {
                state.sensors[sensorId] = {
                  ...data,
                  id: sensorId,
                };
              }
            },
            false,
            `sensors/updateData/${sensorId}`
          ),

        updateSensorProperty: (
          sensorId: string,
          propertyPath: string,
          value: any
        ) =>
          set(
            (state) => {
              if (!state.sensors[sensorId]) {
                state.sensors[sensorId] = {
                  id: sensorId,
                  hardware_id: '',
                  device_latitude: 0,
                  device_longitude: 0,
                  device_altitude: 0,
                  device_range: 0,
                  online_status: false,
                  sensor_type: SensorType.UNKNOWN,
                };
              }

              // Simple property update for sensors
              (state.sensors[sensorId] as any)[propertyPath] = value;
            },
            false,
            `sensors/updateProperty/${propertyPath}`
          ),
      })),
      {
        name: 'Sensors Store',
      }
    )
  )
);

export default useSensorsStore;
