"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  BAG_MAX_EACH,
  COLOURS,
  EXPERIMENTS,
  EXP_ORDER,
  MAX_TRIALS,
  SPINNER_MAX,
  allowed,
  fracText,
  freqs,
  makeRng,
  meetsTarget,
  pick,
  runTraced,
  startCounts,
  theory,
  type BuildTarget,
  type ExpId,
  type Rng,
} from "@/lib/sim/probability";

export type ChanceReading =
  | { mode: "run"; exp: ExpId; counts: number[]; n: number }
  | { mode: "build"; counts: number[]; ok: boolean };

interface Props {
  onReading?: (r: ChanceReading) => void;
  /** Challenge: a mela stall whose bag or spinner the student builds to exact chances. */
  stall?: BuildTarget | null;
  /** Random source; pass a seeded one (makeRng) for repeatable runs. */
  rng?: Rng;
}

interface Run {
  counts: number[];
  trace: [number, number][];
  last: { i: number; dice?: [number, number] } | null;
}

const BATCHES = [1, 10, 100, 1000];
/** Red, blue and green marbles or sectors, and the colours for the other outcomes. */
const COL3 = ["#fb7185", "#38bdf8", "#a3e635"];
const ACCENT = { cyan: "#22d3ee", violet: "#a78bfa", pink: "#f472b6", yellow: "#facc15" };

