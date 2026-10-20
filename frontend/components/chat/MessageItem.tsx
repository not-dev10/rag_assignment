'use client';

import React, { useState } from 'react';
import { ChatMessage, Citation } from '@/types/chat';
import { CitationReference } from './CitationReference';
import { Copy, Check, AlertCircle, FileSearch } from 'lucide-react';

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
      <div className="flex justify-end mb-4">
        <div className="max-w-2xl bg-zinc-900 text-white rounded-lg px-4 py-3 text-sm leading-relaxed shadow-xs">
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className="text-[11px] text-zinc-400 mt-1 text-right">{message.timestamp}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div
        className={`max-w-3xl w-full rounded-lg border p-4 text-sm leading-relaxed shadow-xs transition-colors ${
          message.isFallback
            ? 'bg-amber-50/40 border-amber-200/80 text-zinc-900'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Fallback Notice */}
        {message.isFallback && (
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200/60 text-xs font-medium text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Insufficient Evidence in Knowledge Base</span>
          </div>
        )}

        {/* Content */}
        <div className="whitespace-pre-wrap text-zinc-800 leading-relaxed font-sans">
          {message.content}
        </div>

        {/* Sources & Citations section */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
            <div className="text-xs font-semibold text-zinc-600">Sources:</div>
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
        <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied</span>
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
                className="inline-flex items-center gap-1 hover:text-zinc-800 transition-colors cursor-pointer text-zinc-600"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Inspect Chunks</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
            {message.latencyMs && <span>{message.latencyMs}ms</span>}
            <span>{message.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
