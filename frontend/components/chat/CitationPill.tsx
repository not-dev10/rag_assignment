'use client';

import React from 'react';

interface CitationPillProps {
  label: string;
  citationId?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const CitationPill: React.FC<CitationPillProps> = ({
  label,
  onClick,
  isActive = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
        isActive
          ? 'bg-secondary text-on-secondary shadow-xs ring-1 ring-secondary'
          : 'bg-accent-sky-bg text-accent-sky-text border border-accent-sky-border hover:bg-surface-container-low hover:border-secondary'
      }`}
      title="Click to inspect source chunk in Evidence Pane"
    >
      <span className="material-symbols-outlined text-[13px]">verified</span>
      <span>{label}</span>
    </button>
  );
};
