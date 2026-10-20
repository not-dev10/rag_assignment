export type ExpectedOutcome = 'grounded' | 'fallback' | 'validation_error';

export interface EvalTestCase {
  id: string;
  scenarioId: string;
  name: string;
  query: string;
  expectedOutcome: ExpectedOutcome;
  actualOutcome?: ExpectedOutcome;
  status: 'idle' | 'running' | 'passed' | 'failed';
  answer?: string;
  citationsCount?: number;
  latencyMs?: number;
  notes?: string;
}
