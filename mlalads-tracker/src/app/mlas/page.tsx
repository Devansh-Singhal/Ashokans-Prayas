'use client';

import { AppShell } from '@/components/AppShell';
import { MlaDirectory } from '@/components/MlaDirectory';

export default function MlasPage() {
  return (
    <AppShell>
      {({ dataset }) => <MlaDirectory dataset={dataset} />}
    </AppShell>
  );
}
