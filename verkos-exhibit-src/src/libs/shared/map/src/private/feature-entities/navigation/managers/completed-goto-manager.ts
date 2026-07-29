import { ICompositeManager } from '@map/private/contracts';
import {
  ICompletedGoto,
  ICompletedGotoManager,
  ICompletedGotoOptions,
} from '@map/public/contracts';
import { CompletedGoto } from '../entities';

export class CompletedGotoManager implements ICompletedGotoManager {
  constructor(private _compositeManager: ICompositeManager) {}
  public completedGotoMarkers: Map<string, ICompletedGoto> = new Map();

  createCompletedGoto(options: ICompletedGotoOptions): ICompletedGoto {
    const entity = new CompletedGoto(this._compositeManager, options);
    if (!entity) {
      console.error('Failed to create CompletedGoto entity');
      throw new Error('Failed to create CompletedGoto entity');
    }
    this.completedGotoMarkers.set(entity.id, entity);
    return entity;
  }

  getCompletedGoto(id: string): ICompletedGoto | undefined {
    return this.completedGotoMarkers.get(id);
  }

  removeCompletedGoto(id: string): void {
    const marker = this.completedGotoMarkers.get(id);
    if (marker) {
      marker.remove();
      this.completedGotoMarkers.delete(id);
    }
  }

  clearAll(): void {
    this.completedGotoMarkers.forEach((marker) => {
      marker.remove();
    });
    this.completedGotoMarkers.clear();
  }
}
