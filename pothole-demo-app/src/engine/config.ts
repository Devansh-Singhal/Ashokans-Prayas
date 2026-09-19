import { EngineConfig } from './types';

/**
 * Tuned physical constants and default configuration values for the pothole detection engine.
 * Values are grounded in vehicle suspension dynamics and road surface accelerometer research.
 */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  // Sensor sampling at 50 Hz (20ms) is optimal balance between frequency resolution and battery consumption.
  samplingIntervalMs: 20,

  // Low-pass filter time constant for Earth gravity vector tracking (tau = 1.8s).
  // Slow enough to ignore bumps and turns, fast enough to adapt when phone orientation in cradle settles.
  gravityFilterTauSeconds: 1.8,

  // Bandpass filter cutoffs:
  // - High-pass cutoff at 2.5 Hz eliminates braking/acceleration pitch and vehicle body sway.
  // - Low-pass cutoff at 25.0 Hz eliminates high-frequency engine idle harmonics and chassis acoustic buzz.
  bandpassLowCutoffHz: 2.5,
  bandpassHighCutoffHz: 25.0,

  // Dynamic Z-score threshold for initial candidate triggering.
  // Event must exceed 3.2 standard deviations above ambient road noise baseline.
  anomalyZScoreThreshold: 3.2,

  // Absolute minimum peak-to-dip spread in g to trigger full window inspection (0.75g).
  minCandidateDeltaG: 0.75,

  // Severity thresholds in delta g (spread between downward drop and upward collision spike).
  severityThresholds: {
    moderate: 1.25, // 1.25g delta -> noticeable bump/thud
    severe: 2.10,   // 2.10g delta -> harsh jolt, potential tire/rim hazard
    critical: 3.40, // 3.40g delta -> violent impact, deep crater or high-speed collision
  },

  // Phone handling detection:
  // Rotation rate > 1.8 rad/s (~103 deg/s) indicates human hand movement or phone falling.
  phoneHandlingAngularRateThreshold: 1.8,
  phoneHandlingSustainedWindowMs: 220,
  handlingReArmCooldownMs: 650,

  // Speed-based suppression:
  // Suppress pothole triggers when crawling below 12 km/h (suspension absorbs shock; impacts are often door slams).
  minValidSpeedKmph: 12,

  // Front and rear wheel double-axle bounce pairing window:
  // Typical wheelbase is 2.4m - 3.2m. At 30 km/h (8.3 m/s), gap is ~300ms. At 80 km/h (22.2 m/s), gap is ~120ms.
  axlePairingMinGapMs: 110,
  axlePairingMaxGapMs: 650,

  // Snapshot analysis window: 160ms before trigger and 160ms after trigger (total 320ms = 16 samples at 50Hz).
  windowPreTriggerMs: 160,
  windowPostTriggerMs: 160,

  // Suspension oscillation suppression: vehicle shock absorbers ring for 100-200ms after impact.
  suspensionRingingRefractoryMs: 100,

  // Standard mobile accelerometer range saturation limit (most smartphone IMUs clip at ±3.9g or ±7.8g).
  sensorSaturationLimitG: 3.85,

  // Stage demo mode (toss and catch activation) default
  stageDemoMode: false,
};

/**
 * Creates a merged configuration overriding any specific settings.
 */
export function createEngineConfig(overrides?: Partial<EngineConfig>): EngineConfig {
  if (!overrides) {
    return { ...DEFAULT_ENGINE_CONFIG };
  }
  return {
    ...DEFAULT_ENGINE_CONFIG,
    ...overrides,
    severityThresholds: {
      ...DEFAULT_ENGINE_CONFIG.severityThresholds,
      ...(overrides.severityThresholds || {}),
    },
  };
}
