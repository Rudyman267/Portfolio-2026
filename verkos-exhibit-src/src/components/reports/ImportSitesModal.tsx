import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Site } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import { useSites } from '@/libs/shared/api-modules/sites/hooks/use-sites';
import { fillSiteContext } from '../../services/ai-report-service';
import { useToast } from '@libs/shared/ui/fb-components/Toast';

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const modalPanel = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

interface ImportSitesModalProps {
  onClose: () => void;
}

type ImportStatus = 'idle' | 'importing' | 'done';

interface ImportProgress {
  siteId: string;
  siteName: string;
  status: 'pending' | 'filling' | 'done' | 'error';
  error?: string;
}

const ImportSitesModal: React.FC<ImportSitesModalProps> = ({ onClose }) => {
  const shouldReduce = useReducedMotion();
  const { toast } = useToast();
  const { data: apiSites, isLoading, error, refetch } = useSites();
  const existingSites = useReportStore((s) => s.sites);
  const addSite = useReportStore((s) => s.addSite);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [progress, setProgress] = useState<ImportProgress[]>([]);

  const existingExternalIds = useMemo(
    () => new Set(existingSites.map((s) => s.id).filter((id) => id.startsWith('site-fb-'))),
    [existingSites]
  );

  const importableSites = useMemo(
    () => (apiSites || []).filter((s) => !existingExternalIds.has(`site-fb-${s._id}`)),
    [apiSites, existingExternalIds]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'importing') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, status]);

  const toggleSite = (siteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === importableSites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(importableSites.map((s) => s._id)));
    }
  };

  const handleImport = async () => {
    const toImport = importableSites.filter((s) => selectedIds.has(s._id));
    if (toImport.length === 0) return;

    setStatus('importing');
    setProgress(toImport.map((s) => ({ siteId: s._id, siteName: s.name, status: 'pending' })));

    for (const apiSite of toImport) {
      setProgress((prev) => prev.map((p) => (p.siteId === apiSite._id ? { ...p, status: 'filling' } : p)));

      try {
        const filled = await fillSiteContext({
          name: apiSite.name,
          coordinates: { lat: apiSite.coordinates.lat, lng: apiSite.coordinates.lng },
          deviceCount: apiSite.devices?.length ?? 0,
          missionCount: apiSite.missions?.length ?? 0,
          missionNames: (apiSite.missions ?? []).map((m: { _id: string; name: string }) => m.name).slice(0, 5),
        });

        const newSite: Site = {
          id: `site-fb-${apiSite._id}`,
          name: apiSite.name,
          description: filled.description,
          location: filled.location,
          timezone: filled.timezone,
          operatingHours: filled.operatingHours,
          siteType: filled.siteType,
          assets: [],
          context: filled.context,
          imageUrl: null,
          createdAt: apiSite.created_at,
          updatedAt: new Date().toISOString(),
        };

        addSite(newSite);
        setProgress((prev) => prev.map((p) => (p.siteId === apiSite._id ? { ...p, status: 'done' } : p)));
      } catch (err: any) {
        console.error('Site import error:', err);

        const newSite: Site = {
          id: `site-fb-${apiSite._id}`,
          name: apiSite.name,
          description: 'Imported from FlytBase — add description.',
          location: `${apiSite.coordinates.lat.toFixed(4)}°, ${apiSite.coordinates.lng.toFixed(4)}°`,
          timezone: 'UTC',
          operatingHours: '24/7',
          siteType: 'Other',
          assets: [],
          context: '',
          imageUrl: null,
          createdAt: apiSite.created_at,
          updatedAt: new Date().toISOString(),
        };
        addSite(newSite);

        setProgress((prev) =>
          prev.map((p) =>
            p.siteId === apiSite._id
              ? { ...p, status: 'error', error: err?.type === 'credit_limit' ? 'Credit limit' : 'AI fill failed' }
              : p
          )
        );

        if (err?.type === 'credit_limit') {
          toast.error('Credit limit reached — remaining sites imported without AI context');
          break;
        }
      }
    }

    setStatus('done');
  };

  const handleDone = () => {
    const successCount = progress.filter((p) => p.status === 'done').length;
    const errorCount = progress.filter((p) => p.status === 'error').length;
    if (successCount > 0) {
      toast.success(`Imported ${successCount} site${successCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} with partial data)` : ''}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={(e) => { if (e.target === e.currentTarget && status !== 'importing') onClose(); }}
      >
        <motion.div
          variants={modalPanel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-[#161618] border border-white/[0.10] rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-white/[0.92]">Import sites from FlytBase</h2>
              <p className="text-[13px] text-white/[0.42] mt-1">AI will pre-fill context for each imported site — you can edit after</p>
            </div>
            {status !== 'importing' && (
              <button onClick={onClose} className={`text-white/[0.35] hover:text-white/[0.65] transition-colors duration-150 p-1 ${focusRingClass} rounded`}>
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <i className="fa-solid fa-spinner fa-spin text-white/[0.25] text-lg" />
                <p className="text-[13px] text-white/[0.45]">Fetching sites from FlytBase…</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <i className="fa-solid fa-triangle-exclamation text-white/[0.25] text-lg" />
                <p className="text-[14px] text-white/[0.55]">Couldn't fetch sites</p>
                <p className="text-[13px] text-white/[0.35]">Check your FlytBase connection and try again.</p>
                <button
                  onClick={() => refetch()}
                  className={`bg-primary-200 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary-100 transition-colors duration-150 cursor-pointer ${focusRingClass}`}
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !error && importableSites.length === 0 && (apiSites || []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <i className="fa-solid fa-location-dot text-white/[0.15] text-2xl" />
                <p className="text-[14px] text-white/[0.55]">No sites found</p>
                <p className="text-[13px] text-white/[0.35]">Your FlytBase organization has no sites configured yet.</p>
              </div>
            )}

            {!isLoading && !error && importableSites.length === 0 && (apiSites || []).length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <i className="fa-solid fa-circle-check text-white/[0.15] text-2xl" />
                <p className="text-[14px] text-white/[0.55]">All sites already imported</p>
                <p className="text-[13px] text-white/[0.35]">All {(apiSites || []).length} FlytBase sites are already in Verkos.</p>
              </div>
            )}

            {status === 'idle' && importableSites.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={toggleAll} className={`text-[13px] text-primary-200 hover:text-primary-100 transition-colors duration-150 cursor-pointer ${focusRingClass} rounded`}>
                    {selectedIds.size === importableSites.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <span className="text-[12px] text-white/[0.35]">
                    {selectedIds.size} of {importableSites.length} selected
                  </span>
                </div>

                <div className="space-y-2">
                  {importableSites.map((site) => {
                    const selected = selectedIds.has(site._id);
                    return (
                      <button
                        key={site._id}
                        onClick={() => toggleSite(site._id)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer ${focusRingClass} ${
                          selected
                            ? 'bg-primary-200/[0.06] border-primary-200/30'
                            : 'bg-[#1C1C1F] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected ? 'bg-primary-200 border-primary-200' : 'border-white/[0.20]'}`}>
                          {selected && <i className="fa-solid fa-check text-[9px] text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] text-white/[0.85] font-medium truncate">{site.name}</p>
                          <p className="text-[12px] text-white/[0.35] mt-0.5">
                            {site.coordinates.lat.toFixed(4)}°, {site.coordinates.lng.toFixed(4)}°
                            <span className="mx-1.5">·</span>{site.devices?.length ?? 0} device{(site.devices?.length ?? 0) !== 1 ? 's' : ''}
                            <span className="mx-1.5">·</span>{site.missions?.length ?? 0} mission{(site.missions?.length ?? 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {(status === 'importing' || status === 'done') && (
              <div className="space-y-2">
                {progress.map((p) => (
                  <div key={p.siteId} className="flex items-center gap-3 p-3 rounded-lg bg-[#1C1C1F] border border-white/[0.06]">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {p.status === 'pending' && <i className="fa-solid fa-circle text-[6px] text-white/[0.15]" />}
                      {p.status === 'filling' && <i className="fa-solid fa-spinner fa-spin text-[12px] text-primary-200" />}
                      {p.status === 'done' && <i className="fa-solid fa-circle-check text-[12px] text-success-40" />}
                      {p.status === 'error' && <i className="fa-solid fa-triangle-exclamation text-[12px] text-warning-40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-white/[0.85] font-medium truncate">{p.siteName}</p>
                      <p className="text-[12px] text-white/[0.35] mt-0.5">
                        {p.status === 'pending' && 'Queued'}
                        {p.status === 'filling' && 'Filling context with AI…'}
                        {p.status === 'done' && 'Imported with AI context'}
                        {p.status === 'error' && `Imported with defaults — ${p.error}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
            {status === 'idle' && (
              <>
                <button
                  onClick={onClose}
                  className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg text-[13px] transition-colors duration-150 cursor-pointer ${focusRingClass}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedIds.size === 0}
                  className={`bg-primary-200 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2 ${focusRingClass}`}
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-[11px]" />
                  Import {selectedIds.size > 0 ? `${selectedIds.size} site${selectedIds.size !== 1 ? 's' : ''}` : 'sites'}
                </button>
              </>
            )}
            {status === 'importing' && (
              <span className="text-[13px] text-white/[0.45] inline-flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin text-[11px]" />
                Importing… don't close this
              </span>
            )}
            {status === 'done' && (
              <button
                onClick={handleDone}
                className={`bg-primary-200 text-white px-5 py-2 rounded-lg text-[13px] font-medium hover:bg-primary-100 transition-colors duration-150 cursor-pointer ${focusRingClass}`}
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImportSitesModal;
