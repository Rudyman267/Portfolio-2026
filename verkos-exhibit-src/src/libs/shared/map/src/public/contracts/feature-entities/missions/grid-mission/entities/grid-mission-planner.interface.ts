import { IPosition } from '@map/public/contracts/base';
import {
  GridMissionPlannerEventData,
  GridMissionPlannerEventType,
} from './grid-mission-planner-events.interface';

export interface IGridMissionPlannerOptions {
  position: IPosition;
  gridSpacing?: number;
  altitude?: number;
  takeoffAltitude?: number;
  gridAngle?: number;
  initialPolygonVertices?: IPosition[];
  initialReferencePoint?: IPosition;
}

export interface IGridMissionPlanner {
  readonly id: string;
  readonly position: IPosition;

  // Properties with getters
  readonly gridAngle: number;
  readonly gridSpacing: number;
  readonly gridAltitude: number;

  readonly takeoffPointEnabled: boolean;
  readonly isAwaitingCustomPathClick: boolean;
  readonly takeoffPointPositionCount: number;

  // State management
  readonly state: string;
  readonly isAwaitingFirstClick: boolean;
  readonly isAwaitingSecondClick: boolean;
  readonly isReady: boolean;

  // Update methods
  updateGrid(options?: Partial<IGridMissionPlannerOptions>): void;
  updateGridAngle(angle: number): void;
  updateGridSpacing(spacing: number): void;
  updateGridAltitude(altitude: number): void;
  updateTakeoffAltitude(altitude: number): Promise<void>;

  setVisibility(visible: boolean): void;
  setEditable(editable: boolean): void;

  // Takeoff point control
  setTakeoffPoint(enabled: boolean): void;
  handleTakeoffPointClick(position: IPosition): void;

  // Two-click flow handlers
  handleFirstClick(position: IPosition): void;
  handleSecondClick(position: IPosition): void;
  getState(): string;

  // Mission data
  getCompleteMissionPath(): IPosition[];
  getPolygonVertices(): IPosition[];
  getGridWaypointsOnly(): IPosition[];

  // Typed event methods (NEW)
  onEvent(
    eventType: GridMissionPlannerEventType,
    callback: (data: GridMissionPlannerEventData) => void
  ): void;

  offEvent(
    eventType: GridMissionPlannerEventType,
    callback: (data: GridMissionPlannerEventData) => void
  ): void;

  // Mission lifecycle
  cancelMission(): void;
}
