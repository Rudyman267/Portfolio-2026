import {
  DeviceYawRouteSettingsMode,
  DroneYawActionTypes,
  IOrientation,
  IPosition,
  IWaypointApproachSettings,
  IWaypointDeviceYawAction,
  NextWaypointApproachMode,
  WaypointData,
} from '@map/public/contracts';
import { calculateBearing } from '@map/private/utils';

/**
 * Service responsible for computing waypoint orientations in the Linear Mission Planner
 * Handles device yaw calculation based on route settings and waypoint-specific overrides
 */
export class OrientationComputationService {
  constructor(
    private readonly _debugService: {
      log: (...args: any[]) => void;
      warn: (...args: any[]) => void;
    }
  ) {}

  /**
   * Computes the device yaw for a specific waypoint considering:
   * 1. Waypoint-specific deviceYawAction (highest priority)
   * 2. Route device yaw mode with inheritance (LOCK_YAW_AXIS/MANUAL)
   * 3. Trajectory-based calculation (ALONG_ROUTE)
   *
   * @param waypointIndex Index of the waypoint to compute yaw for
   * @param waypointsData Array of all waypoint data
   * @param referencePoint Mission reference point
   * @param routeDeviceYawMode Current route device yaw mode
   * @returns Device yaw angle in degrees
   */
  public computeDeviceYaw(
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    // Validate inputs
    if (waypointIndex < 0 || waypointIndex >= waypointsData.length) {
      this._debugService.warn(`Invalid waypoint index: ${waypointIndex}`);
      return 0;
    }

    if (!referencePoint) {
      this._debugService.warn(
        'No reference point available for yaw calculation'
      );
      return 0;
    }

    // Get the effective yaw value considering approach settings
    const effectiveYaw = this._computeWithApproachSettings(
      waypointIndex,
      waypointsData,
      referencePoint,
      routeDeviceYawMode
    );

    this._debugService.log(
      `Computed device yaw for waypoint ${waypointIndex}`,
      {
        yawValue: effectiveYaw,
        mode: routeDeviceYawMode,
        hasCustomAction: !!waypointsData[waypointIndex].deviceYawAction,
      }
    );

    return this._normalizeYaw(effectiveYaw);
  }

  /**
   * Computes full orientation (heading, pitch, roll) for a waypoint
   * Maps device yaw to heading for the orientation model
   */
  public computeWaypointOrientation(
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): IOrientation {
    const deviceYaw = this.computeDeviceYaw(
      waypointIndex,
      waypointsData,
      referencePoint,
      routeDeviceYawMode
    );

    return {
      heading: deviceYaw, // Device yaw maps to heading for orientation model
      pitch: 0,
      roll: 0,
    };
  }

