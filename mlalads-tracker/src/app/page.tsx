'use client';

import { AppShell } from '@/components/AppShell';
import { TrackArea } from '@/components/TrackArea';

export default function HomePage() {
  return (
    <AppShell>
      {({ dataset }) => <TrackArea dataset={dataset} />}
    </AppShell>
  );
}
