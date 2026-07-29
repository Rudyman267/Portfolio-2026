import React, { useCallback, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Report, ReportProfile } from '../../types/report.types';
import { openReportPrintWindow, reportToPrintInput } from '../../services/report-print';
import { useToast } from '@libs/shared/ui/fb-components/Toast';
import { useReportStore } from '../../store/report.store';

interface ReportsTableProps {
  reports: Report[];
  onClearFilters?: () => void;
}

const profileLabel: Record<ReportProfile, string> = {
  full_operational: 'Full op.',
  executive_summary: 'Executive',
  compliance: 'Compliance',
  incident: 'Incident',
  shift_summary: 'Shift sum.',
};

const ReportsTable: React.FC<ReportsTableProps> = ({ reports, onClearFilters }) => {
  const { toast } = useToast();
  const deleteReport = useReportStore((s) => s.deleteReport);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const getFlightDisplay = (report: Report) => {
    if (report.flightIds.length === 1 && report.missionName) {
      return report.missionName.length > 25 ? report.missionName.slice(0, 25) + '…' : report.missionName;
    }
    if (report.flightIds.length > 1) return `${report.flightIds.length} flights`;
    return `VRK-${report.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}`;
  };

  if (reports.length === 0) {
    return (
      <div className="py-16">
        <p className="text-[14px] font-medium text-white/[0.85] mb-2">No reports match your filters</p>
        <p className="text-[13px] text-white/[0.42] max-w-[42ch] leading-relaxed">
          Try broadening the site or type filter, or clear your search term to see all reports.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 text-[13px] text-white/[0.85] hover:underline transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-[#161618] border border-white/[0.08] rounded-xl overflow-hidden"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-[#131315] border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[90px]">Flight</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium">Title</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[120px]">Site</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[90px]">Drone</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[100px]">Date</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[100px]">Status</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[80px]">Type</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-white/[0.35] font-medium w-[100px]">Author</th>
            <th className="px-4 py-3 w-[90px]"></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <React.Fragment key={report.id}>
              <tr
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors duration-150 group"
              >
                <td className="px-4 py-3">
                  <span className="text-[12px] text-white/[0.40] truncate block" title={getFlightDisplay(report)}>
                    {getFlightDisplay(report)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      to="/report-preview/$reportId"
                      params={{ reportId: report.id } as never}
                      className="text-[14px] text-white/[0.85] hover:text-white/[0.92] focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded truncate block min-w-0"
                      title={report.title}
                    >
                      {report.title}
                    </Link>
                    {/* EXHIBIT: the "Demo" chip is removed — every report here
                        is sample data, so the chip only added noise. */}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-white/[0.45] truncate block" title={report.siteName}>{report.siteName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-white/[0.45] truncate block" title={report.droneName || '—'}>{report.droneName || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-white/[0.45] whitespace-nowrap">{report.date}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-white/[0.45] truncate block" title={report.status.replace('_', ' ')}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${report.status === 'finalized' ? 'bg-success-30' : report.status === 'in_review' ? 'bg-caution-30' : 'bg-white/[0.30]'}`} />
                    {report.status === 'finalized' ? 'Finalized' : report.status === 'in_review' ? 'In review' : report.status === 'draft_ready' ? 'Draft' : 'Processing'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[13px] truncate block ${report.profile === 'incident' ? 'text-error-30' : 'text-white/[0.45]'}`} title={profileLabel[report.profile]}>
                    {profileLabel[report.profile]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-white/[0.45] truncate block" title={report.author}>{report.author}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                    <Link
                      to="/report/$reportId"
                      params={{ reportId: report.id } as never}
                      className="text-white/[0.35] hover:text-white/[0.70] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded p-1.5"
                      aria-label={`Edit ${report.title}`}
                      title="Edit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(report);
                      }}
                      className="text-white/[0.35] hover:text-white/[0.70] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded p-1.5"
                      aria-label={`Download ${report.title} as PDF`}
                      title="Download PDF"
                    >
                      <i className="fa-solid fa-download text-xs" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(deletingId === report.id ? null : report.id);
                      }}
                      className="text-white/[0.35] hover:text-error-30 transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-error-30 rounded p-1.5 cursor-pointer"
                      aria-label={`Delete ${report.title}`}
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </td>
              </tr>
              {deletingId === report.id && (
                <tr>
                  <td colSpan={9} className="px-4 py-2">
                    <div className="flex items-center justify-between bg-error-30/[0.08] border border-error-30/[0.15] rounded-lg px-4 py-2.5">
                      <span className="text-[13px] text-error-30">Delete "{report.title}"? This cannot be undone.</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[13px] text-white/[0.50] hover:text-white/[0.75] px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { deleteReport(report.id); setDeletingId(null); }}
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;
