export const PHY = {
  DRAG: 0.92,
  ACCEL: 0.05,
  DEADZONE: 0.1,
  DOUBLE_PRESS_WINDOW: 350, // ms
};

export const AI_TUNING = {
  CHANGE_DIR_CHANCE: 0.01,
  ALIGNMENT_THRESHOLD: 0.8, // Dot product threshold for 'harmony'
  BOREDOM_THRESHOLD: 200, // Frames of stillness before AI moves
};

export const EVOLUTION = {
  MAX_STAGE: 7,
  TIME_TO_EVOLVE: 2000, // Reduced to 2.0s for accessible progression
  TIME_TO_REGRESS: 2500, // Reduced to 2.5s so dropping a stage feels responsive
  TIME_TO_FAILURE: 8000, // 8.0s of sustained desync to trigger full reset
};

export const VISUALS = {
  PARTICLE_COUNT: 450,
  BASE_COLOR: 'rgba(200, 200, 210, 0.6)',
  ACCENT_COLOR: 'rgba(255, 100, 100, 0.4)',
  CIRCLE_SIZE: 320, // Radius in px effectively (handled via CSS)
};