import { Vector3D } from '../types';

export interface CoordinateTransformResult {
  /**
   * Unit gravity vector pointing downward in phone local frame.
   */
  gravityUnitVector: Vector3D;
  /**
   * Magnitude of estimated gravity in g (typically ~1.0g).
   */
  gravityMagnitude: number;
  /**
   * Dynamic vertical acceleration along Earth's gravitational axis with static 1g subtracted.
   * Positive = upward acceleration, Negative = downward drop/dip.
   */
  verticalAcceleration: number;
  /**
   * Dynamic horizontal acceleration in Earth's horizontal ground plane.
   */
  horizontalAcceleration: number;
  /**
   * Tilt angle of the phone screen relative to horizontal flat ground in degrees (0° = flat, 90° = vertical upright).
   */
  tiltAngleDeg: number;
  /**
   * Flag indicating whether the phone is currently undergoing physical reorientation (slipping in cradle or picked up).
   */
  isReorienting: boolean;
}

/**
 * Real-time dynamic coordinate system transformer.
 * Decouples device orientation from vehicle motion by continuously tracking Earth's gravity vector.
 */
export class CoordinateTransformer {
  private gravity: Vector3D = { x: 0, y: 0, z: 1.0 }; // Initial prior assuming phone lying flat
  private isInitialized = false;
  private lastTimestampMs = 0;
  private recentAngleDeltas: number[] = [];
  private readonly tauSeconds: number;

  constructor(tauSeconds: number = 1.8) {
    this.tauSeconds = tauSeconds;
  }

  /**
   * Resets the transformer state (e.g. on engine start or when app is resumed).
   */
  public reset(): void {
    this.gravity = { x: 0, y: 0, z: 1.0 };
    this.isInitialized = false;
    this.lastTimestampMs = 0;
    this.recentAngleDeltas = [];
  }

  /**
   * Updates gravity estimate with new raw acceleration sample and projects it into Earth frame.
   *
   * @param rawAcc Raw acceleration in g-force [x, y, z].
   * @param timestampMs Sample timestamp in milliseconds.
   */
  public transform(rawAcc: Vector3D, timestampMs: number): CoordinateTransformResult {
    if (!this.isInitialized) {
      // First sample initializes gravity directly
      const norm = this.norm(rawAcc);
      if (norm > 0.1 && norm < 2.5) {
        this.gravity = { ...rawAcc };
      }
      this.isInitialized = true;
      this.lastTimestampMs = timestampMs;
    }

    // Calculate delta time in seconds, clamped between 1ms and 200ms to prevent jitter/glitches
    const dtSeconds = this.lastTimestampMs > 0
      ? Math.max(0.001, Math.min(0.2, (timestampMs - this.lastTimestampMs) / 1000.0))
      : 0.02;
    this.lastTimestampMs = timestampMs;

    // Exponential moving average low-pass filter: alpha = dt / (tau + dt)
    // Low-pass filter isolates the constant ~1.0g gravity vector from high-frequency road vibrations
    const alpha = dtSeconds / (this.tauSeconds + dtSeconds);

    const prevGravity = { ...this.gravity };
    this.gravity = {
      x: (1 - alpha) * this.gravity.x + alpha * rawAcc.x,
      y: (1 - alpha) * this.gravity.y + alpha * rawAcc.y,
      z: (1 - alpha) * this.gravity.z + alpha * rawAcc.z,
    };

    const gMag = this.norm(this.gravity);
    // Safe normalization with fallback to z-axis if gMag collapses
    const gUnit: Vector3D = gMag > 1e-4
      ? { x: this.gravity.x / gMag, y: this.gravity.y / gMag, z: this.gravity.z / gMag }
      : { x: 0, y: 0, z: 1.0 };

    // Check angle shift between previous gravity vector and current gravity vector
    const dotUnits = this.dot(gUnit, this.unit(prevGravity));
    const angleDeltaRad = Math.acos(Math.max(-1.0, Math.min(1.0, dotUnits)));
    const angleDeltaDeg = (angleDeltaRad * 180.0) / Math.PI;

    // Track angle shifts over a sliding window to detect reorientation slips
    this.recentAngleDeltas.push(angleDeltaDeg);
    if (this.recentAngleDeltas.length > 15) {
      this.recentAngleDeltas.shift();
    }
    const cumulativeAngleShift = this.recentAngleDeltas.reduce((sum, d) => sum + d, 0);
    // If the phone shifted more than 8 degrees over the last ~15 samples, it is actively reorienting
    const isReorienting = cumulativeAngleShift > 8.0;

    // Project raw acceleration onto Earth vertical unit vector:
    // a_vert_raw = rawAcc • gUnit
    const aVertRaw = this.dot(rawAcc, gUnit);

    // True dynamic vertical acceleration removes the 1.0g static gravitational force
    // (gMag is normally ~1.0g)
    const verticalAcceleration = aVertRaw - gMag;

    // In-plane horizontal dynamic acceleration:
    // By Pythagoras: ||a_horiz|| = sqrt(max(0, ||rawAcc||^2 - aVertRaw^2))
    const totalRawMagSq = rawAcc.x * rawAcc.x + rawAcc.y * rawAcc.y + rawAcc.z * rawAcc.z;
    const horizontalAcceleration = Math.sqrt(Math.max(0, totalRawMagSq - aVertRaw * aVertRaw));

    // Tilt angle of the phone chassis relative to flat horizontal ground:
    // When phone is flat, gUnit is [0, 0, 1] -> tilt = 0°.
    // When phone is upright portrait, gUnit is [0, 1, 0] or similar -> tilt = 90°.
    const zComponent = Math.abs(gUnit.z);
    const tiltAngleDeg = (Math.acos(Math.max(0.0, Math.min(1.0, zComponent))) * 180.0) / Math.PI;

    return {
      gravityUnitVector: gUnit,
      gravityMagnitude: gMag,
      verticalAcceleration,
      horizontalAcceleration,
      tiltAngleDeg,
      isReorienting,
    };
  }

  private norm(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  private dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private unit(v: Vector3D): Vector3D {
    const m = this.norm(v);
    return m > 1e-4 ? { x: v.x / m, y: v.y / m, z: v.z / m } : { x: 0, y: 0, z: 1.0 };
  }
}
