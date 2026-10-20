'use client';

import React, { useState } from 'react';
import { KnowledgeCollection, SemanticSearchResult } from '@/types/collection';
import { mockCollections, mockSearchResults } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';

export const CollectionsManager: React.FC = () => {
  const [collections] = useState<KnowledgeCollection[]>(mockCollections);
  const [query, setQuery] = useState('high risk ai governance requirements');
  const [topK, setTopK] = useState(5);
  const [minCosine, setMinCosine] = useState(0.80);
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>(mockSearchResults);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await ApiClient.searchVectors(query, topK, minCosine);
      setSearchResults(results);
    } catch {
      setSearchResults(mockSearchResults);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] w-full mx-auto pb-12">
      {/* Top Section: Knowledge Collections */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-accent-sky-text font-mono font-semibold">
                Index Repositories
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-border-strong" />
              <span className="text-[11px] text-on-surface-variant font-mono">
                {collections.length} Active Scopes
              </span>
            </div>
            <h2 className="text-2xl text-on-surface font-bold tracking-tight">
              Knowledge Collections
            </h2>
            <p className="text-sm text-on-surface-variant max-w-2xl">
              Organize documents into distinct retrieval scopes for fine-tuned RAG agents and specialized vector embeddings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-neutral-800 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Collection</span>
            </button>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-surface-card shadow-xs transition-all hover:shadow-md border ${
                col.isPrimary
                  ? 'border-accent-sky-border ring-1 ring-accent-sky-border'
                  : 'border-border-subtle'
              }`}
            >
              {col.isPrimary && (
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-accent-sky-bg text-accent-sky-text text-[10px] font-mono font-semibold ring-1 ring-accent-sky-border">
                  Primary Grounding Corpus
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-4 mt-1 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-sky-bg text-accent-sky-text flex items-center justify-center shadow-2xs">
                    <span className="material-symbols-outlined text-[22px]">{col.icon}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-status-indexed-bg text-status-indexed-text px-2.5 py-1 rounded-full text-xs font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
                    <span>Synced</span>
                  </div>
                </div>

                <h3 className="text-base text-on-surface font-semibold tracking-tight group-hover:text-secondary transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
                  <span>{col.documentCount} docs</span>
                  <span>•</span>
                  <span>{col.chunkCount.toLocaleString()} chunks</span>
                  <span>•</span>
                  <span>{col.storageSizeMb} MB</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                  <span>Model: {col.embeddingModel.split('-')[0]}...</span>
                  <span className="text-accent-sky-text font-medium">Updated {col.lastSynced}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Semantic Search Sandbox */}
      <section className="bg-surface-card rounded-2xl p-6 sm:p-8 shadow-sm border border-border-subtle flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-secondary">
              Vector Space Inspector
            </span>
          </div>
          <h2 className="text-xl text-on-surface font-bold tracking-tight">
            Semantic Vector Search Sandbox
          </h2>
          <p className="text-xs text-on-surface-variant">
            Test direct vector cosine similarity retrieval without triggering LLM synthesis.
          </p>
        </div>

        {/* Search Input and Parameter Sliders */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[20px] text-on-surface-variant pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter natural language query to retrieve matching Qdrant points..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-canvas-bg border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="h-11 px-6 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">saved_search</span>
              )}
              <span>Query Vectors</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-canvas-bg/60 border border-border-subtle">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Min Cosine Similarity:</span>
                <span className="font-mono font-semibold text-primary">{minCosine.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={minCosine}
                onChange={(e) => setMinCosine(parseFloat(e.target.value))}
                className="w-full accent-secondary cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Top-k Candidates:</span>
                <span className="font-mono font-semibold text-primary">{topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-full accent-secondary cursor-pointer"
              />
            </div>
          </div>
        </form>

        {/* Results List */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-on-surface">
            Retrieved Points ({searchResults.length} matches)
          </span>

          {searchResults.map((res) => (
            <div
              key={res.id}
              className="p-4 rounded-xl bg-canvas-bg border border-border-subtle hover:border-border-strong transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    article
                  </span>
                  <span className="text-xs font-semibold text-on-surface truncate">
                    {res.documentName}
                  </span>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    (Chunk #{res.chunkIndex})
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-status-indexed-bg text-status-indexed-text shrink-0">
                  {(res.similarityScore * 100).toFixed(1)}% Cosine
                </span>
              </div>

              {res.sectionTitle && (
                <span className="text-xs font-medium text-primary">{res.sectionTitle}</span>
              )}

              <p className="text-xs text-on-surface-variant font-mono bg-surface-card p-3 rounded-lg border border-border-subtle/60 leading-relaxed">
                &quot;{res.matchedText}&quot;
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
