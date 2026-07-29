// libs/shared/configs/colors.ts

/**
 * ──────────────────────────────────────────────────────────────────────
 * 1) THE RAW DATA (with metadata)
 *
 * Every “shade” or “state” is an object that must include a `value` string
 * (the hex/RGBA). Beyond `value`, you can add any extra fields:
 *   - designToken
 *   - etc.
 *
 * Tailwind will only consume `.value`. Your React dashboard can read
 * the other fields freely.
 * ──────────────────────────────────────────────────────────────────────
 */
const rawColors: Record<string, any> = {
  primary: {
    50: {
      value: '#92A7DE',
      designToken: 'primary-50',
    },
    100: {
      value: '#6D8AD3',
      designToken: 'primary-100',
    },
    200: {
      value: '#496DC8',
      designToken: 'primary-200',
    },
    300: {
      value: '#3A57A0',
      designToken: 'primary-300',
    },
    400: {
      value: '#2C4178',
      designToken: 'primary-400',
    },
    states: {
      hover: {
        value: '#4262B4',
        designToken: 'primary-hover',
      },
      pressed: {
        value: '#3A57A0',
        designToken: 'primary-pressed',
      },
      focused: {
        value: '#496DC8',
        designToken: 'primary-focused',
      },
      disabled: {
        value: '#3D3D3D',
        designToken: 'primary-disabled',
      },
    },
  },

  secondary: {
    50: {
      value: '#4F5C7D',
      designToken: 'secondary-50',
    },
    100: {
      value: '#485575',
      designToken: 'secondary-100',
    },
    200: {
      value: '#414E6D',
      designToken: 'secondary-200',
    },
    300: {
      value: '#394560',
      designToken: 'secondary-300',
    },
    400: {
      value: '#323B55',
      designToken: 'secondary-400',
    },
    states: {
      hover: {
        value: '#465576',
        designToken: 'secondary-hover',
      },
      pressed: {
        value: '#4D5A7A',
        designToken: 'secondary-pressed',
      },
      focused: {
        value: '#465576',
        designToken: 'secondary-focused',
      },
      disabled: {
        value: '#3D3D3D',
        designToken: 'secondary-disabled',
      },
    },
  },

  background: {
    DEFAULT: {
      value: '#111113',
      designToken: 'bg-default',
    },
    'level-1': {
      value: '#1E1E20',
      designToken: 'bg-level-1',
    },
    'level-2': {
      value: '#262627',
      designToken: 'bg-level-2',
    },
    'level-3': {
      value: '#2E2E30',
      designToken: 'bg-level-3',
    },
    'level-4': {
      value: '#373739',
      designToken: 'bg-level-4',
    },
    'level-5': {
      value: '#414143',
      designToken: 'bg-level-5',
    },
    bg: {
      value: '#111113',
      designToken: 'bg-default',
    },
  },

  surface: {
    DEFAULT: {
      value: '#ECECEE14',
      designToken: 'surface-default',
    },
    hover: {
      value: '#ECECEE1A',
      designToken: 'surface-hover',
    },
    pressed: {
      value: '#ECECEE1F',
      designToken: 'surface-pressed',
    },
    focused: {
      value: '#ECECEE1A',
      designToken: 'surface-focused',
    },
    selected: {
      value: '#313649',
      designToken: 'surface-selected',
    },
    'selected-n': {
      value: '#ECECEE14',
      designToken: 'surface-selected-n',
    },
    disabled: {
      value: '#3D3D3D',
      designToken: 'surface-disabled',
    },
  },

  text: {
    1: {
      value: '#FFFFFFD6',
      designToken: 'text-1',
    },
    2: {
      value: '#FFFFFF8A',
      designToken: 'text-2',
    },
    3: {
      value: '#FFFFFF3D',
      designToken: 'text-3',
    },
    disabled: {
      value: '#FFFFFF3D',
      designToken: 'text-disabled',
    },
  },

  // Alias for icon colors (backward compatibility)
  icon: {
    1: {
      value: '#FFFFFFD6',
      designToken: 'icon-1',
    },
    2: {
      value: '#FFFFFF8A',
      designToken: 'icon-2',
    },
    3: {
      value: '#FFFFFF3D',
      designToken: 'icon-3',
    },
  },

  outline: {
    primary: {
      value: '#FFFFFF1F',
      designToken: 'outline-primary',
    },
    secondary: {
      value: '#FFFFFF3D',
      designToken: 'outline-secondary',
    },
    tertiary: {
      value: '#FFFFFF3D',
      designToken: 'outline-tertiary',
    },
    disabled: {
      value: '#FFFFFF3D',
      designToken: 'outline-disabled',
    },
  },

  others: {
    scrim: {
      value: '#00000080',
      designToken: 'scrim-default',
    },
    'outline-tertiary-bright': {
      value: '#FFFFFF3D',
      designToken: 'outline-tertiary-bright',
    },
  },

  success: {
    50: {
      value: '#78CEA7',
      designToken: 'success-50',
    },
    40: {
      value: '#4BBE8A',
      designToken: 'success-40',
    },
    30: {
      value: '#1EAE6D',
      designToken: 'success-30',
    },
    20: {
      value: '#188B57',
      designToken: 'success-20',
    },
    10: {
      value: '#126841',
      designToken: 'success-10',
    },
    container: {
      value: '#1EAE6D33',
      designToken: 'success-container',
    },
  },

  error: {
    50: {
      value: '#FB9189',
      designToken: 'error-50',
    },
    40: {
      value: '#F96C61',
      designToken: 'error-40',
    },
    30: {
      value: '#F8473A',
      designToken: 'error-30',
    },
    20: {
      value: '#C6392E',
      designToken: 'error-20',
    },
    10: {
      value: '#952B23',
      designToken: 'error-10',
    },
    container: {
      value: '#F8473A33',
      designToken: 'error-container',
    },
  },

  caution: {
    50: {
      value: '#FED35D',
      designToken: 'caution-50',
    },
    40: {
      value: '#FEC43E',
      designToken: 'caution-40',
    },
    30: {
      value: '#FDB022',
      designToken: 'caution-30',
    },
    20: {
      value: '#F79009',
      designToken: 'caution-20',
    },
    10: {
      value: '#DC6803',
      designToken: 'caution-10',
    },
    container: {
      value: '#FDB02226',
      designToken: 'caution-container',
    },
  },

  warning: {
    50: {
      value: '#F7A47A',
      designToken: 'warning-50',
    },
    40: {
      value: '#F4854E',
      designToken: 'warning-40',
    },
    30: {
      value: '#F16722',
      designToken: 'warning-30',
    },
    20: {
      value: '#C1521B',
      designToken: 'warning-20',
    },
    10: {
      value: '#913E14',
      designToken: 'warning-10',
    },
    container: {
      value: '#F1672233',
      designToken: 'warning-container',
    },
  },

  info: {
    50: {
      value: '#99CCFF',
      designToken: 'info-50',
    },
    40: {
      value: '#5D9FE2',
      designToken: 'info-40',
    },
    30: {
      value: '#3399FF',
      designToken: 'info-30',
    },
    20: {
      value: '#0080FF',
      designToken: 'info-20',
    },
    10: {
      value: '#414E6D',
      designToken: 'info-10',
    },
    container: {
      value: '#3399FF33',
      designToken: 'info-container',
    },
  },
};

