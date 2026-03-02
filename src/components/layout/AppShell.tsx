import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-void text-text-primary selection:bg-primary/20 selection:text-text-primary">
      {/* Sidebar - fixed-width or collapsed icon-rail */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-smooth overflow-hidden">
        {/* Topbar - contextual strip */}
        <Topbar />

        {/* Page Content */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-bg-void">
          <div className="flex-1 p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
