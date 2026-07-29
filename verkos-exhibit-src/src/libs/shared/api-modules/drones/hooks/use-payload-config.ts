import { usePayloadConfigApi } from '../api/payload-config.api';
import usePayloadConfigStore from '../../../state/stores/payload-config.store';
import { useEffect, useRef, useCallback } from 'react';
export const usePayloadConfig = () => {
  const api = usePayloadConfigApi();
  const {
    setPayloadConfigs,
    setLoading,
    setError,
    isLoaded,
    isLoading,
    error,
    configMap,
  } = usePayloadConfigStore();
  const hasFetchedRef = useRef(false);

  const fetchConfig = useCallback(async () => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    setLoading(true);
    try {
      const data = await api.fetchPayloadConfig();
      setPayloadConfigs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch payload config')
      );
    } finally {
      setLoading(false);
    }
  }, [api, setPayloadConfigs, setLoading, setError]);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      fetchConfig();
    }
  }, [isLoaded, isLoading, fetchConfig]);

  return {
    config: configMap,
    isLoading,
    isLoaded,
    isError: !!error,
    error,
    refetch: () => {
      hasFetchedRef.current = false;
      fetchConfig();
    },
  };
};
