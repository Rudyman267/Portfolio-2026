/**
 * Interface for RGB color representation
 */
export interface IRGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a?: number; // 0-1
}

/**
 * Convert a hex color string to RGB
 * @param hex Hex color string (e.g., '#FF5733' or '#FF5733FF' with alpha)
 * @returns RGB color object
 */
export function hexToRgb(hex: string): IRGB {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  let r,
    g,
    b,
    a = 1;

  if (hex.length === 3) {
    // Convert 3-char hex to 6-char (e.g., #F00 to #FF0000)
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 4) {
    // Convert 4-char hex to 8-char (e.g., #F00F to #FF0000FF)
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    a = parseInt(hex.charAt(3) + hex.charAt(3), 16) / 255;
  } else if (hex.length === 6) {
    // Standard 6-char hex
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (hex.length === 8) {
    // 8-char hex with alpha
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    a = parseInt(hex.substring(6, 8), 16) / 255;
  } else {
    throw new Error(`Invalid hex color format: ${hex}`);
  }

  return { r, g, b, a };
}

/**
 * Convert RGB color to hex string
 * @param rgb RGB color object
 * @param includeAlpha Whether to include alpha channel in hex string
 * @returns Hex color string (e.g., '#FF5733' or '#FF5733FF' with alpha)
 */
export function rgbToHex(rgb: IRGB, includeAlpha = true): string {
  const { r, g, b, a = 1 } = rgb;

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  if (includeAlpha && a < 1) {
    const aHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Convert a CSS color string to RGB
 * @param color CSS color string (e.g., 'rgb(255, 87, 51)', 'rgba(255, 87, 51, 0.5)', or 'red')
 * @returns RGB color object
 */
export function cssColorToRgb(color: string): IRGB {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  if (color.startsWith('rgb')) {
    // Extract numbers from rgb/rgba string
    const numbers = color.match(/\d+(\.\d+)?/g);
    if (!numbers || numbers.length < 3) {
      throw new Error(`Invalid rgb color format: ${color}`);
    }

    const r = parseInt(numbers[0], 10);
    const g = parseInt(numbers[1], 10);
    const b = parseInt(numbers[2], 10);
    const a = numbers.length >= 4 ? parseFloat(numbers[3]) : 1;

    return { r, g, b, a };
  }

  // For named colors, create a temporary element to get the RGB value
  const tempElem = document.createElement('div');
  tempElem.style.color = color;
  document.body.appendChild(tempElem);
  const computedColor = window.getComputedStyle(tempElem).color;
  document.body.removeChild(tempElem);

  // Recursively call this function to parse the computed rgb/rgba value
  return cssColorToRgb(computedColor);
}

/**
 * Lighten a color by a specified percentage
 * @param rgb RGB color object
 * @param percentage Percentage to lighten (0-100)
 * @returns Lightened RGB color
 */
export function lightenColor(rgb: IRGB, percentage: number): IRGB {
  const factor = 1 + percentage / 100;
  return {
    r: Math.min(255, Math.round(rgb.r * factor)),
    g: Math.min(255, Math.round(rgb.g * factor)),
    b: Math.min(255, Math.round(rgb.b * factor)),
    a: rgb.a,
  };
}

/**
 * Darken a color by a specified percentage
 * @param rgb RGB color object
 * @param percentage Percentage to darken (0-100)
 * @returns Darkened RGB color
 */
export function darkenColor(rgb: IRGB, percentage: number): IRGB {
  const factor = 1 - percentage / 100;
  return {
    r: Math.max(0, Math.round(rgb.r * factor)),
    g: Math.max(0, Math.round(rgb.g * factor)),
    b: Math.max(0, Math.round(rgb.b * factor)),
    a: rgb.a,
  };
}

/**
 * Blend two colors together
 * @param color1 First RGB color
 * @param color2 Second RGB color
 * @param ratio Blend ratio (0 = all color1, 1 = all color2)
 * @returns Blended RGB color
 */
export function blendColors(color1: IRGB, color2: IRGB, ratio: number): IRGB {
  const r = Math.round(color1.r * (1 - ratio) + color2.r * ratio);
  const g = Math.round(color1.g * (1 - ratio) + color2.g * ratio);
  const b = Math.round(color1.b * (1 - ratio) + color2.b * ratio);
  const a =
    color1.a !== undefined && color2.a !== undefined
      ? color1.a * (1 - ratio) + color2.a * ratio
      : color1.a !== undefined
      ? color1.a
      : color2.a;

  return { r, g, b, a };
}
