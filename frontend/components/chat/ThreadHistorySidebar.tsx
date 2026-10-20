'use client';

import React, { useState } from 'react';
import { ThreadSession } from '@/types/chat';

interface ThreadHistorySidebarProps {
  threads: ThreadSession[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
}

export const ThreadHistorySidebar: React.FC<ThreadHistorySidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const pinnedThreads = filteredThreads.filter((t) => t.pinned);
  const regularThreads = filteredThreads.filter((t) => !t.pinned);

  return (
    <aside className="bg-surface-card rounded-xl p-4 shadow-sm border border-border-subtle flex flex-col gap-4">
      {/* Header and New Query Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">Threads</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-medium">
            {threads.length} active
          </span>
        </div>
        <button
          type="button"
          onClick={onNewThread}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-neutral-800 text-on-primary rounded-full text-xs font-medium transition-colors shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span>New Query</span>
        </button>
      </div>

      {/* Filter Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-2 text-[17px] text-on-surface-variant pointer-events-none">
          filter_list
        </span>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter history & tags..."
          className="w-full h-8 pl-9 pr-3 rounded-lg bg-surface text-on-surface text-xs placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-low transition-colors"
        />
      </div>

      {/* Scoped Collection Selector Context */}
      <div className="bg-surface rounded-lg p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-on-surface-variant text-[11px] uppercase tracking-wider font-medium">
          <span>Scoped Collection</span>
          <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-on-surface">
            tune
          </span>
        </div>
        <div className="flex items-center justify-between bg-surface-card px-2.5 py-1.5 rounded shadow-2xs cursor-pointer hover:bg-accent-sky-bg transition-colors">
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-[16px] text-secondary">policy</span>
            <span className="text-xs text-on-surface font-medium truncate">
              Enterprise Docs (Legal)
            </span>
          </div>
          <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
            expand_more
          </span>
        </div>
      </div>

      {/* Pinned Investigations */}
      {pinnedThreads.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-on-surface-variant uppercase tracking-wider px-1 font-medium">
            Pinned Investigations
          </span>
          {pinnedThreads.map((thread) => {
            const isSelected = activeThreadId === thread.id;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`group flex items-start gap-2.5 p-2.5 rounded-lg transition-colors text-left w-full cursor-pointer ${
                  isSelected
                    ? 'bg-surface-container-low ring-1 ring-accent-sky-border'
                    : 'hover:bg-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-accent-sky-text mt-0.5 shrink-0">
                  push_pin
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-on-surface truncate">{thread.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant font-mono">
                    <span>{thread.sourceCount} sources</span>
                    <span>•</span>
                    <span className="text-status-indexed-text">
                      Grounding {thread.groundingPercentage}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Recent Queries */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-on-surface-variant uppercase tracking-wider px-1 font-medium">
          Recent Sessions
        </span>
        {regularThreads.map((thread) => {
          const isSelected = activeThreadId === thread.id;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={`group flex items-start gap-2.5 p-2.5 rounded-lg transition-colors text-left w-full cursor-pointer ${
                isSelected
                  ? 'bg-surface-container-low ring-1 ring-accent-sky-border'
                  : 'hover:bg-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5 shrink-0">
                forum
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-on-surface truncate">{thread.title}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant font-mono">
                  <span>{thread.collectionScope.split(' ')[0]}</span>
                  <span>•</span>
                  <span>{thread.lastUpdated}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
