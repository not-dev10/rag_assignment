'use client';

import { AppShell } from '@/components/layout/AppShell';
import { CollectionsManager } from '@/components/collections/CollectionsManager';

export default function SearchPage() {
  return (
    <AppShell>
      <CollectionsManager />
    </AppShell>
  );
}
