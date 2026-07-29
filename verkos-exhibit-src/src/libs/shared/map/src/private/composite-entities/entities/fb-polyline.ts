import { v4 } from 'uuid';
import { IEventType, IPosition } from '@map/public/contracts';
import { HeightReferenceEnum } from '@map/public/core';
import {
  CENTER_LABEL_OFFSET,
  IBaseLabel,
  IBasePoint,
  IBasePolyline,
  IEvent,
  IFBPolyline,
  IFBPolylineOptions,
  IMapProviderServices,
  LabelStyle,
  MapEventEmitter,
  PolylineStyle,
} from '@map/private/contracts';
import {
  DEFAULT_FB_DISTANCE_LABEL_STYLE,
  DEFAULT_FB_LABEL_STYLE,
  DEFAULT_FB_POLYLINE_STYLE,
  DEFAULT_FB_REAL_POINT_STYLE,
  DEFAULT_FB_VIRTUAL_POINT_STYLE,
} from '../constants';

/**
 * FBPolyline class that implements the IFBPolyline interface
 * A composite entity that combines a polyline with labels and vertex points
 */
export class FBPolyline implements IFBPolyline {
  // Private properties
  private _polyline: IBasePolyline;
  private _centerLabel: IBaseLabel | null = null;
  private _distanceLabels: IBaseLabel[] = [];
  private _vertexPoints: IBasePoint[] = [];
  private _virtualVertexPoints: IBasePoint[] = [];
  private _mapProviderServices: IMapProviderServices;
  private _eventEmitter: MapEventEmitter;
  private _distanceLabelsVisible: boolean;
  private _editable: boolean;
  private _isPolylineClampToGround: boolean;

  // Public properties required by IFBEntity
  public readonly id: string;

  /**
   * Create a new polyline entity on the map
   * @param mapProviderServices Services for map operations and entity creation
   * @param options Configuration options for the polyline
   */
  constructor(
    mapProviderServices: IMapProviderServices,
    options: IFBPolylineOptions
  ) {
    this.id = options.id || `fb-polyline-${v4()}`;
    this._mapProviderServices = mapProviderServices;
    this._eventEmitter = new MapEventEmitter();
    this._distanceLabelsVisible = options.showDistanceLabels || false;
    this._editable = options.editable || false;
    this._isPolylineClampToGround = options.style?.clampToGround || false;

    // Ensure we have valid positions
    const positions = options.positions || [];

    // Create the base polyline using the managers from mapProviderServices
    this._polyline = this.createPolyline(options);

    // Create center label if text is provided
    if (options.labelText) {
      this.createCenterLabel(options.labelText, options.labelStyle);
    }

    // Create vertex points if editable
    if (options.editable) {
      // Ensure we create vertex points after the polyline is fully created with all positions
      // The delay is important to ensure the Cesium entity is fully initialized
      setTimeout(() => {
        if (positions && positions.length > 0) {
          this.createVertexPoints();
          this.createVirtualVertexPoints();
        } else {
          console.warn(
            `No positions provided for FBPolyline ${this.id}, vertex points will not be created`
          );
        }
      }, 100);
    }

    if (options.showDistanceLabels) {
      this.createDistanceLabels();
    }

    this.registerEventHandlers();
  }

  public get positions(): IPosition[] {
    return this._polyline.positions;
  }

  public get style(): PolylineStyle {
    return this._polyline.style;
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
    return this._polyline.visible;
  }

  public get editable(): boolean {
    return this._editable;
  }

  public get hoverable(): boolean {
    return this._polyline.hoverable;
  }

  public get clickable(): boolean {
    return this._polyline.clickable;
  }

  public get distanceLabelsVisible(): boolean {
    return this._distanceLabelsVisible;
  }

  /**
   * Set all polyline positions
   * @param positions New positions array
   */
  setPositions(positions: IPosition[]): void {
    try {
      if (!this._polyline) {
        console.warn('Polyline not found for setting positions');
        return;
      }
      // Setting all positions for polyline

      // Make a copy of the positions array to prevent reference issues
      const positionsCopy = positions.map((pos) => ({ ...pos }));

      // Update the base polyline positions
      this._polyline.setPositions(positionsCopy);

      // Update vertex points if editable
      if (this.editable) {
        this.updateVertexPoints();
        this.createVirtualVertexPoints();
      }

      // Update center label position
      if (this._centerLabel) {
        this.updateCenterLabelPosition();
      }

      // Update distance labels
      if (this.distanceLabelsVisible) {
        this.updateDistanceLabels();
      }
    } catch (error) {
      console.error(`Error setting positions for polyline ${this.id}:`, error);
    }
  }

