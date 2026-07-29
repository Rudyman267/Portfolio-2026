import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public/core';
import {
  CircleStyle,
  IBaseCircle,
  IBaseLabel,
  IBasePoint,
  IBasePolyline,
  IEvent,
  IFBCircle,
  IFBCircleOptions,
  IMapProviderServices,
  LabelStyle,
  MapEventEmitter,
  PolylineStyle,
} from '@map/private/contracts';
import { calculateMidpoint, formatDistance } from '@map/private/utils';
import {
  DEFAULT_FB_CIRCLE_STYLE,
  DEFAULT_FB_DISTANCE_LABEL_STYLE,
  DEFAULT_FB_LABEL_STYLE,
  DEFAULT_FB_POLYLINE_STYLE,
  DEFAULT_FB_REAL_POINT_STYLE,
} from '../constants';

/**
 * Implementation of the IFBCircle interface, using a composite pattern
 * that combines base components into a higher-level circle entity.
 */
export class FBCircle implements IFBCircle {
  public readonly id: string;
  private _mapProviderServices: IMapProviderServices;
  private eventEmitter: MapEventEmitter;

  // Base components
  private baseCircle: IBaseCircle;
  private centerLabel: IBaseLabel | null = null;
  private centerEditPoint: IBasePoint | null = null;
  private radiusEditPoint: IBasePoint | null = null;
  private midpointDistanceLabel: IBaseLabel | null = null;
  private radiusLine: IBasePolyline | null = null;

  // State tracking
  private _centerPosition: IPosition;
  private _radius: number;
  private _style: CircleStyle;
  private _labelText: string;
  private _labelStyle: LabelStyle;
  private _visible: boolean;
  private _editable: boolean;
  private _hoverable: boolean;
  private _clickable: boolean;
  private _radiusLabelVisible: boolean;

  // Radius editing state
  private _radiusPointPosition: IPosition | null = null;

  /**
   * Creates a new FBCircle instance
   *
   * @param mapProviderServices Services for map operations and entity creation
   * @param options Configuration options for the circle
   */
  constructor(
    mapProviderServices: IMapProviderServices,
    options: IFBCircleOptions
  ) {
    // Initialize basic properties
    this.id = options.id || `fb-circle-${v4()}`;
    this._mapProviderServices = mapProviderServices;
    this.eventEmitter = new MapEventEmitter();

    // Initialize state with validation
    if (
      !options.position ||
      typeof options.position.longitude !== 'number' ||
      typeof options.position.latitude !== 'number'
    ) {
      console.error(
        'Invalid centerPosition provided to FBCircle:',
        options.position
      );
      // Provide a default centerPosition to prevent errors
      throw new Error('Invalid centerPosition provided to FBCircle');
    } else {
      this._centerPosition = { ...options.position };
    }

    // Ensure radius is valid
    this._radius =
      options.radius !== undefined && options.radius > 0 ? options.radius : 100;
    this._style = {
      ...structuredClone(DEFAULT_FB_CIRCLE_STYLE),
      ...options.style,
    } as CircleStyle;

    this._labelText = options.labelText ?? '';

    this._labelStyle = {
      ...structuredClone(DEFAULT_FB_LABEL_STYLE),
      ...options.labelStyle,
      heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
    } as LabelStyle;

    this._visible = options.visible ?? true;
    this._editable = options.editable ?? false;
    this._hoverable = options.hoverable ?? false;
    this._clickable = options.clickable ?? false;
    this._radiusLabelVisible = options.showDistanceLabels ?? false;

    // Create the base circle entity using the managers from mapProviderServices
    this.baseCircle = this.createBaseCircle();

    // Create associated components based on configuration
    this.createCenterLabel();

    // Setup event propagation from base circle
    this.setupEventListeners();

    // Initialize edit points if editable is enabled
    if (this._editable) {
      this.createEditComponents();
    }
  }
  /**
   * Alias for radiusLabelVisible - returns whether distance labels are visible
   * @returns boolean indicating if distance labels are displayed
   */
  get distanceLabelsVisible(): boolean {
    return this._radiusLabelVisible;
  }

  // Readonly Properties (getters)
  get centerPosition(): IPosition {
    return { ...this._centerPosition };
  }

  get radius(): number {
    return this._radius;
  }

  get style(): CircleStyle {
    return { ...this._style };
  }

  get labelText(): string {
    return this._labelText;
  }

  get labelStyle(): LabelStyle {
    return { ...this._labelStyle };
  }

  get visible(): boolean {
    return this._visible;
  }

