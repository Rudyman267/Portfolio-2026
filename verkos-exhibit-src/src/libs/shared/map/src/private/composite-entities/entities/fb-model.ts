import { v4 } from 'uuid';
import { FbHeightReferenceLine } from './fb-heightReferenceLine';
import {
  ClampingHeightProperties,
  ColorBlendModeEnum,
  IBaseLabel,
  IBaseModel,
  IEvent,
  IFBModel,
  IFBModelOptions,
  IMapProviderServices,
  LabelStyle,
  MapEventEmitter,
  ModelAttitude,
  ModelStyle,
  RelativeHeightProperties,
} from '@map/private/contracts';
import { IEventType, IPosition } from '@map/public/contracts';
import { DEFAULT_FB_LABEL_STYLE, DEFAULT_FB_MODEL_STYLE } from '../constants';

/**
 * FBModel class that implements the IFBModel interface
 * A composite entity that combines a 3D model with label and height reference line
 */
export class FBModel extends FbHeightReferenceLine implements IFBModel {
  private _model: IBaseModel;
  private _label: IBaseLabel | null = null;
  protected declare _eventEmitter: MapEventEmitter;
  private _hoverable: boolean;
  private _editable: boolean;
  private _clickable: boolean;
  private _heightReferenceVisible: boolean;
  private _cameraTracking = false;
  protected declare _options: IFBModelOptions;
  public declare readonly id: string;

  /**
   * Create a new model entity on the map
   * @param _mapProviderServices Provider services for map operations and entity creation
   * @param options Configuration options for the model
   */
  constructor(
    _mapProviderServices: IMapProviderServices,
    options: IFBModelOptions
  ) {
    if (!options.position) {
      throw new Error('Position is required for FBModel');
    }
    const position = {
      ...options.position,
    };
    const heightReferenceVisible = options.showHeightReference || false;

    // Pass heightReference from options to the parent class for consistent height reference
    super(_mapProviderServices, {
      position: position,
      heightReference: options.style?.heightReference,
      visible: heightReferenceVisible,
    });

    this._options = options;
    this.id = options.id || `fb-model-${v4()}`;
    this._eventEmitter = new MapEventEmitter();
    this._hoverable = options.hoverable || false;
    this._clickable = options.clickable || false;
    this._editable = options.editable || false;
    this._heightReferenceVisible = heightReferenceVisible;

    this._model = this.createModel(options);

    if (options.labelText) {
      this.createLabel(options.labelText, options.labelStyle);
    }
    this.registerEventHandlers();
  }

  public get position(): IPosition {
    return this._model.position;
  }

  public get style(): ModelStyle {
    return this._model.style;
  }

  public get attitude(): ModelAttitude {
    return this._model.attitude;
  }

  public get labelText(): string {
    return this._label ? this._label.text : '';
  }

  public get labelStyle(): LabelStyle {
    return this._label?.style ?? structuredClone(DEFAULT_FB_LABEL_STYLE);
  }

  public get visible(): boolean {
    return this._model.visible;
  }

  public get hoverable(): boolean {
    return this._hoverable;
  }

  public get clickable(): boolean {
    return this._clickable;
  }

  public get heightReferenceVisible(): boolean {
    return this._heightReferenceVisible;
  }

  public get keyboardControllable(): boolean {
    return this._model.keyboardControllable;
  }

  setKeyboardControllable(enabled: boolean): void {
    this._model.setKeyboardControllable(enabled);
  }

  setKeyboardFocus(focused: boolean): void {
    this._model.setKeyboardFocus(focused);
  }

  /**
   * Update the model position
   * @param position New position
   */
  async updatePosition(position: IPosition): Promise<void> {
    try {
      const positionCopy = { ...position };
      this._model.setPosition(positionCopy);
      if (this._label) {
        this._label.updatePosition(positionCopy);
      }
      await super.updatePosition(positionCopy);
    } catch (error) {
      console.error(`Error setting position for model ${this.id}:`, error);
    }
  }

  /**
   * Set the model style
   * @param style Style properties to update
   */
  setStyle(style: Partial<ModelStyle>): void {
    this._model.setStyle(style);

    if (
      style.heightReference &&
      ClampingHeightProperties.includes(style.heightReference)
    ) {
      this._heightReferenceVisible = false;
      this.setHeightReferenceVisibility(this._heightReferenceVisible);
    } else if (
      style.heightReference &&
      RelativeHeightProperties.includes(style.heightReference)
    ) {
      this._heightReferenceVisible = true;
      this.setHeightReferenceVisibility(this._heightReferenceVisible);
    }

    if (style.heightReference) {
      this._label?.updateProperties({ heightReference: style.heightReference });
    }
  }

  /**
   * Update the 3D model resource
   * @param modelUri URI to the new 3D model
   */
  updateModel(modelUri: string): void {
    this._model.updateModel(modelUri);
  }

  /**
   * Set silhouette for the model
   * @param color Color of the silhouette outline
   * @param size Size of the silhouette outline in pixels
   */
  setSilhouette(color: string, size?: number): void {
    this._model.setSilhouette(color, size);
  }

  /**
   * Remove silhouette from the model
   */
  removeSilhouette(): void {
    this._model.removeSilhouette();
  }

  /**
   * Set color blend mode for the model
   * @param mode Blend mode for model coloring
   * @param amount Amount of color blending (0-1)
   */
  setColorBlend(mode: ColorBlendModeEnum, amount?: number): void {
    this._model.setColorBlend(mode, amount);
  }

