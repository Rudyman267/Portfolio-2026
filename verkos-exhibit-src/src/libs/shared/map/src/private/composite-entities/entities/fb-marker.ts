import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import { HeightReferenceEnum } from '@map/public/core';
import {
  IBaseLabel,
  IBaseMarker,
  IEvent,
  IFBMarker,
  IFBMarkerOptions,
  IMapProviderServices,
  LabelStyle,
  MapEventEmitter,
  MarkerStyle,
} from '@map/private/contracts';
import { FbHeightReferenceLine } from './fb-heightReferenceLine';
import { DEFAULT_FB_LABEL_STYLE, DEFAULT_FB_MARKER_STYLE } from '../constants';

// Define clamping height properties
const ClampingHeightProperties = [
  HeightReferenceEnum.CLAMP_TO_GROUND,
  HeightReferenceEnum.CLAMP_TO_TERRAIN,
];

// Define relative height properties
const RelativeHeightProperties = [
  HeightReferenceEnum.NONE,
  HeightReferenceEnum.RELATIVE_TO_GROUND,
  HeightReferenceEnum.RELATIVE_TO_TERRAIN,
];

/**
 * FBMarker class that implements the IFBMarker interface
 * A composite entity that combines a marker with label and height reference line
 */
export class FBMarker extends FbHeightReferenceLine implements IFBMarker {
  private _marker: IBaseMarker;
  private _label: IBaseLabel | null = null;
  protected declare _eventEmitter: MapEventEmitter;
  private _editable: boolean;
  private _heightReferenceVisible: boolean;
  public declare readonly id: string;

  /**
   * Create a new marker entity on the map
   * @param _mapProviderServices Services for accessing entity managers and map services
   * @param options Configuration options for the marker
   */
  constructor(
    _mapProviderServices: IMapProviderServices,
    options: IFBMarkerOptions
  ) {
    if (!options.position) {
      throw new Error('Position is required for FBMarker');
    }
    const heightReferenceVisible = options.showHeightReference || false;

    super(_mapProviderServices, {
      position: options.position,
      visible: heightReferenceVisible,
    });

    this.id = options?.id || `fb-marker-${v4()}`;
    this._eventEmitter = new MapEventEmitter();
    this._editable = options.editable || false;
    this._heightReferenceVisible = heightReferenceVisible;

    this._marker = this.createMarker(options);

    if (options.labelText) {
      this.createLabel(options.labelText, options.labelStyle);
    }
    this.registerEventHandlers();
  }

  public get position(): IPosition {
    return this._marker.position;
  }

  public get style(): MarkerStyle {
    return this._marker.style;
  }

  public get labelText(): string {
    return this._label ? this._label.text : '';
  }

  public get labelStyle(): LabelStyle {
    return this._label
      ? this._label.style
      : structuredClone(DEFAULT_FB_LABEL_STYLE);
  }

  public get visible(): boolean {
    return this._marker.visible;
  }

  public get editable(): boolean {
    return this._editable;
  }

  public get hoverable(): boolean {
    return this._marker.draggable;
  }

  public get clickable(): boolean {
    return this._marker.draggable;
  }

  public get rotateWithCamera(): boolean {
    return this._marker.rotateWithCamera;
  }

  public get baseMarkerId(): string {
    return this._marker.id;
  }

  public get keyboardControllable(): boolean {
    return this._marker.keyboardControllable;
  }

  /**
   * Get the height reference visibility
   * @returns Whether the height reference line is visible
   */
  public get heightReferenceVisible(): boolean {
    return this._heightReferenceVisible;
  }

  setKeyboardControllable(enabled: boolean): void {
    this._marker.setKeyboardControllable(enabled);
  }

  setKeyboardFocus(focused: boolean): void {
    this._marker.setKeyboardFocus(focused);
  }

  /**
   * Update the marker position
   * @param position New position
   */
  async updatePosition(position: IPosition): Promise<void> {
    try {
      if (!position || !position.latitude || !position.longitude) {
        console.warn(`Invalid position provided for marker `);
        return;
      }

      if (!this._marker) {
        console.warn('Marker not found for updating position');
        return;
      }

      const positionCopy = { ...position };
      this._marker.setPosition(positionCopy);
      if (this._label) {
        this._label.updatePosition(positionCopy);
      }
      await super.updatePosition(positionCopy);
    } catch (error) {
      console.error(`Error setting position for marker ${this.id}:`, error);
    }
  }

