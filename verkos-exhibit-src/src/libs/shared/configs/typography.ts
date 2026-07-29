// libs/shared/configs/typography.ts

/**
 * ──────────────────────────────────────────────────────────────────────
 * 1) THE RAW DATA (with metadata)
 *
 * Every typography style is an object that includes properties like:
 *   - fontFamily
 *   - fontSize
 *   - fontWeight
 *   - lineHeight
 *   - letterSpacing (optional)
 *   - designToken (optional)
 *
 * Tailwind will consume all style properties. Your React dashboard can read
 * the metadata fields like designToken.
 * ──────────────────────────────────────────────────────────────────────
 */
const rawTypography = {
  mega: {
    fontFamily: 'Inter',
    fontSize: '1.25rem',
    fontWeight: '500',
    lineHeight: '1.5rem',
    letterSpacing: '-0.0125rem',
    designToken: 'Mega',
    className: 'fb-mega',
  },
  title: {
    'title1-semi': {
      fontFamily: 'Inter',
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.5rem',
      letterSpacing: '-0.00675rem',
      designToken: 'Title 1 Semi',
      className: 'fb-title1-semi',
    },
    'title2-medium': {
      fontFamily: 'Inter',
      fontSize: '1.125rem',
      fontWeight: '500',
      lineHeight: '1.5rem',
      letterSpacing: '-0.00675rem',
      designToken: 'Title 2 Medium',
      className: 'fb-title2-medium',
    },
    'title1-medium': {
      fontFamily: 'Inter',
      fontSize: '1rem',
      fontWeight: '500',
      lineHeight: '1.5rem',
      letterSpacing: '-0.006rem',
      designToken: 'Title 1 Medium',
      className: 'fb-title1-medium',
    },
    'title2-regular': {
      fontFamily: 'Inter',
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5rem',
      letterSpacing: '-0.006rem',
      designToken: 'Title 2 Regular',
      className: 'fb-title2-regular',
    },
  },
  body: {
    'body1-medium': {
      fontFamily: 'Inter',
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
      letterSpacing: '-0.00263rem',
      designToken: 'Body 1 Medium',
      className: 'fb-body1-medium',
    },
    'body2-regular': {
      fontFamily: 'Inter',
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
      letterSpacing: '-0.00263rem',
      designToken: 'Body 2 Regular',
      className: 'fb-body2-regular',
    },
    'body3-mono': {
      fontFamily: 'Fira Code',
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
      letterSpacing: '0.00131rem',
      designToken: 'Body 3 Mono',
      className: 'fb-body3-mono',
    },
    'body4-medium': {
      fontFamily: 'Inter',
      fontSize: '0.75rem',
      fontWeight: '500',
      lineHeight: '1rem',
      letterSpacing: '-0.00225rem',
      designToken: 'Body 4 Medium',
      className: 'fb-body4-medium',
    },
    'body5-regular': {
      fontFamily: 'Inter',
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
      letterSpacing: '-0.00225rem',
      designToken: 'Body 5 Regular',
      className: 'fb-body5-regular',
    },
    'body-6': {
      fontFamily: 'Inter',
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
      letterSpacing: '-0.00225rem',
      designToken: 'Body 6',
      className: 'fb-body6',
    },
  },
  tiny: {
    'tiny1-medium': {
      fontFamily: 'Inter',
      fontSize: '0.6875rem',
      fontWeight: '500',
      lineHeight: '0.875rem',
      letterSpacing: '-0.00206rem',
      designToken: 'Tiny 1 Medium',
      className: 'fb-tiny1-medium',
    },
    'tiny2-medium': {
      fontFamily: 'Inter',
      fontSize: '0.625rem',
      fontWeight: '500',
      lineHeight: '0.875rem',
      letterSpacing: '-0.00188rem',
      designToken: 'Tiny 2 Medium',
      className: 'fb-tiny2-medium',
    },
    'tiny-1': {
      fontFamily: 'Inter',
      fontSize: '0.6875rem', // 11px
      fontWeight: '500',
      lineHeight: '0.875rem',
      letterSpacing: '-0.00206rem',
      designToken: 'Tiny 1',
      className: 'fb-tiny-1',
    },
    'tiny-2': {
      fontFamily: 'Inter',
      fontSize: '0.625rem', // 10px
      fontWeight: '500',
      lineHeight: '0.875rem',
      letterSpacing: '-0.00188rem',
      designToken: 'Tiny 2',
      className: 'fb-tiny-2',
    },
    'tiny-3': {
      fontFamily: 'Inter',
      fontSize: '0.625rem', // 10px
      fontWeight: '400',
      lineHeight: '0.875rem',
      letterSpacing: '-0.00188rem',
      designToken: 'Tiny 3',
      className: 'fb-tiny-3',
    },
  },

  // Additional typography tokens from mission-planner config
  legacy: {
    heading: {
      fontFamily: 'Inter',
      fontSize: 'clamp(1.25rem, 1rem + 0.75vw, 2.5rem)', // text-xl
      fontWeight: '500', // font-medium
      lineHeight: '1.5',
      letterSpacing: '-0.0125rem',
      designToken: 'Heading',
      className: 'fb-heading',
    },
    'title-1': {
      fontFamily: 'Inter',
      fontSize: 'clamp(1.125rem, 0.9rem + 0.5vw, 2rem)', // text-lg
      fontWeight: '600', // font-semibold
      lineHeight: '1.5',
      letterSpacing: '-0.00675rem',
      designToken: 'Title 1',
      className: 'fb-title-1',
    },
    'title-2': {
      fontFamily: 'Inter',
      fontSize: 'clamp(1.125rem, 0.9rem + 0.5vw, 2rem)', // text-lg
      fontWeight: '500', // font-medium
      lineHeight: '1.5',
      letterSpacing: '-0.00675rem',
      designToken: 'Title 2',
      className: 'fb-title-2',
    },
    'title-3': {
      fontFamily: 'Inter',
      fontSize: 'clamp(1rem, 0.8rem + 0.4vw, 1.75rem)', // text-base
      fontWeight: '500', // font-medium
      lineHeight: '1.5',
      letterSpacing: '-0.006rem',
      designToken: 'Title 3',
      className: 'fb-title-3',
    },
    'title-4': {
      fontFamily: 'Inter',
      fontSize: 'clamp(1rem, 0.8rem + 0.4vw, 1.75rem)', // text-base
      fontWeight: '400', // font-normal
      lineHeight: '1.5',
      letterSpacing: '-0.006rem',
      designToken: 'Title 4',
      className: 'fb-title-4',
    },
    'body-1': {
      fontFamily: 'Inter',
      fontSize: 'clamp(0.875rem, 0.8rem + 0.2vw, 1.0625rem)', // text-sm
      fontWeight: '500', // font-medium
      lineHeight: '1.5',
      letterSpacing: '-0.00263rem',
      designToken: 'Body 1',
      className: 'fb-body-1',
    },
    'body-2': {
      fontFamily: 'Inter',
      fontSize: 'clamp(0.875rem, 0.8rem + 0.2vw, 1.0625rem)', // text-sm
      fontWeight: '400', // font-normal
      lineHeight: '1.5',
      letterSpacing: '-0.00263rem',
      designToken: 'Body 2',
      className: 'fb-body-2',
    },
    'body-3': {
      fontFamily: 'monospace', // font-mono
      fontSize: 'clamp(0.875rem, 0.8rem + 0.2vw, 1.0625rem)', // text-sm
      fontWeight: '400', // font-normal
      lineHeight: '1.5',
      letterSpacing: '0.00131rem',
      designToken: 'Body 3',
      className: 'fb-body-3',
    },
    'body-4': {
      fontFamily: 'Inter',
      fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.9rem)', // text-xs
      fontWeight: '500', // font-medium
      lineHeight: '1.5',
      letterSpacing: '-0.00225rem',
      designToken: 'Body 4',
      className: 'fb-body-4',
    },
    'body-5': {
      fontFamily: 'Inter',
      fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.9rem)', // text-xs
      fontWeight: '400', // font-normal
      lineHeight: '1.5',
      letterSpacing: '-0.00225rem',
      designToken: 'Body 5',
      className: 'fb-body-5',
    },
    'body-6': {
      fontFamily: 'Inter',
      fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.9rem)', // text-xs
      fontWeight: '400', // font-normal
      lineHeight: '1.5',
      letterSpacing: '-0.00225rem',
      designToken: 'Body 6',
      className: 'fb-body-6',
    },
  },
};

