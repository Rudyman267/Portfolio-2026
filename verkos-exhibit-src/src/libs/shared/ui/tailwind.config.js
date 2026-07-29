/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  important: true,
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'hsla(223, 54%, 72%, 1)',
          100: 'hsla(223, 54%, 63%, 1)',
          200: 'hsla(223, 54%, 54%, 1)', // p
          300: 'hsla(223, 47%, 43%, 1)',
          400: 'hsla(223, 46%, 32%, 1)',
          states: {
            hover: 'hsla(223, 46%, 48%, 1)',
            pressed: 'hsla(223, 47%, 43%, 1)',
            focused: 'hsla(223, 54%, 54%, 1)',
            disabled: 'hsla(0, 0%, 24%, 1)',
          },
        },
        secondary: {
          50: 'hsla(223, 23%, 40%, 1)',
          100: 'hsla(223, 24%, 37%, 1)',
          200: 'hsla(223, 25%, 34%, 1)', // p
          300: 'hsla(223, 26%, 30%, 1)',
          400: 'hsla(223, 26%, 26%, 1)',
          states: {
            hover: 'hsla(223, 26%, 37%, 1)',
            pressed: 'hsla(223, 23%, 39%, 1)',
            focused: 'hsla(223, 26%, 37%, 1)',
            disabled: 'hsla(0, 0%, 24%, 1)',
          },
        },
        surface: {
          DEFAULT: 'hsla(240, 6%, 93%, 0.08)',
          hover: 'hsla(240, 6%, 93%, 0.10)',
          pressed: 'hsla(240, 6%, 93%, 0.12)',
          focused: 'hsla(240, 6%, 93%, 0.10)',
          selected: 'hsla(223, 25%, 34%, 1)',
          'selected-n': 'hsla(240, 6%, 93%, 0.10)',
          disabled: 'hsla(0, 0%, 24%, 1)',
        },
        background: {
          DEFAULT: 'hsla(240, 6%, 7%, 1)',
          'level-1': 'hsla(240, 3%, 12%, 1)',
          'level-2': 'hsla(240, 1%, 15%, 1)',
          'level-3': 'hsla(240, 2%, 18%, 1)',
          'level-4': 'hsla(240, 2%, 22%, 1)',
          'level-5': 'hsla(240, 2%, 26%, 1)',
        },
        outline: {
          primary: 'hsla(0, 0%, 100%, 0.12)',
          secondary: 'hsla(0, 0%, 100%, 0.08)',
          disabled: 'hsla(0, 0%, 100%, 0.04)',
        },
        text: {
          1: 'hsla(0, 0%, 100%, 0.84)',
          2: 'hsla(0, 0%, 100%, 0.54)',
          disabled: 'hsla(0, 0%, 100%, 0.24)',
        },
        success: {
          50: 'hsla(153, 47%, 64%, 1)',
          40: 'hsla(153, 47%, 52%, 1)',
          30: 'hsla(153, 71%, 40%, 1)',
          20: 'hsla(153, 71%, 32%, 1)',
          10: 'hsla(153, 71%, 24%, 1)',
          container: 'hsla(153, 71%, 40%, 0.20)',
        },
        error: {
          50: 'hsla(4, 93%, 76%, 1)',
          40: 'hsla(4, 93%, 68%, 1)',
          30: 'hsla(4, 93%, 60%, 1)',
          20: 'hsla(4, 62%, 48%, 1)',
          10: 'hsla(4, 62%, 36%, 1)',
          container: 'hsla(4, 93%, 60%, 0.20)',
        },
        caution: {
          50: 'hsla(44, 99%, 68%, 1)',
          40: 'hsla(42, 99%, 62%, 1)',
          30: 'hsla(39, 98%, 56%, 1)',
          20: 'hsla(34, 94%, 50%, 1)',
          10: 'hsla(28, 97%, 44%, 1)',
          container: 'hsla(39, 98%, 56%, 0.15)',
        },
        warning: {
          50: 'hsla(20, 89%, 72%, 1)',
          40: 'hsla(20, 88%, 63%, 1)',
          30: 'hsla(20, 88%, 54%, 1)',
          20: 'hsla(20, 76%, 43%, 1)',
          10: 'hsla(20, 76%, 32%, 1)',
          container: 'hsla(20, 88%, 54%, 0.20)',
        },
        info: {
          50: 'hsla(210, 100%, 80%, 1)',
          40: 'hsla(210, 70%, 63%, 1)',
          30: 'hsla(210, 100%, 60%, 1)',
          20: 'hsla(210, 100%, 50%, 1)',
          10: 'hsla(210, 62%, 32%, 1)',
          container: 'hsla(210, 100%, 60%, 0.20)',
        },
        map: {
          'm-1': 'hsla(0, 67%, 48%, 1)',
          'm-2': 'hsla(1, 83%, 60%, 1)',
          'm-3': 'hsla(288, 49%, 47%, 1)',
          'm-4': 'hsla(288, 68%, 35%, 1)',
          'm-5': 'hsla(231, 43%, 52%, 1)',
          'm-6': 'hsla(231, 56%, 37%, 1)',
          'm-7': 'hsla(213, 79%, 45%, 1)',
          'm-8': 'hsla(208, 89%, 59%, 1)',
          'm-9': 'hsla(173, 100%, 22%, 1)',
          'm-10': 'hsla(122, 38%, 53%, 1)',
          'm-11': 'hsla(44, 96%, 57%, 1)',
          'm-12': 'hsla(56, 100%, 65%, 1)',
          'm-13': 'hsla(27, 100%, 48%, 1)',
          'm-14': 'hsla(33, 100%, 57%, 1)',
          'm-15': 'hsla(17, 19%, 43%, 1)',
          'm-16': 'hsla(17, 27%, 26%, 1)',
          'm-17': 'hsla(218, 35%, 57%, 1)',
          'm-18': 'hsla(207, 38%, 53%, 1)',
          'm-19': 'hsla(228, 35%, 56%, 1)',
          'm-20': 'hsla(179, 99%, 29%, 1)',
          'm-21': 'hsla(177, 100%, 35%, 1)',
          neutral: {
            1: 'hsla(0, 0%, 0%, 1)',
            2: 'hsla(210, 5%, 22%, 1)',
            3: 'hsla(210, 5%, 48%, 1)',
            4: 'hsla(210, 5%, 73%, 1)',
            5: 'hsla(210, 5%, 91%, 1)',
            6: 'hsla(0, 0%, 100%, 1)',
          },
        },
        others: {
          scrim: 'hsla(0, 0%, 0%, 0.5)',
          'outline-tertiary-bright': 'hsla(0, 0%, 100%, 0.20)',
          'outline-focused': 'hsla(0, 0%, 0%, 0.0001)',
        },
        'on-surface-black': {
          100: 'hsla(0, 0%, 0%, 0.80)',
          200: 'hsla(0, 0%, 0%, 0.54)',
          disabled: 'hsla(0, 0%, 0%, 0.24)',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'fira-code': ['Fira Code', 'monospace'],
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      letterSpacing: {
        narrow: '-0.006em',
        'narrow-alt': '-0.003em',
        normal: '0em',
        wide: '0.0015em',
        'wide-alt': '0.003em',
      },
      boxShadow: {
        focus: '0px 0px 0px rgba(0, 128, 255, 1)',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    function ({ addUtilities }) {
      const typographyUtils = {
        '.fb-heading': {
          '@apply text-text-1 font-inter font-medium text-xl': {},
        },
        '.fb-title-1': {
          '@apply text-text-1 font-inter font-semibold text-lg': {},
        },
        '.fb-title-2': {
          '@apply text-text-1 font-inter font-medium text-lg': {},
        },
        '.fb-title-3': {
          '@apply text-text-1 font-inter font-medium text-base': {},
        },
        '.fb-title-4': {
          '@apply text-text-1 font-inter font-normal text-base': {},
        },
        '.fb-body-1': {
          '@apply text-text-1 font-inter font-medium text-sm': {},
        },
        '.fb-body-2': {
          '@apply text-text-1 font-inter font-normal text-sm': {},
        },
        '.fb-body-3': {
          '@apply text-text-1 font-mono font-normal text-sm': {},
        },
        '.fb-body-4': {
          '@apply text-text-1 font-inter font-medium text-xs': {},
        },
        '.fb-body-5': {
          '@apply text-text-1 font-inter font-normal text-xs': {},
        },
        '.fb-body-6': {
          '@apply text-text-2 font-inter font-normal text-xs': {},
        },
        '.fb-tiny-1': {
          '@apply text-text-1 font-inter font-medium text-[11px]': {},
        },
        '.fb-tiny-2': {
          '@apply text-text-1 font-inter font-medium text-[10px]': {},
        },
        '.fb-tiny-3': {
          '@apply text-text-1 font-inter font-normal text-[10px]': {},
        },
      };
      addUtilities(typographyUtils);
    },
  ],
};
