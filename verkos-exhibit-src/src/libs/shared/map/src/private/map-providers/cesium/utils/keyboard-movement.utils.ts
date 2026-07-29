import { MapKeyboardKey } from '../constants/keyboard-keys.constants';

/**
 * Hardcoded keyboard movement configuration
 * These values provide a good balance for marker control
 */
export const KEYBOARD_MOVEMENT_CONFIG = {
  /** Horizontal movement speed in meters per second */
  horizontalSpeed: 20.0,

  /** Vertical movement speed in meters per second */
  verticalSpeed: 20.0,

  /** Rotation speed in degrees per second (for Q/E keys) */
  rotationSpeed: 20.0,

  /** Approximate meters per degree at equator (for lat/lng conversion) */
  metersPerDegree: 111320,
} as const;

/**
 * Movement delta result
 */
export interface KeyboardMovementDelta {
  /** Latitude change in degrees */
  lat: number;

  /** Longitude change in degrees */
  lng: number;

  /** Altitude change in meters */
  alt: number;

  /** Rotation change in degrees (for future yaw support) */
  rotation: number;
}

/**
 * Calculate keyboard movement delta based on pressed keys and delta time
 *
 * Movement is north-up (W = north, not camera-relative).
 * Uses hardcoded speeds from KEYBOARD_MOVEMENT_CONFIG.
 *
 * @param pressedKeys - Array of currently pressed keys
 * @param deltaTime - Time since last update in seconds
 * @returns Movement delta in degrees (lat/lng), meters (alt), and degrees (rotation)
 */
export function calculateKeyboardMovement(
  pressedKeys: string[],
  deltaTime: number
): KeyboardMovementDelta {
  const keys = new Set(pressedKeys.map((k) => k.toLowerCase()));

  // Extract speeds from config
  const { horizontalSpeed, verticalSpeed, rotationSpeed, metersPerDegree } =
    KEYBOARD_MOVEMENT_CONFIG;

  const distanceMovement = horizontalSpeed * deltaTime;
  const degreeMovement = distanceMovement / metersPerDegree;

  // Calculate movement delta
  let latDelta = 0;
  let lngDelta = 0;
  let altDelta = 0;
  let rotationDelta = 0;

  // North/South (W/S keys)
  if (keys.has(MapKeyboardKey.MOVE_NORTH)) {
    latDelta += degreeMovement; // Move north
  }
  if (keys.has(MapKeyboardKey.MOVE_SOUTH)) {
    latDelta -= degreeMovement; // Move south
  }

  // East/West (D/A keys)
  if (keys.has(MapKeyboardKey.MOVE_EAST)) {
    lngDelta += degreeMovement; // Move east
  }
  if (keys.has(MapKeyboardKey.MOVE_WEST)) {
    lngDelta -= degreeMovement; // Move west
  }

  // Altitude (Z/C keys)
  if (keys.has(MapKeyboardKey.MOVE_UP)) {
    altDelta += verticalSpeed * deltaTime; // Move up
  }
  if (keys.has(MapKeyboardKey.MOVE_DOWN)) {
    altDelta -= verticalSpeed * deltaTime; // Move down
  }

  // Rotation (Q/E keys) - for future use
  if (keys.has(MapKeyboardKey.ROTATE_LEFT)) {
    rotationDelta -= rotationSpeed * deltaTime; // Rotate left (CCW)
  }
  if (keys.has(MapKeyboardKey.ROTATE_RIGHT)) {
    rotationDelta += rotationSpeed * deltaTime; // Rotate right (CW)
  }

  return {
    lat: latDelta,
    lng: lngDelta,
    alt: altDelta,
    rotation: rotationDelta,
  };
}
