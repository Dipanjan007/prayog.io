"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { LADDERS, compareSquares, ladderAngle, ladderTop, reachesSill, thirdSide, wholeHypotenuse, type Rescue, type SquareCompare } from "@/lib/sim/pythagoras";

export type SquareMode = "squares" | "ladder";

export type SquareReading =
  | { mode: "squares"; a: number; b: number; angle: number; c: number; cmp: SquareCompare; whole: boolean }
  | { mode: "ladder"; L: number; d: number; top: number }
  | { mode: "rescue"; L: number; ok: boolean };

interface Props {
  onReading?: (r: SquareReading) => void;
  /** Challenge: the ladder's foot is fixed; the student picks a ladder and raises it. */
  rescue?: Rescue | null;
}

const COL = { a: "#22d3ee", b: "#f472b6", c: "#a3e635" };
const fmt = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(2));

export default function SquareLab({ onReading, rescue = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SquareMode>("squares");
  // Start off a whole-number triple, so finding one is the student's discovery.
  const [a, setA] = useState(4);
  const [b, setB] = useState(6);
  const [angle, setAngle] = useState(90);
  const [L, setL] = useState(rescue ? LADDERS[0] : 10);
  const [d, setD] = useState(rescue ? rescue.d : 3);
  const [raised, setRaised] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SquareMode = rescue ? "ladder" : mode;
  const footD = rescue ? rescue.d : Math.min(d, L - 0.5);
  const c = thirdSide(a, b, angle);
  const cmp = compareSquares(a, b, c);
  const top = ladderTop(L, footD);

  useEffect(() => {
    if (rescue) return;
    if (activeMode === "squares") onReadingRef.current?.({ mode: "squares", a, b, angle, c, cmp, whole: angle === 90 && wholeHypotenuse(a, b) });
    else onReadingRef.current?.({ mode: "ladder", L, d: footD, top });
  }, [rescue, activeMode, a, b, angle, c, cmp, L, footD, top]);

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
    if (activeMode === "squares") drawSquares(ctx, size.w, size.h, a, b, angle);
    else drawLadder(ctx, size.w, size.h, L, footD, rescue, raised);
  }, [size, activeMode, a, b, angle, L, footD, rescue, raised]);

  const raise = () => {
    if (!rescue) return;
    const ok = reachesSill(L, rescue);
    setRaised(ok);
    onReadingRef.current?.({ mode: "rescue", L, ok });
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {!rescue && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["squares", "ladder"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "squares" ? "Squares" : "Ladder"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "squares"
            ? `Triangle with sides ${a} and ${b} and a ${angle}° corner between them; squares of area ${a * a}, ${b * b} and ${(c * c).toFixed(1)} on its sides`
            : `A ${L} m ladder with its foot ${footD} m from the wall reaches ${top.toFixed(2)} m up`
        }
      />

      {activeMode === "squares" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="a² + b²" value={`${a * a} + ${b * b} = ${a * a + b * b}`} colour="text-white" />
            <Readout label="c²" value={`${fmt(Math.round(c * c * 100) / 100)}`} colour="text-lime-200" />
            <Readout label="c" value={`${fmt(Math.round(c * 100) / 100)}`} colour="text-lime-200" />
          </div>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm ${
              cmp === "equal" ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.03] text-white/70"
            }`}
          >
            {cmp === "equal" ? "c² = a² + b²: the two squares exactly fill the big one" : cmp === "less" ? "c² < a² + b²: the corner is sharper than 90°" : "c² > a² + b²: the corner is wider than 90°"}
          </div>
          <Slider label="Side a" colour={COL.a} value={a} min={1} max={10} step={1} unit="" onChange={setA} />
          <Slider label="Side b" colour={COL.b} value={b} min={1} max={10} step={1} unit="" onChange={setB} />
          <Slider label="Corner between a and b" colour="#facc15" value={angle} min={30} max={150} step={1} unit="°" onChange={setAngle} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Ladder L" value={`${L} m`} colour="text-lime-200" />
            <Readout label="Foot d" value={`${fmt(footD)} m`} colour="text-cyan-200" />
            <Readout label="Top h" value={rescue && raised === null ? "?" : `${fmt(Math.round(top * 100) / 100)} m`} colour="text-pink-200" />
          </div>
          {rescue ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {LADDERS.map((x) => (
                  <button
                    key={x}
                    onClick={() => {
                      setL(x);
                      setRaised(null);
                    }}
                    className={`min-w-11 flex-1 rounded-xl border px-2 py-2 text-sm tabular-nums ${L === x ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                  >
                    {x} m
                  </button>
                ))}
              </div>
              <button className="btn-primary !py-2 text-sm" onClick={raise}>
                Raise the {L} m ladder
              </button>
              {raised !== null && (
                <p className={`text-center text-sm ${raised ? "text-lime-300" : "text-amber-200"}`}>
                  {raised
                    ? `It rests on the sill: ${rescue.d}² + ${rescue.h}² = ${L}².`
                    : top < rescue.h
                      ? `Too short: the top is at ${top.toFixed(2)} m, below the ${rescue.h} m sill.`
                      : `Too long: the top is at ${top.toFixed(2)} m, above the ${rescue.h} m sill.`}
                </p>
              )}
            </>
          ) : (
            <>
              <Slider label="Ladder length L" colour={COL.c} value={L} min={5} max={20} step={1} unit=" m" onChange={setL} />
              <Slider label="Foot from the wall d" colour={COL.a} value={footD} min={0.5} max={L - 0.5} step={0.5} unit=" m" onChange={setD} />
              <p className="text-center text-xs text-white/40">
                L² = d² + h², so h = √(L² − d²). The ladder makes {Math.round(ladderAngle(L, footD))}° with the ground.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

function Slider(p: { label: string; colour: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">
          {p.value}
          {p.unit}
        </span>
      </div>
      <input type="range" className="range mt-1 w-full" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
    </label>
  );
}

type V = { x: number; y: number };

/** The four corners of the square on side p→q, built on the side away from point `away`. */
function squareOn(p: V, q: V, away: V): V[] {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  let nx = -dy;
  let ny = dx;
  const mx = (p.x + q.x) / 2 - away.x;
  const my = (p.y + q.y) / 2 - away.y;
  if (nx * mx + ny * my < 0) {
    nx = -nx;
    ny = -ny;
  }
  return [p, q, { x: q.x + nx, y: q.y + ny }, { x: p.x + nx, y: p.y + ny }];
}

function drawSquares(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, b: number, angleDeg: number) {
  // Corner C at the origin, side a along the x-axis to B, side b at the chosen angle to A (maths axes: y up).
  const t = (angleDeg * Math.PI) / 180;
  const C = { x: 0, y: 0 };
  const B = { x: a, y: 0 };
  const A = { x: b * Math.cos(t), y: b * Math.sin(t) };
  const sqA = squareOn(C, B, A);
  const sqB = squareOn(A, C, B);
  const sqC = squareOn(B, A, C);
  const all = [...sqA, ...sqB, ...sqC];
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  const k = Math.min((w - 20) / (maxX - minX), (h - 20) / (maxY - minY));
  const ox = (w - (maxX - minX) * k) / 2 - minX * k;
  const oy = (h - (maxY - minY) * k) / 2 + maxY * k;
  const P = (p: V) => ({ x: ox + p.x * k, y: oy - p.y * k });

  const square = (sq: V[], colour: string, label: string) => {
    const s = sq.map(P);
    ctx.fillStyle = colour + "22";
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    s.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Unit grid inside the square, so the area can be counted.
    const side = Math.hypot(sq[1].x - sq[0].x, sq[1].y - sq[0].y);
    if (k >= 6) {
      ctx.strokeStyle = colour + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < side - 1e-6; i++) {
        const f = i / side;
        const p1 = P({ x: sq[0].x + (sq[1].x - sq[0].x) * f, y: sq[0].y + (sq[1].y - sq[0].y) * f });
        const p2 = P({ x: sq[3].x + (sq[2].x - sq[3].x) * f, y: sq[3].y + (sq[2].y - sq[3].y) * f });
        const p3 = P({ x: sq[0].x + (sq[3].x - sq[0].x) * f, y: sq[0].y + (sq[3].y - sq[0].y) * f });
        const p4 = P({ x: sq[1].x + (sq[2].x - sq[1].x) * f, y: sq[1].y + (sq[2].y - sq[1].y) * f });
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
      }
      ctx.stroke();
    }
    const cx = s.reduce((n, p) => n + p.x, 0) / 4;
    const cy = s.reduce((n, p) => n + p.y, 0) / 4;
    ctx.fillStyle = colour;
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + 4);
  };

  const c = thirdSide(a, b, angleDeg);
  square(sqA, COL.a, `a² = ${a * a}`);
  square(sqB, COL.b, `b² = ${b * b}`);
  square(sqC, COL.c, `c² = ${fmt(Math.round(c * c * 10) / 10)}`);

  // The triangle and its corner mark.
  const s = [A, B, C].map(P);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  s.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const pc = P(C);
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 2;
  if (angleDeg === 90) {
    const m = 12;
    ctx.beginPath();
    ctx.moveTo(pc.x + m, pc.y);
    ctx.lineTo(pc.x + m, pc.y - m);
    ctx.lineTo(pc.x, pc.y - m);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(pc.x, pc.y, 14, -t, 0);
    ctx.stroke();
  }
  ctx.textAlign = "left";
}

