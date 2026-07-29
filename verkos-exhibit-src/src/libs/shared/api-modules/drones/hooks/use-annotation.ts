import { useQuery } from '@tanstack/react-query';
import { useAnnotationApi } from '../api/annotation.api';
import { AnnotationsResponse } from '../types/annotation.types';

export const ANNOATION_KEYS = {
  all: ['annotations'] as const,
  orgAnnotations: () => [...ANNOATION_KEYS.all, 'orgAnnotations'] as const,
};

export const useOrgAnnotations = () => {
  const orgAnnotationsApi = useAnnotationApi();

  const query = useQuery<AnnotationsResponse>({
    queryKey: ANNOATION_KEYS.orgAnnotations(),
    queryFn: () => orgAnnotationsApi.fetchAnnotations(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    annotations: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
