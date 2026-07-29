import { IThreadModelOptions, IThreatModel } from '../entities';

export interface IThreatModelManager {
  /**
   * Creates a new threat model
   * @param options Options for creating the threat model
   * @returns The created threat model instance
   */
  createThreatModel(options: IThreadModelOptions): IThreatModel;

  /**
   * Creates a new intruder model
   * @param options Options for creating the intruder model
   * @returns The created intruder model instance
   */
  createIntruderModel(options: IThreadModelOptions): IThreatModel;

  /**
   * Gets a threat model by ID
   * @param id The ID of the threat model to get
   * @returns The threat model with the given ID, or undefined if not found
   */
  getThreatModel(id: string): IThreatModel | undefined;

  /**
   * Gets an intruder model by ID
   * @param id The ID of the intruder model to get
   * @returns The intruder model with the given ID, or undefined if not found
   */
  getIntruderModel(id: string): IThreatModel | undefined;

  /**
   * Gets all threat models
   * @returns Array of all threat models
   */
  getAllThreatModels(): IThreatModel[];

  /**
   * Gets a threat model by ICAO
   * @param icao The ICAO of the threat model to get
   * @returns The threat model with the given ICAO, or undefined if not found
   */
  getThreatModelByIcao(icao: string): IThreatModel | undefined;

  /**
   * Removes a threat model by ID
   * @param id The ID of the threat model to remove
   */
  removeThreatModel(id: string): void;

  /**
   * Removes an intruder model by ID
   * @param id The ID of the intruder model to remove
   */
  removeIntruderModel(id: string): void;

  /**
   * Removes all threat models
   */
  removeAllThreatModels(): void;
}
