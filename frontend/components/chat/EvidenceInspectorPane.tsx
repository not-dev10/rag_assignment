'use client';

import React from 'react';
import { Citation } from '@/types/chat';

interface EvidenceInspectorPaneProps {
  citations: Citation[];
  selectedIndex: number | null;
  onSelectCitation: (index: number) => void;
  onClose?: () => void;
}

export const EvidenceInspectorPane: React.FC<EvidenceInspectorPaneProps> = ({
  citations,
  selectedIndex,
  onSelectCitation,
  onClose,
}) => {
  return (
    <div className="bg-surface-card rounded-xl p-4 shadow-sm border border-border-subtle flex flex-col gap-4">
      {/* Pane Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-accent-sky-text">
            find_in_page
          </span>
          <span className="text-sm font-semibold text-on-surface">Grounding Evidence</span>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-secondary">
            {citations.length} chunks
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:bg-canvas-bg hover:text-on-surface transition-colors"
            title="Close pane"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Chunks List */}
      <div className="flex flex-col gap-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {citations.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant text-xs flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-outline-variant">
              manage_search
            </span>
            <p>No citation chunks retrieved for the current response.</p>
          </div>
        ) : (
          citations.map((cite, idx) => {
            const isSelected = selectedIndex === idx;

            return (
              <div
                key={cite.id}
                onClick={() => onSelectCitation(idx)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-accent-sky-bg/40 border-accent-sky-border ring-2 ring-accent-sky-border/50'
                    : 'bg-surface-card border-border-subtle hover:border-border-strong'
                }`}
              >
                {/* Chunk Meta Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                      description
                    </span>
                    <span className="text-xs font-medium text-on-surface truncate" title={cite.filename}>
                      {cite.filename}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-status-indexed-bg text-status-indexed-text shrink-0">
                    {Math.round(cite.similarityScore * 100)}% Match
                  </span>
                </div>

                {/* Sub-meta */}
                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono">
                  {cite.pageNumber && <span>Page {cite.pageNumber}</span>}
                  {cite.tokenRange && (
                    <>
                      <span>•</span>
                      <span>{cite.tokenRange}</span>
                    </>
                  )}
                </div>

                {/* Section title */}
                {cite.sectionTitle && (
                  <p className="text-xs font-semibold text-primary">{cite.sectionTitle}</p>
                )}

                {/* Verbatim Excerpt */}
                <div className="p-2.5 rounded bg-canvas-bg text-xs text-on-surface-variant font-mono leading-relaxed border border-border-subtle/60">
                  <span className="bg-amber-100 text-amber-900 px-0.5 rounded font-medium">
                    &quot;{cite.excerpt}&quot;
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                  <span>Chunk #{cite.chunkIndex}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(cite.excerpt);
                    }}
                    className="hover:text-primary transition-colors flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>Copy chunk</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
