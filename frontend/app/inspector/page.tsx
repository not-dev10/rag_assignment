'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RetrievalInspector } from '@/components/inspector/RetrievalInspector';

export default function InspectorPage() {
  return (
    <AppShell>
      <RetrievalInspector />
    </AppShell>
  );
}