  /**
   * Main computation logic that considers approach settings
   * Implements the priority hierarchy: deviceYawAction > approach settings > route settings
   *
   * @private
   */
  private _computeWithApproachSettings(
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    const waypoint = waypointsData[waypointIndex];

    // Priority 1: deviceYawAction override (existing highest priority)
    if (waypoint.deviceYawAction) {
      const computedAngle = this._computeAngleFromDeviceYawAction(
        waypoint.deviceYawAction,
        waypointIndex,
        waypointsData,
        referencePoint,
        routeDeviceYawMode
      );
      this._debugService.log(
        `Waypoint ${waypointIndex} using deviceYawAction override`,
        {
          originalValue: waypoint.deviceYawAction.value,
          originalType: waypoint.deviceYawAction.type,
          computedAngle: computedAngle,
        }
      );
      return computedAngle;
    }

    // Priority 2: Approach settings
    const approachSettings = this._getEffectiveApproachSettings(
      waypointIndex,
      waypointsData,
      routeDeviceYawMode
    );

    // Check if waypoint has a custom approach mode that differs from route default
    // This ensures explicit approach settings take precedence over route settings
    const routeDefaultApproachMode =
      this._mapRouteSettingToApproachMode(routeDeviceYawMode);
    const hasCustomApproachMode =
      approachSettings.nextWaypointApproachMode &&
      approachSettings.nextWaypointApproachMode !== routeDefaultApproachMode;

    // SPECIAL CASE: Route="along route" + Approach="lock yaw axis"
    // In this specific case, the waypoint should keep its route-based angle
    // and only the NEXT waypoint should be affected
    const isSpecialAlongRouteLockCase =
      routeDeviceYawMode === DeviceYawRouteSettingsMode.ALONG_ROUTE &&
      approachSettings.nextWaypointApproachMode ===
        NextWaypointApproachMode.LOCK_YAW_AXIS &&
      !approachSettings.followRoute;

    if (isSpecialAlongRouteLockCase) {
      this._debugService.log(
        `Waypoint ${waypointIndex} in special ALONG_ROUTE + LOCK_YAW_AXIS case - keeping route-based angle, only next waypoint affected`,
        {
          routeMode: routeDeviceYawMode,
          approachMode: approachSettings.nextWaypointApproachMode,
          behavior: 'current_waypoint_unaffected_next_waypoint_affected',
        }
      );

      // Current waypoint follows route settings, approach setting only affects next waypoint
      return this._findEffectiveYawForWaypoint(
        waypointIndex,
        waypointsData,
        referencePoint,
        routeDeviceYawMode
      );
    }

    // For all other cases, approach settings affect the current waypoint (previous behavior)
    // BUT only when followRoute is false - when followRoute is true, approach settings are ignored
    if (
      !approachSettings.followRoute &&
      approachSettings.nextWaypointApproachMode
    ) {
      this._debugService.log(
        `Waypoint ${waypointIndex} using custom approach mode (followRoute is false)`,
        {
          approachMode: approachSettings.nextWaypointApproachMode,
          followRoute: approachSettings.followRoute,
          routeDefaultMode: routeDefaultApproachMode,
          reason: 'followRoute_false_so_approach_settings_applied',
        }
      );

      return this._computeCustomApproachYaw(
        waypointIndex,
        waypointsData,
        referencePoint,
        approachSettings.nextWaypointApproachMode,
        routeDeviceYawMode
      );
    }

    // Priority 3: Mission route settings (existing logic)
    this._debugService.log(
      `Waypoint ${waypointIndex} following route settings`,
      {
        routeMode: routeDeviceYawMode,
        followRoute: approachSettings.followRoute,
      }
    );

    return this._findEffectiveYawForWaypoint(
      waypointIndex,
      waypointsData,
      referencePoint,
      routeDeviceYawMode
    );
  }

  /**
   * Gets effective approach settings for a waypoint (with defaults)
   * Handles backward compatibility for waypoints without approach settings
   *
   * @private
   */
  private _getEffectiveApproachSettings(
    waypointIndex: number,
    waypointsData: WaypointData[],
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): IWaypointApproachSettings {
    const waypoint = waypointsData[waypointIndex];

    // Return stored settings if they exist
    if (waypoint.approachSettings) {
      // Fill in missing nextWaypointApproachMode if needed (defensive programming)
      if (
        !waypoint.approachSettings.followRoute &&
        !waypoint.approachSettings.nextWaypointApproachMode
      ) {
        this._debugService.log(
          `Filling missing approach mode for waypoint ${waypointIndex}`,
          {
            followRoute: waypoint.approachSettings.followRoute,
            defaultMode:
              this._mapRouteSettingToApproachMode(routeDeviceYawMode),
          }
        );
        return {
          ...waypoint.approachSettings,
          nextWaypointApproachMode:
            this._mapRouteSettingToApproachMode(routeDeviceYawMode),
        };
      }
      return waypoint.approachSettings;
    }

    // Return defaults for waypoints without approach settings (backward compatibility)
    const defaultSettings = {
      followRoute: true,
      nextWaypointApproachMode:
        this._mapRouteSettingToApproachMode(routeDeviceYawMode),
    };

    this._debugService.log(
      `Using default approach settings for waypoint ${waypointIndex}`,
      {
        defaultSettings,
        reason: 'no_stored_approach_settings',
        routeMode: routeDeviceYawMode,
      }
    );

    return defaultSettings;
  }

