import { useMemo } from 'react';
import convert from 'convert-units';

// Unit type constants
export enum UnitTypeConstants {
  DISTANCE = 'distance',
  SPEED = 'speed',
  TIME = 'time',
  TEMPERATURE = 'temperature',
  AREA = 'area',
  DYNAMIC = 'dynamic',
  ANGULAR_SPEED = 'angSpeed',
  PERCENTAGE = 'percentage',
}

// Distance units
export enum DistanceUnitsConstants {
  mm = 'mm',
  cm = 'cm',
  m = 'm',
  inches = 'in',
  km = 'km',
  ft = 'ft',
  mi = 'mi',
  yd = 'yd',
}

// Area units
export enum AreaUnitsConstants {
  mm2 = 'mm2',
  cm2 = 'cm2',
  m2 = 'm2',
  ha = 'ha',
  km2 = 'km2',
  in2 = 'in2',
  ft2 = 'ft2',
  ac = 'ac',
  mi2 = 'mi2',
}

// Speed units
export enum SpeedUnitsConstants {
  m_s = 'm/s',
  km_h = 'km/h',
  m_h = 'm/h',
  knot = 'knot',
  ft_s = 'ft/s',
}

// Temperature units
export enum TemperatureUnitsConstants {
  C = 'C',
  F = 'F',
  K = 'K',
  R = 'R',
}

// Angular speed units
export enum AngularSpeedUnitsConstants {
  deg_s = '°/s',
}

// Time units
export enum TimeUnitsConstants {
  ns = 'ns',
  mu = 'mu',
  ms = 'ms',
  s = 's',
  min = 'min',
  h = 'h',
  d = 'd',
  week = 'week',
  month = 'month',
  year = 'year',
}

// Dynamic units
export enum DynamicUnitsConstants {
  cm_px = 'cm/px',
  in_px = 'in/px',
}

// Percentage units
export enum percentageUnitsConstants {
  percentage = '%',
}

// Default unit system
export const defaultUnit = {
  distance: DistanceUnitsConstants.m,
  area: AreaUnitsConstants.m2,
  speed: SpeedUnitsConstants.m_s,
  temperature: TemperatureUnitsConstants.C,
  time: TimeUnitsConstants.s,
  angSpeed: AngularSpeedUnitsConstants.deg_s,
  percentage: percentageUnitsConstants.percentage,
};

// Unit title mappings for display
export const unitTitleMappings = {
  [UnitTypeConstants.DISTANCE]: {
    [DistanceUnitsConstants.mm]: 'mm',
    [DistanceUnitsConstants.cm]: 'cm',
    [DistanceUnitsConstants.m]: 'm',
    [DistanceUnitsConstants.km]: 'km',
    [DistanceUnitsConstants.inches]: 'in',
    [DistanceUnitsConstants.ft]: 'ft',
    [DistanceUnitsConstants.mi]: 'mi',
    [DistanceUnitsConstants.yd]: 'yd',
  },
  [UnitTypeConstants.AREA]: {
    [AreaUnitsConstants.mm2]: 'mm²',
    [AreaUnitsConstants.cm2]: 'cm²',
    [AreaUnitsConstants.m2]: 'm²',
    [AreaUnitsConstants.ha]: 'ha',
    [AreaUnitsConstants.km2]: 'km²',
    [AreaUnitsConstants.in2]: 'in²',
    [AreaUnitsConstants.ft2]: 'ft²',
    [AreaUnitsConstants.ac]: 'acre',
    [AreaUnitsConstants.mi2]: 'mi²',
  },
  [UnitTypeConstants.SPEED]: {
    [SpeedUnitsConstants.m_s]: 'm/s',
    [SpeedUnitsConstants.km_h]: 'km/h',
    [SpeedUnitsConstants.m_h]: 'mph',
    [SpeedUnitsConstants.knot]: 'knot',
    [SpeedUnitsConstants.ft_s]: 'ft/s',
  },
  [UnitTypeConstants.TEMPERATURE]: {
    [TemperatureUnitsConstants.C]: '°C',
    [TemperatureUnitsConstants.F]: '°F',
    [TemperatureUnitsConstants.K]: 'K',
    [TemperatureUnitsConstants.R]: 'R',
  },
  [UnitTypeConstants.ANGULAR_SPEED]: {
    [AngularSpeedUnitsConstants.deg_s]: '°/s',
  },
  [UnitTypeConstants.TIME]: {
    [TimeUnitsConstants.ns]: 'ns',
    [TimeUnitsConstants.mu]: 'μs',
    [TimeUnitsConstants.ms]: 'ms',
    [TimeUnitsConstants.s]: 's',
    [TimeUnitsConstants.min]: 'min',
    [TimeUnitsConstants.h]: 'h',
    [TimeUnitsConstants.d]: 'd',
    [TimeUnitsConstants.week]: 'week',
    [TimeUnitsConstants.month]: 'month',
    [TimeUnitsConstants.year]: 'year',
  },
  [UnitTypeConstants.DYNAMIC]: {
    [DynamicUnitsConstants.cm_px]: 'cm/px',
    [DynamicUnitsConstants.in_px]: 'in/px',
  },
  [UnitTypeConstants.PERCENTAGE]: {
    [percentageUnitsConstants.percentage]: '%',
  },
};

