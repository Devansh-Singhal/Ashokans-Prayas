/**
 * Domain types for standalone accelerometer and gyroscope pothole detection engine.
 * Fully decoupled and self-contained.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface RawSensorSample {
  /**
   * Acceleration in g-force (1g ≈ 9.80665 m/s²).
   */
  acceleration: Vector3D;
  /**
   * Angular rate of rotation in radians/sec.
   * Optional to allow graceful fallback when gyroscope hardware is absent.
   */
  gyroscope?: Vector3D;
  /**
   * Timestamp in milliseconds (epoch or high-res performance clock).
   */
  timestampMs: number;
}

export interface TransformedSample {
  raw: RawSensorSample;
  /**
   * Estimated unit gravity vector in the device coordinate frame (||g|| = 1.0).
   */
  gravityVector: Vector3D;
  /**
   * Dynamic acceleration aligned with Earth's true vertical axis (1g static gravity removed).
   * Positive = upward acceleration, Negative = downward drop/dip.
   */
  verticalAcceleration: number;
  /**
   * Dynamic acceleration in the horizontal Earth ground plane (resultant of forward + lateral).
   */
  horizontalAcceleration: number;
  /**
   * Bandpass filtered vertical acceleration isolating shock impulses (typically 2.5Hz - 25Hz).
   */
  filteredVertical: number;
  /**
   * Euclidean norm of angular rate ||ω|| in rad/s.
   */
  angularRateNorm: number;
  /**
   * Estimated tilt angle of the device relative to Earth vertical (0° = flat, 90° = vertical upright).
   */
  tiltAngleDeg: number;
  /**
   * Timestamp in milliseconds.
   */
  timestampMs: number;
}

export type PotholeSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

export type AnomalyClassification =
  | 'POTHOLE'
  | 'SPEED_BUMP'
  | 'ROUGH_ROAD_RUMBLE'
  | 'EXPANSION_JOINT'
  | 'REJECTED_PHONE_HANDLING'
  | 'REJECTED_STATIONARY'
  | 'REJECTED_VEHICLE_MANEUVER'
  | 'NORMAL_DRIVING';

export interface PotholeEvent {
  id: string;
  timestampMs: number;
  severity: PotholeSeverity;
  confidenceScore: number; // 0.0 to 1.0
  classification: AnomalyClassification;
  /**
   * Peak upward impact in vertical g (e.g. +2.4g).
   */
  peakVerticalG: number;
  /**
   * Peak downward drop/dip in vertical g (e.g. -0.65g).
   */
  dipVerticalG: number;
  /**
   * Peak-to-dip total dynamic spread.
   */
  deltaG: number;
  /**
   * Duration of the impulse waveform in milliseconds (typically 30ms - 120ms for road holes).
   */
  durationMs: number;
  /**
   * Whether this event was confirmed by front and rear axle pair impacts.
   */
  isDoubleAxlePaired: boolean;
  /**
   * Time gap in ms between front and rear axle impacts if paired.
   */
  axleGapMs?: number;
  /**
   * Energy of roll rotation during impact (measures single-wheel asymmetry).
   */
  rollEnergy: number;
  /**
   * Energy of pitch rotation during impact (measures front-to-back chassis tilt).
   */
  pitchEnergy: number;
  /**
   * Asymmetry ratio: rollEnergy / (pitchEnergy + 1e-4). High ratio strongly correlates with 1-wheel pothole.
   */
  asymmetryRatio: number;
  /**
   * Tilt angle of the phone when the impact occurred.
   */
  phoneTiltAngleDeg: number;
  /**
   * Vehicle speed in km/h if available from external GPS.
   */
  estimatedSpeedKmph?: number;
  /**
   * Optional GPS coordinates when the pothole was hit.
   */
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  /**
   * Snapshot snippet of the transformed signal window surrounding the anomaly.
   */
  waveformSnippet?: TransformedSample[];
}

