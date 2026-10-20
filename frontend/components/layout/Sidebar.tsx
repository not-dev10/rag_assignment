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
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Chat', href: '/', icon: MessageSquare },
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
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-zinc-200 z-30 flex flex-col">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-zinc-200">
        <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-white font-semibold text-xs">
          R
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            RAG Assistant
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-zinc-900' : 'text-zinc-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection Indicator */}
      <div className="p-3 border-t border-zinc-200">
        <div className="px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/60 flex items-center justify-between text-xs text-zinc-600">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Qdrant Local</span>
          </span>
          <span className="font-mono text-[11px] text-zinc-500">:6333</span>
        </div>
      </div>
    </aside>
  );
};
