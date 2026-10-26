'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas-bg text-on-surface antialiased">
      <Sidebar />
      <div className="min-w-0 lg:pl-72">
        <Header />
        <main className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-16 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};
