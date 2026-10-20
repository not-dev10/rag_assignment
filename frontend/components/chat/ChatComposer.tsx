'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatComposerProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-card rounded-2xl p-3 shadow-sm border border-border-subtle focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all"
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something about your documents... (Shift+Enter for newline)"
          rows={2}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none leading-relaxed pr-10"
        />
      </div>

      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border-subtle/60">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-canvas-bg hover:text-on-surface transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Attach document for inline context"
          >
            <span className="material-symbols-outlined text-[18px]">attach_file</span>
          </button>
          <span className="text-[11px] text-on-surface-variant font-mono">
            Grounding: Strict
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-on-surface-variant/80 hidden sm:inline font-mono">
            ↵ Enter to send
          </span>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              !input.trim() || isLoading
                ? 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
                : 'bg-primary hover:bg-neutral-800 text-on-primary shadow-xs cursor-pointer'
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
