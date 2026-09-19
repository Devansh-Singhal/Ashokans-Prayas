import { RawSensorSample, Vector3D } from './types';

export interface SyntheticWaveformOptions {
  startTimestampMs?: number;
  durationMs?: number;
  intervalMs?: number;
  roadNoiseStdDev?: number;
  phoneTiltPitchDeg?: number; // tilt along lateral axis
  phoneTiltRollDeg?: number;  // tilt along longitudinal axis
  jitterMs?: number;
}

/**
 * Deterministic physics simulation generator for testing pothole detection
 * across all vehicle and sensor corner cases.
 */
export class MockSensorStream {
  /**
   * Generates a rotation matrix from pitch and roll angles in degrees.
   */
  public static createOrientationMatrix(pitchDeg: number, rollDeg: number): {
    transform: (v: Vector3D) => Vector3D;
  } {
    const p = (pitchDeg * Math.PI) / 180;
    const r = (rollDeg * Math.PI) / 180;

    const cosP = Math.cos(p);
    const sinP = Math.sin(p);
    const cosR = Math.cos(r);
    const sinR = Math.sin(r);

    return {
      transform: (v: Vector3D): Vector3D => ({
        x: cosR * v.x + sinR * sinP * v.y + sinR * cosP * v.z,
        y: cosP * v.y - sinP * v.z,
        z: -sinR * v.x + cosR * sinP * v.y + cosR * cosP * v.z,
      }),
    };
  }

