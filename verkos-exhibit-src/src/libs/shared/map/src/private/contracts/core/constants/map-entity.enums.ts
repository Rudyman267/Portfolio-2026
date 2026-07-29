import { HeightReferenceEnum } from '@map/public';

/**
 * Enum for outline types
 */
export enum OutlineType {
  REGULAR = 'regular',
  DASHED = 'dashed',
}

/**
 * Enum for height reference (numeric values)
 */
export enum EHeightReference {
  NONE = 0,
  CLAMP_TO_GROUND = 1,
  RELATIVE_TO_GROUND = 2,
  CLAMP_TO_TERRAIN = 3,
  RELATIVE_TO_TERRAIN = 4,
  CLAMP_TO_3D_TILE = 5,
  RELATIVE_TO_3D_TILE = 6,
}

/**
 * Enum for vertical origin
 */
export enum VerticalOrigin {
  CENTER = 0,
  BOTTOM = 1,
  BASELINE = 2,
  TOP = -1,
}

/**
 * Constants for height properties that represent clamping
 */
export const ClampingHeightProperties = [
  HeightReferenceEnum.CLAMP_TO_GROUND,
  HeightReferenceEnum.CLAMP_TO_TERRAIN,
  HeightReferenceEnum.CLAMP_TO_3D_TILE,
];

/**
 * Constants for height properties that represent relative positioning
 */
export const RelativeHeightProperties = [
  HeightReferenceEnum.RELATIVE_TO_GROUND,
  HeightReferenceEnum.RELATIVE_TO_TERRAIN,
  HeightReferenceEnum.RELATIVE_TO_3D_TILE,
  HeightReferenceEnum.NONE,
];

export enum ColorBlendType {
  REPLACE = 'REPLACE',
  HIGHLIGHT = 'HIGHLIGHT',
  MIX = 'MIX',
}

export const POLYGON_SIDE = 100;
export const COLOR_ALPHA = 0.1;
