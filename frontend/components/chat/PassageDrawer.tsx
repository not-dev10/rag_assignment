'use client';

import React from 'react';
import { Citation } from '@/types/chat';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface PassageDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export const PassageDrawer: React.FC<PassageDrawerProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-zinc-200 shadow-lg z-50 flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-700" />
          <h2 className="text-sm font-semibold text-zinc-900">Source Passage</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata */}
      <div className="py-4 space-y-2 border-b border-zinc-100 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">Document:</span>
          <span className="font-medium text-zinc-900 truncate max-w-[200px]" title={citation.filename}>
            {citation.filename}
          </span>
        </div>
        {citation.pageNumber && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Page:</span>
            <span className="font-mono text-zinc-900">{citation.pageNumber}</span>
          </div>
        )}
        {citation.chunkIndex !== undefined && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Chunk Index:</span>
            <span className="font-mono text-zinc-900">#{citation.chunkIndex}</span>
          </div>
        )}
        {citation.relevanceScore !== undefined && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Relevance Score:</span>
            <span className="font-mono text-emerald-700 font-medium">
              {citation.relevanceScore.toFixed(3)}
            </span>
          </div>
        )}
        {citation.sectionTitle && (
          <div className="pt-1">
            <span className="text-zinc-500 block mb-0.5">Section:</span>
            <span className="font-medium text-zinc-800">{citation.sectionTitle}</span>
          </div>
        )}
      </div>

      {/* Verbatim Excerpt */}
      <div className="flex-1 py-4 overflow-y-auto">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Retrieved Passage Content
        </div>
        <div className="p-3.5 rounded bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 font-mono leading-relaxed whitespace-pre-wrap">
          {citation.excerpt}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified Qdrant Point</span>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(citation.excerpt);
          }}
          className="hover:text-zinc-900 text-xs font-medium cursor-pointer"
        >
          Copy passage
        </button>
      </div>
    </div>
  );
};