  get editable(): boolean {
    return this._editable;
  }

  get hoverable(): boolean {
    return this._hoverable;
  }

  get clickable(): boolean {
    return this._clickable;
  }

  get radiusLabelVisible(): boolean {
    return this._radiusLabelVisible;
  }

  // Circle Management Methods
  public setRadius(radius: number): void {
    if (radius <= 0) {
      console.warn('Circle radius must be greater than zero');
      return;
    }

    this._radius = radius;
    this.baseCircle.setRadius(radius);

    // Update edit components if in edit mode
    if (this._editable) {
      this.updateEditComponents();
    }

    // Emit radius change event
    this.eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this.id,
      data: {
        radius: radius,
      },
    } as IEvent);
  }

  public setCenterPosition(position: IPosition): void {
    this._centerPosition = { ...position };
    this.baseCircle.setPosition(position);

    // Update all dependent components
    this.updateCenterLabel();

    // Update edit components if in edit mode
    if (this._editable) {
      this.updateEditComponents();
    }

    // Emit position change event
    this.eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this.id,
      data: {
        position: position,
      },
    } as IEvent);
  }

  // Style Management
  public setStyle(style: Partial<CircleStyle>): void {
    this._style = { ...this._style, ...style };
    this.baseCircle.setStyle(this._style);

    // Update radius line style to match circle outline if present
    if (this.radiusLine && (style.outlineColor || style.outlineWidth)) {
      this.radiusLine.setStyle({
        color: style.outlineColor,
        width: style.outlineWidth,
      });
    }
  }

  // Label Management
  public setCenterLabelText(text: string): void {
    this._labelText = text;
    if (this.centerLabel) {
      this.centerLabel.setText(text);
    } else if (text) {
      // Create label if it doesn't exist but text is provided
      this.createCenterLabel();
    }
  }

  public setCenterLabelStyle(style: Partial<LabelStyle>): void {
    this._labelStyle = {
      ...this._labelStyle,
      ...style,
      heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
    };
    if (this.centerLabel) {
      this.centerLabel.updateProperties(this._labelStyle);
    } else if (this._labelText) {
      // Create label if it doesn't exist but we have text
      this.createCenterLabel();
    }
  }

  // State Management
  public setVisibility(visible: boolean): void {
    this._visible = visible;
    this.baseCircle.setVisibility(visible);

    // Update visibility of all associated components
    if (this.centerLabel) {
      this.centerLabel.setVisibility(visible);
    }

    // Update edit components visibility
    this.updateEditComponentsVisibility(visible);
  }

  public setEditable(editable: boolean): void {
    if (this._editable === editable) return;

    this._editable = editable;
    this.baseCircle.setEditable(editable);

    if (editable) {
      this.createEditComponents();
    } else {
      this.removeEditComponents();
    }
  }

  public setHoverable(hoverable: boolean): void {
    this._hoverable = hoverable;
    this.baseCircle.setHoverable(hoverable);
  }

  public setClickable(clickable: boolean): void {
    this._clickable = clickable;
    this.baseCircle.setClickable(clickable);
  }

  // Distance Labels
  public setDistanceLabelsVisibility(visible: boolean): void {
    this._radiusLabelVisible = visible;

    // Update midpoint label visibility if it exists
    if (this.midpointDistanceLabel && this._editable) {
      this.midpointDistanceLabel.setVisibility(visible && this._visible);
    }

    // If enabling labels and in edit mode, ensure the label exists
    if (visible && this._editable) {
      this.updateMidpointDistanceLabel();
    }
  }

  // Navigation
  public panTo(): void {
    if (!this.baseCircle) {
      console.error('Base circle not found');
      return;
    }

    this.baseCircle.panTo();
  }

  // Event management
  public getEventEmitter(): MapEventEmitter {
    return this.eventEmitter.getListenOnlyInstance();
  }

  // Cleanup
  public remove(): void {
    // Destroy all components
    this.baseCircle.destroy();

    if (this.centerLabel) {
      this.centerLabel.destroy();
      this.centerLabel = null;
    }

    this.removeEditComponents();

    // Remove all event listeners
    this.eventEmitter.removeAllListeners();
  }

  // Private helper methods
  private setupEventListeners(): void {
    // Forward events from base circle to this entity's event emitter
    const baseCircleEmitter = this.baseCircle.getEventEmitter();

    baseCircleEmitter.addListener(IEventType.CLICK, (event: IEvent) => {
      // Forward the click event with context about this composite entity
      this.eventEmitter.emit({
        type: IEventType.CLICK,
        id: this.id,
        data: {
          ...event.data,
          position: this._centerPosition,
          radius: this._radius,
        },
      });
    });

    baseCircleEmitter.addListener(IEventType.MOUSE_HOVER, (event: IEvent) => {
      // Forward the hover event with context about this composite entity
      this.eventEmitter.emit({
        type: IEventType.MOUSE_HOVER,
        id: this.id,
        data: {
          ...event.data,
          position: this._centerPosition,
          radius: this._radius,
        },
      });
    });

    // Listen for position changes from base circle (e.g., dragging)
    baseCircleEmitter.addListener(
      IEventType.POSITION_CHANGED,
      (event: IEvent) => {
        if (event.data && event.data.position) {
          const newCenterPosition = event.data.position;
          const oldCenterPosition = { ...this._centerPosition };

          // Calculate offset for maintaining relative positions
          const deltaLon =
            newCenterPosition.longitude - oldCenterPosition.longitude;
          const deltaLat =
            newCenterPosition.latitude - oldCenterPosition.latitude;

          // Update internal center position
          this._centerPosition = { ...newCenterPosition };

          // Update all components that depend on center position
          if (this._editable) {
            // Update center edit point
            if (this.centerEditPoint) {
              this.centerEditPoint.setPosition(newCenterPosition);
            }

            // Update radius edit point to maintain relative position
            if (this._radiusPointPosition && this.radiusEditPoint) {
              // Calculate new radius point position maintaining relative offset
              const newRadiusPos = {
                longitude: this._radiusPointPosition.longitude + deltaLon,
                latitude: this._radiusPointPosition.latitude + deltaLat,
                altitude: newCenterPosition.altitude,
              };

              // Update the radius point
              this.radiusEditPoint.setPosition(newRadiusPos);
              this._radiusPointPosition = newRadiusPos;
            }

            // Update radius line
            this.updateRadiusLine();

            // Update midpoint distance label
            if (this._radiusLabelVisible) {
              this.updateMidpointDistanceLabel();
            }
          }

          // Update center label position
          if (this.centerLabel) {
            this.updateCenterLabel();
          }

          // Forward the position changed event with updated context
          this.eventEmitter.emit({
            type: IEventType.POSITION_CHANGED,
            id: this.id,
            data: {
              position: newCenterPosition,
              radius: this._radius,
            },
          } as IEvent);
        }
      }
    );
  }

  private createBaseCircle(): IBaseCircle {
    const baseCircle =
      this._mapProviderServices.baseEntityManager.createBaseCircle({
        position: this._centerPosition,
        radius: this._radius,
        style: this._style,
        isEditable: this._editable,
        isHoverable: this._hoverable,
        isClickable: this._clickable,
      });

    if (this._editable) {
      baseCircle.setEditable(true);
    }

    if (this._hoverable) {
      baseCircle.setHoverable(true);
    }

    if (this._clickable) {
      baseCircle.setClickable(true);
    }

    if (this._visible !== undefined) {
      baseCircle.setVisibility(this._visible);
    }

    return baseCircle;
  }

  private createCenterLabel(): void {
    if (!this._labelText) return;
    const labelPosition = {
      ...this._centerPosition,
      latitude: this._centerPosition.latitude + 0.0002,
    };

    this.centerLabel =
      this._mapProviderServices.baseEntityManager.createBaseLabel({
        position: labelPosition,
        text: this._labelText,
        style: this._labelStyle,
      });
  }

  private updateCenterLabel(): void {
    if (!this.centerLabel) return;
    const labelPosition = {
      ...this._centerPosition,
      latitude: this._centerPosition.latitude + 0.0002,
    };

    this.centerLabel.updatePosition(labelPosition);
  }

  // --- Edit Components Management ---
  private createEditComponents(): void {
    // Initialize the radius point position
    this._radiusPointPosition = this.calculateInitialRadiusPointPosition();

    // Create center edit point
    this.createCenterEditPoint();

    // Create radius edit point
    this.createRadiusEditPoint();

    // Create the radius line
    this.createRadiusLine();

    // Create midpoint label if distance labels are visible
    if (this._radiusLabelVisible) {
      this.createMidpointDistanceLabel();
    }

    // Setup event listeners for edit points
    this.setupEditPointEventListeners();
  }

  private createCenterEditPoint(): void {
    // Create center edit point for moving the entire circle
    this.centerEditPoint =
      this._mapProviderServices.baseEntityManager.createBasePoint({
        position: this._centerPosition,
        style: {
          ...structuredClone(DEFAULT_FB_REAL_POINT_STYLE),
          heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
        },
        isEditable: true,
      });
  }

  private createRadiusEditPoint(): void {
    if (!this._radiusPointPosition) {
      this._radiusPointPosition = this.calculateInitialRadiusPointPosition();
    }

    // Create radius edit point for adjusting circle size
    this.radiusEditPoint =
      this._mapProviderServices.baseEntityManager.createBasePoint({
        position: this._radiusPointPosition,
        style: {
          ...structuredClone(DEFAULT_FB_REAL_POINT_STYLE),
          heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
        },
        isEditable: true,
      });
  }

  private removeEditComponents(): void {
    // Remove center edit point
    if (this.centerEditPoint) {
      this.centerEditPoint.destroy();
      this.centerEditPoint = null;
    }

    // Remove radius edit point
    if (this.radiusEditPoint) {
      this.radiusEditPoint.destroy();
      this.radiusEditPoint = null;
    }

    // Remove radius line
    if (this.radiusLine) {
      this.radiusLine.destroy();
      this.radiusLine = null;
    }

    // Remove midpoint label
    if (this.midpointDistanceLabel) {
      this.midpointDistanceLabel.destroy();
      this.midpointDistanceLabel = null;
    }

    // Reset radius point position
    this._radiusPointPosition = null;
  }

  private updateEditComponents(): void {
    if (!this._editable) return;

    // Update center edit point position
    if (this.centerEditPoint) {
      this.centerEditPoint.setPosition(this._centerPosition);
    }

    // If the radius point position is not set, calculate it
    if (!this._radiusPointPosition) {
      this._radiusPointPosition = this.calculateInitialRadiusPointPosition();
    }

    // Calculate the vector from center to current radius point
    if (this._radiusPointPosition && this.radiusEditPoint) {
      // Calculate a new position that maintains the same angle but at the updated radius
      const deltaLon =
        this._radiusPointPosition.longitude - this._centerPosition.longitude;
      const deltaLat =
        this._radiusPointPosition.latitude - this._centerPosition.latitude;

      // Calculate the angle
      const angle = Math.atan2(deltaLat, deltaLon);

      // Get new position on circumference
      const newPosition = this.getPositionOnCircumference(angle);

      // Update radius edit point position
      this.radiusEditPoint.setPosition(newPosition);

      // Save the updated position
      this._radiusPointPosition = newPosition;
    }

    // Update radius line
    this.updateRadiusLine();

    // Update distance label
    this.updateMidpointDistanceLabel();
  }

  private updateEditComponentsVisibility(visible: boolean): void {
    if (!this._editable) return;

    // Only update if in edit mode
    if (this.centerEditPoint) {
      this.centerEditPoint.setVisibility(visible);
    }

    if (this.radiusEditPoint) {
      this.radiusEditPoint.setVisibility(visible);
    }

    if (this.radiusLine) {
      this.radiusLine.setVisibility(visible);
    }

    if (this.midpointDistanceLabel && this._radiusLabelVisible) {
      this.midpointDistanceLabel.setVisibility(visible);
    }
  }

  private createRadiusLine(): void {
    if (!this._radiusPointPosition) {
      this._radiusPointPosition = this.calculateInitialRadiusPointPosition();
    }

    // Get the positions for the line
    const positions = [this._centerPosition, this._radiusPointPosition];

    // Create the polyline
    const lineStyle: PolylineStyle = {
      ...structuredClone(DEFAULT_FB_POLYLINE_STYLE),
      color: MapColor.WHITE,
      clampToGround: true,
    };

    this.radiusLine =
      this._mapProviderServices.baseEntityManager.createBasePolyline({
        positions: positions,
        style: lineStyle,
        isVisible: this._visible,
        isEditable: true,
      });
    this.radiusLine.setDynamicPosition(true);
  }

  private updateRadiusLine(): void {
    if (!this.radiusLine || !this._editable || !this._radiusPointPosition)
      return;
    this.radiusLine.setPositions([
      this._centerPosition,
      this._radiusPointPosition,
    ]);
  }

  private createMidpointDistanceLabel(): void {
    if (
      !this._editable ||
      !this._radiusLabelVisible ||
      !this._radiusPointPosition
    )
      return;

    const midpoint = calculateMidpoint(
      this._centerPosition,
      this._radiusPointPosition
    );
    const distanceText = formatDistance(this._radius);

    // Create the label
    this.midpointDistanceLabel =
      this._mapProviderServices.baseEntityManager.createBaseLabel({
        position: midpoint,
        text: distanceText,
        style: {
          ...structuredClone(DEFAULT_FB_DISTANCE_LABEL_STYLE),
          heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
        },
      });
  }

  private updateMidpointDistanceLabel(): void {
    if (
      !this._editable ||
      !this._radiusLabelVisible ||
      !this._radiusPointPosition
    ) {
      if (this.midpointDistanceLabel) {
        this.midpointDistanceLabel.setVisibility(false);
      }
      return;
    }

    // Calculate the midpoint position
    const midpoint = calculateMidpoint(
      this._centerPosition,
      this._radiusPointPosition
    );
    const distanceText = formatDistance(this._radius);

    if (this.midpointDistanceLabel) {
      // Update existing label
      this.midpointDistanceLabel.updatePosition(midpoint);
      this.midpointDistanceLabel.setText(distanceText);
      this.midpointDistanceLabel.setVisibility(this._visible);
    } else {
      // Create new label
      this.createMidpointDistanceLabel();
    }
  }

  private setupEditPointEventListeners(): void {
    if (!this.centerEditPoint || !this.radiusEditPoint) return;

    // Listen for position changes on center point (moves the entire circle)
    this.centerEditPoint
      .getEventEmitter()
      .addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
        if (event.data.position) {
          // Get the current position of the radius point relative to the center
          if (this._radiusPointPosition) {
            // Calculate vector from old center to radius point
            const oldDeltaLon =
              this._radiusPointPosition.longitude -
              this._centerPosition.longitude;
            const oldDeltaLat =
              this._radiusPointPosition.latitude -
              this._centerPosition.latitude;

            // Update the center position first
            this.setCenterPosition(event.data.position);

            // Move the radius point to maintain the same relative position
            const newRadiusPos = {
              longitude: this._centerPosition.longitude + oldDeltaLon,
              latitude: this._centerPosition.latitude + oldDeltaLat,
              altitude: this._centerPosition.altitude,
            };

            // Update the radius point
            if (this.radiusEditPoint) {
              this.radiusEditPoint.setPosition(newRadiusPos);
              this._radiusPointPosition = newRadiusPos;
            }

            // Update the radius line
            this.updateRadiusLine();

            // Update the midpoint label
            this.updateMidpointDistanceLabel();
          } else {
            // Just update the center if no radius point is available
            this.setCenterPosition(event.data.position);
          }
        }
      });

    // Listen for position changes on radius point
    this.radiusEditPoint
      .getEventEmitter()
      .addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
        if (event.data.position) {
          // Update the stored radius point position
          this._radiusPointPosition = event.data.position;

          // Calculate new radius based on distance between center and radius point
          const newRadius =
            this._mapProviderServices.mapServices.calculateSurfaceDistance(
              this._centerPosition,
              this._radiusPointPosition
            );

          // Update the radius
          this.setRadius(newRadius);

          // Update the radius line
          this.updateRadiusLine();

          // Update the midpoint distance label
          this.updateMidpointDistanceLabel();
        }
      });
  }

  /**
   * Calculates the initial position for the radius edit point
   * @returns Position on the circle's east side at the current radius
   */
  private calculateInitialRadiusPointPosition(): IPosition {
    // Default to east (0 degrees)
    const angle = 0;
    return this.getPositionOnCircumference(angle);
  }

  /**
   * Gets a position exactly on the circle's circumference at the specified angle
   * @param angle Angle in radians (0 = east, π/2 = north, π = west, 3π/2 = south)
   * @returns Position on the circumference
   */
  private getPositionOnCircumference(angle: number): IPosition {
    // Earth radius in meters
    const EARTH_RADIUS = 6371000;

    // Calculate meters per degree based on latitude
    const metersPerDegreeLatitude = EARTH_RADIUS * (Math.PI / 180);
    const metersPerDegreeLongitude =
      metersPerDegreeLatitude *
      Math.cos((this._centerPosition.latitude * Math.PI) / 180);

    // Convert radius from meters to degrees (separately for lat/lon)
    const radiusInDegreesLat = this._radius / metersPerDegreeLatitude;
    const radiusInDegreesLon = this._radius / metersPerDegreeLongitude;

    // Calculate position using angle
    const position: IPosition = {
      longitude:
        this._centerPosition.longitude + radiusInDegreesLon * Math.cos(angle),
      latitude:
        this._centerPosition.latitude + radiusInDegreesLat * Math.sin(angle),
      altitude: this._centerPosition.altitude,
    };

    return position;
  }
}
