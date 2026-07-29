import {
  IAnnotationMarker,
  IAnnotationMarkerOptions,
  IAnnotationPolygon,
  IAnnotationPolygonOptions,
  IAnnotationPolyline,
  IAnnotationPolylineOptions,
} from '../entities';

export interface IAnnotationManager {
  /**
   *
   * @param id - The unique identifier for the annotation marker.
   * @returns The annotation marker if found, otherwise undefined.
   */
  getAnnotationMarker(id: string): IAnnotationMarker | undefined;

  /**
   * Retrieves an annotation polygon by its unique identifier.
   * @param id - The unique identifier for the annotation polygon.
   * @returns The annotation polygon if found, otherwise undefined.
   */
  getAnnotationPolygon(id: string): IAnnotationPolygon | undefined;

  /**
   * Retrieves an annotation polyline by its unique identifier.
   * @param id - The unique identifier for the annotation polyline.
   * @returns The annotation polyline if found, otherwise undefined.
   */
  getAnnotationPolyline(id: string): IAnnotationPolyline | undefined;

  /**
   * Creates a new annotation marker with the specified options.
   * @param options - The options for creating the annotation marker.
   * @returns The created annotation marker.
   */
  createAnnotationMarker(options: IAnnotationMarkerOptions): IAnnotationMarker;

  /**
   * Creates a new annotation polygon with the specified options.
   * @param options - The options for creating the annotation polygon.
   * @returns The created annotation polygon.
   */
  createAnnotationPolygon(
    options: IAnnotationPolygonOptions
  ): IAnnotationPolygon;

  /**
   * Creates a new annotation polyline with the specified options.
   * @param options - The options for creating the annotation polyline.
   * @returns The created annotation polyline.
   */
  createAnnotationPolyline(
    options: IAnnotationPolylineOptions
  ): IAnnotationPolyline;

  /**
   * Removes annotations by its unique identifiers.
   * @param annotationIds - An array of unique identifiers for the annotations to be removed.
   */
  removeAnnotations(annotationIds: string[]): void;

  /**
   * Removes all annotations managed by this manager.
   */
  removeAllAnnotations(): void;

  /**
   * Hides all annotations managed by this manager.
   */
  hideAllAnnotations(): void;

  /**
   * Shows all annotations managed by this manager.
   */
  showAllAnnotations(): void;
}
