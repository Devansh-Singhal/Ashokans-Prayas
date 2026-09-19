import {
  MockSensorStream,
  PotholeDetectionEngine,
  PotholeEvent,
  RawSensorSample,
} from '../services/sensors/pothole';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

console.log('===========================================================');
console.log('   RUNNING EXHAUSTIVE POTHOLE DETECTION SUITE (12 TESTS)   ');
console.log('===========================================================\n');

// -------------------------------------------------------------
// Test 1: Standard Severe Pothole Detection
// -------------------------------------------------------------
console.log('🧪 Test 1: Standard Severe Pothole (Dip -> Upward Spike -> Asymmetric Roll)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(45); // Driving at 45 km/h

  const detected: PotholeEvent[] = [];
  engine.onPothole((ev) => detected.push(ev));

  let t = 10000;
  // Feed baseline driving
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  // Feed genuine pothole impact
  const potholeStream = MockSensorStream.generatePotholeHit({
    durationMs: 1600,
    startTimestampMs: t,
    impactPeakG: 2.8,
    dipG: -0.65,
    asymmetricRollRate: 0.8,
  });
  potholeStream.forEach((s) => engine.ingestSample(s));
  t += 1600;

  // Flush remaining samples
  const postDrive = MockSensorStream.generateNormalDriving({ durationMs: 1200, startTimestampMs: t });
  postDrive.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detected.length >= 1, `Expected at least 1 pothole detected, got ${detected.length}`);
  const ev = detected[0];
  assert(ev.classification === 'POTHOLE', `Expected classification POTHOLE, got ${ev.classification}`);
  assert(ev.severity === 'SEVERE' || ev.severity === 'CRITICAL', `Expected SEVERE or CRITICAL, got ${ev.severity}`);
  assert(ev.confidenceScore >= 0.70, `Expected confidence >= 0.70, got ${ev.confidenceScore}`);
  assert(ev.deltaG >= 2.0, `Expected deltaG >= 2.0g, got ${ev.deltaG.toFixed(2)}g`);
  console.log(`   ✅ Correctly detected pothole: severity=${ev.severity}, deltaG=${ev.deltaG.toFixed(2)}g, confidence=${ev.confidenceScore.toFixed(2)}`);
}

// -------------------------------------------------------------
// Test 2: Arbitrary Phone Orientation (Tilted in Car Mount)
// -------------------------------------------------------------
console.log('\n🧪 Test 2: Arbitrary Phone Orientation (Tilted 45° Pitch, 30° Roll)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(50);

  const detected: PotholeEvent[] = [];
  engine.onPothole((ev) => detected.push(ev));

  let t = 10000;
  // Initialize and settle gravity with tilted phone
  const baseline = MockSensorStream.generateNormalDriving({
    durationMs: 1800,
    startTimestampMs: t,
    phoneTiltPitchDeg: 45,
    phoneTiltRollDeg: 30,
  });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1800;

  // Hit pothole while phone is in tilted mount
  const tiltedPothole = MockSensorStream.generatePotholeHit({
    durationMs: 1600,
    startTimestampMs: t,
    impactPeakG: 2.7,
    dipG: -0.60,
    phoneTiltPitchDeg: 45,
    phoneTiltRollDeg: 30,
  });
  tiltedPothole.forEach((s) => engine.ingestSample(s));
  t += 1600;

  const postDrive = MockSensorStream.generateNormalDriving({
    durationMs: 1200,
    startTimestampMs: t,
    phoneTiltPitchDeg: 45,
    phoneTiltRollDeg: 30,
  });
  postDrive.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detected.length >= 1, `Expected tilted phone to detect pothole, got ${detected.length}`);
  const ev = detected[0];
  assert(ev.classification === 'POTHOLE', `Expected POTHOLE, got ${ev.classification}`);
  assert(ev.phoneTiltAngleDeg > 25, `Expected tilt angle > 25°, got ${ev.phoneTiltAngleDeg}°`);
  console.log(`   ✅ Coordinate realignment succeeded: detected despite ${ev.phoneTiltAngleDeg}° tilt mount`);
}

