"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUDITORIUM,
  AUDITORIUM_START,
  BELL_DB,
  HEARING,
  LEAK_DB,
  LIMITS,
  P_ATM,
  SILENT_DB,
  SPEECH_RT,
  STEEL_V,
  bellLevelDb,
  decayDb,
  depthFromEcho,
  hallAbsorption,
  hallRT,
  hallVolume,
  hearers,
  pressureAfterStrokes,
  reflectorDepth,
  scanEchoTime,
  type AnimalId,
  type ChallengeHall,
  type HallSetup,
  type HallSpec,
  type SteelBlock,
} from "@/lib/sim/acoustics";

export type HallMode = "bell" | "hall" | "ultra" | "hearing";

export interface SoundHallReading {
  mode: HallMode;
  /** Bell jar: pump strokes so far, air left as a fraction of normal pressure, loudness outside (dB). */
  strokes: number;
  pressure: number;
  level: number;
  silent: boolean;
  /** Hall: reverberation time (s), total absorption (m²) and volume (m³). */
  hall: { name: string; T: number; A: number; V: number; setup: HallSetup };
  /** Ultrasound: the last finished pulse. */
  scan: { id: number; x: number; echo: number; depth: number; crack: boolean } | null;
  /** Hearing: the chosen frequency (Hz) and who can hear it. */
  f: number;
  hearers: AnimalId[];
}

interface Props {
  onReading?: (r: SoundHallReading) => void;
  /** Challenge: Hall mode only, with this hall, its fixed audience and a panel budget. */
  challenge?: ChallengeHall | null;
}

const MAX_STROKES = 50;
/** The clap graph shows the first 6 s after a clap. */
const CLAP_WINDOW_S = 6;
/** The ultrasound pulse takes about 40 µs in the block; the animation stretches it to 1.2 s. */
const PULSE_ANIM_S = 1.2;
const SCAN_AXIS_US = 50;
const START_BLOCK: SteelBlock = { length: 1, thickness: 0.12, crack: { x0: 0.62, x1: 0.68, depth: 0.05 } };
const BELL_GAIN = 0.05;
const CLAP_GAIN = 0.15;
const PRESETS = [
  { label: "Earthquake 5 Hz", logF: Math.log10(5) },
  { label: "Talking 500 Hz", logF: Math.log10(500) },
  { label: "Dog whistle 30 kHz", logF: Math.log10(30000) },
  { label: "Bat call 60 kHz", logF: Math.log10(60000) },
];
const LOG_MIN = Math.log10(4);
const LOG_MAX = Math.log10(200000);
/** The frequency slider moves in this many even steps on the log scale. */
const SWEEP_STEPS = 1000;

/** Fixed jittered positions for air particles in the jar (x, y from 0 to 1). */
const AIR = (() => {
  let s = 4242;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 160 }, () => ({ x: rnd(), y: rnd(), ph: rnd() * 6.28 }));
})();

type Pulse = { start: number; x: number; depth: number; crack: boolean; reported: boolean };
type BellRig = { osc: OscillatorNode[]; master: GainNode };