  /**
   * Set the attitude (orientation) of the model
   * @param attitude The new attitude settings
   */
  setAttitude(attitude: Partial<ModelAttitude>): void {
    this._model.setAttitude(attitude);
  }

  /**
   * Set the height reference visibility
   * @param visible Whether the height reference line should be visible
   */
  setHeightReferenceVisibility(visible: boolean): void {
    super.setVisibility(visible);
    this._heightReferenceVisible = visible;
  }

  /**
   * Set the label text
   * @param text The new label text
   */
  setLabelText(text: string): void {
    if (!text) {
      if (this._label) {
        this._label.destroy();
        this._label = null;
      }
      return;
    }

    if (this._label) {
      this._label.setText(text);
    } else {
      this.createLabel(text);
    }
  }

  /**
   * Update the label style
   * @param style Style properties to update
   */
  updateLabelStyle(style: Partial<LabelStyle>): void {
    if (this._label) {
      this._label.updateProperties(style);
    }
  }

  /**
   * Set visibility of the model and all its components
   * @param visible Whether the model should be visible
   */
  setVisibility(visible: boolean): void {
    this._model.setVisibility(visible);
    if (this._label) {
      this._label.setVisibility(visible);
    }
    super.setVisibility(visible);
  }

  /**
   * Set hoverability of the model
   * @param hoverable Whether the model should be hoverable
   */
  setHoverable(hoverable: boolean): void {
    this._hoverable = hoverable;
    this._model.setHoverable(hoverable);
  }

  /**
   * Set clickability of the model
   * @param clickable Whether the model should be clickable
   */
  setClickable(clickable: boolean): void {
    this._clickable = clickable;
    this._model.setClickable(clickable);
  }

  /**
   * Set editability of the model
   * @param editable Whether the model should be editable
   */
  setEditable(editable: boolean): void {
    this._editable = editable;
    this._model.setDraggable(editable);
  }

  /**
   * Pan the map view to center on this model
   */
  panTo(): void {
    this._model.panTo();
  }

  /**
   * Set whether the camera should track this model
   * When enabled, the camera will automatically follow this model as it moves
   * @param track When true, camera will follow this model
   */
  setCameraTracking(track: boolean): void {
    // If tracking state isn't changing, do nothing
    if (this._cameraTracking === track) return;

    this._cameraTracking = track;
    this._model.setCameraTracking(track);
  }

  /**
   * Check if the camera is currently tracking this entity
   * @returns Whether camera tracking is enabled
   */
  isCameraTracking(): boolean {
    return this._cameraTracking && this._model.isCameraTracking();
  }

  /**
   * Get the event emitter instance (read-only)
   * @returns A read-only instance of the event emitter
   */
  getEventEmitter(): MapEventEmitter {
    return this._eventEmitter.getListenOnlyInstance();
  }

  /**
   * Remove this entity from the map
   */
  remove(): void {
    // Disable camera tracking before destroying
    if (this._cameraTracking) {
      this.setCameraTracking(false);
    }

    if (this._model) {
      this._model.destroy();
    }
    if (this._label) {
      this._label.destroy();
      this._label = null;
    }
    super.remove();
    this._eventEmitter.removeAllListeners();
  }

  // Private methods
  private createModel(options: IFBModelOptions): IBaseModel {
    const createdModel =
      this._mapProviderServices.baseEntityManager.createBaseModel({
        position: options.position,
        style: {
          ...structuredClone(DEFAULT_FB_MODEL_STYLE),
          scale: options?.scale,
          ...options.style,
        },
        isDraggable: options.editable || false,
        isKeyboardControllable: options.isKeyboardControllable || false,
      });

    if (options.hoverable === true) {
      createdModel.setHoverable(true);
    }

    if (options.clickable === true) {
      createdModel.setClickable(true);
    }

    if (options.visible !== undefined) {
      createdModel.setVisibility(options.visible);
    }

    return createdModel;
  }

  /**
   * Create a label for the model
   * @param text The label text
   * @param style Optional label style
   */
  private createLabel(text: string, style?: LabelStyle): void {
    if (this._label) {
      this._label.destroy();
      this._label = null;
    }
    this._label = this._mapProviderServices.baseEntityManager.createBaseLabel({
      position: this.position,
      text: text,
      style: {
        ...structuredClone(DEFAULT_FB_LABEL_STYLE),
        ...style,
        heightReference: this._options?.style?.heightReference,
      },
    });
  }

  /**
   * Register event handlers for the model
   * Listens to base model position changes and updates dependent entities (label, height reference line)
   * This follows the same pattern as FBMarker for consistency
   */
  private registerEventHandlers() {
    const modelEvents = this._model.getEventEmitter();
    modelEvents.addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
      if (this._label && event.data.position) {
        this._label.updatePosition(event.data.position);
      }
      // Update height reference line position
      super.updatePosition(event.data.position as IPosition);
      // Forward the position changed event with FB model's ID
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    modelEvents.addListener(IEventType.CLICK, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    modelEvents.addListener(IEventType.ALT_PLUS_LEFT_DOWN, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    modelEvents.addListener(IEventType.ALT_PLUS_LEFT_UP, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    modelEvents.addListener(IEventType.LEFT_UP, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    modelEvents.addListener(IEventType.MOUSE_HOVER, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });
  }
}
