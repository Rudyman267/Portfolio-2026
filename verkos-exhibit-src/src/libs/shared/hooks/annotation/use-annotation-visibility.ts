import { useCallback, useMemo } from 'react';
import { Annotation } from '../../api-modules/drones/types/annotation.types';
import { FeatureFlag } from '../../types/feature-flag.enum';

/**
 * Interface for annotation visibility mapping from local storage
 */
export interface AnnotationVisibilityMap {
  [annotationId: string]: boolean;
}

/**
 * Hook return interface for annotation visibility management
 */
export interface UseAnnotationVisibilityReturn {
  visibilityMap: AnnotationVisibilityMap;
  isAnnotationVisible: (annotationId: string) => boolean;
  filterVisibleAnnotations: (annotations: Annotation[]) => Annotation[];
  getVisibilityStats: (annotations: Annotation[]) => {
    total: number;
    visible: number;
    hidden: number;
  };
  hasVisibilitySettings: boolean;
}

/**
 * Local storage key for annotation visibility settings
 */
export const ANNOTATION_VISIBILITY_KEY = 'annotation_visibility_v1';

/**
 * Hook parameters interface
 */
export interface UseAnnotationVisibilityParams {
  /**
   * Function to check if a feature flag is enabled
   * Provided by app-level useFeatureFlags hook
   */
  isEnabled: (featureName: string) => boolean;
}

/**
 * Hook to manage annotation visibility filtering based on local storage
 * Reads annotation_visibility_v1 from localStorage and provides filtering functionality
 * Clean implementation with minimal dependencies and optimized performance
 *
 * @param params - Hook parameters including isEnabled function from feature flags
 * @returns Annotation visibility management functions and state
 *
 * @example
 * ```typescript
 * // In app-level wrapper
 * const { isEnabled } = useFeatureFlags();
 * const annotationVisibility = useAnnotationVisibility({ isEnabled });
 * ```
 */
export const useAnnotationVisibility = ({
  isEnabled,
}: UseAnnotationVisibilityParams): UseAnnotationVisibilityReturn => {
  const isVisibilityControlEnabled = isEnabled(
    FeatureFlag.ANNOTATION_DEFAULT_VISIBILITY_OFF
  );

  // Parse annotation visibility map from localStorage with error handling
  const visibilityMap = useMemo((): AnnotationVisibilityMap => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const visibilityData = localStorage.getItem(ANNOTATION_VISIBILITY_KEY);

      if (!visibilityData) {
        return {};
      }

      const parsed = JSON.parse(visibilityData);

      // Validate that parsed data is an object
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn(
          'Invalid annotation visibility data in localStorage, using defaults'
        );
        return {};
      }

      return parsed as AnnotationVisibilityMap;
    } catch (error) {
      console.warn(
        'Failed to parse annotation visibility from localStorage:',
        error
      );
      return {};
    }
  }, []); // Empty dependency array since we only want to read once per mount

  // Check if cache has any entries
  const hasCacheEntries = useMemo(() => {
    return Object.keys(visibilityMap).length > 0;
  }, [visibilityMap]);

  /**
   * Check if an annotation should be visible based on visibility map
   * @param annotationId - The ID of the annotation to check
   * @returns true if annotation should be visible, false if it should be filtered out
   */
  const isAnnotationVisible = useCallback(
    (annotationId: string): boolean => {
      // PRIORITY 1: If cache exists, respect it ALWAYS
      if (hasCacheEntries) {
        // Use cache values, default to visible if not explicitly set
        if (!(annotationId in visibilityMap)) {
          return true;
        }
        return visibilityMap[annotationId] ?? true;
      }

      // PRIORITY 2: No cache exists -> Check feature flag
      if (isVisibilityControlEnabled) {
        // Feature flag is ON and no cache -> Hide everything
        return false;
      }

      // Feature flag is OFF and no cache -> Show everything (current behavior)
      return true;
    },
    [visibilityMap, hasCacheEntries, isVisibilityControlEnabled]
  );

  /**
   * Filter an array of annotations based on visibility settings
   * @param annotations - Array of annotations to filter
   * @returns Array of annotations that should be visible
   */
  const filterVisibleAnnotations = useCallback(
    (annotations: Annotation[]): Annotation[] => {
      // If no cache and feature flag is ON, return empty array immediately
      if (!hasCacheEntries && isVisibilityControlEnabled) {
        return [];
      }

      // Otherwise, filter normally
      return annotations.filter((annotation) => {
        const isVisible = isAnnotationVisible(annotation._id);
        return isVisible;
      });
    },
    [isAnnotationVisible, hasCacheEntries, isVisibilityControlEnabled]
  );

  // Expose additional helper for debugging
  const getVisibilityStats = useCallback(
    (annotations: Array<{ _id: string }>) => {
      const total = annotations.length;
      const visible = annotations.filter((ann) =>
        isAnnotationVisible(ann._id)
      ).length;
      const hidden = total - visible;

      return { total, visible, hidden };
    },
    [isAnnotationVisible]
  );

  return {
    visibilityMap,
    isAnnotationVisible,
    filterVisibleAnnotations,
    getVisibilityStats,
    hasVisibilitySettings: hasCacheEntries,
  };
};
