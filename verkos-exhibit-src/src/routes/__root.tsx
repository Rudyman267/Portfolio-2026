import { createRootRoute, Outlet, Navigate } from '@tanstack/react-router';
import { LoadingScreen } from '@ui/components/LoadingScreen';

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col h-screen w-full">
      <Outlet />
    </div>
  ),
  pendingComponent: () => <LoadingScreen />,
  notFoundComponent: () => <Navigate to="/" replace />,
});
