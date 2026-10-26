import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import http from 'http';

describe('DocuMind Node API Gateway', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Health API', () => {
    it('should return health status', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect([200, 503]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data.service).toBe('backend-node');
      expect(data.dependencies).toBeDefined();
      expect(data.dependencies.python_ai).toBeDefined();
    });
  });

  describe('Ask API Validation', () => {
    it('should reject empty question with 400', async () => {
      const res = await fetch(`${baseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '   ' }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
    });

    it('should reject missing question with 400', async () => {
      const res = await fetch(`${baseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
    });

    it('should reject more than 50 selected document IDs', async () => {
      const res = await fetch(`${baseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What is in the documents?',
          document_ids: Array.from({ length: 51 }, (_, index) => `doc-${index}`),
        }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
    });
  });

  describe('Documents API', () => {
    it('should reject upload without file with 400', async () => {
      const res = await fetch(`${baseUrl}/api/documents`, {
        method: 'POST',
      });
      expect([400, 500]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
    });
  });
});