  /**
   * Set the marker style
   * @param style Style properties to update
   */
  setStyle(style: Partial<MarkerStyle>): void {
    if (!this._marker) {
      console.warn('Marker not found for setting style');
      return;
    }

    this._marker.setStyle(style);
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
   * Update the marker image
   * @param imageUrl URL or data URI of the new image
   */
  updateImage(imageUrl: string): void {
    this._marker.updateImage(imageUrl);
  }

  /**
   * Set the rotation angle for the marker
   * @param angle Rotation angle in degrees
   */
  setRotation(angle: number): void {
    this._marker.setRotation(angle);
  }

  /**
   * Enable or disable camera-relative rotation
   * @param enable When true, marker rotates with camera
   */
  enableCameraRotation(enable: boolean): void {
    this._marker.enableCameraRotation(enable);
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
   * Set visibility of the marker and all its components
   * @param visible Whether the marker should be visible
   */
  setVisibility(visible: boolean): void {
    this._marker.setVisibility(visible);
    if (this._label) {
      this._label.setVisibility(visible);
    }

    if (this._heightReferenceVisible) {
      super.setVisibility(visible);
    }
  }

  /**
   * Set editability of the marker
   * @param editable Whether the marker should be editable
   */
  setEditable(editable: boolean): void {
    this._editable = editable;
    if (!this._marker) {
      console.warn('Marker not found for setting editable state');
      return;
    }
    this._marker.setDraggable(editable);
  }

  /**
   * Set hoverability of the marker
   * @param hoverable Whether the marker should be hoverable
   */
  setHoverable(hoverable: boolean): void {
    if (!this._marker) {
      console.warn('Marker not found for setting hoverable state');
      return;
    }

    this._marker.setHoverable(hoverable);
  }

  /**
   * Set clickability of the marker
   * @param clickable Whether the marker should be clickable
   */
  setClickable(clickable: boolean): void {
    if (!this._marker) {
      console.warn('Marker not found for setting clickable state');
      return;
    }

    this._marker.setClickable(clickable);
  }

  /**
   * Pan the map view to center on this marker
   */
  panTo(): void {
    this._marker.panTo();
  }

  /**
   * Set the view to this marker's position
   * This will adjust the map view to focus on the marker
   */
  setViewTo() {
    this._marker.setViewTo();
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
    if (this._marker) {
      this._marker.destroy();
    }

    if (this._label) {
      this._label.destroy();
      this._label = null;
    }
    super.remove();
    this._eventEmitter.removeAllListeners();
  }

  private createMarker(options: IFBMarkerOptions): IBaseMarker {
    const createdFBMarker =
      this._mapProviderServices.baseEntityManager.createBaseMarker({
        position: options.position,
        style: {
          ...structuredClone(DEFAULT_FB_MARKER_STYLE),
          ...options.style,
        },
        isDraggable: options.editable || false,
        isKeyboardControllable: options.isKeyboardControllable || false,
      });

    if (options.clickable === true) {
      createdFBMarker.setClickable(true);
    }

    if (options.hoverable === true) {
      createdFBMarker.setHoverable(true);
    }

    if (options.visible !== undefined) {
      createdFBMarker.setVisibility(options.visible);
    }

    return createdFBMarker;
  }

  /**
   * Create a label for the marker
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
        ...(style ?? {}),
      },
    });
  }

  /**
   * Register event handlers for the marker
   */
  private registerEventHandlers() {
    const markerEvents = this._marker.getEventEmitter();

    // Forward position change events
    markerEvents.addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
      if (this._label && event.data.position) {
        this._label.updatePosition(event.data.position);
      }
      super.updatePosition(event.data.position as IPosition);
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    // Forward click events
    markerEvents.addListener(IEventType.CLICK, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    // Forward Alt + Left Down events (for altitude manipulation start)
    markerEvents.addListener(IEventType.ALT_PLUS_LEFT_DOWN, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    // Forward Alt + Left Up events (for altitude manipulation end)
    markerEvents.addListener(IEventType.ALT_PLUS_LEFT_UP, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    // Forward regular Left Up events (fallback for when Alt key is released)
    markerEvents.addListener(IEventType.LEFT_UP, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    // Forward regular Left Down events (drag/select start)
    markerEvents.addListener(IEventType.LEFT_DOWN, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });

    markerEvents.addListener(IEventType.MOUSE_HOVER, (event: IEvent) => {
      this._eventEmitter.emit({ ...event, id: this.id });
    });
  }
}
