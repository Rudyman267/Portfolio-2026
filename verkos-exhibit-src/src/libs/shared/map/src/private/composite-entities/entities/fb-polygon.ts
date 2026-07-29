import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public/core';
import {
  CENTER_LABEL_OFFSET,
  IBaseLabel,
  IBasePoint,
  IBasePolygon,
  IEvent,
  IFBPolygon,
  IFBPolygonFromCenterOptions,
  IFBPolygonOptions,
  IMapProviderServices,
  LabelStyle,
  MapEventEmitter,
  PolygonStyle,
} from '@map/private/contracts';
import { generateSquareFromCenter } from '@map/private/utils';
import {
  DEFAULT_FB_DISTANCE_LABEL_STYLE,
  DEFAULT_FB_LABEL_STYLE,
  DEFAULT_FB_POLYGON_STYLE,
  DEFAULT_FB_REAL_POINT_STYLE,
  DEFAULT_FB_VIRTUAL_POINT_STYLE,
} from '../constants';

export class FBPolygon implements IFBPolygon {
  public readonly id: string;

  private _polygon: IBasePolygon;
  private _centerLabel: IBaseLabel | null = null;
  private _vertexPoints: IBasePoint[] = [];
  private _virtualVertexPoints: IBasePoint[] = [];
  private _distanceLabels: IBaseLabel[] = [];
  private _mapProviderServices: IMapProviderServices;
  private _eventEmitter: MapEventEmitter;
  private _distanceLabelsVisible: boolean;
  private _hoverable: boolean;
  private _clickable: boolean;
  private _isPolygonClampToGround: boolean;

  /**
   * Private constructor - use managers methods instead
   * @param {IMapProviderServices} mapProviderServices - Provider of map services including entity managers
   * @param {IPosition[]} positions - Array of positions for the polygon
   * @param {Omit<IFBPolygonOptions, 'positions'>} options - Configuration options for the polygon
   */
  private constructor(
    mapProviderServices: IMapProviderServices,
    positions: IPosition[],
    options: Omit<IFBPolygonOptions, 'positions'>
  ) {
    this.id = options.id || `fb-polygon-${v4()}`;
    this._mapProviderServices = mapProviderServices;
    this._eventEmitter = new MapEventEmitter();
    this._distanceLabelsVisible = options.showDistanceLabels ?? false;
    this._hoverable = options.hoverable ?? false;
    this._clickable = options.clickable ?? false;

    const polygonHeightReference =
      options.style?.heightReference ?? HeightReferenceEnum.CLAMP_TO_GROUND;

    this._isPolygonClampToGround =
      polygonHeightReference === HeightReferenceEnum.CLAMP_TO_GROUND;

    this._polygon = this.createPolygon(positions, options);

    if (options.labelText) {
      this.createCenterLabel(options.labelText, options.labelStyle);
    }

    if (options.editable) {
      this.createVertexPoints();
      this.createVirtualVertexPoints();
    }

    if (options.showDistanceLabels) {
      this.createDistanceLabels();
    }

    this.registerEventHandlers();
  }

  /**
   * Creates a FBPolygon from an array of positions
   * @param {IMapProviderServices} mapProviderServices - Provider of map services
   * @param {IFBPolygonOptions} options - Options including positions array
   * @returns {FBPolygon} The created polygon instance
   */
  public static fromPositions(
    mapProviderServices: IMapProviderServices,
    options: IFBPolygonOptions
  ): FBPolygon {
    const { positions, ...restOptions } = options;
    return new FBPolygon(mapProviderServices, positions, restOptions);
  }

  /**
   * Creates a square FBPolygon from a center point and radius
   * @param {IMapProviderServices} mapProviderServices - Provider of map services
   * @param {IFBPolygonFromCenterOptions} options - Options including center position and radius
   * @returns {FBPolygon} The created polygon instance
   */
  public static fromCenter(
    mapProviderServices: IMapProviderServices,
    options: IFBPolygonFromCenterOptions
  ): FBPolygon {
    const { position, radius, ...restOptions } = options;
    const positions = FBPolygon.generateSquareFromCenter(position, radius);
    return new FBPolygon(mapProviderServices, positions, restOptions);
  }

