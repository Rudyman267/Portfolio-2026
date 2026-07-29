import {
  SupportedDrones,
  SupportedDockingStations,
  DronePayloadTypes,
} from './hardware.enum';

export const DroneSeries = {
  [SupportedDrones.M30_SERIES]: 'DJI M30 Series',
  [SupportedDrones.M3D_SERIES]: 'DJI M3D Series',
  [SupportedDrones.M3E_SERIES]: 'DJI M3E Series',
  [SupportedDrones.M4D_SERIES]: 'DJI M4D Series',
  [SupportedDrones.M300_SERIES]: 'DJI M300 Series',
  [SupportedDrones.M350_SERIES]: 'DJI M350 Series',
};

export const DockingStations = {
  [SupportedDockingStations.DOCK1]: 'Dock 1',
  [SupportedDockingStations.DOCK2]: 'Dock 2',
  [SupportedDockingStations.DOCK3]: 'Dock 3',
  [SupportedDockingStations.LEGACY]: 'Legacy Dock',
};

export const DockDroneMapping = {
  [SupportedDrones.M30_SERIES]: SupportedDockingStations.DOCK1,
  [SupportedDrones.M3D_SERIES]: SupportedDockingStations.DOCK2,
  [SupportedDrones.M4D_SERIES]: SupportedDockingStations.DOCK3,
  [SupportedDrones.M3E_SERIES]: SupportedDockingStations.LEGACY,
  [SupportedDrones.M300_SERIES]: SupportedDockingStations.LEGACY,
  [SupportedDrones.M350_SERIES]: SupportedDockingStations.LEGACY,
};

export const DroneModels: Record<
  SupportedDrones,
  Partial<Record<DronePayloadTypes, string>>
> = {
  [SupportedDrones.M30_SERIES]: {
    [DronePayloadTypes.M30]: 'M30',
    [DronePayloadTypes.M30T]: 'M30T',
  },
  [SupportedDrones.M3D_SERIES]: {
    [DronePayloadTypes.M3D]: 'M3D',
    [DronePayloadTypes.M3TD]: 'M3TD',
  },
  [SupportedDrones.M3E_SERIES]: {
    [DronePayloadTypes.M3E]: 'M3E',
    [DronePayloadTypes.M3T]: 'M3T',
  },
  [SupportedDrones.M4D_SERIES]: {
    [DronePayloadTypes.M4D]: 'M4D',
    [DronePayloadTypes.M4TD]: 'M4TD',
  },
  [SupportedDrones.M300_SERIES]: {
    [DronePayloadTypes.M300]: 'M300',
  },
  [SupportedDrones.M350_SERIES]: {
    [DronePayloadTypes.M350]: 'M350',
  },
};
