import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getConfig } from '../config.js';
import { AIServiceUnavailableError, RetrievalFailedError, ModelProviderError, IngestionFailedError } from '../schemas/errors.js';

let client: AxiosInstance | null = null;

function createClient(): AxiosInstance {
  const config = getConfig();

  const instance = axios.create({
    baseURL: config.PYTHON_AI_BASE_URL,
    timeout: config.REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (req: InternalAxiosRequestConfig) => {
      req.headers['X-Request-ID'] = (req as any).requestId || 'unknown';
      return req;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new AIServiceUnavailableError('Cannot connect to AI service');
      }
      if (error.response?.status === 504 || error.code === 'ETIMEDOUT') {
        throw new AIServiceUnavailableError('AI service request timed out');
      }
      if (error.response?.status === 500) {
        const data = error.response.data as any;
        if (data?.error?.code === 'MODEL_PROVIDER_ERROR') {
          throw new ModelProviderError(data.error.message, data.error.details);
        }
        if (data?.error?.code === 'RETRIEVAL_FAILED') {
          throw new RetrievalFailedError(data.error.message, data.error.details);
        }
        if (data?.error?.code === 'INGESTION_FAILED') {
          throw new IngestionFailedError(data.error.message, data.error.details);
        }
      }
      throw error;
    }
  );

  return instance;
}

export function getAIClient(): AxiosInstance {
  if (!client) {
    client = createClient();
  }
  return client;
}

export function resetAIClient(): void {
  client = null;
}

export interface HealthResponse {
  status: string;
}

export interface DocumentIngestResponse {
  document_id: string;
  filename: string;
  status: 'processing' | 'ready' | 'failed';
  chunk_count: number;
  error_message?: string;
}

export interface DocumentListItem {
  document_id: string;
  filename: string;
  mime_type: string;
  content_hash: string;
  uploaded_at: string;
  status: 'processing' | 'ready' | 'failed';
  chunk_count: number;
  error_message?: string;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
}

export interface AskRequest {
  question: string;
}

export interface Source {
  filename: string;
  page_number?: number;
  section_title?: string;
  chunk_id: string;
  excerpt: string;
}

export interface AskResponse {
  answer: string;
  status: 'answered' | 'fallback';
  sources: Source[];
}

export async function checkPythonHealth(): Promise<{ healthy: boolean; details?: string }> {
  try {
    const axiosClient = getAIClient();
    const response = await axiosClient.get<HealthResponse>('/health');
    return { healthy: response.data.status === 'ok' };
  } catch (error) {
    return { healthy: false, details: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function ingestDocument(
  file: Buffer,
  filename: string,
  mimeType: string,
  requestId: string
): Promise<DocumentIngestResponse> {
  const axiosClient = getAIClient();
  const formData = new FormData();
  const blob = new Blob([file], { type: mimeType });
  formData.append('file', blob, filename);

  const response = await axiosClient.post<DocumentIngestResponse>('/documents/ingest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Request-ID': requestId,
    },
  });
  return response.data;
}

export async function listDocuments(requestId: string): Promise<DocumentListResponse> {
  const axiosClient = getAIClient();
  const response = await axiosClient.get<DocumentListResponse>('/documents', {
    headers: { 'X-Request-ID': requestId },
  });
  return response.data;
}

export async function deleteDocument(documentId: string, requestId: string): Promise<void> {
  const axiosClient = getAIClient();
  await axiosClient.delete(`/documents/${documentId}`, {
    headers: { 'X-Request-ID': requestId },
  });
}

export async function askQuestion(question: string, requestId: string): Promise<AskResponse> {
  const axiosClient = getAIClient();
  const response = await axiosClient.post<AskResponse>(
    '/ask',
    { question } as AskRequest,
    { headers: { 'X-Request-ID': requestId } }
  );
  return response.data;
}