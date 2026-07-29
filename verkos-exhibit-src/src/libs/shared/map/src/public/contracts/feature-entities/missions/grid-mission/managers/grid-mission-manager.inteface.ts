import { IPosition } from '@map/public/contracts/base';
import {
  IGridMissionPlanner,
  IGridMissionPlannerOptions,
  IGridMissionView,
  IGridMissionViewOptions,
} from '../entities';

export interface IGridMissionManager {
  createNewGridMission(
    options: IGridMissionPlannerOptions
  ): IGridMissionPlanner;
  /**
   * Load an existing grid mission for editing
   * If another grid mission is currently being planned, it will be replaced
   * @param referencePoint Required reference point for the mission
   * @param polygonVertices Array of polygon vertex positions
   * @param options Configuration options including spacing, angle, altitudes
   * @returns A grid mission planner instance initialized with the provided data
   */
  editGridMission(
    referencePoint: IPosition,
    polygonVertices: IPosition[],
    options: {
      gridSpacing: number;
      gridAngle: number;
      gridAltitude: number;
      takeoffAltitude: number;
      customApproachEnabled?: boolean;
      approachWaypoints?: IPosition[];
    }
  ): IGridMissionPlanner;
  getGridMissionPlanner(id: string): IGridMissionPlanner | undefined;
  /**
   * Create a read-only grid mission view entity with polygon support
   * This method is used to display completed grid missions that are not being edited
   *
   * @param options Configuration options for the grid mission view
   * @returns A new grid mission view instance
   */
  plotGridViewMission(options: IGridMissionViewOptions): IGridMissionView;
  getCurrentGridMission(): IGridMissionPlanner | undefined;
}