  /**
   * Add a new position to the end of the polyline
   * @param position The position to add
   */
  addPosition(position: IPosition): void {
    try {
      // Make a copy of the position to prevent reference issues
      const positionCopy = { ...position };

      // Get current positions to determine the new index
      const currentPositions = this._polyline.positions;

      const newIndex = currentPositions.length;

      // Add position to the base polyline
      this._polyline.addPosition(positionCopy);

      // Add a new vertex point if editable
      if (this.editable) {
        // Add a vertex point for the new position
        this.addVertexPoint(positionCopy, newIndex);
        // Recreate virtual vertex points to add new virtual points for new segments
        this.createVirtualVertexPoints();
      }

      // Update center label position
      if (this._centerLabel) {
        this.updateCenterLabelPosition();
      }

      // Update distance labels
      if (this.distanceLabelsVisible) {
        this.updateDistanceLabels();
      }
    } catch (error) {
      console.error(`Error adding position to polyline ${this.id}:`, error);
    }
  }

  /**
   * Remove a position at the specified index
   * @param index The index of the position to remove
   */
  removePosition(index: number): void {
    try {
      // Get current positions
      const positions = this._polyline.positions;

      // Validate index
      if (index < 0 || index >= positions.length) {
        console.warn(
          `Invalid position index for removal: ${index}, positions length: ${positions.length}`
        );
        return;
      }

      // Removing position at index from polyline

      // Remove the position at the specified index
      positions.splice(index, 1);

      // Create a new array to ensure changes are detected
      const newPositions = [...positions];

      // Update polyline with new positions
      this._polyline.setPositions(newPositions);

      // Handle vertex point management if editable
      if (this.editable) {
        // When a position is removed, we need to destroy the corresponding vertex point
        // and update all remaining vertex points since their indices will shift
        if (index < this._vertexPoints.length) {
          // Destroy the vertex point at the removed index
          this._vertexPoints[index].destroy();

          // Create a new array without the removed vertex point
          const updatedVertexPoints = [
            ...this._vertexPoints.slice(0, index),
            ...this._vertexPoints.slice(index + 1),
          ];

          this._vertexPoints = updatedVertexPoints;

          // Rebuild all vertex points to ensure correct indices
          this.updateVertexPoints();
          // Rebuild virtual vertex points with reduced segments
          this.createVirtualVertexPoints();
        }
      }

      // Update center label position
      if (this._centerLabel) {
        this.updateCenterLabelPosition();
      }

      // Update distance labels
      if (this.distanceLabelsVisible) {
        this.updateDistanceLabels();
      }
      // Successfully removed position at index from polyline
    } catch (error) {
      console.error(
        `Error removing position at index ${index} from polyline ${this.id}:`,
        error
      );
    }
  }

  /**
   * Update a position at the specified index
   * @param index The index of the position to update
   * @param position The new position
   */
  updatePosition(index: number, position: IPosition): void {
    try {
      // Get current positions
      const positions = this._polyline.positions;

      // Validate index
      if (index < 0 || index >= positions.length) {
        console.warn(
          `Invalid position index for update: ${index}, positions length: ${positions.length}`
        );
        return;
      }

      // Updating position at index

      // Make a copy of the position to prevent reference issues
      const positionCopy = { ...position };

      // Update the position at the specified index
      positions[index] = positionCopy;

      // Create a new array to ensure changes are detected
      const newPositions = [...positions];

      // Update polyline with new positions
      this._polyline.setPositions(newPositions);

      // Decide whether to update the vertex point based on where this update originated
      const originatedFromVertexDrag =
        this.editable &&
        this._vertexPoints[index] &&
        this._vertexPoints[index].position.latitude === position.latitude &&
        this._vertexPoints[index].position.longitude === position.longitude;

      // Only update the vertex point if this update didn't originate from the vertex itself
      if (
        this.editable &&
        this._vertexPoints[index] &&
        !originatedFromVertexDrag
      ) {
        try {
          // Update the vertex point position
          this._vertexPoints[index].setPosition(positionCopy);
        } catch (error) {
          console.error(
            `Error updating vertex point at index ${index}:`,
            error
          );
        }
      }

      // Update center label position
      if (this._centerLabel) {
        this.updateCenterLabelPosition();
      }

      // Update distance labels
      if (this.distanceLabelsVisible) {
        this.updateDistanceLabels();
      }

      // Emit position changed event for the entire polyline
      this._eventEmitter.emit({
        type: IEventType.POSITION_CHANGED,
        id: this.id,
        data: {
          positionIndex: index,
          position: positionCopy,
          positions: newPositions,
          originatedFromVertexDrag: originatedFromVertexDrag,
        },
      });
    } catch (error) {
      console.error(`Error in updatePosition for index ${index}:`, error);
    }
  }

