import { useEffect } from 'react';
import { useReportStore } from '@/store/report.store';

/**
 * Loads agents, templates, and reports from Supabase for the given org.
 * Seeds defaults from mock data if the org has no records yet.
 */
export function useDbSync(orgId: string | null | undefined) {
  const loadFromDatabase = useReportStore((s) => s.loadFromDatabase);
  const currentOrgId = useReportStore((s) => s.currentOrgId);

  useEffect(() => {
    if (orgId && orgId !== currentOrgId) {
      loadFromDatabase(orgId);
    }
  }, [orgId, currentOrgId, loadFromDatabase]);
}
