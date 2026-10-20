'use client';

import React, { useState } from 'react';
import { Citation } from '@/types/chat';
import { sampleCitations } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import { FileSearch, Search, FileText, Copy, Check, Terminal } from 'lucide-react';

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
        <h2 className="text-base font-semibold text-zinc-900">Retrieval & Prompt Inspector</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Inspect retrieved vector chunks, relevance scores, and the exact context string injected into the LLM prompt.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleInspect} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Test a query against Qdrant retrieval..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileSearch className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Retrieving...' : 'Inspect Retrieval'}</span>
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Retrieved Chunks */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <span className="text-xs font-semibold text-zinc-800">
              Retrieved Chunks ({citations.length})
            </span>
            <span className="text-[11px] font-mono text-zinc-500">Qdrant Points</span>
          </div>

          {citations.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No matching chunks found above threshold.
            </div>
          ) : (
            <div className="space-y-3">
              {citations.map((cite, idx) => (
                <div
                  key={cite.id || idx}
                  className="p-3.5 rounded-md bg-zinc-50 border border-zinc-200 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-zinc-900 truncate">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{cite.filename}</span>
                    </div>
                    {cite.relevanceScore !== undefined && (
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Score: {cite.relevanceScore.toFixed(3)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
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
                        <span className="truncate">{cite.sectionTitle}</span>
                      </>
                    )}
                  </div>

                  <div className="p-2.5 rounded bg-white border border-zinc-200 text-zinc-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {cite.excerpt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Exact Context String passed to LLM */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <Terminal className="w-3.5 h-3.5 text-zinc-600" />
              <span>Exact Context Injected into Prompt</span>
            </div>
            <button
              type="button"
              onClick={handleCopyContext}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-md bg-zinc-900 text-zinc-100 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
            {exactContext}
          </div>
        </div>
      </div>
    </div>
  );
};
