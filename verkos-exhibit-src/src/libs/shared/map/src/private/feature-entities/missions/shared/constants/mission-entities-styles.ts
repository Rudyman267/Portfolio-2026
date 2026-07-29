import {
  ColorBlendModeEnum,
  HorizontalOriginEnum,
  LabelHorizontalOrigin,
  LabelStyle,
  LabelVerticalOrigin,
  MarkerStyle,
  ModelStyle,
  PolygonStyle,
  PolylineStyle,
  VerticalOriginEnum,
} from '@map/private/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public';

export const DEFAULT_UNSELECTED_TAKE_OFF_REFERENCE_POINT_STYLE: MarkerStyle = {
  image:
    'assets/linear-mission/non-selected-linear-mission-reference-point.svg',
  scale: 1.0,
  color: MapColor.WHITE,
  heightReference: HeightReferenceEnum.NONE,
  disableDepthTestDistance: true,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  verticalOrigin: VerticalOriginEnum.CENTER,
  horizontalOrigin: HorizontalOriginEnum.CENTER,
  scaleByDistance: true,
  distanceDisplayCondition: {
    near: 0,
    far: 6.0e4,
  },
};

export const DEFAULT_SELECTED_TAKE_OFF_REFERENCE_POINT_STYLE: MarkerStyle = {
  image: 'assets/linear-mission/selected-linear-mission-reference-point.svg',
  scale: 1.0,
  color: MapColor.WHITE,
  heightReference: HeightReferenceEnum.NONE,
  disableDepthTestDistance: true,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  verticalOrigin: VerticalOriginEnum.CENTER,
  horizontalOrigin: HorizontalOriginEnum.CENTER,
  scaleByDistance: true,
  distanceDisplayCondition: {
    near: 0,
    far: 6.0e4,
  },
};

export const DEFAULT_UNSELECTED_WAYPOINT_MARKER_STYLE: MarkerStyle = {
  image: 'assets/linear-mission/non-selected-linear-mission-waypoint.svg',
  scale: 1.0,
  color: MapColor.WHITE,
  heightReference: HeightReferenceEnum.NONE,
  disableDepthTestDistance: true,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  verticalOrigin: VerticalOriginEnum.BOTTOM,
  horizontalOrigin: HorizontalOriginEnum.CENTER,
  scaleByDistance: true,
  distanceDisplayCondition: {
    near: 0,
    far: 6.0e4,
  },
};

export const DEFAULT_SELECTED_WAYPOINT_MARKER_STYLE: MarkerStyle = {
  image: 'assets/linear-mission/selected-linear-mission-waypoint.svg',
  scale: 1.0,
  color: MapColor.WHITE,
  heightReference: HeightReferenceEnum.NONE,
  disableDepthTestDistance: true,
  rotation: 0,
  rotateWithCamera: false,
  pixelOffset: { x: 0, y: 0 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  verticalOrigin: VerticalOriginEnum.BOTTOM,
  horizontalOrigin: HorizontalOriginEnum.CENTER,
  scaleByDistance: true,
  distanceDisplayCondition: {
    near: 0,
    far: 6.0e4,
  },
};

export const DEFAULT_UNSELECTED_PATH_STYLE: PolylineStyle = {
  color: MapColor.GREY_TINT,
  width: 3,
  clampToGround: false,
  dashLength: 0,
  dashPattern: 0,
  zIndex: -100,
  outlineColor: MapColor.BLACK,
  outlineWidth: 0,
  enableDistanceDisplay: true,
};

export const DEFAULT_SELECTED_PATH_STYLE: PolylineStyle = {
  color: MapColor.BLUE,
  width: 4,
  clampToGround: false,
  dashLength: 0,
  dashPattern: 0,
  zIndex: -100,
  outlineColor: MapColor.BLACK,
  outlineWidth: 0,
  enableDistanceDisplay: true,
};

export const DEFAULT_SELECTED_MISSION_LABEL_STYLE: LabelStyle = {
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
  heightReference: HeightReferenceEnum.NONE,
};

export const DEFAULT_UNSELECTED_MISSION_LABEL_STYLE: LabelStyle = {
  font: 'ultra-expanded bold 16px "DM Sans", sans-serif',
  fillColor: MapColor.WHITE,
  outlineColor: MapColor.GREY_TINT,
  outlineWidth: 2,
  style: 0, // FILL
  scale: 1.0,
  showBackground: true,
  backgroundColor: MapColor.GREY_TINT,
  backgroundAlpha: 0.5,
  backgroundPadding: { x: 7, y: 5 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  pixelOffset: { x: 0, y: 15 },
  horizontalOrigin: LabelHorizontalOrigin.CENTER,
  verticalOrigin: LabelVerticalOrigin.TOP,
  heightReference: HeightReferenceEnum.NONE,
};

export const DEFAULT_SELECTED_ORIENTATION_MODEL_STYLE: ModelStyle = {
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

export const DEFAULT_UNSELECTED_GRID_MISSION_POLYGON_STYLE: PolygonStyle = {
  fillColor: MapColor.GREY_TINT,
  outlineColor: MapColor.GREY_TINT,
  outlineWidth: 5,
  alpha: 0.3,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_SELECTED_GRID_MISSION_POLYGON_STYLE: PolygonStyle = {
  fillColor: MapColor.BLUE,
  outlineColor: MapColor.BLUE,
  outlineWidth: 5,
  alpha: 0.3,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};

export const DEFAULT_EDITING_GRID_MISSION_POLYGON_STYLE: PolygonStyle = {
  fillColor: MapColor.GREEN_TINT,
  outlineColor: MapColor.GREEN_TINT,
  outlineWidth: 5,
  alpha: 0.3,
  heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
};
