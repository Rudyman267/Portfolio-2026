import { IDroneModel, IDroneModelOptions } from '../entities';

/**
 * Interface for the drone manager
 * This manager handles creation and retrieval of drone model entities
 * Following the manager pattern, it only provides create, get, and clear methods
 */
export interface IDroneManager {
  /**
   * Create a new drone model
   * @param options Configuration options for the drone
   * @returns The created drone model
   */
  createDroneModel(options: IDroneModelOptions): IDroneModel;

  /**
   * Get a drone model by its ID
   * @param id The ID of the drone to retrieve
   * @returns The drone model or undefined if not found
   */
  getDroneModel(id: string): IDroneModel | undefined;

  removeDroneModel(id: string): void;

  /**
   * Clear all drone models
   * Removes all drones from the map and registry
   */
  clearAll(): void;
}
