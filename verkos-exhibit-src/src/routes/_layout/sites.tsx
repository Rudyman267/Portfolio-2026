import { createFileRoute } from '@tanstack/react-router';
import SitesList from '../../components/reports/SitesList';

export const Route = createFileRoute('/_layout/sites')({
  component: SitesPage,
});

function SitesPage() {
  return <SitesList />;
}