  /**
   * Set the polyline style
   * @param style Style properties to update
   */
  setStyle(style: Partial<PolylineStyle>): void {
    if (!this._polyline) {
      console.warn('Polyline not found for setting style');
      return;
    }
    // Update the base polyline style
    this._polyline.setStyle(style);

    this._isPolylineClampToGround =
      style.clampToGround ?? this._isPolylineClampToGround;

    this.updateHeightReferenceForAllEntities();
  }

  /**
   * Set the center label text
   * @param text The new label text
   */
  setCenterLabelText(text: string): void {
    if (!text) {
      // Remove center label if text is empty
      if (this._centerLabel) {
        this._centerLabel.destroy();
        this._centerLabel = null;
      }
      return;
    }

    if (this._centerLabel) {
      // Update existing label text
      this._centerLabel.setText(text);
    } else {
      // Create new center label
      this.createCenterLabel(text);
    }
  }

  /**
   * Update the center label style
   * @param style Style properties to update
   */
  updateCenterLabelStyle(style: Partial<LabelStyle>): void {
    if (this._centerLabel) {
      this._centerLabel.updateProperties(style);
    }
  }

  /**
   * Set visibility of the polyline and all its components
   * @param visible Whether the polyline should be visible
   */
  setVisibility(visible: boolean): void {
    // Setting visibility
    // Update base polyline visibility
    this._polyline.setVisibility(visible);

    // Update center label visibility
    if (this._centerLabel) {
      this._centerLabel.setVisibility(visible);
    }

    // Update vertex points visibility
    if (this.editable) {
      this._vertexPoints.forEach((point) => point.setVisibility(visible));
      // Update virtual vertex points visibility
      this._virtualVertexPoints.forEach((point) =>
        point.setVisibility(visible)
      );
    }

    // Update distance labels visibility
    if (this.distanceLabelsVisible) {
      this._distanceLabels.forEach((label) => label.setVisibility(visible));
    }
  }

  setCenterLabelVisibility(visible: boolean): void {
    if (this._centerLabel) {
      this._centerLabel.setVisibility(visible);
    }
  }

  setDynamicPosition(dynamicPosition: boolean): void {
    this._polyline.setDynamicPosition(dynamicPosition);
  }

  /**
   * Set editability of the polyline
   * @param editable Whether the polyline should be editable
   */
  setEditable(editable: boolean): void {
    if (!this._polyline) {
      console.warn('Polyline not found for setting editability');
      return;
    }

    this._polyline.setEditable(editable);
    this._editable = editable;

    if (editable) {
      // Clean up existing vertex points to avoid duplicates
      this._vertexPoints.forEach((point) => {
        point.destroy();
      });
      this._vertexPoints = [];

      // Clean up existing virtual vertex points
      this._virtualVertexPoints.forEach((point) => {
        point.destroy();
      });
      this._virtualVertexPoints = [];

      // Add a small delay to ensure polyline is ready
      setTimeout(() => {
        // Create vertex points
        this.createVertexPoints();
        // Create virtual vertex points for adding new positions
        this.createVirtualVertexPoints();

        // Verify vertices were created
        if (this._vertexPoints.length === 0) {
          console.warn(
            `No vertex points were created for polyline ${this.id} despite enabling edit mode`
          );
        }
      }, 100);
    } else {
      // When edit mode is disabled, remove all vertex points to clean up resources
      this._vertexPoints.forEach((point) => {
        point.destroy();
      });
      this._vertexPoints = [];

      // Remove all virtual vertex points
      this._virtualVertexPoints.forEach((point) => {
        point.destroy();
      });
      this._virtualVertexPoints = [];
    }
  }

  /**
   * Set hoverability of the polyline
   * @param hoverable Whether the polyline should be hoverable
   */
  setHoverable(hoverable: boolean): void {
    if (!this._polyline) {
      console.warn('Polyline not found for setting hoverability');
      return;
    }
    // Update base polyline hoverability
    this._polyline.setHoverable(hoverable);
  }

