'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Database, ShieldCheck } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/': 'Document Q&A',
  '/chat': 'Document Q&A',
  '/documents': 'Document Management',
  '/inspector': 'Retrieval Inspector',
  '/eval': 'RAG Quality Evaluation',
  '/settings': 'Configuration',
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const currentTitle = titleMap[pathname] || 'Document Q&A';

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-zinc-200 z-20 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-zinc-900">{currentTitle}</h1>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-600">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 font-mono text-[11px]">
          <Database className="w-3.5 h-3.5 text-zinc-500" />
          <span>knowledge_chunks</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Grounded Retrieval</span>
        </div>
      </div>
    </header>
  );
};
