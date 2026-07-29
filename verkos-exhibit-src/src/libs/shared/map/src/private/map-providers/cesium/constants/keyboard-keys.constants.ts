/**
 * Map-specific keyboard keys for entity control
 *
 * This enum defines which keys the map layer will handle when an entity has keyboard focus.
 * Keys NOT in this enum will be ignored by the map and forwarded to the application layer.
 */
export enum MapKeyboardKey {
  // Horizontal movement (WASD)
  MOVE_NORTH = 'w',
  MOVE_SOUTH = 's',
  MOVE_EAST = 'd',
  MOVE_WEST = 'a',

  // Vertical movement (Z/C)
  MOVE_UP = 'c',
  MOVE_DOWN = 'z',

  // Rotation (Q/E) - for future use
  ROTATE_LEFT = 'q',
  ROTATE_RIGHT = 'e',
}

/**
 * Array of all map keyboard keys for quick lookups
 */
export const MAP_KEYBOARD_KEYS: readonly string[] =
  Object.values(MapKeyboardKey);

/**
 * Check if a key is a map-controlled key
 * @param key - The key to check (case-insensitive)
 * @returns true if the key is handled by the map layer
 */
export function isMapKey(key: string): boolean {
  return MAP_KEYBOARD_KEYS.includes(key.toLowerCase());
}

/**
 * Movement key subset (WASD/ZC only, excludes rotation)
 */
export const MOVEMENT_KEYS: readonly string[] = [
  MapKeyboardKey.MOVE_NORTH,
  MapKeyboardKey.MOVE_SOUTH,
  MapKeyboardKey.MOVE_EAST,
  MapKeyboardKey.MOVE_WEST,
  MapKeyboardKey.MOVE_UP,
  MapKeyboardKey.MOVE_DOWN,
] as const;

/**
 * Check if a key is a movement key (WASD/ZC)
 * @param key - The key to check (case-insensitive)
 * @returns true if the key controls movement
 */
export function isMovementKey(key: string): boolean {
  return MOVEMENT_KEYS.includes(key.toLowerCase());
}
