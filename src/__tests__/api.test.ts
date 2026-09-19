import { CivicFeedApi } from '../services/api';

const api = new CivicFeedApi('http://localhost:8000/api/v1');

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runApiTests() {
  console.log('--- Running CivicFeed API Integration Tests ---');
  
  const testPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Test 1: Register adult user
  const adult = await api.register(testPhone, false);
  assert(!!adult.id, 'Adult registration must return user id');
  assert(adult.consent_status === 'ACTIVE', `Adult must be ACTIVE, got ${adult.consent_status}`);
  console.log(`✅ Test 1: Adult registered successfully: ${adult.public_handle} (${adult.consent_status})`);

  // Test 2: Register minor under 18
  const minorPhone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
  const parentPhone = `+9196${Math.floor(10000000 + Math.random() * 90000000)}`;
  const minor = await api.register(minorPhone, true, parentPhone);
  assert(minor.consent_status === 'PENDING_PARENT_CONSENT', 'Minor must be PENDING_PARENT_CONSENT');
  assert(!!minor.consent_token, 'Minor must return consent_token');
  console.log(`✅ Test 2: Minor registered with pending parent consent: ${minor.public_handle} (Token: ${minor.consent_token?.slice(0, 10)}...)`);

  // Test 3: Approve parent consent via token
  if (minor.consent_token) {
    const approval = await api.verifyParentConsent(minor.consent_token);
    assert(approval.status === 'ACTIVE', `Expected ACTIVE after parent consent, got ${approval.status}`);
    console.log(`✅ Test 3: Parent consent token approved successfully -> Minor activated!`);
  }

  // Test 4: Fetch ward feed
  const feed = await api.getWardFeed('WARD_DELHI_14');
  assert(feed.ward_id === 'WARD_DELHI_14', 'Feed must return correct ward_id');
  assert(Array.isArray(feed.tickets), 'Feed tickets must be an array');
  console.log(`✅ Test 4: Ward feed fetched successfully (Total tickets in Ward 14: ${feed.total})`);

  // Test 5: Fetch ward scorecard
  const scorecard = await api.getWardScorecard('WARD_DELHI_14');
  assert(scorecard.ward_id === 'WARD_DELHI_14', 'Scorecard ward_id mismatch');
  assert(typeof scorecard.cleanliness_score === 'number', 'Cleanliness score must be numeric');
  console.log(`✅ Test 5: Ward scorecard retrieved: Cleanliness Score = ${scorecard.cleanliness_score}%, Avg Days = ${scorecard.avg_resolution_days}`);

  console.log('\n🎉 ALL API INTEGRATION TESTS PASSED 100% AGAINST LIVE BACKEND!');
}

runApiTests().catch((err) => {
  console.error('❌ API Integration Test Failed:', err);
  process.exit(1);
});
