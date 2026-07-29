/**
 * EXHIBIT BUILD — reduced app shell.
 *
 * Dropped from the real shell (all require a live backend):
 *   SuperTokensWrapper, AuthProvider, HttpProvider, FeatureFlagInitializer.
 * Kept: error boundary, i18n, react-query, toasts, router.
 *
 * The exhibit also seeds the store and turns demo mode on before the router
 * mounts, so every screen a visitor lands on is already populated.
 */

import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router, queryClient, setRouterAuthContext } from './router';
import { environment } from '@env';
import { Suspense, useEffect, useState } from 'react';
import { LoadingScreen } from '@ui/components/LoadingScreen';
import { I18nProvider } from '@libs/shared';
import { useReportStore } from './store/report.store';
import { Toaster } from '@libs/shared/ui/fb-components/Toast';
import { FBErrorBoundary } from '@ui/components';
import { useAuth, useHttp } from '@auth';
import { bootstrapExhibit } from './exhibit/bootstrap';

export default function App() {
  const auth = useAuth();
  const http = useHttp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__store = useReportStore;
    }
  }, []);

  useEffect(() => {
    // Router expects an auth context; hand it the stub's.
    setRouterAuthContext(auth as never, http as never);
    bootstrapExhibit();
    setReady(true);
  }, [auth, http]);

  return (
    <FBErrorBoundary environment={environment}>
      <Suspense fallback={<LoadingScreen />}>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster position="top-right" />
            {ready ? <RouterProvider router={router} /> : <LoadingScreen />}
          </QueryClientProvider>
        </I18nProvider>
      </Suspense>
    </FBErrorBoundary>
  );
}
