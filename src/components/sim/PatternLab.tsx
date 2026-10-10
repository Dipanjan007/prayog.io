"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  BORDER_EXPRS,
  FREE_PATTERNS,
  MAX_COEFF,
  MAX_STEP,
  PATTERNS,
  cells,
  countOf,
  newSticks,
  ruleFits,
  ruleText,
  ruleValue,
  ruleWorking,
  sameAsBorder,
  segKey,
  sticks,
  tileCounts,
  type BorderExpr,
  type PatternId,
  type PatternRound,
} from "@/lib/sim/patterns";

export type PatternMode = "build" | "rule" | "same";

export type PatternReading =
  | { mode: "build"; pattern: PatternId; n: number; count: number }
  | { mode: "rule"; pattern: PatternId; a: number; b: number; ok: boolean; bigN: number | null }
  | { mode: "same"; allRight: boolean }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: PatternReading) => void;
  /** Challenge: a new pattern whose rule the student finds. */
  round?: PatternRound | null;
}

const GROUP_COLOURS = ["#22d3ee", "#f472b6", "#a78bfa", "#a3e635", "#fbbf24"];
const TABLE_STEPS = [1, 2, 3, 4, 5];
const MODE_NAMES: Record<PatternMode, string> = { build: "Build", rule: "Rule", same: "Same?" };