  /**
   * Set clickability of the polyline
   * @param clickable Whether the polyline should be clickable
   */
  setClickable(clickable: boolean): void {
    // Update base polyline clickability
    if (!this._polyline) {
      console.warn('Polyline not found for setting clickability');
      return;
    }
    this._polyline.setClickable(clickable);
  }

  /**
   * Set visibility of distance labels
   * @param visible Whether distance labels should be visible
   */
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

  /**
   * Pan to the polyline
   */
  panTo(): void {
    if (!this._polyline) {
      console.warn('Polyline not found for panning');
      return;
    }
    this._polyline.panTo();
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
    // Destroy the base polyline
    this._polyline.destroy();

    // Destroy the center label
    if (this._centerLabel) {
      this._centerLabel.destroy();
      this._centerLabel = null;
    }

    // Destroy all vertex points
    this._vertexPoints.forEach((point) => point.destroy());
    this._vertexPoints = [];

    // Destroy all virtual vertex points
    this._virtualVertexPoints.forEach((point) => point.destroy());
    this._virtualVertexPoints = [];

    // Destroy all distance labels
    this._distanceLabels.forEach((label) => label.destroy());
    this._distanceLabels = [];
  }

  // Private methods
  private createPolyline(options: IFBPolylineOptions): IBasePolyline {
    const polyline =
      this._mapProviderServices?.baseEntityManager?.createBasePolyline({
        positions: options.positions || [],
        style: {
          ...structuredClone(DEFAULT_FB_POLYLINE_STYLE),
          ...options.style,
          enableDistanceDisplay: options.enableDistanceDisplay || true,
        },
        isVisible: options.visible !== undefined ? options.visible : true,
        isEditable: options.editable || false,
        isHoverable: options.hoverable || false,
        isClickable: options.clickable || false,
      });

    if (options.editable) {
      polyline.setDynamicPosition(true);
    }

    return polyline;
  }

