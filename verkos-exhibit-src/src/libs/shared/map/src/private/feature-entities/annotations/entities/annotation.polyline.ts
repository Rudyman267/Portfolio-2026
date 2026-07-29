import { v4 } from 'uuid';
import {
  IAnnotationPolyline,
  IAnnotationPolylineOptions,
  IAnnotationPolylineStyle,
  IPosition,
} from '@map/public/contracts';
import { ICompositeManager, IFBPolyline } from '@map/private/contracts';
import {
  DEFAULT_ANNOTATION_LABEL_STYLE,
  DEFAULT_ANNOTATION_POLYLINE_STYLE,
} from '../constants';
import { HeightReferenceEnum } from '@map/public';

export class AnnotationPolyline implements IAnnotationPolyline {
  private _id: string;
  private _annotationPolyline: IFBPolyline;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IAnnotationPolylineOptions
  ) {
    this._id = `annotation-polyline-${v4()}`;
    this._annotationPolyline = this.createAnnotationPolyline(options);
  }

  get id(): string {
    return this._id;
  }

  updatePositions(positions: IPosition[]): void {
    this._annotationPolyline.setPositions(positions);
  }

  setVisibility(visible: boolean): void {
    this._annotationPolyline.setVisibility(visible);
  }

  setStyle(style: Partial<IAnnotationPolylineStyle>): void {
    this._annotationPolyline.setStyle(style);
    if (style?.color) {
      this._annotationPolyline.updateCenterLabelStyle({
        backgroundColor: style?.color,
      });
    }
  }

  panTo(): void {
    this._annotationPolyline.panTo();
  }

  remove(): void {
    if (this._annotationPolyline) {
      this._annotationPolyline.remove();
    }
  }

  // Private methods
  private createAnnotationPolyline(
    options: IAnnotationPolylineOptions
  ): IFBPolyline {
    const annotationPolyline = this._compositeManager.createFBPolyline({
      positions: options.positions,
      labelText: options.labelText,
      labelStyle: {
        ...structuredClone(DEFAULT_ANNOTATION_LABEL_STYLE),
        backgroundColor: options?.color,
        heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
      },
      style: {
        ...structuredClone(DEFAULT_ANNOTATION_POLYLINE_STYLE),
        ...(options.color ? { color: options.color } : {}),
      },
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    });

    annotationPolyline.setDynamicPosition(false);

    return annotationPolyline;
  }
}
