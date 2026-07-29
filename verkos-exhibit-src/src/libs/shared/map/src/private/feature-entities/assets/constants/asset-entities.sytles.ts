import {
  HorizontalOriginEnum,
  LabelHorizontalOrigin,
  LabelStyle,
  MarkerStyle,
  PolygonStyle,
  PolylineStyle,
  VerticalOriginEnum,
} from '@map/private/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public/core';

export const DEFAULT_ASSET_LABEL_STYLE: LabelStyle = {
  font: 'ultra-expanded bold 14px "DM Sans", sans-serif',
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
  verticalOrigin: VerticalOriginEnum.TOP,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_ASSET_MARKER_STYLE: MarkerStyle = {
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

export const DEFAULT_ASSET_POLYLINE_STYLE: PolylineStyle = {
  color: MapColor.BLUE, //Blue Color
  width: 4,
  outlineColor: MapColor.BLACK,
  outlineWidth: 0,
  clampToGround: true,
  dashPattern: 0,
  dashLength: 16,
  zIndex: 0,
  enableDistanceDisplay: true,
};

export const DEFAULT_ASSET_POLYGON_STYLE: PolygonStyle = {
  fillColor: MapColor.BLUE,
  outlineColor: MapColor.WHITE,
  outlineWidth: 2,
  alpha: 0.5,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};
