'use client';

import React from 'react';
import { Citation } from '@/types/chat';
import { FileText, ExternalLink } from 'lucide-react';

interface CitationReferenceProps {
  index: number;
  citation: Citation;
  onClick: (citation: Citation) => void;
}

export const CitationReference: React.FC<CitationReferenceProps> = ({
  index,
  citation,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 my-0.5 rounded-full text-xs font-mono font-semibold bg-accent-sky-bg text-accent-sky-text border border-accent-sky-border hover:bg-accent-sky-border/30 transition-all cursor-pointer shadow-2xs group"
      title={`Click to inspect verbatim excerpt from ${citation.filename}`}
    >
      <FileText className="w-3 h-3 text-secondary shrink-0" />
      <span>[{index + 1}]</span>
      <span className="truncate max-w-[150px] font-sans font-medium text-on-surface">
        {citation.filename}
      </span>
      {citation.pageNumber && (
        <span className="text-secondary font-mono text-[10px]">p.{citation.pageNumber}</span>
      )}
      <ExternalLink className="w-2.5 h-2.5 text-accent-sky-text opacity-70 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
