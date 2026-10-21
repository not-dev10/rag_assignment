'use client';

import React, { useState } from 'react';
import { Citation } from '@/types/chat';
import { sampleCitations } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import { FileSearch, Search, FileText, Copy, Check, Terminal, Sparkles } from 'lucide-react';

export const RetrievalInspector: React.FC = () => {
  const [query, setQuery] = useState('annual leave submission procedure');
  const [citations, setCitations] = useState<Citation[]>(sampleCitations);
  const [exactContext, setExactContext] = useState<string>(
    `[System Prompt Context Injection]
The following evidence chunks were retrieved from Qdrant using vector similarity:

--- CHUNK 1 (employee_handbook.pdf, Page 12, Score: 0.910) ---
Leave requests must be submitted through the internal employee portal at least 5 business days in advance. A maximum of 5 unused days may be carried over to the following year.

--- CHUNK 2 (employee_handbook.pdf, Page 13, Score: 0.840) ---
Employees receive up to 10 days of paid sick leave annually. Medical documentation is required for continuous absences exceeding 3 business days.

Instructions: Answer the question using ONLY the retrieved chunks above. If the context does not contain the answer, state that explicitly.`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInspect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await ApiClient.askQuestion(query);
      setCitations(res.citations);
      setExactContext(res.retrievalContext || 'No context chunks retrieved.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyContext = () => {
    navigator.clipboard.writeText(exactContext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Retrieval &amp; Context Inspector</h2>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-accent-sky-bg text-accent-sky-text border border-accent-sky-border">
            Vector Space Debugger
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          Inspect vector cosine candidate chunks, metadata payloads, and the verbatim prompt context passed to the LLM.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleInspect} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-3 text-on-surface-variant" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Query vectors directly from Qdrant..."
            className="w-full h-10 pl-11 pr-4 text-xs glass-panel rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary shadow-xs transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-10 px-5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <FileSearch className="w-4 h-4 text-accent-sky-border" />
          <span>{isLoading ? 'Retrieving Chunks...' : 'Inspect Retrieval'}</span>
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Retrieved Chunks */}
        <div className="glass-panel rounded-2xl shadow-sm border border-border-subtle p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              Retrieved Chunks ({citations.length})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-semibold">
              Qdrant Points
            </span>
          </div>

          {citations.length === 0 ? (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No matching chunks found above threshold.
            </div>
          ) : (
            <div className="space-y-3">
              {citations.map((cite, idx) => (
                <div
                  key={cite.id || idx}
                  className="p-4 rounded-xl glass-card border border-border-subtle hover:border-secondary/50 transition-all flex flex-col gap-2.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-on-surface truncate">
                      <FileText className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <span className="truncate">{cite.filename}</span>
                    </div>
                    {cite.relevanceScore !== undefined && (
                      <span className="font-mono text-[11px] font-bold text-status-indexed-text bg-status-indexed-bg px-2.5 py-0.5 rounded-full border border-status-indexed-text/20">
                        {(cite.relevanceScore * 100).toFixed(1)}% Match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono">
                    <span>Chunk #{cite.chunkIndex}</span>
                    {cite.pageNumber && (
                      <>
                        <span>•</span>
                        <span>Page {cite.pageNumber}</span>
                      </>
                    )}
                    {cite.sectionTitle && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{cite.sectionTitle}</span>
                      </>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-canvas-bg/90 border border-border-subtle text-on-surface font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {cite.excerpt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Exact Context Passed to LLM */}
        <div className="glass-panel rounded-2xl shadow-sm border border-border-subtle p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
              <Terminal className="w-4 h-4 text-secondary" />
              <span>Prompt Injected Context</span>
            </div>
            <button
              type="button"
              onClick={handleCopyContext}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-card hover:bg-canvas-bg text-[11px] text-on-surface font-medium transition-colors border border-border-subtle"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-status-indexed-text" />
                  <span className="text-status-indexed-text font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto shadow-inner border border-zinc-800">
            {exactContext}
          </div>
        </div>
      </div>
    </div>
  );
};
