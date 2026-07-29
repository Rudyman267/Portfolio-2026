/**
 * Vertical origin options for entities with vertical positioning
 * Aligns with common mapping platform conventions
 */
export enum VerticalOriginEnum {
  TOP = -1,
  CENTER = 0,
  BOTTOM = 1,
}

export enum HorizontalOriginEnum {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1,
}

/**
 * Drag altitude modes for marker dragging operations
 * Determines how altitude is preserved during drag operations
 */
export enum DragAltitudeMode {
  /** Height Above Ellipsoid - preserves absolute altitude */
  HAE = 'HAE',
  /** Above Ground Level - preserves altitude relative to terrain */
  AGL = 'AGL',
}

export enum LabelHorizontalOrigin {
  CENTER = 0,
  BOTTOM = 1,
  BASELINE = 2,
  TOP = -1,
}

export enum LabelVerticalOrigin {
  CENTER = 0,
  BOTTOM = 1,
  BASELINE = 2,
  TOP = -1,
}

export enum ColorBlendModeEnum {
  HIGHLIGHT = 'HIGHLIGHT',
  REPLACE = 'REPLACE',
  MIX = 'MIX',
}