// -------------------------------------------------------------
// Test 3: Phone Handling Rejection (User Picks Up Phone)
// -------------------------------------------------------------
console.log('\n🧪 Test 3: Phone Handling Rejection (User Picking Up / Tapping Phone)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(40);

  const detectedPotholes: PotholeEvent[] = [];
  let handlingRejections = 0;

  engine.onPothole((ev) => detectedPotholes.push(ev));
  engine.onAnomaly((analysis) => {
    if (analysis.classification === 'REJECTED_PHONE_HANDLING') {
      handlingRejections++;
    }
  });

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  // Simulate user grabbing phone and rotating it
  const handlingStream = MockSensorStream.generatePhoneHandling({ durationMs: 1600, startTimestampMs: t });
  handlingStream.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 0, `Expected 0 potholes during handling, got ${detectedPotholes.length}`);
  assert(handlingRejections >= 1, `Expected handling rejections triggered, got ${handlingRejections}`);
  console.log(`   ✅ Successfully rejected phone handling: 0 false positives, ${handlingRejections} rejections logged`);
}

// -------------------------------------------------------------
// Test 4: Speed Bump Classification (Upward Rise First)
// -------------------------------------------------------------
console.log('\n🧪 Test 4: Speed Bump Classification (Upward Rise First -> Pitch Only)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(25);

  const detectedPotholes: PotholeEvent[] = [];
  let speedBumpsClassified = 0;

  engine.onPothole((ev) => detectedPotholes.push(ev));
  engine.onAnomaly((analysis) => {
    if (analysis.classification === 'SPEED_BUMP') {
      speedBumpsClassified++;
    }
  });

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  const bumpStream = MockSensorStream.generateSpeedBump({ durationMs: 1600, startTimestampMs: t });
  bumpStream.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 0, `Expected 0 potholes for speed bump, got ${detectedPotholes.length}`);
  assert(speedBumpsClassified >= 1, `Expected speed bump classified, got ${speedBumpsClassified}`);
  console.log(`   ✅ Correctly classified speed bump: 0 potholes triggered, ${speedBumpsClassified} speed bumps confirmed`);
}

// -------------------------------------------------------------
// Test 5: Rumble Strips Rejection (High Zero-Crossings)
// -------------------------------------------------------------
console.log('\n🧪 Test 5: Rumble Strips Rejection (Periodic 25 Hz Grooved Pavement)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(60);

  const detectedPotholes: PotholeEvent[] = [];
  let rumbleRejected = 0;

  engine.onPothole((ev) => detectedPotholes.push(ev));
  engine.onAnomaly((analysis) => {
    if (analysis.classification === 'ROUGH_ROAD_RUMBLE') {
      rumbleRejected++;
    }
  });

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  const rumbleStream = MockSensorStream.generateRumbleStrips({ durationMs: 1600, startTimestampMs: t });
  rumbleStream.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 0, `Expected 0 potholes on rumble strip, got ${detectedPotholes.length}`);
  assert(rumbleRejected >= 1, `Expected rumble rejection, got ${rumbleRejected}`);
  console.log(`   ✅ Correctly rejected rumble strips via zero-crossing count (${rumbleRejected} classifications)`);
}

// -------------------------------------------------------------
// Test 6: Emergency Hard Braking Rejection
// -------------------------------------------------------------
console.log('\n🧪 Test 6: Emergency Hard Braking Rejection (-0.65g Longitudinal Force)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(50);

  const detectedPotholes: PotholeEvent[] = [];
  let brakingRejected = 0;

  engine.onPothole((ev) => detectedPotholes.push(ev));
  engine.onAnomaly((analysis) => {
    if (analysis.classification === 'REJECTED_VEHICLE_MANEUVER') {
      brakingRejected++;
    }
  });

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  const brakingStream = MockSensorStream.generateHardBraking({ durationMs: 1800, startTimestampMs: t });
  brakingStream.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 0, `Expected 0 potholes during hard braking, got ${detectedPotholes.length}`);
  console.log('   ✅ Emergency braking successfully suppressed without false pothole alerts');
}

// -------------------------------------------------------------
// Test 7: Aggressive High-Speed Cornering Rejection
// -------------------------------------------------------------
console.log('\n🧪 Test 7: Aggressive Cornering Rejection (+0.52g Sustained Lateral Force)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(45);

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  const corneringStream = MockSensorStream.generateAggressiveCornering({ durationMs: 1800, startTimestampMs: t });
  corneringStream.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 0, `Expected 0 potholes during cornering, got ${detectedPotholes.length}`);
  console.log('   ✅ Sustained lateral centrifugal force rejected cleanly');
}

