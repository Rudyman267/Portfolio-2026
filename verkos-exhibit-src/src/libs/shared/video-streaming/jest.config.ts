export default {
  displayName: 'shared-video-streaming',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: false,
      },
    ],
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/video-streaming',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/../../../$1',
    '^@auth$': '<rootDir>/../../../apps/fleet/src/app/shared/hooks/useAuth',
  },
  fakeTimers: {
    enableGlobally: false,
  },
};
