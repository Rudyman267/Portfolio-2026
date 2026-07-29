import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Site, SiteAsset } from '../../types/report.types';
import AppSelect from '@/components/ui/app-select';
import { useReportStore } from '../../store/report.store';
import PageTransition from './PageTransition';

interface SiteDetailProps {
  site: Site;
}

const sectionContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const sectionBlock = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';
const inputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150';
const labelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1';
const cardInset = 'inset 0 1px 0 rgba(255,255,255,0.04)';

const siteGradients = [
  'linear-gradient(135deg, #1a2332 0%, #0f1923 30%, #162028 60%, #1a2332 100%)',
  'linear-gradient(135deg, #1e1a2e 0%, #15112a 30%, #1a1530 60%, #1e1a2e 100%)',
  'linear-gradient(135deg, #1a2a1e 0%, #0f2315 30%, #16281a 60%, #1a2a1e 100%)',
  'linear-gradient(135deg, #2a1e1e 0%, #231510 30%, #281a16 60%, #2a1e1e 100%)',
];
const getSiteGradient = (siteId: string): string => {
  let hash = 0;
  for (let i = 0; i < siteId.length; i++) hash = ((hash << 5) - hash) + siteId.charCodeAt(i);
  return siteGradients[Math.abs(hash) % siteGradients.length];
};

const ASSET_TYPES = ['Access point', 'Barrier', 'Operations area', 'Building', 'Equipment', 'Other'];
const SITE_TYPES = ['Industrial facility', 'Storage facility', 'Office complex', 'Other'];

const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const modalPanel = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

/* ─── Modal Shell ─── */
const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-[#161618] border border-white/[0.10] rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: `${cardInset}, 0 8px 32px rgba(0,0,0,0.5)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-semibold text-white/[0.92]">{title}</h2>
            {subtitle && <p className="text-[13px] text-white/[0.42] mt-1">{subtitle}</p>}
            <div className="mt-5">{children}</div>
            <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-between items-center">
              {footer}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Profile Edit Modal ─── */
const ProfileEditModal: React.FC<{ open: boolean; onClose: () => void; site: Site }> = ({ open, onClose, site }) => {
  const updateSite = useReportStore((s) => s.updateSite);
  const updateSiteImage = useReportStore((s) => s.updateSiteImage);
  const [draft, setDraft] = useState({ name: '', description: '', location: '', timezone: '', operatingHours: '', siteType: '' });

  useEffect(() => {
    if (open) setDraft({ name: site.name, description: site.description, location: site.location, timezone: site.timezone, operatingHours: site.operatingHours, siteType: site.siteType });
  }, [open, site]);

  const handleSave = () => { updateSite(site.id, draft); onClose(); };

  const handleUploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (ev) => updateSiteImage(site.id, ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Edit site profile"
      footer={
        <div className="flex items-center gap-3 ml-auto">
          <button onClick={onClose} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass}`}>Cancel</button>
          <button onClick={handleSave} className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass}`}>Save</button>
        </div>
      }
    >
      {/* Image preview */}
      <div className="mb-5">
        <label className={labelClass}>Site photo</label>
        {site.imageUrl ? (
          <div className="w-[120px] aspect-video rounded-lg overflow-hidden bg-[#1C1C1F] border border-white/[0.08]">
            <img src={site.imageUrl} alt={site.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-[120px] aspect-video rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center">
            <span className="text-[11px] text-white/[0.25]">No photo</span>
          </div>
        )}
        <div className="flex items-center gap-3 mt-2">
          <button onClick={handleUploadPhoto} className={`text-[13px] text-white/[0.50] hover:text-white/[0.75] transition-colors duration-150 ${focusRingClass} rounded`}>Upload photo</button>
          {site.imageUrl && (
            <button onClick={() => updateSiteImage(site.id, null)} className={`text-[13px] text-white/[0.50] hover:text-error-30 transition-colors duration-150 ${focusRingClass} rounded`}>Remove</button>
          )}
        </div>
      </div>
      <div className="mb-4">
        <label className={labelClass}>Name</label>
        <input type="text" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={inputClass} />
      </div>
      <div className="mb-4">
        <label className={labelClass}>Description</label>
        <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className={`${inputClass} resize-y min-h-[80px]`} rows={3} />
      </div>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className={labelClass}>Location</label>
          <input type="text" value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Timezone</label>
          <input type="text" value={draft.timezone} onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))} className={inputClass} />
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className={labelClass}>Operating hours</label>
          <input type="text" value={draft.operatingHours} onChange={(e) => setDraft((d) => ({ ...d, operatingHours: e.target.value }))} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Site type</label>
          <AppSelect
            value={draft.siteType}
            onValueChange={(v) => setDraft((d) => ({ ...d, siteType: v }))}
            options={SITE_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
      </div>
    </ModalShell>
  );
};

