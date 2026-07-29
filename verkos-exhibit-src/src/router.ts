import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { QueryClient } from '@tanstack/react-query';
import { AuthContextType } from '@auth';
import { AxiosInstance } from 'axios';
import { environment } from '@env';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface RouterContext {
    queryClient: QueryClient;
    auth?: AuthContextType;
    httpClient?: AxiosInstance;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// @ts-expect-error - TanStack router requires strictNullChecks but project uses relaxed settings
export const router = createRouter({
  routeTree,
  basepath: environment.appInfo.websiteBasePath.replace(/\/$/, ''),
  context: {
    queryClient,
  },
});

export const setRouterAuthContext = (
  auth: AuthContextType,
  httpClient: AxiosInstance
) => {
  router.update({
    context: {
      queryClient,
      auth,
      httpClient, // Axios instance passed directly
    },
  });
};
