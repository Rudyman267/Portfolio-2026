import {
  HorizontalOriginEnum,
  MarkerStyle,
  PolylineStyle,
  VerticalOriginEnum,
} from '@map/private/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public/core';

export const DEFAULT_FLEET_2D_MISSION_DASHED_POLYLINE_STYLE: PolylineStyle = {
  width: 4,
  color: MapColor.GREEN_TINT,
  dashLength: 12,
  dashPattern: 1,
  clampToGround: false,
  enableDistanceDisplay: true,
  zIndex: -1000,
};

export const DEFAULT_FLEET_2D_MISSION_MARKER_STYLE: MarkerStyle = {
  image:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMCIgZmlsbD0icmVkIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
  scale: 1.0,
  color: MapColor.WHITE,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: -7 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  verticalOrigin: VerticalOriginEnum.CENTER,
  horizontalOrigin: HorizontalOriginEnum.CENTER,
  heightReference: HeightReferenceEnum.NONE,
  scaleByDistance: true,
  distanceDisplayCondition: {
    near: 0,
    far: 6.0e4,
  },
  disableDepthTestDistance: true,
};
