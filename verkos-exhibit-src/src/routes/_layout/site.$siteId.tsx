import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useReportStore } from '../../store/report.store';
import { useSites } from '@/libs/shared/api-modules/sites/hooks/use-sites';
import { mergeApiAndLocalSites } from '../../utils/map-api-site';
import SiteDetail from '../../components/reports/SiteDetail';
import { NotFoundPage } from '../../libs/shared/ui/components/NotFoundPage';

export const Route = createFileRoute('/_layout/site/$siteId')({
  component: SiteDetailPage,
});

function SiteDetailPage() {
  const { siteId } = Route.useParams();
  const localSites = useReportStore((state) => state.sites);
  const { data: apiSites } = useSites();
  const sites = useMemo(
    () => mergeApiAndLocalSites(apiSites ?? [], localSites),
    [apiSites, localSites]
  );
  const site = sites.find((s) => s.id === siteId);
  if (!site) return <NotFoundPage />;
  return <SiteDetail site={site} />;
}
