import { v4 } from 'uuid';
import {
  IEventType,
  IMapEventData,
  IPosition,
  ISensorMarker,
  ISensorMarkerOptions,
} from '@map/public/contracts';
import {
  ICompositeManager,
  IFBCircle,
  IFBMarker,
} from '@map/private/contracts';
import {
  DEFAULT_SENSOR_LABEL_STYLE,
  DEFAULT_SENSOR_MARKER_STYLE,
  DEFAULT_SENSOR_MAX_CIRCLE_STYLE,
  DEFAULT_SENSOR_MIN_CIRCLE_STYLE,
} from '../constants';

export class SensorMarker implements ISensorMarker {
  private _id: string;
  private _sensorMarker?: IFBMarker;
  private minCircle?: IFBCircle;
  private maxCircle?: IFBCircle;
  private _compositeManager: ICompositeManager;

  constructor(
    _compositeManager: ICompositeManager,
    options: ISensorMarkerOptions
  ) {
    this._id = `sensor-marker-${v4()}`;
    this._compositeManager = _compositeManager;
    const { position } = options;
    if (!position.latitude || !position.longitude) {
      console.error('Invalid sensor marker position');
      return;
    }
    this._sensorMarker = this.createSensorMarker(options);

    this.minCircle = this.createMinCircle(position);
    this.maxCircle = this.createMaxCircle(position);

    this._registerEventHandlers();
    this._setupGlobalListener();
  }

  get id(): string {
    return this._id;
  }

  setVisibility(visible: boolean): void {
    this._sensorMarker?.setVisibility(visible);
  }

  panTo(): void {
    this._sensorMarker?.panTo();
  }

  setStatus(status: boolean): void {
    if (status) {
      this._sensorMarker?.updateImage('assets/sensors/online-sensor.svg');
    } else {
      this._sensorMarker?.updateImage('assets/sensors/offline-sensor.svg');
    }
  }

  updatePosition(position: IPosition): void {
    this._sensorMarker?.updatePosition(position);
    this.minCircle?.setCenterPosition(position);
    this.maxCircle?.setCenterPosition(position);
  }

  remove(): void {
    this._sensorMarker?.remove();
    this.minCircle?.remove();
    this.maxCircle?.remove();
  }

  // Private Methods
  private createSensorMarker(options: ISensorMarkerOptions): IFBMarker {
    const sensorMarker = this._compositeManager.createFBMarker({
      position: options.position,
      style: {
        ...structuredClone(DEFAULT_SENSOR_MARKER_STYLE),
        image: options.status
          ? 'assets/sensors/online-sensor.svg'
          : 'assets/sensors/offline-sensor.svg',
      },
      labelText: options.labelText,
      labelStyle: structuredClone(DEFAULT_SENSOR_LABEL_STYLE),
      visible: true,
      hoverable: true,
      clickable: false,
      editable: false,
      showHeightReference: false,
    });

    return sensorMarker;
  }

  private createMinCircle(position: IPosition): IFBCircle {
    const minCircle = this._compositeManager.createFBCircle({
      position,
      radius: 100,
      style: structuredClone(DEFAULT_SENSOR_MIN_CIRCLE_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: false,
    });

    return minCircle;
  }

  private createMaxCircle(position: IPosition): IFBCircle {
    const maxCircle = this._compositeManager.createFBCircle({
      position,
      radius: 500,
      style: structuredClone(DEFAULT_SENSOR_MAX_CIRCLE_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: false,
    });
    return maxCircle;
  }

  private _registerEventHandlers(): void {
    // Register click event for the sensor marker
    const emitter = this._sensorMarker?.getEventEmitter();
    emitter?.addListener(IEventType.MOUSE_HOVER, () => {
      this.maxCircle?.setVisibility(true);
      this.minCircle?.setVisibility(true);
    });
  }

  private _setupGlobalListener(): void {
    const mapServices = this._compositeManager.mapProviderServices;
    try {
      mapServices.mapServices.onGlobalMapEvent(
        IEventType.MOUSE_HOVER,
        this._handleGlobalMouseMoveEvent.bind(this)
      );
    } catch (error) {
      console.error('Failed to register global pointer up listener:', error);
    }
  }

  private _handleGlobalMouseMoveEvent(event: IMapEventData): void {
    if (event.entityId !== this._sensorMarker?.baseMarkerId) {
      this.maxCircle?.setVisibility(false);
      this.minCircle?.setVisibility(false);
    } else {
      return;
    }
  }
}
