import { ChatMessage, Citation } from '@/types/chat';
import { DocumentItem, IngestionStage } from '@/types/document';
import { EvalTestCase } from '@/types/eval';

const BASE_URL = process.env.NEXT_PUBLIC_NODE_API_URL || process.env.NODE_API_BASE_URL || 'http://127.0.0.1:4000';

export interface AskResponse {
  answer: string;
  citations: Citation[];
  isFallback: boolean;
  retrievalContext?: string;
  latencyMs: number;
}

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: options?.signal || controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`API error (${res.status}): ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // Ask question (POST /api/ask)
  static async askQuestion(
    question: string, 
    documentId?: string,
    conversationHistory?: Array<{question: string; answer: string}>,
    signal?: AbortSignal,
    documentIds?: string[]
  ): Promise<AskResponse> {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new Error('Question cannot be empty or whitespace.');
    }

    try {
      const response = await this.request<AskResponse>('/api/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: trimmed,
          document_id: documentId && documentId !== 'all' ? documentId : undefined,
          document_ids: documentIds?.length ? documentIds : undefined,
          conversation_history: conversationHistory || [],
        }),
        signal,
      });
      
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error('Failed to ask question:', error);
      throw error;
    }
  }

  // Get documents (GET /api/documents)
  static async getDocuments(): Promise<DocumentItem[]> {
    try {
      const res = await this.request<any>('/api/documents');
      const rawList = Array.isArray(res) ? res : (res?.documents || []);
      
      return rawList.map((d: any, idx: number) => ({
        id: d.document_id || d.id || `doc-${idx}`,
        filename: d.filename || 'Untitled Document',
        mimeType: d.mime_type || 'application/octet-stream',
        sizeBytes: d.size_bytes || 1024,
        chunkCount: d.chunk_count || 1,
        stage: (d.status === 'ready' ? 'indexed' : d.status) as IngestionStage,
        uploadedAt: d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : 'Recently',
      }));
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      // Return empty array instead of sample data
      return [];
    }
  }

  // Get document suggestions (GET /api/documents/:documentId/suggestions)
  static async getDocumentSuggestions(documentId: string): Promise<Array<{ label: string; query: string; category?: string }>> {
    try {
      const res = await this.request<any>(`/api/documents/${documentId}/suggestions`);
      if (res && Array.isArray(res.suggestions)) {
        return res.suggestions;
      }
      return [];
    } catch {
      return [];
    }
  }

  static generateDynamicSuggestions(documents: DocumentItem[]): Array<{ label: string; query: string; category?: string }> {
    const suggestions: Array<{ label: string; query: string; category?: string }> = [];
    const seenQueries = new Set<string>();

    const add = (label: string, query: string, category = 'General') => {
      if (!seenQueries.has(query)) {
        seenQueries.add(query);
        suggestions.push({ label, query, category });
      }
    };

    for (const doc of documents) {
      const fn = doc.filename.toLowerCase();
      const cleanName = doc.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
      const shortTitle = cleanName.length > 20 ? cleanName.substring(0, 18) + '...' : cleanName;

      if (fn.includes('resume') || fn.includes('cv')) {
        add(`${shortTitle} Profile`, `What is the professional background and experience outlined in ${doc.filename}?`, 'Candidate');
        add(`Technical Skills`, `What technical skills, programming languages, and tools are listed in ${doc.filename}?`, 'Skills');
        add(`Education & Projects`, `What education, degrees, and notable projects are described in ${doc.filename}?`, 'Projects');
      } else if (fn.includes('handbook') || fn.includes('policy') || fn.includes('guide')) {
        add(`${shortTitle} Policies`, `What are the primary rules, policies, and procedures outlined in ${doc.filename}?`, 'Policy');
        add(`Leave & Benefits`, `What are the leave policies, allowances, or employee benefits mentioned in ${doc.filename}?`, 'HR');
      } else if (fn.includes('spec') || fn.includes('architecture') || fn.includes('tech') || fn.includes('api')) {
        add(`System Architecture`, `What is the system design and architecture described in ${doc.filename}?`, 'Architecture');
        add(`Technical Requirements`, `What are the key technical specifications and requirements in ${doc.filename}?`, 'Specs');
      } else {
        add(`${shortTitle} Summary`, `What is the main topic and key takeaways of ${doc.filename}?`, 'Overview');
        add(`Key Details`, `What specific details, findings, or instructions are documented in ${doc.filename}?`, 'Details');
      }
    }

    if (suggestions.length === 0) {
      add('Knowledge Base Overview', 'What documents are indexed in this knowledge base and what topics do they cover?', 'Overview');
    }

    return suggestions;
  }

  // Upload document with multi-stage progress
  static async uploadDocument(
    file: File,
    onStageUpdate?: (stage: IngestionStage) => void
  ): Promise<DocumentItem> {
    try {
      onStageUpdate?.('uploaded');
      
      // Create FormData with the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      onStageUpdate?.('parsed');
      
      const response = await fetch(`${BASE_URL}/api/documents`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - browser will set it with boundary
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`);
      }

      onStageUpdate?.('chunked');
      
      const result = await response.json();
      
      onStageUpdate?.('embedded');
      
      // Small delay for UX
      await new Promise((r) => setTimeout(r, 200));
      
      onStageUpdate?.('indexed');

      // Convert backend response to DocumentItem
      return {
        id: result.document_id,
        filename: result.filename,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        chunkCount: result.chunk_count,
        stage: result.status === 'ready' ? 'indexed' : result.status,
        uploadedAt: new Date().toLocaleDateString(),
      };
    } catch (err: any) {
      console.error('Upload error:', err);
      throw new Error(err.message || 'Failed to upload document');
    }
  }

  // Delete document (DELETE /api/documents/:id)
  static async deleteDocument(id: string): Promise<boolean> {
    try {
      await this.request(`/api/documents/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('Delete failed:', err);
      throw err;
    }
  }

  // Re-index document (POST /api/documents/:id/reindex)
  static async reindexDocument(id: string): Promise<boolean> {
    try {
      await this.request(`/api/documents/${id}/reindex`, { method: 'POST' });
      return true;
    } catch (err) {
      console.error('Reindex failed:', err);
      throw err;
    }
  }

  // Run evaluation test case
  static async runEvalTestCase(testCase: EvalTestCase): Promise<EvalTestCase> {
    const start = performance.now();

    if (!testCase.query.trim()) {
      return {
        ...testCase,
        actualOutcome: 'validation_error',
        status: testCase.expectedOutcome === 'validation_error' ? 'passed' : 'failed',
        answer: 'Validation error: Empty/whitespace query rejected before API call.',
        citationsCount: 0,
        latencyMs: Math.round(performance.now() - start),
      };
    }

    try {
      const res = await this.askQuestion(testCase.query);
      const actualOutcome = res.isFallback ? 'fallback' : 'grounded';
      const passed = actualOutcome === testCase.expectedOutcome;

      return {
        ...testCase,
        actualOutcome,
        status: passed ? 'passed' : 'failed',
        answer: res.answer,
        citationsCount: res.citations.length,
        latencyMs: res.latencyMs || Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        ...testCase,
        actualOutcome: 'fallback',
        status: 'failed',
        answer: `Error: ${err.message}`,
        citationsCount: 0,
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  // Get system health (GET /api/health)
  static async getHealth(): Promise<any> {
    try {
      return await this.request<any>('/api/health');
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      return { status: 'degraded' };
    }
  }
}

export const generateDynamicSuggestions = ApiClient.generateDynamicSuggestions;
