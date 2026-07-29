/**
 * Weather-related types and enums
 * Shared between different components to ensure consistency
 */

/**
 * Weather categories
 */
export enum WeatherType {
  RAIN = 'rain',
  WIND = 'wind',
}

/**
 * Rain levels
 */
export enum RainLevel {
  NONE = 0,
  LIGHT = 1,
  MODERATE = 2,
  HEAVY = 3,
  ERROR = 4,
}

/**
 * Wind levels - Based on wind speed in m/s
 */
export enum WindLevel {
  NONE = 0,
  CAUTION = 1, // 1-8 m/s
  CRITICAL = 2, // > 8 m/s
  ERROR = 3,
}

// Wind thresholds in m/s
export const CAUTION_WIND_THRESHOLD = 1;
export const CRITICAL_WIND_THRESHOLD = 8;

// Rain level descriptions
export const RAIN_LEVEL_DESCRIPTIONS: Record<RainLevel, string> = {
  [RainLevel.NONE]: 'No rain',
  [RainLevel.LIGHT]: 'Slight rain',
  [RainLevel.MODERATE]: 'Moderate rain',
  [RainLevel.HEAVY]: 'Heavy rain',
  [RainLevel.ERROR]: 'Unknown rain level',
};

// Wind level descriptions
export const WIND_LEVEL_DESCRIPTIONS: Record<WindLevel, string> = {
  [WindLevel.NONE]: 'No wind',
  [WindLevel.CAUTION]: 'Moderate wind',
  [WindLevel.CRITICAL]: 'Strong wind',
  [WindLevel.ERROR]: 'Unknown wind level',
};

// Weather notification interface
export interface WeatherNotification {
  type: WeatherType;
  level: RainLevel | WindLevel;
  timestamp: number;
  dockId: string;
  dockName?: string;
  value?: number; // Wind speed in m/s or rainfall category
}
