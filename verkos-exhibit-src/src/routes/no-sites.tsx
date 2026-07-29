import { createFileRoute } from '@tanstack/react-router';
import NoSitesAvailablePage from '@auth/components/NoSitesAvailablePage';

export const Route = createFileRoute('/no-sites')({
  component: NoSitesAvailablePage,
});
