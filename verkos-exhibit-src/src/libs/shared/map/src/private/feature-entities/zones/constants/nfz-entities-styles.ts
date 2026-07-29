import {
  CircleStyle,
  LabelHorizontalOrigin,
  LabelStyle,
  LabelVerticalOrigin,
  OutlineType,
  PolygonStyle,
} from '@map/private/contracts';
import { HeightReferenceEnum } from '@map/public';
import { ZoneEntityColors } from './zones-common.styles';

export const DEFAULT_NFZ_LABEL_STYLE: LabelStyle = {
  font: 'ultra-expanded bold 16px "DM Sans", sans-serif',
  fillColor: ZoneEntityColors.WHITE,
  outlineColor: ZoneEntityColors.RED,
  outlineWidth: 2,
  style: 0, // FILL
  scale: 1.0,
  showBackground: true,
  backgroundColor: ZoneEntityColors.RED,
  backgroundAlpha: 0.5,
  backgroundPadding: { x: 7, y: 5 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  pixelOffset: { x: 0, y: 15 },
  horizontalOrigin: LabelHorizontalOrigin.CENTER,
  verticalOrigin: LabelVerticalOrigin.TOP,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_NFZ_POLYGON_STYLE: PolygonStyle = {
  fillColor: ZoneEntityColors.RED,
  outlineColor: ZoneEntityColors.RED,
  outlineWidth: 2,
  alpha: 0.3,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_NFZ_CIRCLE_STYLE: CircleStyle = {
  fillColor: ZoneEntityColors.RED,
  outlineType: OutlineType.REGULAR,
  outlineColor: ZoneEntityColors.RED,
  outlineWidth: 2,
  material: null,
  alpha: 0.3,
};
