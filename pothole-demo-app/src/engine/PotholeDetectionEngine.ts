import { DEFAULT_ENGINE_CONFIG, createEngineConfig } from './config';
import { AxleDebouncer } from './detectors/AxleDebouncer';
import { PhoneHandlingDetector } from './detectors/PhoneHandlingDetector';
import { VehicleDynamicsFilter } from './detectors/VehicleDynamicsFilter';
import { WaveformClassifier } from './detectors/WaveformClassifier';
import { AdaptiveNoiseTracker } from './filters/AdaptiveNoiseTracker';
import { BandpassFilter } from './filters/ButterworthFilter';
import { CoordinateTransformer } from './filters/CoordinateTransformer';
import {
  AnomalyEvaluatedCallback,
  CandidateWindowAnalysis,
  EngineConfig,
  EngineStats,
  PotholeDetectionCallback,
  PotholeEvent,
  RawSensorSample,
  StatsUpdateCallback,
  TelemetryCallback,
  TransformedSample,
} from './types';

/**
 * High-performance, standalone Pothole Detection Engine.
 * Combines 3D coordinate transformation, bandpass shock impulse isolation,
 * adaptive noise baseline estimation, and multi-stage false-positive rejection.
 */
export class PotholeDetectionEngine {
  private config: EngineConfig;

  // Signal Processing Filters
  private coordTransformer: CoordinateTransformer;
  private bandpassFilter: BandpassFilter;
  private noiseTracker: AdaptiveNoiseTracker;

  // Corner-case Detectors & Classifiers
  private handlingDetector: PhoneHandlingDetector;
  private dynamicsFilter: VehicleDynamicsFilter;
  private waveformClassifier: WaveformClassifier;
  private axleDebouncer: AxleDebouncer;

  // Sliding sample ring buffer (stores ~1.5 seconds of history at 50Hz)
  private sampleBuffer: TransformedSample[] = [];
  private readonly maxBufferSize: number;

  // Pending candidate analysis window
  private pendingAnalysis: {
    triggerIndex: number;
    triggerTimestampMs: number;
    postTriggerTargetMs: number;
  } | null = null;

  // External contextual hooks
  private currentSpeedKmph?: number;
  private currentGpsLocation?: { latitude: number; longitude: number; accuracy?: number };

  // Listeners
  private potholeListeners: Set<PotholeDetectionCallback> = new Set();
  private anomalyListeners: Set<AnomalyEvaluatedCallback> = new Set();
  private statsListeners: Set<StatsUpdateCallback> = new Set();
  private telemetryListeners: Set<TelemetryCallback> = new Set();

  // Freefall tracking for stage toss-and-catch demo
  private isAirborne = false;
  private freefallStartMs: number | null = null;
  private freefallEndMs: number | null = null;

  // Engine Statistics
  private stats: EngineStats = {
    samplesIngested: 0,
    candidatesEvaluated: 0,
    potholesDetected: 0,
    speedBumpsClassified: 0,
    rumbleStripsRejected: 0,
    handlingRejected: 0,
    maneuversRejected: 0,
    stationaryRejected: 0,
    axlePairsMerged: 0,
    currentNoiseStdDev: 0.1,
    currentGravityNorm: 1.0,
    phoneTiltDeg: 0,
    isHandlingSuppressed: false,
    stageDemoMode: false,
    isAirborneFreefall: false,
    freefallDurationMs: 0,
    lastProcessedTimestampMs: 0,
  };

