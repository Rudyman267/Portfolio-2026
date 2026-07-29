import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { useReportStore } from '../../store/report.store';
import AppSelect from '@/components/ui/app-select';
import { Report, ReportProfile } from '../../types/report.types';
import { openReportPrintWindow, reportToPrintInput } from '../../services/report-print';
import { useToast } from '@libs/shared/ui/fb-components/Toast';
import CreateReportWizard from './CreateReportWizard';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

// ─── Unified row type ──────────────────────────────────────────────────────

type StatusFilter = 'all' | 'draft' | 'in_review' | 'finalized';

interface ReportRow {
  id: string;
  title: string;
  siteName: string;
  date: string;
  status: 'draft' | 'in_review' | 'finalized';
  profile: string;
  observationCount: number;
  author: string;
  isDraft: boolean;
  droneName: string | null;
  missionName: string | null;
  flightIds: string[];
}

const profileLabel: Record<string, string> = {
  full_operational: 'Full op.',
  executive_summary: 'Executive',
  compliance: 'Compliance',
  incident: 'Incident',
  shift_summary: 'Shift sum.',
};

const statusConfig: Record<string, { dot: string; text: string; label: string }> = {
  draft: { dot: 'bg-caution-30', text: 'text-caution-30', label: 'Draft' },
  in_review: { dot: 'bg-primary-200', text: 'text-primary-200', label: 'In review' },
  finalized: { dot: 'bg-success-30', text: 'text-success-30', label: 'Finalized' },
};

const cardInset = 'inset 0 1px 0 rgba(255,255,255,0.04)';

// ─── Component ──────────────────────────────────────────────────────────────

