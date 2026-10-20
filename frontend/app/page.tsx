'use client';

import { AppShell } from '@/components/layout/AppShell';
import { OverviewDashboard } from '@/components/overview/OverviewDashboard';

export default function Home() {
  return (
    <AppShell>
      <OverviewDashboard />
    </AppShell>
  );
}
