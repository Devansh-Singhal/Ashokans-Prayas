import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

/* =========================================================================
   Pothole AI Detector — Stage Demo
   Real motion and the simulation buttons both run through the SAME
   classifier, so nothing on screen is faked.
   ========================================================================= */

const UPDATE_MS = 16; // ~62 Hz
const G_ALPHA = 0.9; // gravity low-pass (higher = slower to adapt)
const TRIGGER_G = 0.3; // start capturing above this |vertical g|
const RELEASE_G = 0.14; // considered quiet below this
const QUIET_MS = 450; // quiet time that closes an event - long enough to bridge the
// natural pause at the top of a hand-driven lift, which is not present in the
// idealized synthetic curves the sim buttons use
const MAX_EVENT_MS = 2600;
const PREROLL = 10; // samples kept before the trigger fired
const FREEFALL_G = -0.62; // below this ≈ airborne
const EDGE_G = 0.22; // amplitude that counts as "the first move"
const MIN_AMPLITUDE = 0.38; // below this the whole event is discarded

const C = {
  bg: '#0E1116',
  panel: '#161B22',
  line: '#242C38',
  ink: '#E8EDF4',
  dim: '#7C8798',
  pothole: '#FF5C46',
  breaker: '#4FD2A0',
  idle: '#5B6675',
};

type Status = 'starting' | 'denied' | 'no sensor' | 'listening';
type Source = 'motion' | 'sim';

interface Sample {
  t: number;
  v: number;
  rot: number;
}

interface Classification {
  label: 'POTHOLE' | 'SPEED BREAKER';
  isPothole: boolean;
  score: number;
  confidence: number;
  severity: number;
  ev: [string, number][];
  stats: {
    dur: number;
    maxJerk: number;
    amplitude: number;
    freefallMs: number;
    rotPeak: number;
    peakNeg: number;
    peakPos: number;
  };
  wave: number[];
}

interface LogEntry extends Classification {
  id: number;
  source: Source;
  time: Date;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/* ---------------------------- classifier ------------------------------- */
function classify(win: Sample[]): Classification | null {
  const n = win.length;
  if (n < 4) return null;

  const dur = win[n - 1].t - win[0].t;
  let peakPos = 0;
  let peakNeg = 0;
  let maxJerk = 0;
  let freefallMs = 0;
  let rotPeak = 0;
  let firstSign = 0;
  let reversals = 0;
  let prevDir = 0;

  for (let i = 0; i < n; i++) {
    const s = win[i];
    if (s.v > peakPos) peakPos = s.v;
    if (s.v < peakNeg) peakNeg = s.v;
    if (s.rot > rotPeak) rotPeak = s.rot;

    if (i > 0) {
      const dt = Math.max(0.004, (s.t - win[i - 1].t) / 1000);
      const dv = s.v - win[i - 1].v;
      const jerk = Math.abs(dv) / dt; // g per second
      if (jerk > maxJerk) maxJerk = jerk;
      if (s.v < FREEFALL_G) freefallMs += dt * 1000;

      const dir = dv > 0.02 ? 1 : dv < -0.02 ? -1 : prevDir;
      if (dir !== 0 && prevDir !== 0 && dir !== prevDir) reversals++;
      prevDir = dir;
    }
    if (firstSign === 0 && Math.abs(s.v) > EDGE_G) firstSign = Math.sign(s.v);
  }

  const amplitude = peakPos - peakNeg;
  if (amplitude < MIN_AMPLITUDE) return null;

  /* ---- weighted evidence. Positive score = pothole, negative = breaker ---- */
  const ev: [string, number][] = [];
  let score = 0.5;

  // 1. Airborne. Only a toss or a real wheel drop leaves the ground.
  if (freefallMs >= 55) {
    score += 0.34;
    ev.push([`airborne ${Math.round(freefallMs)} ms`, 0.34]);
  }

  // 2. Jerk. Real hand motion (even a deliberately smooth lift) routinely hits
  // 5-10 g/s from grip noise alone, so the baseline sits well above that -
  // only a genuinely abrupt strike should score here.
  const jerkNorm = clamp((maxJerk - 25) / 60, -0.5, 1);
  score += jerkNorm * 0.2;
  ev.push([`peak jerk ${maxJerk.toFixed(1)} g/s`, jerkNorm * 0.2]);

  // 3. Duration. The most reliable, noise-independent discriminator - breakers
  // are ridden over (long), potholes are struck (short) - so it carries the
  // most weight.
  const durNorm = clamp((650 - dur) / 500, -1, 1);
  score += durNorm * 0.3;
  ev.push([`event ${Math.round(dur)} ms`, durNorm * 0.3]);

  // 4. Leading edge. Down first = hole. Up first = hump.
  if (firstSign < 0) {
    score += 0.14;
    ev.push(['leading edge down', 0.14]);
  } else if (firstSign > 0) {
    score -= 0.12;
    ev.push(['leading edge up', -0.12]);
  }

  // 5. Rotation. One-sided strike twists the body; a hump lifts it level.
  // Incidental wrist rotation during any hand-held lift easily reaches
  // 60-120 deg/s, so the baseline sits above that.
  const rotNorm = clamp((rotPeak - 130) / 260, -0.3, 1);
  score += rotNorm * 0.06;
  ev.push([`rotation ${Math.round(rotPeak)} °/s`, rotNorm * 0.06]);

  // 6. Drop deeper than the rebound.
  if (Math.abs(peakNeg) > peakPos * 1.15) {
    score += 0.08;
    ev.push(['drop exceeds rebound', 0.08]);
  }

  // 7. Smooth single arc vs ringing.
  if (reversals <= 2 && maxJerk < 20) {
    score -= 0.1;
    ev.push(['smooth single arc', -0.1]);
  } else if (reversals >= 5) {
    score += 0.06;
    ev.push(['oscillating settle', 0.06]);
  }

  score = clamp(score, 0, 1);
  const isPothole = score >= 0.5;

  return {
    label: isPothole ? 'POTHOLE' : 'SPEED BREAKER',
    isPothole,
    score,
    confidence: Math.round(Math.abs(score - 0.5) * 200),
    severity: Math.min(5, Math.max(1, Math.round(amplitude * 1.6))),
    ev: ev.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4),
    stats: { dur, maxJerk, amplitude, freefallMs, rotPeak, peakNeg, peakPos },
    wave: downsample(win, 60),
  };
}

