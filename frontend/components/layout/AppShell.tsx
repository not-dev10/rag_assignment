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
      <Sidebar />
      <div className="pl-72">
        <Header />
        <main className="w-full pt-16 min-h-screen px-8 py-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
