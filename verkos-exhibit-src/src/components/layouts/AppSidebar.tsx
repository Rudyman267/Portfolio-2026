import React from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useReportStore } from '../../store/report.store';

interface NavItemProps {
  icon: string;
  label: string;
  path: string;
  badge?: number;
  currentPath: string;
  collapsed: boolean;
  matchPrefix?: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  badge,
  currentPath,
  path,
  collapsed,
  matchPrefix,
  onClick,
}) => {
  const isActive =
    currentPath === path ||
    (path === '/' && currentPath === '/') ||
    (matchPrefix ? currentPath.startsWith(matchPrefix) : false);

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2 px-2.5 py-[7px] rounded-lg fb-body-2 transition-all duration-150 cursor-pointer w-full text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 relative ${
        collapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-white/[0.06] text-white/[0.92]'
          : 'text-white/[0.50] hover:text-white/[0.80] hover:bg-white/[0.04]'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
    >
      {/* Active left accent */}
      {isActive && (
        <span className="absolute left-0 top-1/4 h-1/2 w-[2px] bg-primary-200 rounded-full" />
      )}
      <i className={`${icon} text-xs flex-shrink-0`} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-white/[0.08] text-white/[0.50] rounded-md px-1.5 py-0 text-[11px] font-medium tabular-nums min-w-[16px] text-center">
          {badge}
        </span>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-warning-30" />
      )}
    </button>
  );
};

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
};

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const agents = useReportStore((state) => state.agents);
  const activeAgentCount = agents.filter((a) => a.status === 'active').length;
  const demoMode = useReportStore((s) => s.demoMode);
  const exitDemoMode = useReportStore((s) => s.exitDemoMode);
  const enterDemoMode = useReportStore((s) => s.enterDemoMode);
  const shouldReduce = useReducedMotion();

  const currentPath = location.pathname;
  const width = collapsed ? 'w-[56px]' : 'w-[200px]';

  const MotionWrap: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    shouldReduce ? (
      <>{children}</>
    ) : (
      <motion.div
        variants={navContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-0.5"
      >
        {children}
      </motion.div>
    );

  const Item: React.FC<NavItemProps> = (props) =>
    shouldReduce ? (
      <NavItem {...props} />
    ) : (
      <motion.div variants={navItemVariants} className="relative">
        <NavItem {...props} />
      </motion.div>
    );

  return (
    <aside
      className={`bg-[#0C0C0E] border-r border-white/[0.06] h-screen fixed left-0 top-0 flex flex-col transition-all duration-200 ${width}`}
      aria-label="Main navigation"
    >
      {/* Workspace mark / collapse toggle */}
      <div
        className={`flex items-center border-b border-white/[0.04] h-[44px] flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'px-2.5 gap-2'
        }`}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-white/[0.92] text-[10px] font-semibold hover:bg-white/[0.06] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
            aria-label="Expand sidebar"
          >
            V
          </button>
        ) : (
          <>
            <span className="w-7 h-7 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-white/[0.92] text-[10px] font-semibold flex-shrink-0">
              V
            </span>
            <span className="fb-body-1 text-white/[0.92] flex-1 truncate">Verkos</span>
            <button
              onClick={onToggle}
              className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-white/[0.30] hover:text-white/[0.50] hover:bg-white/[0.10] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <i className="fa-solid fa-chevron-left text-[9px]" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5">
        <MotionWrap>
          <Item
            icon="fa-solid fa-file-lines"
            label="Reports"
            path="/"
            currentPath={currentPath}
            collapsed={collapsed}
            matchPrefix="/report/"
            onClick={() => navigate({ to: '/' })}
          />
        </MotionWrap>

        {/* Divider */}
        <div className={`my-2 border-t border-white/[0.04] ${collapsed ? 'mx-1' : 'mx-3'}`} />

        <MotionWrap>
          <Item
            icon="fa-solid fa-tower-broadcast"
            label="Flights"
            path="/flights"
            currentPath={currentPath}
            collapsed={collapsed}
            matchPrefix="/flight/"
            onClick={() => navigate({ to: '/flights' })}
          />
          <Item
            icon="fa-solid fa-robot"
            label="Agents"
            path="/agents"
            badge={activeAgentCount}
            currentPath={currentPath}
            collapsed={collapsed}
            matchPrefix="/agent/"
            onClick={() => navigate({ to: '/agents' })}
          />
          <Item
            icon="fa-solid fa-table-columns"
            label="Templates"
            path="/templates"
            currentPath={currentPath}
            collapsed={collapsed}
            onClick={() => navigate({ to: '/templates' })}
          />
        </MotionWrap>
      </nav>

      {/*
        EXHIBIT: the "Try demo mode" CTA and the "Demo mode · Exit" badge that
        used to sit here are removed. The exhibit runs in demo mode permanently,
        so a toggle would either do nothing or empty the app out from under a
        visitor. The surrounding page already states it is sample data.
      */}
    </aside>
  );
};

export default AppSidebar;
