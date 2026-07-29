import { v4 } from 'uuid';
import { IPosition } from '@map/public/contracts';
import { HeightReferenceEnum } from '@map/public/core';
import {
  HeightReferenceLineOptions,
  IBasePoint,
  IBasePolyline,
  IFbHeightReferenceLine,
  IMapProviderServices,
  MapEventEmitter,
  PointStyle,
  PolylineStyle,
} from '@map/private/contracts';
import {
  DEFAULT_FB_HEIGHT_REFERENCE_LINE_POINT_STYLE,
  DEFAULT_FB_HEIGHT_REFERENCE_LINE_POLYLINE_STYLE,
} from '../constants';

export class FbHeightReferenceLine implements IFbHeightReferenceLine {
  public readonly id: string;
  protected _mapProviderServices: IMapProviderServices;
  private _polyline: IBasePolyline;
  private _groundPoint: IBasePoint;
  protected _eventEmitter: MapEventEmitter;
  protected _options: HeightReferenceLineOptions;
  private _initialVisibility: boolean;

  /**
   * Creates a new height reference line
   *
   * @param mapProviderServices - Provider services for entity creation and map operations
   * @param options - Configuration options for the height reference line
   */
  constructor(
    mapProviderServices: IMapProviderServices,
    options: HeightReferenceLineOptions
  ) {
    this.id = options.id || `fb-height-reference-line-${v4()}`;
    this._mapProviderServices = mapProviderServices;
    this._options = options;
    this._eventEmitter = new MapEventEmitter();
    this._initialVisibility =
      options.visible !== undefined ? options.visible : true;

    // Initial creation with fast synchronous terrain height for immediate display
    const { polyline, point } = this.createEntities(options);
    this._polyline = polyline;
    this._groundPoint = point;

    // Then update after getting the more detailed terrain height asynchronously for accuracy
    this.updateTerrainHeight(options);
    this._polyline.setDynamicPosition(true);

    if (this._initialVisibility) {
      this.addToHeightListnerEntityCollection();
    }
  }

  setVisibility(visible: boolean): void {
    if (visible && this._initialVisibility !== visible) {
      this.addToHeightListnerEntityCollection();
    }
    this.setEntityVisibility(visible);
  }

  /**
   * Updates the position of the height reference line
   * Uses synchronous terrain height for performance during drag operations
   *
   * @param position - The new position for the top of the reference line
   */
  async updatePosition(position: IPosition): Promise<void> {
    // Updating height reference line position
    const topPosition = { ...position, altitude: position.altitude };

    // Use SYNCHRONOUS terrain height for immediate response during drag operations
    // This provides good accuracy with much better performance than async sampling
    const terrainHeight =
      this._mapProviderServices.mapServices.getTerrainHeight(position);

    const bottomPosition = {
      latitude: position.latitude,
      longitude: position.longitude,
      altitude: terrainHeight,
    };

    this._polyline.setPositions([topPosition, bottomPosition]);
    // Updating bottom position of height reference line
    this._groundPoint.setPosition(bottomPosition);
    // Updating bottom position of height reference line
  }

  getEventEmitter(): MapEventEmitter {
    return this._eventEmitter.getListenOnlyInstance();
  }

  remove(): void {
    this.removeFromEntityCollection();

    this._polyline.destroy();
    this._groundPoint.destroy();
  }

  /**
   * Asynchronously updates the terrain height and entity positions for initial high accuracy
   */
  private async updateTerrainHeight(options: HeightReferenceLineOptions) {
    try {
      const terrainHeight =
        await this._mapProviderServices.mapServices.getTerrainHeightMostSampled(
          options.position
        );
      // Update the bottom position with the correct height
      this.updateBottomPosition(terrainHeight);
    } catch (error) {
      console.error(
        'Error updating terrain height for height reference line:',
        error
      );
      // Fallback to synchronous terrain height if async fails
      const fallbackTerrainHeight =
        this._mapProviderServices.mapServices.getTerrainHeight(
          options.position
        );
      this.updateBottomPosition(fallbackTerrainHeight);
    }
  }

  /**
   * Updates the bottom position of the line and point with the accurate terrain height
   */
  private updateBottomPosition(terrainHeight: number) {
    if (!this._options?.position) return;

    const bottomPosition = {
      latitude: this._options.position.latitude,
      longitude: this._options.position.longitude,
      altitude: terrainHeight,
    };

    const topPosition = {
      ...this._options.position,
      altitude: this._options.position.altitude,
    };

    // Update polyline positions to use the new bottom position
    this._polyline.setPositions([bottomPosition, topPosition]);

    // Update point position
    this._groundPoint.setPosition(bottomPosition);
  }

  /**
   * Creates the polyline and ground point entities for the height reference line
   *
   * @param options - Configuration options for the height reference line
   * @returns Object containing the created polyline and point entities
   */
  private createEntities(options: HeightReferenceLineOptions): {
    polyline: IBasePolyline;
    point: IBasePoint;
  } {
    const topPosition = {
      ...options.position,
      altitude: options.position.altitude,
    };
    // Use synchronous terrain height for fast initial creation
    const initialTerrainHeight =
      this._mapProviderServices.mapServices.getTerrainHeight(options.position);

    const bottomPosition = {
      latitude: options.position.latitude,
      longitude: options.position.longitude,
      altitude: initialTerrainHeight,
    };

    const heightReference = options.heightReference || HeightReferenceEnum.NONE;
    const clampToGround =
      heightReference === HeightReferenceEnum.CLAMP_TO_GROUND;

    const polyline =
      this._mapProviderServices.baseEntityManager.createBasePolyline({
        positions: [bottomPosition, topPosition],
        style: {
          ...structuredClone(DEFAULT_FB_HEIGHT_REFERENCE_LINE_POLYLINE_STYLE),
          clampToGround,
          ...(options.color ? { color: options.color } : {}),
          ...(options.width ? { width: options.width } : {}),
        },
        isVisible: options.visible !== undefined ? options.visible : true,
      });

    polyline.setVisibility(
      options.visible !== undefined ? options.visible : true
    );

    const point = this._mapProviderServices.baseEntityManager.createBasePoint({
      position: { ...bottomPosition },
      style: structuredClone(DEFAULT_FB_HEIGHT_REFERENCE_LINE_POINT_STYLE),
    });
    point.setVisibility(options.visible !== undefined ? options.visible : true);
    if (!options.position.altitude) {
      polyline.setVisibility(false);
      point.setVisibility(false);
    }
    return { polyline, point };
  }

  /**
   * Set visibility for both polyline and ground point entities
   * @param visible Whether entities should be visible
   */
  private setEntityVisibility(visible: boolean): void {
    this._polyline.setVisibility(visible);
    this._groundPoint.setVisibility(visible);
  }

  /**
   * Add height reference line entities to the Cesium EntityCollection
   * Only called when height reference should be visible
   * Passes base entities to Factory, which extracts Cesium entities internally
   */
  private addToHeightListnerEntityCollection(): void {
    this._mapProviderServices.baseEntityManager.registerToHeightReferenceListenerEntities(
      this._polyline.id,
      this._groundPoint.id
    );
  }

  /**
   * Remove height reference line entities from the Cesium EntityCollection
   * Called when height reference visibility is disabled or entity is destroyed
   * Passes entity IDs to Factory, which retrieves entities from local map and extracts Cesium entities internally
   */
  private removeFromEntityCollection(): void {
    this._mapProviderServices.baseEntityManager.unregisterFromHeightReferenceListenerEntities(
      this._polyline.id,
      this._groundPoint.id
    );
  }
}
