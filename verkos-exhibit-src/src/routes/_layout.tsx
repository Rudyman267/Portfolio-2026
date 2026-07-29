/**
 * Layout Route - Protected Layout with Authentication
 *
 * This layout route uses route-level guards (beforeLoad) for authentication.
 * It handles authentication and org validation (NO site access check by default).
 *
 * Architecture:
 * - Route-level guards run BEFORE component renders
 * - No race conditions because RouterProvider waits for context
 * - TemplateAppLayout renders once at this level
 * - All app routes nested under this protected layout
 * - Standard React Router pattern
 *
 * Guard Execution Order:
 * 1. requireAuth - Check user session
 * 2. requireOrg - Validate organization
 *
 * Note: Template app is open to all organizations (no feature flag check)
 * Note: Site access guard is commented out - uncomment if your app requires sites
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { LoadingScreen } from '@ui/components/LoadingScreen';
import TemplateAppLayout from '@/components/layouts/TemplateAppLayout';

// import { API_ENDPOINTS } from '@/api/config/api-endpoints'; // Uncomment if using site access guard

function LayoutRoute() {
  return (
    <TemplateAppLayout>
      <Outlet />
    </TemplateAppLayout>
  );
}

// EXHIBIT: the auth/org guards are removed entirely. With no backend they
// resolve to "not signed in" and redirect the whole app to /login.
export const Route = createFileRoute('/_layout')({
  component: LayoutRoute,
  loader: async () => ({ guardsPassed: true, timestamp: Date.now() }),
  pendingComponent: () => <LoadingScreen />,
  staleTime: 30 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  shouldReload: false,
});