  /**
   * Maps route setting to equivalent approach mode
   *
   * @private
   */
  private _mapRouteSettingToApproachMode(
    routeMode: DeviceYawRouteSettingsMode
  ): NextWaypointApproachMode {
    switch (routeMode) {
      case DeviceYawRouteSettingsMode.ALONG_ROUTE:
        return NextWaypointApproachMode.ALONG_ROUTE;
      case DeviceYawRouteSettingsMode.LOCK_YAW_AXIS:
        return NextWaypointApproachMode.LOCK_YAW_AXIS;
      case DeviceYawRouteSettingsMode.MANUAL:
        return NextWaypointApproachMode.MANUAL;
      default:
        return NextWaypointApproachMode.ALONG_ROUTE;
    }
  }

  /**
   * Computes yaw using custom approach mode
   * Implements the priority matrix logic for current waypoint computation
   *
   * @private
   */
  private _computeCustomApproachYaw(
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    customMode: NextWaypointApproachMode,
    originalRouteMode: DeviceYawRouteSettingsMode
  ): number {
    this._debugService.log(
      `Computing custom approach yaw for waypoint ${waypointIndex}`,
      {
        customMode,
        originalRouteMode,
        waypointIndex,
      }
    );

    switch (customMode) {
      case NextWaypointApproachMode.ALONG_ROUTE:
        // Priority Matrix: Route=ALONG_ROUTE, Waypoint=ALONG_ROUTE → Trajectory-based (existing)
        // Priority Matrix: Route=LOCK_YAW_AXIS/MANUAL, Waypoint=ALONG_ROUTE → Reference → first waypoint
        if (originalRouteMode === DeviceYawRouteSettingsMode.ALONG_ROUTE) {
          // Normal along route calculation for current waypoint
          return this._computeAlongRouteYaw(
            waypointIndex,
            waypointsData,
            referencePoint
          );
        } else {
          // LOCK_YAW_AXIS/MANUAL route with ALONG_ROUTE approach:
          // Current waypoint still uses reference → first waypoint angle
          // The "along route" impact only affects NEXT waypoint computation
          return this._computeLockYawAxisYaw(waypointsData, referencePoint);
        }

      case NextWaypointApproachMode.LOCK_YAW_AXIS:
      case NextWaypointApproachMode.MANUAL:
        // Priority Matrix: All route settings with LOCK_YAW_AXIS/MANUAL approach
        // → Reference → first waypoint angle for current waypoint
        // This affects the CURRENT waypoint's yaw, not creating inheritance for next waypoint
        this._debugService.log(
          `Waypoint ${waypointIndex} using LOCK_YAW_AXIS/MANUAL approach - setting to reference angle`,
          {
            waypointIndex,
            approach: customMode,
            behavior: 'use_reference_angle',
            effect: 'current_waypoint_only',
          }
        );
        return this._computeLockYawAxisYaw(waypointsData, referencePoint);

      case NextWaypointApproachMode.AUTO_ADJUST:
        // Priority Matrix: All route settings with AUTO_ADJUST approach
        // → Current waypoint points to North (0°)
        return this._computeAutoAdjustYaw(
          waypointIndex,
          waypointsData,
          originalRouteMode
        );

      default:
        this._debugService.warn(`Unknown approach mode: ${customMode}`);
        return 0;
    }
  }

  /**
   * Computes Auto Adjust yaw (always points to North for current waypoint)
   *
   * AUTO_ADJUST Implementation:
   * - CURRENT waypoint: Always 0° (points to North)
   * - NEXT waypoint behavior depends on route setting:
   *   * ALONG_ROUTE route: Next waypoint uses modified trajectory (current→next+1)
   *   * LOCK_YAW_AXIS/MANUAL route: Next waypoint inherits 0° (inheritance chain)
   *
   * @private
   */
  private _computeAutoAdjustYaw(
    waypointIndex: number,
    waypointsData: WaypointData[],
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    // Current waypoint always points to North (0°)
    this._debugService.log(
      `Waypoint ${waypointIndex} using AUTO_ADJUST - current waypoint points to North`,
      {
        routeMode: routeDeviceYawMode,
        currentWaypointYaw: 0,
        nextWaypointBehavior:
          routeDeviceYawMode === DeviceYawRouteSettingsMode.ALONG_ROUTE
            ? 'modified_trajectory'
            : 'inherits_zero',
        totalWaypoints: waypointsData.length,
      }
    );

    // The next waypoint behavior is handled when that waypoint is computed in _findEffectiveYawForWaypoint:
    // - If route = ALONG_ROUTE: Next waypoint uses _computeModifiedTrajectoryForAutoAdjust
    // - If route = LOCK_YAW_AXIS/MANUAL: Next waypoint inherits 0° (inheritance chain)

    return 0; // Current waypoint always points to North
  }

