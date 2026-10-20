export interface KnowledgeCollection {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  status: 'synced' | 'indexing' | 'error';
  lastSynced: string;
  icon: string;
  isPrimary?: boolean;
  embeddingModel: string;
  storageSizeMb: number;
}

export interface SemanticSearchResult {
  id: string;
  documentName: string;
  collectionName: string;
  chunkIndex: number;
  similarityScore: number;
  matchedText: string;
  pageNumber?: number;
  sectionTitle?: string;
  tokenCount: number;
}