const emptyRun = (id: ExpId): Run => ({ counts: EXPERIMENTS[id].outcomes.map(() => 0), trace: [], last: null });
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export default function ChanceLab({ onReading, stall = null, rng: rngProp }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rng] = useState<Rng>(() => rngProp ?? makeRng(newSeed()));
  const [exp, setExp] = useState<ExpId>("coin");
  const [runs, setRuns] = useState<Record<ExpId, Run>>(() => ({
    coin: emptyRun("coin"),
    die: emptyRun("die"),
    spinner: emptyRun("spinner"),
    bag: emptyRun("bag"),
    sum: emptyRun("sum"),
  }));
  const [built, setBuilt] = useState<number[]>(() => (stall ? startCounts(stall.kind) : [2, 2, 2]));
  const [checked, setChecked] = useState<boolean | null>(null);
  const [tried, setTried] = useState<number[] | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const e = EXPERIMENTS[exp];
  const run = runs[exp];
  const n = run.counts.reduce((a, b) => a + b, 0);
  const probs = theory(e.ways);

  useEffect(() => {
    if (stall) return;
    onReadingRef.current?.({ mode: "run", exp, counts: run.counts, n });
  }, [stall, exp, run.counts, n]);

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
    if (stall) drawBuilder(ctx, size.w, size.h, stall, built, checked);
    else drawRun(ctx, size.w, size.h, exp, run);
  }, [size, stall, built, checked, exp, run]);

  const go = (k: number) => {
    // Run outside the state updater, so React's double-run of updaters in development never rolls twice.
    const out = runTraced(e, k, rng, run.counts);
    setRuns((rs) => ({ ...rs, [exp]: { counts: out.counts, trace: [...run.trace, ...out.trace], last: out.last ?? run.last } }));
  };
  const reset = () => setRuns((rs) => ({ ...rs, [exp]: emptyRun(exp) }));

  if (stall) {
    const total = built.reduce((a, b) => a + b, 0);
    const thing = stall.kind === "bag" ? "marble" : "sector";
    const change = (i: number, by: number) => {
      const next = built.map((c, j) => (j === i ? c + by : c));
      if (!allowed(stall.kind, next)) return;
      setBuilt(next);
      setChecked(null);
      setTried(null);
    };
    const check = () => {
      const ok = meetsTarget(built, stall.target);
      setChecked(ok);
      onReadingRef.current?.({ mode: "build", counts: built, ok });
    };
    const tryIt = () => {
      const c = [0, 0, 0];
      for (let k = 0; k < 1000; k++) c[pick(built, rng)]++;
      setTried(c);
    };
    return (
      <div className="flex flex-col gap-3 select-none">
        <canvas
          ref={canvasRef}
          className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
          role="img"
          aria-label={`A ${stall.kind} with ${built[0]} red, ${built[1]} blue and ${built[2]} green ${thing}s`}
        />
        <div className="grid grid-cols-3 gap-2 text-center">
          {COLOURS.map((name, i) => {
            const [tn, td] = stall.target[i];
            return (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
                <div className="text-sm" style={{ color: COL3[i] }}>
                  {name}: {built[i]}
                </div>
                <div className="font-display text-base tabular-nums text-white">P = {fracText(built[i], total)}</div>
                <div className="text-[11px] text-white/50">wanted {fracText(tn, td)}</div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    aria-label={`Remove a ${name.toLowerCase()} ${thing}`}
                    onClick={() => change(i, -1)}
                    disabled={!allowed(stall.kind, built.map((c, j) => (j === i ? c - 1 : c)))}
                    className="h-9 rounded-lg border border-white/10 text-lg text-white/80 disabled:opacity-30"
                  >
                    −
                  </button>
                  <button
                    aria-label={`Add a ${name.toLowerCase()} ${thing}`}
                    onClick={() => change(i, 1)}
                    disabled={!allowed(stall.kind, built.map((c, j) => (j === i ? c + 1 : c)))}
                    className="h-9 rounded-lg border border-white/10 text-lg text-white/80 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-white/40">
          {stall.kind === "bag" ? `Up to ${BAG_MAX_EACH} marbles of each colour. ${total} marbles in the bag.` : `Up to ${SPINNER_MAX} equal sectors. ${total} sectors now, so each is 1/${total} of the spinner.`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost !py-2 text-sm" onClick={tryIt}>
            Try it 1000 times
          </button>
          <button className="btn-primary !py-2 text-sm" onClick={check}>
            Check the game
          </button>
        </div>
        {tried && (
          <p className="text-center text-xs text-white/60">
            In 1000 tries: red {tried[0]}, blue {tried[1]}, green {tried[2]}.
          </p>
        )}
        {checked !== null && (
          <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
            {checked ? "Exactly right! The stall owner is happy." : "Not yet. Compare each P with the chance wanted."}
          </p>
        )}
      </div>
    );
  }

  const f = freqs(run.counts);
  const tracked = e.tracked;
  const full = n >= MAX_TRIALS;

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-black/20 p-1 text-xs sm:text-sm">
        {EXP_ORDER.map((id) => (
          <button key={id} onClick={() => setExp(id)} className={`rounded-xl px-0.5 py-2 ${exp === id ? "bg-white/10 text-white" : "text-white/50"}`}>
            {EXPERIMENTS[id].label}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={`${e.label}: ${n} trials. ${e.outcomes[tracked]} came up ${run.counts[tracked]} times, a frequency of ${f[tracked].toFixed(3)}; the theoretical probability is ${probs[tracked].toFixed(3)}`}
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <Readout label="Trials" value={`${n}`} colour="text-white" />
        <Readout label={`${e.outcomes[tracked]} so far`} value={n ? `${run.counts[tracked]} (${f[tracked].toFixed(3)})` : "–"} colour="text-pink-200" />
        <Readout label={`P(${e.outcomes[tracked]})`} value={`${fracText(e.ways[tracked], e.ways.reduce((a, b) => a + b, 0))} ≈ ${probs[tracked].toFixed(3)}`} colour="text-cyan-200" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {BATCHES.map((k) => (
          <button key={k} onClick={() => go(k)} disabled={full} className="btn-ghost !px-1 !py-2 text-sm tabular-nums disabled:opacity-40">
            {e.verb} {k}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/40">{full ? `That is the limit of ${MAX_TRIALS} trials. Reset to start again.` : "Dashed lines show the theoretical probability."}</p>
        <button onClick={reset} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/70">
          Reset
        </button>
      </div>
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="truncate text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-sm tabular-nums sm:text-base ${colour}`}>{value}</div>
    </div>
  );
}

/** Colour of an outcome's bar. */
function outcomeColour(id: ExpId, i: number) {
  if (id === "spinner" || id === "bag") return COL3[i];
  if (id === "coin") return i === 0 ? ACCENT.cyan : ACCENT.violet;
  if (id === "sum") return i === 5 ? ACCENT.pink : ACCENT.cyan;
  return i === 5 ? ACCENT.pink : ACCENT.cyan;
}

function drawRun(ctx: CanvasRenderingContext2D, w: number, h: number, id: ExpId, run: Run) {
  const e = EXPERIMENTS[id];
  const probs = theory(e.ways);
  const f = freqs(run.counts);
  const n = run.counts.reduce((a, b) => a + b, 0);
  const topH = Math.round(h * 0.42);

  // Top left: the last result.
  const box = Math.min(topH - 16, w * 0.32);
  drawObject(ctx, id, run.last, 8, 8, box);

  // Top right: the running frequency of the tracked outcome, on a log scale of trials.
  const gx = 8 + box + 14;
  const gw = w - gx - 10;
  const gy = 18;
  const gh = topH - gy - 16;
  const p = probs[e.tracked];
  const yMax = Math.min(1, Math.max(0.5, p * 2.2));
  const xMax = Math.max(1000, 10 ** Math.ceil(Math.log10(Math.max(n, 1))));
  const X = (t: number) => gx + (Math.log10(t) / Math.log10(xMax)) * gw;
  const Y = (v: number) => gy + gh - (Math.min(v, yMax) / yMax) * gh;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gy, gw, gh);
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  for (let t = 1; t <= xMax; t *= 10) {
    const x = X(t);
    ctx.beginPath();
    ctx.moveTo(x, gy + gh);
    ctx.lineTo(x, gy + gh + 3);
    ctx.stroke();
    ctx.fillText(t >= 1000 ? `${t / 1000}k` : `${t}`, Math.min(Math.max(x, gx + 6), gx + gw - 8), gy + gh + 12);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`frequency of ${e.outcomes[e.tracked]} as trials grow`, gx, gy - 6);
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = ACCENT.cyan;
  ctx.beginPath();
  ctx.moveTo(gx, Y(p));
  ctx.lineTo(gx + gw, Y(p));
  ctx.stroke();
  ctx.setLineDash([]);
  if (run.trace.length) {
    ctx.strokeStyle = ACCENT.pink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    run.trace.forEach(([t, v], i) => (i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v))));
    ctx.stroke();
  }

  // Bottom: a bar for each outcome, with the theoretical probability dashed.
  const by = topH + 22;
  const bh = h - by - 20;
  const k = e.outcomes.length;
  const slot = (w - 20) / k;
  const bw = Math.min(46, slot * 0.7);
  const bMax = Math.min(1, Math.max(...probs, ...f) * 1.25);
  const BY = (v: number) => by + bh - (v / bMax) * bh;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(10, by + bh);
  ctx.lineTo(w - 10, by + bh);
  ctx.stroke();
  for (let i = 0; i < k; i++) {
    const cx = 10 + slot * (i + 0.5);
    const col = outcomeColour(id, i);
    ctx.fillStyle = col + "aa";
    ctx.fillRect(cx - bw / 2, BY(f[i]), bw, by + bh - BY(f[i]));
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2 - 3, BY(probs[i]));
    ctx.lineTo(cx + bw / 2 + 3, BY(probs[i]));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.textAlign = "center";
    ctx.font = `${slot < 34 ? 10 : 12}px system-ui, sans-serif`;
    ctx.fillText(e.outcomes[i], cx, by + bh + 14);
    if (n && slot >= 40) {
      ctx.fillStyle = col;
      ctx.fillText(f[i].toFixed(2), cx, Math.max(by - 6, Math.min(BY(f[i]), BY(probs[i])) - 5));
    }
  }
  ctx.textAlign = "left";
}

/** The coin, die, spinner, bag or two dice, showing the last result. */
function drawObject(ctx: CanvasRenderingContext2D, id: ExpId, last: Run["last"], x: number, y: number, s: number) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.lineWidth = 2;
  if (id === "coin") {
    const heads = last ? last.i === 0 : true;
    ctx.fillStyle = last ? (heads ? ACCENT.cyan : ACCENT.violet) + "33" : "rgba(255,255,255,0.05)";
    ctx.strokeStyle = last ? (heads ? ACCENT.cyan : ACCENT.violet) : "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(s * 0.18)}px system-ui, sans-serif`;
    ctx.fillText(last ? (heads ? "Heads" : "Tails") : "Toss", cx, cy + s * 0.06);
  } else if (id === "die") {
    drawDie(ctx, x + s * 0.1, y + s * 0.1, s * 0.8, last ? last.i + 1 : 0);
  } else if (id === "sum") {
    const d = last?.dice;
    const ds = s * 0.46;
    drawDie(ctx, x, y + s * 0.05, ds, d ? d[0] : 0);
    drawDie(ctx, x + s - ds, y + s * 0.05, ds, d ? d[1] : 0);
    ctx.fillStyle = d && d[0] + d[1] === 7 ? ACCENT.pink : "#fff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(s * 0.2)}px system-ui, sans-serif`;
    ctx.fillText(d ? `= ${d[0] + d[1]}` : "Roll", cx, y + s * 0.85);
  } else if (id === "spinner") {
    drawSpinner(ctx, cx, cy, s * 0.42, [2, 1, 1], last ? last.i : null);
  } else {
    drawBag(ctx, x, y, s, EXPERIMENTS.bag.ways, last ? last.i : null);
  }
  ctx.textAlign = "left";
}

function drawDie(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, face: number) {
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.strokeStyle = face ? ACCENT.cyan : "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, s * 0.15);
  ctx.fill();
  ctx.stroke();
  const pip: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
    6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]],
  };
  ctx.fillStyle = face === 6 ? ACCENT.pink : "#fff";
  for (const [px, py] of pip[face] ?? []) {
    ctx.beginPath();
    ctx.arc(x + px * s, y + py * s, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A spinner of equal sectors: counts[i] sectors of colour i, in order. The pointer shows `hit` when given. */
function drawSpinner(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, counts: number[], hit: number | null) {
  const total = counts.reduce((a, b) => a + b, 0);
  const step = (Math.PI * 2) / Math.max(total, 1);
  let a = -Math.PI / 2;
  let firstOfHit = 0;
  counts.forEach((c, i) => {
    if (i === hit) firstOfHit = a;
    for (let k = 0; k < c; k++) {
      ctx.fillStyle = COL3[i] + (hit === null || hit === i ? "cc" : "55");
      ctx.strokeStyle = "#0a0d1c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a, a + step);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      a += step;
    }
  });
  // The pointer, aimed into the middle of the winning colour's first sector.
  const ang = hit === null ? -Math.PI / 2 + step / 2 : firstOfHit + step / 2;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ang) * r * 0.85, cy + Math.sin(ang) * r * 0.85);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** A bag holding counts[i] marbles of colour i; the drawn colour `hit` is lit, the rest dimmed. */
function drawBag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, counts: number[], hit: number | null) {
  ctx.strokeStyle = "rgba(167,139,250,0.8)";
  ctx.fillStyle = "rgba(167,139,250,0.10)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y + s * 0.12);
  ctx.quadraticCurveTo(x - s * 0.02, y + s * 0.55, x + s * 0.12, y + s * 0.95);
  ctx.lineTo(x + s * 0.88, y + s * 0.95);
  ctx.quadraticCurveTo(x + s * 1.02, y + s * 0.55, x + s * 0.7, y + s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const all: number[] = [];
  counts.forEach((c, i) => {
    for (let k = 0; k < c; k++) all.push(i);
  });
  const per = Math.max(3, Math.ceil(Math.sqrt(all.length * 1.3)));
  const rows = Math.ceil(all.length / per);
  const cell = Math.min((s * 0.62) / per, (s * 0.6) / Math.max(rows, 1));
  const r = Math.max(2.5, cell * 0.4);
  all.forEach((col, k) => {
    const row = Math.floor(k / per);
    const c = k % per;
    const mx = x + s / 2 + (c - (per - 1) / 2) * cell;
    const my = y + s * 0.88 - row * cell - cell / 2;
    ctx.fillStyle = COL3[col] + (hit === null || hit === col ? "ff" : "55");
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBuilder(ctx: CanvasRenderingContext2D, w: number, h: number, stall: BuildTarget, counts: number[], checked: boolean | null) {
  const s = Math.min(h - 40, w * 0.55);
  const x = (w - s) / 2;
  const y = 12;
  if (stall.kind === "spinner") drawSpinner(ctx, w / 2, y + s / 2, s * 0.46, counts, null);
  else drawBag(ctx, x, y, s, counts, null);
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = checked === null ? "rgba(255,255,255,0.7)" : checked ? "#a3e635" : "#fb7185";
  const total = counts.reduce((a, b) => a + b, 0);
  const msg =
    checked === null ? `${total} ${stall.kind === "bag" ? "marbles" : "equal sectors"}` : checked ? "✓ Chances match the stall" : "✗ Chances do not match yet";
  ctx.fillText(msg, w / 2, h - 12);
  ctx.textAlign = "left";
}
