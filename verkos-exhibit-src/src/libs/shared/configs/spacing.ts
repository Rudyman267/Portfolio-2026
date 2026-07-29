// libs/shared/configs/spacing.ts

/**
 * ──────────────────────────────────────────────────────────────────────
 * 1) SPACING TOKENS MAPPING TO TAILWIND
 *
 * This file maps design tokens to Tailwind's default spacing scale.
 * Unlike colors and typography, we don't override Tailwind's spacing system
 * but rather document how our design tokens map to Tailwind's utility classes.
 *
 * Every spacing token includes:
 *   - tailwindKey: The key in Tailwind's spacing scale
 *   - value: The CSS value (in rem)
 *   - px: Pixel equivalent
 *   - designToken: Human readable name
 *
 * https://v3.tailwindcss.com/docs/customizing-spacing
 * ──────────────────────────────────────────────────────────────────────
 */
const spacingTokens = {
  '0': {
    tailwindKey: '0',
    value: '0rem',
    px: '0px',
    designToken: 'Size-0',
  },
  '50': {
    tailwindKey: '0.5',
    value: '0.125rem',
    px: '2px',
    designToken: 'Size-50',
  },
  '100': {
    tailwindKey: '1',
    value: '0.25rem',
    px: '4px',
    designToken: 'Size-100',
  },
  '150': {
    tailwindKey: '1.5',
    value: '0.375rem',
    px: '6px',
    designToken: 'Size-150',
  },
  '200': {
    tailwindKey: '2',
    value: '0.5rem',
    px: '8px',
    designToken: 'Size-200',
  },
  '300': {
    tailwindKey: '3',
    value: '0.75rem',
    px: '12px',
    designToken: 'Size-300',
  },
  '400': {
    tailwindKey: '4',
    value: '1rem',
    px: '16px',
    designToken: 'Size-400',
  },
  '500': {
    tailwindKey: '5',
    value: '1.25rem',
    px: '20px',
    designToken: 'Size-500',
  },
  '600': {
    tailwindKey: '6',
    value: '1.5rem',
    px: '24px',
    designToken: 'Size-600',
  },
  '700': {
    tailwindKey: '7',
    value: '1.75rem',
    px: '28px',
    designToken: 'Size-700',
  },
  '800': {
    tailwindKey: '8',
    value: '2rem',
    px: '32px',
    designToken: 'Size-800',
  },
  '900': {
    tailwindKey: '9',
    value: '2.25rem',
    px: '36px',
    designToken: 'Size-900',
  },
  '1000': {
    tailwindKey: '10',
    value: '2.5rem',
    px: '40px',
    designToken: 'Size-1000',
  },
  '1100': {
    tailwindKey: '12',
    value: '3rem',
    px: '48px',
    designToken: 'Size-1100',
  },
  '1500': {
    tailwindKey: '15',
    value: '3.75rem',
    px: '60px',
    designToken: 'Size-1500',
  },
  '1600': {
    tailwindKey: '16',
    value: '4rem',
    px: '64px',
    designToken: 'Size-1600',
  },
  '2000': {
    tailwindKey: '20',
    value: '5rem',
    px: '80px',
    designToken: 'Size-2000',
  },
  '2400': {
    tailwindKey: '24',
    value: '6rem',
    px: '96px',
    designToken: 'Size-2400',
  },
  full: {
    tailwindKey: 'full',
    value: '100%',
    px: 'variable',
    designToken: 'Full',
  },
};

/**
 * ──────────────────────────────────────────────────────────────────────
 * 2) UTILITY: flattenSpacing()
 *
 * Returns a flat array of spacing values for use in React components.
 * ──────────────────────────────────────────────────────────────────────
 */
function flattenSpacing() {
  return Object.entries(spacingTokens).map(([key, details]) => ({
    key,
    ...details,
  }));
}

/**
 * This function is not used for spacing because we're not extending
 * Tailwind's spacing like we do with colors and typography.
 * It's included for API consistency across config files.
 */
function getTailwindSpacing() {
  return {}; // Return empty object - we're using Tailwind's defaults
}

export default {
  spacingTokens,
  flattenSpacing,
  getTailwindSpacing,
};