const ReportsLibrary: React.FC = () => {
  const reports = useReportStore((s) => s.reports);
  const drafts = useReportStore((s) => s.drafts);
  const deleteReport = useReportStore((s) => s.deleteReport);
  const deleteDraft = useReportStore((s) => s.deleteDraft);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'patrol' | 'incident' | 'shift'>('patrol');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [siteValue, setSiteValue] = useState('');
  const [typeValue, setTypeValue] = useState('');
  const [droneValue, setDroneValue] = useState('');

  const pendingCount = useMemo(
    () => drafts.filter((d) => d.status === 'ready_for_review').length,
    [drafts]
  );

  const allRows: ReportRow[] = useMemo(() => {
    const reportRows: ReportRow[] = reports.map((r) => ({
      id: r.id,
      title: r.title,
      siteName: r.siteName,
      date: r.date,
      status: 'finalized' as const,
      profile: r.profile,
      observationCount: r.observations.length,
      author: r.author,
      isDraft: false,
      droneName: r.droneName,
      missionName: r.missionName,
      flightIds: r.flightIds,
    }));

    const draftRows: ReportRow[] = drafts.map((d) => ({
      id: d.id,
      title: d.mission.name,
      siteName: 'Skybase Alpha',
      date: d.mission.date,
      status: d.status === 'ready_for_review' ? ('draft' as const) : ('in_review' as const),
      profile: 'full_operational',
      observationCount: d.mission.detectionCount,
      author: 'AI Generated',
      isDraft: true,
      droneName: d.mission.droneName,
      missionName: d.mission.name,
      flightIds: [d.mission.flightId],
    }));

    return [...reportRows, ...draftRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reports, drafts]);

  // Derive unique drone names for filter
  const droneOptions = useMemo(() => {
    const names = new Set<string>();
    allRows.forEach((r) => { if (r.droneName) names.add(r.droneName); });
    return Array.from(names).sort();
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (siteValue && row.siteName !== siteValue) return false;
      if (typeValue && row.profile !== typeValue) return false;
      if (droneValue && row.droneName !== droneValue) return false;
      if (searchValue) {
        const q = searchValue.toLowerCase();
        const matchTitle = row.title.toLowerCase().includes(q);
        const matchMission = row.missionName?.toLowerCase().includes(q) ?? false;
        const matchDrone = row.droneName?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchMission && !matchDrone) return false;
      }
      return true;
    });
  }, [allRows, statusFilter, searchValue, siteValue, typeValue, droneValue]);

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchValue('');
    setSiteValue('');
    setTypeValue('');
    setDroneValue('');
  }, []);

  const openWizard = useCallback((mode: 'patrol' | 'incident' | 'shift') => {
    setWizardMode(mode);
    setWizardOpen(true);
  }, []);

  const handleDownload = useCallback(
    (report: Report) => {
      const task = new Promise<void>((resolve) => {
        setTimeout(() => {
          openReportPrintWindow(reportToPrintInput(report), `Verkos Report ${report.date}`);
          resolve();
        }, 400);
      });
      toast.promise(task, {
        loading: 'Preparing PDF…',
        success: 'Opening print dialog',
        error: 'PDF generation failed',
      });
    },
    [toast]
  );

  const draftCount = useMemo(() => allRows.filter((r) => r.status === 'draft').length, [allRows]);
  const reviewCount = useMemo(() => allRows.filter((r) => r.status === 'in_review').length, [allRows]);
  const finalizedCount = useMemo(() => allRows.filter((r) => r.status === 'finalized').length, [allRows]);

  const statusPills: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts', count: draftCount },
    { key: 'in_review', label: 'In review', count: reviewCount },
    { key: 'finalized', label: 'Finalized', count: finalizedCount },
  ];

  const getFlightDisplay = (row: ReportRow) => {
    if (row.flightIds.length === 1 && row.missionName) {
      return row.missionName.length > 25 ? row.missionName.slice(0, 25) + '…' : row.missionName;
    }
    if (row.flightIds.length > 1) return `${row.flightIds.length} flights`;
    return `VRK-${row.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}`;
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ── ZONE 1: Create New Report ──────────────────────────── */}
        <div className="mb-10">
          <p className="text-[18px] font-semibold text-white/[0.92]">New report</p>
          <p className="text-[13px] text-white/[0.40] mt-1 mb-5">select a report type to begin</p>

          <div className="grid grid-cols-3 gap-4">
            {/* Patrol card */}
            <button
              onClick={() => openWizard('patrol')}
              className="bg-[#1A1A1D] border border-white/[0.08] rounded-xl p-6 text-left cursor-pointer hover:border-white/[0.15] hover:bg-[#1E1E21] transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-route text-white text-lg" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white/[0.90]">Patrol report</p>
                  <p className="text-[13px] text-white/[0.40] mt-1 leading-relaxed">
                    Generate from a single flight — detections, images, and pilot notes
                  </p>
                </div>
              </div>
            </button>

            {/* Shift summary card */}
            <button
              onClick={() => openWizard('shift')}
              className="bg-[#1A1A1D] border border-white/[0.08] rounded-xl p-6 text-left cursor-pointer hover:border-white/[0.15] hover:bg-[#1E1E21] transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-clock-rotate-left text-white text-lg" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white/[0.90]">Shift summary</p>
                  <p className="text-[13px] text-white/[0.40] mt-1 leading-relaxed">
                    Aggregate all flights from a shift period into one report
                  </p>
                </div>
              </div>
            </button>

            {/* Incident card */}
            <button
              onClick={() => openWizard('incident')}
              className="bg-[#1A1A1D] border border-white/[0.08] rounded-xl p-6 text-left cursor-pointer hover:border-white/[0.15] hover:bg-[#1E1E21] transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-triangle-exclamation text-white text-lg" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white/[0.90]">Incident report</p>
                  <p className="text-[13px] text-white/[0.40] mt-1 leading-relaxed">
                    Record accidents, near misses, equipment failures, or safety concerns
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Pending drafts callout */}
          {pendingCount > 0 && (
            <button
              onClick={() => setStatusFilter('draft')}
              className="mt-3 flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded"
            >
              <i className="fa-solid fa-inbox text-white/[0.30] text-xs" />
              <span className="text-[13px] text-white/[0.35]">
                {pendingCount} draft report{pendingCount !== 1 ? 's' : ''} awaiting review
              </span>
            </button>
          )}
        </div>

        {/* ── ZONE 2: Report History ─────────────────────────────── */}
        <div>
          <p className="text-[15px] font-semibold text-white/[0.92]">Report history</p>
          <p className="text-[13px] text-white/[0.45] mt-1">
            View and manage your previously created reports
          </p>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4 mb-4 flex-wrap">
            {/* Status pills */}
            <div className="flex items-center gap-1 bg-[#161618] rounded-xl p-1">
              {statusPills.map((pill) => {
                const isActive = statusFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    onClick={() => setStatusFilter(pill.key)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 ${
                      isActive
                        ? 'bg-white/[0.08] text-white/[0.88]'
                        : 'text-white/[0.42] hover:text-white/[0.65] hover:bg-white/[0.04]'
                    }`}
                  >
                    {pill.label}
                    {pill.count !== undefined && pill.count > 0 && (
                      <span className="ml-1 text-white/[0.35]">{pill.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right side filters */}
            <div className="ml-auto flex items-center gap-2">
              <AppSelect
                value={siteValue || '_all'}
                onValueChange={(v) => setSiteValue(v === '_all' ? '' : v)}
                options={[
                  { value: '_all', label: 'All sites' },
                  ...Array.from(new Set(allRows.map(r => r.siteName))).sort().map(s => ({ value: s, label: s })),
                ]}
                aria-label="Filter by site"
              />

              <AppSelect
                value={typeValue || '_all'}
                onValueChange={(v) => setTypeValue(v === '_all' ? '' : v)}
                options={[
                  { value: '_all', label: 'All types' },
                  { value: 'full_operational', label: 'Full operational' },
                  { value: 'executive_summary', label: 'Executive summary' },
                  { value: 'compliance', label: 'Compliance' },
                  { value: 'incident', label: 'Incident' },
                  { value: 'shift_summary', label: 'Shift summary' },
                ]}
                aria-label="Filter by type"
              />

              <AppSelect
                value={droneValue || '_all'}
                onValueChange={(v) => setDroneValue(v === '_all' ? '' : v)}
                options={[
                  { value: '_all', label: 'All drones' },
                  ...droneOptions.map((d) => ({ value: d, label: d })),
                ]}
                aria-label="Filter by drone"
              />

              <div className="relative flex items-center">
                <i className="fa-solid fa-magnifying-glass text-white/[0.25] absolute left-3 text-[10px] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="bg-[#1C1C1F] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-[13px] text-white/[0.85] placeholder:text-white/[0.25] focus:outline-none focus:border-primary-200/40 focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 w-48"
                  aria-label="Search reports"
                />
              </div>
            </div>
          </div>

          {/* Table or empty states */}
          {allRows.length === 0 ? (
            <div className="py-16 text-center">
              <i className="fa-solid fa-file-lines text-white/[0.12] text-3xl mb-4" />
              <p className="text-[14px] font-medium text-white/[0.85] mb-2">No reports yet</p>
              <p className="text-[13px] text-white/[0.42] max-w-[50ch] leading-relaxed mx-auto">
                Pick a report type above to get started
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16">
              <p className="text-[14px] font-medium text-white/[0.85] mb-2">No reports match your filters</p>
              <p className="text-[13px] text-white/[0.42] max-w-[42ch] leading-relaxed">
                Try broadening the site or type filter, or clear your search term to see all reports.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 text-[13px] text-white/[0.85] hover:underline transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              className="bg-[#161618] border border-white/[0.08] rounded-xl overflow-hidden"
              style={{ boxShadow: cardInset }}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#131315] border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[120px]">
                      Flight
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[30%]">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">
                      Site
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">
                      Drone
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">
                      Author
                    </th>
                    <th className="px-4 py-3 w-[100px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const sc = statusConfig[row.status];
                    const linkTo = row.isDraft
                      ? '/report/$reportId'
                      : '/report-preview/$reportId';
                    const report = !row.isDraft
                      ? reports.find((r) => r.id === row.id)
                      : null;

                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors duration-150 group"
                        >
                          <td className="px-4 py-3">
                            <span className="text-[12px] text-white/[0.40] truncate block max-w-[120px]">
                              {getFlightDisplay(row)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={linkTo}
                              params={{ reportId: row.id } as never}
                              className="text-[14px] text-white/[0.85] hover:text-white/[0.92] focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded truncate block"
                            >
                              {row.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] text-white/[0.45] truncate">{row.siteName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] text-white/[0.45]">{row.droneName || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] text-white/[0.45] whitespace-nowrap">{row.date}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[13px] ${row.profile === 'incident' ? 'text-error-30' : 'text-white/[0.45]'}`}>
                              {profileLabel[row.profile] ?? row.profile}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] text-white/[0.45] whitespace-nowrap">{row.author}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                              <Link
                                to={row.isDraft ? '/report/$reportId' : '/report/$reportId'}
                                params={{ reportId: row.id } as never}
                                className="text-white/[0.35] hover:text-white/[0.70] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded p-1.5"
                                aria-label={`Edit ${row.title}`}
                                title="Edit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <i className="fa-solid fa-pen text-xs" />
                              </Link>
                              {report && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(report);
                                  }}
                                  className="text-white/[0.35] hover:text-white/[0.70] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded p-1.5"
                                  aria-label={`Download ${row.title} as PDF`}
                                  title="Download PDF"
                                >
                                  <i className="fa-solid fa-download text-xs" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(deletingId === row.id ? null : row.id);
                                }}
                                className="text-white/[0.35] hover:text-error-30 transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-error-30 rounded p-1.5 cursor-pointer"
                                aria-label={`Delete ${row.title}`}
                                title="Delete"
                              >
                                <i className="fa-solid fa-trash text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {deletingId === row.id && (
                          <tr>
                            <td colSpan={9} className="px-4 py-2">
                              <div className="flex items-center justify-between bg-error-30/[0.08] border border-error-30/[0.15] rounded-lg px-4 py-2.5">
                                <span className="text-[13px] text-error-30">Delete "{row.title}"? This cannot be undone.</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setDeletingId(null)}
                                    className="text-[13px] text-white/[0.50] hover:text-white/[0.75] px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (row.isDraft) deleteDraft(row.id);
                                      else deleteReport(row.id);
                                      setDeletingId(null);
                                    }}
                                    className="text-[13px] text-error-30 hover:text-error-50 font-medium px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Wizard modal */}
        <AnimatePresence>
          {wizardOpen && (
            <CreateReportWizard mode={wizardMode} onClose={() => setWizardOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ReportsLibrary;
