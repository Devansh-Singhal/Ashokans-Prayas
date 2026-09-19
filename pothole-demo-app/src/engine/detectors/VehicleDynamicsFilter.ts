export interface VehicleDynamicsStatus {
  /**
   * True if pothole detection should be suppressed due to vehicle state.
   */
  isSuppressed: boolean;
  /**
   * Reason for suppression if suppressed.
   */
  suppressionReason?: 'STATIONARY_VEHICLE' | 'LOW_SPEED_CRAWL' | 'HARD_BRAKING_OR_ACCELERATION' | 'AGGRESSIVE_CORNERING';
  /**
   * Filtered horizontal acceleration in g.
   */
  sustainedHorizontalG: number;
  /**
   * Estimated or reported speed in km/h.
   */
  currentSpeedKmph?: number;
}

/**
 * Filters out vehicle maneuvers (braking, accelerating, cornering)
 * and stationary states (traffic lights, parking, crawling in jams).
 */
export class VehicleDynamicsFilter {
  private minSpeedKmph: number;
  private sustainedHorizontalStartTimeMs: number | null = null;
  private recentHorizontalG: number[] = [];
  private externalSpeedKmph: number | null = null;
  private lastSpeedUpdateMs = 0;

  // Threshold for sustained lateral/longitudinal force (braking/turning)
  private readonly sustainedHorizontalThresholdG = 0.40;
  // Maneuver must persist for > 280ms to be classified as braking/turning (potholes last < 120ms)
  private readonly sustainedDurationMs = 280;

  constructor(minSpeedKmph = 12) {
    this.minSpeedKmph = minSpeedKmph;
  }

  public reset(): void {
    this.sustainedHorizontalStartTimeMs = null;
    this.recentHorizontalG = [];
    this.externalSpeedKmph = null;
    this.lastSpeedUpdateMs = 0;
  }

  /**
   * Updates external GPS vehicle speed.
   */
  public updateSpeed(speedKmph: number, timestampMs: number): void {
    this.externalSpeedKmph = speedKmph;
    this.lastSpeedUpdateMs = timestampMs;
  }

  /**
   * Evaluates vehicle dynamics at the current sample.
   *
   * @param horizontalG Horizontal acceleration in g (magnitude in ground plane).
   * @param verticalG Vertical acceleration in g.
   * @param timestampMs Current timestamp in ms.
   */
  public evaluate(horizontalG: number, verticalG: number, timestampMs: number): VehicleDynamicsStatus {
    // 1. External GPS speed check (if speed updated within the last 5 seconds)
    const isSpeedFresh = (timestampMs - this.lastSpeedUpdateMs) < 5000;
    if (this.externalSpeedKmph !== null && isSpeedFresh) {
      if (this.externalSpeedKmph <= 2.0) {
        return {
          isSuppressed: true,
          suppressionReason: 'STATIONARY_VEHICLE',
          sustainedHorizontalG: horizontalG,
          currentSpeedKmph: this.externalSpeedKmph,
        };
      }

      if (this.externalSpeedKmph < this.minSpeedKmph) {
        return {
          isSuppressed: true,
          suppressionReason: 'LOW_SPEED_CRAWL',
          sustainedHorizontalG: horizontalG,
          currentSpeedKmph: this.externalSpeedKmph,
        };
      }
    }

    // 2. Track moving average of horizontal force
    this.recentHorizontalG.push(horizontalG);
    if (this.recentHorizontalG.length > 20) {
      this.recentHorizontalG.shift();
    }
    const avgHorizontalG = this.recentHorizontalG.reduce((a, b) => a + b, 0) / this.recentHorizontalG.length;

    // 3. Autonomous stationary detection (when GPS speed is unavailable):
    // If vehicle has negligible horizontal acceleration (< 0.04g) and near-zero vertical variation
    // across the last 20 samples (~400ms), car is stopped at a traffic light or parked.
    if (this.externalSpeedKmph === null || !isSpeedFresh) {
      if (avgHorizontalG < 0.035 && Math.abs(verticalG) < 0.06) {
        // Vehicle is stationary/idling
        return {
          isSuppressed: true,
          suppressionReason: 'STATIONARY_VEHICLE',
          sustainedHorizontalG: avgHorizontalG,
        };
      }
    }

    // 4. Sustained Horizontal Force Evaluation (Hard Braking or High-G Cornering)
    if (horizontalG > this.sustainedHorizontalThresholdG) {
      if (this.sustainedHorizontalStartTimeMs === null) {
        this.sustainedHorizontalStartTimeMs = timestampMs;
      }

      const elapsed = timestampMs - this.sustainedHorizontalStartTimeMs;
      if (elapsed >= this.sustainedDurationMs) {
        // Continuous lateral/longitudinal acceleration indicates a driving maneuver rather than road crater
        return {
          isSuppressed: true,
          suppressionReason: 'HARD_BRAKING_OR_ACCELERATION',
          sustainedHorizontalG: horizontalG,
          currentSpeedKmph: this.externalSpeedKmph ?? undefined,
        };
      }
    } else {
      this.sustainedHorizontalStartTimeMs = null;
    }

    return {
      isSuppressed: false,
      sustainedHorizontalG: avgHorizontalG,
      currentSpeedKmph: this.externalSpeedKmph ?? undefined,
    };
  }
}
