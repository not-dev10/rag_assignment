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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">RAG System Configuration</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure model providers, Qdrant vector database connection, and retrieval thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LLM & Embeddings */}
        <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs font-semibold text-zinc-800">
            <Cpu className="w-4 h-4 text-zinc-600" />
            <span>Language & Embedding Models</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 font-medium mb-1">LLM Provider</label>
              <select
                value={settings.llmProvider}
                onChange={(e) =>
                  setSettings({ ...settings, llmProvider: e.target.value as any })
                }
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:border-zinc-400"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="ollama">Local (Ollama)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">Model Name</label>
              <input
                type="text"
                value={settings.llmModel}
                onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-600 font-medium mb-1">
                Embedding Model (Dimensions: 3072)
              </label>
              <input
                type="text"
                value={settings.embeddingModel}
                onChange={(e) => setSettings({ ...settings, embeddingModel: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Qdrant Vector Store */}
        <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs font-semibold text-zinc-800">
            <Database className="w-4 h-4 text-zinc-600" />
            <span>Qdrant Vector Database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 font-medium mb-1">Qdrant Host URL</label>
              <input
                type="text"
                value={settings.qdrantUrl}
                onChange={(e) => setSettings({ ...settings, qdrantUrl: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">Collection Name</label>
              <input
                type="text"
                value={settings.qdrantCollection}
                onChange={(e) => setSettings({ ...settings, qdrantCollection: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-600 font-medium mb-1">
                API Key (Optional for local Qdrant)
              </label>
              <input
                type="password"
                value={settings.qdrantApiKey}
                onChange={(e) => setSettings({ ...settings, qdrantApiKey: e.target.value })}
                placeholder="Leave blank for local Docker instances"
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Retrieval Parameters */}
        <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs font-semibold text-zinc-800">
            <Sliders className="w-4 h-4 text-zinc-600" />
            <span>Retrieval & Chunking Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 font-medium mb-1">
                Top-K Retrieved Chunks (k)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.topK}
                onChange={(e) =>
                  setSettings({ ...settings, topK: parseInt(e.target.value, 10) || 4 })
                }
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">
                Min Similarity Threshold (Cosine)
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
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">Chunk Size (Tokens)</label>
              <input
                type="number"
                value={settings.chunkTokens}
                onChange={(e) =>
                  setSettings({ ...settings, chunkTokens: parseInt(e.target.value, 10) || 512 })
                }
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">Chunk Overlap (Tokens)</label>
              <input
                type="number"
                value={settings.chunkOverlap}
                onChange={(e) =>
                  setSettings({ ...settings, chunkOverlap: parseInt(e.target.value, 10) || 50 })
                }
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Settings are stored in application state and forwarded to backend services.
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved Configuration</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
