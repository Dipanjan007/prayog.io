"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  ANGLE_NAMES,
  CORNER,
  FREE_START,
  PAIRS,
  PAIR_KINDS,
  PAIR_LABEL,
  SLIDE_RANGE,
  TILT_RANGE,
  ROAD_RANGE,
  alignOk,
  allAngles,
  clampTo,
  isParallel,
  kindOf,
  meetSide,
  pairHolds,
  pairRule,
  roadFromDrag,
  type AlignRound,
  type AngleName,
  type Corner,
  type PairKind,
} from "@/lib/sim/parallel";

export type RailReading =
  | {
      mode: "free";
      kind: PairKind;
      pair: [AngleName, AngleName];
      road: number;
      bottomTilt: number;
      offset: number;
      parallel: boolean;
      holds: boolean;
    }
  | { mode: "align"; bottomTilt: number; ok: boolean };

interface Props {
  onReading?: (r: RailReading) => void;
  /** Challenge: the road and top line are fixed; only the new bottom line turns, and only two angles show. */
  round?: AlignRound | null;
}

const PAIR_COL = ["#22d3ee", "#f472b6"];
const RAIL_COL = "#c4b5fd";
const ROAD_COL = "#facc15";
const RAD = Math.PI / 180;

export default function RailCrossing({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<PairKind>("vertical");
  const [pairIdx, setPairIdx] = useState(0);
  const [road, setRoad] = useState(round ? round.road : FREE_START.road);
  const [bottomTilt, setBottomTilt] = useState(round ? round.startTilt : FREE_START.bottomTilt);
  const [offset, setOffset] = useState(0);
  const [laid, setLaid] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dragging = useRef(false);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const topTilt = round ? round.topTilt : FREE_START.topTilt;
  const ang = allAngles(road, topTilt, bottomTilt);
  const pairs = PAIRS[kind];
  const pair: [AngleName, AngleName] = round ? [round.known, round.see] : pairs[pairIdx % pairs.length];
  const pairKind: PairKind = round ? (kindOf(round.known, round.see) ?? "corresponding") : kind;
  const [p0, p1] = pair;
  const holds = pairHolds(pairKind, ang[pair[0]], ang[pair[1]]);
  const parallel = isParallel(topTilt, bottomTilt);
  const meet = meetSide(topTilt, bottomTilt);

  useEffect(() => {
    if (round) return;
    onReadingRef.current?.({ mode: "free", kind, pair, road, bottomTilt, offset, parallel, holds });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pair is derived from kind and pairIdx
  }, [round, kind, pairIdx, road, bottomTilt, offset, parallel, holds]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view = layout(size.w, size.h, road, topTilt, bottomTilt, offset);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    draw(ctx, size.w, size.h, view, road, topTilt, bottomTilt, [p0, p1], round, !round);
  }, [size, view, road, topTilt, bottomTilt, p0, p1, round]);

  const pickKind = (k: PairKind) => {
    setKind(k);
    setPairIdx(0);
  };
  const turnRoad = (d: number) => setRoad((r) => clampTo(r + d, ROAD_RANGE));
  const turnRail = (d: number) => {
    setBottomTilt((t) => clampTo(t + d, TILT_RANGE));
    setLaid(null);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (round) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onMove(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current || !view) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - r.left - view.pivot.x;
    const dy = e.clientY - r.top - view.pivot.y;
    if (Math.hypot(dx, dy) < 12) return;
    setRoad(roadFromDrag(dx, dy));
  };
  const onUp = () => {
    dragging.current = false;
  };

  const lay = () => {
    if (!round) return;
    const ok = alignOk(round, bottomTilt);
    setLaid(ok);
    onReadingRef.current?.({ mode: "align", bottomTilt, ok });
  };

  const rule = pairRule(pairKind);
  const [p, q] = pair;
  const statement =
    rule === "equal"
      ? `∠${p} = ${ang[p]}° and ∠${q} = ${ang[q]}°: ${holds ? "equal" : "not equal"}`
      : `∠${p} + ∠${q} = ${ang[p]}° + ${ang[q]}° = ${ang[p] + ang[q]}°${holds ? "" : ", not 180°"}`;
  const lineWord = round?.skin === "ladder" ? "rung" : "rail";

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm sm:grid-cols-3">
          {PAIR_KINDS.map((k) => (
            <button key={k} onClick={() => pickKind(k)} aria-pressed={kind === k} className={`rounded-xl px-1 py-2 ${kind === k ? "bg-white/10 text-white" : "text-white/50"}`}>
              {PAIR_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80 ${round ? "" : "touch-none cursor-grab"}`}
        role="img"
        aria-label={
          round
            ? `A road crossing two ${lineWord}s. ∠${round.known} = ${ang[round.known]}° at the top ${lineWord}, ∠${round.see} = ${ang[round.see]}° at the new ${lineWord}.`
            : `A road crossing rails l and m. ${statement}. The rails are ${parallel ? "parallel" : `not parallel and meet on the ${meet}`}.`
        }
      />

      {round ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[round.known, round.see].map((n, i) => (
              <AngleTile key={n} name={n} value={ang[n]} colour={PAIR_COL[i]} note={i === 0 ? `top ${lineWord}` : `new ${lineWord}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => turnRail(1)} disabled={bottomTilt >= TILT_RANGE.max}>
              ↺ Turn new {lineWord} 1°
            </button>
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => turnRail(-1)} disabled={bottomTilt <= TILT_RANGE.min}>
              ↻ Turn new {lineWord} 1°
            </button>
          </div>
          <button className="btn-primary !py-2 text-sm" onClick={lay}>
            {round.skin === "ladder" ? "Fix the rung" : "Lay the rail"}
          </button>
          {laid !== null && (
            <p className={`text-center text-sm ${laid ? "text-lime-300" : "text-amber-200"}`}>
              {laid
                ? `Parallel! ∠${round.known} and ∠${round.see} are ${rule === "equal" ? "equal" : "a co-interior pair adding up to 180°"}, so the ${lineWord}s never meet.`
                : `Not parallel yet: ${rule === "equal" ? `∠${round.see} should equal ∠${round.known}` : `∠${round.known} + ∠${round.see} = ${ang[round.known] + ang[round.see]}°, not 180°`}. These ${lineWord}s would meet far to the ${meet}.`}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {ANGLE_NAMES.map((n) => {
              const i = pair.indexOf(n);
              return <AngleTile key={n} name={n} value={ang[n]} colour={i >= 0 ? PAIR_COL[i] : undefined} />;
            })}
          </div>
          <div
            className={`rounded-2xl border px-3 py-2 text-center text-sm ${holds ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-amber-300/40 bg-amber-300/10 text-amber-100"}`}
            aria-live="polite"
          >
            <div>
              {PAIR_LABEL[kind]}: {statement}
            </div>
            <div className="mt-0.5 text-xs text-white/60">
              {parallel ? "Rails l and m are parallel: they never meet." : `Rails l and m are not parallel: they meet far to the ${meet}.`}
            </div>
          </div>
          <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setPairIdx((i) => (i + 1) % pairs.length)} disabled={pairs.length < 2}>
            Next pair ({(pairIdx % pairs.length) + 1} of {pairs.length})
          </button>
          <Stepper label="Road" value={`at ${road}° to rail l`} colour={ROAD_COL}>
            <StepBtn label="Turn the road clockwise 5°" text="↻5" onClick={() => turnRoad(-5)} disabled={road <= ROAD_RANGE.min} />
            <StepBtn label="Turn the road clockwise 1°" text="↻1" onClick={() => turnRoad(-1)} disabled={road <= ROAD_RANGE.min} />
            <StepBtn label="Turn the road anticlockwise 1°" text="↺1" onClick={() => turnRoad(1)} disabled={road >= ROAD_RANGE.max} />
            <StepBtn label="Turn the road anticlockwise 5°" text="↺5" onClick={() => turnRoad(5)} disabled={road >= ROAD_RANGE.max} />
          </Stepper>
          <Stepper label="Rail m" value={bottomTilt === 0 ? "level" : `tilted ${Math.abs(bottomTilt)}° ${bottomTilt > 0 ? "anticlockwise" : "clockwise"}`} colour={RAIL_COL}>
            <StepBtn label="Turn rail m clockwise 1°" text="↻1" onClick={() => turnRail(-1)} disabled={bottomTilt <= TILT_RANGE.min} />
            <StepBtn label="Turn rail m anticlockwise 1°" text="↺1" onClick={() => turnRail(1)} disabled={bottomTilt >= TILT_RANGE.max} />
            <StepBtn label="Slide rail m up" text="↑" onClick={() => setOffset((o) => clampTo(o - 1, SLIDE_RANGE))} disabled={offset <= SLIDE_RANGE.min} />
            <StepBtn label="Slide rail m down" text="↓" onClick={() => setOffset((o) => clampTo(o + 1, SLIDE_RANGE))} disabled={offset >= SLIDE_RANGE.max} />
          </Stepper>
          <p className="text-center text-xs text-white/40">Drag on the picture to turn the road. Rail l stays level.</p>
        </>
      )}
    </div>
  );
}

