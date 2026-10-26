'use client';

import React, { useState } from 'react';
import { RAGSettings } from '@/types/settings';
import { defaultSettings } from '@/lib/mockData';
import { Save, Check, Database, Cpu, Sliders } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<RAGSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">System Configuration</h2>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-accent-sky-bg text-accent-sky-text border border-accent-sky-border">
            RAG Orchestrator
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          Configure model providers, Qdrant vector database connection parameters, and retrieval thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LLM & Embeddings Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-border-subtle shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle text-xs font-bold text-on-surface">
            <Cpu className="w-4 h-4 text-secondary" />
            <span>Language &amp; Embedding Model Providers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-on-surface font-semibold mb-1.5">LLM Provider</label>
              <select
                value={settings.llmProvider}
                onChange={(e) =>
                  setSettings({ ...settings, llmProvider: e.target.value as any })
                }
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-xs"
              >
                <option value="openai">OpenRouter / OpenAI (GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="ollama">Local (Ollama / Llama 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-on-surface font-semibold mb-1.5">Model Identifier</label>
              <input
                type="text"
                value={settings.llmModel}
                onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-on-surface font-semibold mb-1.5">
                Embedding Model (Vector Output Dimension: 1536)
              </label>
              <input
                type="text"
                value={settings.embeddingModel}
                onChange={(e) => setSettings({ ...settings, embeddingModel: e.target.value })}
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
          </div>
        </div>

        {/* Qdrant Vector Store Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-border-subtle shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle text-xs font-bold text-on-surface">
            <Database className="w-4 h-4 text-secondary" />
            <span>Qdrant Vector Database Connection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-on-surface font-semibold mb-1.5">Qdrant Host URL</label>
              <input
                type="text"
                value={settings.qdrantUrl}
                onChange={(e) => setSettings({ ...settings, qdrantUrl: e.target.value })}
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface font-semibold mb-1.5">Collection Name</label>
              <input
                type="text"
                value={settings.qdrantCollection}
                onChange={(e) => setSettings({ ...settings, qdrantCollection: e.target.value })}
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-on-surface font-semibold mb-1.5">
                Qdrant API Key (Optional for local Docker instances)
              </label>
              <input
                type="password"
                value={settings.qdrantApiKey}
                onChange={(e) => setSettings({ ...settings, qdrantApiKey: e.target.value })}
                placeholder="Leave blank for local instance"
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
          </div>
        </div>

        {/* Retrieval Parameters Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-border-subtle shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle text-xs font-bold text-on-surface">
            <Sliders className="w-4 h-4 text-secondary" />
            <span>Vector Retrieval &amp; Chunking Hyperparameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-on-surface font-semibold mb-1.5">
                Top-K Retrieved Candidates (k)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.topK}
                onChange={(e) =>
                  setSettings({ ...settings, topK: parseInt(e.target.value, 10) || 4 })
                }
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface font-semibold mb-1.5">
                Min Cosine Threshold (0.00 – 1.00)
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={settings.similarityThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, similarityThreshold: parseFloat(e.target.value) || 0.75 })
                }
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface font-semibold mb-1.5">Chunk Size (Tokens)</label>
              <input
                type="number"
                value={settings.chunkTokens}
                onChange={(e) =>
                  setSettings({ ...settings, chunkTokens: parseInt(e.target.value, 10) || 512 })
                }
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface font-semibold mb-1.5">Chunk Overlap (Tokens)</label>
              <input
                type="number"
                value={settings.chunkOverlap}
                onChange={(e) =>
                  setSettings({ ...settings, chunkOverlap: parseInt(e.target.value, 10) || 50 })
                }
                className="w-full h-10 px-3.5 glass-card border border-border-subtle rounded-xl text-on-surface font-mono text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-on-surface-variant font-mono">
            Configuration persisted in Next.js environment.
          </div>
          <button
            type="submit"
            className="h-10 px-5 rounded-full bg-primary hover:bg-neutral-800 text-on-primary text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-status-indexed-text" />
                <span>Configuration Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-accent-sky-border" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
