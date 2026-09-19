import { calculateHaversineDistance, checkGeofence, formatDistance } from '../services/location';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Location Service Tests ---');

// Test 1: Identical coordinates should be 0 meters
const d0 = calculateHaversineDistance(28.6289, 77.2065, 28.6289, 77.2065);
assert(d0 === 0, `Expected 0m, got ${d0}m`);
console.log('✅ Test 1: Zero distance for identical points passed');

// Test 2: Geofence within 50m (approx 30m offset)
// 0.00027 degrees latitude is approx 30 meters
const nearCheck = checkGeofence(28.6289, 77.2065, 28.62917, 77.2065, 50);
assert(nearCheck.isWithinRange === true, `Expected within range, got ${nearCheck.distanceMeters}m`);
assert(nearCheck.distanceMeters >= 25 && nearCheck.distanceMeters <= 35, `Expected ~30m, got ${nearCheck.distanceMeters}m`);
console.log(`✅ Test 2: 30m offset correctly classified as in-range (${nearCheck.distanceMeters}m)`);

// Test 3: Geofence out of 50m range (approx 120m offset)
const farCheck = checkGeofence(28.6289, 77.2065, 28.6300, 77.2065, 50);
assert(farCheck.isWithinRange === false, `Expected out of range, got ${farCheck.distanceMeters}m`);
assert(farCheck.distanceMeters > 100, `Expected >100m, got ${farCheck.distanceMeters}m`);
console.log(`✅ Test 3: Out-of-range point correctly rejected (${farCheck.distanceMeters}m)`);

// Test 4: Distance formatting
assert(formatDistance(45) === '45m away', 'Failed 45m format');
assert(formatDistance(1500) === '1.5 km away', 'Failed 1.5km format');
console.log('✅ Test 4: Distance formatting passed');

console.log('🎉 ALL LOCATION TESTS PASSED SUCCESSFULLY!');
