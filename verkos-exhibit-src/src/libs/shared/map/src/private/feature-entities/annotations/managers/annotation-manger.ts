import { ICompositeManager } from '@map/private/contracts';
import {
  IAnnotationManager,
  IAnnotationMarker,
  IAnnotationMarkerOptions,
  IAnnotationPolygon,
  IAnnotationPolygonOptions,
  IAnnotationPolyline,
  IAnnotationPolylineOptions,
} from '@map/public/contracts';
import {
  AnnotationMarker,
  AnnotationPolygon,
  AnnotationPolyline,
} from '../entities';

export class AnnotationManager implements IAnnotationManager {
  private _annotationsMarker: Map<string, IAnnotationMarker> = new Map<
    string,
    IAnnotationMarker
  >();

  private _annotationsPolygon: Map<string, IAnnotationPolygon> = new Map<
    string,
    IAnnotationPolygon
  >();

  private _annotationsPolyline: Map<string, IAnnotationPolyline> = new Map<
    string,
    IAnnotationPolyline
  >();

  constructor(private _compositeManager: ICompositeManager) {}

  createAnnotationMarker(options: IAnnotationMarkerOptions): IAnnotationMarker {
    const entity = new AnnotationMarker(this._compositeManager, options);
    if (!entity) {
      console.error('Failed to create AnnotionMarker entity');
      throw new Error('Failed to create AnnotionMarker entity');
    }
    this._annotationsMarker.set(entity.id, entity);
    return entity;
  }

  createAnnotationPolygon(
    options: IAnnotationPolygonOptions
  ): IAnnotationPolygon {
    const entity = new AnnotationPolygon(this._compositeManager, options);
    if (!entity) {
      console.error('Failed to create AnnotationPolygon entity');
      throw new Error('Failed to create AnnotationPolygon entity');
    }
    this._annotationsPolygon.set(entity.id, entity);
    return entity;
  }

  createAnnotationPolyline(
    options: IAnnotationPolylineOptions
  ): IAnnotationPolyline {
    const entity = new AnnotationPolyline(this._compositeManager, options);
    if (!entity) {
      console.error('Failed to create AnnotationPolyline entity');
      throw new Error('Failed to create AnnotationPolyline entity');
    }
    this._annotationsPolyline.set(entity.id, entity);
    return entity;
  }

  removeAnnotations(annotationIds: string[]): void {
    annotationIds.forEach((id) => {
      if (this._annotationsMarker.has(id)) {
        this._annotationsMarker.get(id)?.remove();
        this._annotationsMarker.delete(id);
      } else if (this._annotationsPolygon.has(id)) {
        this._annotationsPolygon.get(id)?.remove();
        this._annotationsPolygon.delete(id);
      } else if (this._annotationsPolyline.has(id)) {
        this._annotationsPolyline.get(id)?.remove();
        this._annotationsPolyline.delete(id);
      }
    });
  }

  removeAllAnnotations(): void {
    this._annotationsMarker.forEach((annotation) => annotation.remove());
    this._annotationsMarker.clear();
    this._annotationsPolygon.forEach((annotation) => annotation.remove());
    this._annotationsPolygon.clear();
    this._annotationsPolyline.forEach((annotation) => annotation.remove());
    this._annotationsPolyline.clear();
  }

  hideAllAnnotations(): void {
    this._annotationsMarker.forEach((annotation) =>
      annotation.setVisibility(false)
    );
    this._annotationsPolygon.forEach((annotation) =>
      annotation.setVisibility(false)
    );
    this._annotationsPolyline.forEach((annotation) =>
      annotation.setVisibility(false)
    );
  }

  showAllAnnotations(): void {
    this._annotationsMarker.forEach((annotation) =>
      annotation.setVisibility(true)
    );
    this._annotationsPolygon.forEach((annotation) =>
      annotation.setVisibility(true)
    );
    this._annotationsPolyline.forEach((annotation) =>
      annotation.setVisibility(true)
    );
  }

  getAnnotationMarker(id: string): IAnnotationMarker | undefined {
    return this._annotationsMarker.get(id);
  }

  getAnnotationPolygon(id: string): IAnnotationPolygon | undefined {
    return this._annotationsPolygon.get(id);
  }

  getAnnotationPolyline(id: string): IAnnotationPolyline | undefined {
    return this._annotationsPolyline.get(id);
  }
}
