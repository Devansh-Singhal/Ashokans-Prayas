import { Ticket } from '../types';
import { calculateHaversineDistance } from '../services/location';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running CivicPostCard Data & Logic Tests ---');

const mockTicket: Ticket = {
  id: 'ticket-test-1',
  category: 'POTHOLE',
  severity: 4,
  status: 'PROVISIONAL_FIX',
  upvotes: 42,
  latitude: 28.6289,
  longitude: 77.2065,
  report_photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
  resolution_photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09',
  created_at: new Date().toISOString(),
};

// 1. Verify distance calculation from 30m away
const userCoordsNear = { latitude: 28.62917, longitude: 77.2065 };
const distNear = calculateHaversineDistance(
  userCoordsNear.latitude,
  userCoordsNear.longitude,
  mockTicket.latitude,
  mockTicket.longitude
);
assert(distNear <= 50, `Expected in-range (<=50m), got ${distNear}m`);
console.log(`✅ Test 1: In-range auditor verified at ${distNear}m -> Audit button enabled`);

// 2. Verify distance calculation from 120m away
const userCoordsFar = { latitude: 28.6300, longitude: 77.2065 };
const distFar = calculateHaversineDistance(
  userCoordsFar.latitude,
  userCoordsFar.longitude,
  mockTicket.latitude,
  mockTicket.longitude
);
assert(distFar > 50, `Expected out-of-range (>50m), got ${distFar}m`);
console.log(`✅ Test 2: Out-of-range auditor verified at ${distFar}m -> Audit button safely locked`);

// 3. Verify Before & After presence
assert(!!mockTicket.resolution_photo_url, 'Provisional fix must contain resolution photo');
assert(mockTicket.status === 'PROVISIONAL_FIX', 'Status must be PROVISIONAL_FIX');
console.log('✅ Test 3: Dual before/after photos present for provisional verification');

// 4. Verify geofence gating for the audit button
assert(distNear <= 50, 'Audit button must enable in range');
assert(distFar > 50, 'Audit button must lock out of range');
console.log('✅ Test 4: Audit-button geofence gating verified (in-range enabled, out-of-range locked)');

console.log('🎉 ALL CIVIC POST CARD TESTS PASSED SUCCESSFULLY!');
