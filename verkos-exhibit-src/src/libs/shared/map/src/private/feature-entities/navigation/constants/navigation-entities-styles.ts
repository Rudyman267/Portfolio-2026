import {
  HorizontalOriginEnum,
  MarkerStyle,
  PolylineStyle,
  VerticalOriginEnum,
} from '@map/private/contracts/core';
import { HeightReferenceEnum, MapColor } from '@map/public';

export const DEFAULT_COMPLETED_GOTO_MARKER_STYLE: MarkerStyle = {
  image: 'assets/goto/completedGotoMarker.svg',
  scale: 1.0,
  color: MapColor.GREEN_TINT,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
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

export const DEFAULT_GOTO_MARKER_STYLE: MarkerStyle = {
  image: 'assets/goto/gotoMarker.svg',
  scale: 1.0,
  color: MapColor.WHITE,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
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

export const DEFAULT_GOTO_DASHED_POLYLINE_STYLE: PolylineStyle = {
  width: 3,
  color: MapColor.GREEN_TINT,
  dashLength: 12,
  dashPattern: 1,
  clampToGround: false,
  enableDistanceDisplay: true,
  zIndex: -10,
};
