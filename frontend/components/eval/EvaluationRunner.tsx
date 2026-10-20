'use client';

import React, { useState } from 'react';
import { EvalTestCase } from '@/types/eval';
import { defaultEvalTestCases } from '@/lib/mockData';
import { ApiClient } from '@/lib/api';
import { Play, RotateCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const EvaluationRunner: React.FC = () => {
  const [testCases, setTestCases] = useState<EvalTestCase[]>(defaultEvalTestCases);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runSingleTest = async (testId: string) => {
    setTestCases((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'running' } : t))
    );

    const targetTest = testCases.find((t) => t.id === testId);
    if (!targetTest) return;

    const result = await ApiClient.runEvalTestCase(targetTest);

    setTestCases((prev) => prev.map((t) => (t.id === testId ? result : t)));
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const test of testCases) {
      await runSingleTest(test.id);
    }
    setIsRunningAll(false);
  };

  const passedCount = testCases.filter((t) => t.status === 'passed').length;
  const failedCount = testCases.filter((t) => t.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">RAG Evaluation Suite</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Execute deterministic test questions to verify grounding, citations, and honest fallback behavior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-700 font-semibold">{passedCount} Passed</span>
            <span className="text-zinc-300">•</span>
            <span className="text-red-700 font-semibold">{failedCount} Failed</span>
          </div>

          <button
            type="button"
            onClick={runAllTests}
            disabled={isRunningAll}
            className="h-8 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isRunningAll ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isRunningAll ? 'Running Tests...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-zinc-200">
          {testCases.map((test) => {
            const isPassed = test.status === 'passed';
            const isFailed = test.status === 'failed';
            const isRunning = test.status === 'running';

            return (
              <div key={test.id} className="p-4 hover:bg-zinc-50/50 transition-colors flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200 shrink-0">
                      {test.scenarioId}
                    </span>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900">{test.name}</h3>
                      <div className="text-xs font-mono text-zinc-600 mt-0.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-200/60 inline-block">
                        &quot;{test.query || '<empty>'}&quot;
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Badge */}
                    {isPassed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Pass</span>
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3 h-3" />
                        <span>Fail</span>
                      </span>
                    )}
                    {isRunning && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                        <RotateCw className="w-3 h-3 animate-spin" />
                        <span>Running...</span>
                      </span>
                    )}
                    {test.status === 'idle' && (
                      <span className="text-[11px] font-mono text-zinc-400">Idle</span>
                    )}

                    <button
                      type="button"
                      onClick={() => runSingleTest(test.id)}
                      disabled={isRunning || isRunningAll}
                      className="px-2.5 py-1 rounded text-xs border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium transition-colors cursor-pointer"
                    >
                      Run
                    </button>
                  </div>
                </div>

                {/* Test details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-zinc-50/70 p-2.5 rounded border border-zinc-200/50">
                  <div>
                    <span className="text-zinc-500">Expected: </span>
                    <span className="font-mono text-zinc-800 font-medium capitalize">
                      {test.expectedOutcome}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Actual: </span>
                    <span
                      className={`font-mono font-medium capitalize ${
                        test.actualOutcome
                          ? isPassed
                            ? 'text-emerald-700'
                            : 'text-red-700'
                          : 'text-zinc-400'
                      }`}
                    >
                      {test.actualOutcome || 'Not run'}
                    </span>
                  </div>
                  {test.latencyMs !== undefined && (
                    <div className="flex items-center gap-1 text-zinc-500 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{test.latencyMs}ms</span>
                    </div>
                  )}
                </div>

                {test.answer && (
                  <div className="p-2.5 rounded bg-white border border-zinc-200 text-xs text-zinc-800">
                    <span className="font-semibold text-zinc-600 block mb-1">Generated Output:</span>
                    <p className="font-sans leading-relaxed">{test.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