/* ─── AI Context Edit Modal ─── */
const AIContextEditModal: React.FC<{ open: boolean; onClose: () => void; site: Site }> = ({ open, onClose, site }) => {
  const updateSiteContext = useReportStore((s) => s.updateSiteContext);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) setDraft(site.context); }, [open, site.context]);
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; }
  }, [draft]);

  const handleSave = () => { updateSiteContext(site.id, draft); onClose(); };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Edit AI context"
      subtitle="This text is sent to the AI during report generation. Include site-specific rules, known issues, and historical context."
      footer={
        <div className="flex items-center gap-3 ml-auto">
          <button onClick={onClose} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass}`}>Cancel</button>
          <button onClick={handleSave} className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass}`}>Save</button>
        </div>
      }
    >
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className={`${inputClass} resize-y min-h-[140px]`}
        autoFocus
      />
    </ModalShell>
  );
};

/* ─── Asset Edit Modal ─── */
const AssetEditModal: React.FC<{
  open: boolean;
  onClose: () => void;
  siteId: string;
  asset: SiteAsset | null;
  isNew: boolean;
}> = ({ open, onClose, siteId, asset, isNew }) => {
  const { addSiteAsset, updateSiteAsset, deleteSiteAsset } = useReportStore();
  const [draft, setDraft] = useState<SiteAsset>({ id: '', name: '', type: 'Other', description: '' });

  useEffect(() => {
    if (open && asset) setDraft({ ...asset });
  }, [open, asset]);

  const handleSave = () => {
    if (isNew) addSiteAsset(siteId, draft);
    else updateSiteAsset(siteId, draft.id, { name: draft.name, type: draft.type, description: draft.description });
    onClose();
  };

  const handleDelete = () => { deleteSiteAsset(siteId, draft.id); onClose(); };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isNew ? 'New asset' : draft.name}
      subtitle="Configure this site asset"
      footer={
        <>
          {!isNew && (
            <button onClick={handleDelete} className={`text-error-30 hover:text-error-50 text-[13px] flex items-center gap-1.5 transition-colors duration-150 ${focusRingClass} rounded`}>
              <i className="fa-solid fa-trash text-xs" /> Delete
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass}`}>Cancel</button>
            <button onClick={handleSave} className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass}`}>Save</button>
          </div>
        </>
      }
    >
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className={labelClass}>Name</label>
          <input type="text" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Type</label>
          <AppSelect
            value={draft.type}
            onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}
            options={ASSET_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
      </div>
      <div className="mb-4">
        <label className={labelClass}>Description</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          className={`${inputClass} resize-y min-h-[80px]`}
          rows={3}
          placeholder="Describe this asset, its condition, and any relevant context for AI analysis"
        />
      </div>
    </ModalShell>
  );
};