function downsample(win: Sample[], m: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < m; i++) {
    const s = win[Math.min(win.length - 1, Math.floor((i * win.length) / m))];
    out.push(s.v);
  }
  return out;
}

/* ------------------------- synthetic waveforms ------------------------- */
/* These generate sensor samples and feed the real classifier. */
function synth(kind: 'toss' | 'pothole' | 'breaker'): Sample[] {
  const out: Sample[] = [];
  const push = (t: number, v: number, rot: number) => out.push({ t, v, rot });

  if (kind === 'toss') {
    for (let t = 0; t < 70; t += 16) push(t, 0.9 * Math.sin((t / 70) * Math.PI), 40);
    for (let t = 70; t < 400; t += 16) push(t, -0.97 + Math.random() * 0.04, 90);
    for (let t = 400; t < 470; t += 16) push(t, 3.1 * Math.sin(((t - 400) / 70) * Math.PI), 260);
    for (let t = 470; t < 620; t += 16)
      push(t, 0.5 * Math.sin((t / 40) * Math.PI) * Math.exp(-(t - 470) / 60), 60);
  } else if (kind === 'pothole') {
    for (let t = 0; t < 60; t += 12) push(t, -1.25 * Math.sin((t / 60) * Math.PI), 210);
    for (let t = 60; t < 130; t += 12) push(t, 1.75 * Math.sin(((t - 60) / 70) * Math.PI), 240);
    for (let t = 130; t < 420; t += 14)
      push(t, 0.7 * Math.sin((t - 130) / 22) * Math.exp(-(t - 130) / 90), 80);
  } else {
    // speed breaker: one smooth, slow, symmetric arc
    for (let t = 0; t < 780; t += 18) push(t, 0.62 * Math.sin((t / 780) * Math.PI), 14 + Math.random() * 6);
    for (let t = 780; t < 1220; t += 18) push(t, -0.34 * Math.sin(((t - 780) / 440) * Math.PI), 10);
  }
  return out;
}