  constructor(customConfig?: Partial<EngineConfig>) {
    this.config = createEngineConfig(customConfig);
    this.stats.stageDemoMode = !!this.config.stageDemoMode;

    const sampleRateHz = 1000 / this.config.samplingIntervalMs;
    this.coordTransformer = new CoordinateTransformer(this.config.gravityFilterTauSeconds);
    this.bandpassFilter = new BandpassFilter(
      sampleRateHz,
      this.config.bandpassLowCutoffHz,
      this.config.bandpassHighCutoffHz
    );
    this.noiseTracker = new AdaptiveNoiseTracker();

    this.handlingDetector = new PhoneHandlingDetector(
      this.config.phoneHandlingAngularRateThreshold,
      this.config.phoneHandlingSustainedWindowMs,
      this.config.handlingReArmCooldownMs
    );

    this.dynamicsFilter = new VehicleDynamicsFilter(this.config.minValidSpeedKmph);

    this.waveformClassifier = new WaveformClassifier({
      minCandidateDeltaG: this.config.minCandidateDeltaG,
      severityThresholds: this.config.severityThresholds,
      sensorSaturationLimitG: this.config.sensorSaturationLimitG,
    });

    this.axleDebouncer = new AxleDebouncer({
      axlePairingMinGapMs: this.config.axlePairingMinGapMs,
      axlePairingMaxGapMs: this.config.axlePairingMaxGapMs,
      suspensionRingingRefractoryMs: this.config.suspensionRingingRefractoryMs,
    });

    // Buffer capacity: ~1200ms total history
    this.maxBufferSize = Math.ceil(1200 / this.config.samplingIntervalMs);
  }

  /**
   * Resets all internal buffers, filter states, and baseline trackers.
   */
  public reset(): void {
    this.coordTransformer.reset();
    this.bandpassFilter.reset();
    this.noiseTracker.reset();
    this.handlingDetector.reset();
    this.dynamicsFilter.reset();
    this.axleDebouncer.reset();
    this.sampleBuffer = [];
    this.pendingAnalysis = null;
  }

  /**
   * Updates vehicle speed from external GPS (e.g. expo-location).
   */
  public setSpeed(speedKmph: number, timestampMs = Date.now()): void {
    this.currentSpeedKmph = speedKmph;
    this.dynamicsFilter.updateSpeed(speedKmph, timestampMs);
  }

  /**
   * Updates current GPS position.
   */
  public setGpsLocation(coords: { latitude: number; longitude: number; accuracy?: number }): void {
    this.currentGpsLocation = coords;
  }

