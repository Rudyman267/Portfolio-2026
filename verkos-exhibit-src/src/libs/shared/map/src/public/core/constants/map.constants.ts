export enum SceneMode {
  /**
   * Morphing between mode, e.g., 3D to 2D.
   */
  MORPHING = 0,
  /**
   * Columbus View mode.  A 2.5D perspective view where the map is laid out
   * flat and objects with non-zero height are drawn above it.
   */
  COLUMBUS_VIEW = 1,
  /**
   * 2D mode.  The map is viewed top-down with an orthographic projection.
   */
  SCENE2D = 2,
  /**
   * 3D mode.  A traditional 3D perspective view of the globe.
   */
  SCENE3D = 3,
}

export enum BaseMapEventType {
  MOUSE_CLICK = 'MOUSE_CLICK',
  MOUSE_HOVER = 'MOUSE_HOVER',
  MOUSE_DRAG = 'MOUSE_DRAG',
  LEFT_DOWN = 'LEFT_DOWN',
  LEFT_UP = 'LEFT_UP',
  ALT_PLUS_LEFT_DOWN = 'ALT_PLUS_LEFT_DOWN',
  ALT_PLUS_LEFT_UP = 'ALT_PLUS_LEFT_UP',
  ALT_PLUS_MOUSE_HOVER = 'ALT_PLUS_MOUSE_HOVER',
  ALT_PLUS_MOUSE_DRAG = 'ALT_PLUS_MOUSE_DRAG',
  /**
   * Keyboard events (shared across providers; only providers that support keyboard will emit these)
   */
  KEY_DOWN = 'KEY_DOWN',
  KEY_UP = 'KEY_UP',
  KEY_PRESS = 'KEY_PRESS',
}

export enum MapLayers {
  AERIAL = 'Aerial',
  AERIAL_WITH_LABELS = 'Aerial_Labels',
  ROAD = 'Road',
}

export enum MapColor {
  RED = '#FF0000',
  ERROR = '#F96C61',
  BLUE = '#3A9BF3',
  BLUE_TINT = '#2699fb',
  GREY = '#637486',
  GREY_TINT = '#959595',
  TRANSPARENT = 'transparent',
  GREEN_TINT = '#08CAC6',
  GREEN_DARK = '#019592',
  ORANGE = '#FFA548',
  WHITE = '#FFFFFF',
  BLACK = '#000000',
}

export enum ViewType {
  TwoD,
  ThreeD,
}

export enum BaseMapType {
  BING = 'bing', // Default fallback (existing Bing Maps)
  ARCGIS = 'arcgis', // ArcGIS MapServer/Tile services
  GOOGLE = 'google', // Google Maps imagery
  LOCAL = 'local', // Custom tile servers
}

/**
 * Enum for height reference (string values)
 */
export enum HeightReferenceEnum {
  NONE = 'NONE',
  CLAMP_TO_GROUND = 'CLAMP_TO_GROUND',
  RELATIVE_TO_GROUND = 'RELATIVE_TO_GROUND',
  CLAMP_TO_TERRAIN = 'CLAMP_TO_TERRAIN',
  RELATIVE_TO_TERRAIN = 'RELATIVE_TO_TERRAIN',
  CLAMP_TO_3D_TILE = 'CLAMP_TO_3D_TILE',
  RELATIVE_TO_3D_TILE = 'RELATIVE_TO_3D_TILE',
}
