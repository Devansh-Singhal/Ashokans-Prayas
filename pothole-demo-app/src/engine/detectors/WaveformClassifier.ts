import {
  AnomalyClassification,
  CandidateWindowAnalysis,
  PotholeSeverity,
  TransformedSample,
} from '../types';

export interface ClassifierConfig {
  minCandidateDeltaG: number;
  severityThresholds: {
    moderate: number;
    severe: number;
    critical: number;
  };
  sensorSaturationLimitG: number;
}

/**
 * Detailed waveform morphology analyzer.
 * Evaluates transient impulse window to distinguish potholes from speed bumps,
 * rumble strips, expansion joints, and road noise.
 */
export class WaveformClassifier {
  private config: ClassifierConfig;

  constructor(config: ClassifierConfig) {
    this.config = config;
  }

  /**
   * Analyzes a candidate snapshot window around a detected acceleration anomaly.
   *
   * @param window Buffer of TransformedSample (pre-trigger and post-trigger).
   * @param triggerIndex Index within window that initially triggered the candidate alert.
   */
  public analyzeWindow(window: TransformedSample[], triggerIndex: number): CandidateWindowAnalysis {
    if (window.length < 5) {
      return this.buildRejectedResult('WINDOW_TOO_SHORT');
    }

    // 1. Calculate Peak (max positive) and Dip (min negative) vertical accelerations
    let maxG = -Infinity;
    let minG = Infinity;
    let maxIndex = -1;
    let minIndex = -1;
    let zeroCrossings = 0;
    // 0.22g deadband to avoid low-amplitude baseline noise triggering false zero crossings
    const HYSTERESIS_THRESHOLD = 0.22;
    let prevSignificantSign = 0;

    let rollEnergy = 0.0;
    let pitchEnergy = 0.0;
    let isSaturated = false;

    let maxRawG = -Infinity;
    let minRawG = Infinity;
    let maxRawIndex = -1;
    let minRawIndex = -1;

    for (let i = 0; i < window.length; i++) {
      const s = window[i];
      const vert = s.filteredVertical;
      const rawVert = s.verticalAcceleration;

      if (vert > maxG) {
        maxG = vert;
        maxIndex = i;
      }
      if (vert < minG) {
        minG = vert;
        minIndex = i;
      }

      if (rawVert > maxRawG) {
        maxRawG = rawVert;
        maxRawIndex = i;
      }
      if (rawVert < minRawG) {
        minRawG = rawVert;
        minRawIndex = i;
      }

      // Check sensor saturation/clipping (values approaching hardware IMU ceiling)
      if (Math.abs(s.verticalAcceleration) >= this.config.sensorSaturationLimitG * 0.96) {
        isSaturated = true;
      }

      // Hysteresis-based zero-crossing density tracking:
      // Only transitions between significantly positive (> +0.22g) and significantly negative (< -0.22g) count
      if (vert > HYSTERESIS_THRESHOLD) {
        if (prevSignificantSign === -1) {
          zeroCrossings++;
        }
        prevSignificantSign = 1;
      } else if (vert < -HYSTERESIS_THRESHOLD) {
        if (prevSignificantSign === 1) {
          zeroCrossings++;
        }
        prevSignificantSign = -1;
      }

      // Rotational energy tracking if gyroscope is present
      if (s.raw.gyroscope) {
        const wx = s.raw.gyroscope.x;
        const wy = s.raw.gyroscope.y;
        pitchEnergy += wx * wx;
        rollEnergy += wy * wy;
      }
    }

    const deltaG = maxG - minG;
    const dipPrecededPeak = minIndex < maxIndex;

    // Time difference between dip and peak in milliseconds
    const timeDipMs = window[minIndex]?.timestampMs ?? 0;
    const timePeakMs = window[maxIndex]?.timestampMs ?? 0;
    const durationMs = Math.abs(timePeakMs - timeDipMs);

    // Asymmetry ratio: roll energy vs pitch energy
    // Potholes hitting one wheel produce noticeable asymmetric roll sway
    const asymmetryRatio = rollEnergy / (pitchEnergy + 1e-4);

    // 2. Check minimum delta G threshold
    if (deltaG < this.config.minCandidateDeltaG) {
      return this.buildRejectedResult('DELTA_G_BELOW_MINIMUM', deltaG, maxG, minG);
    }

    // 3. Rumble Strip / Corrugated Road Filter:
    // Sustained high zero-crossing count indicates periodic rumble strip grooves
    if (zeroCrossings >= 5) {
      return {
        classification: 'ROUGH_ROAD_RUMBLE',
        confidence: 0.88,
        severity: 'MINOR',
        peakG: maxG,
        dipG: minG,
        deltaG,
        durationMs,
        dipPrecededPeak,
        zeroCrossingRate: zeroCrossings,
        rollEnergy,
        pitchEnergy,
        asymmetryRatio,
        rejectionReason: 'HIGH_ZERO_CROSSINGS_RUMBLE_STRIP',
      };
    }

    // 4. Speed Bump / Hump Classification:
    // Speed bumps push vehicle UPWARD first (maxRawIndex < minRawIndex in un-differentiated frame),
    // have longer rise duration, and pitch both wheels symmetrically (near-zero roll asymmetry).
    const isRawUpwardFirst = maxRawIndex < minRawIndex && maxRawG > 0.50;
    const isSymmetricAxlePitch = asymmetryRatio < 0.20 && pitchEnergy > 0.06;
    const isSpeedBumpShape = (!dipPrecededPeak || isRawUpwardFirst) && maxG > 0.50;

    if (isSymmetricAxlePitch || (isRawUpwardFirst && (durationMs > 90 || isSpeedBumpShape))) {
      return {
        classification: 'SPEED_BUMP',
        confidence: 0.88,
        severity: 'MODERATE',
        peakG: maxG,
        dipG: minG,
        deltaG,
        durationMs,
        dipPrecededPeak: false,
        zeroCrossingRate: zeroCrossings,
        rollEnergy,
        pitchEnergy,
        asymmetryRatio,
        rejectionReason: isSymmetricAxlePitch
          ? 'SYMMETRIC_AXLE_PITCH_SPEED_BUMP'
          : 'UPWARD_RISE_PRECEDED_DIP_SPEED_BUMP',
      };
    }

    // 5. Shallow Expansion Joint / Metallic Bridge Seam:
    // Very rapid (< 35ms) micro-tick with minimal downward drop (|minG| < 0.22g)
    if (durationMs < 35 && Math.abs(minG) < 0.22 && deltaG < 1.4) {
      return {
        classification: 'EXPANSION_JOINT',
        confidence: 0.80,
        severity: 'MINOR',
        peakG: maxG,
        dipG: minG,
        deltaG,
        durationMs,
        dipPrecededPeak,
        zeroCrossingRate: zeroCrossings,
        rollEnergy,
        pitchEnergy,
        asymmetryRatio,
        rejectionReason: 'SHALLOW_MICRO_CLICK_EXPANSION_JOINT',
      };
    }

    // 6. Genuine Pothole Verification:
    // Pothole dynamics: wheel drops into crater (dipG negative) then violently strikes lip (maxG positive).
    // Or if sensor saturated on violent collision, it's an immediate critical pothole.
    let confidence = 0.70;

    // Strong indicator 1: Dip preceded peak
    if (dipPrecededPeak) {
      confidence += 0.15;
    }

    // Strong indicator 2: Significant downward drop into hole
    if (minG < -0.35) {
      confidence += 0.10;
    }

    // Strong indicator 3: Asymmetric roll rotation (single tire entered hole)
    if (asymmetryRatio > 0.40 || rollEnergy > 0.08) {
      confidence += 0.05;
    }

    // Sensor saturation gives top confidence for severe road crater
    if (isSaturated) {
      confidence = 0.99;
    }

    confidence = Math.min(0.99, Math.max(0.50, confidence));

    // Severity assessment based on delta G or saturation
    let severity: PotholeSeverity = 'MINOR';
    if (isSaturated || deltaG >= this.config.severityThresholds.critical) {
      severity = 'CRITICAL';
    } else if (deltaG >= this.config.severityThresholds.severe) {
      severity = 'SEVERE';
    } else if (deltaG >= this.config.severityThresholds.moderate) {
      severity = 'MODERATE';
    }

    return {
      classification: 'POTHOLE',
      confidence,
      severity,
      peakG: maxG,
      dipG: minG,
      deltaG,
      durationMs,
      dipPrecededPeak,
      zeroCrossingRate: zeroCrossings,
      rollEnergy,
      pitchEnergy,
      asymmetryRatio,
    };
  }

  private buildRejectedResult(
    reason: string,
    deltaG = 0,
    peakG = 0,
    dipG = 0
  ): CandidateWindowAnalysis {
    return {
      classification: 'NORMAL_DRIVING',
      confidence: 0,
      severity: 'MINOR',
      peakG,
      dipG,
      deltaG,
      durationMs: 0,
      dipPrecededPeak: false,
      zeroCrossingRate: 0,
      rollEnergy: 0,
      pitchEnergy: 0,
      asymmetryRatio: 0,
      rejectionReason: reason,
    };
  }
}