/* ─── Main Component ─── */
const SiteDetail: React.FC<SiteDetailProps> = ({ site }) => {
  const navigate = useNavigate();
  const deleteSite = useReportStore((s) => s.deleteSite);
  const updateSiteImage = useReportStore((s) => s.updateSiteImage);
  const shouldReduce = useReducedMotion();

  const [profileModal, setProfileModal] = useState(false);
  const [contextModal, setContextModal] = useState(false);
  const [assetModal, setAssetModal] = useState<{ open: boolean; asset: SiteAsset | null; isNew: boolean }>({ open: false, asset: null, isNew: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const openNewAsset = useCallback(() => {
    const newAsset: SiteAsset = { id: `asset-${Date.now()}`, name: 'New asset', type: 'Other', description: '' };
    setAssetModal({ open: true, asset: newAsset, isNew: true });
  }, []);

  const handleDeleteSite = () => { deleteSite(site.id); navigate({ to: '/sites' }); };

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateSiteImage(site.id, dataUrl);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [site.id, updateSiteImage]);

  return (
    <div className="min-h-screen bg-[#0F0F11]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-[#0F0F11]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/sites' })}
          className={`text-[12px] text-white/[0.50] hover:text-white/[0.80] transition-colors duration-150 flex items-center gap-1.5 ${focusRingClass} rounded px-1`}
          aria-label="Back to sites"
        >
          <i className="fa-solid fa-arrow-left text-xs" /> Sites
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[16px] font-semibold text-white/[0.92]">{site.name}</h1>
        </div>
        <span className="text-[11px] font-medium bg-white/[0.06] text-white/[0.50] rounded-md px-2 py-0.5">{site.siteType}</span>
      </div>

      {/* Hero zone */}
      <div className="relative h-[240px] overflow-hidden">
        {site.imageUrl ? (
          <img src={site.imageUrl} alt={site.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: getSiteGradient(site.id) }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, #0F0F11 100%)' }} />
        <button
          onClick={handleImageUpload}
          className={`absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-white/[0.70] hover:text-white/[0.90] transition-all duration-150 ${focusRingClass}`}
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
          }}
        >
          <i className="fa-solid fa-camera text-xs" />
          {site.imageUrl ? 'Change photo' : 'Add site photo'}
        </button>
      </div>

      <PageTransition>
        <motion.div
          variants={shouldReduce ? undefined : sectionContainer}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto px-6 py-6"
        >
          {/* AI-INFERRED BANNER (imported sites) */}
          {site.id.startsWith('site-fb-') && (
            <motion.div
              variants={shouldReduce ? undefined : sectionBlock}
              className="mb-6 bg-primary-200/[0.06] border border-primary-200/20 rounded-xl p-4 flex items-start gap-3"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-primary-200/60 text-sm mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[14px] text-white/[0.85] font-medium">AI-inferred fields</p>
                <p className="text-[13px] text-white/[0.45] mt-1 leading-relaxed">
                  This site was imported from FlytBase. AI filled in the description, site type, timezone, operating hours, and context based on available data. Review and edit as needed — especially the AI context, which drives report quality.
                </p>
              </div>
            </motion.div>
          )}

          {/* OVERVIEW */}
          <motion.section variants={shouldReduce ? undefined : sectionBlock} className="mb-8">
            <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-3">Overview</p>
            <h2 className="text-[22px] font-semibold text-white/[0.92] tracking-tight">{site.name}</h2>
            <p className="text-[14px] text-white/[0.55] leading-relaxed mt-2 max-w-[65ch]">{site.description}</p>
            <button
              onClick={() => setProfileModal(true)}
              className={`flex items-center gap-1.5 text-[13px] text-white/[0.40] hover:text-white/[0.65] transition-colors duration-150 mt-3 ${focusRingClass} rounded`}
            >
              <i className="fa-solid fa-pen text-[10px]" /> Edit profile
            </button>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-5">
              {([
                ['Location', site.location],
                ['Timezone', site.timezone],
                ['Operating hours', site.operatingHours],
                ['Site type', site.siteType],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[12px] text-white/[0.30] font-medium">{label}</p>
                  <p className="text-[14px] text-white/[0.80] mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* AI CONTEXT */}
          <motion.section variants={shouldReduce ? undefined : sectionBlock} className="mb-8">
            <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">AI Context</p>
            <p className="text-[13px] text-white/[0.35] mt-0.5">Sent to the AI during report generation to provide site-specific understanding</p>
            <div
              className="bg-[#161618] border border-white/[0.08] rounded-xl p-5 mt-3"
              style={{ boxShadow: cardInset }}
            >
              <p className="text-[14px] text-white/[0.75] leading-[1.7]">{site.context}</p>
            </div>
            <button
              onClick={() => setContextModal(true)}
              className={`flex items-center gap-1.5 text-[13px] text-white/[0.40] hover:text-white/[0.65] transition-colors duration-150 mt-3 ${focusRingClass} rounded`}
            >
              <i className="fa-solid fa-pen text-[10px]" /> Edit context
            </button>
          </motion.section>

          {/* SITE ASSETS */}
          <motion.section variants={shouldReduce ? undefined : sectionBlock}>
            <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-3">
              Site assets <span className="text-white/[0.20] ml-1">({site.assets.length})</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {site.assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setAssetModal({ open: true, asset, isNew: false })}
                  className={`text-left bg-[#161618] border border-white/[0.08] rounded-xl p-4 cursor-pointer hover:border-white/[0.15] transition-all duration-150 ${focusRingClass}`}
                  style={{ boxShadow: cardInset }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-medium text-white/[0.85]">{asset.name}</span>
                    <span className="text-[11px] font-medium bg-white/[0.06] text-white/[0.40] rounded-md px-1.5 py-0.5 flex-shrink-0">{asset.type}</span>
                  </div>
                  <p
                    className="text-[13px] text-white/[0.42] mt-1"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {asset.description}
                  </p>
                </button>
              ))}

              <button
                onClick={openNewAsset}
                className={`border border-dashed border-white/[0.08] rounded-xl p-4 flex items-center justify-center gap-2 text-[13px] text-white/[0.35] hover:text-white/[0.55] hover:border-white/[0.15] transition-all duration-150 cursor-pointer ${focusRingClass}`}
              >
                <i className="fa-solid fa-plus text-xs" /> Add asset
              </button>
            </div>
          </motion.section>

          {/* DANGER ZONE */}
          <div className="mt-10 pt-4 border-t border-white/[0.05]">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`text-[13px] text-error-30 hover:text-error-50 transition-colors duration-150 flex items-center gap-1.5 ${focusRingClass} rounded`}
            >
              <i className="fa-solid fa-trash text-xs" /> Delete site
            </button>
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={shouldReduce ? undefined : { opacity: 0, scaleY: 0 }}
                  animate={shouldReduce ? undefined : { opacity: 1, scaleY: 1 }}
                  exit={shouldReduce ? undefined : { opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ transformOrigin: 'top' }}
                  className="mt-3 bg-error-container rounded-xl p-4 flex items-center justify-between overflow-hidden"
                >
                  <span className="text-[14px] text-error-30">Delete {site.name}? This cannot be undone.</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className={`text-white/[0.50] hover:text-white/[0.75] px-3 py-1 rounded-lg transition-colors duration-150 ${focusRingClass}`}>Cancel</button>
                    <button onClick={handleDeleteSite} className={`text-error-30 hover:text-error-50 px-3 py-1 rounded-lg transition-colors duration-150 ${focusRingClass}`}>Delete</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </PageTransition>

      {/* Modals */}
      <ProfileEditModal open={profileModal} onClose={() => setProfileModal(false)} site={site} />
      <AIContextEditModal open={contextModal} onClose={() => setContextModal(false)} site={site} />
      <AssetEditModal open={assetModal.open} onClose={() => setAssetModal({ open: false, asset: null, isNew: false })} siteId={site.id} asset={assetModal.asset} isNew={assetModal.isNew} />
    </div>
  );
};

export default SiteDetail;
