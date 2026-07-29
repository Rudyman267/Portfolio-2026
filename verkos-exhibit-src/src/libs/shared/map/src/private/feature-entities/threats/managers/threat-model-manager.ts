import { ICompositeManager } from '@map/private/contracts';
import {
  IThreadModelOptions,
  IThreatModel,
  IThreatModelManager,
} from '@map/public/contracts';
import { ThreatModel } from '../entities';

export class ThreatModelManager implements IThreatModelManager {
  private _compositeManager: ICompositeManager;
  private _threatModels: Map<string, ThreatModel> = new Map();
  private _intruderModels: Map<string, ThreatModel> = new Map();

  constructor(compositeManager: ICompositeManager) {
    this._compositeManager = compositeManager;
  }

  createThreatModel(options: IThreadModelOptions): IThreatModel {
    const threatModel = new ThreatModel(this._compositeManager, options, true);
    this._threatModels.set(threatModel.id, threatModel);
    return threatModel;
  }

  createIntruderModel(options: IThreadModelOptions): IThreatModel {
    const intruderModel = new ThreatModel(
      this._compositeManager,
      options,
      false
    );
    this._intruderModels.set(intruderModel.id, intruderModel);
    return intruderModel;
  }

  getThreatModel(id: string): IThreatModel | undefined {
    if (this._threatModels.has(id)) {
      return this._threatModels.get(id);
    }
    return undefined;
  }

  getThreatModelByIcao(icao: string): IThreatModel | undefined {
    const threatModel = this._threatModels.values();
    for (const model of threatModel) {
      if (model.id.endsWith(`:${icao}`)) {
        return model;
      }
    }
    return undefined;
  }

  getIntruderModel(id: string): IThreatModel | undefined {
    if (this._intruderModels.has(id)) {
      return this._intruderModels.get(id);
    }
    return undefined;
  }

  getAllThreatModels(): IThreatModel[] {
    return Array.from(this._threatModels.values());
  }

  removeThreatModel(id: string): void {
    if (this._threatModels.has(id)) {
      const threatModel = this._threatModels.get(id);
      threatModel?.remove();
      this._threatModels.delete(id);
    }
  }

  removeIntruderModel(id: string): void {
    if (this._intruderModels.has(id)) {
      const intruderModel = this._intruderModels.get(id);
      intruderModel?.remove();
      this._intruderModels.delete(id);
    }
  }

  removeAllThreatModels(): void {
    this._threatModels.forEach((threatModel) => {
      threatModel.remove();
    });
    this._threatModels.clear();
  }
}
