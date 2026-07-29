import { MissionPlannerConstants } from '../constants';

/**
 * Provides structured debug logging for the mission planner
 * Centralizes all debug output and can be easily enabled/disabled
 */
export class DebugService {
  private readonly _enabled: boolean;
  private readonly _category: string;

  /**
   * Create a new DebugService
   * @param category The category prefix for log messages
   * @param enabled Whether debug logging is enabled (defaults to constant setting)
   */
  constructor(
    category: string,
    enabled: boolean = MissionPlannerConstants.Debug.ENABLE_LOGGING
  ) {
    this._category = category;
    this._enabled = enabled;
  }

  /**
   * Log an informational message
   * @param message The message to log
   * @param data Optional data to include
   */
  public log(message: string, data?: any): void {
    if (!this._enabled) return;

    if (data) {
      console.log(`[${this._category}] ${message}`, data);
    } else {
      console.log(`[${this._category}] ${message}`);
    }
  }

  /**
   * Log a warning message
   * @param message The warning message
   * @param data Optional data to include
   */
  public warn(message: string, data?: any): void {
    if (!this._enabled) return;

    if (data) {
      console.warn(`[${this._category}] WARNING: ${message}`, data);
    } else {
      console.warn(`[${this._category}] WARNING: ${message}`);
    }
  }

  /**
   * Log an error message
   * @param message The error message
   * @param error Optional error object
   */
  public error(message: string, error?: any): void {
    if (!this._enabled) return;

    if (error) {
      console.error(`[${this._category}] ERROR: ${message}`, error);
    } else {
      console.error(`[${this._category}] ERROR: ${message}`);
    }
  }

  /**
   * Log a group of related messages
   * @param groupName The name of the group
   * @param logFn Function that contains log calls
   */
  public group(groupName: string, logFn: () => void): void {
    if (!this._enabled) return;

    console.group(`[${this._category}] ${groupName}`);
    logFn();
    console.groupEnd();
  }

  /**
   * Log a state change
   * @param from The previous state
   * @param to The new state
   */
  public logStateChange(from: string, to: string): void {
    if (!this._enabled) return;

    console.log(`[${this._category}] State change: ${from} → ${to}`);
  }

  /**
   * Log an event
   * @param eventType The type of event
   * @param data The event data
   */
  public logEvent(eventType: string, data?: any): void {
    if (!this._enabled) return;

    if (data) {
      console.log(`[${this._category}] Event: ${eventType}`, data);
    } else {
      console.log(`[${this._category}] Event: ${eventType}`);
    }
  }
}
