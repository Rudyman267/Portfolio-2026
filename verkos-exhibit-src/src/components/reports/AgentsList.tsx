import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReportStore } from '../../store/report.store';
import { Agent, AgentStatus } from '../../types/report.types';
import PageTransition from './PageTransition';
import CreateAgentWizard from './CreateAgentWizard';


const domainGradients: Record<string, string> = {
  security: 'radial-gradient(ellipse at 20% 30%, rgba(0, 205, 150, 0.20) 0%, transparent 70%)',
  inspection: 'radial-gradient(ellipse at 20% 30%, rgba(245, 158, 11, 0.20) 0%, transparent 70%)',
  surveillance: 'radial-gradient(ellipse at 20% 30%, rgba(73, 109, 200, 0.20) 0%, transparent 70%)',
  custom: 'radial-gradient(ellipse at 20% 30%, rgba(107, 114, 128, 0.15) 0%, transparent 70%)',
};

const statusDotClass: Record<AgentStatus, string> = {
  active: 'bg-success-30',
  inactive: 'bg-text-disabled',
};

const statusTextClass: Record<AgentStatus, string> = {
  active: 'text-success-30',
  inactive: 'text-white/[0.30]',
};

const statusLabel: Record<AgentStatus, string> = {
  active: 'Available',
  inactive: 'Unavailable',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const cardInset = 'inset 0 1px 0 rgba(255,255,255,0.04)';
const cardShadow = '0 1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)';

const AgentCard: React.FC<{ agent: Agent; onOpen: () => void }> = ({ agent, onOpen }) => {
  const shouldReduce = useReducedMotion();
  const hover = shouldReduce ? undefined : { y: -2 };

  return (
    <motion.button
      variants={itemVariants}
      whileHover={hover}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={onOpen}
      className="group relative text-left bg-[#161618] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.15] hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 flex flex-col"
      style={{ boxShadow: `${cardInset}, ${cardShadow}` }}
      aria-label={`View ${agent.name}`}
    >
      {/* Gradient header */}
      <div
        className="h-[80px] w-full flex items-center px-5"
        style={{ background: domainGradients[agent.domain] || domainGradients.custom }}
      >
        <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/[0.06]">
          <i className={`${agent.icon} text-sm text-white/[0.60]`} />
        </span>
      </div>

      {/* Content */}
      <div className="px-5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-medium text-white/[0.88]">{agent.name}</span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDotClass[agent.status]}`} />
            <span className={`text-[11px] font-medium ${statusTextClass[agent.status]}`}>{statusLabel[agent.status]}</span>
          </span>
        </div>
        <p
          className="text-[13px] text-white/[0.42] mt-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.5',
          }}
        >
          {agent.description}
        </p>
      </div>

      {/* Stats footer */}
      <div className="px-5 pt-3 pb-4 flex items-center gap-2 overflow-hidden">
        <span className="bg-[#1C1C1F] rounded-lg px-3 py-1.5 flex items-center shrink-0">
          <span className="text-[13px] font-medium text-white/[0.85]">{agent.reportCount}</span>
          <span className="text-[11px] text-white/[0.40] ml-1">reports</span>
        </span>
        <span className="bg-[#1C1C1F] rounded-lg px-3 py-1.5 flex items-center shrink-0">
          <span className="text-[13px] font-medium text-white/[0.85]">{agent.config.detectionEvents.length}</span>
          <span className="text-[11px] text-white/[0.40] ml-1">events</span>
        </span>
        <span className="bg-[#1C1C1F] rounded-lg px-3 py-1.5 flex items-center min-w-0">
          <span className="text-[13px] font-medium text-white/[0.85] capitalize truncate">{agent.config.tone}</span>
          <span className="text-[11px] text-white/[0.40] ml-1 shrink-0">tone</span>
        </span>
      </div>
    </motion.button>
  );
};

const AgentsList: React.FC = () => {
  const navigate = useNavigate();
  const agents = useReportStore((s) => s.agents);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold tracking-tight text-white/[0.92]">Agents</h1>
          <p className="text-[13px] text-white/[0.42] mt-1">
            Configure AI reporting agents for different operations
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onOpen={() =>
                navigate({ to: '/agent/$agentId', params: { agentId: agent.id } as never })
              }
            />
          ))}

          {/* New agent dashed card */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="border border-dashed border-white/[0.10] rounded-xl w-full min-h-[200px] flex flex-col items-center justify-center gap-2 hover:border-white/[0.20] hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
              aria-label="Create new agent"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.08] transition-all duration-150">
                <i className="fa-solid fa-plus text-white/[0.40] text-xs" />
              </div>
              <span className="text-[14px] text-white/[0.40] group-hover:text-white/[0.65] transition-colors duration-150">
                New agent
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateModal && <CreateAgentWizard onClose={() => setShowCreateModal(false)} />}
      </AnimatePresence>
    </PageTransition>
  );
};

export default AgentsList;
