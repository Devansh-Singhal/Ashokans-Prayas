'use client';

import { AppShell } from '@/components/AppShell';
import { ContractorDirectory } from '@/components/ContractorDirectory';

export default function ContractorsPage() {
  return (
    <AppShell>
      {({ dataset }) => <ContractorDirectory dataset={dataset} />}
    </AppShell>
  );
}
