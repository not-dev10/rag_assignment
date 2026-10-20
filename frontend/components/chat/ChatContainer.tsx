'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '@/types/chat';
import { initialChatMessages } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import { MessageItem } from './MessageItem';
import { PassageDrawer } from './PassageDrawer';
import { Send, Trash2, Loader2, AlertCircle } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top action bar: only functional controls */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200">
        <div className="text-xs text-zinc-500">
          Ask questions grounded in indexed documents. Citations will reference exact sources.
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearConversation}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear conversation</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <div className="text-sm font-medium text-zinc-800 mb-1">
              No questions asked yet
            </div>
            <p className="text-xs text-zinc-500 max-w-sm">
              Type a question below to retrieve evidence and generate answers from your uploaded documents.
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
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 max-w-md">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
            <span>Retrieving chunks from vector store and verifying evidence...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 max-w-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multiline composer */}
      <div className="pt-4 border-t border-zinc-200 bg-zinc-50/50">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white rounded-lg border border-zinc-300 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 shadow-2xs transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask something about your documents... (Press Enter to send, Shift+Enter for newline)"
            rows={2}
            className="w-full resize-none bg-transparent p-3.5 pr-24 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none leading-relaxed"
          />

          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !input.trim() || isLoading
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer shadow-xs'
              }`}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Send</span>
            </button>
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-zinc-200">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">
                Exact Context Passed to LLM
              </h3>
              <button
                type="button"
                onClick={() => setInspectMessage(null)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-medium"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-zinc-800 bg-zinc-50 whitespace-pre-wrap leading-relaxed">
              {inspectMessage.retrievalContext}
            </div>
            <div className="p-3 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (inspectMessage.retrievalContext) {
                    navigator.clipboard.writeText(inspectMessage.retrievalContext);
                  }
                }}
                className="px-3 py-1.5 rounded bg-zinc-900 text-white text-xs font-medium"
              >
                Copy Context
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
