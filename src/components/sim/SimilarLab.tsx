"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  BASE,
  BPT_TRI,
  BUILDING,
  K,
  STICK,
  SUN,
  T,
  TILT,
  angles,
  bptCut,
  bptRatios,
  closeEnough,
  corners,
  ratioText,
  ratiosMatch,
  shadowLen,
  sunFor,
  type ShadowMystery,
  type V,
} from "@/lib/sim/similar";

export type SimilarMode = "scale" | "bpt" | "shadow";

export type SimilarReading =
  | { mode: "scale"; k: number }
  | { mode: "bpt"; t: number; tilt: number; onSide: boolean; match: boolean }
  | { mode: "shadow"; sun: number; s: number; S: number }
  | { mode: "guess"; id: string; guess: number; ok: boolean };

interface Props {
  onReading?: (r: SimilarReading) => void;
  /** Challenge: an object whose height the student works out from shadows and types in. */
  mystery?: ShadowMystery | null;
}

const COL = { A: "#f472b6", B: "#22d3ee", C: "#a3e635", tri: "#ffffff", copy: "#a78bfa", sun: "#facc15" };
const MODES: [SimilarMode, string][] = [
  ["scale", "Scale"],
  ["bpt", "Parallel line"],
  ["shadow", "Shadows"],
];
const f2 = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? `${r}` : `${r}`.replace(/(\.\d)$/, "$1");
};
const round3 = (v: number) => Math.round(v * 1000) / 1000;

