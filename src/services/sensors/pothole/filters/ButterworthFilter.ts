/**
 * 2nd-Order Discrete Butterworth High-Pass and Low-Pass filters for real-time shock signal isolation.
 *
 * Implements the standard digital biquad IIR difference equation:
 * y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
 */

export class BiquadFilter {
  // Filter coefficients normalized by a0
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;

  // Delay state registers
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  public reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }

  /**
   * Configures 2nd-order Butterworth High-Pass filter.
   * Eliminates DC offset, constant gravity drift, and low-frequency vehicle maneuvers (< 2.5 Hz).
   *
   * @param sampleRateHz Sampling frequency (e.g. 50 Hz).
   * @param cutoffHz High-pass cutoff frequency (e.g. 2.5 Hz).
   */
  public setHighPass(sampleRateHz: number, cutoffHz: number): void {
    const safeFs = Math.max(10, sampleRateHz);
    const safeFc = Math.min(cutoffHz, safeFs * 0.45);
    const omega = 2 * Math.PI * safeFc / safeFs;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * Math.SQRT2); // Q = 1/sqrt(2) for Butterworth maximally flat

    const a0 = 1 + alpha;
    this.b0 = ((1 + cosOmega) / 2) / a0;
    this.b1 = (-(1 + cosOmega)) / a0;
    this.b2 = ((1 + cosOmega) / 2) / a0;
    this.a1 = (-2 * cosOmega) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  /**
   * Configures 2nd-order Butterworth Low-Pass filter.
   * Eliminates high-frequency engine buzz and acoustic vibrations (> 25 Hz).
   *
   * @param sampleRateHz Sampling frequency (e.g. 50 Hz).
   * @param cutoffHz Low-pass cutoff frequency (e.g. 25 Hz).
   */
  public setLowPass(sampleRateHz: number, cutoffHz: number): void {
    const safeFs = Math.max(10, sampleRateHz);
    const safeFc = Math.min(cutoffHz, safeFs * 0.45);
    const omega = 2 * Math.PI * safeFc / safeFs;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * Math.SQRT2);

    const a0 = 1 + alpha;
    this.b0 = ((1 - cosOmega) / 2) / a0;
    this.b1 = (1 - cosOmega) / a0;
    this.b2 = ((1 - cosOmega) / 2) / a0;
    this.a1 = (-2 * cosOmega) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  /**
   * Processes a single input sample through the biquad filter.
   */
  public process(x: number): number {
    // If input is non-finite (NaN or Infinity), reset and return 0
    if (!Number.isFinite(x)) {
      this.reset();
      return 0;
    }

    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;

    // Numerical safeguard against runaway oscillation or denormals
    if (!Number.isFinite(y) || Math.abs(y) > 100.0) {
      this.reset();
      return x;
    }

    // Shift state delay registers
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;

    return y;
  }
}

/**
 * Cascaded Butterworth Bandpass Filter (High-Pass + Low-Pass in series).
 * Isolates transient road impact impulses (2.5 Hz to 24 Hz).
 */
export class BandpassFilter {
  private hpFilter: BiquadFilter;
  private lpFilter: BiquadFilter;
  private sampleRateHz: number;
  private lowCutoffHz: number;
  private highCutoffHz: number;

  constructor(sampleRateHz: number = 50, lowCutoffHz: number = 2.5, highCutoffHz: number = 24.0) {
    this.sampleRateHz = sampleRateHz;
    this.lowCutoffHz = lowCutoffHz;
    this.highCutoffHz = highCutoffHz;
    this.hpFilter = new BiquadFilter();
    this.lpFilter = new BiquadFilter();
    this.reconfigure();
  }

  public reset(): void {
    this.hpFilter.reset();
    this.lpFilter.reset();
  }

  public reconfigure(sampleRateHz?: number, lowCutoffHz?: number, highCutoffHz?: number): void {
    if (sampleRateHz) this.sampleRateHz = sampleRateHz;
    if (lowCutoffHz) this.lowCutoffHz = lowCutoffHz;
    if (highCutoffHz) this.highCutoffHz = highCutoffHz;

    this.hpFilter.setHighPass(this.sampleRateHz, this.lowCutoffHz);
    this.lpFilter.setLowPass(this.sampleRateHz, this.highCutoffHz);
  }

  /**
   * Filters input sample, returning isolated impulse signal.
   */
  public filter(sample: number): number {
    const hpOut = this.hpFilter.process(sample);
    return this.lpFilter.process(hpOut);
  }
}
