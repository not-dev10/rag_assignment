export interface RAGSettings {
  llmProvider: 'openai' | 'anthropic' | 'ollama';
  llmModel: string;
  embeddingModel: string;
  qdrantUrl: string;
  qdrantCollection: string;
  qdrantApiKey: string;
  topK: number;
  similarityThreshold: number;
  chunkTokens: number;
  chunkOverlap: number;
}
