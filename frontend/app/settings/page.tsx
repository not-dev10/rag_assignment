'use client';

import { AppShell } from '@/components/layout/AppShell';
import { SettingsManager } from '@/components/settings/SettingsManager';

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsManager />
    </AppShell>
  );
}
