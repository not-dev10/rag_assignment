'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, ShieldCheck, Database } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/': 'AI Document Chat',
  '/chat': 'AI Document Chat',
  '/documents': 'Document Ingestion Pipeline',
  '/inspector': 'Retrieval & Prompt Inspector',
  '/eval': 'RAG Quality Evaluation',
  '/settings': 'System Configuration',
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const currentTitle = titleMap[pathname] || 'AI Document Chat';

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 glass-panel z-40 border-b border-border-subtle">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Title & Collection Context */}
        <div className="flex items-center gap-3">
          <h1 className="max-w-[52vw] truncate text-sm font-bold text-on-surface tracking-tight">{currentTitle}</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-indexed-bg text-status-indexed-text text-xs font-mono font-medium border border-status-indexed-text/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text animate-pulse" />
            Grounding Verified
          </span>
        </div>

        {/* Search & Cluster Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search indexed vectors..."
              className="w-64 h-9 pl-9 pr-10 rounded-full bg-canvas-bg/80 border border-border-subtle text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-surface-card text-on-surface-variant text-[10px] font-mono border border-border-strong">
              /
            </kbd>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative p-2 rounded-full text-on-surface-variant hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-border-subtle" />

          {/* User & Cluster Status */}
          <div className="flex items-center gap-3 pl-1">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-on-surface font-semibold">Dr. Aris</span>
              <span className="text-[10px] text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded-full border border-accent-sky-border font-mono font-semibold">
                Cluster-US-East
              </span>
            </div>
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs ring-2 ring-accent-sky-border shadow-xs">
              DA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