function drawLadder(ctx: CanvasRenderingContext2D, w: number, h: number, L: number, d: number, rescue: Rescue | null, raised: boolean | null) {
  const top = ladderTop(L, d);
  const wallH = Math.max(rescue ? rescue.h + 3 : 12, top + 1);
  // Before a rescue the ladder lies on the ground behind its foot, so leave room for it.
  const k = Math.min((h - 40) / wallH, (w - 70) / (rescue ? rescue.d + L : Math.max(L, 10)));
  const groundY = h - 22;
  const wallX = w - 72;
  const X = (m: number) => wallX - m * k;
  const Y = (m: number) => groundY - m * k;

  // Building with floors every 3 m.
  ctx.fillStyle = "rgba(167,139,250,0.10)";
  ctx.fillRect(wallX, Y(wallH), w - wallX, wallH * k);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let f = 3; f < wallH; f += 3) {
    ctx.beginPath();
    ctx.moveTo(wallX, Y(f));
    ctx.lineTo(w, Y(f));
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, groundY);
  ctx.lineTo(w, groundY);
  ctx.moveTo(wallX, groundY);
  ctx.lineTo(wallX, Y(wallH));
  ctx.stroke();

  if (rescue) {
    // The window and its sill.
    ctx.fillStyle = "rgba(250,204,21,0.25)";
    ctx.fillRect(wallX + 4, Y(rescue.h + 2), w - wallX - 12, 2 * k);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wallX - 6, Y(rescue.h));
    ctx.lineTo(w - 8, Y(rescue.h));
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`sill ${rescue.h} m`, wallX + 4, Y(rescue.h) + 14);
    // The no-stand zone in front of the wall.
    ctx.fillStyle = "rgba(251,113,133,0.18)";
    ctx.fillRect(X(rescue.d) + 2, groundY, wallX - X(rescue.d) - 2, 8);
  }

  // The ladder: shown leaning once raised, or before a rescue.
  const leaning = !rescue || raised !== null;
  const fx = X(d);
  ctx.strokeStyle = COL.c;
  ctx.lineWidth = 4;
  ctx.shadowColor = COL.c;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  if (leaning) {
    ctx.moveTo(fx, groundY);
    ctx.lineTo(wallX, Y(top));
  } else {
    ctx.moveTo(fx - L * k, groundY - 4);
    ctx.lineTo(fx, groundY - 4);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Rungs.
  if (leaning) {
    ctx.strokeStyle = COL.c + "88";
    ctx.lineWidth = 2;
    for (let r = 0.5; r < L; r += 0.5) {
      const f = r / L;
      const x = fx + (wallX - fx) * f;
      const y = groundY + (Y(top) - groundY) * f;
      const nx = (Y(top) - groundY) / (L * k);
      const ny = -(wallX - fx) / (L * k);
      ctx.beginPath();
      ctx.moveTo(x - nx * 4, y - ny * 4);
      ctx.lineTo(x + nx * 4, y + ny * 4);
      ctx.stroke();
    }
  }

  // Labels and the right angle at the foot of the wall.
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = COL.a;
  ctx.textAlign = "center";
  ctx.fillText(`d = ${fmt(d)} m`, (fx + wallX) / 2, groundY + 16);
  if (leaning) {
    // h is written inside the building, clear of the ladder.
    ctx.fillStyle = "#f472b6";
    ctx.textAlign = "left";
    ctx.fillText(`h = ${fmt(Math.round(top * 100) / 100)} m`, wallX + 5, Y(top / 2));
    ctx.fillStyle = COL.c;
    ctx.textAlign = "right";
    ctx.fillText(`L = ${L} m`, (fx + wallX) / 2 - 8, Y(top / 2) - 6);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wallX - 10, groundY);
    ctx.lineTo(wallX - 10, groundY - 10);
    ctx.lineTo(wallX, groundY - 10);
    ctx.stroke();
    if (raised !== null) {
      ctx.fillStyle = raised ? "#a3e635" : "#fb7185";
      ctx.textAlign = "center";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(raised ? "✓ Safe on the sill" : "✗ Not on the sill", w / 2 - 20, 20);
    }
  }
  ctx.textAlign = "left";
}
