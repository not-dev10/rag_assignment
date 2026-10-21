'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '@/types/chat';
import { initialChatMessages } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import { MessageItem } from './MessageItem';
import { PassageDrawer } from './PassageDrawer';
import { Send, Trash2, Loader2, AlertCircle, Sparkles, Shield, Cpu } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStrictGrounding, setIsStrictGrounding] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [inspectMessage, setInspectMessage] = useState<ChatMessage | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    setError(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await ApiClient.askQuestion(query);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations,
        isFallback: res.isFallback,
        retrievalContext: res.retrievalContext,
        latencyMs: res.latencyMs,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearConversation = () => {
    if (messages.length === 0) return;
    if (confirm('Clear the current conversation?')) {
      setMessages([]);
      setSelectedCitation(null);
      setInspectMessage(null);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Top Telemetry & Context Command Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-card px-3.5 py-1.5 rounded-full shadow-2xs border border-border-subtle">
            <span className="w-2 h-2 rounded-full bg-status-indexed-text" />
            <span className="text-xs font-semibold text-on-surface">
              Enterprise Compliance Hub
            </span>
            <span className="text-[10px] font-mono font-semibold text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded-full border border-accent-sky-border">
              Hybrid-v3
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-on-surface-variant text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-secondary" />
            <span>Claude 3.5 + text-embedding-3-large</span>
            <span>•</span>
            <span>k=4</span>
            <span>•</span>
            <span>Min Cosine: 0.75</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Grounding Strictness Pill */}
          <div className="flex items-center glass-card px-3 py-1.5 rounded-full shadow-2xs border border-border-subtle gap-2">
            <Shield className="w-3.5 h-3.5 text-status-indexed-text" />
            <span className="text-xs font-medium text-on-surface">Strict Grounding</span>
            <label className="relative inline-flex items-center cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={isStrictGrounding}
                onChange={(e) => setIsStrictGrounding(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-secondary" />
            </label>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearConversation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:bg-canvas-bg text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border border-border-subtle"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
            <div className="w-12 h-12 rounded-2xl bg-accent-sky-bg text-secondary flex items-center justify-center mb-3 shadow-2xs">
              <Sparkles className="w-6 h-6 text-accent-sky-text" />
            </div>
            <div className="text-base font-bold text-on-surface mb-1">
              Document Grounded Q&amp;A
            </div>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Type your question below. Answers will be retrieved directly from the indexed Qdrant vector store with clickable citations.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onSelectCitation={(cite) => setSelectedCitation(cite)}
              onOpenInspector={(m) => setInspectMessage(m)}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl glass-card border border-border-subtle text-xs text-on-surface-variant max-w-md shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-secondary shrink-0" />
            <span>Retrieving chunks from Qdrant vector space &amp; verifying evidence...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-status-failed-bg border border-status-failed-text/30 text-xs text-status-failed-text max-w-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-status-failed-text" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Glassmorphic Multiline Composer */}
      <div className="pt-4 border-t border-border-subtle/80 bg-canvas-bg/80 backdrop-blur-xs">
        <form
          onSubmit={handleSubmit}
          className="relative glass-panel rounded-2xl p-3 border border-border-subtle focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 shadow-sm transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask questions grounded in indexed documents... (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="w-full resize-none bg-transparent p-1 pr-28 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60 mt-1">
            <span className="text-[11px] font-mono text-on-surface-variant/70">
              Grounding: Strict Verification Active
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant/60 hidden sm:inline font-mono">
                ↵ Enter
              </span>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                  !input.trim() || isLoading
                    ? 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed'
                    : 'bg-primary hover:bg-neutral-800 text-on-primary cursor-pointer'
                }`}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Send Query</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Source Passage Inspector Drawer */}
      <PassageDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* LLM Retrieval Context Debug View */}
      {inspectMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Exact Context Injected into LLM Prompt
                </h3>
                <span className="text-[10px] font-mono text-secondary">
                  Retrieved Candidates for Message #{inspectMessage.id.slice(-4)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectMessage(null)}
                className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface text-xs font-medium hover:bg-surface-container"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-zinc-100 bg-zinc-950 rounded-b-xl whitespace-pre-wrap leading-relaxed">
              {inspectMessage.retrievalContext}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