/**
 * ──────────────────────────────────────────────────────────────────────
 * 2) UTILITY: getTypographyUtilities()
 *
 * Returns utilities for use in Tailwind CSS.
 * Each utility will be prefixed with 'fb-'.
 * ──────────────────────────────────────────────────────────────────────
 */
interface TypographyStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  fontStyle?: string;
  designToken?: string;
  className?: string;
}

type TypographyUtilities = Record<string, Partial<TypographyStyle>>;

function getTypographyUtilities(): TypographyUtilities {
  const utilities: TypographyUtilities = {};

  // Process the raw typography data to create Tailwind utilities
  function processTypography(obj: Record<string, unknown>, prefix = '') {
    Object.entries(obj).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'fontFamily' in value) {
        // This is a leaf node with typography styles
        const typedValue = value as TypographyStyle;
        // Use the designToken if available, otherwise build a class name from the key
        const className = typedValue.className
          ? `.${typedValue.className}`
          : `.fb-${prefix ? `${prefix}-` : ''}${key}`;

        utilities[className] = {
          fontFamily: typedValue.fontFamily,
          fontSize: typedValue.fontSize,
          fontWeight: typedValue.fontWeight,
          lineHeight: typedValue.lineHeight,
          ...(typedValue.letterSpacing
            ? { letterSpacing: typedValue.letterSpacing }
            : {}),
          fontStyle: typedValue.fontStyle,
        };
      } else if (typeof value === 'object' && value !== null) {
        // This is a nested group
        processTypography(value as Record<string, unknown>, prefix ? `${prefix}-${key}` : key);
      }
    });
  }

  processTypography(rawTypography as Record<string, unknown>);
  return utilities;
}

