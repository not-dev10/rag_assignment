'use client';

import React from 'react';
import { Citation } from '@/types/chat';
import { X, FileText, CheckCircle2, Copy } from 'lucide-react';

interface PassageDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export const PassageDrawer: React.FC<PassageDrawerProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-[420px] glass-panel shadow-2xl z-50 flex flex-col p-4 sm:p-6 border-l border-border-subtle animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-sky-bg text-secondary flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Grounding Source Passage</h2>
            <span className="text-[10px] font-mono text-accent-sky-text uppercase tracking-wider">
              Qdrant Vector Payload
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-canvas-bg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata Badges */}
      <div className="py-4 space-y-2.5 border-b border-border-subtle text-xs">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Document File:</span>
          <span className="font-semibold text-on-surface truncate max-w-[220px]" title={citation.filename}>
            {citation.filename}
          </span>
        </div>
        {citation.pageNumber && (
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Page Number:</span>
            <span className="font-mono font-semibold text-secondary px-2 py-0.5 rounded bg-accent-sky-bg border border-accent-sky-border text-[11px]">
              Page {citation.pageNumber}
            </span>
          </div>
        )}
        {citation.chunkIndex !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Chunk Index:</span>
            <span className="font-mono font-semibold text-on-surface">
              #{citation.chunkIndex}
            </span>
          </div>
        )}
        {citation.relevanceScore !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Cosine Relevance:</span>
            <span className="font-mono text-status-indexed-text font-bold bg-status-indexed-bg px-2 py-0.5 rounded-full border border-status-indexed-text/20">
              {citation.relevanceScore.toFixed(3)} Match
            </span>
          </div>
        )}
        {citation.sectionTitle && (
          <div className="pt-1.5">
            <span className="text-on-surface-variant block mb-1">Section Heading:</span>
            <span className="font-semibold text-primary block bg-surface-container-low px-2.5 py-1.5 rounded-lg border border-border-subtle text-[11px]">
              {citation.sectionTitle}
            </span>
          </div>
        )}
      </div>

      {/* Verbatim Excerpt */}
      <div className="flex-1 py-4 overflow-y-auto">
        <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">
          Verbatim Chunk Excerpt:
        </span>
        <div className="p-4 rounded-xl bg-canvas-bg/90 border border-border-strong/70 text-xs text-on-surface font-mono leading-relaxed whitespace-pre-wrap">
          <span className="bg-amber-100/90 text-amber-950 px-1 py-0.5 rounded">
            &quot;{citation.excerpt}&quot;
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-1.5 text-status-indexed-text font-medium">
          <CheckCircle2 className="w-4 h-4 text-status-indexed-text" />
          <span>Grounded in Corpus</span>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(citation.excerpt);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Excerpt</span>
        </button>
      </div>
    </div>
  );
};
