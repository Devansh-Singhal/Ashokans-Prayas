import { Vector3D } from '../types';

export interface HandlingStatus {
  /**
   * True if phone is currently being handled, picked up, rotated, or dropped.
   */
  isHandlingSuppressed: boolean;
  /**
   * Angular rate norm ||ω|| in rad/s.
   */
  angularRateNorm: number;
  /**
   * Reason for suppression if suppressed.
   */
  reason?: 'HIGH_ROTATION_RATE' | 'SUSTAINED_MANIPULATION' | 'REORIENTATION_SLIP' | 'POST_HANDLING_COOLDOWN';
}

/**
 * Rejects false positives caused by user interaction:
 * - Picking up the phone from a mount or console
 * - Typing or tapping on the screen while driving
 * - Dropping the phone into a cupholder or floor
 * - Phone sliding or tilting in its mount
 */
export class PhoneHandlingDetector {
  private isSuppressed = false;
  private suppressionReleaseTimeMs = 0;
  private sustainedRotationStartTimeMs: number | null = null;

  private readonly angularRateThreshold: number; // e.g. 1.8 rad/s
  private readonly sustainedDurationMs: number;  // e.g. 200ms
  private readonly cooldownMs: number;           // e.g. 650ms

  constructor(
    angularRateThreshold = 1.8,
    sustainedDurationMs = 200,
    cooldownMs = 650
  ) {
    this.angularRateThreshold = angularRateThreshold;
    this.sustainedDurationMs = sustainedDurationMs;
    this.cooldownMs = cooldownMs;
  }

  public reset(): void {
    this.isSuppressed = false;
    this.suppressionReleaseTimeMs = 0;
    this.sustainedRotationStartTimeMs = null;
  }

  /**
   * Evaluates gyro reading and reorientation status.
   *
   * @param gyro Angular velocity vector in rad/s (optional if gyro unavailable).
   * @param isReorienting Flag from CoordinateTransformer indicating gravity shift.
   * @param timestampMs Sample timestamp in ms.
   */
  public evaluate(gyro: Vector3D | undefined, isReorienting: boolean, timestampMs: number): HandlingStatus {
    const angularRateNorm = gyro
      ? Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z)
      : 0.0;

    // Check 1: Dynamic reorientation slip from gravity tracking
    if (isReorienting) {
      this.triggerSuppression(timestampMs, this.cooldownMs);
      return {
        isHandlingSuppressed: true,
        angularRateNorm,
        reason: 'REORIENTATION_SLIP',
      };
    }

    // Check 2: Gyroscope angular rate evaluation
    if (gyro) {
      if (angularRateNorm > this.angularRateThreshold) {
        if (this.sustainedRotationStartTimeMs === null) {
          this.sustainedRotationStartTimeMs = timestampMs;
        }

        const duration = timestampMs - this.sustainedRotationStartTimeMs;
        // Sustained human hand rotation
        if (duration >= this.sustainedDurationMs) {
          this.triggerSuppression(timestampMs, this.cooldownMs);
          return {
            isHandlingSuppressed: true,
            angularRateNorm,
            reason: 'SUSTAINED_MANIPULATION',
          };
        }

        // Violent instantaneous tumble (e.g. phone fell off dashboard)
        if (angularRateNorm > this.angularRateThreshold * 2.2) {
          this.triggerSuppression(timestampMs, this.cooldownMs * 1.5);
          return {
            isHandlingSuppressed: true,
            angularRateNorm,
            reason: 'HIGH_ROTATION_RATE',
          };
        }
      } else {
        // Rotation dropped below threshold
        this.sustainedRotationStartTimeMs = null;
      }
    }

    // Check 3: Active cooldown
    if (this.isSuppressed) {
      if (timestampMs < this.suppressionReleaseTimeMs) {
        return {
          isHandlingSuppressed: true,
          angularRateNorm,
          reason: 'POST_HANDLING_COOLDOWN',
        };
      } else {
        // Cooldown period expired, re-arm detector
        this.isSuppressed = false;
      }
    }

    return {
      isHandlingSuppressed: false,
      angularRateNorm,
    };
  }

  private triggerSuppression(timestampMs: number, cooldownMs: number): void {
    this.isSuppressed = true;
    this.suppressionReleaseTimeMs = Math.max(this.suppressionReleaseTimeMs, timestampMs + cooldownMs);
  }
}
