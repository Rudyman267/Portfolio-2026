import {
  IGridMissionManager,
  IGridMissionPlanner,
  IGridMissionPlannerOptions,
  IGridMissionView,
  IGridMissionViewOptions,
  IPosition,
} from '@map/public/contracts';
import { ICompositeManager } from '@map/private/contracts';
import { GridMissionPlanner, GridMissionView } from '../entities';

export class GridMissionManager implements IGridMissionManager {
  private gridMissionPlanner: Map<string, IGridMissionPlanner> = new Map();
  private gridMissionViewer: Map<string, IGridMissionView> = new Map();
  private _currentGridMission: IGridMissionPlanner | undefined;
  constructor(private readonly _compositeManager: ICompositeManager) {}

  createNewGridMission(
    options: IGridMissionPlannerOptions
  ): IGridMissionPlanner {
    const gridMissionPlanner = new GridMissionPlanner(
      this._compositeManager,
      options
    );
    this.gridMissionPlanner.set(gridMissionPlanner.id, gridMissionPlanner);
    this._currentGridMission = gridMissionPlanner;
    return gridMissionPlanner;
  }

  /**
   * Load an existing grid mission for editing
   * If another grid mission is currently being planned, it will be replaced
   * @param referencePoint Required reference point for the mission
   * @param polygonVertices Array of polygon vertex positions
   * @param options Configuration options including spacing, angle, altitudes
   * @returns A grid mission planner instance initialized with the provided data
   */
  public editGridMission(
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
  ): IGridMissionPlanner {
    // Create planner with initial data in options (same pattern as LinearMissionView)
    const planner = this.createNewGridMission({
      position: referencePoint, // Required for position property
      initialReferencePoint: referencePoint,
      initialPolygonVertices: polygonVertices,
      gridSpacing: options.gridSpacing,
      gridAngle: options.gridAngle,
      altitude: options.gridAltitude,
      takeoffAltitude: options.takeoffAltitude,
    });

    // Handle custom approach if enabled (future enhancement)
    // For now, custom approach can be enabled via planner.setTakeoffPoint(true)
    // after creation if needed

    return planner;
  }

  getCurrentGridMission(): IGridMissionPlanner | undefined {
    return this._currentGridMission;
  }

  /**
   * Create a read-only grid mission view entity with polygon support
   * This method is used to display completed grid missions that are not being edited
   *
   * @param options Configuration options for the grid mission view
   * @returns A new grid mission view instance
   */
  public plotGridViewMission(
    options: IGridMissionViewOptions
  ): IGridMissionView {
    // Create a new read-only GridMissionView
    const gridMissionView = new GridMissionView(
      this._compositeManager,
      options
    );

    // Store the grid mission view for tracking
    this.gridMissionViewer.set(gridMissionView.id, gridMissionView);

    return gridMissionView;
  }

  getGridMissionPlanner(id: string): IGridMissionPlanner | undefined {
    return this.gridMissionPlanner.get(id);
  }
}
