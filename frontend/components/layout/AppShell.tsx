'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900">
      <Sidebar />
      <div className="pl-60">
        <Header />
        <main className="pt-14 min-h-screen p-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