  /**
   * Create a center label
   * @param text The label text
   * @param style Optional label style
   */
  private createCenterLabel(text: string, style?: LabelStyle): void {
    const centerPosition = this.calculateCenterPosition();

    const labelPosition = {
      ...centerPosition,
      latitude: centerPosition.latitude + CENTER_LABEL_OFFSET,
    };

    // Create label with default or provided style using the managers from mapProviderServices
    this._centerLabel =
      this._mapProviderServices.baseEntityManager.createBaseLabel({
        position: labelPosition,
        text: text,
        style: {
          ...structuredClone(DEFAULT_FB_LABEL_STYLE),
          ...(style ?? {}),
          heightReference: this._isPolylineClampToGround
            ? HeightReferenceEnum.CLAMP_TO_GROUND
            : HeightReferenceEnum.NONE,
        },
      });
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

  /**
   * Calculate the center position of the polyline
   * @returns The center position
   */
  private calculateCenterPosition(): IPosition {
    const positions = this._polyline.positions;
    if (positions.length === 0) {
      return { latitude: 0, longitude: 0, altitude: 0 };
    }

    // For simplicity, use the middle vertex or calculate the centroid
    if (positions.length === 1) {
      return { ...positions[0] };
    }

    const middleIndex = Math.floor(positions.length / 2);
    return { ...positions[middleIndex] };
  }

  /**
   * Create vertex points for each position
   */
  private createVertexPoints(): void {
    // Clear existing vertex points
    this._vertexPoints.forEach((point) => point.destroy());
    this._vertexPoints = [];

    // Create a point for each vertex
    const positions = this._polyline.positions;
    // Creating vertex points for polyline

    if (positions.length === 0) {
      console.warn(
        `No positions available for polyline ${this.id}, can't create vertex points`
      );
      return;
    }

    // Create vertex points with a small delay between each one to prevent rendering issues
    const createPointsSequentially = (index = 0) => {
      if (index >= positions.length) return;

      this.addVertexPoint(positions[index], index);
      // Created vertex point

      // Schedule next vertex point creation
      setTimeout(() => createPointsSequentially(index + 1), 10);
    };

    // Start creating points sequentially
    createPointsSequentially();
  }

  /**
   * Add a vertex point
   * @param position The position of the vertex
   * @param index Optional index of the vertex
   */
  private addVertexPoint(position: IPosition, index?: number): void {
    try {
      // Create a point with larger size and stronger visibility using the managers from mapProviderServices
      const vertexPoint =
        this._mapProviderServices.baseEntityManager.createBasePoint({
          position: { ...position }, // Make a copy to avoid reference issues
          style: {
            ...structuredClone(DEFAULT_FB_REAL_POINT_STYLE),
            heightReference: this._isPolylineClampToGround
              ? HeightReferenceEnum.CLAMP_TO_GROUND
              : HeightReferenceEnum.NONE,
          },
          isEditable: true,
          isHoverable: true,
          isClickable: true,
        });

      // Explicitly set visibility to ensure it's visible
      vertexPoint.setVisibility(true);

      // Explicitly set editability to ensure it's draggable
      vertexPoint.setEditable(true);

      // Register event handlers for the vertex point
      const pointEmitter = vertexPoint.getEventEmitter();

      // Add a variable to track if an update is in progress to prevent recursive updates
      let isUpdating = false;
      // Track drag state to optimize updates
      let isDragging = false;
      // Store the last known position for comparison
      let lastKnownPosition = { ...position };

      // When point drag starts, mark the beginning of a drag operation
      pointEmitter.addListener(IEventType.LEFT_DOWN, () => {
        isDragging = true;
      });

      pointEmitter.addListener(IEventType.MOUSE_MOVE, (event: IEvent) => {
        if (
          isDragging &&
          index !== undefined &&
          event.data &&
          event.data.position &&
          !isUpdating
        ) {
          // Check if the position has actually changed significantly
          const newPos = event.data.position;
          const hasMoved =
            Math.abs(newPos.latitude - lastKnownPosition.latitude) >
              0.0000001 ||
            Math.abs(newPos.longitude - lastKnownPosition.longitude) >
              0.0000001;

          if (hasMoved) {
            isUpdating = true;
            try {
              // Vertex point dragged

              // Update the last known position
              lastKnownPosition = { ...newPos };

              // Always create a fresh copy of positions to avoid stale references
              const currentPositions = this._polyline.positions;
              currentPositions[index] = { ...newPos };

              // Update all positions in the polyline to ensure proper update
              this._polyline.setPositions([...currentPositions]);

              // Emit position changed event
              this._eventEmitter.emit({
                type: IEventType.POSITION_CHANGED,
                id: this.id,
                data: {
                  positionIndex: index,
                  position: newPos,
                  positions: currentPositions,
                },
              });
            } finally {
              isUpdating = false;
            }
          }
        }
      });

      // When drag ends, finalize the position update
      pointEmitter.addListener(IEventType.LEFT_UP, () => {
        if (isDragging && index !== undefined && !isUpdating) {
          isDragging = false;

          isUpdating = true;
          try {
            const finalPosition = vertexPoint.position;

            // Always create a fresh copy of positions to avoid stale references
            const currentPositions = this._polyline.positions;
            currentPositions[index] = { ...finalPosition };

            // Update all positions in the polyline to ensure proper update
            this._polyline.setPositions([...currentPositions]);

            // Emit vertex moved event
            this._eventEmitter.emit({
              type: IEventType.POSITION_CHANGED,
              id: this.id,
              data: {
                vertexIndex: index,
                position: finalPosition,
                positions: currentPositions,
              },
            });
          } finally {
            isUpdating = false;
          }
        }
      });

      // Also listen for direct position changes (non-drag related)
      pointEmitter.addListener(IEventType.POSITION_CHANGED, (event: IEvent) => {
        if (
          !isDragging && // Only process if not already handling via drag events
          index !== undefined &&
          event.data &&
          event.data.position &&
          !isUpdating
        ) {
          isUpdating = true;
          try {
            // Vertex point position changed

            // Update the position in the polyline
            this.updatePosition(index, event.data.position);

            // Update the last known position
            lastKnownPosition = { ...event.data.position };
          } finally {
            isUpdating = false;
          }
        }
      });

      // Store the vertex point
      this._vertexPoints.push(vertexPoint);

      // Added vertex point at position
    } catch (error) {
      console.error(`Error creating vertex point at index ${index}:`, error);
    }
  }

  /**
   * Update all vertex points
   */
  private updateVertexPoints(): void {
    // Clean up existing vertex points to avoid memory leaks
    this._vertexPoints.forEach((point) => {
      point.destroy();
    });
    this._vertexPoints = [];

    // Recreate all vertex points with current positions
    const positions = this._polyline.positions;
    positions.forEach((position, index) => {
      this.addVertexPoint(position, index);
    });
  }

  /**
   * Create virtual vertex points between each pair of consecutive positions
   * These points allow users to add new vertices by dragging them
   */
  private createVirtualVertexPoints(): void {
    // Clear existing virtual vertex points
    this._virtualVertexPoints.forEach((point) => point.destroy());
    this._virtualVertexPoints = [];

    const positions = this._polyline.positions;
    if (positions.length < 2) {
      console.warn('Need at least 2 positions to create virtual vertex points');
      return;
    }

    // For polyline: create virtual points between consecutive positions (not circular)
    // positions.length - 1 virtual points for linear polyline
    for (let i = 0; i < positions.length - 1; i++) {
      const startPos = positions[i];
      const endPos = positions[i + 1];
      const midpoint = this.calculateMidpoint(startPos, endPos);
      this.createVirtualVertexPoint(midpoint, i);
    }
  }

  /**
   * Create a single virtual vertex point
   * @param position The midpoint position for the virtual vertex
   * @param segmentIndex The index of the segment this virtual point represents
   */
  private createVirtualVertexPoint(
    position: IPosition,
    segmentIndex: number
  ): void {
    try {
      const virtualPoint =
        this._mapProviderServices.baseEntityManager.createBasePoint({
          position: { ...position },
          style: {
            ...structuredClone(DEFAULT_FB_VIRTUAL_POINT_STYLE),
            heightReference: this._isPolylineClampToGround
              ? HeightReferenceEnum.CLAMP_TO_GROUND
              : HeightReferenceEnum.NONE,
          },
          isEditable: true,
          isHoverable: true,
          isClickable: true,
        });

      // Explicitly set visibility to ensure it's visible
      virtualPoint.setVisibility(true);
      virtualPoint.setEditable(true);

      const pointEmitter = virtualPoint.getEventEmitter();

      // Use once() to ensure the handler runs only for the first position change
      // This prevents multiple insertions of the same vertex
      pointEmitter.once(IEventType.POSITION_CHANGED, (event: IEvent) => {
        if (event.data && event.data.position) {
          // Insert the new position after the current segment start
          const insertIndex = segmentIndex + 1;
          const currentPositions = this._polyline.positions;
          const newPositions = [...currentPositions];

          // Insert the new position at the correct index
          newPositions.splice(insertIndex, 0, { ...event.data.position });

          // Update the polyline positions
          this._polyline.setPositions(newPositions);

          // Convert virtual to real vertex - rebuild everything
          this.convertVirtualToRealVertex(virtualPoint);

          // Emit position changed event
          this._eventEmitter.emit({
            type: IEventType.POSITION_CHANGED,
            id: this.id,
            data: {
              positions: newPositions,
            },
          });
        }
      });

      this._virtualVertexPoints.push(virtualPoint);
    } catch (error) {
      console.error(
        `Error creating virtual vertex point at segment ${segmentIndex}:`,
        error
      );
    }
  }

  /**
   * Convert a virtual vertex to a real vertex by rebuilding all points
   * @param virtualPoint The virtual point being converted
   */
  private convertVirtualToRealVertex(virtualPoint: IBasePoint): void {
    // Destroy the virtual point that was being dragged
    virtualPoint.destroy();

    // Rebuild all vertex points with the new polyline positions
    this.updateVertexPoints();

    // Rebuild all virtual vertex points with new configuration
    this.createVirtualVertexPoints();

    // Update center label position
    if (this._centerLabel) {
      this.updateCenterLabelPosition();
    }

    // Update distance labels if visible
    if (this.distanceLabelsVisible) {
      this.updateDistanceLabels();
    }
  }

  /**
   * Calculate midpoint between two positions
   * @param pos1 First position
   * @param pos2 Second position
   * @returns Midpoint position
   */
  private calculateMidpoint(pos1: IPosition, pos2: IPosition): IPosition {
    return {
      latitude: (pos1.latitude + pos2.latitude) / 2,
      longitude: (pos1.longitude + pos2.longitude) / 2,
      altitude: ((pos1.altitude ?? 0) + (pos2.altitude ?? 0)) / 2,
    };
  }

  /**
   * Create distance labels for each segment
   */
  private createDistanceLabels(): void {
    // Clear existing distance labels
    this._distanceLabels.forEach((label) => label.destroy());
    this._distanceLabels = [];

    const positions = this._polyline.positions;
    if (positions.length < 2) {
      return;
    }

    // Create a label for each segment
    for (let i = 0; i < positions.length - 1; i++) {
      const startPos = positions[i];
      const endPos = positions[i + 1];

      // Calculate midpoint of segment
      const midpoint = {
        latitude: (startPos.latitude + endPos.latitude) / 2,
        longitude: (startPos.longitude + endPos.longitude) / 2,
        altitude: ((startPos.altitude ?? 0) + (endPos.altitude ?? 0)) / 2,
      };

      // Add offset to distance label to avoid overlapping with the line
      const labelPosition = {
        ...midpoint,
      };

      // Calculate distance
      const distance =
        this._mapProviderServices.mapServices.calculateDistanceInMeters(
          startPos,
          endPos
        );
      const distanceText = `${distance.toFixed(2)} m`;

      // Create label using the managers from mapProviderServices
      const label = this._mapProviderServices.baseEntityManager.createBaseLabel(
        {
          position: labelPosition,
          text: distanceText,
          style: {
            ...structuredClone(DEFAULT_FB_DISTANCE_LABEL_STYLE),
            heightReference: this._isPolylineClampToGround
              ? HeightReferenceEnum.CLAMP_TO_GROUND
              : HeightReferenceEnum.NONE,
          },
        }
      );

      this._distanceLabels.push(label);
    }
  }

  /**
   * Update all distance labels
   */
  private updateDistanceLabels(): void {
    // Recreate all distance labels
    this.createDistanceLabels();
  }

  /**
   * Register event handlers for the polyline
   */
  private registerEventHandlers(): void {
    // Get the polyline event emitter
    const polylineEmitter = this._polyline.getEventEmitter();

    // Forward relevant events
    // Handle polyline drag start
    polylineEmitter.addListener(IEventType.LEFT_DOWN, (event: IEvent) => {
      this._eventEmitter.emit({
        type: IEventType.LEFT_DOWN,
        id: this.id,
        data: event.data,
      });
    });

    // Handle polyline drag end - ensure final positions are synced for all components
    polylineEmitter.addListener(IEventType.LEFT_UP, (event: IEvent) => {
      if (event.data && event.data.positions) {
        const finalPositions = event.data.positions;

        // Ensure vertex points are at final positions after drag ends
        if (this.editable && this._vertexPoints.length > 0) {
          finalPositions.forEach((position: IPosition, index: number) => {
            if (this._vertexPoints[index]) {
              this._vertexPoints[index].setPosition({ ...position });
            }
          });
        }

        // Ensure virtual vertex points are at final midpoint positions after drag ends
        if (
          this.editable &&
          this._virtualVertexPoints.length > 0 &&
          finalPositions.length >= 2
        ) {
          for (let i = 0; i < finalPositions.length - 1; i++) {
            if (this._virtualVertexPoints[i]) {
              const startPos = finalPositions[i];
              const endPos = finalPositions[i + 1];
              const midpoint = this.calculateMidpoint(startPos, endPos);
              this._virtualVertexPoints[i].setPosition(midpoint);
            }
          }
        }

        // Update center label to final position
        if (this._centerLabel) {
          this.updateCenterLabelPosition();
        }

        // Update distance labels to final positions
        if (this.distanceLabelsVisible) {
          this.updateDistanceLabels();
        }
      }

      this._eventEmitter.emit({
        type: IEventType.LEFT_UP,
        id: this.id,
        data: event.data,
      });
    });

    polylineEmitter.addListener(IEventType.CLICK, (event: IEvent) => {
      this._eventEmitter.emit({
        type: IEventType.CLICK,
        id: this.id,
        data: event.data,
      });
    });

    polylineEmitter.addListener(IEventType.MOUSE_HOVER, (event: IEvent) => {
      this._eventEmitter.emit({
        type: IEventType.MOUSE_HOVER,
        id: this.id,
        data: event.data,
      });
    });

    polylineEmitter.addListener(IEventType.MOUSE_MOVE, (event: IEvent) => {
      // When the polyline is being dragged, update all components in real-time
      if (event.data && event.data.positions) {
        const draggedPositions = event.data.positions;

        // Update vertex points if editable
        if (this.editable && this._vertexPoints.length > 0) {
          draggedPositions.forEach((position: IPosition, index: number) => {
            if (this._vertexPoints[index]) {
              this._vertexPoints[index].setPosition({ ...position });
            }
          });
        }

        // Update virtual vertex points if editable
        if (
          this.editable &&
          this._virtualVertexPoints.length > 0 &&
          draggedPositions.length >= 2
        ) {
          // Update virtual points to maintain midpoint positions during drag
          for (let i = 0; i < draggedPositions.length - 1; i++) {
            if (this._virtualVertexPoints[i]) {
              const startPos = draggedPositions[i];
              const endPos = draggedPositions[i + 1];
              const midpoint = this.calculateMidpoint(startPos, endPos);
              this._virtualVertexPoints[i].setPosition(midpoint);
            }
          }
        }

        // Update center label position during drag
        if (this._centerLabel) {
          // Calculate center position from dragged positions
          let basePosition;
          if (draggedPositions.length === 1) {
            basePosition = { ...draggedPositions[0] };
          } else if (draggedPositions.length > 1) {
            const middleIndex = Math.floor(draggedPositions.length / 2);
            basePosition = { ...draggedPositions[middleIndex] };
          }

          // Add offset to avoid overlapping with the line
          if (basePosition) {
            const labelPosition = {
              ...basePosition,
            };
            this._centerLabel.updatePosition(labelPosition);
          }
        }

        // Update distance labels during drag
        if (this.distanceLabelsVisible && draggedPositions.length >= 2) {
          // Clear and recreate distance labels with new positions
          this._distanceLabels.forEach((label) => label.destroy());
          this._distanceLabels = [];

          // Create new labels at updated positions
          for (let i = 0; i < draggedPositions.length - 1; i++) {
            const startPos = draggedPositions[i];
            const endPos = draggedPositions[i + 1];

            // Calculate midpoint of segment
            const midpoint = {
              latitude: (startPos.latitude + endPos.latitude) / 2,
              longitude: (startPos.longitude + endPos.longitude) / 2,
              altitude: ((startPos.altitude ?? 0) + (endPos.altitude ?? 0)) / 2,
            };

            // Add offset to distance label to avoid overlapping with the line
            const labelPosition = {
              ...midpoint,
            };

            // Calculate distance
            const distance =
              this._mapProviderServices.mapServices.calculateDistanceInMeters(
                startPos,
                endPos
              );
            const distanceText = `${distance.toFixed(2)} m`;

            // Create label
            const label =
              this._mapProviderServices.baseEntityManager.createBaseLabel({
                position: labelPosition,
                text: distanceText,
                style: structuredClone(DEFAULT_FB_DISTANCE_LABEL_STYLE),
              });

            this._distanceLabels.push(label);
          }
        }
      }

      this._eventEmitter.emit({
        type: IEventType.MOUSE_MOVE,
        id: this.id,
        data: event.data,
      });
    });

    polylineEmitter.addListener(
      IEventType.POSITION_CHANGED,
      (event: IEvent) => {
        // FBPolyline received POSITION_CHANGED event

        // Get the updated positions from the polyline
        const updatedPositions = this._polyline.positions;

        // Update vertex points, center label, and distance labels
        if (this.editable && this._vertexPoints.length > 0) {
          // Update each vertex point's position to match the new polyline positions
          // This is crucial when the entire polyline is dragged
          updatedPositions.forEach((position, index) => {
            if (this._vertexPoints[index]) {
              // Update the vertex point position directly
              this._vertexPoints[index].setPosition({ ...position });
            }
          });
        }

        // Update virtual vertex points to maintain midpoints
        if (
          this.editable &&
          this._virtualVertexPoints.length > 0 &&
          updatedPositions.length >= 2
        ) {
          for (let i = 0; i < updatedPositions.length - 1; i++) {
            if (this._virtualVertexPoints[i]) {
              const startPos = updatedPositions[i];
              const endPos = updatedPositions[i + 1];
              const midpoint = this.calculateMidpoint(startPos, endPos);
              this._virtualVertexPoints[i].setPosition(midpoint);
            }
          }
        }

        if (this._centerLabel) {
          this.updateCenterLabelPosition();
        }

        if (this.distanceLabelsVisible) {
          this.updateDistanceLabels();
        }

        // Forward the event with the latest positions
        this._eventEmitter.emit({
          type: IEventType.POSITION_CHANGED,
          id: this.id,
          data: {
            ...event.data,
            positions: updatedPositions,
          },
        });
      }
    );
  }

  private updateHeightReferenceForAllEntities(): void {
    const newHeightReference = this._isPolylineClampToGround
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
