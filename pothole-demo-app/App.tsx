import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

// Import engine from self-contained local module
import {
  ExpoSensorAdapter,
  MockSensorStream,
  PotholeDetectionEngine,
  PotholeEvent,
  RawSensorSample,
} from './src/engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  // Engine and adapter instances
  const engineRef = useRef<PotholeDetectionEngine | null>(null);
  const adapterRef = useRef<ExpoSensorAdapter | null>(null);

  // App & Detection States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isStageDemoMode, setIsStageDemoMode] = useState(true);
  const [sensorStatus, setSensorStatus] = useState<string>('Initializing...');
  const [isAirborne, setIsAirborne] = useState(false);
  const [freefallMs, setFreefallMs] = useState(0);

  // Live Telemetry
  const [verticalG, setVerticalG] = useState(0.0);
  const [horizontalG, setHorizontalG] = useState(0.0);
  const [gyroRate, setGyroRate] = useState(0.0);
  const [tiltDeg, setTiltDeg] = useState(0);

  // Dynamic live sparkline history (last 30 samples)
  const [historyBars, setHistoryBars] = useState<number[]>(new Array(30).fill(0));

  // Impact Flash State
  const [latestImpact, setLatestImpact] = useState<PotholeEvent | null>(null);
  const [impactFlash, setImpactFlash] = useState(false);

  // Log of events
  const [eventLog, setEventLog] = useState<PotholeEvent[]>([]);

  useEffect(() => {
    // 1. Initialize Pothole Engine in Stage Demo Mode by default
    const engine = new PotholeDetectionEngine({
      stageDemoMode: true,
      minCandidateDeltaG: 0.70,
    });
    engineRef.current = engine;

    // 2. Subscribe to pothole impact detections
    const unsubPothole = engine.onPothole((event) => {
      setLatestImpact(event);
      setImpactFlash(true);
      setEventLog((prev) => [event, ...prev.slice(0, 19)]); // keep last 20

      // Haptic feedback
      try {
        Vibration.vibrate(Platform.OS === 'android' ? [0, 80, 40, 120] : 100);
      } catch {}

      // Reset visual impact flash after 3.2 seconds
      setTimeout(() => {
        setImpactFlash(false);
      }, 3200);
    });

    // 3. Subscribe to stats & telemetry updates
    const unsubStats = engine.onStats((stats) => {
      setIsAirborne(stats.isAirborneFreefall);
      setFreefallMs(stats.freefallDurationMs);
      setTiltDeg(stats.phoneTiltDeg);
    });

    // 4. Connect Expo Sensors
    const adapter = new ExpoSensorAdapter(engine, 20);
    adapterRef.current = adapter;

    adapter.start().then((status) => {
      if (status.isRunning) {
        setIsLiveActive(true);
        if (status.isAccelerometerOnlyFallback) {
          setSensorStatus('🟢 Live Accelerometer (Gyro Fallback)');
        } else {
          setSensorStatus('🟢 Live Accelerometer + Gyroscope (50 Hz)');
        }
      } else {
        setIsLiveActive(false);
        setSensorStatus(`🟡 Hardware Standby: ${status.errorMessage ?? 'Simulated Mode'}`);
      }
    });

    // 5. High-speed real-time telemetry from physical accelerometer and gyroscope
    let lastUiUpdateMs = 0;
    const unsubTelemetry = engine.onTelemetry((sample) => {
      const now = Date.now();
      // Throttle UI re-render to ~30 fps (every 35ms) for smooth graphics
      if (now - lastUiUpdateMs > 35) {
        lastUiUpdateMs = now;
        setVerticalG(sample.verticalAcceleration);
        setHorizontalG(sample.horizontalAcceleration);
        setGyroRate(sample.angularRateNorm);
        setTiltDeg(sample.tiltAngleDeg);

        setHistoryBars((prev) => {
          const sampleVal = Math.max(-2.5, Math.min(2.5, sample.verticalAcceleration));
          return [...prev.slice(1), sampleVal];
        });
      }
    });

    return () => {
      unsubPothole();
      unsubStats();
      unsubTelemetry();
      adapter.stop();
    };
  }, []);

  // Toggle Stage Demo Mode (Phone Toss) vs Vehicle Mode
  const toggleStageDemoMode = (enabled: boolean) => {
    setIsStageDemoMode(enabled);
    engineRef.current?.setStageDemoMode(enabled);
    if (!enabled) {
      engineRef.current?.setSpeed(35); // set nominal vehicle speed in road mode
    } else {
      engineRef.current?.setSpeed(0);  // stationary stage speed
    }
  };

  // Trigger manual simulation of tossing phone in air & catch
  const handleSimulateToss = () => {
    if (!engineRef.current) return;
    // Visually show airborne immediately
    setIsAirborne(true);
    setFreefallMs(320);

    setTimeout(() => {
      engineRef.current?.simulateToss();
      setIsAirborne(false);
      setFreefallMs(0);
    }, 320);
  };

  // Trigger simulated road pothole
  const handleSimulatePothole = () => {
    if (!engineRef.current) return;
    const baseT = Date.now();
    const stream = MockSensorStream.generatePotholeHit({
      durationMs: 1400,
      startTimestampMs: baseT,
      impactPeakG: 2.9,
      dipG: -0.7,
      asymmetricRollRate: 0.85,
    });
    stream.forEach((s) => engineRef.current?.ingestSample(s));
    engineRef.current?.flush(true);
  };

  // Trigger simulated speed bump
  const handleSimulateSpeedBump = () => {
    if (!engineRef.current) return;
    const baseT = Date.now();
    const stream = MockSensorStream.generateSpeedBump({
      durationMs: 1400,
      startTimestampMs: baseT,
    });
    stream.forEach((s) => engineRef.current?.ingestSample(s));
    engineRef.current?.flush(true);
  };

  // Clear log
  const handleClearLog = () => {
    setEventLog([]);
    setLatestImpact(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>POTHOLE AI DETECTOR</Text>
            <Text style={styles.headerSubtitle}>STAGE DEMO & TELEMETRY SUITE</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.pulseDot, isLiveActive ? styles.pulseGreen : styles.pulseYellow]} />
            <Text style={styles.statusPillText}>{isLiveActive ? 'SENSORS ACTIVE' : 'SIMULATION'}</Text>
          </View>
        </View>

        {/* Live Hardware Status Line */}
        <View style={styles.sensorStatusBox}>
          <Text style={styles.sensorStatusText}>{sensorStatus}</Text>
        </View>

        {/* Big Center Stage Card */}
        <View
          style={[
            styles.stageCard,
            impactFlash
              ? styles.stageCardImpact
              : isAirborne
              ? styles.stageCardAirborne
              : styles.stageCardIdle,
          ]}
        >
          {impactFlash && latestImpact ? (
            <View style={styles.impactContainer}>
              <Text style={styles.impactBadge}>💥 POTHOLE DETECTED!</Text>
              <Text style={styles.impactSeverity}>{latestImpact.severity} IMPACT</Text>

              <View style={styles.impactStatsRow}>
                <View style={styles.impactStatBox}>
                  <Text style={styles.impactStatLabel}>PEAK UPWARD</Text>
                  <Text style={styles.impactStatVal}>+{latestImpact.peakVerticalG.toFixed(1)}g</Text>
                </View>
                <View style={styles.impactStatBox}>
                  <Text style={styles.impactStatLabel}>DELTA G</Text>
                  <Text style={styles.impactStatVal}>{latestImpact.deltaG.toFixed(1)}g</Text>
                </View>
                <View style={styles.impactStatBox}>
                  <Text style={styles.impactStatLabel}>CONFIDENCE</Text>
                  <Text style={styles.impactStatVal}>{(latestImpact.confidenceScore * 100).toFixed(0)}%</Text>
                </View>
              </View>

              <Text style={styles.impactSubtext}>
                {latestImpact.id.includes('stage_toss')
                  ? '✈️ Activated by Airborne Freefall & Catch Deceleration'
                  : '🚗 Activated by Dip-then-Spike Road Collision Waveform'}
              </Text>
            </View>
          ) : isAirborne ? (
            <View style={styles.airborneContainer}>
              <Text style={styles.airborneEmoji}>✈️</Text>
              <Text style={styles.airborneTitle}>AIRBORNE (FREEFALL)!</Text>
              <Text style={styles.airborneSubtext}>Zero-G Weightlessness Detected</Text>
              <Text style={styles.airborneTimer}>{freefallMs} ms in air...</Text>
              <Text style={styles.airborneInstruction}>Catch phone now to trigger impact!</Text>
            </View>
          ) : (
            <View style={styles.idleContainer}>
              <View style={styles.idleRing}>
                <Text style={styles.idleIcon}>{isStageDemoMode ? '🎯' : '🚘'}</Text>
              </View>
              <Text style={styles.idleTitle}>
                {isStageDemoMode ? 'STAGE TOSS MODE ACTIVE' : 'VEHICLE ROAD MODE ACTIVE'}
              </Text>
              <Text style={styles.idleInstruction}>
                {isStageDemoMode
                  ? 'Throw phone gently 1-2 ft up into air & catch back'
                  : 'Monitoring road asphalt for potholes (> 12 km/h)'}
              </Text>
            </View>
          )}
        </View>

        {/* Real-time Waveform Sparkline Display */}
        <View style={styles.waveCard}>
          <View style={styles.waveHeader}>
            <Text style={styles.waveTitle}>LIVE DYNAMIC ACCELERATION (G-FORCE TRACE)</Text>
            <Text style={styles.waveSub}>50 HZ RESAMPLED BUFFER</Text>
          </View>
          <View style={styles.waveContainer}>
            {historyBars.map((val, idx) => {
              const height = Math.min(50, Math.abs(val) * 20) + 4;
              const isPos = val >= 0;
              return (
                <View key={idx} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: impactFlash
                          ? '#ef4444'
                          : isAirborne
                          ? '#8b5cf6'
                          : isPos
                          ? '#06b6d4'
                          : '#f59e0b',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Live Gauges Grid */}
        <View style={styles.gaugeGrid}>
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>VERTICAL DYNAMIC</Text>
            <Text style={styles.gaugeVal}>{verticalG >= 0 ? `+${verticalG.toFixed(2)}` : verticalG.toFixed(2)} g</Text>
          </View>
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>GROUND PLANE</Text>
            <Text style={styles.gaugeVal}>{horizontalG.toFixed(2)} g</Text>
          </View>
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>GYRO RATE ||ω||</Text>
            <Text style={styles.gaugeVal}>{gyroRate.toFixed(2)} rad/s</Text>
          </View>
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>PHONE TILT</Text>
            <Text style={styles.gaugeVal}>{tiltDeg}°</Text>
          </View>
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeTab, isStageDemoMode && styles.modeTabActive]}
            onPress={() => toggleStageDemoMode(true)}
          >
            <Text style={[styles.modeTabText, isStageDemoMode && styles.modeTabTextActive]}>
              🎯 Stage Demo (Toss & Catch)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, !isStageDemoMode && styles.modeTabActive]}
            onPress={() => toggleStageDemoMode(false)}
          >
            <Text style={[styles.modeTabText, !isStageDemoMode && styles.modeTabTextActive]}>
              🚗 Vehicle Road Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mentor Interactive Simulation Controls */}
        <View style={styles.simCard}>
          <Text style={styles.simTitle}>MENTOR SHOWCASE & SIMULATION CONTROLS</Text>
          <Text style={styles.simSub}>
            Test without physical driving or throwing hardware:
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSimulateToss}>
              <Text style={styles.btnText}>🚀 Toss & Catch (Stage Demo)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleSimulatePothole}>
              <Text style={styles.btnText}>💥 Road Pothole Strike</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.btnTertiary} onPress={handleSimulateSpeedBump}>
              <Text style={styles.btnTextSecondary}>🚧 Speed Bump</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={handleClearLog}>
              <Text style={styles.btnTextSecondary}>🗑️ Clear Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detected Potholes Event Feed */}
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>DETECTION EVENT FEED ({eventLog.length})</Text>
            {eventLog.length > 0 && (
              <Text style={styles.logCountBadge}>{eventLog.length} Recorded</Text>
            )}
          </View>

          {eventLog.length === 0 ? (
            <View style={styles.emptyLog}>
              <Text style={styles.emptyLogText}>
                No events recorded yet. Toss the phone up and catch it, or tap one of the simulation buttons above!
              </Text>
            </View>
          ) : (
            eventLog.map((ev, i) => (
              <View key={ev.id + i} style={styles.logItem}>
                <View style={styles.logItemTop}>
                  <View style={styles.logTagRow}>
                    <Text
                      style={[
                        styles.severityTag,
                        ev.severity === 'CRITICAL'
                          ? styles.sevCritical
                          : ev.severity === 'SEVERE'
                          ? styles.sevSevere
                          : styles.sevModerate,
                      ]}
                    >
                      {ev.severity}
                    </Text>
                    <Text style={styles.logTypeTag}>
                      {ev.id.includes('stage_toss') ? 'TOSS & CATCH' : 'ROAD POTHOLE'}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>
                    {new Date(ev.timestampMs).toLocaleTimeString()}
                  </Text>
                </View>

                <View style={styles.logDetailsRow}>
                  <Text style={styles.logDetailText}>
                    Impact: <Text style={styles.whiteText}>+{ev.peakVerticalG.toFixed(1)}g</Text>
                  </Text>
                  <Text style={styles.logDetailText}>
                    ΔG: <Text style={styles.whiteText}>{ev.deltaG.toFixed(1)}g</Text>
                  </Text>
                  <Text style={styles.logDetailText}>
                    Airtime: <Text style={styles.whiteText}>{ev.durationMs}ms</Text>
                  </Text>
                  <Text style={styles.logDetailText}>
                    Confidence: <Text style={styles.whiteText}>{(ev.confidenceScore * 100).toFixed(0)}%</Text>
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Standalone Expo Demo App • Compliant with Expo SDK 57 • Zero commits to main repo
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#38bdf8',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
    color: '#64748b',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pulseGreen: {
    backgroundColor: '#10b981',
  },
  pulseYellow: {
    backgroundColor: '#f59e0b',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  sensorStatusBox: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  sensorStatusText: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Giant Center Stage Card
  stageCard: {
    borderRadius: 18,
    padding: 22,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  stageCardIdle: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  stageCardAirborne: {
    backgroundColor: '#2e1065',
    borderColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  stageCardImpact: {
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },

  // Idle View
  idleContainer: {
    alignItems: 'center',
  },
  idleRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  idleIcon: {
    fontSize: 26,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.6,
  },
  idleInstruction: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Airborne View
  airborneContainer: {
    alignItems: 'center',
  },
  airborneEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  airborneTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#c084fc',
    letterSpacing: 1.0,
  },
  airborneSubtext: {
    fontSize: 13,
    color: '#e9d5ff',
    marginTop: 2,
  },
  airborneTimer: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f43f5e',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  airborneInstruction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbcfe8',
    marginTop: 6,
  },

  // Impact View
  impactContainer: {
    alignItems: 'center',
    width: '100%',
  },
  impactBadge: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fca5a5',
    letterSpacing: 1.2,
  },
  impactSeverity: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fee2e2',
    marginTop: 2,
    letterSpacing: 1.0,
  },
  impactStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  impactStatBox: {
    alignItems: 'center',
  },
  impactStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  impactStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 3,
  },
  impactSubtext: {
    fontSize: 11,
    color: '#fecaca',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Sparkline Waveform Card
  waveCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  waveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  waveTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  waveSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: '#090d16',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  barColumn: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },

  // Gauges
  gaugeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  gaugeBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  gaugeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  gaugeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f1f5f9',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Mode Switcher
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },

  // Simulation Controls Card
  simCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  simTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f1f5f9',
    letterSpacing: 0.8,
  },
  simSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnTertiary: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnDanger: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  btnTextSecondary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  // Event Log Card
  logCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f1f5f9',
    letterSpacing: 0.8,
  },
  logCountBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyLog: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyLogText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  logItem: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  logItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityTag: {
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#ffffff',
  },
  sevCritical: {
    backgroundColor: '#dc2626',
  },
  sevSevere: {
    backgroundColor: '#ea580c',
  },
  sevModerate: {
    backgroundColor: '#d97706',
  },
  logTypeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logTime: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logDetailText: {
    fontSize: 11,
    color: '#64748b',
  },
  whiteText: {
    color: '#f1f5f9',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },
});
