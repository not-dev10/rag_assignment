'use client';

import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-card/90 backdrop-blur-md z-40 border-b border-border-subtle">
      <div className="w-full h-full px-8 flex items-center justify-between gap-6">
        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indexed docs, embeddings, or queries..."
              className="w-full h-10 pl-10 pr-12 rounded-lg bg-canvas-bg border border-border-subtle text-on-surface text-sm placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-surface-card text-on-surface-variant text-[11px] font-mono border border-border-strong">
              /
            </kbd>
          </div>
        </div>

        {/* Right Controls & Profile */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative p-2 rounded-full text-on-surface-variant hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-card" />
          </button>

          <button
            type="button"
            className="p-2 rounded-full text-on-surface-variant hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-[22px]">light_mode</span>
          </button>

          <div className="h-6 w-[1px] bg-border-subtle" />

          {/* User & Cluster Status */}
          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end">
              <span className="text-xs text-on-surface font-semibold">Alex Mercer</span>
              <span className="text-[10px] text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded-full border border-accent-sky-border font-mono font-medium">
                Prod-Cluster-01
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-semibold text-xs ring-1 ring-border-strong">
              AM
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
