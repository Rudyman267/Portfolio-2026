import { ICompositeManager } from '@map/private/contracts';
import {
  IFleetMissionManager,
  IFleet2DMission,
  IFleet2DMissionOptions,
  MissionType,
} from '@map/public/contracts';
import { Fleet2dGridMission, Fleet2dLinearMission } from '../entities';

export class FleetMissionManager implements IFleetMissionManager {
  constructor(private _compositeManager: ICompositeManager) {}
  public Fleet2DMissions: Map<string, IFleet2DMission> = new Map();

  create2DMission(options: IFleet2DMissionOptions): IFleet2DMission {
    let entity: IFleet2DMission;

    if (options.missionType === MissionType.GRID) {
      entity = new Fleet2dGridMission(this._compositeManager, options);
    } else {
      entity = new Fleet2dLinearMission(this._compositeManager, options);
    }

    if (!entity) {
      console.error('Failed to create fleet mission entity');
    }
    this.Fleet2DMissions.set(entity.id, entity);
    return entity;
  }

  get2DMission(id: string): IFleet2DMission | undefined {
    const entity = this.Fleet2DMissions.get(id);
    if (!entity) {
      console.error('MissionPolyline not found');
    }
    return entity;
  }

  remove2DMission(id: string): void {
    const entity = this.Fleet2DMissions.get(id);
    if (!entity) {
      console.error('MissionPolyline not found');
    }
    entity?.remove();
    this.Fleet2DMissions.delete(id);
  }

  clearAll(): void {
    this.Fleet2DMissions.forEach((polyline) => {
      polyline.remove();
    });
    this.Fleet2DMissions.clear();
  }
}
