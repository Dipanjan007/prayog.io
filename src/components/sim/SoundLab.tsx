"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUDIBLE,
  MEDIA,
  displacement,
  distanceFromEcho,
  echoDelay,
  echoIsDistinct,
  excessPressure,
  waveNumber,
  wavelength,
  type MediumId,
} from "@/lib/sim/sound";

export type SoundMode = "wave" | "echo" | "sonar";

export interface SoundReading {
  mode: SoundMode;
  f: number;
  amp: number;
  medium: MediumId;
  v: number;
  lambda: number;
  playing: boolean;
  /** The last finished clap in Echo mode. */
  clap: { id: number; distance: number; delay: number; distinct: boolean } | null;
  /** The last finished SONAR ping. */
  ping: { id: number; depth: number; delay: number; mystery: boolean } | null;
}

interface Props {
  onReading?: (r: SoundReading) => void;
  /** Challenge: SONAR only, with a hidden seabed depth (m). */
  mystery?: { depth: number } | null;
}

/** Sound wave mode shows a 4 m strip of the medium. Lengths are to scale. */
const SPAN_M = 4;
/** Time is slowed down 500 times so the vibrations can be seen. */
const SLOW = 500;
/** Peak gain of the tone: kept low so it is safe on headphones. */
const TONE_MAX_GAIN = 0.06;
const CLAP_GAIN = 0.12;
const AIR_V = MEDIA.air.v;
const SEA_V = MEDIA.water.v;
const ECHO_RANGE = { min: 5, max: 100 };
const SONAR_RANGE = { min: 100, max: 3000 };
/** How long the clap animation lasts on screen (s), whatever the real echo time. */
const CLAP_ANIM_S = 2.2;

/** Jittered grid of air particles: rest x in metres, y from 0 to 1. Fixed seed, so it never flickers. */
const PARTICLES = (() => {
  let s = 12345;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const cols = 74;
  const rows = 10;
  const dx = (SPAN_M + 0.6) / cols;
  const out: { x: number; y: number }[] = [];
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) out.push({ x: -0.3 + (c + 0.5 + (rnd() - 0.5) * 0.7) * dx, y: (r + 0.15 + rnd() * 0.7) / rows });
  return out;
})();
/** The red particle we follow. */
const MARKED_X = 2;

type Pulse = { kind: "clap" | "ping"; start: number; anim: number; delay: number; distance: number; mystery: boolean; reported: boolean };
type AudioRig = { ctx: AudioContext; osc: OscillatorNode | null; gain: GainNode | null };