  /**
   * Ingests a single real-time sensor measurement into the signal processing pipeline.
   */
  public ingestSample(sample: RawSensorSample): void {
    this.stats.samplesIngested++;
    this.stats.lastProcessedTimestampMs = sample.timestampMs;

    const rawAcc = sample.acceleration;
    const totalGNorm = Math.sqrt(rawAcc.x * rawAcc.x + rawAcc.y * rawAcc.y + rawAcc.z * rawAcc.z);

    // Stage 0: Stage Demo Mode (Phone Toss & Catch Recognition)
    if (this.config.stageDemoMode) {
      const isWeightless = totalGNorm < 0.38;

      if (isWeightless) {
        if (this.freefallStartMs === null) {
          this.freefallStartMs = sample.timestampMs;
        }
        this.isAirborne = true;
        this.stats.isAirborneFreefall = true;
        this.stats.freefallDurationMs = sample.timestampMs - this.freefallStartMs;
      } else {
        // Exited weightlessness
        if (this.isAirborne && this.freefallStartMs !== null) {
          const duration = sample.timestampMs - this.freefallStartMs;
          this.freefallEndMs = sample.timestampMs;
          this.isAirborne = false;
          this.stats.isAirborneFreefall = false;

          // If phone was airborne for 120ms to 1800ms
          if (duration >= 120 && duration <= 1800) {
            // Check if this sample is the deceleration catch impact
            const isCatchImpact = totalGNorm > 2.0 || Math.abs(sample.acceleration.z) > 1.8;
            if (isCatchImpact) {
              const tossPothole: PotholeEvent = {
                id: `stage_toss_${sample.timestampMs}`,
                timestampMs: sample.timestampMs,
                severity: totalGNorm > 3.2 ? 'CRITICAL' : 'SEVERE',
                confidenceScore: 0.98,
                classification: 'POTHOLE',
                peakVerticalG: Number(totalGNorm.toFixed(2)),
                dipVerticalG: -1.0,
                deltaG: Number((totalGNorm + 1.0).toFixed(2)),
                durationMs: duration,
                isDoubleAxlePaired: false,
                rollEnergy: 0.5,
                pitchEnergy: 0.5,
                asymmetryRatio: 1.0,
                phoneTiltAngleDeg: 0,
                estimatedSpeedKmph: 0,
              };

              this.freefallStartMs = null;
              this.freefallEndMs = null;
              this.stats.freefallDurationMs = 0;
              this.emitPothole(tossPothole);
              return;
            }
          }
        }
      }

      if (this.freefallEndMs !== null && (sample.timestampMs - this.freefallEndMs > 160)) {
        this.freefallStartMs = null;
        this.freefallEndMs = null;
        this.stats.freefallDurationMs = 0;
      }
    }

    // Stage 1: Coordinate transformation & gravity projection
    const transform = this.coordTransformer.transform(sample.acceleration, sample.timestampMs);

    // Stage 2: Bandpass filter vertical acceleration to isolate shock impulse
    const filteredVert = this.bandpassFilter.filter(transform.verticalAcceleration);

    // Stage 3: Phone handling and reorientation detection
    const handling = this.handlingDetector.evaluate(
      sample.gyroscope,
      transform.isReorienting,
      sample.timestampMs
    );
    this.stats.isHandlingSuppressed = handling.isHandlingSuppressed;
    this.stats.phoneTiltDeg = Math.round(transform.tiltAngleDeg);
    this.stats.currentGravityNorm = Number(transform.gravityMagnitude.toFixed(3));

    // Stage 4: Vehicle dynamics (braking, turning, stationarity)
    const dynamics = this.dynamicsFilter.evaluate(
      transform.horizontalAcceleration,
      transform.verticalAcceleration,
      sample.timestampMs
    );

    // Stage 5: Adaptive baseline standard deviation & Z-score
    const { zScore, stdDev } = this.noiseTracker.update(filteredVert, sample.timestampMs);
    this.stats.currentNoiseStdDev = Number(stdDev.toFixed(3));

    const transformed: TransformedSample = {
      raw: sample,
      gravityVector: transform.gravityUnitVector,
      verticalAcceleration: transform.verticalAcceleration,
      horizontalAcceleration: transform.horizontalAcceleration,
      filteredVertical: filteredVert,
      angularRateNorm: handling.angularRateNorm,
      tiltAngleDeg: transform.tiltAngleDeg,
      timestampMs: sample.timestampMs,
    };

    // Emit live telemetry for UI display
    for (const listener of this.telemetryListeners) {
      try {
        listener(transformed);
      } catch (err) {
        console.error('Error in telemetry listener:', err);
      }
    }

    // Append to sliding window
    this.sampleBuffer.push(transformed);
    if (this.sampleBuffer.length > this.maxBufferSize) {
      this.sampleBuffer.shift();
    }

    // Check if we are currently gathering post-trigger samples for a pending candidate window
    if (this.pendingAnalysis) {
      if (sample.timestampMs >= this.pendingAnalysis.postTriggerTargetMs) {
        this.finalizeCandidateWindow();
      }
    } else {
      // Stage 6: Anomaly Trigger Check
      // Candidate must exceed Z-score threshold and minimum physical vertical delta
      const isAnomalyTriggered = zScore > this.config.anomalyZScoreThreshold
        && Math.abs(filteredVert) > (this.config.minCandidateDeltaG * 0.45);

      if (isAnomalyTriggered) {
        // Freeze baseline noise tracker during shock event so peak does not distort stdDev
        this.noiseTracker.freeze(400, sample.timestampMs);

        // Check early suppressions
        if (handling.isHandlingSuppressed) {
          this.stats.handlingRejected++;
          this.emitAnomaly({
            classification: 'REJECTED_PHONE_HANDLING',
            confidence: 0.90,
            severity: 'MINOR',
            peakG: filteredVert,
            dipG: 0,
            deltaG: Math.abs(filteredVert),
            durationMs: 0,
            dipPrecededPeak: false,
            zeroCrossingRate: 0,
            rollEnergy: 0,
            pitchEnergy: 0,
            asymmetryRatio: 0,
            rejectionReason: handling.reason,
          }, transformed);
          return;
        }

        if (dynamics.isSuppressed) {
          if (dynamics.suppressionReason === 'STATIONARY_VEHICLE' || dynamics.suppressionReason === 'LOW_SPEED_CRAWL') {
            this.stats.stationaryRejected++;
          } else {
            this.stats.maneuversRejected++;
          }

          this.emitAnomaly({
            classification: dynamics.suppressionReason === 'STATIONARY_VEHICLE'
              ? 'REJECTED_STATIONARY'
              : 'REJECTED_VEHICLE_MANEUVER',
            confidence: 0.88,
            severity: 'MINOR',
            peakG: filteredVert,
            dipG: 0,
            deltaG: Math.abs(filteredVert),
            durationMs: 0,
            dipPrecededPeak: false,
            zeroCrossingRate: 0,
            rollEnergy: 0,
            pitchEnergy: 0,
            asymmetryRatio: 0,
            rejectionReason: dynamics.suppressionReason,
          }, transformed);
          return;
        }

        // Schedule post-trigger window collection
        this.pendingAnalysis = {
          triggerIndex: this.sampleBuffer.length - 1,
          triggerTimestampMs: sample.timestampMs,
          postTriggerTargetMs: sample.timestampMs + this.config.windowPostTriggerMs,
        };
      }
    }

    // Periodically flush any un-paired front axle hits
    const flushed = this.axleDebouncer.flushPending(sample.timestampMs);
    if (flushed) {
      this.emitPothole(flushed);
    }
  }

