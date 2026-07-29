import { v4 } from 'uuid';
import {
  IAnnotationPolygon,
  IAnnotationPolygonOptions,
  IAnnotationPolygonStyle,
  IPosition,
} from '@map/public/contracts';
import { ICompositeManager, IFBPolygon } from '@map/private/contracts';
import {
  DEFAULT_ANNOTATION_LABEL_STYLE,
  DEFAULT_ANNOTATION_POLYGON_STYLE,
} from '../constants';

export class AnnotationPolygon implements IAnnotationPolygon {
  private _id: string;
  private _annotationPolygon: IFBPolygon;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IAnnotationPolygonOptions
  ) {
    this._id = `annotation-polygon-${v4()}`;
    this._annotationPolygon = this.createAnnotationPolygon(options);
  }

  get id(): string {
    return this._id;
  }

  updatePositions(positions: IPosition[]): void {
    this._annotationPolygon.setPositions(positions);
  }

  setVisibility(visible: boolean): void {
    this._annotationPolygon.setVisibility(visible);
  }

  setStyle(style: IAnnotationPolygonStyle): void {
    this._annotationPolygon.setStyle(style);

    if (style?.fillColor) {
      this._annotationPolygon.setCenterLabelStyle({
        backgroundColor: style?.fillColor,
      });
    }
  }

  panTo(): void {
    this._annotationPolygon.panTo();
  }

  remove(): void {
    if (this._annotationPolygon) {
      this._annotationPolygon.remove();
    }
  }

  //private methods
  private createAnnotationPolygon(
    options: IAnnotationPolygonOptions
  ): IFBPolygon {
    const annotationPolygon = this._compositeManager.createFBPolygon({
      positions: options.positions,
      style: {
        ...structuredClone(DEFAULT_ANNOTATION_POLYGON_STYLE),
        ...(options.color
          ? { fillColor: options.color, outlineColor: options.color }
          : {}),
      },
      labelText: options.labelText,
      labelStyle: {
        ...structuredClone(DEFAULT_ANNOTATION_LABEL_STYLE),
        backgroundColor: options?.color,
      },
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    });

    return annotationPolygon;
  }
}