export default function SoundLab({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setModeState] = useState<SoundMode>("wave");
  const [f, setF] = useState(300);
  const [amp, setAmp] = useState(0.5);
  const [medium, setMedium] = useState<MediumId>("air");
  const [playing, setPlaying] = useState(false);
  const [hearClap, setHearClap] = useState(false);
  const [distance, setDistance] = useState(10);
  const [depth, setDepth] = useState(1200);
  const [clap, setClap] = useState<SoundReading["clap"]>(null);
  const [ping, setPing] = useState<SoundReading["ping"]>(null);
  const [busy, setBusy] = useState(false);
  const pulseRef = useRef<Pulse | null>(null);
  const audioRef = useRef<AudioRig | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SoundMode = mystery ? "sonar" : mode;
  const seaDepth = mystery?.depth ?? depth;
  const v = MEDIA[medium].v;
  const lambda = wavelength(v, f);

  // Everything the animation loop reads, kept fresh without restarting the loop.
  const params = useRef({ activeMode, f, amp, v, distance, seaDepth, mystery: !!mystery });
  useEffect(() => {
    params.current = { activeMode, f, amp, v, distance, seaDepth, mystery: !!mystery };
  });

  const setMode = (m: SoundMode) => {
    setModeState(m);
    setPlaying(false);
    pulseRef.current = null;
    setBusy(false);
  };

  // ---------- Audio (only ever started by a tap) ----------
  const getAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioRef.current = { ctx: new AC(), osc: null, gain: null };
    }
    const a = audioRef.current;
    if (a.ctx.state === "suspended") void a.ctx.resume();
    return a;
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const now = a.ctx.currentTime;
    if (playing && activeMode === "wave") {
      if (!a.osc || !a.gain) {
        const osc = a.ctx.createOscillator();
        const gain = a.ctx.createGain();
        osc.type = "sine";
        gain.gain.value = 0;
        osc.frequency.value = f;
        osc.connect(gain).connect(a.ctx.destination);
        osc.start();
        a.osc = osc;
        a.gain = gain;
      }
      a.osc.frequency.setTargetAtTime(f, now, 0.02);
      a.gain.gain.setTargetAtTime(TONE_MAX_GAIN * amp, now, 0.05);
    } else if (a.osc && a.gain) {
      a.gain.gain.setTargetAtTime(0, now, 0.03);
      a.osc.stop(now + 0.25);
      a.osc = null;
      a.gain = null;
    }
  }, [playing, activeMode, f, amp]);

  // Stop all sound when the student leaves the page or switches tab.
  useEffect(() => {
    const hide = () => {
      setPlaying(false);
      const a = audioRef.current;
      if (a && a.gain && a.osc) {
        a.gain.gain.value = 0;
        a.osc.stop();
        a.osc = null;
        a.gain = null;
      }
      if (a) void a.ctx.suspend();
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
      if (a) void a.ctx.close();
    };
  }, []);

  const playClap = (echoAfter: number) => {
    const a = audioRef.current;
    if (!a) return;
    const len = Math.floor(a.ctx.sampleRate * 0.06);
    const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len / 6));
    const t0 = a.ctx.currentTime + 0.02;
    for (const [when, g] of [
      [t0, CLAP_GAIN],
      [t0 + echoAfter, CLAP_GAIN * 0.45],
    ]) {
      const src = a.ctx.createBufferSource();
      const gain = a.ctx.createGain();
      gain.gain.value = g;
      src.buffer = buf;
      src.connect(gain).connect(a.ctx.destination);
      src.start(when);
    }
  };

  const fire = () => {
    const now = performance.now();
    if (activeMode === "echo") {
      const delay = echoDelay(distance, AIR_V);
      pulseRef.current = { kind: "clap", start: now, anim: CLAP_ANIM_S, delay, distance, mystery: false, reported: false };
      if (hearClap) playClap(delay);
    } else {
      const delay = echoDelay(seaDepth, SEA_V);
      pulseRef.current = { kind: "ping", start: now, anim: Math.max(1.6, delay), delay, distance: seaDepth, mystery: !!mystery, reported: false };
    }
    setBusy(true);
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    let phase = 0;
    let clapId = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
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

      if (P.activeMode === "wave") {
        phase = (phase + (2 * Math.PI * P.f * dt) / SLOW) % (2 * Math.PI);
        drawWave(ctx, w, h, phase, P.f, P.v, P.amp);
        return;
      }
      const pulse = pulseRef.current;
      let tSound = 0;
      let slow = 1;
      if (pulse) {
        const prog = Math.min(1, (now - pulse.start) / 1000 / pulse.anim);
        tSound = prog * pulse.delay;
        slow = pulse.anim / pulse.delay;
        if (prog >= 1 && !pulse.reported) {
          pulse.reported = true;
          clapId++;
          if (pulse.kind === "clap")
            setClap({ id: clapId, distance: pulse.distance, delay: pulse.delay, distinct: echoIsDistinct(pulse.distance, AIR_V) });
          else setPing({ id: clapId, depth: pulse.distance, delay: pulse.delay, mystery: pulse.mystery });
          setBusy(false);
        }
      }
      const live = pulse && pulse.kind === (P.activeMode === "echo" ? "clap" : "ping") ? pulse : null;
      if (P.activeMode === "echo") drawEcho(ctx, w, h, P.distance, live ? tSound : null, live ? slow : 1, live?.distance ?? P.distance);
      else drawSonar(ctx, w, h, P.seaDepth, P.mystery, live ? tSound : null, live ? slow : 1);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode: activeMode, f, amp, medium, v, lambda, playing, clap, ping });
  }, [activeMode, f, amp, medium, v, lambda, playing, clap, ping]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (getAudio()) setPlaying(true);
  };
  const toggleHearClap = () => {
    if (!hearClap) getAudio();
    setHearClap(!hearClap);
  };

  const band = f < AUDIBLE.min ? "infrasound" : f > AUDIBLE.max ? "ultrasound" : "audible";
  const lastClap = activeMode === "echo" ? clap : null;
  const lastPing = activeMode === "sonar" && ping && ping.mystery === !!mystery ? ping : null;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-ink/20 p-1 text-sm">
          {(["wave", "echo", "sonar"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-cream/10 text-cream" : "text-faint"}`}>
              {m === "wave" ? "Sound wave" : m === "echo" ? "Echo" : "SONAR"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-line bg-well sm:h-80"
        role="img"
        aria-label={
          activeMode === "wave"
            ? `Air particles in a longitudinal sound wave of ${f} hertz in ${MEDIA[medium].label.toLowerCase()}, with compressions and rarefactions moving right, and a graph of pressure against distance below`
            : activeMode === "echo"
              ? `A person claps ${distance} metres in front of a cliff and the sound reflects back as an echo`
              : `A ship sends an ultrasound pulse down to the seabed${mystery ? " at a hidden depth" : ` ${depth} metres below`} and times the echo`
        }
      />

      {activeMode === "wave" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Frequency" value={`${f} Hz`} />
            <Stat label="Wavelength" value={`${lambda < 10 ? lambda.toFixed(2) : lambda.toFixed(1)} m`} />
            <Stat label="Speed" value={`${v} m/s`} />
          </div>
          <p className="text-center text-xs text-faint tabular-nums">
            v = f × λ = {f} × {lambda.toFixed(3)} = {Math.round(f * lambda)} m/s
          </p>
          <Slider label="Frequency (pitch)" value={`${f} Hz`} min={100} max={1000} step={10} v={f} onChange={setF} />
          <Slider label="Amplitude (loudness)" value={`${Math.round(amp * 100)}%`} min={0.1} max={1} step={0.05} v={amp} onChange={setAmp} />
          <Choice options={(Object.keys(MEDIA) as MediumId[]).map((id) => ({ id, label: MEDIA[id].label }))} value={medium} onChange={setMedium} />
          <HearingStrip f={f} band={band} />
          <button
            className={`rounded-xl border px-3 py-2 text-sm ${playing ? "chip-on" : "border-line text-muted"}`}
            onClick={togglePlay}
          >
            {playing ? "■ Stop the tone" : "▶ Play this tone (quiet)"}
          </button>
        </>
      )}

      {activeMode === "echo" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Echo time" value={lastClap ? `${lastClap.delay.toFixed(3)} s` : "–"} />
            <Stat label="Distance = v × t ÷ 2" value={lastClap ? `${distanceFromEcho(lastClap.delay, AIR_V).toFixed(1)} m` : "–"} />
          </div>
          {lastClap && (
            <p className={`text-center text-sm ${lastClap.distinct ? "text-sage-300" : "text-ochre-200"}`}>
              {lastClap.distinct
                ? `Clear echo! It came back ${lastClap.delay.toFixed(3)} s later, which is more than 0.1 s.`
                : `The echo came back after only ${lastClap.delay.toFixed(3)} s. That is less than 0.1 s, so it blends into the clap.`}
            </p>
          )}
          <Slider label="Distance to the cliff" value={`${distance} m`} min={ECHO_RANGE.min} max={ECHO_RANGE.max} step={1} v={distance} onChange={setDistance} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={fire} disabled={busy}>
              👏 Clap
            </button>
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${hearClap ? "chip-on" : "border-line text-muted"}`}
              onClick={toggleHearClap}
            >
              {hearClap ? "🔈 Sound on" : "🔇 Sound off"}
            </button>
          </div>
          <p className="text-center text-xs text-faint">Speed of sound in air: {AIR_V} m/s. The animation runs in slow motion. The timer shows real sound time.</p>
        </>
      )}

      {activeMode === "sonar" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Echo time" value={lastPing ? `${lastPing.delay.toFixed(3)} s` : "–"} />
            <Stat label="Depth = v × t ÷ 2" value={lastPing ? (mystery ? "Your turn" : `${Math.round(distanceFromEcho(lastPing.delay, SEA_V))} m`) : "–"} />
          </div>
          {!mystery && <Slider label="Depth of the sea" value={`${depth} m`} min={SONAR_RANGE.min} max={SONAR_RANGE.max} step={10} v={depth} onChange={setDepth} />}
          <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={fire} disabled={busy}>
            📡 Send an ultrasound ping
          </button>
          <p className="text-center text-xs text-faint">
            Speed of sound in sea water: about {SEA_V} m/s. SONAR uses ultrasound, so you could not hear the ping.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl panel px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className="font-display text-lg tabular-nums">{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl panel px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-cream">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "chip-on" : "border-line text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Log scale from 10 Hz to 100 kHz showing where the current tone sits. */
function HearingStrip({ f, band }: { f: number; band: string }) {
  const pos = (hz: number) => ((Math.log10(hz) - 1) / 4) * 100;
  return (
    <div className="rounded-2xl panel px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted">Hearing range</span>
        <span className="text-cream">{band === "audible" ? "Humans can hear this" : band}</span>
      </div>
      <div className="relative mt-2 h-5 overflow-hidden rounded-full text-[10px] leading-5">
        <div className="absolute inset-y-0 left-0 bg-heather-400/25" style={{ width: `${pos(20)}%` }} />
        <div className="absolute inset-y-0 bg-saffron-300/25 text-center text-saffron-100" style={{ left: `${pos(20)}%`, width: `${pos(20000) - pos(20)}%` }}>
          audible
        </div>
        <div className="absolute inset-y-0 right-0 bg-brick-400/25 text-center text-brick-100" style={{ left: `${pos(20000)}%` }}>
          ultrasound
        </div>
        <div className="absolute inset-y-0 w-1 -translate-x-1/2 rounded bg-cream" style={{ left: `${pos(f)}%` }} />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-faint">
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(20)}%` }}>
          20 Hz
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(1000)}%` }}>
          1 kHz
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(20000)}%` }}>
          20 kHz
        </span>
      </div>
    </div>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";

