'use client';

import React, { useState } from 'react';
import { ChatMessage, Citation } from '@/types/chat';
import { mockInitialMessages, mockThreadSessions, mockCitations } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import { ThreadHistorySidebar } from './ThreadHistorySidebar';
import { MessageBubble } from './MessageBubble';
import { ChatComposer } from './ChatComposer';
import { EvidenceInspectorPane } from './EvidenceInspectorPane';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockInitialMessages);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [activeCitations, setActiveCitations] = useState<Citation[]>(mockCitations);
  const [selectedCitationIndex, setSelectedCitationIndex] = useState<number | null>(null);
  const [showEvidencePane, setShowEvidencePane] = useState<boolean>(true);
  const [isStrictGrounding, setIsStrictGrounding] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async (query: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await ApiClient.askQuestion(query, undefined, isStrictGrounding);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        groundingStatus: response.groundingStatus,
        groundingScore: response.groundingScore,
        tokenCount: response.tokenCount,
        latencyMs: response.latencyMs,
        model: response.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.citations && response.citations.length > 0) {
        setActiveCitations(response.citations);
        setSelectedCitationIndex(0);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Error connecting to Node API: ${err.message || 'Service unreachable'}. Please verify backend-node is running on port 4000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingStatus: 'fallback',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewThread = () => {
    setActiveThreadId(`thread-${Date.now()}`);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Hello! I am your document-grounded assistant. Ask questions and I will retrieve evidence strictly from your indexed files.',
        timestamp: 'Just now',
        groundingStatus: 'strict',
      },
    ]);
    setActiveCitations([]);
    setSelectedCitationIndex(null);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Context & Pipeline Telemetry Bar */}
      <div className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-card px-3.5 py-1.5 rounded-full shadow-2xs border border-border-subtle">
            <span className="w-2 h-2 rounded-full bg-status-indexed-text" />
            <span className="text-xs font-semibold text-on-surface">
              Enterprise Legal &amp; Compliance Hub
            </span>
            <span className="text-[11px] font-mono font-medium text-accent-sky-text bg-accent-sky-bg px-2 py-0.5 rounded-full">
              Hybrid-v3
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[16px] text-accent-sky-text">memory</span>
            <span>Claude 3.5 Sonnet + text-embedding-3-large</span>
            <span className="text-outline-variant font-mono">•</span>
            <span className="font-mono font-medium text-on-surface">k=5</span>
            <span className="text-outline-variant font-mono">•</span>
            <span className="font-mono font-medium text-on-surface">Min Cosine: 0.82</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Strict Grounding Toggle */}
          <div className="flex items-center bg-surface-card px-3 py-1.5 rounded-full shadow-2xs border border-border-subtle gap-2">
            <span className="material-symbols-outlined text-[17px] text-status-indexed-text">verified</span>
            <span className="text-xs font-medium text-on-surface">Grounding: Strict</span>
            <label className="relative inline-flex items-center cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={isStrictGrounding}
                onChange={(e) => setIsStrictGrounding(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-surface-container rounded-full peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-secondary" />
            </label>
          </div>

          {/* Toggle Evidence Inspector Panel */}
          <button
            type="button"
            onClick={() => setShowEvidencePane(!showEvidencePane)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xs border text-xs font-medium transition-colors cursor-pointer ${
              showEvidencePane
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-card hover:bg-surface-container-low text-on-surface border-border-subtle'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {showEvidencePane ? 'dock_to_right' : 'dock_to_left'}
            </span>
            <span>Evidence Pane</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Orchestration Grid */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left Column: History & Sessions (Col Span 3) */}
        <div className="col-span-12 lg:col-span-3">
          <ThreadHistorySidebar
            threads={mockThreadSessions}
            activeThreadId={activeThreadId}
            onSelectThread={(id) => setActiveThreadId(id)}
            onNewThread={handleNewThread}
          />
        </div>

        {/* Center Column: Chat Stream & Composer (Col Span 6 or 9) */}
        <div className={`col-span-12 ${showEvidencePane ? 'lg:col-span-6' : 'lg:col-span-9'} flex flex-col min-h-[calc(100vh-160px)] justify-between`}>
          <div className="flex-1 overflow-y-auto mb-4 pr-1">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                selectedCitationIndex={selectedCitationIndex}
                onCitationClick={(idx) => {
                  setSelectedCitationIndex(idx);
                  setShowEvidencePane(true);
                }}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-on-surface-variant p-4 rounded-xl bg-surface-card border border-border-subtle">
                <span className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                <span>Searching Qdrant vector store &amp; verifying citation grounding...</span>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 pt-2 bg-canvas-bg">
            <ChatComposer onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>

        {/* Right Column: Evidence Inspector (Col Span 3) */}
        {showEvidencePane && (
          <div className="col-span-12 lg:col-span-3">
            <EvidenceInspectorPane
              citations={activeCitations}
              selectedIndex={selectedCitationIndex}
              onSelectCitation={(idx) => setSelectedCitationIndex(idx)}
              onClose={() => setShowEvidencePane(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
