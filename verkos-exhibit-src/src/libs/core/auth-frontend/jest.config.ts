export default {
  displayName: 'auth-frontend',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/core/auth-frontend',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/**/*.test.{ts,tsx}',
    '!<rootDir>/**/index.{ts,tsx}',
    '!<rootDir>/**/__mocks__/**',
    '!<rootDir>/**/*.stories.{ts,tsx}',
    '!<rootDir>/jest.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },
  // Ensure no tests are skipped by default
  verbose: true,
  testRunner: 'jest-circus/runner',
  globals: {
    // Disable automatic skipping of tests
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