  /**
   * Generates square coordinates from a center point and radius
   * @param {IPosition} center - Center position
   * @param {number} radius - Distance from center to vertices in meters
   * @returns {IPosition[]} Array of 4 positions forming a square
   */
  private static generateSquareFromCenter(
    center: IPosition,
    radius: number
  ): IPosition[] {
    return generateSquareFromCenter(center, radius);
  }

  // Interface property getters
  public get positions(): IPosition[] {
    return this._polygon.positions;
  }

  public get style(): PolygonStyle {
    return this._polygon.style;
  }

  public get labelText(): string {
    return this._centerLabel ? this._centerLabel.text : '';
  }

  public get labelStyle(): LabelStyle {
    return this._centerLabel
      ? this._centerLabel.style
      : structuredClone(DEFAULT_FB_LABEL_STYLE);
  }

  public get visible(): boolean {
    return this._polygon.visible;
  }

  public get editable(): boolean {
    return this._polygon.editable;
  }

  public get hoverable(): boolean {
    return this._hoverable;
  }

  public get clickable(): boolean {
    return this._clickable;
  }

  public get distanceLabelsVisible(): boolean {
    return this._distanceLabelsVisible;
  }

  setPositions(positions: IPosition[]): void {
    this._polygon.setPositions(positions);

    if (this.editable) {
      this.updateVertexPoints();
      this.updateVirtualVertexPoints();

      if (this.distanceLabelsVisible) {
        this.updateDistanceLabels();
      }
    }

    if (this._centerLabel) {
      this.updateCenterLabelPosition();
    }

    this._eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this.id,
      data: { positions },
    });
  }

  setPosition(index: number, position: IPosition): void {
    const positions = [...this._polygon.positions];

    if (index < 0 || index >= positions.length) {
      console.warn('Invalid position index for update');
      return;
    }

    positions[index] = { ...position };
    this.updateDependentAspects(positions, index);
  }

  // ... remaining position modification methods
  appendPosition(position: IPosition): void {
    const positions = [...this._polygon.positions];
    positions.push(position);
    this.setPositions(positions);
  }

  removePosition(index: number): void {
    const positions = [...this._polygon.positions];

    if (index < 0 || index >= positions.length) {
      console.warn('Invalid position index for removal');
      return;
    }

    if (positions.length <= 3) {
      console.warn(
        'Cannot remove vertex: polygon must have at least 3 vertices'
      );
      return;
    }

    positions.splice(index, 1);
    this.setPositions(positions);
  }

  insertPosition(index: number, position: IPosition): void {
    const positions = [...this._polygon.positions];

    if (index < 0 || index > positions.length) {
      console.warn('Invalid position index for insertion');
      return;
    }

    positions.splice(index, 0, position);
    this.setPositions(positions);
  }

  // ... style and property setters
  setStyle(style: Partial<PolygonStyle>): void {
    this._polygon.setStyle(style);

    if (style?.heightReference) {
      this._isPolygonClampToGround =
        style?.heightReference === HeightReferenceEnum.CLAMP_TO_GROUND;
      this.updateHeightReferenceForAllEntities();
    }
  }

  setCenterLabelText(text: string): void {
    if (!text) {
      if (this._centerLabel) {
        this._centerLabel.destroy();
        this._centerLabel = null;
      }
      return;
    }

    if (this._centerLabel) {
      this._centerLabel.setText(text);
    } else {
      this.createCenterLabel(text);
    }
  }

  setCenterLabelStyle(style: Partial<LabelStyle>): void {
    if (this._centerLabel) {
      this._centerLabel.updateProperties(style);
    }
  }

  setVisibility(visible: boolean): void {
    this._polygon.setVisibility(visible);

    if (this._centerLabel) {
      this._centerLabel.setVisibility(visible);
    }

    if (this.editable) {
      this._vertexPoints.forEach((point) => point.setVisibility(visible));
      this._virtualVertexPoints.forEach((point) =>
        point.setVisibility(visible)
      );
    }

    if (this.distanceLabelsVisible) {
      this._distanceLabels.forEach((label) => label.setVisibility(visible));
    }
  }

  setEditable(editable: boolean): void {
    this._polygon.setEditable(editable);

    if (editable) {
      if (this._vertexPoints.length === 0) {
        this.createVertexPoints();
      } else {
        this._vertexPoints.forEach((point) => point.setVisibility(true));
      }

      if (this._virtualVertexPoints.length === 0) {
        this.createVirtualVertexPoints();
      } else {
        this._virtualVertexPoints.forEach((point) => point.setVisibility(true));
      }
    } else {
      this._vertexPoints.forEach((point) => point.setVisibility(false));
      this._virtualVertexPoints.forEach((point) => point.setVisibility(false));
      this._distanceLabels.forEach((label) => label.setVisibility(false));
      this._distanceLabelsVisible = false;
    }
  }

  setHoverable(hoverable: boolean): void {
    this._hoverable = hoverable;
    this._polygon.setHoverable(hoverable);
  }

  setClickable(clickable: boolean): void {
    this._clickable = clickable;
    this._polygon.setClickable(clickable);
  }

  setDistanceLabelsVisibility(visible: boolean): void {
    this._distanceLabelsVisible = visible;

    if (visible) {
      if (this._distanceLabels.length === 0) {
        this.createDistanceLabels();
      } else {
        this._distanceLabels.forEach((label) => label.setVisibility(true));
      }
    } else {
      this._distanceLabels.forEach((label) => label.setVisibility(false));
    }
  }

  panTo(): void {
    this._polygon.panTo();
  }

  getEventEmitter(): MapEventEmitter {
    return this._eventEmitter.getListenOnlyInstance();
  }

  remove(): void {
    this._polygon.destroy();

    if (this._centerLabel) {
      this._centerLabel.destroy();
      this._centerLabel = null;
    }

    this._vertexPoints.forEach((point) => point.destroy());
    this._vertexPoints = [];

    this._virtualVertexPoints.forEach((point) => point.destroy());
    this._virtualVertexPoints = [];

    this._distanceLabels.forEach((label) => label.destroy());
    this._distanceLabels = [];

    this._eventEmitter.removeAllListeners();
  }

  // Private methods
  private createPolygon(
    positions: IPosition[],
    options: Omit<IFBPolygonOptions, 'positions'>
  ): IBasePolygon {
    const polygon =
      this._mapProviderServices.baseEntityManager.createBasePolygon({
        position: positions,
        style: {
          ...structuredClone(DEFAULT_FB_POLYGON_STYLE),
          ...options.style,
        },
        isEditable: options.editable || false,
      });

    if (options.clickable) {
      polygon.setClickable(true);
    }

    if (options.hoverable) {
      polygon.setHoverable(true);
    }

    if (options.editable) {
      polygon.setEditable(true);
    }

    if (options.visible !== undefined) {
      polygon.setVisibility(options.visible);
    }

    return polygon;
  }

  private createCenterLabel(text: string, style?: LabelStyle): void {
    const centerPosition = this.calculateCenterPosition();
    const labelPosition = {
      ...centerPosition,
      latitude: centerPosition.latitude + CENTER_LABEL_OFFSET,
    };

    this._centerLabel =
      this._mapProviderServices.baseEntityManager.createBaseLabel({
        position: labelPosition,
        text: text,
        style: {
          ...structuredClone(DEFAULT_FB_LABEL_STYLE),
          ...(style ?? {}),
          heightReference: this._isPolygonClampToGround
            ? HeightReferenceEnum.CLAMP_TO_GROUND
            : HeightReferenceEnum.NONE,
        },
      });
  }

  // Updates only components affected by a single vertex change
  private updateDependentAspects(
    positions: IPosition[],
    changedVertexIndex: number
  ): void {
    this._polygon.setPositions(positions);

    if (this.editable) {
      if (changedVertexIndex < this._vertexPoints.length) {
        this._vertexPoints[changedVertexIndex].setPosition(
          positions[changedVertexIndex]
        );
      }

      // Update virtual points before and after the changed vertex
      const prevIndex =
        (changedVertexIndex - 1 + positions.length) % positions.length;
      this.updateSingleVirtualVertex(prevIndex, positions);
      this.updateSingleVirtualVertex(changedVertexIndex, positions);

      if (this.distanceLabelsVisible) {
        this.updateSingleDistanceLabel(prevIndex, positions);
        this.updateSingleDistanceLabel(changedVertexIndex, positions);
      }
    }

    if (this._centerLabel) {
      this.updateCenterLabelPosition();
    }

    this._eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this.id,
      data: { positions },
    });
  }

  private updateSingleVirtualVertex(
    segmentIndex: number,
    positions: IPosition[]
  ): void {
    if (
      segmentIndex < 0 ||
      segmentIndex >= positions.length ||
      segmentIndex >= this._virtualVertexPoints.length
    ) {
      return;
    }

    const startPos = positions[segmentIndex];
    const endPos = positions[(segmentIndex + 1) % positions.length];
    const midpoint = this.calculateMidpoint(startPos, endPos);

    this._virtualVertexPoints[segmentIndex].setPosition(midpoint);
  }

  private updateSingleDistanceLabel(
    segmentIndex: number,
    positions: IPosition[]
  ): void {
    if (
      segmentIndex < 0 ||
      segmentIndex >= positions.length ||
      segmentIndex >= this._distanceLabels.length
    ) {
      return;
    }

    const startPos = positions[segmentIndex];
    const endPos = positions[(segmentIndex + 1) % positions.length];

    const midpoint = this.calculateMidpoint(startPos, endPos);
    const distance = this.calculateDistance(startPos, endPos);
    const distanceText = `${distance.toFixed(2)} m`;

    // Add offset to distance label to avoid overlapping with edge
    const labelPosition = {
      ...midpoint,
    };

    this._distanceLabels[segmentIndex].updatePosition(labelPosition);
    this._distanceLabels[segmentIndex].setText(distanceText);
  }

  private updateCenterLabelPosition(): void {
    if (this._centerLabel) {
      const centerPosition = this.calculateCenterPosition();
      const labelPosition = {
        ...centerPosition,
        latitude: centerPosition.latitude + CENTER_LABEL_OFFSET,
      };

      this._centerLabel.updatePosition(labelPosition);
    }
  }

  // Calculate centroid of polygon vertices
  private calculateCenterPosition(): IPosition {
    const positions = this._polygon.positions;
    if (positions.length === 0) {
      return { latitude: 0, longitude: 0, altitude: 0 };
    }

    let sumLat = 0;
    let sumLon = 0;
    let sumAlt = 0;

    positions.forEach((pos) => {
      sumLat += pos.latitude;
      sumLon += pos.longitude;
      sumAlt += pos.altitude || 0;
    });

    return {
      latitude: sumLat / positions.length,
      longitude: sumLon / positions.length,
      altitude: sumAlt / positions.length,
    };
  }

  private createVertexPoints(): void {
    this._vertexPoints.forEach((point) => point.destroy());
    this._vertexPoints = [];

    const positions = this._polygon.positions;
    positions.forEach((position, index) => {
      this.createVertexPoint(position, index);
    });
  }

  private createVertexPoint(position: IPosition, index: number): void {
    const vertexPoint =
      this._mapProviderServices.baseEntityManager.createBasePoint({
        position: position,
        style: {
          ...structuredClone(DEFAULT_FB_REAL_POINT_STYLE),
          heightReference: this._isPolygonClampToGround
            ? HeightReferenceEnum.CLAMP_TO_GROUND
            : HeightReferenceEnum.NONE,
          outlineColor: this._polygon.style?.outlineColor ?? MapColor.WHITE,
        },
        isEditable: true,
        isHoverable: true,
        isClickable: true,
      });

    const pointEmitter = vertexPoint.getEventEmitter();

    pointEmitter.addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
      if (event.data && event.data.position) {
        const positions = [...this._polygon.positions];
        positions[index] = event.data.position;
        this.updateDependentAspects(positions, index);
      }
    });

    this._vertexPoints.push(vertexPoint);
  }

  private createVirtualVertexPoints(): void {
    this._virtualVertexPoints.forEach((point) => point.destroy());
    this._virtualVertexPoints = [];

    const positions = this._polygon.positions;
    if (positions.length < 2) return;

    for (let i = 0; i < positions.length; i++) {
      const startPos = positions[i];
      const endPos = positions[(i + 1) % positions.length];
      const midpoint = this.calculateMidpoint(startPos, endPos);
      this.createVirtualVertexPoint(midpoint, i);
    }
  }

  private createVirtualVertexPoint(
    position: IPosition,
    segmentIndex: number
  ): void {
    const virtualPoint =
      this._mapProviderServices.baseEntityManager.createBasePoint({
        position: position,
        style: {
          ...structuredClone(DEFAULT_FB_VIRTUAL_POINT_STYLE),
          heightReference: this._isPolygonClampToGround
            ? HeightReferenceEnum.CLAMP_TO_GROUND
            : HeightReferenceEnum.NONE,
          outlineColor: this._polygon.style?.outlineColor ?? MapColor.WHITE,
        },
        isEditable: true,
        isHoverable: true,
        isClickable: true,
      });

    const pointEmitter = virtualPoint.getEventEmitter();

    // Use once() to ensure the handler runs only for the first position change
    pointEmitter.once(IEventType.POSITION_CHANGED, (event: IEvent) => {
      if (event.data && event.data.position) {
        const insertIndex = (segmentIndex + 1) % this._polygon.positions.length;
        const positions = [...this._polygon.positions];
        positions.splice(insertIndex, 0, event.data.position);
        this._polygon.setPositions(positions);

        this.convertVirtualToRealVertex(virtualPoint);

        this._eventEmitter.emit({
          type: IEventType.POSITION_CHANGED,
          id: this.id,
          data: { positions },
        });
      }
    });

    this._virtualVertexPoints.push(virtualPoint);
  }

  // Transforms a virtual vertex into a real vertex after insertion
  private convertVirtualToRealVertex(virtualPoint: IBasePoint): void {
    virtualPoint.destroy();

    this.createVertexPoints();

    // Rebuild all virtual vertices
    this.createVirtualVertexPoints();

    if (this.distanceLabelsVisible) {
      this.createDistanceLabels();
    }
  }

  private updateVertexPoints(): void {
    this.createVertexPoints();
  }

  private updateVirtualVertexPoints(): void {
    this.createVirtualVertexPoints();
  }

  private createDistanceLabels(): void {
    this._distanceLabels.forEach((label) => label.destroy());
    this._distanceLabels = [];

    const positions = this._polygon.positions;
    if (positions.length < 2) {
      return;
    }

    for (let i = 0; i < positions.length; i++) {
      const startPos = positions[i];
      const endPos = positions[(i + 1) % positions.length];
      const midpoint = this.calculateMidpoint(startPos, endPos);
      const distance = this.calculateDistance(startPos, endPos);
      const distanceText = `${distance.toFixed(2)} m`;

      // Add offset to distance label to avoid overlapping with edge
      const labelPosition = {
        ...midpoint,
      };

      const label = this._mapProviderServices.baseEntityManager.createBaseLabel(
        {
          position: labelPosition,
          text: distanceText,
          style: {
            ...structuredClone(DEFAULT_FB_DISTANCE_LABEL_STYLE),
            heightReference: this._isPolygonClampToGround
              ? HeightReferenceEnum.CLAMP_TO_GROUND
              : HeightReferenceEnum.NONE,
          },
        }
      );

      this._distanceLabels.push(label);
    }
  }

  private updateDistanceLabels(): void {
    this.createDistanceLabels();
  }

  private calculateMidpoint(pos1: IPosition, pos2: IPosition): IPosition {
    return {
      latitude: (pos1.latitude + pos2.latitude) / 2,
      longitude: (pos1.longitude + pos2.longitude) / 2,
      altitude: ((pos1.altitude ?? 0) + (pos2.altitude ?? 0)) / 2,
    };
  }

  // Haversine formula for distance calculation
  private calculateDistance(pos1: IPosition, pos2: IPosition): number {
    const earthRadius = 6371000; // meters
    const dLat = this.toRadians(pos2.latitude - pos1.latitude);
    const dLon = this.toRadians(pos2.longitude - pos1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pos1.latitude)) *
        Math.cos(this.toRadians(pos2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private registerEventHandlers(): void {
    const polygonEmitter = this._polygon.getEventEmitter();

    // Forward click and hover events
    polygonEmitter.addListener(IEventType.CLICK, (event: IEvent) => {
      this._eventEmitter.emit({
        type: IEventType.CLICK,
        id: this.id,
        data: event.data,
      });
    });

    polygonEmitter.addListener(IEventType.MOUSE_HOVER, (event: IEvent) => {
      this._eventEmitter.emit({
        type: IEventType.MOUSE_HOVER,
        id: this.id,
        data: event.data,
      });
    });

    // Handle position changes from base polygon (e.g., dragging)
    polygonEmitter.addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
      const positions = this._polygon.positions;

      if (this.editable) {
        // Update all vertices in-place (more efficient than rebuilding)
        positions.forEach((position, index) => {
          if (index < this._vertexPoints.length) {
            this._vertexPoints[index].setPosition(position);
          }
        });

        // Update all virtual vertices in-place
        for (let i = 0; i < this._virtualVertexPoints.length; i++) {
          const startPos = positions[i];
          const endPos = positions[(i + 1) % positions.length];
          const midpoint = this.calculateMidpoint(startPos, endPos);
          this._virtualVertexPoints[i].setPosition(midpoint);
        }
      }

      if (this._centerLabel) {
        this.updateCenterLabelPosition();
      }

      if (this.distanceLabelsVisible) {
        for (let i = 0; i < this._distanceLabels.length; i++) {
          const startPos = positions[i];
          const endPos = positions[(i + 1) % positions.length];
          const midpoint = this.calculateMidpoint(startPos, endPos);
          const distance = this.calculateDistance(startPos, endPos);
          const distanceText = `${distance.toFixed(2)} m`;

          // Add offset to distance label to avoid overlapping with edge
          const labelPosition = {
            ...midpoint,
          };

          this._distanceLabels[i].updatePosition(labelPosition);
          this._distanceLabels[i].setText(distanceText);
        }
      }

      this._eventEmitter.emit({
        type: IEventType.POSITION_CHANGED,
        id: this.id,
        data: {
          positions: positions,
          ...event.data,
        },
      });
    });
  }

  private updateHeightReferenceForAllEntities(): void {
    const newHeightReference = this._isPolygonClampToGround
      ? HeightReferenceEnum.CLAMP_TO_GROUND
      : HeightReferenceEnum.NONE;

    this._centerLabel?.updateProperties({
      heightReference: newHeightReference,
    });

    if (this._distanceLabels.length > 0) {
      this._distanceLabels.forEach((label) => {
        label.updateProperties({
          heightReference: newHeightReference,
        });
      });
    }

    if (this._vertexPoints.length > 0) {
      this._vertexPoints.forEach((point) => {
        point.setStyle({
          heightReference: newHeightReference,
        });
      });
    }

    if (this._virtualVertexPoints.length > 0) {
      this._virtualVertexPoints.forEach((point) => {
        point.setStyle({
          heightReference: newHeightReference,
        });
      });
    }
  }
}
