'use client';

import React, { useState, useRef } from 'react';
import { DocumentItem, IngestionPipelineConfig } from '@/types/document';
import { mockDocuments } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';

export const DocumentsManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<IngestionPipelineConfig>({
    chunkTokens: 512,
    chunkOverlap: 50,
    targetModel: 'text-embedding-3-large',
    preserveSentenceBoundaries: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(`Ingesting ${files[0].name}...`);

    try {
      const newDoc = await ApiClient.uploadDocument(files[0], config);
      setDocuments((prev) => [newDoc, ...prev]);
      setUploadProgress(null);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the vector store?`)) return;
    await ApiClient.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl text-on-surface font-bold tracking-tight">Document Library</h1>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-surface-container-low text-secondary">
              {documents.length} sources
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage, upload, chunk, and inspect vector embeddings across live collections.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="h-10 px-4 rounded-lg bg-surface-card text-on-surface text-xs font-medium border border-border-subtle hover:bg-surface-container-low shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">file_download</span>
            <span>Batch Export</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-5 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
            <span>Upload Documents</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.txt,.json,.docx"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Dropzone & Pipeline Config */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="xl:col-span-8 bg-surface-card rounded-xl p-7 shadow-sm border border-border-subtle flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-secondary transition-all"
        >
          <div className="border-2 border-dashed border-accent-sky-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-accent-sky-bg/30 hover:bg-accent-sky-bg/50 transition-all">
            <div className="w-14 h-14 rounded-full bg-accent-sky-bg flex items-center justify-center text-accent-sky-text shadow-xs mb-4 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[30px]">upload_file</span>
            </div>
            <h3 className="text-base text-on-surface font-semibold mb-1">
              Drop PDF, DOCX, TXT, or Markdown files here
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              or <span className="text-secondary font-medium underline underline-offset-2">browse files</span> from your local filesystem
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-[11px] font-mono text-on-surface-variant">
              <span className="px-2.5 py-1 rounded-full bg-surface-card shadow-2xs border border-border-subtle">
                PDF (Max 100MB)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-card shadow-2xs border border-border-subtle">
                Markdown (.md)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-card shadow-2xs border border-border-subtle">
                Plain Text (.txt)
              </span>
            </div>
          </div>

          {/* Chunking Settings */}
          <div className="mt-5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border-subtle/60">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.preserveSentenceBoundaries}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, preserveSentenceBoundaries: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-card after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
              </label>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface font-semibold flex items-center gap-1.5">
                  Semantic Chunking Pipeline
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-low text-secondary font-normal">
                    {config.chunkTokens} tokens / {config.chunkOverlap} overlap
                  </span>
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Token-aware sentence boundary preservation enabled
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
              <span>Model:</span>
              <span className="text-xs font-semibold text-primary px-2.5 py-1 rounded bg-surface-container-low">
                {config.targetModel}
              </span>
            </div>
          </div>

          {isUploading && uploadProgress && (
            <div className="mt-4 p-3 bg-accent-sky-bg text-accent-sky-text rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-accent-sky-text/30 border-t-accent-sky-text rounded-full animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}
        </div>

        {/* Pipeline Info Card */}
        <div className="xl:col-span-4 bg-surface-card rounded-xl p-6 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-on-surface">Vector Storage Rules</h3>
              <span className="text-[11px] font-mono text-status-indexed-text bg-status-indexed-bg px-2 py-0.5 rounded-full font-medium">
                Qdrant Ready
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Files are automatically converted into embeddings and stored in Qdrant collections. Blank chunks are filtered out and content hashes prevent duplicate chunks.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Distance Metric:</span>
                <span className="font-mono font-medium text-on-surface">Cosine</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Target Dimension:</span>
                <span className="font-mono font-medium text-on-surface">3,072-dim</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Upload Storage:</span>
                <span className="font-mono font-medium text-on-surface">python-ai/data/uploads</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
            <span>Files validated against MIME types and size limits prior to chunking.</span>
          </div>
        </div>
      </div>

      {/* Documents Library Table */}
      <div className="bg-surface-card rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-on-surface">Indexed Documents</span>
            <span className="text-xs font-mono text-on-surface-variant">
              ({selectedIds.length} of {documents.length} selected)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-surface/50 text-on-surface-variant uppercase tracking-wider font-mono">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === documents.length && documents.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border-strong text-primary focus:ring-primary"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">Document</th>
                <th className="py-3 px-4 font-semibold">Scope Collection</th>
                <th className="py-3 px-4 font-semibold">Chunks</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Ingestion Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {documents.map((doc) => {
                const isSelected = selectedIds.includes(doc.id);
                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-canvas-bg/60 transition-colors ${
                      isSelected ? 'bg-surface-container-low/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-border-strong text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2.5 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[20px] text-secondary">
                        {doc.mimeType.includes('pdf')
                          ? 'picture_as_pdf'
                          : doc.mimeType.includes('markdown')
                          ? 'code'
                          : 'article'}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{doc.filename}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-medium">
                      {doc.collectionName}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-on-surface">
                      {doc.chunkCount}
                    </td>
                    <td className="py-3 px-4">
                      {doc.status === 'indexed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-indexed-bg text-status-indexed-text font-medium font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-indexed-text" />
                          Indexed
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-processing-bg text-status-processing-text font-medium font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-processing-text animate-pulse" />
                          Processing
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-failed-bg text-status-failed-text font-medium font-mono text-[11px]">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono">
                      {doc.uploadedAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                          title="Delete from vector store"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
