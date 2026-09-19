import { PotholeDetectionEngine } from './PotholeDetectionEngine';
import { RawSensorSample, Vector3D } from './types';

export interface SensorAdapterStatus {
  isRunning: boolean;
  isAccelerometerAvailable: boolean;
  isGyroscopeAvailable: boolean;
  isAccelerometerOnlyFallback: boolean;
  samplingIntervalMs: number;
  errorMessage?: string;
}

export interface EventSubscription {
  remove(): void;
}

/**
 * Expo SDK 57 compliant sensor adapter.
 * Connects device accelerometer and gyroscope hardware streams to PotholeDetectionEngine.
 *
 * Implements graceful degradation: if gyroscope hardware is absent, runs in accelerometer-only mode.
 */
export class ExpoSensorAdapter {
  private engine: PotholeDetectionEngine;
  private isRunning = false;
  private samplingIntervalMs: number;

  private isAccelAvailable = false;
  private isGyroAvailable = false;

  private accelSubscription: EventSubscription | null = null;
  private gyroSubscription: EventSubscription | null = null;

  // Cached latest gyroscope reading to fuse with accelerometer measurement
  private latestGyro: Vector3D | undefined = undefined;
  private latestGyroTimestampMs = 0;

  constructor(engine: PotholeDetectionEngine, samplingIntervalMs = 20) {
    this.engine = engine;
    this.samplingIntervalMs = samplingIntervalMs;
  }

  /**
   * Initializes sensor hardware, requests permissions, and starts streaming.
   */
  public async start(): Promise<SensorAdapterStatus> {
    if (this.isRunning) {
      return this.getStatus();
    }

    try {
      // Dynamic import of expo-sensors for runtime flexibility and testing
      // Compliant with Expo SDK 57 expo-sensors API
      const sensors = await this.loadExpoSensors();
      if (!sensors) {
        return {
          isRunning: false,
          isAccelerometerAvailable: false,
          isGyroscopeAvailable: false,
          isAccelerometerOnlyFallback: false,
          samplingIntervalMs: this.samplingIntervalMs,
          errorMessage: 'expo-sensors module could not be loaded. Ensure expo-sensors is installed.',
        };
      }

      const { Accelerometer, Gyroscope } = sensors;

      // 1. Check availability
      this.isAccelAvailable = await Accelerometer.isAvailableAsync().catch(() => false);
      this.isGyroAvailable = await Gyroscope.isAvailableAsync().catch(() => false);

      if (!this.isAccelAvailable) {
        return {
          isRunning: false,
          isAccelerometerAvailable: false,
          isGyroscopeAvailable: this.isGyroAvailable,
          isAccelerometerOnlyFallback: false,
          samplingIntervalMs: this.samplingIntervalMs,
          errorMessage: 'Accelerometer sensor is not available on this device.',
        };
      }

      // 2. Request permissions if needed (mobile web / iOS)
      if (typeof Accelerometer.requestPermissionsAsync === 'function') {
        const perm = await Accelerometer.requestPermissionsAsync().catch(() => null);
        if (perm && perm.status !== 'granted') {
          return {
            isRunning: false,
            isAccelerometerAvailable: true,
            isGyroscopeAvailable: this.isGyroAvailable,
            isAccelerometerOnlyFallback: false,
            samplingIntervalMs: this.samplingIntervalMs,
            errorMessage: 'Motion sensor permissions were denied by user.',
          };
        }
      }

      // 3. Set update intervals
      Accelerometer.setUpdateInterval(this.samplingIntervalMs);
      if (this.isGyroAvailable) {
        Gyroscope.setUpdateInterval(this.samplingIntervalMs);
      }

      // 4. Subscribe to Gyroscope if available
      if (this.isGyroAvailable) {
        this.gyroSubscription = Gyroscope.addListener((data: { x: number; y: number; z: number }) => {
          this.latestGyro = { x: data.x, y: data.y, z: data.z };
          this.latestGyroTimestampMs = Date.now();
        });
      }

      // 5. Subscribe to Accelerometer (Primary trigger clock)
      this.accelSubscription = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
        const now = Date.now();

        // Expire gyro reading if it hasn't updated within 200ms
        const activeGyro = (now - this.latestGyroTimestampMs < 200) ? this.latestGyro : undefined;

        const sample: RawSensorSample = {
          acceleration: { x: data.x, y: data.y, z: data.z },
          gyroscope: activeGyro,
          timestampMs: now,
        };

        this.engine.ingestSample(sample);
      });

      this.isRunning = true;
      return this.getStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isRunning: false,
        isAccelerometerAvailable: this.isAccelAvailable,
        isGyroscopeAvailable: this.isGyroAvailable,
        isAccelerometerOnlyFallback: !this.isGyroAvailable,
        samplingIntervalMs: this.samplingIntervalMs,
        errorMessage: `Failed to start sensor adapter: ${msg}`,
      };
    }
  }

  /**
   * Stops sensor streaming and removes active listeners.
   */
  public stop(): void {
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
    }
    if (this.gyroSubscription) {
      this.gyroSubscription.remove();
      this.gyroSubscription = null;
    }
    this.isRunning = false;
    this.latestGyro = undefined;
  }

  public getStatus(): SensorAdapterStatus {
    return {
      isRunning: this.isRunning,
      isAccelerometerAvailable: this.isAccelAvailable,
      isGyroscopeAvailable: this.isGyroAvailable,
      isAccelerometerOnlyFallback: this.isAccelAvailable && !this.isGyroAvailable,
      samplingIntervalMs: this.samplingIntervalMs,
    };
  }

  /**
   * Safely imports expo-sensors module if available in runtime.
   */
  private async loadExpoSensors(): Promise<any | null> {
    try {
      // @ts-ignore - expo-sensors will be linked when integrating into host app
      return await import('expo-sensors');
    } catch {
      return null;
    }
  }
}
