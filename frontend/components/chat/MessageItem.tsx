'use client';

import React, { useState } from 'react';
import { ChatMessage, Citation } from '@/types/chat';
import { CitationReference } from './CitationReference';
import { Copy, Check, AlertCircle, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onSelectCitation: (citation: Citation) => void;
  onOpenInspector?: (message: ChatMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectCitation,
  onOpenInspector,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-2xl bg-primary text-on-primary rounded-2xl rounded-tr-xs px-5 py-3.5 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          <div className="text-[11px] text-on-primary/60 mt-1.5 text-right font-mono">
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 max-w-3xl mr-auto mb-6">
      <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-2xs mt-1">
        <Sparkles className="w-4 h-4 text-accent-sky-border" />
      </div>

      <div
        className={`min-w-0 flex-1 glass-card rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs border transition-all ${
          message.isFallback
            ? 'border-amber-200 bg-amber-50/50'
            : 'border-border-subtle hover:border-border-strong/70'
        }`}
      >
        {/* Verification Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border-subtle/80">
          <div className="flex items-center gap-2">
            {message.isFallback ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-indexing-bg text-status-indexing-text text-xs font-semibold border border-status-indexing-text/20">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Insufficient Evidence in Knowledge Base</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-indexed-bg text-status-indexed-text text-xs font-semibold border border-status-indexed-text/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-indexed-text" />
                <span>Strictly Grounded</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono shrink-0">
            {message.latencyMs && <span>{message.latencyMs}ms</span>}
            <span>•</span>
            <span>{message.timestamp}</span>
          </div>
        </div>

        {/* Answer Content */}
        <div className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Citations & Evidence Pill Bar */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-border-subtle/70 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Grounding Sources &amp; Citations:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {message.citations.map((cite, idx) => (
                <CitationReference
                  key={cite.id || idx}
                  index={idx}
                  citation={cite}
                  onClick={onSelectCitation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="mt-4 pt-3 border-t border-border-subtle/60 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-status-indexed-text" />
                  <span className="text-status-indexed-text font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {message.retrievalContext && onOpenInspector && (
              <button
                type="button"
                onClick={() => onOpenInspector(message)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer text-xs font-medium text-secondary"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Inspect Chunks</span>
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-on-surface-variant/80">
            Claude 3.5 Sonnet
          </span>
        </div>
      </div>
    </div>
  );
};
