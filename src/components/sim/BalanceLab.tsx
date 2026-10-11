"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  MAX_AMOUNT,
  apply,
  canApply,
  checkText,
  equationText,
  moveText,
  sameEquation,
  sideText,
  solvedValue,
  takeOne,
  tilt,
  type BalanceRound,
  type Move,
  type Pan,
  type Puzzle,
  type Scale,
} from "@/lib/sim/balance";

export type BalanceMode = "solve" | "write";

export type BalanceReading =
  | { mode: "solve"; puzzle: number; level: boolean; solved: number | null; moves: number }
  | { mode: "write"; pic: number; ok: boolean }
  | { mode: "round"; solved: boolean; moves: number; ok: boolean };

interface Props {
  onReading?: (r: BalanceReading) => void;
  /** Balances for Solve mode. */
  puzzles: Puzzle[];
  /** Level balances whose equation the student writes in Write mode. */
  pictures: Puzzle[];
  /** Challenge: one balance to solve in as few moves as its par. */
  round?: BalanceRound | null;
}

/** One entry in the move log: the move and the scale after it. */
interface Step {
  label: string;
  scale: Scale;
  /** True when this step changed both pans (it counts as a move). */
  both: boolean;
}

const EMPTY: Scale = { left: { bags: 0, marbles: 0 }, right: { bags: 0, marbles: 0 } };
const MARBLE_COLOURS = ["#22d3ee", "#f472b6", "#a78bfa", "#a3e635"];