function AngleTile({ name, value, colour, note }: { name: string; value: number; colour?: string; note?: string }) {
  return (
    <div className="rounded-xl border bg-white/[0.03] px-1 py-1.5" style={{ borderColor: colour ?? "rgba(255,255,255,0.1)", opacity: colour ? 1 : 0.6 }}>
      <div className="text-[11px] text-white/60" style={colour ? { color: colour } : undefined}>
        ∠{name}
        {note ? ` · ${note}` : ""}
      </div>
      <div className="font-display text-base tabular-nums text-white">{value}°</div>
    </div>
  );
}

function Stepper({ label, value, colour, children }: { label: string; value: string; colour: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
      <div className="min-w-0">
        <span style={{ color: colour }}>{label}</span> <span className="text-xs text-white/50">{value}</span>
      </div>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function StepBtn({ label, text, onClick, disabled }: { label: string; text: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} disabled={disabled} className="h-9 min-w-10 rounded-lg border border-white/10 px-2 text-white/80 disabled:opacity-30">
      {text}
    </button>
  );
}

type V = { x: number; y: number };
interface View {
  pivot: V;
  top: { at: V; dir: V };
  bottom: { at: V; dir: V };
  road: V;
  xTop: V;
  xBottom: V;
}

/** Screen direction for an angle in degrees (anticlockwise, y down). */
const dirOf = (deg: number): V => ({ x: Math.cos(deg * RAD), y: -Math.sin(deg * RAD) });

function meetPoint(p: V, u: V, q: V, v: V): V {
  // p + s·u = q + t·v
  const den = u.x * v.y - u.y * v.x;
  const s = ((q.x - p.x) * v.y - (q.y - p.y) * v.x) / den;
  return { x: p.x + s * u.x, y: p.y + s * u.y };
}

function layout(w: number, h: number, road: number, topTilt: number, bottomTilt: number, offset: number): View | null {
  if (!w) return null;
  const cx = w / 2;
  const yTop = h * 0.27;
  const yBot = h * (0.64 + offset * 0.05);
  const pivot = { x: cx, y: (yTop + yBot) / 2 };
  const top = { at: { x: cx, y: yTop }, dir: dirOf(topTilt) };
  const bottom = { at: { x: cx, y: yBot }, dir: dirOf(bottomTilt) };
  const r = dirOf(road);
  return { pivot, top, bottom, road: r, xTop: meetPoint(pivot, r, top.at, top.dir), xBottom: meetPoint(pivot, r, bottom.at, bottom.dir) };
}

/** Direction (degrees) of the bisector of each corner, from the rail tilt t and road direction r. */
function bisector(corner: Corner, t: number, r: number) {
  switch (corner) {
    case "upper-right":
      return (t + r) / 2;
    case "upper-left":
      return (r + t + 180) / 2;
    case "lower-left":
      return (t + r) / 2 + 180;
    case "lower-right":
      return (r + t + 180) / 2 + 180;
  }
}

/** Start and end directions (degrees, anticlockwise) of each corner's angle. */
function wedge(corner: Corner, t: number, r: number): [number, number] {
  switch (corner) {
    case "upper-right":
      return [t, r];
    case "upper-left":
      return [r, t + 180];
    case "lower-left":
      return [t + 180, r + 180];
    case "lower-right":
      return [r + 180, t + 360];
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  v: View | null,
  road: number,
  topTilt: number,
  bottomTilt: number,
  pair: [AngleName, AngleName],
  round: AlignRound | null,
  showAll: boolean,
) {
  if (!v) return;
  const ladder = round?.skin === "ladder";
  const long = Math.hypot(w, h);

  // The road (or the ladder's side) as a wide band with its centre line, the transversal.
  const rA = { x: v.pivot.x - v.road.x * long, y: v.pivot.y - v.road.y * long };
  const rB = { x: v.pivot.x + v.road.x * long, y: v.pivot.y + v.road.y * long };
  ctx.lineCap = "butt";
  ctx.strokeStyle = ladder ? "rgba(217,160,90,0.35)" : "rgba(148,163,184,0.18)";
  ctx.lineWidth = ladder ? 12 : 26;
  line(ctx, rA, rB);
  ctx.strokeStyle = ladder ? "#d9a05a" : ROAD_COL;
  ctx.lineWidth = 2;
  ctx.setLineDash(ladder ? [] : [10, 8]);
  line(ctx, rA, rB);
  ctx.setLineDash([]);

  // Sleepers (rail skin), kept clear of the crossings so the angle labels stay readable.
  if (!ladder) {
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 5;
    for (let x = 14; x < w; x += 24) {
      if (Math.abs(x - v.xTop.x) < 56 || Math.abs(x - v.xBottom.x) < 56) continue;
      const yt = v.top.at.y + ((x - v.top.at.x) * v.top.dir.y) / v.top.dir.x;
      const yb = v.bottom.at.y + ((x - v.bottom.at.x) * v.bottom.dir.y) / v.bottom.dir.x;
      line(ctx, { x, y: yt - 8 }, { x, y: yb + 8 });
    }
  }

  // The two lines.
  const lineCol = ladder ? "#e7b878" : RAIL_COL;
  for (const [ln, name] of [
    [v.top, "l"],
    [v.bottom, "m"],
  ] as const) {
    ctx.strokeStyle = lineCol;
    ctx.lineWidth = ladder ? 5 : 3;
    ctx.shadowColor = lineCol;
    ctx.shadowBlur = 6;
    line(ctx, { x: ln.at.x - ln.dir.x * long, y: ln.at.y - ln.dir.y * long }, { x: ln.at.x + ln.dir.x * long, y: ln.at.y + ln.dir.y * long });
    ctx.shadowBlur = 0;
    // Name the line near the left edge, just above it.
    const x = 12;
    const y = ln.at.y + ((x - ln.at.x) * ln.dir.y) / ln.dir.x;
    ctx.fillStyle = lineCol;
    ctx.font = "italic bold 14px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(round ? (name === "l" ? (ladder ? "top rung" : "old rail") : ladder ? "new rung" : "new rail") : name, x, y - 9);
  }

  // Angle arcs and letters at the two crossings.
  const corners: { n: AngleName; at: V; t: number }[] = (Object.keys(CORNER) as AngleName[]).map((n) => ({
    n,
    at: CORNER[n].line === "top" ? v.xTop : v.xBottom,
    t: CORNER[n].line === "top" ? topTilt : bottomTilt,
  }));
  const ang = allAngles(road, topTilt, bottomTilt);
  for (const { n, at, t } of corners) {
    const i = pair.indexOf(n);
    if (!showAll && i < 0) continue;
    const corner = CORNER[n].corner;
    const [a0, a1] = wedge(corner, t, road);
    if (i >= 0) {
      ctx.fillStyle = PAIR_COL[i] + "33";
      ctx.strokeStyle = PAIR_COL[i];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(at.x, at.y);
      // Canvas angles run clockwise, so negate.
      ctx.arc(at.x, at.y, 20, -a0 * RAD, -a1 * RAD, true);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(at.x, at.y, 20, -a0 * RAD, -a1 * RAD, true);
      ctx.stroke();
    }
    const b = bisector(corner, t, road) * RAD;
    const size = ang[n];
    const R = Math.max(28, Math.min(38, 14 / Math.sin((size * RAD) / 2)));
    const lx = Math.max(10, Math.min(w - 10, at.x + Math.cos(b) * R));
    const ly = Math.max(10, Math.min(h - 6, at.y - Math.sin(b) * R));
    ctx.fillStyle = i >= 0 ? PAIR_COL[i] : "rgba(255,255,255,0.55)";
    ctx.font = `${i >= 0 ? "bold " : ""}13px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(n, lx, ly + 4);
  }

  // Pivot handle for dragging the road.
  if (showAll) {
    ctx.fillStyle = ROAD_COL;
    ctx.beginPath();
    ctx.arc(v.pivot.x, v.pivot.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "left";
}

function line(ctx: CanvasRenderingContext2D, a: V, b: V) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