/* ------------------------------ component ------------------------------ */
export const PotholeDemoScreen: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('starting');
  const [live, setLive] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const grav = useRef({ x: 0, y: 0, z: 9.81 });
  const buf = useRef<Sample[]>([]); // rolling pre-trigger buffer
  const evt = useRef<Sample[] | null>(null); // active event samples
  const quietAt = useRef(0);
  const liveV = useRef(0);
  const t0 = useRef(0);

  const commit = useCallback((win: Sample[], source: Source) => {
    const r = classify(win);
    if (!r) return;
    setResult(r);
    setLog((prev) =>
      [{ ...r, id: Date.now() + Math.random(), source, time: new Date() }, ...prev].slice(0, 12)
    );
  }, []);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    (async () => {
      const { granted } = await DeviceMotion.requestPermissionsAsync();
      if (!granted) {
        setStatus('denied');
        return;
      }
      const ok = await DeviceMotion.isAvailableAsync();
      if (!ok) {
        setStatus('no sensor');
        return;
      }
      DeviceMotion.setUpdateInterval(UPDATE_MS);
      t0.current = Date.now();
      setStatus('listening');

      sub = DeviceMotion.addListener((d) => {
        const a = d.accelerationIncludingGravity;
        const r = d.rotationRate;

        // running estimate of the gravity direction
        const g = grav.current;
        g.x = G_ALPHA * g.x + (1 - G_ALPHA) * a.x;
        g.y = G_ALPHA * g.y + (1 - G_ALPHA) * a.y;
        g.z = G_ALPHA * g.z + (1 - G_ALPHA) * a.z;
        const gm = Math.hypot(g.x, g.y, g.z) || 9.81;

        // project onto gravity, subtract 1g, express in g. Pose-independent.
        const v = (a.x * g.x + a.y * g.y + a.z * g.z) / gm / gm - 1;
        const rot = r ? Math.hypot(r.alpha || 0, r.beta || 0, r.gamma || 0) : 0;
        const t = Date.now() - t0.current;
        const s: Sample = { t, v, rot };

        liveV.current = v;

        if (evt.current) {
          evt.current.push(s);
          const started = evt.current[0].t;
          if (Math.abs(v) > RELEASE_G) quietAt.current = t;
          if (t - quietAt.current > QUIET_MS || t - started > MAX_EVENT_MS) {
            const win = evt.current;
            evt.current = null;
            buf.current = [];
            setCapturing(false);
            commit(win, 'motion');
          }
        } else {
          buf.current.push(s);
          if (buf.current.length > PREROLL) buf.current.shift();
          if (Math.abs(v) > TRIGGER_G) {
            evt.current = [...buf.current, s];
            quietAt.current = t;
            setCapturing(true);
          }
        }
      });
    })();
    return () => sub?.remove();
  }, [commit]);

  // throttled UI tick so the sensor loop never touches React state
  useEffect(() => {
    const id = setInterval(() => setLive(liveV.current), 90);
    return () => clearInterval(id);
  }, []);

  const accent = result ? (result.isPothole ? C.pothole : C.breaker) : C.idle;

  return (
    <View style={s.root}>
      <Pressable style={s.backRow} onPress={() => router.back()} hitSlop={10}>
        <ChevronLeft size={20} color={C.dim} />
        <Text style={s.backText}>Back</Text>
      </Pressable>

      <View style={s.head}>
        <Text style={s.title}>Pothole AI Detector</Text>
        <Text style={s.sub}>Stage demo · live sensor classification</Text>
      </View>

      <View style={s.meterWrap}>
        <Meter value={live} capturing={capturing} status={status} />
      </View>

      <View style={[s.card, { borderColor: accent }]}>
        {result ? (
          <>
            <Text style={[s.verdict, { color: accent }]}>{result.label}</Text>
            <Text style={s.conf}>
              {result.confidence}% confidence · severity {result.severity}/5
            </Text>
            <Wave data={result.wave} color={accent} />
            {result.ev.map(([label, w], i) => (
              <View style={s.evRow} key={i}>
                <Text style={s.evText}>{label}</Text>
                <Text style={[s.evW, { color: w > 0 ? C.pothole : C.breaker }]}>
                  {w > 0 ? '+' : ''}
                  {w.toFixed(2)}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={s.emptyTitle}>Waiting for a bump</Text>
            <Text style={s.emptyBody}>
              Lift the phone up and down smoothly over about a second for a speed breaker. Toss it
              and catch it, or jab it down sharply, for a pothole.
            </Text>
          </>
        )}
      </View>

      <View style={s.btnRow}>
        <Btn label="Toss and catch" onPress={() => commit(synth('toss'), 'sim')} />
        <Btn label="Pothole strike" onPress={() => commit(synth('pothole'), 'sim')} />
      </View>
      <View style={s.btnRow}>
        <Btn label="Speed breaker" onPress={() => commit(synth('breaker'), 'sim')} />
        <Btn
          label="Clear log"
          muted
          onPress={() => {
            setLog([]);
            setResult(null);
          }}
        />
      </View>

      <ScrollView style={s.log} contentContainerStyle={{ paddingBottom: 24 }}>
        {log.map((e) => (
          <View style={s.logRow} key={e.id}>
            <View style={[s.dot, { backgroundColor: e.isPothole ? C.pothole : C.breaker }]} />
            <Text style={s.logLabel}>{e.label}</Text>
            <Text style={s.logMeta}>
              {Math.round(e.stats.maxJerk)} g/s · {Math.round(e.stats.dur)} ms
              {e.source === 'sim' ? ' · sim' : ''}
            </Text>
            <Text style={s.logTime}>
              {e.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

/* ------------------------------ subviews ------------------------------- */
function Meter({ value, capturing, status }: { value: number; capturing: boolean; status: Status }) {
  const pct = clamp(Math.abs(value) / 3, 0, 1);
  const up = value >= 0;
  return (
    <View>
      <View style={s.meterTrack}>
        <View style={s.meterZero} />
        <View
          style={[
            s.meterFill,
            {
              width: `${pct * 50}%`,
              left: up ? '50%' : undefined,
              right: up ? undefined : '50%',
              backgroundColor: capturing ? C.pothole : C.dim,
            },
          ]}
        />
      </View>
      <View style={s.meterLabels}>
        <Text style={s.meterText}>
          {value >= 0 ? '+' : ''}
          {value.toFixed(2)} g vertical
        </Text>
        <Text style={[s.meterText, { color: capturing ? C.pothole : C.dim }]}>
          {capturing ? 'capturing' : status}
        </Text>
      </View>
    </View>
  );
}

function Wave({ data, color }: { data: number[]; color: string }) {
  const H = 96;
  const mid = H / 2;
  return (
    <View style={[s.wave, { height: H }]}>
      <View style={s.waveAxis} />
      {data.map((v, i) => {
        const h = Math.max(1, clamp(Math.abs(v) / 3, 0, 1) * (mid - 3));
        return (
          <View key={i} style={s.waveCol}>
            <View
              style={{
                position: 'absolute',
                left: 1,
                right: 1,
                height: h,
                top: v >= 0 ? mid - h : mid,
                backgroundColor: color,
                opacity: 0.85,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

function Btn({ label, onPress, muted }: { label: string; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.btn, muted && s.btnMuted, pressed && { opacity: 0.6 }]}
    >
      <Text style={[s.btnText, muted && { color: C.dim }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------- styles -------------------------------- */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 18, paddingTop: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8, alignSelf: 'flex-start' },
  backText: { color: C.dim, fontSize: 15 },
  head: { marginBottom: 20 },
  title: { color: C.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  sub: { color: C.dim, fontSize: 14, marginTop: 4 },

  meterWrap: { marginBottom: 18 },
  meterTrack: {
    height: 12,
    backgroundColor: C.panel,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  meterZero: { position: 'absolute', left: '50%', width: 1, top: 0, bottom: 0, backgroundColor: C.line },
  meterFill: { position: 'absolute', top: 0, bottom: 0 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  meterText: { color: C.dim, fontSize: 13, fontVariant: ['tabular-nums'] },

  card: {
    backgroundColor: C.panel,
    borderRadius: 14,
    borderWidth: 2,
    padding: 18,
    minHeight: 250,
  },
  verdict: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  conf: { color: C.dim, fontSize: 15, marginTop: 2, marginBottom: 12 },
  emptyTitle: { color: C.ink, fontSize: 22, fontWeight: '600' },
  emptyBody: { color: C.dim, fontSize: 15, lineHeight: 23, marginTop: 10 },

  wave: { flexDirection: 'row', marginBottom: 14, marginTop: 2 },
  waveAxis: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: C.line },
  waveCol: { flex: 1, height: '100%' },

  evRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  evText: { color: C.ink, fontSize: 14 },
  evW: { fontSize: 14, fontVariant: ['tabular-nums'] },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnMuted: { backgroundColor: 'transparent' },
  btnText: { color: C.ink, fontSize: 15, fontWeight: '600' },

  log: { flex: 1, marginTop: 18 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    gap: 9,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  logLabel: { color: C.ink, fontSize: 14, fontWeight: '600', width: 118 },
  logMeta: { color: C.dim, fontSize: 13, flex: 1, fontVariant: ['tabular-nums'] },
  logTime: { color: C.line, fontSize: 12 },
});
