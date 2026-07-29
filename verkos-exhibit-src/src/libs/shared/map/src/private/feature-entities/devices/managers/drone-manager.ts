import { DroneModel } from '../entities';
import { ICompositeManager } from '@map/private/contracts';
import {
  IDroneManager,
  IDroneModel,
  IDroneModelOptions,
} from '@map/public/contracts';

/**
 * Implementation of the drone manager
 * Manages creation and retrieval of drone model entities
 */
export class DroneManager implements IDroneManager {
  /**
   * Registry to store drone models
   * @private
   */
  private _droneModels: Map<string, IDroneModel>;

  /**
   * Constructor for DroneManager
   * @param compositeManager The composite manager for creating composite entities
   */
  constructor(private _compositeManager: ICompositeManager) {
    this._droneModels = new Map();
  }

  /**
   * Create a new drone model
   * @param options Configuration options for the drone
   * @returns The created drone model
   */
  createDroneModel(options: IDroneModelOptions): IDroneModel {
    // Create the drone model with the FB model
    const droneModel = new DroneModel(this._compositeManager, options);

    // Store the drone model in the registry
    this._droneModels.set(droneModel.id, droneModel);
    return droneModel;
  }

  /**
   * Get a drone model by its ID
   * @param id The ID of the drone to retrieve
   * @returns The drone model or undefined if not found
   */
  getDroneModel(id: string): IDroneModel | undefined {
    return this._droneModels.get(id);
  }

  /**
   * Remove a drone model by its ID
   * @param id The ID of the drone to remove
   */
  removeDroneModel(id: string): void {
    const droneModel = this.getDroneModel(id);
    try {
      if (droneModel) {
        droneModel.remove();
        this._droneModels.delete(id);
      }
    } catch (error) {
      console.error(`Failed to remove drone model ${id}:`, error);
    }
  }

  /**
   * Clear all drone models
   * Removes all drones from the map and registry
   */
  clearAll(): void {
    this._droneModels.forEach((droneModel) => {
      droneModel.remove();
    });
    this._droneModels.clear();
  }
}