  /**
   * Finds the effective yaw value for a waypoint considering inheritance rules
   *
   * @private
   */
  private _findEffectiveYawForWaypoint(
    targetIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    // Enhanced logic to check if previous waypoint affects this one through approach settings
    if (targetIndex > 0) {
      const prevApproachSettings = this._getEffectiveApproachSettings(
        targetIndex - 1,
        waypointsData,
        routeDeviceYawMode
      );

      // Check if previous waypoint has approach settings that affect this waypoint
      if (
        !prevApproachSettings.followRoute &&
        prevApproachSettings.nextWaypointApproachMode
      ) {
        const prevMode = prevApproachSettings.nextWaypointApproachMode;

        if (prevMode === NextWaypointApproachMode.AUTO_ADJUST) {
          if (routeDeviceYawMode === DeviceYawRouteSettingsMode.ALONG_ROUTE) {
            // Previous was AUTO_ADJUST with ALONG_ROUTE: this waypoint uses modified trajectory (current → next+1)
            this._debugService.log(
              `🔄 NEXT WAYPOINT EFFECT: Waypoint ${targetIndex} affected by previous AUTO_ADJUST with ALONG_ROUTE`,
              {
                prevIndex: targetIndex - 1,
                prevWaypointMode: 'AUTO_ADJUST',
                routeMode: 'ALONG_ROUTE',
                effect: 'modified_trajectory_calculation',
                calculation: `WP${targetIndex - 1} → WP${targetIndex + 1}`,
                description:
                  'Uses direction from AUTO_ADJUST waypoint to waypoint after target',
              }
            );
            return this._computeModifiedTrajectoryForAutoAdjust(
              targetIndex,
              waypointsData,
              referencePoint
            );
          } else {
            // Previous was AUTO_ADJUST with LOCK_YAW_AXIS/MANUAL: inherit 0°
            this._debugService.log(
              `🔄 NEXT WAYPOINT EFFECT: Waypoint ${targetIndex} inherits 0° from previous AUTO_ADJUST`,
              {
                prevIndex: targetIndex - 1,
                prevWaypointMode: 'AUTO_ADJUST',
                routeMode: routeDeviceYawMode,
                effect: 'inheritance_chain',
                inheritedYaw: 0,
                description:
                  'Creates inheritance chain where subsequent waypoints maintain 0° until overridden',
              }
            );
            return 0;
          }
        }

        if (
          prevMode === NextWaypointApproachMode.ALONG_ROUTE &&
          (routeDeviceYawMode === DeviceYawRouteSettingsMode.LOCK_YAW_AXIS ||
            routeDeviceYawMode === DeviceYawRouteSettingsMode.MANUAL)
        ) {
          // Previous waypoint had ALONG_ROUTE approach with LOCK_YAW_AXIS route:
          // This waypoint gets trajectory-based calculation (limited impact)
          this._debugService.log(
            `Waypoint ${targetIndex} affected by limited ALONG_ROUTE impact`,
            {
              prevIndex: targetIndex - 1,
              behavior: 'trajectory_based_calculation',
            }
          );
          return this._computeAlongRouteYaw(
            targetIndex,
            waypointsData,
            referencePoint
          );
        }

        if (
          prevMode === NextWaypointApproachMode.LOCK_YAW_AXIS ||
          prevMode === NextWaypointApproachMode.MANUAL
        ) {
          // Previous waypoint had LOCK_YAW_AXIS/MANUAL approach setting
          // The current waypoint should inherit the previous waypoint's computed angle
          const prevWaypointYaw = this._findEffectiveYawForWaypoint(
            targetIndex - 1,
            waypointsData,
            referencePoint,
            routeDeviceYawMode
          );
          this._debugService.log(
            `🔄 NEXT WAYPOINT EFFECT: Waypoint ${targetIndex} inherits angle from previous LOCK_YAW_AXIS waypoint`,
            {
              prevIndex: targetIndex - 1,
              prevMode: prevMode,
              inheritedYaw: prevWaypointYaw,
              behavior: 'inherit_previous_waypoint_angle',
              description:
                'Next waypoint inherits the angle that the current waypoint is using',
            }
          );
          return prevWaypointYaw;
        }
      }
    }
    // For ALONG_ROUTE mode, each waypoint computes its own yaw (no inheritance)
    if (routeDeviceYawMode === DeviceYawRouteSettingsMode.ALONG_ROUTE) {
      // Check if this specific waypoint has a custom yaw action
      const waypoint = waypointsData[targetIndex];
      if (waypoint.deviceYawAction) {
        const computedAngle = this._computeAngleFromDeviceYawAction(
          waypoint.deviceYawAction,
          targetIndex,
          waypointsData,
          referencePoint,
          routeDeviceYawMode
        );
        this._debugService.log(
          `Waypoint ${targetIndex} using custom yaw action in ALONG_ROUTE mode`,
          {
            originalValue: waypoint.deviceYawAction.value,
            originalType: waypoint.deviceYawAction.type,
            computedAngle: computedAngle,
          }
        );
        return computedAngle;
      }

      // Otherwise compute trajectory-based yaw
      return this._computeAlongRouteYaw(
        targetIndex,
        waypointsData,
        referencePoint
      );
    }

    // For LOCK_YAW_AXIS and MANUAL modes, find the most recent yaw source
    // Walk backwards from targetIndex to find the most recent waypoint with deviceYawAction
    for (let i = targetIndex; i >= 0; i--) {
      const waypoint = waypointsData[i];
      if (waypoint.deviceYawAction) {
        const computedAngle = this._computeAngleFromDeviceYawAction(
          waypoint.deviceYawAction,
          i,
          waypointsData,
          referencePoint,
          routeDeviceYawMode
        );
        this._debugService.log(
          `Waypoint ${targetIndex} inherits yaw from waypoint ${i}`,
          {
            originalValue: waypoint.deviceYawAction.value,
            originalType: waypoint.deviceYawAction.type,
            sourceYaw: computedAngle,
            targetIndex,
            sourceIndex: i,
          }
        );
        return computedAngle;
      }
    }

    // No waypoint with deviceYawAction found, use reference point → first waypoint angle
    const referenceYaw = this._computeLockYawAxisYaw(
      waypointsData,
      referencePoint
    );
    this._debugService.log(`Waypoint ${targetIndex} uses reference point yaw`, {
      referenceYaw,
      targetIndex,
    });
    return referenceYaw;
  }

