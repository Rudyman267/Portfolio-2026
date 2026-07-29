import { IPosition } from '@map/public/contracts/base';

export interface IFleet2DMission {
  readonly id: string;
  remove(): void;
  setVisibility(visible: boolean): void;
  setSelected(selected: boolean): void;
  panTo(): void;
}

export interface IFleet2DMissionOptions {
  positions: IPosition[];
  dockLocation: IPosition;
  safeTakeOffLocation: IPosition;
  missionType: MissionType;
}

export enum MissionType {
  WAYPOINT,
  GRID,
}
