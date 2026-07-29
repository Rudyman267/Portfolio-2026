import {
  Cartographic,
  Color,
  ConstantPositionProperty,
  ConstantProperty,
  DistanceDisplayCondition,
  Entity,
  HeadingPitchRange,
  HeightReference,
  JulianDate,
  LabelGraphics,
  NearFarScalar,
  SceneMode,
  Viewer,
} from 'cesium';
import { v4 } from 'uuid';

import {
  DEFAULT_BASE_LABEL_STYLE,
  IBaseLabel,
  ILabelConfig,
  LabelStyle,
  MapEventEmitter,
} from '@map/private/contracts';
import { IEventType, IMapEventData, IPosition } from '@map/public/contracts';
import { ICesiumMapService } from '@map/private/map-providers/cesium/types';
import { ENTITY_ZOOM_LEVEL } from '@map/private/map-providers/cesium/constants';
import {
  positionToCartesian,
  getHeightReference,
} from '@map/private/map-providers/cesium/utils';

/**
 * CesiumBaseLabel class for creating and managing text labels on the Cesium map
 */
export class CesiumBaseLabel implements IBaseLabel {
  protected _id: string;
  protected _position: IPosition;
  protected _text: string;
  protected _style: LabelStyle;
  protected _visible: boolean;
  protected entity: Entity | null = null;
  protected viewer: Viewer;
  protected mapServices: ICesiumMapService;
  protected eventEmitter: MapEventEmitter;

  constructor(mapServices: ICesiumMapService, labelConfig: ILabelConfig) {
    this._id = `cesium-base-label-${v4()}`;
    this._position = labelConfig.position;
    this._text = labelConfig.text || '';
    this._style = {
      ...structuredClone(DEFAULT_BASE_LABEL_STYLE),
      ...labelConfig.style,
    };
    this._visible = true;
    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this.eventEmitter = new MapEventEmitter();
    this.createEntity();
    this.registerSceneChangeListener();
  }

  // Core properties
  get id(): string {
    return this._id;
  }

  // Get text content (readonly property)
  get text(): string {
    return this._text;
  }

  // Get position (readonly property)
  get position(): IPosition {
    return structuredClone(this._position);
  }

  // Get style (readonly property)
  get style(): LabelStyle {
    return structuredClone(this._style);
  }

  // Get visibility (readonly property)
  get visible(): boolean {
    return this._visible;
  }

  get cesiumEntity(): Entity | null {
    return this.entity;
  }

  // Set text content
  setText(text: string): void {
    this._text = text;
    if (this.entity && this.entity.label) {
      this.entity.label.text = new ConstantProperty(text);
    }
  }

  updatePosition(position: IPosition): void {
    this._position = { ...position };
    if (this.entity) {
      this.entity.position = new ConstantPositionProperty(
        positionToCartesian(position)
      );
    }
  }
  updateProperties(style: Partial<LabelStyle>): void {
    this._style = { ...this._style, ...style };
    if (this.entity?.label) {
      const label = this.entity.label;
      if (style.font) {
        label.font = new ConstantProperty(style.font);
      }
      if (style.fillColor) {
        label.fillColor = new ConstantProperty(
          Color.fromCssColorString(style.fillColor)
        );
      }
      if (style.outlineColor) {
        label.outlineColor = new ConstantProperty(
          Color.fromCssColorString(style.outlineColor)
        );
      }
      if (style.outlineWidth !== undefined) {
        label.outlineWidth = new ConstantProperty(style.outlineWidth);
      }
      if (style.scale !== undefined) {
        label.scale = new ConstantProperty(style.scale);
      }
      if (style.style !== undefined) {
        label.style = new ConstantProperty(style.style);
      }
      if (style.horizontalOrigin !== undefined) {
        label.horizontalOrigin = new ConstantProperty(style.horizontalOrigin);
      }
      if (style.verticalOrigin !== undefined) {
        label.verticalOrigin = new ConstantProperty(style.verticalOrigin);
      }
      if (style.eyeOffset) {
        label.eyeOffset = new ConstantProperty(style.eyeOffset);
      }
      if (style.pixelOffset) {
        label.pixelOffset = new ConstantProperty(style.pixelOffset);
      }
      if (style.showBackground !== undefined) {
        label.showBackground = new ConstantProperty(style.showBackground);
      }
      if (style.backgroundColor || style.backgroundAlpha !== undefined) {
        const alpha = style.backgroundAlpha ?? this._style.backgroundAlpha!;
        const color = style.backgroundColor ?? this._style.backgroundColor!;
        label.backgroundColor = new ConstantProperty(
          Color.fromCssColorString(color!).withAlpha(alpha)
        );
      }
      if (style.backgroundPadding !== undefined) {
        label.backgroundPadding = new ConstantProperty(style.backgroundPadding);
      }
      if (style.heightReference !== undefined) {
        const heightRef = getHeightReference(style.heightReference);
        label.heightReference = new ConstantProperty(heightRef);
      }
    }
  }