/**
 * ──────────────────────────────────────────────────────────────────────
 * 3) UTILITY: flattenTypography()
 *
 * Returns a flat array of typography styles for use in React components:
 *
 *   [ { name: "mega", fontFamily: "Inter", fontSize: "1.25rem", ... },
 *     { name: "title-title1-semi", fontFamily: "Inter", ... } ]
 * ──────────────────────────────────────────────────────────────────────
 */
function flattenTypography(obj: Record<string, unknown>, prefix = ''): Array<{ name: string } & TypographyStyle> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key;

    if (value && typeof value === 'object' && 'fontFamily' in value) {
      // Leaf node with typography styles
      return [
        {
          name,
          ...(value as TypographyStyle),
        },
      ];
    } else if (typeof value === 'object' && value !== null) {
      // Nested group
      return flattenTypography(value as Record<string, unknown>, name);
    }
    return [];
  });
}

/**
 * ──────────────────────────────────────────────────────────────────────
 * 4) UTILITY: getTailwindTypography()
 *
 * Alias for getTypographyUtilities() for compatibility with tailwind config.
 * Returns utilities for use in Tailwind CSS.
 * ──────────────────────────────────────────────────────────────────────
 */
function getTailwindTypography() {
  return getTypographyUtilities();
}

export default {
  rawTypography,
  getTypographyUtilities,
  flattenTypography,
  getTailwindTypography,
};
