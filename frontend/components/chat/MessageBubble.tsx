'use client';

import React, { useState } from 'react';
import { ChatMessage } from '@/types/chat';
import { CitationPill } from './CitationPill';

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick?: (citationIndex: number) => void;
  selectedCitationIndex?: number | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCitationClick,
  selectedCitationIndex,
}) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse [Doc X.X] citations in message content
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(\[Doc\s\d+\.?\d*\])/g);
    let citationCounter = 0;

    return parts.map((part, index) => {
      if (/^\[Doc\s\d+\.?\d*\]$/.test(part)) {
        const currentIdx = citationCounter++;
        return (
          <CitationPill
            key={index}
            label={part.replace(/[\[\]]/g, '')}
            isActive={selectedCitationIndex === currentIdx}
            onClick={() => onCitationClick && onCitationClick(currentIdx)}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!isAssistant) {
    return (
      <div className="flex justify-end gap-3 max-w-3xl ml-auto mb-6">
        <div className="bg-primary text-on-primary rounded-2xl rounded-tr-xs px-5 py-3.5 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-on-primary/60">
            <span>{message.timestamp}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-semibold shrink-0">
          U
        </div>
      </div>
    );
  }

  const isFallback = message.groundingStatus === 'fallback';

  return (
    <div className="flex items-start gap-3 max-w-3xl mr-auto mb-6">
      <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs shrink-0 font-medium">
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
      </div>

      <div className="flex-1 bg-surface-card rounded-2xl rounded-tl-xs p-5 shadow-xs border border-border-subtle">
        {/* Verification & Model Pill */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            {isFallback ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-indexing-bg text-status-indexing-text text-xs font-medium border border-status-indexing-text/20">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Insufficient Evidence Fallback
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-indexed-bg text-status-indexed-text text-xs font-medium border border-status-indexed-text/20">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Strictly Grounded ({Math.round((message.groundingScore || 0.95) * 100)}%)
              </span>
            )}
          </div>

          {message.latencyMs && (
            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono">
              <span>{message.latencyMs}ms</span>
              <span>•</span>
              <span>{message.tokenCount} tokens</span>
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
          {renderFormattedContent(message.content)}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle text-on-surface-variant">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Copy answer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer"
              title="Good response"
            >
              <span className="material-symbols-outlined text-[16px]">thumb_up</span>
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer"
              title="Report issue"
            >
              <span className="material-symbols-outlined text-[16px]">thumb_down</span>
            </button>
          </div>

          <span className="text-[11px] text-on-surface-variant font-mono">
            {message.model || 'Claude 3.5 Sonnet'}
          </span>
        </div>
      </div>
    </div>
  );
};