// -------------------------------------------------------------
// Test 8: Stationary Vehicle Rejection (Traffic Light / Idle)
// -------------------------------------------------------------
console.log('\n🧪 Test 8: Stationary Vehicle Rejection (Speed = 0 km/h)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(0); // At red light

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  let t = 10000;
  const potholeStream = MockSensorStream.generatePotholeHit({ durationMs: 1600, startTimestampMs: t });
  potholeStream.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 0, `Expected 0 potholes when stationary, got ${detectedPotholes.length}`);
  console.log('   ✅ Stationary vehicle impacts rejected (door slams / idle rumble)');
}

// -------------------------------------------------------------
// Test 9: Double-Axle Bounce Pairing (Front + Rear Wheel)
// -------------------------------------------------------------
console.log('\n🧪 Test 9: Double-Axle Bounce Pairing (Front Wheel + Rear Wheel Impact)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(40);

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  // Front wheel hit at 400ms, rear wheel hit at 640ms (gap = 240ms)
  const doubleAxleStream = MockSensorStream.generateDoubleAxlePothole({ durationMs: 2000, startTimestampMs: t });
  doubleAxleStream.forEach((s) => engine.ingestSample(s));
  t += 2000;

  const postDrive = MockSensorStream.generateNormalDriving({ durationMs: 1200, startTimestampMs: t });
  postDrive.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length === 1, `Expected 1 merged double-axle event, got ${detectedPotholes.length}`);
  const paired = detectedPotholes[0];
  assert(paired.isDoubleAxlePaired === true, 'Expected isDoubleAxlePaired to be true');
  assert(paired.axleGapMs !== undefined && paired.axleGapMs > 200 && paired.axleGapMs < 280,
    `Expected axle gap ~240ms, got ${paired.axleGapMs}ms`);
  assert(paired.confidenceScore >= 0.85, `Expected boosted confidence >= 0.85, got ${paired.confidenceScore}`);
  console.log(`   ✅ Double-axle hits clustered into 1 event (axleGap=${paired.axleGapMs}ms, confidence=${paired.confidenceScore.toFixed(2)})`);
}

// -------------------------------------------------------------
// Test 10: Accelerometer Saturation / Clipping Handling
// -------------------------------------------------------------
console.log('\n🧪 Test 10: Sensor Clipping / Saturation Handling (Peak Hits Hardware Limit)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(55);

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  let t = 10000;
  const baseline = MockSensorStream.generateNormalDriving({ durationMs: 1000, startTimestampMs: t });
  baseline.forEach((s) => engine.ingestSample(s));
  t += 1000;

  const saturatedStream = MockSensorStream.generateSaturatedImpact({ durationMs: 1600, startTimestampMs: t });
  saturatedStream.forEach((s) => engine.ingestSample(s));
  t += 1600;

  const postDrive = MockSensorStream.generateNormalDriving({ durationMs: 1200, startTimestampMs: t });
  postDrive.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length >= 1, `Expected saturated pothole detected, got ${detectedPotholes.length}`);
  const sat = detectedPotholes[0];
  assert(sat.severity === 'CRITICAL', `Expected CRITICAL severity on clipped impact, got ${sat.severity}`);
  assert(sat.confidenceScore >= 0.95, `Expected top confidence on saturated impact, got ${sat.confidenceScore}`);
  console.log(`   ✅ Handled clipped peak without error: classified as ${sat.severity} with ${sat.confidenceScore.toFixed(2)} confidence`);
}

// -------------------------------------------------------------
// Test 11: Gyroscope Hardware Absence (Fallback Mode)
// -------------------------------------------------------------
console.log('\n🧪 Test 11: Gyroscope Hardware Absence (Accelerometer-Only Fallback)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(35);

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  let t = 10000;
  const rawPothole = MockSensorStream.generatePotholeHit({ durationMs: 1800, startTimestampMs: t });
  const streamWithNoGyro: RawSensorSample[] = rawPothole.map((s) => ({
    acceleration: s.acceleration,
    gyroscope: undefined, // Simulates budget device lacking gyro
    timestampMs: s.timestampMs,
  }));
  streamWithNoGyro.forEach((s) => engine.ingestSample(s));
  t += 1800;

  const postDriveRaw = MockSensorStream.generateNormalDriving({ durationMs: 1200, startTimestampMs: t });
  const postDrive: RawSensorSample[] = postDriveRaw.map((s) => ({
    acceleration: s.acceleration,
    gyroscope: undefined,
    timestampMs: s.timestampMs,
  }));
  postDrive.forEach((s) => engine.ingestSample(s));
  engine.flush(true);

  assert(detectedPotholes.length >= 1, `Expected pothole detected in accelerometer-only mode, got ${detectedPotholes.length}`);
  console.log('   ✅ Graceful fallback mode functioned perfectly with 0 gyro readings');
}