export default function SoundHall({ onReading, challenge = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setModeState] = useState<HallMode>("bell");
  const [strokes, setStrokes] = useState(0);
  const [hearBell, setHearBell] = useState(false);
  const [setup, setSetup] = useState<HallSetup>(() =>
    challenge
      ? { carpet: challenge.fixed.carpet, curtains: 0, panels: 0, people: challenge.fixed.people, cushioned: challenge.fixed.cushioned }
      : AUDITORIUM_START,
  );
  const [hearClap, setHearClap] = useState(false);
  const [claps, setClaps] = useState(0);
  const [probe, setProbe] = useState(0.2);
  const [block, setBlock] = useState<SteelBlock>(START_BLOCK);
  const [memory, setMemory] = useState<{ x: number; depth: number }[]>([]);
  const [scan, setScan] = useState<SoundHallReading["scan"]>(null);
  const [busy, setBusy] = useState(false);
  const [logF, setLogF] = useState(3);
  const pulseRef = useRef<Pulse | null>(null);
  const clapRef = useRef<{ start: number; T: number } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const bellRef = useRef<BellRig | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: HallMode = challenge ? "hall" : mode;
  const spec: HallSpec = challenge?.spec ?? AUDITORIUM;
  const pressure = pressureAfterStrokes(strokes);
  const level = bellLevelDb(pressure);
  const silent = level < SILENT_DB;
  const V = hallVolume(spec);
  const A = hallAbsorption(spec, setup);
  const T = hallRT(spec, setup);
  const f = Math.round(Math.pow(10, logF));
  const who = hearers(f);
  const panelMax = challenge ? challenge.budget : LIMITS.panels;

  const params = useRef({ activeMode, pressure, level, spec, setup, T, probe, block, memory, scanned: scan?.crack ?? false, f, who, target: challenge ? { t: challenge.target, tol: challenge.tolerance } : null });
  useEffect(() => {
    params.current = { activeMode, pressure, level, spec, setup, T, probe, block, memory, scanned: memory.some((m) => m.depth < block.thickness), f, who, target: challenge ? { t: challenge.target, tol: challenge.tolerance } : null };
  });

  const setMode = (m: HallMode) => {
    setModeState(m);
    pulseRef.current = null;
    clapRef.current = null;
    setBusy(false);
  };

  // ---------- Audio (only ever started by a tap) ----------
  const getAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioRef.current = new AC();
    }
    const a = audioRef.current;
    if (a.state === "suspended") void a.resume();
    return a;
  };

  const stopBell = () => {
    const b = bellRef.current;
    const a = audioRef.current;
    if (!b || !a) return;
    b.master.gain.setTargetAtTime(0, a.currentTime, 0.03);
    for (const o of b.osc) o.stop(a.currentTime + 0.25);
    bellRef.current = null;
  };

  // The bell rings while sound is on in Bell jar mode; its volume follows the loudness meter.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (hearBell && activeMode === "bell") {
      if (!bellRef.current) {
        const master = a.createGain();
        master.gain.value = 0;
        const am = a.createGain();
        am.gain.value = 0.5;
        const lfo = a.createOscillator();
        lfo.type = "square";
        lfo.frequency.value = 16;
        const lfoGain = a.createGain();
        lfoGain.gain.value = 0.5;
        lfo.connect(lfoGain).connect(am.gain);
        const tones = [1050, 2730].map((hz, i) => {
          const o = a.createOscillator();
          o.type = "sine";
          o.frequency.value = hz;
          const g = a.createGain();
          g.gain.value = i === 0 ? 1 : 0.35;
          o.connect(g).connect(am);
          return o;
        });
        am.connect(master).connect(a.destination);
        for (const o of [lfo, ...tones]) o.start();
        bellRef.current = { osc: [lfo, ...tones], master };
      }
      bellRef.current.master.gain.setTargetAtTime(BELL_GAIN * Math.pow(10, (level - BELL_DB) / 20), a.currentTime, 0.05);
    } else stopBell();
  }, [hearBell, activeMode, level]);

  // Stop all sound when the student leaves the page or switches tab.
  useEffect(() => {
    const hide = () => {
      setHearBell(false);
      stopBell();
      if (audioRef.current) void audioRef.current.suspend();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") hide();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", hide);
      const a = audioRef.current;
      audioRef.current = null;
      bellRef.current = null;
      if (a) void a.close();
    };
  }, []);

  const playClap = (rt: number) => {
    const a = audioRef.current;
    if (!a) return;
    const dur = Math.min(rt, CLAP_WINDOW_S);
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / a.sampleRate;
      // A sharp clap followed by the hall's tail, which falls 60 dB in T seconds.
      const attack = t < 0.01 ? 1 : 0.5;
      data[i] = (Math.random() * 2 - 1) * attack * Math.pow(10, decayDb(t, rt) / 20);
    }
    const src = a.createBufferSource();
    const gain = a.createGain();
    gain.gain.value = CLAP_GAIN;
    src.buffer = buf;
    src.connect(gain).connect(a.destination);
    src.start();
  };

  const clap = () => {
    clapRef.current = { start: performance.now(), T };
    setClaps((c) => c + 1);
    if (hearClap) playClap(T);
  };

  const firePulse = () => {
    const depth = reflectorDepth(block, probe);
    pulseRef.current = { start: performance.now(), x: probe, depth, crack: depth < block.thickness, reported: false };
    setBusy(true);
  };

  const newBlock = () => {
    const w = 0.04 + Math.random() * 0.05;
    const x0 = Math.round((0.12 + Math.random() * (0.76 - w)) * 100) / 100;
    setBlock({ length: 1, thickness: 0.12, crack: { x0, x1: Math.round((x0 + w) * 100) / 100, depth: Math.round((0.03 + Math.random() * 0.06) * 100) / 100 } });
    setMemory([]);
    setScan(null);
    pulseRef.current = null;
    setBusy(false);
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let scanId = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;

      if (P.activeMode === "bell") drawBell(ctx, w, h, t, P.pressure, P.level);
      else if (P.activeMode === "hall") {
        const cl = clapRef.current;
        const since = cl ? (now - cl.start) / 1000 : null;
        drawHall(ctx, w, h, P.spec, P.setup, P.T, P.target, since, cl?.T ?? P.T);
      } else if (P.activeMode === "ultra") {
        const pulse = pulseRef.current;
        let prog: number | null = null;
        if (pulse) {
          prog = Math.min(1, (now - pulse.start) / 1000 / PULSE_ANIM_S);
          if (prog >= 1 && !pulse.reported) {
            pulse.reported = true;
            scanId++;
            const echo = scanEchoTime(P.block, pulse.x);
            setScan({ id: scanId, x: pulse.x, echo, depth: pulse.depth, crack: pulse.crack });
            setMemory((m) => [...m.filter((p) => Math.abs(p.x - pulse.x) > 1e-6), { x: pulse.x, depth: pulse.depth }]);
            setBusy(false);
          }
        }
        drawUltra(ctx, w, h, P.block, P.probe, P.memory, P.scanned, pulse, prog);
      } else drawHearing(ctx, w, h, P.f, P.who);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode: activeMode, strokes, pressure, level, silent, hall: { name: spec.name, T, A, V, setup }, scan, f, hearers: who });
    // `who` follows from f, so it is not listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, strokes, pressure, level, silent, spec.name, T, A, V, setup, scan, f]);

  const toggleBell = () => {
    if (!hearBell && !getAudio()) return;
    setHearBell(!hearBell);
  };
  const toggleClap = () => {
    if (!hearClap) getAudio();
    setHearClap(!hearClap);
  };
  const patch = (p: Partial<HallSetup>) => setSetup((s) => ({ ...s, ...p }));
  const lastScan = scan && Math.abs(scan.x - probe) < 1e-6 ? scan : null;
  const rtColor = T >= SPEECH_RT.min && T <= SPEECH_RT.max ? "text-lime-300" : T > SPEECH_RT.max ? "text-amber-200" : "text-cyan-200";

  return (
    <div className="flex flex-col gap-3 select-none">
      {!challenge && (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["bell", "hall", "ultra", "hearing"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl px-1 py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "bell" ? "Bell jar" : m === "hall" ? "Hall" : m === "ultra" ? "Ultrasound" : "Hearing"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "bell"
            ? `An electric bell keeps ringing inside a glass jar. ${Math.round(pressure * 100)} percent of the air is left and the sound outside is ${Math.round(level)} decibels`
            : activeMode === "hall"
              ? `${spec.name} with its sound treatments, and a graph of a clap dying away. Reverberation time ${T.toFixed(2)} seconds`
              : activeMode === "ultra"
                ? `A steel block with an ultrasound probe at ${Math.round(probe * 100)} centimetres, and an echo graph below`
                : `Hearing ranges of animals and people on a frequency scale, with a marker at ${f} hertz`
        }
      />

      {activeMode === "bell" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Air left" value={pressure >= 0.01 ? `${Math.round(pressure * 100)}%` : `${(pressure * 100).toFixed(2)}%`} />
            <Stat label="Pressure" value={`${(pressure * P_ATM) / 1000 >= 1 ? ((pressure * P_ATM) / 1000).toFixed(1) : ((pressure * P_ATM) / 1000).toFixed(3)} kPa`} />
            <Stat label="Loudness" value={`${Math.round(level)} dB`} />
          </div>
          <LoudnessBar level={level} />
          <Slider label="Pump strokes (each takes out 1/6 of the air)" value={`${strokes}`} min={0} max={MAX_STROKES} step={1} v={strokes} onChange={setStrokes} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !px-3 !py-2 text-sm" onClick={() => setStrokes(0)} disabled={strokes === 0}>
              🌬️ Let the air back in
            </button>
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${hearBell ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              onClick={toggleBell}
            >
              {hearBell ? "🔈 Sound on" : "🔇 Sound off"}
            </button>
          </div>
          <p className="text-center text-xs text-white/40">The bell is switched on the whole time. Watch its hammer while the sound fades.</p>
        </>
      )}

      {activeMode === "hall" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Volume V" value={`${Math.round(V)} m³`} />
            <Stat label="Absorption A" value={`${A.toFixed(1)} m²`} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/50">Reverb time</div>
              <div className={`font-display text-lg tabular-nums ${challenge ? "text-white" : rtColor}`}>{T.toFixed(2)} s</div>
            </div>
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            T = 0.161 × V ÷ A = 0.161 × {Math.round(V)} ÷ {A.toFixed(1)} = {T.toFixed(2)} s
            {!challenge && ` · speech needs ${SPEECH_RT.min} to ${SPEECH_RT.max} s`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Toggle on={setup.carpet} disabled={!!challenge?.fixed.carpet} onClick={() => patch({ carpet: !setup.carpet })} label={setup.carpet ? "🟫 Carpet on floor" : "⬜ Bare floor"} />
            {challenge ? (
              <div className="rounded-xl border border-white/10 px-3 py-2 text-center text-sm text-white/60">
                {setup.people} people{challenge.fixed.cushioned ? ", soft seats" : ""}
              </div>
            ) : (
              <Toggle on={setup.cushioned} onClick={() => patch({ cushioned: !setup.cushioned })} label={setup.cushioned ? "💺 Cushioned seats" : "🪑 Wooden seats"} />
            )}
          </div>
          <Slider label="Curtains (10 m² each)" value={`${setup.curtains}`} min={0} max={LIMITS.curtains} step={1} v={setup.curtains} onChange={(n) => patch({ curtains: n })} />
          <Slider
            label={challenge ? `Acoustic panels (2 m² each, budget ${panelMax})` : "Acoustic panels (2 m² each)"}
            value={`${setup.panels}`}
            min={0}
            max={panelMax}
            step={1}
            v={setup.panels}
            onChange={(n) => patch({ panels: n })}
          />
          {!challenge && (
            <Slider label={`Audience (${spec.seats} seats)`} value={`${setup.people}`} min={0} max={spec.seats} step={10} v={setup.people} onChange={(n) => patch({ people: n })} />
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={clap}>
              👏 Clap
            </button>
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${hearClap ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              onClick={toggleClap}
            >
              {hearClap ? "🔈 Sound on" : "🔇 Sound off"}
            </button>
          </div>
          {claps > 0 && <p className="text-center text-xs text-white/40">The graph shows how loud the hall still is after the clap. Reverberation time is when it has fallen by 60 dB.</p>}
        </>
      )}

      {activeMode === "ultra" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Echo time" value={lastScan ? `${(lastScan.echo * 1e6).toFixed(1)} µs` : "–"} />
            <Stat label="Depth = v × t ÷ 2" value={lastScan ? `${(depthFromEcho(lastScan.echo) * 100).toFixed(1)} cm` : "–"} />
          </div>
          {lastScan && (
            <p className={`text-center text-sm ${lastScan.crack ? "text-pink-300" : "text-white/60"}`}>
              {lastScan.crack
                ? `Early echo! Something reflects at ${(lastScan.depth * 100).toFixed(1)} cm, but the block is ${block.thickness * 100} cm thick. A crack!`
                : `Echo from the bottom of the block, ${block.thickness * 100} cm down. No flaw here.`}
            </p>
          )}
          <Slider label="Probe position" value={`${Math.round(probe * 100)} cm`} min={0.02} max={0.98} step={0.01} v={probe} onChange={setProbe} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={firePulse} disabled={busy}>
              📡 Send a pulse
            </button>
            <button className="btn-ghost !px-3 !py-2 text-sm" onClick={newBlock}>
              🔄 New block
            </button>
          </div>
          <p className="text-center text-xs text-white/40">Ultrasound at 5 MHz, speed in steel about {STEEL_V} m/s. Slide the probe and send pulses to map the inside.</p>
        </>
      )}

      {activeMode === "hearing" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Frequency" value={f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${f} Hz`} />
            <Stat label="Type" value={f < 20 ? "Infrasound" : f > 20000 ? "Ultrasound" : "Audible"} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <span className="text-white/60">Who can hear it: </span>
            {who.length ? (
              <span className="text-white">{who.map((id) => HEARING.find((a) => a.id === id)!).map((a) => `${a.emoji} ${a.label}`).join(", ")}</span>
            ) : (
              <span className="text-amber-200">nobody on this list</span>
            )}
          </div>
          <Slider
            label="Frequency (slide to sweep)"
            value={`${f} Hz`}
            min={0}
            max={SWEEP_STEPS}
            step={1}
            v={Math.round(((logF - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SWEEP_STEPS)}
            onChange={(n) => setLogF(LOG_MIN + (n / SWEEP_STEPS) * (LOG_MAX - LOG_MIN))}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button key={p.label} className="rounded-xl border border-white/10 px-2 py-2 text-xs text-white/70" onClick={() => setLogF(p.logF)}>
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-lg tabular-nums">{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="shrink-0 tabular-nums text-white">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Toggle({ on, label, onClick, disabled }: { on: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-2 py-2 text-sm disabled:opacity-60 ${on ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
    >
      {label}
    </button>
  );
}

function LoudnessBar({ level }: { level: number }) {
  const pct = Math.max(0, Math.min(100, (level / BELL_DB) * 100));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">Loudness meter outside the jar</span>
        <span className={level < SILENT_DB ? "text-lime-300" : "text-white"}>{level < SILENT_DB ? "Silent" : level < 40 ? "Faint" : "Ringing"}</span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 transition-all" style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 w-px bg-white/60" style={{ left: `${(SILENT_DB / BELL_DB) * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/40">
        <span>0 dB</span>
        <span>silent below {SILENT_DB} dB</span>
        <span>{BELL_DB} dB</span>
      </div>
    </div>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";

function arcsOut(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a0: number, a1: number, alpha: number, color: string) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawBell(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: number, level: number) {
  const base = h - 30;
  const cx = w / 2;
  const jr = Math.min(w * 0.26, h * 0.62);
  const top = base - jr * 1.15;
  ctx.font = FONT;

  // Sound spreading out from the jar: as strong as the meter says.
  const amp = Math.pow(10, (level - BELL_DB) / 20);
  const leak = Math.pow(10, (LEAK_DB - BELL_DB) / 20);
  const vis = Math.max(0, Math.min(1, (amp - leak) * 1.1));
  if (vis > 0.01) {
    for (let i = 0; i < 4; i++) {
      const prog = (t * 0.8 + i / 4) % 1;
      const r = jr + 8 + prog * Math.max(40, w / 2 - jr);
      const a = vis * (1 - prog);
      arcsOut(ctx, cx, base - jr * 0.55, r, -Math.PI * 0.35, Math.PI * 0.05, a, "#67e8f9");
      arcsOut(ctx, cx, base - jr * 0.55, r, Math.PI * 0.95, Math.PI * 1.35, a, "#67e8f9");
    }
  }

  // Base plate and the pipe to the pump.
  ctx.fillStyle = "#334155";
  ctx.fillRect(cx - jr - 18, base, 2 * jr + 36, 10);
  ctx.fillStyle = "#475569";
  ctx.fillRect(cx + jr + 18, base + 2, w - (cx + jr + 18) - 6, 6);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "right";
  ctx.fillText("to vacuum pump →", w - 6, base + 22);

  // Air inside the jar: fewer particles as the pump takes the air out.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - jr, base);
  ctx.lineTo(cx - jr, top + jr * 0.5);
  ctx.quadraticCurveTo(cx - jr, top, cx, top);
  ctx.quadraticCurveTo(cx + jr, top, cx + jr, top + jr * 0.5);
  ctx.lineTo(cx + jr, base);
  ctx.closePath();
  ctx.fillStyle = `rgba(56,189,248,${0.04 + 0.08 * p})`;
  ctx.fill();
  ctx.clip();
  const n = p > 0.003 ? Math.max(1, Math.round(AIR.length * p)) : 0;
  ctx.fillStyle = "rgba(165,243,252,0.7)";
  for (let i = 0; i < n; i++) {
    const a = AIR[i];
    const x = cx - jr + (a.x + 0.02 * Math.sin(t * 3 + a.ph)) * 2 * jr;
    const y = top + (a.y + 0.02 * Math.cos(t * 2.6 + a.ph)) * (base - top);
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Glass dome.
  ctx.strokeStyle = "rgba(186,230,253,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - jr, base);
  ctx.lineTo(cx - jr, top + jr * 0.5);
  ctx.quadraticCurveTo(cx - jr, top, cx, top);
  ctx.quadraticCurveTo(cx + jr, top, cx + jr, top + jr * 0.5);
  ctx.lineTo(cx + jr, base);
  ctx.stroke();
  ctx.fillStyle = "rgba(186,230,253,0.7)";
  ctx.fillRect(cx - 8, top - 8, 16, 8);

  // Electric bell hanging from the top: gong, hammer and wires.
  const gy = top + (base - top) * 0.52;
  const gr = Math.max(14, jr * 0.32);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 4, top);
  ctx.lineTo(cx - 4, gy - gr);
  ctx.moveTo(cx + 4, top);
  ctx.lineTo(cx + 4, gy - gr);
  ctx.stroke();
  const shake = Math.sin(t * 2 * Math.PI * 16);
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx + shake * 1.2, gy, gr, Math.PI, 0);
  ctx.lineTo(cx + gr + shake * 1.2, gy + 4);
  ctx.lineTo(cx - gr + shake * 1.2, gy + 4);
  ctx.closePath();
  ctx.fill();
  // The bell still vibrates: little shake lines beside it, whatever the pressure.
  ctx.strokeStyle = "rgba(253,224,71,0.85)";
  ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const x = cx + s * (gr + 5 + i * 5);
      ctx.beginPath();
      ctx.moveTo(x, gy - 8 + i * 2 + shake);
      ctx.lineTo(x + s * 2, gy - 2 + i * 2 - shake);
      ctx.stroke();
    }
  }
  // Hammer on an arm that swings 16 times a second.
  const hx = cx + gr * 0.9 + 6 + Math.max(0, shake) * 6;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + gr * 1.6, gy + gr * 0.9);
  ctx.lineTo(hx, gy - 2);
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(hx, gy - 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`Air in jar: ${p >= 0.01 ? Math.round(p * 100) : (p * 100).toFixed(2)}%`, 8, 16);
  ctx.textAlign = "right";
  ctx.fillStyle = level < SILENT_DB ? "#bef264" : "#67e8f9";
  ctx.fillText(level < SILENT_DB ? "silent outside" : `${Math.round(level)} dB outside`, w - 8, 16);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(253,224,71,0.8)";
  ctx.fillText("bell still vibrating", 8, h - 8);
}

function drawHall(ctx: CanvasRenderingContext2D, w: number, h: number, spec: HallSpec, s: HallSetup, T: number, target: { t: number; tol: number } | null, since: number | null, clapT: number) {
  ctx.font = FONT;
  const roomTop = 22;
  const roomBot = Math.round(h * 0.5);
  const left = 10;
  const right = w - 10;
  const floorH = 10;

  // Back wall.
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(left, roomTop, right - left, roomBot - roomTop);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, roomTop, right - left, roomBot - roomTop);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "left";
  ctx.fillText(`${spec.name}: ${spec.L} × ${spec.W} × ${spec.H} m`, left, roomTop - 7);

  // Curtains hang from both ends of the wall, inwards.
  const wallW = right - left;
  const cw = Math.min(14, (wallW * 0.38) / Math.max(1, LIMITS.curtains / 2));
  for (let i = 0; i < s.curtains; i++) {
    const side = i % 2;
    const k = Math.floor(i / 2);
    const x = side === 0 ? left + k * cw : right - (k + 1) * cw;
    const g = ctx.createLinearGradient(x, 0, x + cw, 0);
    g.addColorStop(0, "rgba(244,114,182,0.75)");
    g.addColorStop(0.5, "rgba(190,24,93,0.75)");
    g.addColorStop(1, "rgba(244,114,182,0.75)");
    ctx.fillStyle = g;
    ctx.fillRect(x, roomTop + 2, cw - 1, roomBot - roomTop - floorH - 2);
  }

  // Panels in a grid across the upper middle of the wall.
  const px0 = left + (LIMITS.curtains / 2) * cw + 6;
  const px1 = right - (LIMITS.curtains / 2) * cw - 6;
  const cols = 10;
  const rows = Math.max(4, Math.ceil(Math.max(LIMITS.panels, s.panels) / cols));
  const pw = (px1 - px0) / cols;
  const ph = Math.min(pw * 0.7, (roomBot - roomTop - floorH - 30) / rows);
  ctx.fillStyle = "rgba(167,139,250,0.8)";
  for (let i = 0; i < s.panels; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    ctx.fillRect(px0 + c * pw + 1, roomTop + 6 + r * ph, pw - 2, ph - 2);
  }

  // Floor: grey concrete or stone, brown carpet.
  ctx.fillStyle = s.carpet ? "rgba(180,83,9,0.75)" : spec.floor <= 0.01 ? "rgba(214,211,209,0.35)" : "rgba(148,163,184,0.35)";
  ctx.fillRect(left, roomBot - floorH, wallW, floorH);

  // Seats and people in a row in front of the wall.
  const shown = 20;
  const seatsShown = spec.seats ? shown : 0;
  const filled = spec.seats ? Math.round((Math.min(s.people, spec.seats) / spec.seats) * shown) : 0;
  const crowd = spec.seats ? 0 : Math.min(shown, Math.round(s.people / 10));
  const sx = (right - left - 20) / shown;
  for (let i = 0; i < Math.max(seatsShown, crowd); i++) {
    const x = left + 10 + (i + 0.5) * sx;
    const y = roomBot - floorH;
    if (spec.seats) {
      ctx.fillStyle = s.cushioned ? "#f59e0b" : "#78350f";
      ctx.fillRect(x - sx * 0.35, y - 9, sx * 0.7, 9);
    }
    if (i < filled || i < crowd) {
      ctx.fillStyle = "#67e8f9";
      ctx.beginPath();
      ctx.arc(x, y - 16, Math.min(4, sx * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - Math.min(3, sx * 0.25), y - 12, Math.min(6, sx * 0.5), 5);
    }
  }

  // Clap graph: loudness left in the hall (dB above the 60 dB-down line) against time.
  const gL = 30;
  const gR = w - 10;
  const gTop = roomBot + 22;
  const gBot = h - 20;
  const X = (sec: number) => gL + (sec / CLAP_WINDOW_S) * (gR - gL);
  const Y = (frac: number) => gBot - frac * (gBot - gTop);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("Clap", 4, gTop - 6);
  // Target band.
  const band = target ? { min: target.t - target.tol, max: target.t + target.tol } : SPEECH_RT;
  ctx.fillStyle = "rgba(190,242,100,0.1)";
  ctx.fillRect(X(band.min), gTop, X(band.max) - X(band.min), gBot - gTop);
  ctx.fillStyle = "rgba(190,242,100,0.7)";
  ctx.textAlign = "center";
  ctx.fillText(target ? `target ${target.t} s` : "speech 1–1.5 s", (X(band.min) + X(band.max)) / 2, gTop - 6);
  // Axis.
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gL, gTop);
  ctx.lineTo(gL, gBot);
  ctx.lineTo(gR, gBot);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (let sec = 0; sec < CLAP_WINDOW_S; sec++) ctx.fillText(`${sec}`, X(sec), gBot + 12);
  ctx.textAlign = "right";
  ctx.fillText(`${CLAP_WINDOW_S} s`, gR, gBot + 12);

  // Predicted decay: a straight line in decibels, reaching −60 dB at T.
  const env = (sec: number, rt: number) => Math.max(0, 1 + decayDb(sec, rt) / 60);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.moveTo(X(0), Y(1));
  ctx.lineTo(X(Math.min(T, CLAP_WINDOW_S)), Y(env(Math.min(T, CLAP_WINDOW_S), T)));
  ctx.stroke();
  ctx.setLineDash([]);
  if (T <= CLAP_WINDOW_S) {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(X(T), gBot, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = X(T) > gR - 50 ? "right" : "left";
    ctx.fillText(`T = ${T.toFixed(2)} s`, X(T) + (X(T) > gR - 50 ? -6 : 6), gBot - 6);
  } else {
    ctx.textAlign = "right";
    ctx.fillStyle = "#fde047";
    ctx.fillText(`T = ${T.toFixed(1)} s, still ringing →`, gR, gTop + 10);
  }

  // The clap itself: a noisy wave inside the envelope, drawn in real time.
  if (since !== null) {
    const upTo = Math.min(since, CLAP_WINDOW_S);
    const mid = Y(0.5);
    ctx.strokeStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    let first = true;
    for (let px = X(0); px <= X(upTo); px += 1.5) {
      const sec = ((px - gL) / (gR - gL)) * CLAP_WINDOW_S;
      const e = env(sec, clapT);
      const noise = Math.sin(px * 12.9898) * 43758.5453;
      const n = (noise - Math.floor(noise)) * 2 - 1;
      const y = mid - n * e * (gBot - gTop) * 0.5;
      if (first) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
      first = false;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.textAlign = "left";
}

function drawUltra(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  b: SteelBlock,
  probe: number,
  memory: { x: number; depth: number }[],
  found: boolean,
  pulse: Pulse | null,
  prog: number | null,
) {
  ctx.font = FONT;
  const left = 14;
  const right = w - 14;
  const bTop = 40;
  const bBot = Math.round(h * 0.55);
  const X = (m: number) => left + (m / b.length) * (right - left);
  const D = (m: number) => bTop + (m / b.thickness) * (bBot - bTop);

  // Steel block.
  const g = ctx.createLinearGradient(0, bTop, 0, bBot);
  g.addColorStop(0, "#64748b");
  g.addColorStop(1, "#334155");
  ctx.fillStyle = g;
  ctx.fillRect(left, bTop, right - left, bBot - bTop);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(left, bTop, right - left, bBot - bTop);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "left";
  ctx.fillText(`Steel block, ${b.length * 100} cm long, ${b.thickness * 100} cm thick`, left, bBot + 14);

  // The crack shows only once an echo has found it.
  if (found) {
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const x = X(b.crack.x0 + ((b.crack.x1 - b.crack.x0) * i) / steps);
      const y = D(b.crack.depth) + (i % 2 ? 2 : -2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Points mapped by earlier pulses.
  for (const m of memory) {
    ctx.fillStyle = m.depth < b.thickness ? "#f472b6" : "#a5f3fc";
    ctx.beginPath();
    ctx.arc(X(m.x), D(m.depth), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Probe on top.
  const px = X(probe);
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(px - 9, bTop - 16, 18, 14);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, bTop - 16);
  ctx.lineTo(px, 8);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = px > w - 60 ? "right" : "left";
  ctx.fillText("probe", px + (px > w - 60 ? -14 : 14), bTop - 6);

  // Pulse travelling down and back.
  if (pulse && prog !== null && prog < 1) {
    const goingDown = prog < 0.5;
    const d = goingDown ? (prog / 0.5) * pulse.depth : (1 - (prog - 0.5) / 0.5) * pulse.depth;
    ctx.strokeStyle = goingDown ? "#f0abfc" : "#fb923c";
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;
    for (let i = 0; i < 3; i++) {
      const y = D(d) + (goingDown ? -i * 4 : i * 4);
      if (y < bTop || y > bBot) continue;
      ctx.beginPath();
      ctx.moveTo(X(pulse.x) - 8 + i, y);
      ctx.lineTo(X(pulse.x) + 8 - i, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Echo graph (A-scan): voltage at the probe against time in microseconds.
  const gL = 30;
  const gR = w - 10;
  const gTop = bBot + 30;
  const gBot = h - 18;
  const T = (us: number) => gL + (us / SCAN_AXIS_US) * (gR - gL);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(gL, gBot);
  ctx.lineTo(gR, gBot);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  for (let us = 0; us <= SCAN_AXIS_US; us += 10) ctx.fillText(`${us}`, T(us), gBot + 12);
  ctx.textAlign = "right";
  ctx.fillText("µs", gR, gTop + 4);
  ctx.textAlign = "left";
  ctx.fillText("Echo", 2, gTop + 4);
  const done = pulse && prog !== null && prog >= 1 ? pulse : null;
  const echoUs = done ? scanEchoTime(b, done.x) * 1e6 : null;
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let px2 = gL; px2 <= gR; px2 += 1) {
    const us = ((px2 - gL) / (gR - gL)) * SCAN_AXIS_US;
    let v = 0;
    // Each pulse is a short burst: a bell-shaped spike with a little ringing.
    if (pulse) v += Math.exp(-((us - 0.8) ** 2) / 0.4) * (0.75 + 0.25 * Math.cos((us - 0.8) * 9));
    if (echoUs !== null) v += 0.7 * Math.exp(-((us - echoUs) ** 2) / 0.4) * (0.75 + 0.25 * Math.cos((us - echoUs) * 9));
    const y = gBot - 4 - Math.abs(v) * (gBot - gTop - 6);
    if (px2 === gL) ctx.moveTo(px2, y);
    else ctx.lineTo(px2, y);
  }
  ctx.stroke();
  if (echoUs !== null && done) {
    ctx.fillStyle = done.crack ? "#f472b6" : "#a5f3fc";
    ctx.textAlign = T(echoUs) > gR - 60 ? "right" : "left";
    ctx.fillText(`${echoUs.toFixed(1)} µs`, T(echoUs) + (T(echoUs) > gR - 60 ? -6 : 6), gTop + 10);
  }
  ctx.textAlign = "left";
}

function drawHearing(ctx: CanvasRenderingContext2D, w: number, h: number, f: number, who: AnimalId[]) {
  ctx.font = FONT;
  const gL = 84;
  const gR = w - 12;
  const top = 26;
  const bot = h - 26;
  const X = (hz: number) => gL + ((Math.log10(hz) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (gR - gL);

  // Bands: infrasound, audible to us, ultrasound.
  ctx.fillStyle = "rgba(167,139,250,0.12)";
  ctx.fillRect(gL, top, X(20) - gL, bot - top);
  ctx.fillStyle = "rgba(103,232,249,0.08)";
  ctx.fillRect(X(20), top, X(20000) - X(20), bot - top);
  ctx.fillStyle = "rgba(244,114,182,0.12)";
  ctx.fillRect(X(20000), top, gR - X(20000), bot - top);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(196,181,253,0.9)";
  if (X(20) - gL > 40) ctx.fillText("infra", (gL + X(20)) / 2, top - 8);
  ctx.fillStyle = "rgba(165,243,252,0.9)";
  ctx.fillText("audible to us", (X(20) + X(20000)) / 2, top - 8);
  ctx.fillStyle = "rgba(249,168,212,0.9)";
  ctx.fillText("ultrasound", (X(20000) + gR) / 2, top - 8);

  const rowH = (bot - top) / HEARING.length;
  HEARING.forEach((a, i) => {
    const y = top + i * rowH + rowH / 2;
    const hears = who.includes(a.id);
    ctx.textAlign = "left";
    ctx.fillStyle = hears ? "#ffffff" : "rgba(255,255,255,0.5)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(`${a.emoji} ${a.label}`, 6, y + 4);
    ctx.font = FONT;
    ctx.fillStyle = hears ? "rgba(190,242,100,0.85)" : "rgba(103,232,249,0.35)";
    const bh = Math.min(14, rowH * 0.55);
    ctx.fillRect(X(a.min), y - bh / 2, X(a.max) - X(a.min), bh);
  });

  // Axis ticks.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center";
  for (const [hz, label] of [
    [10, "10"],
    [100, "100"],
    [1000, "1k"],
    [10000, "10k"],
    [100000, "100k Hz"],
  ] as const) {
    ctx.fillText(label, X(hz), h - 10);
    ctx.fillRect(X(hz) - 0.5, bot, 1, 4);
  }

  // The chosen frequency.
  const fx = X(f);
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(fx, top - 2);
  ctx.lineTo(fx, bot + 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textAlign = "left";
}
