import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">
        <Topbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
