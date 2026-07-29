import { v4 } from 'uuid';
import {
  IDroneModel,
  IDroneModelOptions,
  IPosition,
} from '@map/public/contracts';
import {
  ICompositeManager,
  IFBModel,
  IFBPolyline,
  ModelAttitude,
} from '@map/private/contracts';
import {
  DEFAULT_DEVICE_MARKER_LABEL_STYLE,
  DEFAULT_DRONE_MODEL_STYLE,
  DEFAULT_DRONE_TRACE_POLYLINE_STYLE,
} from '../constants';

export class DroneModel implements IDroneModel {
  private droneModel: IFBModel;
  private traceLine: IFBPolyline | null = null;
  public readonly id: string;
  private _currentPosition: IPosition;
  private _cameraTracking = false;
  private _accumulatePositions: IPosition[] = [];
  private _prevTracePathExist = false;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IDroneModelOptions
  ) {
    this.id = `drone-model-${v4()}`;
    this._currentPosition = { ...options.position };

    this.traceLine = this.createTraceLine();

    this.droneModel = this.createDroneModel(options);
  }

  get position(): IPosition {
    return this.droneModel.position;
  }

  get attitude(): ModelAttitude {
    return this.droneModel.attitude;
  }

  setVisibility(visible: boolean): void {
    this.droneModel.setVisibility(visible);
    if (this.traceLine) {
      this.traceLine.setVisibility(visible);
    }
  }

  updatePosition(position: IPosition): void {
    this._accumulatePositions = [...this._accumulatePositions, position];
    this.droneModel.updatePosition(position);
    if (this.traceLine) {
      this.traceLine.addPosition(position);
    }
  }

  addPreviousPath(positions: IPosition[]): void {
    if (!this.traceLine) return;
    if (!this._prevTracePathExist) {
      const accumulatePrevPath = [...positions, ...this._accumulatePositions];
      const seenKeys = new Set<string>();
      const uniqueFlightPaths: typeof accumulatePrevPath = [];
      accumulatePrevPath.forEach((point) => {
        const key = `${point.latitude},${point.longitude},${point.altitude}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueFlightPaths.push(point);
        }
      });
      this.traceLine.setPositions(uniqueFlightPaths);
      this._prevTracePathExist = true;
    }
  }

  updateProperties(properties: { attitude?: ModelAttitude }): void {
    if (properties.attitude) {
      // Update drone model attitude properties
      this.droneModel.setAttitude(properties.attitude);
    }
  }

  panTo(): void {
    this.droneModel.panTo();
  }

  /**
   * Set whether the camera should track this drone model
   * When enabled, the camera will automatically follow the drone as it moves
   * @param track When true, camera will follow this drone
   */
  setCameraTracking(track: boolean): void {
    if (this._cameraTracking === track) return;

    this._cameraTracking = track;
    this.droneModel.setCameraTracking(track);
  }

  /**
   * Check if the camera is currently tracking this drone
   * @returns Whether camera tracking is enabled for this drone
   */
  isCameraTracking(): boolean {
    return this._cameraTracking && this.droneModel.isCameraTracking();
  }

  /**
   * Update the 3D model resource
   * @param modelUri URI to the new 3D model
   */
  updateModel(modelUri: string): void {
    this.droneModel.updateModel(modelUri);
  }

  /**
   * Update the trace line style
   * @param style Style object containing color and other properties
   */
  setTraceLineStyle(style: { color: string }): void {
    if (this.traceLine) {
      this.traceLine.setStyle(style);
    }
  }

  remove(): void {
    // Disable camera tracking before removing
    if (this._cameraTracking) {
      this.setCameraTracking(false);
    }

    this.droneModel.remove();
    if (this.traceLine) {
      this.traceLine.remove();
    }
  }

  // Private methods
  private createTraceLine(): IFBPolyline {
    const traceLine = this._compositeManager.createFBPolyline({
      positions: [this._currentPosition],
      style: structuredClone(DEFAULT_DRONE_TRACE_POLYLINE_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    });

    traceLine.setDynamicPosition(true);

    return traceLine;
  }

  private createDroneModel(options: IDroneModelOptions): IFBModel {
    return this._compositeManager.createFBModel({
      position: options.position,
      scale: options.scale ?? 1.0,
      style: structuredClone(DEFAULT_DRONE_MODEL_STYLE),
      showHeightReference: options.showHeightReference ?? true,
      labelText: options.labelText ?? '',
      labelStyle: structuredClone(DEFAULT_DEVICE_MARKER_LABEL_STYLE),
      visible: options.visible ?? true,
      clickable: options.clickable ?? false,
      hoverable: options.hoverable ?? false,
      editable: false,
    });
  }
}
