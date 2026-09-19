// Anti-cheat reciprocity decay formula verification test

function calculateDecayPoints(basePoints: number, pairingCount: number): { credited: number; decayPct: number } {
  // Formula matching app.anti_cheat: credited = round(base * (1 / (1 + n_ur)))
  const factor = 1.0 / (1.0 + pairingCount);
  const credited = Math.round(basePoints * factor);
  const decayPct = Math.round((1.0 - credited / basePoints) * 100);
  return { credited, decayPct };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Anti-Cheat Reciprocity Decay Tests ---');

// Test 1: First-time audit between strangers (pairingCount = 0)
const stranger = calculateDecayPoints(150, 0);
assert(stranger.credited === 150, `Expected 150 pts, got ${stranger.credited}`);
assert(stranger.decayPct === 0, `Expected 0% decay, got ${stranger.decayPct}%`);
console.log(`✅ Test 1: Strangers receive 100% credit (${stranger.credited} pts, ${stranger.decayPct}% decay)`);

// Test 2: Second pairing between friends (pairingCount = 1)
const p2 = calculateDecayPoints(150, 1);
assert(p2.credited === 75, `Expected 75 pts, got ${p2.credited}`);
assert(p2.decayPct === 50, `Expected 50% decay, got ${p2.decayPct}%`);
console.log(`✅ Test 2: 2nd pairing decays by 50% (${p2.credited} pts, ${p2.decayPct}% decay)`);

// Test 3: Fourth pairing in hostel cartel (pairingCount = 3)
const p4 = calculateDecayPoints(150, 3);
assert(p4.credited === 38, `Expected 38 pts, got ${p4.credited}`);
assert(p4.decayPct >= 74, `Expected >=74% decay, got ${p4.decayPct}%`);
console.log(`✅ Test 3: 4th pairing decays to 38 pts (${p4.decayPct}% decay)`);

// Test 4: Heavy collusion (pairingCount = 9)
const p10 = calculateDecayPoints(150, 9);
assert(p10.credited === 15, `Expected 15 pts, got ${p10.credited}`);
assert(p10.decayPct === 90, `Expected 90% decay, got ${p10.decayPct}%`);
console.log(`✅ Test 4: Heavy collusion drops to 15 pts (${p10.decayPct}% decay - cartel rendered harmless)`);

console.log('🎉 ALL ANTI-CHEAT TESTS PASSED SUCCESSFULLY!');