export interface CandidateWindowAnalysis {
  classification: AnomalyClassification;
  confidence: number;
  severity: PotholeSeverity;
  peakG: number;
  dipG: number;
  deltaG: number;
  durationMs: number;
  dipPrecededPeak: boolean;
  zeroCrossingRate: number;
  rollEnergy: number;
  pitchEnergy: number;
  asymmetryRatio: number;
  rejectionReason?: string;
}

export interface EngineConfig {
  /**
   * Sensor polling interval in milliseconds (default: 20ms = 50Hz).
   */
  samplingIntervalMs: number;
  /**
   * Time constant tau for low-pass gravity filter in seconds (default: 1.8s).
   */
  gravityFilterTauSeconds: number;
  /**
   * Cutoff frequencies for vertical bandpass filter in Hz.
   */
  bandpassLowCutoffHz: number;
  bandpassHighCutoffHz: number;
  /**
   * Multiplier of baseline standard deviation (Z-score) to trigger a candidate window.
   */
  anomalyZScoreThreshold: number;
  /**
   * Absolute minimum peak-to-peak delta G to qualify as a candidate (default: 0.85g).
   */
  minCandidateDeltaG: number;
  /**
   * Thresholds for severity classification in delta G (peak - dip).
   */
  severityThresholds: {
    moderate: number; // e.g. 1.3g
    severe: number;   // e.g. 2.2g
    critical: number; // e.g. 3.5g
  };
  /**
   * Gyroscope angular velocity norm threshold (rad/s) indicating phone pickup/handling.
   */
  phoneHandlingAngularRateThreshold: number; // e.g. 1.8 rad/s
  /**
   * Phone handling duration window in ms (e.g. 250ms).
   */
  phoneHandlingSustainedWindowMs: number;
  /**
   * Cooldown after phone handling or reorientation before pothole detection re-arms.
   */
  handlingReArmCooldownMs: number; // e.g. 600ms
  /**
   * Vehicle speed below which pothole detection is suppressed (km/h).
   */
  minValidSpeedKmph: number; // e.g. 12 km/h
  /**
   * Double-axle pairing window: min and max time gap in ms between front and rear tire hits.
   */
  axlePairingMinGapMs: number; // e.g. 120ms
  axlePairingMaxGapMs: number; // e.g. 650ms
  /**
   * Transient analysis window: milliseconds before and after the peak trigger.
   */
  windowPreTriggerMs: number;  // e.g. 200ms
  windowPostTriggerMs: number; // e.g. 350ms
  /**
   * Post-impact ringing suppression refractory window (ms).
   */
  suspensionRingingRefractoryMs: number; // e.g. 300ms
  /**
   * Accelerometer saturation limit in g (if reading exceeds this, flagged as clipping).
   */
  sensorSaturationLimitG: number; // e.g. 3.9g for 4g sensors, 7.8g for 8g sensors
  /**
   * Stage Demo Mode: Enables phone toss-and-catch activation (freefall followed by catch impact)
   * and bypasses stationary speed suppression for presentations on stage.
   */
  stageDemoMode?: boolean;
}

export interface EngineStats {
  samplesIngested: number;
  candidatesEvaluated: number;
  potholesDetected: number;
  speedBumpsClassified: number;
  rumbleStripsRejected: number;
  handlingRejected: number;
  maneuversRejected: number;
  stationaryRejected: number;
  axlePairsMerged: number;
  currentNoiseStdDev: number;
  currentGravityNorm: number;
  phoneTiltDeg: number;
  isHandlingSuppressed: boolean;
  stageDemoMode: boolean;
  isAirborneFreefall: boolean;
  freefallDurationMs: number;
  lastProcessedTimestampMs: number;
}

export type PotholeDetectionCallback = (event: PotholeEvent) => void;
export type AnomalyEvaluatedCallback = (analysis: CandidateWindowAnalysis, sample: TransformedSample) => void;
export type StatsUpdateCallback = (stats: EngineStats) => void;
export type TelemetryCallback = (sample: TransformedSample) => void;
