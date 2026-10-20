export interface Citation {
  id: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  excerpt: string;
  relevanceScore?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  isFallback?: boolean;
  retrievalContext?: string;
  latencyMs?: number;
}