  // Visibility
  setVisibility(visible: boolean): void {
    this._visible = visible;
    if (this.entity) {
      this.entity.show = visible;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
  }

  /**
   * Create the Cesium entity for this label
   */
  private createEntity(): void {
    this.entity = new Entity({
      id: this._id,
      position: new ConstantPositionProperty(
        positionToCartesian(this._position)
      ),
      label: new LabelGraphics({
        text: new ConstantProperty(this._text),
        font: new ConstantProperty(this._style.font),
        style: new ConstantProperty(this._style.style),
        fillColor: new ConstantProperty(
          Color.fromCssColorString(this._style.fillColor!)
        ),
        outlineColor: new ConstantProperty(
          Color.fromCssColorString(this._style.outlineColor!)
        ),
        outlineWidth: new ConstantProperty(this._style.outlineWidth),
        scale: new ConstantProperty(this._style.scale),
        horizontalOrigin: new ConstantProperty(this._style.horizontalOrigin),
        verticalOrigin: new ConstantProperty(this._style.verticalOrigin),
        eyeOffset: new ConstantProperty(this._style.eyeOffset),
        pixelOffset: new ConstantProperty(this._style.pixelOffset),
        showBackground: new ConstantProperty(this._style.showBackground),
        backgroundColor: new ConstantProperty(
          Color.fromCssColorString(this._style.backgroundColor!).withAlpha(
            this._style.backgroundAlpha!
          )
        ),
        backgroundPadding: new ConstantProperty(this._style.backgroundPadding),
        disableDepthTestDistance: new ConstantProperty(
          Number.POSITIVE_INFINITY
        ),
        distanceDisplayCondition: new ConstantProperty(
          new DistanceDisplayCondition(0, 6.0e4)
        ),
        scaleByDistance: new ConstantProperty(
          new NearFarScalar(1.5e2, 1.0, 3.0e6, 0.1)
        ),
        heightReference: new ConstantProperty(
          getHeightReference(this._style.heightReference)
        ),
      }),
      show: this._visible,
    });

    this.viewer.entities.add(this.entity);
    this.adjustForSceneMode(this.mapServices?.viewer?.scene?.mode);
  }

  /**
   * Get the event emitter instance (read-only)
   * @returns A read-only instance of the event emitter
   */
  getEventEmitter(): MapEventEmitter {
    return this.eventEmitter.getListenOnlyInstance();
  }

  /**
   * Register a listener for scene change events
   * @private
   */
  private registerSceneChangeListener(): void {
    if (this.mapServices.eventsManager) {
      this.mapServices.eventsManager.onGlobalEvent(
        IEventType.SCENE_CHANGED,
        (eventData: IMapEventData) => {
          this.onSceneChanged(eventData);
        }
      );
    }
  }

  /**
   * Handle scene change events
   * @param eventData Event data containing the scene mode
   * @private
   */
  private onSceneChanged(eventData: IMapEventData): void {
    if (eventData.sceneMode !== undefined) {
      this.adjustForSceneMode(eventData.sceneMode);
    }
  }

  /**
   * Adjust label properties based on scene mode
   * @param sceneMode The current scene mode (2D or 3D)
   * @private
   */
  private adjustForSceneMode(sceneMode: SceneMode): void {
    if (this.entity && this.entity.label) {
      if (sceneMode === SceneMode.SCENE2D) {
        this.entity.label.heightReference = new ConstantProperty(
          HeightReference.NONE
        );
      } else {
        const heightRef = this._style?.heightReference;
        this.entity.label.heightReference = new ConstantProperty(
          getHeightReference(heightRef)
        );
      }
    }
  }

  /**
   * Pan to this label entity with an animation
   */
  panToEntity(): void {
    if (!this.entity || !this.viewer) return;
    const entityPos = this.entity.position?.getValue(JulianDate.now());
    if (!entityPos) return;
    let entityElevation =
      this.viewer.scene.globe.getHeight(
        Cartographic.fromCartesian(entityPos)
      ) || 0;
    entityElevation =
      entityElevation < 0
        ? ENTITY_ZOOM_LEVEL.LABEL
        : entityElevation + ENTITY_ZOOM_LEVEL.LABEL;
    const currentHeading = this.viewer.camera.heading;
    const currentPitch = this.viewer.camera.pitch;
    this.viewer.flyTo(this.entity, {
      offset: new HeadingPitchRange(
        currentHeading,
        currentPitch,
        entityElevation
      ),
      duration: 3,
    });
  }
}