  /**
   * Computes modified trajectory for AUTO_ADJUST impact on next waypoint
   * Uses target waypoint → next waypoint trajectory instead of normal previous → current
   *
   * @private
   */
  private _computeModifiedTrajectoryForAutoAdjust(
    targetIndex: number,
    waypointsData: WaypointData[],
    _referencePoint: IPosition
  ): number {
    const autoAdjustIndex = targetIndex - 1; // Previous waypoint with AUTO_ADJUST

    // Check if there's a waypoint after the target (next+1)
    if (targetIndex + 1 < waypointsData.length) {
      // CORRECTED: Use target waypoint → waypoint after target (current → next)
      // This gives the target waypoint the direction from itself to the next waypoint
      const fromPosition = waypointsData[targetIndex].position; // Target waypoint
      const toPosition = waypointsData[targetIndex + 1].position; // Waypoint after target

      this._debugService.log(
        `Computing modified trajectory for AUTO_ADJUST impact on waypoint ${targetIndex}`,
        {
          autoAdjustIndex,
          targetIndex,
          nextPlusOneIndex: targetIndex + 1,
          calculation: 'target_to_next',
          fromPosition: `WP${targetIndex}`,
          toPosition: `WP${targetIndex + 1}`,
          description:
            'Uses current waypoint → next waypoint direction (not previous → current)',
        }
      );

      return this._normalizeYaw(calculateBearing(fromPosition, toPosition));
    } else {
      // Target waypoint is the last one, point to North (0°) only because no next waypoint exists
      this._debugService.log(
        `Waypoint ${targetIndex} is last waypoint after AUTO_ADJUST - pointing to North due to no next waypoint`,
        {
          autoAdjustIndex,
          targetIndex,
          yawValue: 0,
          reason: 'no_waypoint_after_target_for_direction_calculation',
        }
      );

      return 0;
    }
  }

