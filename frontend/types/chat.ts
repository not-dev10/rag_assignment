export interface Citation {
  id: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  excerpt: string;
  similarityScore: number;
  tokenRange?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Citation[];
  groundingStatus?: 'strict' | 'partial' | 'fallback';
  groundingScore?: number;
  tokenCount?: number;
  latencyMs?: number;
  model?: string;
}

export interface ThreadSession {
  id: string;
  title: string;
  sourceCount: number;
  groundingPercentage: number;
  lastUpdated: string;
  pinned: boolean;
  collectionScope: string;
}