function drawWave(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number, f: number, v: number, amp: number) {
  const left = 30;
  const right = w - 8;
  const pxm = (right - left) / SPAN_M;
  const X = (m: number) => left + m * pxm;
  const k = waveNumber(v, f);
  const lambda = wavelength(v, f);
  // Real particle swings are far smaller than a millimetre. The drawing makes them
  // big enough to see, but keeps them under 1/k so particles never pass each other.
  const s0 = amp * Math.min(0.6 / k, 0.25);
  const bandTop = 22;
  const bandBot = Math.round(h * 0.5);
  ctx.font = FONT;

  // Loudspeaker: its cone moves with the air next to it.
  const cone = displacement(0, phase, s0, k) * pxm;
  ctx.fillStyle = "rgba(240,233,221,0.25)";
  ctx.fillRect(4, (bandTop + bandBot) / 2 - 12, 8, 24);
  ctx.strokeStyle = "rgba(240,233,221,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, (bandTop + bandBot) / 2 - 10);
  ctx.lineTo(20 + cone, bandTop + 6);
  ctx.moveTo(12, (bandTop + bandBot) / 2 + 10);
  ctx.lineTo(20 + cone, bandBot - 6);
  ctx.moveTo(20 + cone, bandTop + 6);
  ctx.lineTo(20 + cone, bandBot - 6);
  ctx.stroke();

  // Air particles.
  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 4, bandTop, right - left + 8, bandBot - bandTop);
  ctx.clip();
  const r = Math.max(1.4, Math.min(2.2, pxm / 60));
  for (const p of PARTICLES) {
    const x = p.x + displacement(p.x, phase, s0, k);
    const pr = excessPressure(p.x, phase, k);
    ctx.fillStyle = `rgba(165,243,252,${0.5 + 0.4 * amp * pr})`;
    ctx.beginPath();
    ctx.arc(X(x), bandTop + 4 + p.y * (bandBot - bandTop - 8), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // The followed particle and its rest position.
  const my = (bandTop + bandBot) / 2;
  ctx.strokeStyle = "rgba(251,113,133,0.5)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(MARKED_X), bandTop);
  ctx.lineTo(X(MARKED_X), bandBot);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.arc(X(MARKED_X + displacement(MARKED_X, phase, s0, k)), my, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // C and R labels above the band, at pressure peaks and troughs.
  ctx.textAlign = "center";
  const firstC = (phase + Math.PI) / k;
  for (let n = -Math.ceil(SPAN_M / lambda) - 1; n <= Math.ceil(SPAN_M / lambda) + 1; n++) {
    for (const [off, label, color] of [
      [0, "C", "#67e8f9"],
      [lambda / 2, "R", "rgba(240,233,221,0.45)"],
    ] as const) {
      const x = firstC + n * lambda + off;
      if (x < 0.05 || x > SPAN_M - 0.05) continue;
      ctx.fillStyle = color;
      ctx.fillText(label, X(x), 15);
    }
  }

  // Pressure graph.
  const labelY = bandBot + 15;
  const gTop = bandBot + 22;
  const gBot = h - 22;
  const mid = (gTop + gBot) / 2;
  const A = ((gBot - gTop) / 2) * 0.92;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(240,233,221,0.6)";
  ctx.fillText("Pressure", 4, labelY);
  ctx.fillStyle = "rgba(240,233,221,0.4)";
  ctx.textAlign = "center";
  ctx.fillText(`slowed ${SLOW}×`, w / 2, labelY);
  // 1 m scale bar.
  ctx.strokeStyle = "rgba(240,233,221,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(right - pxm, labelY - 4);
  ctx.lineTo(right, labelY - 4);
  ctx.moveTo(right - pxm, labelY - 8);
  ctx.lineTo(right - pxm, labelY);
  ctx.moveTo(right, labelY - 8);
  ctx.lineTo(right, labelY);
  ctx.stroke();
  ctx.fillStyle = "rgba(240,233,221,0.6)";
  ctx.textAlign = "right";
  ctx.fillText("1 m", right - pxm - 4, labelY);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(240,233,221,0.4)";
  ctx.fillText("+", 8, gTop + 8);
  ctx.fillText("−", 8, gBot);
  ctx.strokeStyle = "rgba(240,233,221,0.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(left, mid);
  ctx.lineTo(right, mid);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  for (let px = 0; px <= right - left; px += 2) {
    const x = px / pxm;
    const y = mid - A * amp * excessPressure(x, phase, k);
    if (px === 0) ctx.moveTo(left + px, y);
    else ctx.lineTo(left + px, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Wavelength bracket between two neighbouring compressions.
  const by = h - 8;
  ctx.fillStyle = "rgba(240,233,221,0.75)";
  ctx.strokeStyle = "rgba(240,233,221,0.6)";
  ctx.lineWidth = 1;
  // Start the bracket on a compression (peak); if a whole wave does not fit from there, use a rarefaction (trough).
  let x1 = firstC % lambda;
  if (x1 < 0) x1 += lambda;
  let level = mid - A * amp;
  if (x1 + lambda > SPAN_M) {
    x1 = (x1 + lambda / 2) % lambda;
    level = mid + A * amp;
  }
  if (x1 + lambda <= SPAN_M) {
    if (x1 + lambda * 2 <= SPAN_M && x1 * pxm < 40) x1 += lambda;
    const a = X(x1);
    const b = X(x1 + lambda);
    ctx.beginPath();
    ctx.moveTo(a, by - 10);
    ctx.lineTo(a, by - 4);
    ctx.lineTo(b, by - 4);
    ctx.lineTo(b, by - 10);
    ctx.stroke();
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(a, level);
    ctx.lineTo(a, by - 10);
    ctx.moveTo(b, level);
    ctx.lineTo(b, by - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    const text = `λ = ${lambda.toFixed(2)} m`;
    const tw = ctx.measureText(text).width;
    const tx = Math.min(right - tw / 2, Math.max(left + tw / 2, (a + b) / 2));
    ctx.fillStyle = "#13110f";
    ctx.fillRect(tx - tw / 2 - 3, by - 13, tw + 6, 14);
    ctx.fillStyle = "rgba(240,233,221,0.85)";
    ctx.textAlign = "center";
    ctx.fillText(text, tx, by - 2);
  } else {
    ctx.textAlign = "right";
    ctx.fillText(lambda > SPAN_M ? `λ = ${lambda.toFixed(1)} m, longer than this 4 m view` : `λ = ${lambda.toFixed(2)} m`, right, by);
  }
  ctx.textAlign = "left";
}

function stopwatch(ctx: CanvasRenderingContext2D, w: number, t: number | null, slow: number) {
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#fde047";
  ctx.fillText(`⏱ ${(t ?? 0).toFixed(3)} s`, 8, 18);
  if (t !== null && slow > 1.2) {
    ctx.font = FONT;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(240,233,221,0.5)";
    ctx.fillText(`slow motion ×${Math.round(slow)}`, w - 8, 18);
  }
  ctx.font = FONT;
  ctx.textAlign = "left";
}

function arcs(ctx: CanvasRenderingContext2D, cx: number, cy: number, rPx: number, a0: number, a1: number, color: string) {
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  for (let i = 0; i < 3; i++) {
    const rr = rPx - i * 5;
    if (rr <= 1) continue;
    ctx.globalAlpha = 1 - i * 0.3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, a0, a1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawEcho(ctx: CanvasRenderingContext2D, w: number, h: number, d: number, tSound: number | null, slow: number, pulseD: number) {
  const ground = Math.round(h * 0.76);
  const x0 = 30;
  const pxm = (w - x0 - 44) / ECHO_RANGE.max;
  const wallX = x0 + d * pxm;
  const mouthY = ground - 44;
  ctx.font = FONT;

  // Ground.
  ctx.fillStyle = "rgba(132,204,22,0.12)";
  ctx.fillRect(0, ground, w, h - ground);
  ctx.strokeStyle = "rgba(132,204,22,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(w, ground);
  ctx.stroke();

  // Cliff.
  ctx.fillStyle = "#57534e";
  ctx.strokeStyle = "#a8a29e";
  ctx.beginPath();
  ctx.moveTo(wallX, ground);
  ctx.lineTo(wallX + 2, 34);
  ctx.lineTo(wallX + 22, 26);
  ctx.lineTo(w, 40);
  ctx.lineTo(w, ground);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Person.
  ctx.strokeStyle = "rgba(240,233,221,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x0, ground - 52, 7, 0, Math.PI * 2);
  ctx.moveTo(x0, ground - 45);
  ctx.lineTo(x0, ground - 20);
  ctx.lineTo(x0 - 7, ground);
  ctx.moveTo(x0, ground - 20);
  ctx.lineTo(x0 + 7, ground);
  ctx.moveTo(x0, ground - 38);
  ctx.lineTo(x0 + 11, ground - 42);
  ctx.moveTo(x0, ground - 38);
  ctx.lineTo(x0 + 11, ground - 36);
  ctx.stroke();

  // Distance arrow.
  const ay = ground + 16;
  ctx.strokeStyle = "rgba(240,233,221,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, ay - 5);
  ctx.lineTo(x0, ay + 5);
  ctx.moveTo(wallX, ay - 5);
  ctx.lineTo(wallX, ay + 5);
  ctx.moveTo(x0, ay);
  ctx.lineTo(wallX, ay);
  ctx.stroke();
  const label = `d = ${d} m`;
  const tw = ctx.measureText(label).width;
  const lx = Math.min(w - tw / 2 - 4, Math.max(tw / 2 + 4, (x0 + wallX) / 2));
  ctx.fillStyle = "#13110f";
  ctx.fillRect(lx - tw / 2 - 3, ay + 4, tw + 6, 14);
  ctx.fillStyle = "rgba(240,233,221,0.85)";
  ctx.textAlign = "center";
  ctx.fillText(label, lx, ay + 15);
  ctx.textAlign = "left";

  // Sound pulse. After the cliff, the reflected wave spreads as if it came from a mirror image of the source behind the cliff.
  if (tSound !== null) {
    const r = AIR_V * tSound;
    const wall = x0 + pulseD * pxm;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, wall, ground);
    ctx.clip();
    if (r <= pulseD) arcs(ctx, x0 + 12, mouthY, r * pxm, -0.7, 0.7, "#fde047");
    else arcs(ctx, x0 + 12 + 2 * pulseD * pxm, mouthY, r * pxm, Math.PI - 0.7, Math.PI + 0.7, "#fb923c");
    ctx.restore();
    if (r >= 2 * pulseD - 1e-6) {
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillStyle = "#fb923c";
      ctx.fillText("echo heard", 96, 18);
      ctx.font = FONT;
    }
  }
  stopwatch(ctx, w, tSound, slow);
}

function drawSonar(ctx: CanvasRenderingContext2D, w: number, h: number, depth: number, mystery: boolean, tSound: number | null, slow: number) {
  const sea = Math.round(h * 0.24);
  const shipX = w * 0.42;
  const floorMax = h - 18;
  const floorY = mystery ? h - 34 : sea + 10 + (depth / SONAR_RANGE.max) * (floorMax - sea - 10);
  const pxm = (floorY - sea) / depth;
  ctx.font = FONT;

  // Sea.
  const g = ctx.createLinearGradient(0, sea, 0, h);
  g.addColorStop(0, "rgba(14,165,233,0.25)");
  g.addColorStop(1, "rgba(14,165,233,0.06)");
  ctx.fillStyle = g;
  ctx.fillRect(0, sea, w, h - sea);
  ctx.strokeStyle = "rgba(125,211,252,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const y = sea + Math.sin(x / 14) * 1.5;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Seabed.
  ctx.fillStyle = "#78716c";
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 6) ctx.lineTo(x, floorY + Math.sin(x / 23) * 3 + Math.sin(x / 7) * 1.2);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Ship.
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(shipX - 34, sea - 12);
  ctx.lineTo(shipX + 34, sea - 12);
  ctx.lineTo(shipX + 24, sea + 4);
  ctx.lineTo(shipX - 24, sea + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(shipX - 12, sea - 24, 20, 12);
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(shipX - 2, sea - 32, 4, 8);

  // Depth marker.
  const mx = w - 26;
  ctx.strokeStyle = "rgba(240,233,221,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx - 5, sea);
  ctx.lineTo(mx + 5, sea);
  ctx.moveTo(mx, sea);
  ctx.lineTo(mx, floorY);
  ctx.moveTo(mx - 5, floorY);
  ctx.lineTo(mx + 5, floorY);
  ctx.stroke();
  const text = mystery ? "depth = ?" : `${depth} m`;
  const tw = ctx.measureText(text).width;
  const ty = Math.max(sea + 14, (sea + floorY) / 2);
  ctx.fillStyle = "#13110f";
  ctx.fillRect(mx - tw - 10, ty - 11, tw + 6, 14);
  ctx.fillStyle = "rgba(240,233,221,0.85)";
  ctx.textAlign = "right";
  ctx.fillText(text, mx - 6, ty);
  ctx.textAlign = "left";

  // Ultrasound pulse: down to the seabed, then back up as if from a mirror image below it.
  if (tSound !== null) {
    const r = SEA_V * tSound;
    const sy = sea + 4;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, sea, w, floorY - sea);
    ctx.clip();
    if (r <= depth) arcs(ctx, shipX, sy, r * pxm, Math.PI / 2 - 0.45, Math.PI / 2 + 0.45, "#f0abfc");
    else arcs(ctx, shipX, sy + 2 * depth * pxm, r * pxm, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45, "#fb923c");
    ctx.restore();
    if (r >= 2 * depth - 1e-6) {
      ctx.fillStyle = "#fb923c";
      ctx.fillText("echo received", shipX + 38, sea - 6);
    } else {
      ctx.fillStyle = "rgba(240,171,252,0.8)";
      ctx.fillText("ultrasound, 50 kHz", 8, sea + 18);
    }
  }
  stopwatch(ctx, w, tSound, slow);
}
