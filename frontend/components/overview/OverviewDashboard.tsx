'use client';

import React from 'react';
import Link from 'next/link';
import { mockDocuments } from '@/lib/mockData';

export const OverviewDashboard: React.FC = () => {
  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Greeting & Action Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card rounded-2xl p-6 shadow-sm border border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl text-primary font-bold tracking-tight">
              Welcome back, Dr. Aris
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-indexed-bg text-status-indexed-text text-xs font-medium border border-status-indexed-text/20">
              <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text animate-pulse" />
              Operational
            </span>
          </div>
          <p className="text-sm text-on-surface-variant flex items-center gap-2">
            <span>
              Knowledge base status:{' '}
              <strong className="font-medium text-on-surface">99.4% synced</strong> across 3 vector collections
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="text-xs font-mono text-accent-sky-text">Qdrant Cluster Synced 3m ago</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card text-primary text-sm font-medium border border-border-subtle shadow-xs hover:bg-canvas-bg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Quick Upload</span>
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>New Chat</span>
          </Link>
        </div>
      </div>

      {/* Four Metric Islands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Stat 1: Total Documents */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Documents</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">description</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl text-primary font-bold">1,428</span>
            <span className="inline-flex items-center gap-1 text-xs text-status-indexed-text bg-status-indexed-bg px-2 py-0.5 rounded-full font-medium">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              +12% this week
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
            <span>3 active collections linked</span>
          </div>
        </div>

        {/* Stat 2: Indexed Chunks */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs uppercase tracking-wider font-semibold">Indexed Chunks</span>
            <div className="w-8 h-8 rounded-lg bg-accent-sky-bg flex items-center justify-center text-accent-sky-text">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl text-primary font-bold">48,219</span>
            <span className="text-xs font-mono text-on-surface-variant">512 token avg</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
            <span>99.8% embedded in Qdrant</span>
          </div>
        </div>

        {/* Stat 3: Embedding Model */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Vector Model</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-lg text-primary font-bold truncate">text-embedding-3-large</span>
            <span className="text-xs font-mono text-on-surface-variant mt-0.5">3,072 dims • Cosine</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
            <span>HNSW indexing active</span>
          </div>
        </div>

        {/* Stat 4: Avg Retrieval Latency */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs uppercase tracking-wider font-semibold">Retrieval Latency</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">speed</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl text-primary font-bold">42ms</span>
            <span className="inline-flex items-center gap-1 text-xs text-status-indexed-text bg-status-indexed-bg px-2 py-0.5 rounded-full font-medium">
              -8ms vs avg
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
            <span>p95 response time 84ms</span>
          </div>
        </div>
      </div>

      {/* Recent Ingestion Activity Table */}
      <div className="bg-surface-card rounded-2xl p-6 shadow-sm border border-border-subtle flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-on-surface">Recent Ingestion Activity</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-medium">
              Live Pipeline
            </span>
          </div>
          <Link
            href="/documents"
            className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
          >
            <span>View All Documents</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-on-surface-variant uppercase tracking-wider font-mono">
                <th className="pb-3 font-semibold">Document Name</th>
                <th className="pb-3 font-semibold">Scope Collection</th>
                <th className="pb-3 font-semibold">Chunk Count</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Ingestion Timestamp</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {mockDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-canvas-bg/50 transition-colors">
                  <td className="py-3.5 pr-4 flex items-center gap-2 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      {doc.mimeType.includes('pdf') ? 'picture_as_pdf' : 'description'}
                    </span>
                    <span className="truncate max-w-xs">{doc.filename}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-on-surface-variant font-medium">
                    {doc.collectionName}
                  </td>
                  <td className="py-3.5 pr-4 font-mono font-medium text-on-surface">
                    {doc.chunkCount} chunks
                  </td>
                  <td className="py-3.5 pr-4">
                    {doc.status === 'indexed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-indexed-bg text-status-indexed-text font-medium font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
                        Indexed
                      </span>
                    )}
                    {doc.status === 'processing' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-processing-bg text-status-processing-text font-medium font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-processing-text animate-pulse" />
                        Embedding...
                      </span>
                    )}
                    {doc.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-failed-bg text-status-failed-text font-medium font-mono text-[11px]">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-on-surface-variant font-mono">
                    {doc.uploadedAt}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href="/chat"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-canvas-bg hover:bg-surface-container text-on-surface font-medium transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      <span>Ask Doc</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
