import { CandidateWindowAnalysis, PotholeEvent, TransformedSample } from '../types';

export interface AxleDebouncerConfig {
  axlePairingMinGapMs: number;
  axlePairingMaxGapMs: number;
  suspensionRingingRefractoryMs: number;
}

/**
 * Handles double-axle hit pairing and vehicle suspension bounce suppression.
 *
 * 1. Double-Axle Bounce: When a front wheel hits a hole, the rear wheel hits the same
 *    hole ~110ms-650ms later. Clusters both hits into a single confirmed high-confidence pothole event.
 * 2. Suspension Ringing: Prevents decaying chassis bounce oscillations (200-300ms)
 *    from triggering duplicate false alerts.
 */
export class AxleDebouncer {
  private config: AxleDebouncerConfig;
  private pendingFrontHit: {
    event: PotholeEvent;
    timestampMs: number;
  } | null = null;
  private lastEmittedHitTimestampMs = 0;

  constructor(config: AxleDebouncerConfig) {
    this.config = config;
  }

  public reset(): void {
    this.pendingFrontHit = null;
    this.lastEmittedHitTimestampMs = 0;
  }

  /**
   * Evaluates a newly classified candidate pothole.
   *
   * @param analysis Window classifier output.
   * @param sample Center trigger sample.
   * @param tiltAngleDeg Phone tilt angle.
   * @param speedKmph Vehicle speed if known.
   * @param gpsLocation GPS location if known.
   * @returns Emitted PotholeEvent or null if buffered/suppressed.
   */
  public processHit(
    analysis: CandidateWindowAnalysis,
    sample: TransformedSample,
    tiltAngleDeg: number,
    speedKmph?: number,
    gpsLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): { eventToEmit: PotholeEvent | null; wasMergedWithFrontAxle: boolean } {
    const timestampMs = sample.timestampMs;

    // 1. Suspension Ringing Rejection:
    // If an impact happens within the immediate post-shock ringing window (< 100ms) of an emitted hit,
    // suppress it as damper rebound.
    const timeSinceLastHit = timestampMs - this.lastEmittedHitTimestampMs;
    if (this.lastEmittedHitTimestampMs > 0 && timeSinceLastHit < 100) {
      return { eventToEmit: null, wasMergedWithFrontAxle: false };
    }

    // 2. Check for Double-Axle Pairing with a pending front axle hit
    if (this.pendingFrontHit) {
      const gapMs = timestampMs - this.pendingFrontHit.timestampMs;

      if (gapMs >= this.config.axlePairingMinGapMs && gapMs <= this.config.axlePairingMaxGapMs) {
        // MATCH: Rear axle hit the same pothole!
        const front = this.pendingFrontHit.event;
        const higherSeverity = this.getHigherSeverity(front.severity, analysis.severity);

        // Boost confidence due to physical double-axle corroboration
        const combinedConfidence = Math.min(0.99, Math.max(front.confidenceScore, analysis.confidence) + 0.15);

        const mergedEvent: PotholeEvent = {
          id: `pothole_${timestampMs}_axle_pair`,
          timestampMs: front.timestampMs, // Timestamp of initial road contact
          severity: higherSeverity,
          confidenceScore: combinedConfidence,
          classification: 'POTHOLE',
          peakVerticalG: Math.max(front.peakVerticalG, analysis.peakG),
          dipVerticalG: Math.min(front.dipVerticalG, analysis.dipG),
          deltaG: Math.max(front.deltaG, analysis.deltaG),
          durationMs: Math.round((front.durationMs + analysis.durationMs) / 2),
          isDoubleAxlePaired: true,
          axleGapMs: gapMs,
          rollEnergy: front.rollEnergy + analysis.rollEnergy,
          pitchEnergy: front.pitchEnergy + analysis.pitchEnergy,
          asymmetryRatio: (front.asymmetryRatio + analysis.asymmetryRatio) / 2,
          phoneTiltAngleDeg: tiltAngleDeg,
          estimatedSpeedKmph: speedKmph ?? front.estimatedSpeedKmph,
          gpsLocation: gpsLocation ?? front.gpsLocation,
        };

        this.pendingFrontHit = null;
        this.lastEmittedHitTimestampMs = timestampMs;

        return {
          eventToEmit: mergedEvent,
          wasMergedWithFrontAxle: true,
        };
      } else if (gapMs > this.config.axlePairingMaxGapMs) {
        // Pending front hit timed out, flush it
        const flushedEvent = this.pendingFrontHit.event;
        this.pendingFrontHit = null;

        // Current hit becomes new front hit or candidate
        this.bufferNewFrontHit(analysis, sample, tiltAngleDeg, speedKmph, gpsLocation);
        this.lastEmittedHitTimestampMs = flushedEvent.timestampMs;

        return {
          eventToEmit: flushedEvent,
          wasMergedWithFrontAxle: false,
        };
      }
    }

    // 3. Buffer new front hit to see if rear axle follows
    const newEvent = this.buildPotholeEvent(analysis, sample, tiltAngleDeg, speedKmph, gpsLocation);
    this.pendingFrontHit = {
      event: newEvent,
      timestampMs,
    };

    return { eventToEmit: null, wasMergedWithFrontAxle: false };
  }

  /**
   * Flushes any pending front hit if time window expires or engine stops.
   */
  public flushPending(currentTimestampMs: number): PotholeEvent | null {
    if (this.pendingFrontHit) {
      const gap = currentTimestampMs - this.pendingFrontHit.timestampMs;
      if (gap > this.config.axlePairingMaxGapMs) {
        const event = this.pendingFrontHit.event;
        this.pendingFrontHit = null;
        this.lastEmittedHitTimestampMs = event.timestampMs;
        return event;
      }
    }
    return null;
  }

  private bufferNewFrontHit(
    analysis: CandidateWindowAnalysis,
    sample: TransformedSample,
    tiltAngleDeg: number,
    speedKmph?: number,
    gpsLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): void {
    const event = this.buildPotholeEvent(analysis, sample, tiltAngleDeg, speedKmph, gpsLocation);
    this.pendingFrontHit = {
      event,
      timestampMs: sample.timestampMs,
    };
  }

  private buildPotholeEvent(
    analysis: CandidateWindowAnalysis,
    sample: TransformedSample,
    tiltAngleDeg: number,
    speedKmph?: number,
    gpsLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): PotholeEvent {
    return {
      id: `pothole_${sample.timestampMs}`,
      timestampMs: sample.timestampMs,
      severity: analysis.severity,
      confidenceScore: analysis.confidence,
      classification: 'POTHOLE',
      peakVerticalG: analysis.peakG,
      dipVerticalG: analysis.dipG,
      deltaG: analysis.deltaG,
      durationMs: analysis.durationMs,
      isDoubleAxlePaired: false,
      rollEnergy: analysis.rollEnergy,
      pitchEnergy: analysis.pitchEnergy,
      asymmetryRatio: analysis.asymmetryRatio,
      phoneTiltAngleDeg: tiltAngleDeg,
      estimatedSpeedKmph: speedKmph,
      gpsLocation,
    };
  }

  private getHigherSeverity(
    a: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL',
    b: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
  ): 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' {
    const ranks = { MINOR: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4 };
    return ranks[a] >= ranks[b] ? a : b;
  }
}
