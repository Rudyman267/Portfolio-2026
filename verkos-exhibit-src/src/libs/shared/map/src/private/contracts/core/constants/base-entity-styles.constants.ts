import { LabelStyle } from '../styles/label-style';
import { PolylineStyle } from '../styles/polyline-style';
import { PointStyle } from '../styles/point-style';
import { PolygonStyle } from '../styles/polygon-style';
import { CircleStyle } from '../styles/circle-style';
import { MarkerStyle } from '../styles/marker-style';
import { ModelStyle } from '../styles/model-style';
import {
  ColorBlendModeEnum,
  HorizontalOriginEnum,
  LabelHorizontalOrigin,
  LabelVerticalOrigin,
  VerticalOriginEnum,
} from './general.enum';
import { HeightReferenceEnum, MapColor } from '@map/public/core';
import { OutlineType } from './map-entity.enums';

export const DEFAULT_BASE_LABEL_STYLE: LabelStyle = {
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
  horizontalOrigin: LabelHorizontalOrigin.CENTER,
  verticalOrigin: LabelVerticalOrigin.CENTER,
  heightReference: HeightReferenceEnum.NONE,
};

export const DEFAULT_BASE_POLYLINE_STYLE: PolylineStyle = {
  color: MapColor.BLUE, //Blue Color
  width: 4,
  outlineColor: MapColor.BLACK,
  outlineWidth: 0,
  clampToGround: false,
  dashPattern: 0,
  dashLength: 16,
  zIndex: 0,
  enableDistanceDisplay: true,
};

export const DEFAULT_BASE_REAL_POINT_STYLE: PointStyle = {
  color: MapColor.WHITE,
  pixelSize: 12,
  outlineColor: MapColor.WHITE,
  outlineWidth: 2,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_BASE_POLYGON_STYLE: PolygonStyle = {
  fillColor: MapColor.BLUE,
  outlineColor: MapColor.WHITE,
  outlineWidth: 2,
  alpha: 1,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_BASE_CIRCLE_STYLE: CircleStyle = {
  fillColor: MapColor.BLUE,
  outlineType: OutlineType.REGULAR,
  outlineColor: MapColor.WHITE,
  outlineWidth: 2,
  material: null,
  alpha: 1,
};

export const DEFAULT_BASE_MARKER_STYLE: MarkerStyle = {
  image:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMCIgZmlsbD0icmVkIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
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

export const DEFAULT_BASE_MODEL_STYLE: ModelStyle = {
  modelUri: 'assets/models/drone-model.glb',
  scale: 1.0,
  color: MapColor.WHITE,
  colorBlendMode: ColorBlendModeEnum.HIGHLIGHT,
  silhouetteColor: undefined,
  silhouetteSize: undefined,
  colorBlendAmount: 0.5,
  minimumPixelSize: 86,
  maximumScale: 300,
  heightReference: HeightReferenceEnum.NONE,
};
