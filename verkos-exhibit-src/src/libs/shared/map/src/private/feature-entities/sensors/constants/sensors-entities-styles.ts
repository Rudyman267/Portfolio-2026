import {
  CircleStyle,
  HorizontalOriginEnum,
  LabelHorizontalOrigin,
  LabelStyle,
  LabelVerticalOrigin,
  MarkerStyle,
  OutlineType,
  VerticalOriginEnum,
} from '@map/private/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public';

export const DEFAULT_SENSOR_MARKER_STYLE: MarkerStyle = {
  image: 'assets/goto/gotoMarker.svg',
  scale: 1.0,
  color: MapColor.WHITE,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  verticalOrigin: VerticalOriginEnum.CENTER,
  horizontalOrigin: HorizontalOriginEnum.CENTER,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
  scaleByDistance: true,
  distanceDisplayCondition: {
    near: 0,
    far: 6.0e4,
  },
  disableDepthTestDistance: true,
};

export const DEFAULT_SENSOR_LABEL_STYLE: LabelStyle = {
  font: 'ultra-expanded bold 16px "DM Sans", sans-serif',
  fillColor: MapColor.WHITE,
  outlineColor: MapColor.BLACK,
  outlineWidth: 2,
  style: 0, // FILL
  scale: 1.0,
  showBackground: true,
  backgroundColor: MapColor.BLACK,
  backgroundAlpha: 0.5,
  backgroundPadding: { x: 7, y: 5 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  pixelOffset: { x: 0, y: 15 },
  horizontalOrigin: LabelHorizontalOrigin.CENTER,
  verticalOrigin: LabelVerticalOrigin.TOP,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_SENSOR_MIN_CIRCLE_STYLE: CircleStyle = {
  fillColor: MapColor.BLACK,
  outlineType: OutlineType.REGULAR,
  outlineColor: MapColor.WHITE,
  outlineWidth: 2,
  material: null,
  alpha: 0,
};

export const DEFAULT_SENSOR_MAX_CIRCLE_STYLE: CircleStyle = {
  fillColor: MapColor.BLACK,
  outlineType: OutlineType.REGULAR,
  outlineColor: MapColor.WHITE,
  outlineWidth: 2,
  material: null,
  alpha: 0,
};
