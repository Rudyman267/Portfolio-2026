/**
 * Template App Layout
 *
 * Main application layout with collapsible sidebar and content area.
 */

import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import DemoModeFrame from './DemoModeFrame';
import FlytBaseTopHeader from './FlytBaseTopHeader';
import { useAuth } from '@auth';
import { useDbSync } from '@/hooks/useDbSync';

interface TemplateAppLayoutProps {
  children: React.ReactNode;
}

const TemplateAppLayout: React.FC<TemplateAppLayoutProps> = ({ children }) => {
  const { orgId } = useAuth();
  useDbSync(orgId);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 'ml-[56px]' : 'ml-[200px]';

  // 44px top header sits above sidebar + content
  return (
    <div className="h-screen w-full bg-[#0F0F11]">
      <FlytBaseTopHeader />
      <div className="flex h-[calc(100vh-44px)] w-full pt-[44px]">
        <div className="fixed left-0 top-[44px] bottom-0">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </div>
        <main className={`flex-1 overflow-auto transition-all duration-150 ${sidebarWidth}`}>
          {children}
        </main>
        <DemoModeFrame />
      </div>
    </div>
  );
};

export default TemplateAppLayout;