// -------------------------------------------------------------
// Test 12: Sensor Jitter & Variable Sampling Interval Tolerance
// -------------------------------------------------------------
console.log('\n🧪 Test 12: Sensor Delivery Jitter Tolerance (Interval Fluctuating 14ms - 42ms)');
{
  const engine = new PotholeDetectionEngine();
  engine.setSpeed(45);

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  const rawPothole = MockSensorStream.generatePotholeHit({ durationMs: 1800 });

  // Introduce erratic timestamp intervals simulating OS thread throttling
  let simulatedTime = 10000;
  rawPothole.forEach((s) => {
    const jitter = Math.floor(14 + Math.random() * 28);
    simulatedTime += jitter;
    engine.ingestSample({
      ...s,
      timestampMs: simulatedTime,
    });
  });

  const postDrive = MockSensorStream.generateNormalDriving({ durationMs: 1200 });
  postDrive.forEach((s) => {
    const jitter = Math.floor(14 + Math.random() * 28);
    simulatedTime += jitter;
    engine.ingestSample({
      ...s,
      timestampMs: simulatedTime,
    });
  });
  engine.flush(true);

  assert(detectedPotholes.length >= 1, `Expected pothole detected despite heavy jitter, got ${detectedPotholes.length}`);
  console.log('   ✅ Variable Δt filter normalization remained numerically stable under heavy jitter');
}

// -------------------------------------------------------------
// Test 13: Stage Demo Mode (Phone Toss & Catch Activation at 0 km/h)
// -------------------------------------------------------------
console.log('\n🧪 Test 13: Stage Demo Mode (Phone Toss & Catch Activation at 0 km/h)');
{
  const engine = new PotholeDetectionEngine();
  engine.setStageDemoMode(true);
  engine.setSpeed(0); // Standing still on stage!

  const detectedPotholes: PotholeEvent[] = [];
  engine.onPothole((ev) => detectedPotholes.push(ev));

  // 1. Holding phone still
  engine.ingestSample({
    acceleration: { x: 0, y: 0, z: 1.0 },
    timestampMs: 1000,
  });

  // 2. Toss phone into air (freefall weightlessness for 320ms with aerodynamic tumble)
  for (let t = 20; t <= 320; t += 20) {
    engine.ingestSample({
      acceleration: { x: 0.05, y: 0.04, z: 0.06 }, // near 0g
      gyroscope: { x: 2.1, y: 1.8, z: 1.1 },        // high angular spin in air
      timestampMs: 1000 + t,
    });
  }

  // 3. Catch impact (+3.7g sudden deceleration spike as hand grabs phone)
  engine.ingestSample({
    acceleration: { x: 0.3, y: 0.4, z: 3.7 },
    gyroscope: { x: 0.2, y: 0.2, z: 0.1 },
    timestampMs: 1340,
  });

  // 4. Settled back in hand
  engine.ingestSample({
    acceleration: { x: 0, y: 0, z: 1.0 },
    timestampMs: 1380,
  });

  assert(detectedPotholes.length === 1, `Expected 1 toss-and-catch activation, got ${detectedPotholes.length}`);
  const tossEv = detectedPotholes[0];
  assert(tossEv.classification === 'POTHOLE', 'Expected classification POTHOLE');
  assert(tossEv.confidenceScore >= 0.95, `Expected high confidence >= 0.95, got ${tossEv.confidenceScore}`);
  assert(tossEv.severity === 'CRITICAL' || tossEv.severity === 'SEVERE', `Expected CRITICAL/SEVERE, got ${tossEv.severity}`);
  console.log(`   ✅ Toss-and-catch activation succeeded: detected on stage at 0 km/h with confidence ${tossEv.confidenceScore}`);
}

console.log('\n===========================================================');
console.log('   🎉 ALL 13 POTHOLE DETECTION TESTS PASSED SUCCESSFULLY!  ');
console.log('===========================================================\n');
