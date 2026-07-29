import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReportStore } from '../../store/report.store';
import { Site } from '../../types/report.types';
import { useSites } from '@/libs/shared/api-modules/sites/hooks/use-sites';
import { mergeApiAndLocalSites } from '../../utils/map-api-site';

interface WizardSiteStepProps {
  value: string | null;
  onChange: (siteId: string, site: Site) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const WizardSiteStep: React.FC<WizardSiteStepProps> = ({ value, onChange }) => {
  const localSites = useReportStore((s) => s.sites);
  const { data: apiSites } = useSites();
  const sites = useMemo(
    () => mergeApiAndLocalSites(apiSites ?? [], localSites),
    [apiSites, localSites]
  );

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/[0.35] font-medium mb-1">Site</p>
      <p className="text-[13px] text-white/[0.42] mb-4">Which site is this patrol report for?</p>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        {sites.map((site) => {
          const isSelected = value === site.id;
          return (
            <motion.button
              key={site.id}
              variants={itemVariants}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
              onClick={() => onChange(site.id, site)}
              className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 ${
                isSelected
                  ? 'bg-primary-200/[0.04] border border-primary-200/30'
                  : 'bg-[#1C1C1F] border border-white/[0.06] hover:border-white/[0.15]'
              }`}
              aria-pressed={isSelected}
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fa-solid fa-location-dot text-white/[0.45] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-[14px] text-white/[0.85]">{site.name}</p>
                  <span className="text-[11px] font-medium bg-white/[0.06] text-white/[0.45] rounded-md px-2 py-0.5">{site.siteType}</span>
                </div>
                <p
                  className="text-[13px] text-white/[0.42] overflow-hidden"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                >
                  {site.description}
                </p>
                <p className="text-[12px] text-white/[0.30] mt-1 flex items-center gap-1">
                  <i className="fa-solid fa-location-dot text-xs" />{site.location}
                </p>
              </div>
              {isSelected && <i className="fa-solid fa-check text-white/[0.85] text-xs mt-1 flex-shrink-0" />}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WizardSiteStep;
