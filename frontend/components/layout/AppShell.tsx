'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-canvas-bg text-on-surface antialiased">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area offset by Sidebar */}
      <div className="pl-72">
        {/* Fixed Top Header */}
        <Header />

        {/* Dynamic Route Content */}
        <main className="w-full pt-16 min-h-screen bg-canvas-bg px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};