export default function SimilarLab({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SimilarMode>("scale");
  const [k, setK] = useState(1.5);
  const [t, setT] = useState(0.5);
  const [tilt, setTilt] = useState(0);
  const [sun, setSun] = useState(30);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SimilarMode = mystery ? "shadow" : mode;
  const cut = bptCut(t, tilt);
  const match = cut.onSide && ratiosMatch(cut);
  const s = shadowLen(STICK, sun);
  const S = shadowLen(BUILDING, sun);

  useEffect(() => {
    if (mystery) return;
    if (activeMode === "scale") onReadingRef.current?.({ mode: "scale", k });
    else if (activeMode === "bpt") onReadingRef.current?.({ mode: "bpt", t, tilt, onSide: cut.onSide, match });
    else onReadingRef.current?.({ mode: "shadow", sun, s, S });
  }, [mystery, activeMode, k, t, tilt, cut.onSide, match, sun, s, S]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "scale") drawScale(ctx, size.w, size.h, k);
    else if (activeMode === "bpt") drawBpt(ctx, size.w, size.h, t, tilt);
    else drawShadows(ctx, size.w, size.h, sun, mystery, checked);
  }, [size, activeMode, k, t, tilt, sun, mystery, checked]);

  const check = () => {
    if (!mystery) return;
    const g = Number(guess.replace(",", "."));
    const ok = guess.trim() !== "" && closeEnough(g, mystery.H);
    setChecked(ok);
    onReadingRef.current?.({ mode: "guess", id: mystery.id, guess: g, ok });
  };

  const ang = angles(BASE);
  const { left, right } = bptRatios(cut);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl px-1 py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "scale"
            ? `Triangle ABC with sides 4, 6 and 5 cm, and a copy PQR scaled by k = ${k}`
            : activeMode === "bpt"
              ? `Triangle ABC with a line DE, tilted ${tilt}° from parallel to BC. AD ÷ DB = ${ratioText(left)}, AE ÷ EC = ${cut.onSide ? ratioText(right) : "none"}`
              : mystery
                ? `A ${mystery.h} m stick casts a ${mystery.s} m shadow; the ${mystery.label.toLowerCase()} casts a ${mystery.S} m shadow`
                : `Sun ${sun}° up: the 1 m stick casts a ${f2(s)} m shadow and the 12 m building casts a ${f2(S)} m shadow`
        }
      />

      {activeMode === "scale" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="PQ ÷ AB" value={`${f2(BASE.AB * k)} ÷ 4 = ${k}`} colour="text-pink-200" />
            <Readout label="QR ÷ BC" value={`${f2(BASE.BC * k)} ÷ 6 = ${k}`} colour="text-cyan-200" />
            <Readout label="RP ÷ CA" value={`${f2(BASE.CA * k)} ÷ 5 = ${k}`} colour="text-lime-200" />
          </div>
          <p className="text-center text-xs text-white/60">
            ∠A = ∠P = {ang.A.toFixed(1)}° · ∠B = ∠Q = {ang.B.toFixed(1)}° · ∠C = ∠R = {ang.C.toFixed(1)}°
          </p>
          <Stepper label="Scale factor k" colour={COL.copy} value={k} unit="" range={K} onChange={setK} fmt={(v) => `${v}`} />
        </>
      )}

      {activeMode === "bpt" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="AD ÷ DB" value={`${f2(cut.AD)} ÷ ${f2(cut.DB)} = ${ratioText(left)}`} colour="text-pink-200" />
            <Readout label="AE ÷ EC" value={cut.onSide ? `${f2(cut.AE)} ÷ ${f2(cut.EC)} = ${ratioText(right)}` : "misses AC"} colour="text-cyan-200" />
          </div>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm ${match ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.03] text-white/70"}`}
          >
            {match ? "Equal ratios: DE ∥ BC" : tilt === 0 ? "DE ∥ BC" : cut.onSide ? "Ratios differ: DE is not parallel to BC" : "Tilted so far that the line misses side AC"}
          </div>
          <Stepper label="D along AB (AD ÷ AB)" colour={COL.A} value={t} unit="" range={T} onChange={setT} fmt={(v) => v.toFixed(2)} />
          <Stepper label="Tilt DE away from parallel" colour={COL.C} value={tilt} unit="°" range={TILT} onChange={setTilt} fmt={(v) => `${v}`} />
        </>
      )}

      {activeMode === "shadow" &&
        (mystery ? (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Readout label="Stick h" value={`${mystery.h} m`} colour="text-cyan-200" />
              <Readout label="Stick shadow s" value={`${mystery.s} m`} colour="text-cyan-200" />
              <Readout label="Its shadow S" value={mystery.halfBase ? `${mystery.halfBase} + ${mystery.S - mystery.halfBase} m` : `${mystery.S} m`} colour="text-yellow-200" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm text-white/70">Height of the {mystery.label.toLowerCase()} H = h × (S ÷ s)</div>
              <div className="mt-2 flex gap-2">
                <input
                  inputMode="decimal"
                  size={6}
                  value={guess}
                  onChange={(e) => {
                    setGuess(e.target.value);
                    setChecked(null);
                  }}
                  placeholder="Your answer"
                  aria-label="Your answer in metres"
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white tabular-nums"
                />
                <span className="self-center text-sm text-white/60">m</span>
                <button className="btn-primary !px-4 !py-2 text-sm" onClick={check} disabled={!guess.trim()}>
                  Check
                </button>
              </div>
              {checked !== null && (
                <p className={`mt-2 text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
                  {checked
                    ? `Spot on! It is ${mystery.H} m tall.`
                    : mystery.halfBase
                      ? "Not within 0.5 m. Did you measure the shadow from the centre, adding half the base?"
                      : "Not within 0.5 m. Work out S ÷ s first, then multiply by h."}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <Readout label="Stick shadow s" value={`${f2(s)} m`} colour="text-cyan-200" />
              <Readout label="Building shadow S" value={`${f2(S)} m`} colour="text-yellow-200" />
              <Readout label="h ÷ s" value={`${round3(STICK / s)}`} colour="text-cyan-200" />
              <Readout label="H ÷ S" value={`${round3(BUILDING / S)}`} colour="text-yellow-200" />
            </div>
            <Stepper label="Sun's height in the sky" colour={COL.sun} value={sun} unit="°" range={SUN} onChange={setSun} fmt={(v) => `${v}`} />
            <p className="text-center text-xs text-white/40">
              Stick h = {STICK} m, building H = {BUILDING} m. The Sun is at the same angle for both, so h ÷ s = H ÷ S.
            </p>
          </>
        ))}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-sm tabular-nums sm:text-base ${colour}`}>{value}</div>
    </div>
  );
}

/** A slider with − and + buttons, for fingers as well as mice. */
function Stepper(p: {
  label: string;
  colour: string;
  value: number;
  unit: string;
  range: { min: number; max: number; step: number };
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  const { min, max, step } = p.range;
  // Snap to the slider's steps and keep 3 decimals, so 0.1 + 0.05 shows as 0.15.
  const set = (v: number) => p.onChange(Math.round(Math.min(max, Math.max(min, min + Math.round((v - min) / step) * step)) * 1000) / 1000);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">
          {p.fmt(p.value)}
          {p.unit}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button aria-label={`${p.label}: less`} onClick={() => set(p.value - step)} className="h-8 w-9 shrink-0 rounded-lg border border-white/10 text-white/80">
          −
        </button>
        <input aria-label={p.label} type="range" className="range w-full" min={min} max={max} step={step} value={p.value} onChange={(e) => set(Number(e.target.value))} />
        <button aria-label={`${p.label}: more`} onClick={() => set(p.value + step)} className="h-8 w-9 shrink-0 rounded-lg border border-white/10 text-white/80">
          +
        </button>
      </div>
    </div>
  );
}

/* ---------- Drawing ---------- */

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, w: number, h: number, align: CanvasTextAlign = "center") {
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  const tw = ctx.measureText(text).width;
  const half = align === "center" ? tw / 2 : 0;
  let cx = x;
  if (align === "center") cx = Math.min(w - half - 3, Math.max(half + 3, x));
  else if (align === "left") cx = Math.min(w - tw - 3, Math.max(3, x));
  else cx = Math.min(w - 3, Math.max(tw + 3, x));
  ctx.fillText(text, cx, Math.min(h - 4, Math.max(12, y)));
}

/** A triangle with its corner names outside, its side lengths beside each side, and coloured angle arcs. */
function triangle(
  ctx: CanvasRenderingContext2D,
  P: (p: V) => V,
  pts: [V, V, V],
  names: [string, string, string],
  sides: [string, string, string],
  stroke: string,
  w: number,
  h: number,
) {
  const s = pts.map(P);
  const g = { x: (s[0].x + s[1].x + s[2].x) / 3, y: (s[0].y + s[1].y + s[2].y) / 3 };
  ctx.fillStyle = stroke + "18";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  s.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const cols = [COL.A, COL.B, COL.C];
  s.forEach((p, i) => {
    const a = s[(i + 1) % 3];
    const b = s[(i + 2) % 3];
    const a1 = Math.atan2(a.y - p.y, a.x - p.x);
    const a2 = Math.atan2(b.y - p.y, b.x - p.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    ctx.strokeStyle = cols[i];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, a1, a1 + d, d < 0);
    ctx.stroke();
    // Corner name, pushed out from the centre.
    const ux = p.x - g.x;
    const uy = p.y - g.y;
    const len = Math.hypot(ux, uy) || 1;
    ctx.font = "bold 13px system-ui, sans-serif";
    label(ctx, names[i], p.x + (ux / len) * 14, p.y + (uy / len) * 14 + 4, cols[i], w, h);
  });
  // Side lengths: side i joins corner i and corner i + 1.
  ctx.font = "11px system-ui, sans-serif";
  for (let i = 0; i < 3; i++) {
    const p = s[i];
    const q = s[(i + 1) % 3];
    const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    const ux = m.x - g.x;
    const uy = m.y - g.y;
    const len = Math.hypot(ux, uy) || 1;
    label(ctx, sides[i], m.x + (ux / len) * 14, m.y + (uy / len) * 14 + 4, "rgba(255,255,255,0.8)", w, h);
  }
}

function drawScale(ctx: CanvasRenderingContext2D, w: number, h: number, k: number) {
  const base = corners(BASE.AB, BASE.BC, BASE.CA);
  const copy = corners(BASE.AB * k, BASE.BC * k, BASE.CA * k);
  const gap = 1.6;
  const spanX = BASE.BC + gap + BASE.BC * k;
  const spanY = Math.max(base.A.y, copy.A.y);
  const px = Math.min((w - 50) / spanX, (h - 56) / spanY);
  const ox = (w - spanX * px) / 2;
  const groundY = h - 26;
  const P1 = (p: V) => ({ x: ox + p.x * px, y: groundY - p.y * px });
  const P2 = (p: V) => ({ x: ox + (BASE.BC + gap + p.x) * px, y: groundY - p.y * px });
  // Side order: corner i to corner i + 1, so AB, BC, CA.
  triangle(ctx, P1, [base.A, base.B, base.C], ["A", "B", "C"], ["4", "6", "5"], COL.tri, w, h);
  triangle(ctx, P2, [copy.A, copy.B, copy.C], ["P", "Q", "R"], [f2(4 * k), f2(6 * k), f2(5 * k)], COL.copy, w, h);
  ctx.font = "12px system-ui, sans-serif";
  label(ctx, `△PQR ~ △ABC, k = ${k}`, w / 2, 16, COL.copy, w, h);
  ctx.textAlign = "left";
}

function drawBpt(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, tilt: number) {
  const { A, B, C } = BPT_TRI;
  const px = Math.min((w - 60) / 7, (h - 50) / 6);
  const ox = (w - 7 * px) / 2;
  const oy = h - 24;
  const P = (p: V) => ({ x: ox + p.x * px, y: oy - p.y * px });
  const cut = bptCut(t, tilt);
  const match = cut.onSide && ratiosMatch(cut);

  // Sides, coloured by the pieces the theorem compares.
  const seg = (p: V, q: V, col: string, width = 3) => {
    const a = P(p);
    const b = P(q);
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  seg(B, C, "rgba(255,255,255,0.8)");
  seg(A, cut.D, COL.A);
  seg(cut.D, B, COL.copy);
  if (cut.onSide) {
    seg(A, cut.E, COL.B);
    seg(cut.E, C, COL.C);
  } else seg(A, C, "rgba(255,255,255,0.5)");

  // The line through D, drawn a little past both ends.
  const dir = { x: Math.cos((tilt * Math.PI) / 180), y: Math.sin((tilt * Math.PI) / 180) };
  const end = cut.onSide ? cut.E : { x: cut.D.x + dir.x * 6, y: cut.D.y + dir.y * 6 };
  const ext = 0.6;
  const L1 = { x: cut.D.x - dir.x * ext, y: cut.D.y - dir.y * ext };
  const L2 = { x: end.x + dir.x * ext, y: end.y + dir.y * ext };
  seg(L1, L2, match ? "#a3e635" : "#facc15", 2);
  if (tilt !== 0) {
    // A faint parallel for comparison.
    ctx.setLineDash([4, 4]);
    const parEnd = bptCut(t, 0).E;
    seg(cut.D, parEnd, "rgba(255,255,255,0.35)", 1.5);
    ctx.setLineDash([]);
  }

  ctx.font = "bold 13px system-ui, sans-serif";
  const a = P(A);
  const b = P(B);
  const c = P(C);
  const d = P(cut.D);
  label(ctx, "A", a.x, a.y - 8, "#fff", w, h);
  label(ctx, "B", b.x - 10, b.y + 4, "#fff", w, h);
  label(ctx, "C", c.x + 10, c.y + 4, "#fff", w, h);
  label(ctx, "D", d.x - 12, d.y + 4, COL.A, w, h);
  if (cut.onSide) {
    const e = P(cut.E);
    label(ctx, "E", e.x + 12, e.y + 4, COL.B, w, h);
  }
  ctx.font = "12px system-ui, sans-serif";
  label(ctx, match ? "DE ∥ BC" : tilt === 0 ? "DE ∥ BC" : `DE tilted ${tilt}°`, w / 2, h - 6, match ? "#a3e635" : "#facc15", w, h);
  ctx.textAlign = "left";
}

interface Scene {
  /** Object height and its shadow, measured from under the point that casts the tip. */
  H: number;
  S: number;
  kind: "building" | "flagpole" | "tank" | "pyramid";
  halfBase?: number;
  /** Stick and its shadow. */
  h: number;
  s: number;
  showH: boolean;
  name: string;
}

function drawShadows(ctx: CanvasRenderingContext2D, w: number, h: number, sun: number, mystery: ShadowMystery | null, checked: boolean | null) {
  const sc: Scene = mystery
    ? {
        H: mystery.H,
        S: mystery.S,
        kind: mystery.id === "pyramid" ? "pyramid" : mystery.id === "tank" ? "tank" : "flagpole",
        halfBase: mystery.halfBase,
        h: mystery.h,
        s: mystery.s,
        showH: checked === true,
        name: mystery.label,
      }
    : { H: BUILDING, S: shadowLen(BUILDING, sun), kind: "building", h: STICK, s: shadowLen(STICK, sun), showH: true, name: "Building" };
  const elev = mystery ? sunFor(mystery.h, mystery.s) : sun;
  const groundY = h - 34;
  const split = Math.round(w * 0.62);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(split, 10);
  ctx.lineTo(split, h - 10);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, groundY);
  ctx.lineTo(w - 6, groundY);
  ctx.stroke();

  // Left panel: the big object. x = 0 is the point under the top that casts the shadow tip.
  const back = sc.kind === "pyramid" ? sc.halfBase! : sc.kind === "building" ? BUILDING * 0.4 : sc.kind === "tank" ? sc.H * 0.25 : 0;
  const leftPad = 44;
  const k1 = Math.min((split - leftPad - 18) / (back + sc.S), (groundY - 40) / sc.H);
  const X1 = (m: number) => leftPad + (back + m) * k1;
  const Y = (m: number, k: number) => groundY - m * k;
  drawObject(ctx, sc, X1, (m) => Y(m, k1), k1);
  shadowTriangle(ctx, X1(0), X1(sc.S), Y(sc.H, k1), groundY, elev);

  ctx.font = "12px system-ui, sans-serif";
  label(ctx, sc.showH ? `H = ${sc.H} m` : "H = ?", X1(-back) - 4, Y(sc.H / 2, k1), COL.sun, w, h, "right");
  if (sc.kind === "pyramid") {
    label(ctx, `${sc.halfBase} m`, (X1(-0) + X1(sc.halfBase!)) / 2, groundY + 15, "rgba(255,255,255,0.7)", w, h);
    label(ctx, `${sc.S - sc.halfBase!} m`, (X1(sc.halfBase!) + X1(sc.S)) / 2, groundY + 15, COL.sun, w, h);
    label(ctx, `S = ${sc.S} m`, (X1(0) + X1(sc.S)) / 2, groundY + 29, COL.sun, w, h);
  } else label(ctx, `S = ${f2(sc.S)} m`, (X1(0) + X1(sc.S)) / 2, groundY + 16, COL.sun, w, h);
  ctx.font = "11px system-ui, sans-serif";
  label(ctx, sc.name, X1(-back) + 2, 16, "rgba(255,255,255,0.6)", w, h, "left");

  // Right panel: the stick, drawn larger so its triangle is easy to see.
  const rx0 = split + 30;
  const k2 = Math.min((w - rx0 - 14) / sc.s, (groundY - 40) / sc.h);
  const X2 = (m: number) => rx0 + m * k2;
  ctx.strokeStyle = COL.B;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(X2(0), groundY);
  ctx.lineTo(X2(0), Y(sc.h, k2));
  ctx.stroke();
  shadowTriangle(ctx, X2(0), X2(sc.s), Y(sc.h, k2), groundY, elev);
  ctx.font = "12px system-ui, sans-serif";
  label(ctx, `h = ${sc.h} m`, X2(0) - 4, Y(sc.h / 2, k2), COL.B, w, h, "right");
  label(ctx, `s = ${f2(sc.s)} m`, (X2(0) + X2(sc.s)) / 2, groundY + 16, COL.B, w, h);
  ctx.font = "11px system-ui, sans-serif";
  label(ctx, "Stick (zoomed in)", split + 6, 16, "rgba(255,255,255,0.6)", w, h, "left");

  // The Sun's angle, written once at the top of the right panel.
  label(ctx, `Sun ${Math.round(elev * 10) / 10}° up`, w - 6, 32, COL.sun, w, h, "right");
  ctx.textAlign = "left";
}

/** The shadow on the ground and the sunbeam from the top to the shadow's tip, with the angle marked there. */
function shadowTriangle(ctx: CanvasRenderingContext2D, x0: number, x1: number, topY: number, groundY: number, elev: number) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x0, groundY - 3, x1 - x0, 6);
  ctx.strokeStyle = COL.sun;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, topY);
  ctx.lineTo(x1, groundY);
  ctx.stroke();
  ctx.setLineDash([]);
  const r = 16;
  ctx.beginPath();
  ctx.arc(x1, groundY, r, Math.PI, Math.PI + (elev * Math.PI) / 180);
  ctx.stroke();
}

