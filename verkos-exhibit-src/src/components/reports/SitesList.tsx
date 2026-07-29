import React, { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { useReportStore } from '../../store/report.store';
import { Site } from '../../types/report.types';
import { useSites } from '@/libs/shared/api-modules/sites/hooks/use-sites';
import { mergeApiAndLocalSites } from '../../utils/map-api-site';
import PageTransition from './PageTransition';
import CreateSiteModal from './CreateSiteModal';
import ImportSitesModal from './ImportSitesModal';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const SiteCard: React.FC<{ site: Site; onOpen: () => void }> = ({ site, onOpen }) => {
  const shouldReduce = useReducedMotion();

  return (
    <motion.button
      variants={itemVariants}
      whileHover={shouldReduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onOpen}
      className="text-left overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 min-h-[380px] flex flex-col w-full"
      style={{
        background: '#161618',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.3)',
      }}
      aria-label={`View site: ${site.name}`}
    >
      {/* Hero zone */}
      <div className="relative h-[200px] overflow-hidden flex-shrink-0">
        {site.imageUrl ? (
          <img src={site.imageUrl} alt={site.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: getSiteGradient(site.id) }} />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 0%, #161618 100%)' }}
        />
        <span
          className="absolute top-4 right-4 text-[13px] font-medium text-white/[0.85] px-3.5 py-1.5"
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: '20px',
          }}
        >
          {site.siteType}
        </span>
        {site.id.startsWith('site-fb-') && (
          <span
            className="absolute top-4 left-4 text-[11px] font-medium text-white/[0.70] px-2.5 py-1 inline-flex items-center gap-1.5"
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '20px',
            }}
          >
            <i className="fa-solid fa-cloud-arrow-down text-[9px]" />
            FlytBase
          </span>
        )}
      </div>

      {/* Content zone */}
      <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
        <h3 className="text-[20px] font-semibold text-white/[0.92] tracking-tight">
          {site.name}
        </h3>
        <p
          className="text-[13px] text-white/[0.45] mt-2 leading-relaxed"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {site.description}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-center gap-2 text-[12px] text-white/[0.35]">
            <i className="fa-solid fa-location-dot text-[10px]" />
            <span>{site.location}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-white/[0.35] mt-1.5">
            <i className="fa-solid fa-clock text-[10px]" />
            <span>{site.operatingHours}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

const SitesList: React.FC = () => {
  const navigate = useNavigate();
  const localSites = useReportStore((s) => s.sites);
  const { data: apiSites, isLoading } = useSites();
  const sites = useMemo(
    () => mergeApiAndLocalSites(apiSites ?? [], localSites),
    [apiSites, localSites]
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white/[0.92]">Sites</h1>
            <p className="text-[13px] text-white/[0.42] mt-1">
              Site context helps AI generate more accurate reports
            </p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className={`flex items-center gap-2 text-[13px] font-medium bg-[#1C1C1F] border border-white/[0.08] text-white/[0.75] hover:text-white/[0.95] hover:border-white/[0.15] px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50`}
          >
            <i className="fa-solid fa-cloud-arrow-down text-[11px]" />
            Import from FlytBase
          </button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {isLoading && sites.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <i className="fa-solid fa-spinner fa-spin text-white/[0.25] text-xl mb-2" />
              <p className="text-[14px] text-white/[0.45]">Loading sites…</p>
            </div>
          )}
          {!isLoading && sites.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <i className="fa-solid fa-location-dot text-white/[0.15] text-2xl mb-2" />
              <p className="text-[14px] text-white/[0.55] mb-1">No sites configured</p>
              <p className="text-[13px] text-white/[0.35] mb-4">Add sites to start creating reports.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-primary-200 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary-100 transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-cloud-arrow-down text-[11px]" />
                  Import from FlytBase
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-white/[0.60] hover:text-white/[0.85] border border-white/[0.08] hover:border-white/[0.15] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[11px]" />
                  Create manually
                </button>
              </div>
            </div>
          )}

          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onOpen={() =>
                navigate({ to: '/site/$siteId', params: { siteId: site.id } as never })
              }
            />
          ))}

          {sites.length > 0 && (
            <motion.button
              variants={itemVariants}
              onClick={() => setShowCreateModal(true)}
              className="min-h-[380px] flex flex-col items-center justify-center gap-3 cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 hover:bg-white/[0.02] transition-all duration-200"
              style={{
                border: '1px dashed rgba(255, 255, 255, 0.10)',
                borderRadius: '20px',
              }}
              aria-label="Create new site"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.08] transition-all duration-150">
                <i className="fa-solid fa-plus text-white/[0.30] text-sm" />
              </div>
              <span className="text-[14px] text-white/[0.35] group-hover:text-white/[0.55] transition-colors duration-150">
                New site
              </span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {showCreateModal && <CreateSiteModal onClose={() => setShowCreateModal(false)} />}
      {showImportModal && <ImportSitesModal onClose={() => setShowImportModal(false)} />}
    </PageTransition>
  );
};

export default SitesList;