  /**
   * 1. Baseline smooth/normal road driving.
   */
  public static generateNormalDriving(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 2000;
    const interval = opts?.intervalMs ?? 20;
    const noiseSigma = opts?.roadNoiseStdDev ?? 0.04;
    const orientation = this.createOrientationMatrix(
      opts?.phoneTiltPitchDeg ?? 0,
      opts?.phoneTiltRollDeg ?? 0
    );

    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      const nz = (Math.random() - 0.5) * 2 * noiseSigma;
      const nx = (Math.random() - 0.5) * 2 * (noiseSigma * 0.5);
      const ny = (Math.random() - 0.5) * 2 * (noiseSigma * 0.5);

      const earthAcc: Vector3D = { x: nx, y: ny, z: 1.0 + nz };
      const devAcc = orientation.transform(earthAcc);

      samples.push({
        acceleration: devAcc,
        gyroscope: { x: nx * 0.2, y: ny * 0.2, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 2. Severe Pothole impact:
   * Drop into void (-0.6g, ~40ms) -> sharp collision spike (+2.6g, ~60ms) -> asymmetric roll rotation (0.8 rad/s).
   */
  public static generatePotholeHit(
    opts?: SyntheticWaveformOptions & {
      severity?: 'MINOR' | 'MODERATE' | 'SEVERE';
      impactPeakG?: number;
      dipG?: number;
      asymmetricRollRate?: number;
    }
  ): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1600;
    const interval = opts?.intervalMs ?? 20;
    const orientation = this.createOrientationMatrix(
      opts?.phoneTiltPitchDeg ?? 0,
      opts?.phoneTiltRollDeg ?? 0
    );

    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);
    const hitTimeMs = 400; // impact occurs at 400ms into this snippet

    const peakG = opts?.impactPeakG ?? 2.8;
    const dipG = opts?.dipG ?? -0.65;
    const rollRate = opts?.asymmetricRollRate ?? 0.75;

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let vertDynamic = 0.0;
      let gyroY = 0.0; // roll
      let gyroX = 0.0; // pitch

      const dtFromHit = t - hitTimeMs;

      if (dtFromHit >= 0 && dtFromHit < 40) {
        // Phase 1: Dip / wheel dropping into hole (negative acceleration)
        vertDynamic = dipG * Math.sin((dtFromHit / 40) * Math.PI);
      } else if (dtFromHit >= 40 && dtFromHit <= 110) {
        // Phase 2: Violent upward impact when tire strikes lip
        const impactProg = (dtFromHit - 40) / 70;
        vertDynamic = peakG * Math.sin(impactProg * Math.PI);
        gyroY = rollRate * Math.sin(impactProg * Math.PI);
        gyroX = 0.25 * Math.sin(impactProg * Math.PI);
      } else if (dtFromHit > 110 && dtFromHit < 280) {
        // Phase 3: Damped suspension rebound
        const ringProg = (dtFromHit - 110) / 170;
        vertDynamic = -0.35 * Math.exp(-ringProg * 3.0) * Math.sin(ringProg * Math.PI * 4);
      }

      const noise = (Math.random() - 0.5) * 0.04;
      const earthAcc: Vector3D = { x: noise, y: noise, z: 1.0 + vertDynamic + noise };
      const devAcc = orientation.transform(earthAcc);

      samples.push({
        acceleration: devAcc,
        gyroscope: { x: gyroX, y: gyroY, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 3. Speed Bump:
   * Upward rise first (+1.1g, ~160ms) -> crest drop (-0.4g) -> symmetric pitch with near-zero roll.
   */
  public static generateSpeedBump(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1600;
    const interval = opts?.intervalMs ?? 20;
    const orientation = this.createOrientationMatrix(
      opts?.phoneTiltPitchDeg ?? 0,
      opts?.phoneTiltRollDeg ?? 0
    );

    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);
    const bumpTimeMs = 400;

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let vertDynamic = 0.0;
      let gyroX = 0.0; // pitch

      const dt = t - bumpTimeMs;
      if (dt >= 0 && dt <= 160) {
        vertDynamic = 1.15 * Math.sin((dt / 160) * Math.PI);
        gyroX = 0.45 * Math.sin((dt / 160) * Math.PI);
      } else if (dt > 160 && dt <= 280) {
        vertDynamic = -0.45 * Math.sin(((dt - 160) / 120) * Math.PI);
        gyroX = -0.35 * Math.sin(((dt - 160) / 120) * Math.PI);
      }

      const earthAcc: Vector3D = { x: 0, y: 0, z: 1.0 + vertDynamic };
      const devAcc = orientation.transform(earthAcc);

      samples.push({
        acceleration: devAcc,
        gyroscope: { x: gyroX, y: 0.01, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 4. Phone Handling / Picking Up:
   */
  public static generatePhoneHandling(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1600;
    const interval = opts?.intervalMs ?? 20;
    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let gx = 0, gy = 0, gz = 0;
      let ax = 0, ay = 0, az = 1.0;

      if (t >= 300 && t <= 800) {
        const prog = (t - 300) / 500;
        gx = 2.4 * Math.sin(prog * Math.PI);
        gy = 1.9 * Math.cos(prog * Math.PI);
        gz = 1.2 * Math.sin(prog * 2 * Math.PI);

        ax = 0.6 * Math.sin(prog * Math.PI);
        ay = 0.7 * Math.cos(prog * Math.PI);
        az = 0.4;
      }

      samples.push({
        acceleration: { x: ax, y: ay, z: az },
        gyroscope: { x: gx, y: gy, z: gz },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 5. Hard Emergency Braking:
   */
  public static generateHardBraking(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1800;
    const interval = opts?.intervalMs ?? 20;
    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let ay = 0.0;
      let pitchRate = 0.0;

      if (t >= 400 && t <= 1000) {
        ay = -0.65;
        pitchRate = -0.15;
      }

      samples.push({
        acceleration: { x: 0, y: ay, z: 1.0 },
        gyroscope: { x: pitchRate, y: 0, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 6. High-Speed Cornering / Roundabout:
   */
  public static generateAggressiveCornering(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1800;
    const interval = opts?.intervalMs ?? 20;
    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let ax = 0.0;
      let rollRate = 0.0;

      if (t >= 400 && t <= 1100) {
        ax = 0.52;
        rollRate = 0.12;
      }

      samples.push({
        acceleration: { x: ax, y: 0, z: 1.0 },
        gyroscope: { x: 0, y: rollRate, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 7. Rumble Strips / Corrugated Pavement:
   */
  public static generateRumbleStrips(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1600;
    const interval = opts?.intervalMs ?? 20;
    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let vert = 0.0;

      if (t >= 400 && t <= 850) {
        // 16 Hz oscillation (realistic rumble strip / corrugated washboard frequency)
        vert = 0.95 * Math.sin(2 * Math.PI * 16 * ((t - 400) / 1000) + 0.4);
      }

      samples.push({
        acceleration: { x: 0, y: 0, z: 1.0 + vert },
        gyroscope: { x: 0, y: 0, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 8. Double-Axle Pothole:
   */
  public static generateDoubleAxlePothole(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 2000;
    const interval = opts?.intervalMs ?? 20;
    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    const hit1 = 400;
    const hit2 = 640; // 240ms gap

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let vert = 0.0;
      let roll = 0.0;

      // Axle 1
      if (t >= hit1 && t < hit1 + 35) {
        vert = -0.55 * Math.sin(((t - hit1) / 35) * Math.PI);
      } else if (t >= hit1 + 35 && t <= hit1 + 95) {
        vert = 2.4 * Math.sin(((t - (hit1 + 35)) / 60) * Math.PI);
        roll = 0.65;
      }

      // Axle 2
      if (t >= hit2 && t < hit2 + 35) {
        vert = -0.45 * Math.sin(((t - hit2) / 35) * Math.PI);
      } else if (t >= hit2 + 35 && t <= hit2 + 95) {
        vert = 2.2 * Math.sin(((t - (hit2 + 35)) / 60) * Math.PI);
        roll = 0.55;
      }

      samples.push({
        acceleration: { x: 0, y: 0, z: 1.0 + vert },
        gyroscope: { x: 0, y: roll, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }

  /**
   * 9. Saturated / Clipped Impact:
   */
  public static generateSaturatedImpact(opts?: SyntheticWaveformOptions): RawSensorSample[] {
    const start = opts?.startTimestampMs ?? 0;
    const duration = opts?.durationMs ?? 1600;
    const interval = opts?.intervalMs ?? 20;
    const samples: RawSensorSample[] = [];
    const count = Math.floor(duration / interval);

    const hitTime = 400;

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      let vert = 0.0;

      if (t >= hitTime && t < hitTime + 30) {
        vert = -0.7;
      } else if (t >= hitTime + 30 && t <= hitTime + 110) {
        vert = 3.90;
      }

      samples.push({
        acceleration: { x: 0, y: 0, z: Math.min(3.90, 1.0 + vert) },
        gyroscope: { x: 0.3, y: 0.8, z: 0 },
        timestampMs: start + t,
      });
    }

    return samples;
  }
}
