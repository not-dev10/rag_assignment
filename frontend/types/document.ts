export type DocumentStatus = 'indexed' | 'processing' | 'failed';

export interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  status: DocumentStatus;
  uploadedAt: string;
  collectionId: string;
  collectionName: string;
  errorMessage?: string;
  author?: string;
}

export interface IngestionPipelineConfig {
  chunkTokens: number;
  chunkOverlap: number;
  targetModel: string;
  preserveSentenceBoundaries: boolean;
}
