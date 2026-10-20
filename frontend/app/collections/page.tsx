'use client';

import { AppShell } from '@/components/layout/AppShell';
import { CollectionsManager } from '@/components/collections/CollectionsManager';

export default function CollectionsPage() {
  return (
    <AppShell>
      <CollectionsManager />
    </AppShell>
  );
}
