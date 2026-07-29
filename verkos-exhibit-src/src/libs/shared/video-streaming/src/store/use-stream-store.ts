import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { z } from 'zod';
import {
  StreamConfig,
  StreamError,
  HealthMetrics,
  StreamStatus,
} from '../types';

// Store state type definition
interface StreamState {
  // Stream data
  streams: Record<
    string,
    {
      config: StreamConfig;
      status: StreamStatus;
      health: HealthMetrics | null;
      error: StreamError | null;
    }
  >;
  // Global state
  isInitialized: boolean;
  globalError: StreamError | null;
  // Performance metrics
  performanceMetrics: {
    lastUpdateTime: number;
    updateCount: number;
    errorCount: number;
  };
}

// Store actions type definition
interface StreamActions {
  // Stream CRUD operations
  addStream: (streamId: string, config: StreamConfig) => void;
  removeStream: (streamId: string) => void;
  updateStreamConfig: (streamId: string, config: Partial<StreamConfig>) => void;

  // Status management
  updateStreamStatus: (streamId: string, status: StreamStatus) => void;
  updateStreamHealth: (streamId: string, health: HealthMetrics) => void;
  setStreamError: (streamId: string, error: StreamError | null) => void;

  // Global state management
  initialize: () => void;
  setGlobalError: (error: StreamError | null) => void;

  // Utility functions
  getStream: (streamId: string) => StreamState['streams'][string] | null;
  getAllStreams: () => StreamState['streams'];
  clearAllStreams: () => void;
}

// Initial state
const initialState: StreamState = {
  streams: {},
  isInitialized: false,
  globalError: null,
  performanceMetrics: {
    lastUpdateTime: 0,
    updateCount: 0,
    errorCount: 0,
  },
};

// Create the store with middleware
export const useStreamStore = create<StreamState & StreamActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // Stream CRUD operations
      addStream: (streamId, config) =>
        set((state) => {
          state.streams[streamId] = {
            config,
            status: 'INITIALIZING',
            health: null,
            error: null,
          };
          state.performanceMetrics.updateCount++;
          state.performanceMetrics.lastUpdateTime = Date.now();
        }),

      removeStream: (streamId) =>
        set((state) => {
          delete state.streams[streamId];
          state.performanceMetrics.updateCount++;
          state.performanceMetrics.lastUpdateTime = Date.now();
        }),

      updateStreamConfig: (streamId, config) =>
        set((state) => {
          if (state.streams[streamId]) {
            state.streams[streamId].config = {
              ...state.streams[streamId].config,
              ...config,
            };
            state.performanceMetrics.updateCount++;
            state.performanceMetrics.lastUpdateTime = Date.now();
          }
        }),

      // Status management
      updateStreamStatus: (streamId, status) =>
        set((state) => {
          if (state.streams[streamId]) {
            state.streams[streamId].status = status;
            state.performanceMetrics.updateCount++;
            state.performanceMetrics.lastUpdateTime = Date.now();
          }
        }),

      updateStreamHealth: (streamId, health) =>
        set((state) => {
          if (state.streams[streamId]) {
            state.streams[streamId].health = health;
            state.performanceMetrics.updateCount++;
            state.performanceMetrics.lastUpdateTime = Date.now();
          }
        }),

      setStreamError: (streamId, error) =>
        set((state) => {
          if (state.streams[streamId]) {
            state.streams[streamId].error = error;
            if (error) {
              state.performanceMetrics.errorCount++;
            }
            state.performanceMetrics.lastUpdateTime = Date.now();
          }
        }),

      // Global state management
      initialize: () =>
        set((state) => {
          state.isInitialized = true;
          state.performanceMetrics.lastUpdateTime = Date.now();
        }),

      setGlobalError: (error) =>
        set((state) => {
          state.globalError = error;
          if (error) {
            state.performanceMetrics.errorCount++;
          }
          state.performanceMetrics.lastUpdateTime = Date.now();
        }),

      // Utility functions
      getStream: (streamId) => get().streams[streamId] || null,
      getAllStreams: () => get().streams,
      clearAllStreams: () =>
        set((state) => {
          state.streams = {};
          state.performanceMetrics.updateCount++;
          state.performanceMetrics.lastUpdateTime = Date.now();
        }),
    }))
  )
);

// Selector hooks for common use cases
export const useStream = (streamId: string) =>
  useStreamStore((state) => state.streams[streamId]);

export const useStreamStatus = (streamId: string) =>
  useStreamStore((state) => state.streams[streamId]?.status);

export const useStreamHealth = (streamId: string) =>
  useStreamStore((state) => state.streams[streamId]?.health);

export const useStreamError = (streamId: string) =>
  useStreamStore((state) => state.streams[streamId]?.error);

export const useGlobalError = () =>
  useStreamStore((state) => state.globalError);

export const usePerformanceMetrics = () =>
  useStreamStore((state) => state.performanceMetrics);
