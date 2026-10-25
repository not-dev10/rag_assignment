'use client';

import React, { useState, useEffect } from 'react';
import { EvalTestCase } from '@/types/eval';
import { ApiClient, generateDynamicSuggestions } from '@/lib/api';
import { Play, RotateCw, CheckCircle2, XCircle, Clock, ShieldCheck, FileText, Sparkles } from 'lucide-react';

const UNIVERSAL_TEST_CASES: EvalTestCase[] = [
  {
    id: 'test-unanswerable',
    scenarioId: 'T01',
    name: 'Unanswerable Query: External Out-of-Domain',
    query: 'What is the current temperature and atmospheric pressure in Tokyo today?',
    expectedOutcome: 'fallback',
    status: 'idle',
    notes: 'Verifies strict grounding and honest fallback abstention without hallucination',
  },
  {
    id: 'test-validation',
    scenarioId: 'T02',
    name: 'Validation Error: Blank Whitespace Query',
    query: '   ',
    expectedOutcome: 'validation_error',
    status: 'idle',
    notes: 'Verifies client and API validation rejects empty input before running LLM',
  },
];

export const EvaluationRunner: React.FC = () => {
  const [testCases, setTestCases] = useState<EvalTestCase[]>(UNIVERSAL_TEST_CASES);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);

  useEffect(() => {
    ApiClient.getDocuments()
      .then((docs) => {
        if (docs.length > 0) {
          const suggestions = generateDynamicSuggestions(docs);
          const dynamicTests: EvalTestCase[] = docs.slice(0, 3).map((doc, idx) => {
            const matchingSug = suggestions.find((s) => s.query.includes(doc.filename)) || suggestions[idx];
            const testQuery = matchingSug
              ? matchingSug.query
              : `What is the main topic and overview of ${doc.filename}?`;

            return {
              id: `test-grounded-${doc.id}`,
              scenarioId: `T0${idx + 3}`,
              name: `Grounded Query: ${doc.filename}`,
              query: testQuery,
              expectedOutcome: 'grounded',
              status: 'idle',
              notes: `Verifies grounded retrieval and citation metadata for indexed document ${doc.filename}`,
            };
          });

          setTestCases([...dynamicTests, ...UNIVERSAL_TEST_CASES]);
        }
        setHasLoadedDocs(true);
      })
      .catch(() => setHasLoadedDocs(true));
  }, []);

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
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">RAG Evaluation Suite</h2>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-accent-sky-bg text-accent-sky-text border border-accent-sky-border">
              Automated Harness
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Execute deterministic test questions to verify grounding accuracy, citation metadata, and honest fallback handling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono glass-card px-3 py-1.5 rounded-full border border-border-subtle">
            <span className="text-status-indexed-text font-bold">{passedCount} Passed</span>
            <span className="text-outline-variant font-mono">•</span>
            <span className="text-status-failed-text font-bold">{failedCount} Failed</span>
          </div>

          <button
            type="button"
            onClick={runAllTests}
            disabled={isRunningAll}
            className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-on-primary text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {isRunningAll ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunningAll ? 'Running Harness...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="glass-panel rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="divide-y divide-border-subtle">
          {testCases.map((test) => {
            const isPassed = test.status === 'passed';
            const isFailed = test.status === 'failed';
            const isRunning = test.status === 'running';

            return (
              <div key={test.id} className="p-5 hover:bg-surface-container-low/20 transition-colors flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-container-low text-secondary font-bold border border-border-subtle shrink-0">
                      {test.scenarioId}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">{test.name}</h3>
                      <div className="text-xs font-mono text-on-surface-variant mt-1 bg-canvas-bg px-2.5 py-1 rounded-md border border-border-subtle inline-block">
                        &quot;{test.query || '<empty>'}&quot;
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Status Badge */}
                    {isPassed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-indexed-bg text-status-indexed-text border border-status-indexed-text/20 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-failed-bg text-status-failed-text border border-status-failed-text/20 shadow-2xs">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </span>
                    )}
                    {isRunning && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-secondary">
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running...</span>
                      </span>
                    )}
                    {test.status === 'idle' && (
                      <span className="text-[11px] font-mono text-on-surface-variant/70">Idle</span>
                    )}

                    <button
                      type="button"
                      onClick={() => runSingleTest(test.id)}
                      disabled={isRunning || isRunningAll}
                      className="px-3 py-1 rounded-lg text-xs glass-card hover:bg-canvas-bg text-on-surface font-semibold transition-colors cursor-pointer border border-border-subtle"
                    >
                      Run
                    </button>
                  </div>
                </div>

                {/* Test details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-canvas-bg/80 p-3 rounded-xl border border-border-subtle/80">
                  <div>
                    <span className="text-on-surface-variant">Expected Outcome: </span>
                    <span className="font-mono text-on-surface font-bold capitalize">
                      {test.expectedOutcome}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Actual Outcome: </span>
                    <span
                      className={`font-mono font-bold capitalize ${
                        test.actualOutcome
                          ? isPassed
                            ? 'text-status-indexed-text'
                            : 'text-status-failed-text'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {test.actualOutcome || 'Not run'}
                    </span>
                  </div>
                  {test.latencyMs !== undefined && (
                    <div className="flex items-center gap-1 text-on-surface-variant font-mono">
                      <Clock className="w-3.5 h-3.5 text-secondary" />
                      <span>{test.latencyMs}ms execution time</span>
                    </div>
                  )}
                </div>

                {test.answer && (
                  <div className="p-3.5 rounded-xl glass-card border border-border-subtle text-xs text-on-surface">
                    <span className="font-bold text-on-surface-variant block mb-1">Generated Output:</span>
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
