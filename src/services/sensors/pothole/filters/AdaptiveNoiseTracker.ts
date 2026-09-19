/**
 * Adaptive Road Noise Floor Tracker using exponential moving Welford statistics.
 *
 * Dynamically estimates the ambient vibration mean and standard deviation of the vehicle
 * suspension on the current road surface without being distorted by large transient impacts.
 */
export class AdaptiveNoiseTracker {
  private mean = 0.0;
  private variance = 0.01; // initial standard deviation ~0.10g
  private sampleCount = 0;
  private isFrozen = false;
  private freezeUntilMs = 0;

  // Minimum noise floor to avoid divide-by-zero on perfectly still bench tests
  private readonly minNoiseFloorG = 0.04;
  // Maximum noise floor to prevent noise baseline from becoming excessively desensitized
  private readonly maxNoiseFloorG = 0.60;
  // Exponential smoothing factor for moving baseline (alpha ~ 0.02 = approx 50-sample / 1s memory)
  private readonly alpha = 0.02;

  public reset(): void {
    this.mean = 0.0;
    this.variance = 0.01;
    this.sampleCount = 0;
    this.isFrozen = false;
    this.freezeUntilMs = 0;
  }

  /**
   * Temporarily freezes updates during an anomaly or phone handling event
   * so shock peaks do not corrupt the road baseline.
   */
  public freeze(durationMs: number, currentTimestampMs: number): void {
    this.isFrozen = true;
    this.freezeUntilMs = Math.max(this.freezeUntilMs, currentTimestampMs + durationMs);
  }

  /**
   * Updates baseline statistics with a new vertical acceleration sample.
   *
   * @param sample Filtered vertical acceleration in g.
   * @param timestampMs Current timestamp in ms.
   * @returns Current dynamic Z-score.
   */
  public update(sample: number, timestampMs: number): { zScore: number; stdDev: number } {
    if (this.isFrozen && timestampMs >= this.freezeUntilMs) {
      this.isFrozen = false;
    }

    const currentStdDev = this.getStdDev();
    const diff = sample - this.mean;
    const zScore = Math.abs(diff) / currentStdDev;

    // Only update baseline if NOT frozen and NOT currently a massive outlier (|zScore| < 3.0)
    if (!this.isFrozen && (this.sampleCount < 30 || zScore < 3.0)) {
      this.sampleCount++;

      // Exponential moving update of mean
      const delta = sample - this.mean;
      this.mean += this.alpha * delta;

      // Exponential moving update of variance
      const delta2 = sample - this.mean;
      const sampleVar = delta * delta2;
      this.variance = (1 - this.alpha) * this.variance + this.alpha * sampleVar;

      // Clamp variance within reasonable road noise bounds
      const minVar = this.minNoiseFloorG * this.minNoiseFloorG;
      const maxVar = this.maxNoiseFloorG * this.maxNoiseFloorG;
      this.variance = Math.max(minVar, Math.min(maxVar, this.variance));
    }

    return {
      zScore,
      stdDev: this.getStdDev(),
    };
  }

  /**
   * Returns current estimated standard deviation of ambient road vibration (g).
   */
  public getStdDev(): number {
    const sigma = Math.sqrt(this.variance);
    return Math.max(this.minNoiseFloorG, Math.min(this.maxNoiseFloorG, sigma));
  }

  public getMean(): number {
    return this.mean;
  }
}