function drawObject(ctx: CanvasRenderingContext2D, sc: Scene, X: (m: number) => number, Y: (m: number) => number, k: number) {
  ctx.lineWidth = 2;
  if (sc.kind === "building") {
    const bw = BUILDING * 0.4;
    ctx.fillStyle = "rgba(167,139,250,0.18)";
    ctx.strokeStyle = COL.copy;
    ctx.fillRect(X(-bw), Y(sc.H), bw * k, sc.H * k);
    ctx.strokeRect(X(-bw), Y(sc.H), bw * k, sc.H * k);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let f = 3; f < sc.H; f += 3) {
      ctx.beginPath();
      ctx.moveTo(X(-bw), Y(f));
      ctx.lineTo(X(0), Y(f));
      ctx.stroke();
    }
  } else if (sc.kind === "flagpole") {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(0), Y(sc.H));
    ctx.stroke();
    // A tricolour flag, flying away from the shadow.
    const fh = Math.max(6, sc.H * 0.06 * k);
    const fw = fh * 1.5;
    ["#ff9933", "#ffffff", "#138808"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(X(0) - fw, Y(sc.H) + (i * fh) / 3, fw, fh / 3);
    });
  } else if (sc.kind === "tank") {
    const tw = sc.H * 0.25;
    const tankH = sc.H * 0.3;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.moveTo(X(-tw + tw * 0.15), Y(0));
    ctx.lineTo(X(-tw + tw * 0.15), Y(sc.H - tankH));
    ctx.moveTo(X(-tw * 0.15), Y(0));
    ctx.lineTo(X(-tw * 0.15), Y(sc.H - tankH));
    ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.2)";
    ctx.strokeStyle = COL.B;
    ctx.fillRect(X(-tw), Y(sc.H), tw * k, tankH * k);
    ctx.strokeRect(X(-tw), Y(sc.H), tw * k, tankH * k);
  } else {
    const hb = sc.halfBase!;
    ctx.fillStyle = "rgba(250,204,21,0.22)";
    ctx.strokeStyle = COL.sun;
    ctx.beginPath();
    ctx.moveTo(X(-hb), Y(0));
    ctx.lineTo(X(0), Y(sc.H));
    ctx.lineTo(X(hb), Y(0));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // The hidden part of the shadow: from the centre to the edge of the base.
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(0), Y(sc.H));
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