  /**
   * Finalizes analysis once pre-trigger and post-trigger window has collected.
   */
  private finalizeCandidateWindow(): void {
    if (!this.pendingAnalysis) return;

    this.stats.candidatesEvaluated++;
    const triggerMs = this.pendingAnalysis.triggerTimestampMs;
    const windowStartMs = triggerMs - this.config.windowPreTriggerMs;
    const windowEndMs = triggerMs + this.config.windowPostTriggerMs;

    const windowSlice = this.sampleBuffer.filter(
      (s) => s.timestampMs >= windowStartMs && s.timestampMs <= windowEndMs
    );

    const centerTriggerSample = this.sampleBuffer[this.pendingAnalysis.triggerIndex]
      ?? windowSlice[Math.floor(windowSlice.length / 2)];

    this.pendingAnalysis = null;

    // Analyze waveform morphology
    const analysis = this.waveformClassifier.analyzeWindow(windowSlice, Math.floor(windowSlice.length / 2));

    this.emitAnomaly(analysis, centerTriggerSample);

    // Identify the true peak impact sample within the window
    let peakSample = centerTriggerSample;
    let maxMagnitudeG = -1;
    for (const s of windowSlice) {
      const magG = Math.abs(s.filteredVertical);
      if (magG > maxMagnitudeG) {
        maxMagnitudeG = magG;
        peakSample = s;
      }
    }

    if (analysis.classification === 'SPEED_BUMP') {
      this.stats.speedBumpsClassified++;
    } else if (analysis.classification === 'ROUGH_ROAD_RUMBLE') {
      this.stats.rumbleStripsRejected++;
    } else if (analysis.classification === 'POTHOLE') {
      // Pass to axle debouncer
      const { eventToEmit, wasMergedWithFrontAxle } = this.axleDebouncer.processHit(
        analysis,
        peakSample,
        peakSample.tiltAngleDeg,
        this.currentSpeedKmph,
        this.currentGpsLocation
      );

      if (wasMergedWithFrontAxle) {
        this.stats.axlePairsMerged++;
      }

      if (eventToEmit) {
        eventToEmit.waveformSnippet = windowSlice;
        this.emitPothole(eventToEmit);
      }
    }
  }

