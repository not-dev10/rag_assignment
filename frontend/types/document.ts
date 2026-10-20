export type IngestionStage = 'uploaded' | 'parsed' | 'chunked' | 'embedded' | 'indexed' | 'failed';

export interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  stage: IngestionStage;
  uploadedAt: string;
  rawTextPreview?: string;
  errorMessage?: string;
}

export interface IngestionPipelineConfig {
  chunkTokens: number;
  chunkOverlap: number;
  targetModel: string;
}