export default function BalanceLab({ onReading, puzzles, pictures, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<BalanceMode>("solve");
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [k, setK] = useState(1);
  const [picIdx, setPicIdx] = useState(0);
  const [entry, setEntry] = useState<Scale>(EMPTY);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: BalanceMode = round ? "solve" : mode;
  const puzzle: Puzzle = round ?? puzzles[puzzleIdx];
  const pic = pictures[picIdx];
  const start = puzzle.scale;
  const scale = steps.length ? steps[steps.length - 1].scale : start;
  const shown = activeMode === "solve" ? scale : pic.scale;
  const x = activeMode === "solve" ? puzzle.x : pic.x;
  const t = tilt(shown, x);
  const level = t === 0;
  const solved = level ? solvedValue(scale) : null;
  const moves = steps.filter((s) => s.both).length;
  const tipped = activeMode === "solve" && !level;

  useEffect(() => {
    if (round || activeMode !== "solve") return;
    onReadingRef.current?.({ mode: "solve", puzzle: puzzleIdx, level, solved, moves });
  }, [round, activeMode, puzzleIdx, level, solved, moves]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The beam swings smoothly to its new angle.
  const angleRef = useRef(0);
  const target = Math.sign(t) * Math.min(9, 4 + Math.abs(t) * 0.5);
  const reveal = activeMode === "solve" && solved !== null ? solved : null;
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    let raf = 0;
    const frame = () => {
      const a = angleRef.current;
      const next = Math.abs(target - a) < 0.05 ? target : a + (target - a) * 0.2;
      angleRef.current = next;
      const ctx = fitCanvas(el, size.w, size.h);
      ctx.clearRect(0, 0, size.w, size.h);
      drawBalance(ctx, size.w, size.h, shown, next, reveal);
      if (next !== target) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [size, shown, target, reveal]);

  const doMove = (m: Move) => {
    if (tipped || solved !== null || !canApply(scale, m)) return;
    const after = apply(scale, m);
    const next = [...steps, { label: moveText(m), scale: after, both: true }];
    setSteps(next);
    if (round) {
      const done = solvedValue(after) !== null;
      const n = next.filter((s) => s.both).length;
      if (done) onReadingRef.current?.({ mode: "round", solved: true, moves: n, ok: n <= round.par });
    }
  };
  const oneSide = (side: "left" | "right") => {
    if (tipped || solved !== null) return;
    const after = takeOne(scale, side);
    if (after) setSteps([...steps, { label: `− 1 from the ${side} pan only`, scale: after, both: false }]);
  };
  const undo = () => setSteps(steps.slice(0, -1));
  const restart = () => setSteps([]);
  const pickPuzzle = (i: number) => {
    setPuzzleIdx(i);
    setSteps([]);
  };
  const pickPic = (i: number) => {
    setPicIdx(i);
    setEntry(EMPTY);
    setChecked(null);
  };
  const setPan = (side: "left" | "right", key: keyof Pan, v: number) => {
    setEntry((e) => ({ ...e, [side]: { ...e[side], [key]: v } }));
    setChecked(null);
  };
  const check = () => {
    const ok = sameEquation(pic.scale, entry);
    setChecked(ok);
    onReadingRef.current?.({ mode: "write", pic: picIdx, ok });
  };

  const amount = Math.max(1, Math.min(MAX_AMOUNT, k));
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const moveButtons: { m: Move; text: string }[] = [
    { m: { kind: "marbles", k: amount }, text: `Take ${amount} ${plural(amount, "marble", "marbles")} off both pans` },
    { m: { kind: "bags", k: amount }, text: `Take ${amount} ${plural(amount, "bag", "bags")} off both pans` },
    { m: { kind: "share", k: amount }, text: `Share both pans into ${amount} equal parts` },
  ];
  const overPar = round && solved !== null && moves > round.par;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["solve", "write"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "solve" ? "Solve" : "Write"}
            </button>
          ))}
        </div>
      )}

      {!round && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={activeMode === "solve" ? "Pick a balance" : "Pick a picture"}>
          {(activeMode === "solve" ? puzzles : pictures).map((p, i) => {
            const on = activeMode === "solve" ? i === puzzleIdx : i === picIdx;
            return (
              <button
                key={p.name}
                onClick={() => (activeMode === "solve" ? pickPuzzle(i) : pickPic(i))}
                className={`min-w-0 flex-1 rounded-xl border px-2 py-2 text-sm ${on ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={`A balance scale. Left pan: ${describePan(shown.left)}. Right pan: ${describePan(shown.right)}. ${
          level ? "The beam is level." : t > 0 ? "The left pan is lower." : "The right pan is lower."
        }`}
      />

      {activeMode === "solve" ? (
        <>
          <div
            className={`rounded-2xl border px-4 py-2 text-center ${
              tipped ? "border-amber-300/40 bg-amber-300/10" : solved !== null ? "border-lime-300/40 bg-lime-300/10" : "border-white/10 bg-white/[0.03]"
            }`}
            aria-live="polite"
          >
            <div className="font-mono text-lg text-cyan-100" data-testid="equation">
              {tipped ? `${sideText(scale.left)}  ≠  ${sideText(scale.right)}` : equationText(scale)}
            </div>
            <div className="mt-0.5 text-xs text-white/60">
              {tipped
                ? "The beam tipped! One pan changed and the other did not. Put the marble back."
                : solved !== null
                  ? `Solved: x = ${solved}. Check: ${checkText(start, solved)}.`
                  : "Level. Do the same thing to both pans until one bag is alone."}
            </div>
          </div>

          {solved === null && !tipped && (
            <>
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="text-sm text-white/70">How many</span>
                <div className="flex items-center gap-1">
                  <button aria-label="Fewer" className="btn-ghost !h-9 !w-9 !p-0 text-lg" onClick={() => setK(Math.max(1, amount - 1))}>
                    −
                  </button>
                  <input
                    aria-label="How many"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_AMOUNT}
                    value={k}
                    onChange={(e) => setK(Math.round(Number(e.target.value)) || 1)}
                    className="w-14 rounded-lg border border-white/10 bg-black/30 py-1.5 text-center tabular-nums text-white"
                  />
                  <button aria-label="More" className="btn-ghost !h-9 !w-9 !p-0 text-lg" onClick={() => setK(Math.min(MAX_AMOUNT, amount + 1))}>
                    +
                  </button>
                </div>
              </div>
              <div className="grid gap-1.5">
                {moveButtons.map(({ m, text }) => (
                  <button
                    key={m.kind}
                    disabled={!canApply(scale, m)}
                    onClick={() => doMove(m)}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-300/[0.06] px-3 py-2 text-left text-sm text-cyan-50 disabled:border-white/10 disabled:bg-transparent disabled:text-white/30"
                  >
                    {text}
                  </button>
                ))}
              </div>
              {!round && (
                <div className="grid grid-cols-2 gap-1.5">
                  {(["left", "right"] as const).map((side) => (
                    <button
                      key={side}
                      disabled={scale[side].marbles < 1}
                      onClick={() => oneSide(side)}
                      className="rounded-xl border border-white/10 px-2 py-2 text-xs text-white/60 disabled:text-white/25"
                    >
                      Take 1 marble off the {side} pan only
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/40">Shares must come out whole: every bag count and marble count must split into equal parts.</p>
            </>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost !px-3 !py-1.5 text-sm" disabled={!steps.length} onClick={undo}>
              {tipped ? "Put the marble back" : "Undo"}
            </button>
            <button className="btn-ghost !px-3 !py-1.5 text-sm" disabled={!steps.length} onClick={restart}>
              Start again
            </button>
            {round && (
              <span className="ml-auto text-sm tabular-nums text-white/70">
                Moves: {moves} · Par: {round.par}
              </span>
            )}
          </div>
          {overPar && (
            <p className="text-center text-sm text-amber-200">
              Solved in {moves} moves, but par is {round.par}. Press Start again and find a shorter way.
            </p>
          )}
          {round && solved !== null && !overPar && <p className="text-center text-sm text-lime-300">At par! x = {solved}.</p>}

          {steps.length > 0 && (
            <ul className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/70" aria-label="Moves so far">
              <li>{equationText(start)}</li>
              {steps.map((s, i) => (
                <li key={i} className={s.both ? "" : "text-amber-200"}>
                  <span className="text-white/40">{s.label}:</span> {s.both ? equationText(s.scale) : "the beam tips"}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="text-center text-sm text-white/60">Count the bags (x) and loose marbles on each pan, then write the equation.</p>
          <div className="grid grid-cols-2 gap-2">
            {(["left", "right"] as const).map((side) => (
              <div key={side} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                <div className="text-center text-xs text-white/50">{side === "left" ? "Left pan" : "Right pan"}</div>
                <Counter label={`${side} bags`} value={entry[side].bags} max={9} onChange={(v) => setPan(side, "bags", v)} />
                <Counter label={`${side} marbles`} value={entry[side].marbles} max={MAX_AMOUNT} onChange={(v) => setPan(side, "marbles", v)} />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
            <div className="text-xs text-white/50">Your equation</div>
            <div className="font-mono text-lg text-cyan-100">{equationText(entry)}</div>
          </div>
          <button className="btn-primary !py-2 text-sm" onClick={check}>
            Check
          </button>
          {checked !== null && (
            <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`} aria-live="polite">
              {checked
                ? `Right! ${equationText(pic.scale)}. Each bag holds ${pic.x}: ${checkText(pic.scale, pic.x)}.`
                : "Not yet. Count again: each bag is one x, each loose marble is 1."}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function describePan(p: Pan) {
  return `${p.bags} ${p.bags === 1 ? "bag" : "bags"} and ${p.marbles} loose ${p.marbles === 1 ? "marble" : "marbles"}`;
}

function Counter({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-1 flex items-center justify-between gap-1">
      <span className="text-xs text-white/60">{label.split(" ")[1]}</span>
      <div className="flex items-center gap-1">
        <button aria-label={`Fewer ${label}`} className="btn-ghost !h-8 !w-8 !p-0" onClick={() => onChange(Math.max(0, value - 1))}>
          −
        </button>
        <span className="w-6 text-center tabular-nums" aria-label={`${label}: ${value}`}>
          {value}
        </span>
        <button aria-label={`More ${label}`} className="btn-ghost !h-8 !w-8 !p-0" onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}

/** The taraazu: a post, a beam tipped by `angleDeg` (left end down when positive) and two hanging pans. */
function drawBalance(ctx: CanvasRenderingContext2D, w: number, h: number, s: Scale, angleDeg: number, reveal: number | null) {
  const px = w / 2;
  const py = 30;
  const L = Math.min(w * 0.29, 190);
  const panW = Math.min(w * 0.36, 230);
  const a = (angleDeg * Math.PI) / 180;
  const ends = [
    { x: px - L * Math.cos(a), y: py + L * Math.sin(a), pan: s.left },
    { x: px + L * Math.cos(a), y: py - L * Math.sin(a), pan: s.right },
  ];
  const hang = h - 46 - py;

  // Stand and base.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, h - 8);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(px - 34, h - 10, 68, 6);
  // Pointer: it stands straight up only when the beam is level.
  ctx.strokeStyle = angleDeg === 0 ? "#a3e635" : "#fbbf24";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + 22 * Math.sin(-a), py - 22 * Math.cos(a));
  ctx.stroke();

  // Beam.
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ends[0].x, ends[0].y);
  ctx.lineTo(ends[1].x, ends[1].y);
  ctx.stroke();
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();

  for (const e of ends) {
    const barY = e.y + 12;
    const rimY = e.y + hang;
    const x0 = e.x - panW / 2;
    const x1 = e.x + panW / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x, barY);
    ctx.moveTo(x0 + 4, barY);
    ctx.lineTo(x1 - 4, barY);
    ctx.moveTo(x0 + 4, barY);
    ctx.lineTo(x0 + 2, rimY);
    ctx.moveTo(x1 - 4, barY);
    ctx.lineTo(x1 - 2, rimY);
    ctx.stroke();
    // The bowl of the pan.
    ctx.fillStyle = "rgba(167,139,250,0.25)";
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, rimY);
    ctx.quadraticCurveTo(e.x, rimY + 22, x1, rimY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawContents(ctx, e.pan, x0 + 8, x1 - 8, rimY - 2, reveal);
  }
  ctx.lineCap = "butt";
}

/** Bags in a row on the pan, loose marbles above them in rows of 10 (two groups of 5, easy to count). */
function drawContents(ctx: CanvasRenderingContext2D, p: Pan, x0: number, x1: number, bottom: number, reveal: number | null) {
  const width = x1 - x0;
  let y = bottom;
  if (p.bags > 0) {
    const perRow = Math.min(p.bags, 5);
    const bs = Math.min(28, width / perRow - 4);
    const rows = Math.ceil(p.bags / perRow);
    for (let i = 0; i < p.bags; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const inRow = row === rows - 1 ? p.bags - row * perRow : perRow;
      const rowW = inRow * (bs + 4) - 4;
      const bx = x0 + (width - rowW) / 2 + col * (bs + 4);
      const by = bottom - row * (bs + 4);
      drawBag(ctx, bx, by, bs, reveal);
    }
    y = bottom - rows * (bs + 4);
  }
  if (p.marbles > 0) {
    const r = Math.max(2.5, Math.min(6, (width - 8) / 10 / 2 - 1));
    const step = 2 * r + 2;
    for (let i = 0; i < p.marbles; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const inRow = Math.min(10, p.marbles - row * 10);
      const rowW = inRow * step + (inRow > 5 ? 6 : 0);
      const mx = x0 + (width - rowW) / 2 + col * step + (col >= 5 ? 6 : 0) + r + 1;
      const my = y - row * step - r - 1;
      ctx.fillStyle = MARBLE_COLOURS[i % MARBLE_COLOURS.length];
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(mx - r * 0.35, my - r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A tied cloth bag with its bottom at (x, bottom), `s` pixels wide. */
function drawBag(ctx: CanvasRenderingContext2D, x: number, bottom: number, s: number, reveal: number | null) {
  const top = bottom - s;
  ctx.fillStyle = "rgba(245,158,11,0.35)";
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, top + s * 0.22);
  ctx.quadraticCurveTo(x - s * 0.05, top + s * 0.5, x + s * 0.08, bottom);
  ctx.lineTo(x + s * 0.92, bottom);
  ctx.quadraticCurveTo(x + s * 1.05, top + s * 0.5, x + s * 0.7, top + s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Tie and the gathered neck.
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, top + s * 0.22);
  ctx.lineTo(x + s * 0.22, top);
  ctx.moveTo(x + s * 0.7, top + s * 0.22);
  ctx.lineTo(x + s * 0.78, top);
  ctx.stroke();
  ctx.fillStyle = reveal !== null ? "#a3e635" : "#fde68a";
  ctx.font = `bold ${Math.round(s * (reveal !== null && reveal >= 10 ? 0.4 : 0.48))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(reveal !== null ? `${reveal}` : "x", x + s / 2, bottom - s * 0.38);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