export default function PatternLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PatternMode>("build");
  const [freeId, setFreeId] = useState<PatternId>("squares");
  const [n, setN] = useState(1);
  const [seen, setSeen] = useState<Record<string, number[]>>(() => ({ [round ? round.pattern : "squares"]: [1] }));
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [checked, setChecked] = useState<{ ok: boolean; a: number; b: number } | null>(null);
  const [bigN, setBigN] = useState("");
  const [sameN, setSameN] = useState(3);
  const [pick, setPick] = useState(0);
  const [marks, setMarks] = useState<Record<number, "same" | "different">>({});
  const [sorted, setSorted] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: PatternMode = round ? "rule" : mode;
  const id: PatternId = round ? round.pattern : activeMode === "same" ? "border" : freeId;
  const def = PATTERNS[id];
  const count = countOf(id, n);
  const seenHere = seen[id] ?? [];
  const ruleOk = checked?.ok === true && checked.a === a && checked.b === b;
  const big = Number(bigN);
  const bigValid = bigN !== "" && Number.isInteger(big) && big >= 1 && big <= 100000;

  // Remember which steps the student has looked at, for the table.
  const visit = (p: PatternId, step: number) => setSeen((s) => ((s[p] ?? []).includes(step) ? s : { ...s, [p]: [...(s[p] ?? []), step] }));
  const goStep = (step: number) => {
    setN(step);
    visit(id, step);
  };

  useEffect(() => {
    if (round || activeMode !== "build") return;
    onReadingRef.current?.({ mode: "build", pattern: id, n, count });
  }, [round, activeMode, id, n, count]);

  useEffect(() => {
    if (round || activeMode !== "rule" || !checked) return;
    onReadingRef.current?.({ mode: "rule", pattern: id, a: checked.a, b: checked.b, ok: checked.ok, bigN: checked.ok && bigValid ? big : null });
  }, [round, activeMode, id, checked, bigValid, big]);

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
    if (activeMode === "same") drawBorderGroups(ctx, size.w, size.h, sameN, BORDER_EXPRS[pick]);
    else drawPattern(ctx, size.w, size.h, id, n);
  }, [size, activeMode, id, n, sameN, pick]);

  const pickPattern = (p: PatternId) => {
    setFreeId(p);
    setN(1);
    visit(p, 1);
    setChecked(null);
    setBigN("");
  };
  const check = () => {
    const ok = ruleFits(id, a, b);
    setChecked({ ok, a, b });
    if (round) onReadingRef.current?.({ mode: "round", ok });
  };
  // The first step where a wrong rule and the pattern disagree.
  const firstMiss = checked && !checked.ok ? Array.from({ length: MAX_STEP }, (_, i) => i + 1).find((s) => ruleValue(checked.a, checked.b, s) !== countOf(id, s)) : undefined;

  const sortAll = () => {
    const right = BORDER_EXPRS.slice(1).every((e, i) => marks[i + 1] === (sameAsBorder(e) ? "same" : "different"));
    setSorted(right);
    onReadingRef.current?.({ mode: "same", allRight: right });
  };
  const markAll = BORDER_EXPRS.slice(1).every((_, i) => marks[i + 1]);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["build", "rule", "same"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {MODE_NAMES[m]}
            </button>
          ))}
        </div>
      )}

      {!round && activeMode !== "same" && (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-label="Pick a pattern">
          {FREE_PATTERNS.map((p) => (
            <button
              key={p}
              onClick={() => pickPattern(p)}
              className={`rounded-xl border px-2 py-2 text-xs sm:text-sm ${p === freeId ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
            >
              {PATTERNS[p].name}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "same"
            ? `A rangoli border around a ${sameN} by ${sameN} square, grouped the way ${BORDER_EXPRS[pick].text} counts it`
            : `${def.name}, step ${n}: ${count} ${def.unit}`
        }
      />

      {activeMode === "same" ? (
        <SamePanel
          n={sameN}
          setN={(v) => setSameN(v)}
          pick={pick}
          setPick={setPick}
          marks={marks}
          setMark={(i, v) => {
            setMarks((m) => ({ ...m, [i]: v }));
            setSorted(null);
          }}
          sorted={sorted}
          canSort={markAll}
          onSort={sortAll}
        />
      ) : (
        <>
          <p className="text-center text-xs text-white/50">{def.blurb}</p>
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <Stepper label="Step n" value={n} min={1} max={MAX_STEP} onChange={goStep} />
            <div className="text-right">
              <div className="text-[11px] tracking-wider text-white/50">{def.unit}</div>
              <div className="font-display text-xl tabular-nums text-lime-200" data-testid="count">
                {count}
              </div>
            </div>
          </div>
          <table className="w-full table-fixed rounded-2xl border border-white/10 text-center text-sm tabular-nums">
            <tbody>
              <tr className="border-b border-white/10">
                <th className="w-24 py-1 text-left pl-3 text-xs font-normal text-white/50">Step n</th>
                {TABLE_STEPS.map((s) => (
                  <td key={s} className="py-1 text-white/70">
                    {s}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="py-1 text-left pl-3 text-xs font-normal text-white/50">{def.unit}</th>
                {TABLE_STEPS.map((s) => (
                  <td key={s} className={seenHere.includes(s) ? "py-1 text-lime-200" : "py-1 text-white/25"}>
                    {seenHere.includes(s) ? countOf(id, s) : "?"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {activeMode === "rule" && (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-xs text-white/50">Your rule for step n</div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Stepper label="Number in front of n" short value={a} min={0} max={MAX_COEFF} onChange={(v) => setA(v)} />
                    <span className="font-mono text-lg text-white">n +</span>
                    <Stepper label="Number added" short value={b} min={0} max={MAX_COEFF} onChange={(v) => setB(v)} />
                  </div>
                  <div className="font-mono text-lg text-cyan-100">{ruleText(a, b)}</div>
                </div>
              </div>
              <button className="btn-primary !py-2 text-sm" onClick={check}>
                Check
              </button>
              {checked && (
                <p className={`text-center text-sm ${checked.ok ? "text-lime-300" : "text-amber-200"}`} aria-live="polite">
                  {checked.ok
                    ? `Yes! ${def.name}: ${ruleText(checked.a, checked.b)} ${def.unit} for step n.`
                    : firstMiss !== undefined
                      ? `Not yet. For step ${firstMiss}, ${ruleText(checked.a, checked.b)} gives ${ruleValue(checked.a, checked.b, firstMiss)}, but the pattern has ${countOf(id, firstMiss)}.`
                      : "Not yet."}
                </p>
              )}
              {ruleOk && !round && (
                <label className="block rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.05] px-3 py-2">
                  <span className="text-sm text-white/70">Try a big step: n =</span>{" "}
                  <input
                    aria-label="Big step n"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={bigN}
                    placeholder="100"
                    onChange={(e) => setBigN(e.target.value)}
                    className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-1 tabular-nums text-white"
                  />
                  {bigValid && (
                    <div className="mt-1 font-mono text-sm text-lime-200" data-testid="big-working">
                      {ruleWorking(a, b, big)} {def.unit}
                    </div>
                  )}
                </label>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stepper({ label, value, min, max, onChange, short }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; short?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {!short && <span className="mr-1 text-sm text-white/70">{label}</span>}
      <button aria-label={`${label} down`} className="btn-ghost !h-9 !w-9 !p-0 text-lg" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <span className="w-7 text-center font-mono text-lg tabular-nums text-white" aria-label={`${label}: ${value}`}>
        {value}
      </span>
      <button aria-label={`${label} up`} className="btn-ghost !h-9 !w-9 !p-0 text-lg" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

function SamePanel(p: {
  n: number;
  setN: (v: number) => void;
  pick: number;
  setPick: (i: number) => void;
  marks: Record<number, "same" | "different">;
  setMark: (i: number, v: "same" | "different") => void;
  sorted: boolean | null;
  canSort: boolean;
  onSort: () => void;
}) {
  const e = BORDER_EXPRS[p.pick];
  const total = e.groups(p.n).reduce((s, g) => s + g.length, 0);
  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <Stepper label="Step n" value={p.n} min={1} max={MAX_STEP} onChange={p.setN} />
        <div className="text-right text-xs text-white/50">
          border tiles
          <div className="font-display text-xl tabular-nums text-lime-200">{countOf("border", p.n)}</div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm" aria-live="polite">
        <span className="font-mono text-cyan-100">{e.text}</span>
        <span className="text-white/60">: {e.how} </span>
        <span className="text-white/80">
          Groups add up to {total}
          {e.minus ? `, take away ${e.minus}: ${total - e.minus}` : ""}.
        </span>
      </div>
      <ul className="grid gap-1.5">
        {BORDER_EXPRS.map((x, i) => (
          <li key={x.text} className="flex items-center gap-1.5">
            <button
              aria-pressed={p.pick === i}
              aria-label={`Show how ${x.text} counts`}
              onClick={() => p.setPick(i)}
              className={`min-w-0 flex-1 rounded-xl border px-2 py-1.5 text-left ${p.pick === i ? "border-cyan-300 bg-cyan-300/15" : "border-white/10"}`}
            >
              <span className="font-mono text-sm text-white">{x.text}</span>
              <span className="ml-2 text-xs tabular-nums text-white/50">
                n = {p.n}: {x.value(p.n)}
              </span>
            </button>
            {i === 0 ? (
              <span className="w-[8.5rem] shrink-0 text-center text-xs text-white/40">the rule to match</span>
            ) : (
              (["same", "different"] as const).map((v) => {
                const on = p.marks[i] === v;
                const wrong = p.sorted === false && on && (v === "same") !== sameAsBorder(x);
                return (
                  <button
                    key={v}
                    aria-label={`${x.text} is ${v === "same" ? "the same as" : "different from"} 4n + 4`}
                    aria-pressed={on}
                    onClick={() => p.setMark(i, v)}
                    className={`w-[4.1rem] shrink-0 rounded-xl border px-1 py-1.5 text-xs ${
                      wrong ? "border-amber-300 bg-amber-300/15 text-amber-100" : on ? "border-violet-300 bg-violet-300/15 text-white" : "border-white/10 text-white/60"
                    }`}
                  >
                    {v === "same" ? "Same" : "Different"}
                  </button>
                );
              })
            )}
          </li>
        ))}
      </ul>
      <button className="btn-primary !py-2 text-sm" disabled={!p.canSort} onClick={p.onSort}>
        Check my sorting
      </button>
      {p.sorted !== null && (
        <p className={`text-center text-sm ${p.sorted ? "text-lime-300" : "text-amber-200"}`}>
          {p.sorted
            ? "All sorted! Three of them count every tile exactly once, so they always equal 4n + 4."
            : "Some are not right yet (marked in amber). Tap them to see which tiles they miss or count twice."}
        </p>
      )}
    </>
  );
}

/** Fit a box of bw × bh units into the canvas with a margin; returns unit size and the origin (y up). */
function frame(w: number, h: number, bw: number, bh: number, pad = 18) {
  const k = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh, 60);
  const ox = (w - bw * k) / 2;
  const oy = (h + bh * k) / 2;
  return { k, X: (x: number) => ox + x * k, Y: (y: number) => oy - y * k };
}

function drawPattern(ctx: CanvasRenderingContext2D, w: number, h: number, id: PatternId, n: number) {
  // Size the drawing for at least step 5, so small steps are not huge and growth is easy to see.
  const ref = Math.max(n, 5);
  if (PATTERNS[id].unit === "tiles") {
    const all = cells(id, n);
    const bw = Math.max(...cells(id, ref).map((c) => c.x)) + 1;
    const bh = Math.max(...cells(id, ref).map((c) => c.y)) + 1;
    const f = frame(w, h, bw, bh);
    const shiftX = ((bw - (Math.max(...all.map((c) => c.x)) + 1)) * f.k) / 2;
    const shiftY = ((bh - (Math.max(...all.map((c) => c.y)) + 1)) * f.k) / 2;
    for (const c of all) {
      const x = f.X(c.x) + shiftX;
      const y = f.Y(c.y + 1) - shiftY;
      if (c.kind === "count") {
        ctx.fillStyle = id === "path" ? "rgba(255,255,255,0.75)" : "rgba(244,114,182,0.45)";
        ctx.strokeStyle = id === "path" ? "#e2e8f0" : "#f472b6";
      } else {
        ctx.fillStyle = id === "path" ? "rgba(148,163,184,0.35)" : "rgba(250,204,21,0.06)";
        ctx.strokeStyle = id === "path" ? "rgba(148,163,184,0.6)" : "rgba(250,204,21,0.15)";
      }
      ctx.lineWidth = 1;
      ctx.fillRect(x + 1, y + 1, f.k - 2, f.k - 2);
      ctx.strokeRect(x + 1, y + 1, f.k - 2, f.k - 2);
      if (c.kind === "decor" && id === "border" && f.k > 8) {
        // Kolam dots inside the rangoli.
        ctx.fillStyle = "rgba(250,204,21,0.6)";
        ctx.beginPath();
        ctx.arc(x + f.k / 2, y + f.k / 2, Math.max(1.2, f.k * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }
  const segs = sticks(id, n);
  const refSegs = sticks(id, ref);
  const xs = refSegs.flatMap((s) => [s[0], s[2]]);
  const ys = refSegs.flatMap((s) => [s[1], s[3]]);
  const bw = Math.max(...xs) - Math.min(...xs);
  const bh = Math.max(...ys) - Math.min(...ys);
  const f = frame(w, h, bw, Math.max(bh, 1));
  // Centre the current step inside the reference box.
  const cw = Math.max(...segs.flatMap((s) => [s[0], s[2]]));
  const ch = Math.max(...segs.flatMap((s) => [s[1], s[3]]));
  const dx = ((bw - cw) * f.k) / 2;
  const dy = ((Math.max(bh, 1) - ch) * f.k) / 2;
  const fresh = newSticks(id, n);
  const lw = Math.max(2, Math.min(5, f.k * 0.09));
  for (const s of segs) {
    const isNew = fresh.has(segKey(s));
    const x1 = f.X(s[0]) + dx;
    const y1 = f.Y(s[1]) - dy;
    const x2 = f.X(s[2]) + dx;
    const y2 = f.Y(s[3]) - dy;
    // Shorten each stick a little so separate sticks are easy to count.
    const len = Math.hypot(x2 - x1, y2 - y1);
    const gap = Math.min(4, len * 0.1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const ax = x1 + ux * gap;
    const ay = y1 + uy * gap;
    const bx = x2 - ux * gap;
    const by = y2 - uy * gap;
    ctx.strokeStyle = isNew ? "#22d3ee" : "#fde68a";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    if (isNew) {
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // The match head.
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.arc(bx, by, lw * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = "butt";
}

/** The rangoli border coloured by the groups an expression adds up: ×2 on tiles counted twice, red outline on tiles missed. */
function drawBorderGroups(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, e: BorderExpr) {
  const m = n + 2;
  const ref = Math.max(m, 7);
  const f = frame(w, h, ref, ref);
  const off = ((ref - m) * f.k) / 2;
  const left = f.X(0) + off;
  const top = f.Y(ref) + off;
  const times = tileCounts(e, n);
  const groupOf = new Map<string, number>();
  e.groups(n).forEach((g, gi) => {
    for (const [c, r] of g) if (!groupOf.has(`${c},${r}`)) groupOf.set(`${c},${r}`, gi);
  });
  for (let r = 0; r < m; r++)
    for (let c = 0; c < m; c++) {
      const x = left + c * f.k;
      const y = top + r * f.k;
      const onBorder = r === 0 || c === 0 || r === m - 1 || c === m - 1;
      if (!onBorder) {
        ctx.fillStyle = "rgba(250,204,21,0.05)";
        ctx.fillRect(x + 1, y + 1, f.k - 2, f.k - 2);
        continue;
      }
      const key = `${c},${r}`;
      const t = times.get(key) ?? 0;
      if (t === 0) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, f.k - 4, f.k - 4);
        ctx.setLineDash([]);
        continue;
      }
      const col = GROUP_COLOURS[(groupOf.get(key) ?? 0) % GROUP_COLOURS.length];
      ctx.fillStyle = col + "66";
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.fillRect(x + 1, y + 1, f.k - 2, f.k - 2);
      ctx.strokeRect(x + 1, y + 1, f.k - 2, f.k - 2);
      if (t > 1) {
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.round(Math.min(14, f.k * 0.42))}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`×${t}`, x + f.k / 2, y + f.k / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }
    }
}
