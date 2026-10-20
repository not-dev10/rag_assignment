'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/', icon: 'home' },
  { name: 'AI Chat', href: '/chat', icon: 'auto_awesome' },
  { name: 'Documents', href: '/documents', icon: 'folder' },
  { name: 'Collections', href: '/collections', icon: 'layers' },
  { name: 'Semantic Search', href: '/search', icon: 'saved_search' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/overview';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-64 bg-surface-card rounded-xl shadow-[0_1px_3px_0_rgba(16,24,40,0.04),0_1px_2px_-1px_rgba(16,24,40,0.02)] z-50 flex flex-col p-4 border border-border-subtle">
      {/* Brand & Engine Identifier */}
      <div className="flex items-center gap-3 px-3 py-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm tracking-wider shadow-sm">
          RS
        </div>
        <div className="flex flex-col">
          <span className="text-base text-primary tracking-tight font-semibold">RAGSpace</span>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">
            Vector Engine
          </span>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-3 mb-2">
        <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">
          Workspace
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all text-sm font-medium ${
                active
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-canvas-bg hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="my-3 border-t border-border-subtle" />

        <Link
          href="#settings"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-on-surface-variant hover:bg-canvas-bg hover:text-on-surface transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </Link>
      </nav>

      {/* Bottom Health & Latency Telemetry */}
      <div className="mt-auto p-3 rounded-lg bg-surface-container-low border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-indexed-text animate-pulse" />
          <span className="text-[11px] text-on-surface-variant font-medium">v2.4 Online</span>
        </div>
        <span className="text-[11px] text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded border border-accent-sky-border font-mono font-medium">
          42ms
        </span>
      </div>
    </aside>
  );
};
