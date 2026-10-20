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

    // Supported file validation
    const validExtensions = ['.pdf', '.md', '.txt'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError(`Unsupported file format. Please upload .pdf, .md, or .txt files.`);
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
    if (!confirm(`Are you sure you want to delete "${doc.filename}" and remove all its vectors from Qdrant?`)) {
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
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Knowledge Base Documents</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Upload PDF, Markdown, or Text files to extract text, generate embeddings, and index into Qdrant.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter documents..."
              className="h-8 pl-8 pr-3 text-xs bg-white border border-zinc-200 rounded-md text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
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

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-6 bg-white transition-colors cursor-pointer flex flex-col items-center justify-center text-center"
      >
        <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 mb-2">
          <Upload className="w-4 h-4" />
        </div>
        <div className="text-xs font-medium text-zinc-800">
          Click or drag files here to upload
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">
          Supports .pdf, .md, and .txt files (up to 25MB)
        </div>

        {/* Multi-stage ingestion progress indicator */}
        {isUploading && currentUploadStage && (
          <div className="mt-4 pt-3 border-t border-zinc-100 w-full max-w-md">
            <div className="flex items-center justify-between text-xs text-zinc-700 font-mono mb-2">
              <span>Ingestion Pipeline:</span>
              <span className="font-semibold text-zinc-900 capitalize">
                {stageLabels[currentUploadStage]}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['uploaded', 'parsed', 'chunked', 'embedded', 'indexed'] as IngestionStage[]).map(
                (stage, idx) => {
                  const stages: IngestionStage[] = ['uploaded', 'parsed', 'chunked', 'embedded', 'indexed'];
                  const currentIndex = stages.indexOf(currentUploadStage);
                  const isComplete = currentIndex >= idx;

                  return (
                    <div
                      key={stage}
                      className={`h-1.5 rounded-full transition-all ${
                        isComplete ? 'bg-zinc-900' : 'bg-zinc-200'
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
          <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <span className="text-xs font-semibold text-zinc-700">
            Indexed Files ({filteredDocuments.length})
          </span>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No documents found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                  <th className="py-2.5 px-4 font-medium">Filename</th>
                  <th className="py-2.5 px-4 font-medium">Format</th>
                  <th className="py-2.5 px-4 font-medium">Size</th>
                  <th className="py-2.5 px-4 font-medium">Chunks</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Uploaded</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-zinc-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 uppercase">
                      {doc.filename.split('.').pop() || 'file'}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500">
                      {(doc.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-700 font-medium">
                      {doc.chunkCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Indexed</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500">{doc.uploadedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {doc.rawTextPreview && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Preview extracted text"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleReindex(doc)}
                          disabled={reindexingId === doc.id}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                          title="Re-index document"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${
                              reindexingId === doc.id ? 'animate-spin text-zinc-900' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[80vh] flex flex-col shadow-xl border border-zinc-200">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-600" />
                <span className="text-sm font-semibold text-zinc-900 truncate max-w-md">
                  {previewDoc.filename}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-zinc-800 bg-zinc-50 whitespace-pre-wrap leading-relaxed">
              {previewDoc.rawTextPreview}
            </div>
            <div className="p-3 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500">
              <span>{previewDoc.chunkCount} vector points generated</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1 rounded bg-zinc-900 text-white font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
