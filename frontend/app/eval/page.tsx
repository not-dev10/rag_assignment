'use client';

import { AppShell } from '@/components/layout/AppShell';
import { EvaluationRunner } from '@/components/eval/EvaluationRunner';

export default function EvalPage() {
  return (
    <AppShell>
      <EvaluationRunner />
    </AppShell>
  );
}