/**
 * ──────────────────────────────────────────────────────────────────────
 * 2) UTILITY: stripMetadata()
 *
 * Recursively walk the nested `rawColors` object and extract only the
 * `.value` strings. Tailwind needs:
 *   {
 *     primary: { "50": "#91A7DE", "100": "#6D8AD3", … },
 *     …
 *   }
 *
 * This function takes `rawColors` and returns exactly that shape.
 * ──────────────────────────────────────────────────────────────────────
 */
function stripMetadata(obj: Record<string, any>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => {
      if (val && typeof val === 'object' && 'value' in val) {
        // Leaf node: { value: "#...", designToken: "...", … }
        return [key, val.value];
      } else if (typeof val === 'object') {
        // Nested group: recursively strip deeper.
        return [key, stripMetadata(val)];
      } else {
        // In case someone accidentally placed a raw string.
        return [key, val];
      }
    })
  );
}

/**
 * ──────────────────────────────────────────────────────────────────────
 * 3) UTILITY: getTailwindColors()
 *
 * Exported for Tailwind to consume at build time:
 *
 *   theme.extend.colors = getTailwindColors()
 *
 * i.e. exactly equal to stripMetadata(rawColors) so Tailwind only sees `{ …: "#hex" }`.
 * ──────────────────────────────────────────────────────────────────────
 */
