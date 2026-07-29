/**
 * Event types for map entities
 * Aligned with CesiumEventType for consistency
 */
export enum IEventType {
  CLICK = 'click',
  DBL_CLICK = 'dblclick',
  LEFT_DOWN = 'leftdown',
  LEFT_UP = 'leftup',
  RIGHT_DOWN = 'rightdown',
  RIGHT_UP = 'rightup',
  MOUSE_MOVE = 'mousemove',
  MOUSE_DRAG = 'mousedrag',
  MOUSE_HOVER = 'mousehover',
  POSITION_CHANGED = 'positionChanged',
  RENDER_ERROR = 'renderError',
  ALT_PLUS_LEFT_DOWN = 'altPlusLeftdown',
  ALT_PLUS_LEFT_UP = 'altPlusLeftup',
  ALT_PLUS_MOUSE_HOVER = 'altPlusMousehover',
  ALT_PLUS_MOUSE_DRAG = 'altPlusMousedrag',
  CAMERA_ORIENTATION_CHANGED = 'camera-orientation-changed',
  SCENE_CHANGED = 'scene-changed',

  // Asset/Marker specific events
  MARKER_CLICK = 'marker-click',
  MARKER_HOVER = 'marker-hover',
  MARKER_HOVER_END = 'marker-hover-end',

  // Asset interaction event for event bubbling
  ASSET_INTERACTION = 'asset-interaction',
}
