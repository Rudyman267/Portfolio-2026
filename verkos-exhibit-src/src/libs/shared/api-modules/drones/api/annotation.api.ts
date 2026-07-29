import { useHttp } from '@auth';
import { AnnotationsResponse } from '../types/annotation.types';

/**
 * Hook that provides access to drone-related API operations
 */
export const useAnnotationApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch all annotations for the current organization
     */
    fetchAnnotations: async (): Promise<AnnotationsResponse> => {
      const response = await httpClient.get<AnnotationsResponse>(`/annotation`);
      return response.data;
    },
  };
};