// Define the interface for user unit preferences
export interface UnitPreferences {
  distance: string;
  area: string;
  speed?: string;
  time?: string;
  temperature: string;
  angSpeed?: string;
  percentage?: string;
}

// Define conversion options interface
export interface ConversionOptions {
  fixedDecimal?: number;
  roundOff?: boolean;
  attachUnits?: boolean;
  zeroException?: boolean;
  alternateReturn?: string;
  reverseTransform?: boolean;
}

export function useUnitConverter(
  userPreferences: Partial<UnitPreferences> = {}
) {
  // Merge user preferences with default units
  const currentUnitSystem: UnitPreferences = {
    distance: userPreferences.distance || defaultUnit.distance,
    area: userPreferences.area || defaultUnit.area,
    speed: userPreferences.speed || defaultUnit.speed,
    time: userPreferences.time || defaultUnit.time,
    temperature: userPreferences.temperature || defaultUnit.temperature,
    angSpeed: userPreferences.angSpeed || defaultUnit.angSpeed,
    percentage: userPreferences.percentage || defaultUnit.percentage,
  };

  // Determine dynamic unit based on current distance unit
  const dynamicUnit = useMemo(() => {
    if (
      currentUnitSystem.distance === DistanceUnitsConstants.m ||
      currentUnitSystem.distance === DistanceUnitsConstants.km
    ) {
      return DistanceUnitsConstants.cm;
    } else {
      return DistanceUnitsConstants.inches;
    }
  }, [currentUnitSystem.distance]);

  /**
   * Convert a value from one unit to another
   *
   * @param {string|number} value - The value to convert
   * @param {UnitTypeConstants} type - The unit type constant (distance, area, etc.)
   * @param {number} [fixedDecimal=1] - Number of decimal places
   * @param {boolean} [roundOff=true] - Whether to round the result
   * @param {boolean} [attachUnits=true] - Whether to include unit name in result
   * @param {boolean} [zeroException=true] - Whether to allow zero values
   * @param {string} [alternateReturn='-'] - Fallback return value on error
   * @param {boolean} [reverseTransform=false] - Whether to convert from current to default (instead of default to current)
   * @returns {string} Converted value as a string
   */
  const convertUnit = (
    value: string | number,
    type: UnitTypeConstants,
    fixedDecimal = 1,
    roundOff = true,
    attachUnits = true,
    zeroException = true,
    alternateReturn = '-',
    reverseTransform = false
  ) => {
    let toReturn: string | null = null;
    let fromUnit: string | undefined;
    let toUnit: string | undefined;

    // Determine from/to units based on unit type and direction
    if (type === UnitTypeConstants.DYNAMIC) {
      fromUnit = reverseTransform ? dynamicUnit : DistanceUnitsConstants.cm;
      toUnit = reverseTransform ? DistanceUnitsConstants.cm : dynamicUnit;
    } else {
      fromUnit = reverseTransform
        ? (currentUnitSystem[type as keyof UnitPreferences] as string)
        : (defaultUnit[type as keyof typeof defaultUnit] as string);
      toUnit = reverseTransform
        ? (defaultUnit[type as keyof typeof defaultUnit] as string)
        : (currentUnitSystem[type as keyof UnitPreferences] as string);
    }

    try {
      if (value === null || value === undefined) {
        throw new Error('Value is not defined');
      } else if (!fromUnit || !toUnit) {
        throw new Error('Please provide both from and to units');
      }

      const valueParsed = parseFloat(value.toString());
      let converted: number;

      if (fromUnit !== toUnit) {
        converted = convert(valueParsed).from(fromUnit).to(toUnit);
      } else {
        converted = valueParsed;
      }

      let convertedStr = converted.toString();

      if (!converted && converted !== 0) {
        throw new Error('unable to convert');
      }

      if (converted === 0 && !zeroException) {
        throw new Error('zero exception is not true');
      }

      // Special formatting for area
      if (type === UnitTypeConstants.AREA) {
        convertedStr = converted.toFixed(2);
      }

      // Apply decimal formatting
      if (
        type !== UnitTypeConstants.AREA &&
        (fixedDecimal || fixedDecimal === 0) &&
        roundOff
      ) {
        convertedStr = converted.toFixed(fixedDecimal);
      }

      // Special handling for large meter values (convert to km for better readability)
      if (
        type === UnitTypeConstants.DISTANCE &&
        toUnit === DistanceUnitsConstants.m &&
        !reverseTransform &&
        converted >= 1000
      ) {
        // Convert to kilometers
        converted = converted / 1000;
        convertedStr = converted.toFixed(
          fixedDecimal !== undefined ? fixedDecimal : 2
        );
        toUnit = DistanceUnitsConstants.km;
      }

      // Attach unit labels if requested
      if (attachUnits) {
        // Safely access unit mappings with type checking
        const mappings = unitTitleMappings[type] as Record<string, string>;
        const unitTitle =
          mappings && toUnit ? mappings[toUnit] || toUnit : toUnit;
        convertedStr = `${Number(convertedStr)} ${unitTitle}`;
      }

      toReturn = convertedStr;
    } catch (error) {
      toReturn = null;
    }

    // Handle fallback cases
    if (toReturn === null && alternateReturn) {
      toReturn = alternateReturn;
    }

    if (toReturn === null && !alternateReturn) {
      toReturn = `${value} ${fromUnit}`;
    }

    return toReturn;
  };

  // Use the exported ConversionOptions interface

  // Optimized version for commonly used conversion patterns
  const convertDistance = (
    value: string | number,
    options: ConversionOptions = {}
  ) => {
    return convertUnit(
      value,
      UnitTypeConstants.DISTANCE,
      options.fixedDecimal,
      options.roundOff,
      options.attachUnits,
      options.zeroException,
      options.alternateReturn,
      options.reverseTransform
    );
  };

  const convertArea = (
    value: string | number,
    options: ConversionOptions = {}
  ) => {
    return convertUnit(
      value,
      UnitTypeConstants.AREA,
      options.fixedDecimal !== undefined ? options.fixedDecimal : 2,
      options.roundOff,
      options.attachUnits,
      options.zeroException,
      options.alternateReturn,
      options.reverseTransform
    );
  };

  const convertSpeed = (
    value: string | number,
    options: ConversionOptions = {}
  ) => {
    return convertUnit(
      value,
      UnitTypeConstants.SPEED,
      options.fixedDecimal !== undefined ? options.fixedDecimal : 1,
      options.roundOff,
      options.attachUnits,
      options.zeroException,
      options.alternateReturn,
      options.reverseTransform
    );
  };

  const convertTemperature = (
    value: string | number,
    options: ConversionOptions = {}
  ) => {
    return convertUnit(
      value,
      UnitTypeConstants.TEMPERATURE,
      options.fixedDecimal !== undefined ? options.fixedDecimal : 1,
      options.roundOff,
      options.attachUnits,
      options.zeroException,
      options.alternateReturn,
      options.reverseTransform
    );
  };

  return {
    convertUnit,
    convertDistance,
    convertArea,
    convertSpeed,
    convertTemperature,
    currentUnitSystem,
    dynamicUnit,
  };
}
