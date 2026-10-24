'use client';

import React, { useState, useRef } from 'react';
import { DocumentItem, IngestionStage } from '@/types/document';
import { sampleDocuments } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import {
  Upload,
  FileText,
  Trash2,
  RotateCw,
  Search,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';

export const DocumentsManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(sampleDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadStage, setCurrentUploadStage] = useState<IngestionStage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validExtensions = ['.pdf', '.md', '.txt'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Unsupported file format. Please upload .pdf, .md, or .txt files.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setCurrentUploadStage('uploaded');

    try {
      const newDoc = await ApiClient.uploadDocument(file, (stage) => {
        setCurrentUploadStage(stage);
      });
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err: any) {
      setUploadError(err.message || 'File ingestion failed. Please try again.');
    } finally {
      setIsUploading(false);
      setCurrentUploadStage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Are you sure you want to delete "${doc.filename}" and purge all its vectors from Qdrant?`)) {
      return;
    }

    await ApiClient.deleteDocument(doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    if (previewDoc?.id === doc.id) {
      setPreviewDoc(null);
    }
  };

  const handleReindex = async (doc: DocumentItem) => {
    setReindexingId(doc.id);
    try {
      await ApiClient.reindexDocument(doc.id);
    } finally {
      setReindexingId(null);
    }
  };

  const stageLabels: Record<IngestionStage, string> = {
    uploaded: '1. Uploaded',
    parsed: '2. Parsed',
    chunked: '3. Chunked',
    embedded: '4. Embedded',
    indexed: '5. Indexed',
    failed: 'Failed',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              DocuMind
            </h2>
            <p className="text-xs text-on-surface-variant">
              Ask questions grounded in your documents
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-accent-sky-bg text-accent-sky-text border border-accent-sky-text">
            {documents.length} sources
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Knowledge-base status */}
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full shadow-2xs border border-border-subtle gap-2">
            <span className="w-2 h-2 rounded-full bg-status-indexed-text" />
            <span className="text-xs font-medium text-on-surface">
              Indexed: {documents.length}
            </span>
          </div>

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="h-9 pl-9 pr-4 text-xs glass-card rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary w-56 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-on-primary text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-accent-sky-border" />
              <span>Upload File</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className="relative overflow-hidden glass-panel rounded-2xl p-8 border border-border-subtle shadow-sm hover:border-secondary/60 transition-all cursor-pointer group"
      >
        {/* Subtle radial ambient glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-accent-sky-bg rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="border-2 border-dashed border-accent-sky-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-accent-sky-bg/30 hover:bg-accent-sky-bg/50 transition-all">
          <div className="w-14 h-14 rounded-full bg-accent-sky-bg flex items-center justify-center text-accent-sky-text shadow-xs mb-3 group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-on-surface mb-1">
            Drop PDF, Markdown, or Plain Text files here
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">
            or <span className="text-secondary font-semibold underline underline-offset-2">browse files</span> from your local filesystem
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-on-surface-variant">
            <span className="px-3 py-1 rounded-full glass-card border border-border-subtle shadow-2xs">
              PDF (.pdf)
            </span>
            <span className="px-3 py-1 rounded-full glass-card border border-border-subtle shadow-2xs">
              Markdown (.md)
            </span>
            <span className="px-3 py-1 rounded-full glass-card border border-border-subtle shadow-2xs">
              Text (.txt)
            </span>
            <span className="px-3 py-1 rounded-full glass-card border border-border-subtle shadow-2xs">
              Max 25MB
            </span>
          </div>
        </div>

        {/* Real Ingestion Stage Progression */}
        {isUploading && currentUploadStage && (
          <div className="mt-5 pt-4 border-t border-border-subtle/80 w-full max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs text-on-surface font-mono mb-2">
              <span className="font-semibold text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-secondary animate-spin" />
                Pipeline Processing:
              </span>
              <span className="font-bold text-primary capitalize px-2 py-0.5 rounded bg-surface-container-low border border-border-subtle">
                {stageLabels[currentUploadStage]}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(['uploaded', 'parsed', 'chunked', 'embedded', 'indexed'] as IngestionStage[]).map(
                (stage, idx) => {
                  const stages: IngestionStage[] = ['uploaded', 'parsed', 'chunked', 'embedded', 'indexed'];
                  const currentIndex = stages.indexOf(currentUploadStage);
                  const isComplete = currentIndex >= idx;

                  return (
                    <div
                      key={stage}
                      className={`h-2 rounded-full transition-all ${
                        isComplete ? 'bg-secondary shadow-2xs' : 'bg-surface-container'
                      }`}
                      title={stage}
                    />
                  );
                }
              )}
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-status-failed-bg px-4 py-2 rounded-xl border border-status-failed-text/20">
            <AlertCircle className="w-4 h-4" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Documents Library Table */}
      <div className="glass-panel rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-on-surface">Indexed Documents</span>
            <span className="text-xs font-mono text-on-surface-variant font-medium">
              ({filteredDocuments.length} files available in Qdrant)
            </span>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant text-xs">
            No documents found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-low/40 text-on-surface-variant uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3.5 px-6 font-semibold">Filename</th>
                  <th className="py-3.5 px-4 font-semibold">Format</th>
                  <th className="py-3.5 px-4 font-semibold">Size</th>
                  <th className="py-3.5 px-4 font-semibold">Chunk Points</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Indexed Date</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-on-surface flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-accent-sky-bg text-secondary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-on-surface-variant uppercase">
                      {doc.filename.split('.').pop() || 'file'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                      {(doc.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 font-mono text-on-surface font-bold">
                      {doc.chunkCount} chunks
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-indexed-bg text-status-indexed-text border border-status-indexed-text/20 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Indexed</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                      {doc.uploadedAt}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        {doc.rawTextPreview && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-canvas-bg transition-colors cursor-pointer"
                            title="Preview extracted text"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleReindex(doc)}
                          disabled={reindexingId === doc.id}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-canvas-bg transition-colors cursor-pointer"
                          title="Re-index document"
                        >
                          <RotateCw
                            className={`w-4 h-4 ${
                              reindexingId === doc.id ? 'animate-spin text-secondary' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-status-failed-text hover:bg-status-failed-bg transition-colors cursor-pointer"
                          title="Delete from Qdrant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold text-on-surface truncate max-w-md">
                  {previewDoc.filename}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-canvas-bg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-on-surface bg-canvas-bg/90 whitespace-pre-wrap leading-relaxed">
              {previewDoc.rawTextPreview}
            </div>
            <div className="p-4 border-t border-border-subtle flex justify-between items-center text-xs text-on-surface-variant">
              <span className="font-mono">{previewDoc.chunkCount} vector points in collection</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-2xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};