'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Files,
  FileSearch,
  CheckCircle2,
  Settings,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'AI Chat', href: '/', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: Files },
  { name: 'Retrieval Inspector', href: '/inspector', icon: FileSearch },
  { name: 'Evaluation', href: '/eval', icon: CheckCircle2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/chat';
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-64 glass-panel rounded-2xl shadow-[0_4px_24px_-4px_rgba(16,24,40,0.06),0_1px_2px_-1px_rgba(16,24,40,0.03)] z-50 flex-col p-4 border border-border-subtle">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
          <Sparkles className="w-5 h-5 text-accent-sky-border" />
        </div>
        <div className="flex flex-col">
          <span className="text-base text-primary tracking-tight font-bold">
            RAGSpace
          </span>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-semibold">
            Vector Engine
          </span>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-3 mb-2">
        <span className="text-[10px] text-on-surface-variant/70 font-mono uppercase tracking-widest font-semibold">
          Workspace
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all text-sm font-medium ${
                active
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-on-primary' : 'text-on-surface-variant'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Health & Telemetry */}
      <div className="mt-auto p-3.5 rounded-xl bg-surface-container-low/80 border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-indexed-text animate-pulse" />
          <span className="text-[11px] text-on-surface font-medium">v2.4 Online</span>
        </div>
        <span className="text-[10px] text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded-full border border-accent-sky-border font-mono font-semibold">
          42ms
        </span>
      </div>
      </aside>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around gap-1 border-t border-border-subtle bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-label={item.name}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium ${
              active ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="max-w-full truncate">{item.name === 'Retrieval Inspector' ? 'Inspector' : item.name}</span>
          </Link>
        );
      })}
      </nav>
    </>
  );
};
