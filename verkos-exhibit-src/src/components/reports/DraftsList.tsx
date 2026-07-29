import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReportStore } from '../../store/report.store';
import { DraftReport, Severity } from '../../types/report.types';
import DraftCard from './DraftCard';
import PageTransition from './PageTransition';

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
};

const DraftsList: React.FC = () => {
  const drafts = useReportStore((state) => state.drafts);
  const shouldReduce = useReducedMotion();

  const sortedDrafts = useMemo<DraftReport[]>(() => {
    return [...drafts].sort(
      (a, b) =>
        severityOrder[a.mission.highestSeverity] -
        severityOrder[b.mission.highestSeverity]
    );
  }, [drafts]);

  const pendingCount = drafts.filter((d) => d.status === 'ready_for_review').length;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-semibold tracking-tight text-white/[0.92]">Drafts</h1>
            {pendingCount > 0 && (
              <span className="text-[11px] font-medium bg-white/[0.08] text-white/[0.50] rounded-md px-1.5 py-0.5 tabular-nums">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-[13px] text-white/[0.42] mt-1">AI-generated drafts awaiting review</p>
        </div>

        {drafts.length === 0 ? (
          <div className="py-16">
            <p className="text-[14px] font-medium text-white/[0.85] mb-2">No pending drafts</p>
            <p className="text-[13px] text-white/[0.42] max-w-[42ch] leading-relaxed">
              Drafts appear here automatically after a patrol completes. Fly a mission from the
              FlytBase dashboard and the AI-generated draft will be waiting here for your review.
            </p>
          </div>
        ) : (
          <motion.div
            variants={shouldReduce ? undefined : listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {sortedDrafts.map((draft) => (
              <motion.div key={draft.id} variants={shouldReduce ? undefined : listItemVariants}>
                <DraftCard draft={draft} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default DraftsList;
