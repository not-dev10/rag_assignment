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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors font-mono cursor-pointer"
      title={`Click to inspect excerpt from ${citation.filename}`}
    >
      <FileText className="w-3 h-3 text-zinc-500" />
      <span>[{index + 1}]</span>
      <span className="truncate max-w-[140px] font-sans font-medium">{citation.filename}</span>
      {citation.pageNumber && <span className="text-zinc-500">p.{citation.pageNumber}</span>}
      <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
    </button>
  );
};
