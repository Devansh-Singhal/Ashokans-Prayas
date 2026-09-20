import { Contribution, TicketCategory, User } from '../types';

// Groups related ticket categories under one civic-service label for the certificate.
export const CATEGORY_GROUPS: Record<TicketCategory, string> = {
  POTHOLE: 'Road & Footpath Safety',
  FOOTPATH_DAMAGE: 'Road & Footpath Safety',
  GARBAGE_ACCUMULATION: 'Sanitation',
  STREETLIGHT: 'Public Lighting',
  OPEN_DRAIN: 'Drainage',
  UNKNOWN: 'Other Civic Work',
};

export interface ContributionGroup {
  group: string;
  count: number;
  kinds: Contribution['kind'][];
}

// Dedupes by (kind, id) - the same ticket can appear once as a REPORT and once
// as a VERIFICATION, but re-logging the same event twice must not double-count.
export function groupContributions(list: Contribution[]): ContributionGroup[] {
  const seen = new Set<string>();
  const byGroup = new Map<string, ContributionGroup>();

  for (const c of list) {
    const dedupeKey = `${c.kind}:${c.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const group = CATEGORY_GROUPS[c.category as TicketCategory] ?? CATEGORY_GROUPS.UNKNOWN;
    const existing = byGroup.get(group);
    if (existing) {
      existing.count += 1;
      existing.kinds.push(c.kind);
    } else {
      byGroup.set(group, { group, count: 1, kinds: [c.kind] });
    }
  }

  return Array.from(byGroup.values()).sort((a, b) => b.count - a.count);
}

export interface CertificateEligibility {
  eligible: boolean;
  reason: string;
}

const MIN_CONTRIBUTIONS = 5;
const MIN_GROUPS = 2;

// Eligibility is based on deduped, verifiable contributions only - not on
// `verified_hours`, which is fabricated client-side and not backed by the server.
export function certificateEligibility(
  list: Contribution[],
  _user: User
): CertificateEligibility {
  const groups = groupContributions(list);
  const totalContributions = groups.reduce((sum, g) => sum + g.count, 0);

  if (totalContributions >= MIN_CONTRIBUTIONS && groups.length >= MIN_GROUPS) {
    return { eligible: true, reason: 'Eligible for a Civic Service Certificate.' };
  }

  const remaining = Math.max(0, MIN_CONTRIBUTIONS - totalContributions);
  if (remaining > 0) {
    return {
      eligible: false,
      reason: `${remaining} more verified contribution${remaining === 1 ? '' : 's'} needed to qualify.`,
    };
  }

  return {
    eligible: false,
    reason: `Contribute in ${MIN_GROUPS - groups.length} more civic categor${MIN_GROUPS - groups.length === 1 ? 'y' : 'ies'} to qualify.`,
  };
}
