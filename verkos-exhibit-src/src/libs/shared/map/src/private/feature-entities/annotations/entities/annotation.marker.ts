import { v4 } from 'uuid';
import {
  IAnnotationMarker,
  IAnnotationMarkerOptions,
  IAnnotationMarkerStyle,
  IPosition,
} from '@map/public/contracts';
import { HeightReferenceEnum } from '@map/public/core';
import { ICompositeManager, IFBMarker } from '@map/private/contracts';
import {
  DEFAULT_ICONS,
  getCustomIconSVG,
  getSVGIcon,
  ICON_TYPE,
  svgToDataURI,
} from '../utils';
import {
  DEFAULT_ANNOTATION_LABEL_STYLE,
  DEFAULT_ANNOTATION_MARKER_STYLE,
} from '../constants';

export class AnnotationMarker implements IAnnotationMarker {
  private _id: string;
  private _annotationMarker: IFBMarker;
  private _compositeManager: ICompositeManager;
  private _isMarkerPositionAboveGround = true;

  constructor(
    _compositeManager: ICompositeManager,
    options: IAnnotationMarkerOptions
  ) {
    this._id = `annotation-marker-${v4()}`;
    this._compositeManager = _compositeManager;
    this._isMarkerPositionAboveGround = this.isPositionAboveGround(
      options.position
    );

    this._annotationMarker = this.createAnnotationMarker(options);

    if (options.position) {
      this.updatePosition(options.position);
    }
  }

  get id(): string {
    return this._id;
  }

  async updatePosition(position: IPosition): Promise<void> {
    this._isMarkerPositionAboveGround = this.isPositionAboveGround(position);
    const positionCopy = { ...position };
    positionCopy.altitude =
      (position.altitude ?? 0) +
      (await this._compositeManager.mapProviderServices.mapServices.getTerrainHeightMostSampled(
        positionCopy
      ));
    await this._annotationMarker.updatePosition(positionCopy);
  }

  setVisibility(visible: boolean): void {
    this._annotationMarker.setVisibility(visible);
    if (!this._isMarkerPositionAboveGround) {
      this._annotationMarker.setHeightReferenceVisibility(false);
    }
  }

  setStyle(style: IAnnotationMarkerStyle): void {
    this._annotationMarker.setStyle(style);

    if (style?.color) {
      this._annotationMarker.updateLabelStyle({
        backgroundColor: style?.color,
      });
    }
  }

  panTo(): void {
    this._annotationMarker.panTo();
  }

  remove(): void {
    if (this._annotationMarker) {
      this._annotationMarker.remove();
    }
  }

  // Private methods
  private isPositionAboveGround(position: IPosition): boolean {
    return (
      position.altitude !== undefined &&
      position.altitude !== null &&
      position.altitude > 0
    );
  }

  private createAnnotationMarker(options: IAnnotationMarkerOptions): IFBMarker {
    const iconImage = this.getIconImage(options);
    const annotationMarker = this._compositeManager.createFBMarker({
      position: options.position,
      labelText: options.labelText,
      labelStyle: {
        ...structuredClone(DEFAULT_ANNOTATION_LABEL_STYLE),
        backgroundColor: options?.color,
        heightReference: HeightReferenceEnum.NONE,
      },
      style: {
        ...structuredClone(DEFAULT_ANNOTATION_MARKER_STYLE),
        image: iconImage,
      },
      visible: true,
      hoverable: false,
      clickable: false,
      editable: false,
      showHeightReference: this._isMarkerPositionAboveGround,
    });
    return annotationMarker;
  }

  private getIconImage(options: IAnnotationMarkerOptions) {
    let iconImage = 'assets/annotation/annotation.svg';
    if (options.icon) {
      const color = options.color;
      const iconType = options.icon.icon_type;

      // Use icon_type to determine which icon to use
      if (iconType === ICON_TYPE.CUSTOM && options.icon.icon_content) {
        try {
          const mergedSvg = getCustomIconSVG(
            options.icon.icon_content,
            color,
            false
          );
          iconImage = svgToDataURI(mergedSvg);
        } catch (error) {
          console.warn(
            '[AnnotationMarker] Failed to generate custom icon, using default:',
            error
          );
        }
      } else {
        const iconId = options.icon.icon_id || DEFAULT_ICONS.POINT;
        try {
          const defaultIconId = Object.values(DEFAULT_ICONS).includes(
            iconId as DEFAULT_ICONS
          )
            ? (iconId as DEFAULT_ICONS)
            : DEFAULT_ICONS.POINT;
          const svgIcon = getSVGIcon(defaultIconId, false, color);
          iconImage = svgToDataURI(svgIcon);
        } catch (error) {
          console.warn(
            '[AnnotationMarker] Failed to generate default icon, using fallback:',
            error
          );
        }
      }
    }
    return iconImage;
  }
}
