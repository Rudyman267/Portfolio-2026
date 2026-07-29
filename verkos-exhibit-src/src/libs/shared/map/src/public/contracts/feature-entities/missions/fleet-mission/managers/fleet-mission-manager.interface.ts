import { IFleet2DMission, IFleet2DMissionOptions } from '../entities';

export interface IFleetMissionManager {
  create2DMission(options: IFleet2DMissionOptions): IFleet2DMission;
  get2DMission(id: string): IFleet2DMission | undefined;
  remove2DMission(id: string): void;
}
