import { ChatMessage, Citation } from '@/types/chat';
import { DocumentItem } from '@/types/document';
import { EvalTestCase } from '@/types/eval';
import { RAGSettings } from '@/types/settings';

export const defaultSettings: RAGSettings = {
  llmProvider: 'anthropic',
  llmModel: 'claude-3-5-sonnet-20241022',
  embeddingModel: 'text-embedding-3-large',
  qdrantUrl: 'http://localhost:6333',
  qdrantCollection: 'knowledge_chunks',
  qdrantApiKey: '',
  topK: 4,
  similarityThreshold: 0.75,
  chunkTokens: 512,
  chunkOverlap: 50,
};

export const sampleDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    filename: 'employee_handbook.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1420000,
    chunkCount: 24,
    stage: 'indexed',
    uploadedAt: '2026-10-18 14:20',
    rawTextPreview: `EMPLOYEE POLICIES & BENEFITS HANDBOOK
Section 3: Leave Policies
3.1 Annual Leave:
Employees accrue 20 days of paid annual leave per calendar year. Leave requests must be submitted through the internal employee portal at least 5 business days in advance. A maximum of 5 unused days may be carried over to the following year.
3.2 Sick Leave:
Employees receive up to 10 days of paid sick leave annually. Medical documentation is required for continuous absences exceeding 3 business days.`,
  },
  {
    id: 'doc-2',
    filename: 'architecture_overview.md',
    mimeType: 'text/markdown',
    sizeBytes: 48000,
    chunkCount: 8,
    stage: 'indexed',
    uploadedAt: '2026-10-19 09:12',
    rawTextPreview: `# Architecture Specification
## Service Boundaries
1. Next.js Frontend: Presentation, chat state, citation inspection.
2. Node.js API: Public gateway, file validation, rate limiting.
3. Python AI Microservice: Text extraction, semantic chunking, embeddings generation, vector storage in Qdrant, and generation.
Vector store: Qdrant vector database running on port 6333.`,
  },
  {
    id: 'doc-3',
    filename: 'qdrant_indexing_notes.txt',
    mimeType: 'text/plain',
    sizeBytes: 18000,
    chunkCount: 4,
    stage: 'indexed',
    uploadedAt: '2026-10-20 11:45',
    rawTextPreview: `Qdrant Index Configuration:
- Distance metric: Cosine
- Vector dimension: 3072 (compatible with text-embedding-3-large)
- Payload schema: document_id, filename, chunk_index, page_number, section_title, text, content_hash.`,
  },
];

export const sampleCitations: Citation[] = [
  {
    id: 'cite-1',
    documentId: 'doc-1',
    filename: 'employee_handbook.pdf',
    chunkIndex: 3,
    pageNumber: 12,
    sectionTitle: 'Section 3.1: Annual Leave Requests',
    excerpt: 'Leave requests must be submitted through the internal employee portal at least 5 business days in advance. A maximum of 5 unused days may be carried over to the following year.',
    relevanceScore: 0.91,
  },
  {
    id: 'cite-2',
    documentId: 'doc-1',
    filename: 'employee_handbook.pdf',
    chunkIndex: 4,
    pageNumber: 13,
    sectionTitle: 'Section 3.2: Sick Leave Documentation',
    excerpt: 'Employees receive up to 10 days of paid sick leave annually. Medical documentation is required for continuous absences exceeding 3 business days.',
    relevanceScore: 0.84,
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'How do I submit an annual leave request, and how many days can I carry over?',
    timestamp: '10:14 AM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `According to the employee handbook, annual leave requests must be submitted through the internal employee portal at least 5 business days in advance [1]. 

Employees accrue 20 days of paid annual leave per calendar year, and a maximum of 5 unused days may be carried over into the following year [1].`,
    timestamp: '10:14 AM',
    citations: [sampleCitations[0]],
    retrievalContext: `[Context 1] Source: employee_handbook.pdf (Page 12, Section 3.1)
"Employees accrue 20 days of paid annual leave per calendar year. Leave requests must be submitted through the internal employee portal at least 5 business days in advance. A maximum of 5 unused days may be carried over to the following year."`,
    latencyMs: 312,
  },
];

export const defaultEvalTestCases: EvalTestCase[] = [
  {
    id: 'test-1',
    scenarioId: 'T01',
    name: 'Grounded Query: Annual Leave Procedure',
    query: 'How do I submit an annual leave request?',
    expectedOutcome: 'grounded',
    status: 'idle',
    notes: 'Should answer with employee portal procedure and cite employee_handbook.pdf',
  },
  {
    id: 'test-2',
    scenarioId: 'T01',
    name: 'Grounded Query: Qdrant Vector Dimension',
    query: 'What vector dimension is configured for Qdrant in the notes?',
    expectedOutcome: 'grounded',
    status: 'idle',
    notes: 'Should answer 3072 dimensions citing qdrant_indexing_notes.txt',
  },
  {
    id: 'test-3',
    scenarioId: 'T02',
    name: 'Unanswerable Query: External Weather',
    query: 'What is the current temperature in Paris today?',
    expectedOutcome: 'fallback',
    status: 'idle',
    notes: 'Should abstain honestly with fallback message; no hallucinations',
  },
  {
    id: 'test-4',
    scenarioId: 'T03',
    name: 'Validation Error: Blank Whitespace Query',
    query: '    ',
    expectedOutcome: 'validation_error',
    status: 'idle',
    notes: 'Must perform inline/client validation without executing LLM call',
  },
];

// Compatibility exports for stale HMR caches
export const mockCollections = [];
export const mockSearchResults = [];
