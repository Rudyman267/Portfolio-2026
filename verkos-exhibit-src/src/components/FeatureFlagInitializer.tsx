import { FeatureFlagInitializerBase } from '@libs/shared/feature-flags';
import { useFeatureFlagsStore } from '@/store/feature-flags.store';
import { useAuth, useHttp } from '@auth';

interface FeatureFlagInitializerProps {
  children: React.ReactNode;
}

/**
 * Feature Flag Initializer component for App Template
 * Wraps the shared FeatureFlagInitializerBase with template store and auth hooks
 */
export const FeatureFlagInitializer: React.FC<FeatureFlagInitializerProps> = ({
  children,
}) => {
  const { orgId, isAuthenticated, isLoading } = useAuth();
  const httpClient = useHttp();
  const effectiveOrgId = !isLoading && isAuthenticated ? orgId : '';

  return (
    <FeatureFlagInitializerBase
      store={useFeatureFlagsStore}
      orgId={effectiveOrgId}
      httpClient={httpClient}
      spinnerColor="text-primary-default"
    >
      {children}
    </FeatureFlagInitializerBase>
  );
};