  private emitPothole(event: PotholeEvent): void {
    this.stats.potholesDetected++;
    for (const listener of this.potholeListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in pothole listener:', err);
      }
    }
    this.notifyStats();
  }

  private emitAnomaly(analysis: CandidateWindowAnalysis, sample: TransformedSample): void {
    for (const listener of this.anomalyListeners) {
      try {
        listener(analysis, sample);
      } catch (err) {
        console.error('Error in anomaly listener:', err);
      }
    }
    this.notifyStats();
  }

  private notifyStats(): void {
    for (const listener of this.statsListeners) {
      try {
        listener({ ...this.stats });
      } catch (err) {
        console.error('Error in stats listener:', err);
      }
    }
  }

  // Listener registration
  public onPothole(callback: PotholeDetectionCallback): () => void {
    this.potholeListeners.add(callback);
    return () => this.potholeListeners.delete(callback);
  }

  public onAnomaly(callback: AnomalyEvaluatedCallback): () => void {
    this.anomalyListeners.add(callback);
    return () => this.anomalyListeners.delete(callback);
  }

  public onStats(callback: StatsUpdateCallback): () => void {
    this.statsListeners.add(callback);
    return () => this.statsListeners.delete(callback);
  }

  public onTelemetry(callback: TelemetryCallback): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  /**
   * Flushes any pending window analysis or buffered front-axle hits.
   * Useful when vehicle stops, app enters background, or test simulation completes.
   */
  public flush(force = false): void {
    if (this.pendingAnalysis) {
      this.finalizeCandidateWindow();
    }
    const flushed = this.axleDebouncer.flushPending(force ? Infinity : this.stats.lastProcessedTimestampMs + 1000);
    if (flushed) {
      this.emitPothole(flushed);
    }
  }

  /**
   * Toggles Stage Demo Mode (Phone Toss & Catch) vs Road Driving Mode.
   */
  public setStageDemoMode(enabled: boolean): void {
    this.config.stageDemoMode = enabled;
    this.stats.stageDemoMode = enabled;
    if (!enabled) {
      this.isAirborne = false;
      this.freefallStartMs = null;
      this.freefallEndMs = null;
      this.stats.isAirborneFreefall = false;
      this.stats.freefallDurationMs = 0;
    }
    this.notifyStats();
  }

  /**
   * Generates a simulated phone toss in the air and catch impact.
   * Useful for mentor demonstrations on desktop/web without throwing hardware.
   */
  public simulateToss(): void {
    const wasDemoMode = !!this.config.stageDemoMode;
    this.setStageDemoMode(true);

    const baseTime = Date.now();
    // 1. Airborne weightlessness (300ms)
    for (let t = 0; t <= 300; t += 20) {
      this.ingestSample({
        acceleration: { x: 0.04, y: 0.03, z: 0.05 }, // ~0.07g weightless
        gyroscope: { x: 1.2, y: 1.5, z: 0.8 },        // tumble
        timestampMs: baseTime + t,
      });
    }

    // 2. Catch deceleration collision impact (+3.8g spike)
    this.ingestSample({
      acceleration: { x: 0.3, y: 0.4, z: 3.8 },
      gyroscope: { x: 0.3, y: 0.3, z: 0.2 },
      timestampMs: baseTime + 320,
    });

    // 3. Settle back to normal 1.0g gravity
    this.ingestSample({
      acceleration: { x: 0.0, y: 0.0, z: 1.0 },
      gyroscope: { x: 0, y: 0, z: 0 },
      timestampMs: baseTime + 360,
    });

    if (!wasDemoMode) {
      this.setStageDemoMode(false);
    }
  }

  public getStats(): EngineStats {
    return { ...this.stats };
  }
}
