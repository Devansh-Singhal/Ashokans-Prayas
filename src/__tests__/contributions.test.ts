import { Contribution, User } from '../types';
import { groupContributions, certificateEligibility } from '../utils/contributions';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Contribution Certificate Tests ---');

const demoUser: User = {
  id: 'user-rahul-id',
  public_handle: 'Auditor_42B9',
  phone_number: '+919811122233',
  is_under_18: false,
  consent_status: 'ACTIVE',
  points_balance: 350,
};

const contribs: Contribution[] = [
  { id: 't1', kind: 'REPORT', category: 'POTHOLE', at: '2026-01-01T00:00:00Z' },
  { id: 't1', kind: 'REPORT', category: 'POTHOLE', at: '2026-01-01T00:00:00Z' }, // duplicate log
  { id: 't2', kind: 'REPORT', category: 'FOOTPATH_DAMAGE', at: '2026-01-02T00:00:00Z' },
  { id: 't3', kind: 'VERIFICATION', category: 'GARBAGE_ACCUMULATION', at: '2026-01-03T00:00:00Z' },
  { id: 't1', kind: 'VERIFICATION', category: 'POTHOLE', at: '2026-01-04T00:00:00Z' }, // same ticket, different kind
];

// Test 1: exact duplicate (same id + kind) is deduped
const groups = groupContributions(contribs);
const totalCount = groups.reduce((sum, g) => sum + g.count, 0);
assert(totalCount === 4, `Expected 4 deduped contributions, got ${totalCount}`);
console.log('✅ Test 1: Duplicate (id, kind) pair deduped correctly');

// Test 2: related categories grouped together
const roadGroup = groups.find((g) => g.group === 'Road & Footpath Safety');
assert(!!roadGroup, 'Expected a Road & Footpath Safety group');
assert(roadGroup!.count === 3, `Expected 3 in Road & Footpath Safety, got ${roadGroup?.count}`);
console.log('✅ Test 2: POTHOLE and FOOTPATH_DAMAGE grouped under Road & Footpath Safety');

// Test 3: below threshold is not eligible
const belowThreshold = certificateEligibility(contribs, demoUser);
assert(belowThreshold.eligible === false, 'Expected ineligible below 5 contributions');
console.log('✅ Test 3: Below the contribution threshold correctly reports ineligible');

// Test 4: meets threshold across enough groups is eligible
const enough: Contribution[] = [
  ...contribs,
  { id: 't4', kind: 'REPORT', category: 'STREETLIGHT', at: '2026-01-05T00:00:00Z' },
];
const eligible = certificateEligibility(enough, demoUser);
assert(eligible.eligible === true, `Expected eligible, got: ${eligible.reason}`);
console.log('✅ Test 4: Meeting the contribution and category threshold reports eligible');

console.log('🎉 ALL CONTRIBUTION CERTIFICATE TESTS PASSED SUCCESSFULLY!');
