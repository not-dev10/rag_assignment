'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '@/types/chat';
import { DocumentItem } from '@/types/document';
import { ApiClient, generateDynamicSuggestions } from '@/lib/api';
import { MessageItem } from './MessageItem';
import { PassageDrawer } from './PassageDrawer';
import { Send, Trash2, Loader2, AlertCircle, Sparkles, Shield, Cpu, ArrowRight, FileText, X } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);  // Start with empty array
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStrictGrounding, setIsStrictGrounding] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [inspectMessage, setInspectMessage] = useState<ChatMessage | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; query: string; category?: string }>>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);  // Multiple document IDs
  const [showDocSelector, setShowDocSelector] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents and dynamic suggestions
  useEffect(() => {
    ApiClient.getDocuments()
      .then(async (docs) => {
        setDocuments(docs);
        
        // Generate suggestions based on selected documents
        const selectedDocs = selectedDocIds.length > 0 
          ? docs.filter(d => selectedDocIds.includes(d.id))
          : docs;
        
        const sugs = generateDynamicSuggestions(selectedDocs);
        setSuggestions(sugs);
      })
      .catch(() => {});
  }, [selectedDocIds]);

  // Toggle document selection
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Select all documents
  const selectAllDocuments = () => {
    setSelectedDocIds(documents.map(d => d.id));
  };

  // Clear selection
  const clearDocumentSelection = () => {
    setSelectedDocIds([]);
  };

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

  const executeQuery = async (queryText: string) => {
    const query = queryText.trim();
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
      // Build conversation history from recent messages (last 3 Q&A pairs)
      const conversationHistory = [];
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user' && messages[i + 1]?.role === 'assistant') {
          conversationHistory.push({
            question: messages[i].content,
            answer: messages[i + 1].content
          });
        }
      }
      const recentHistory = conversationHistory.slice(-3);

      // Pass selected document IDs to backend for filtering
      const docId = selectedDocIds.length === 1 ? selectedDocIds[0] : undefined;
      const res = await ApiClient.askQuestion(query, docId, recentHistory);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeQuery(input);
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

  const selectedDocsLabel = selectedDocIds.length === 0 
    ? `All Documents (${documents.length})`
    : selectedDocIds.length === 1
    ? documents.find(d => d.id === selectedDocIds[0])?.filename || '1 document'
    : `${selectedDocIds.length} documents`;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-card px-3.5 py-1.5 rounded-full shadow-2xs border border-border-subtle">
            <span className="w-2 h-2 rounded-full bg-status-indexed-text" />
            <span className="text-xs font-semibold text-on-surface">
              DocuMind
            </span>
            <span className="text-[10px] font-mono font-semibold text-accent-sky-bg px-2 py-0.5 rounded-full border border-accent-sky-bg">
              Hybrid-v3
            </span>
          </div>

          {/* Document Scope Selector */}
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full shadow-2xs border border-border-subtle">
            <FileText className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="text-xs font-medium text-on-surface-variant">{selectedDocsLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Indicator */}
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full shadow-2xs border border-border-subtle">
            <span className="w-2 h-2 rounded-full bg-status-indexed-text animate-pulse" />
            <span className="text-xs font-medium text-on-surface">Free Tier</span>
            <span className="text-[10px] text-on-surface-variant/70">~3-5s latency</span>
          </div>

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
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-on-surface-variant max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-accent-sky-bg text-secondary flex items-center justify-center mb-3 shadow-2xs">
              <Sparkles className="w-6 h-6 text-accent-sky-text" />
            </div>
            <div className="text-base font-bold text-on-surface mb-1">
              Document Grounded Q&A
            </div>
            <p className="text-xs text-on-surface-variant max-w-sm mb-6">
              Type your question below or click a dynamic suggestion extracted from your indexed documents.
            </p>

            {/* Dynamic Suggestion Cards */}
            {suggestions.length > 0 && (
              <div className="w-full text-left">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2.5 px-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    Suggested Questions
                  </span>
                  <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider font-mono">
                    Based on Knowledge Base
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestions.slice(0, 6).map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executeQuery(sug.query)}
                      className="p-3.5 rounded-xl glass-card border border-border-subtle hover:border-secondary/60 hover:bg-surface-container-high transition-all group flex flex-col justify-between text-left shadow-2xs cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-on-surface group-hover:text-secondary transition-colors mb-1">
                        {sug.label}
                      </div>
                      <div className="text-[11px] text-on-surface-variant line-clamp-2 mb-2 leading-relaxed">
                        {sug.query}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] uppercase tracking-wider font-medium text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded-full border border-accent-sky-border/40">
                          {sug.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          <div className="flex flex-col gap-3 p-5 rounded-2xl glass-card border border-border-subtle text-xs text-on-surface max-w-xl shadow-xs">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-secondary shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-on-surface mb-1">Processing Your Query...</div>
                <div className="text-on-surface-variant">This may take 3-5 seconds on free tier</div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                <span>Generating embeddings via OpenRouter API...</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse animation-delay-200"></div>
                <span>Searching Qdrant Cloud vector database...</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse animation-delay-400"></div>
                <span>Verifying evidence and generating response...</span>
              </div>
            </div>
            
            <div className="text-[10px] text-on-surface-variant/70 pt-2 border-t border-border-subtle flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Free tier API latency • Cloud infrastructure</span>
            </div>
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
      <div className="pt-3 border-t border-border-subtle/80 bg-canvas-bg/80 backdrop-blur-xs">
        {/* Scoped Document Badge */}
        {selectedDocIds.length > 0 && selectedDocIds.length < documents.length && (
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/40 text-xs text-secondary font-medium shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-secondary" />
              <span>Scope: <strong>{selectedDocsLabel}</strong></span>
              <button
                type="button"
                onClick={clearDocumentSelection}
                className="hover:bg-secondary/20 rounded-full p-0.5 text-secondary transition-all cursor-pointer ml-1"
                title="Reset to All Documents"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Dynamic Quick Suggestions Bar */}
        {suggestions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1.5 scrollbar-none">
            <span className="text-[10px] font-semibold text-on-surface-variant shrink-0 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-secondary animate-pulse" /> Suggestions:
            </span>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => executeQuery(sug.query)}
                className="px-2.5 py-1 rounded-full text-xs font-medium glass-card border border-border-subtle hover:border-secondary hover:text-secondary hover:bg-surface-container-high text-on-surface transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>{sug.label}</span>
                <span className="text-[9px] font-mono opacity-70 text-accent-sky-text bg-accent-sky-bg px-1.5 py-0.2 rounded">
                  {sug.category}
                </span>
              </button>
            ))}
          </div>
        )}

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
              <span className="text-[10px] text-on-surface-variant/60 hidden sm:inline font-mono">
                ⇧ Shift+↵
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