  /**
   * Computes yaw based on trajectory between waypoints (ALONG_ROUTE mode)
   * @private
   */
  private _computeAlongRouteYaw(
    index: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition
  ): number {
    let fromPosition: IPosition;
    let toPosition: IPosition;

    if (index === 0) {
      // First waypoint: use reference point to first waypoint direction
      fromPosition = referencePoint;
      toPosition = waypointsData[0].position;
    } else {
      // Subsequent waypoints: use previous waypoint to current waypoint direction
      fromPosition = waypointsData[index - 1].position;
      toPosition = waypointsData[index].position;
    }

    return this._normalizeYaw(calculateBearing(fromPosition, toPosition));
  }

  /**
   * Computes locked yaw axis based on reference point to first waypoint
   * @private
   */
  private _computeLockYawAxisYaw(
    waypointsData: WaypointData[],
    referencePoint: IPosition
  ): number {
    if (waypointsData.length === 0) {
      this._debugService.warn(
        'No waypoints available for lock yaw axis calculation'
      );
      return 0;
    }

    // Use reference point to first waypoint direction as locked yaw
    return this._normalizeYaw(
      calculateBearing(referencePoint, waypointsData[0].position)
    );
  }

  /**
   * Computes the final angle with north from a device yaw action's original value and type
   * @param deviceYawAction The device yaw action with original value and type
   * @param waypointIndex Index of the waypoint with the device yaw action
   * @param waypointsData All waypoint data for computing base orientation
   * @param referencePoint Mission reference point
   * @param routeDeviceYawMode Current route device yaw mode
   * @returns Final angle with north in degrees
   * @private
   */
  private _computeAngleFromDeviceYawAction(
    deviceYawAction: IWaypointDeviceYawAction,
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    const { value, type } = deviceYawAction;

    if (type === DroneYawActionTypes.NORTH) {
      // For NORTH type, use value directly as absolute angle
      return this._normalizeYaw(value);
    } else if (type === DroneYawActionTypes.FLIGHT_PATH) {
      // For FLIGHT_PATH type, add to base flight path orientation
      try {
        // Compute base device yaw without any deviceYawAction override
        const baseDeviceYaw = this._computeBaseDeviceYawWithoutOverride(
          waypointIndex,
          waypointsData,
          referencePoint,
          routeDeviceYawMode
        );
        const finalAngle = baseDeviceYaw + value;
        return this._normalizeYaw(finalAngle);
      } catch (error) {
        console.warn(
          `Failed to compute base orientation for waypoint ${waypointIndex}, using raw value:`,
          error
        );
        return this._normalizeYaw(value);
      }
    } else {
      // Fallback for unknown types
      return this._normalizeYaw(value);
    }
  }

  /**
   * Computes base device yaw without considering deviceYawAction overrides
   * This is used to get the underlying flight path direction before any user-defined offsets
   * @param waypointIndex Index of the waypoint
   * @param waypointsData All waypoint data
   * @param referencePoint Mission reference point
   * @param routeDeviceYawMode Current route device yaw mode
   * @returns Base device yaw in degrees
   * @private
   */
  private _computeBaseDeviceYawWithoutOverride(
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    // For ALONG_ROUTE mode, compute trajectory-based yaw
    if (routeDeviceYawMode === DeviceYawRouteSettingsMode.ALONG_ROUTE) {
      return this._computeAlongRouteYaw(
        waypointIndex,
        waypointsData,
        referencePoint
      );
    }

    // For LOCK_YAW_AXIS and MANUAL modes, use reference point → first waypoint angle
    return this._computeLockYawAxisYaw(waypointsData, referencePoint);
  }

  /**
   * Normalizes yaw value to -180 to 180 degree range
   * @private
   */
  private _normalizeYaw(yaw: number): number {
    return ((((yaw + 180) % 360) + 360) % 360) - 180;
  }
}