function getTailwindColors(): Record<string, string> {
  return stripMetadata(rawColors);
}

/**
 * ──────────────────────────────────────────────────────────────────────
 * 4) UTILITY: flattenColors()
 *
 * Often in React dashboards you want a flat array of { name, value, …metadata } so you can:
 *
 *   [ { name: "primary-50",   value: "#91A7DE", …meta },
 *     { name: "primary-100",  value: "#6D8AD3", …meta },
 *     …,
 *     { name: "secondary-50", value: "#4F5C7D", …meta }, … ]
 *
 * This version preserves all the metadata, not just the `.value`.
 *
 * Usage:
 *   const allColorPairs = flattenColors(rawColors)
 *   // each entry is: { name: "groupName-shadeKey", value: string, designToken?: string, … }
 * ──────────────────────────────────────────────────────────────────────
 */
function flattenColors(obj: Record<string, any>, prefix = '') {
  return Object.entries(obj).flatMap(([key, val]) => {
    const name = prefix ? `${prefix}-${key}` : key;

    if (val && typeof val === 'object' && 'value' in val) {
      // Leaf node with metadata
      return [
        {
          name,
          value: val.value,
          // Copy all other fields, except `value`
          ...Object.fromEntries(
            Object.entries(val).filter(([k]) => k !== 'value')
          ),
        },
      ];
    } else if (typeof val === 'object') {
      // Nested group (e.g. primary: { "50": {...}, "100": {...}, … })
      return flattenColors(val, name);
    }
    // (fallback if it's a string)
    return [{ name, value: val }];
  });
}

/**
 * Extracts the opacity (alpha) from an 8-digit hex code and returns it as a percentage string.
 * @param {string} hexCode - A string like "#RRGGBBAA" or "RRGGBBAA".
 * @param {number} [decimalPlaces=2] - Number of decimal places for the percentage.
 * @returns {string} A percentage string, e.g. "83.92%".
 * @throws {Error} If the input is not exactly 8 hex digits (after removing "#").
 */
function getOpacityPercentFromHex(hexCode: string, decimalPlaces = 2) {
  // Remove leading "#" if present
  if (hexCode.startsWith('#')) {
    hexCode = hexCode.slice(1);
  }

  // Must be exactly 8 characters now (RRGGBBAA)
  if (hexCode.length !== 8) {
    return '100%';
  }

  // Take the last two characters (AA)
  const alphaHex = hexCode.slice(6, 8);
  // Parse hex to decimal (0–255)
  const alphaDecimal = parseInt(alphaHex, 16);
  if (Number.isNaN(alphaDecimal)) {
    throw new Error(`Invalid hex value for alpha: "${alphaHex}"`);
  }

  // Compute percentage: (alphaDecimal / 255) * 100
  const percent = (alphaDecimal / 255) * 100;
  // Format with the desired number of decimal places
  return percent.toFixed(decimalPlaces) + '%';
}

export default {
  rawColors,
  getTailwindColors,
  flattenColors,
  getOpacityPercentFromHex,
};
