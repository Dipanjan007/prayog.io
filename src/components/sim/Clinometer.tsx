"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { DIST, EYE, TOWERS, closeEnough, depression, topElevation, type Tower } from "@/lib/sim/heights";

export type ClinoMode = "tower" | "sea";

export type ClinoReading =
  | { mode: "tower"; id: string; d: number; theta: number }
  | { mode: "sea"; d: number; dep: number }
  | { mode: "guess"; id: string; guess: number; ok: boolean };

interface Props {
  onReading?: (r: ClinoReading) => void;
  /** Challenge: a mystery object whose height the student works out and types in. */
  mystery?: Tower | null;
}

/** Height of the lighthouse lamp above the sea (m). */
export const LAMP_H = 50;
const SEA = { min: 10, max: 200, step: 1 };

export default function Clinometer({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ClinoMode>("tower");
  const [towerId, setTowerId] = useState(TOWERS[0].id);
  const [d, setD] = useState(40);
  const [boat, setBoat] = useState(120);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: ClinoMode = mystery ? "tower" : mode;
  const tower = mystery ?? TOWERS.find((t) => t.id === towerId)!;
  const theta = topElevation(tower.H, d);
  const dep = depression(LAMP_H, boat);
  const shownTheta = Math.round(theta * 10) / 10;
  const shownDep = Math.round(dep * 10) / 10;

  useEffect(() => {
    if (mystery) return;
    if (activeMode === "tower") onReadingRef.current?.({ mode: "tower", id: tower.id, d, theta });
    else onReadingRef.current?.({ mode: "sea", d: boat, dep });
  }, [mystery, activeMode, tower.id, d, theta, boat, dep]);

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
    if (activeMode === "tower") drawTower(ctx, size.w, size.h, tower, d, shownTheta, checked);
    else drawSea(ctx, size.w, size.h, boat, shownDep);
  }, [size, activeMode, tower, d, shownTheta, boat, shownDep, checked]);

  const check = () => {
    if (!mystery) return;
    const g = Number(guess.replace(",", "."));
    const ok = closeEnough(g, mystery.H);
    setChecked(ok);
    onReadingRef.current?.({ mode: "guess", id: mystery.id, guess: g, ok });
  };

  const tan = Math.tan((shownTheta * Math.PI) / 180);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["tower", "sea"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "tower" ? "Tower" : "Lighthouse"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "tower"
            ? `Standing ${d} m from the ${tower.label.toLowerCase()}, the clinometer reads ${shownTheta}°`
            : `A boat ${boat} m from a ${LAMP_H} m lighthouse; the angle of depression is ${shownDep}°`
        }
      />

      {activeMode === "tower" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Distance d" value={`${d} m`} colour="text-cyan-200" />
            <Readout label="Clinometer θ" value={`${shownTheta}°`} colour="text-yellow-200" />
            <Readout label="tan θ" value={tan.toFixed(3)} colour="text-pink-200" />
          </div>
          {!mystery && (
            <div className="flex flex-wrap gap-2">
              {TOWERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTowerId(t.id)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${towerId === t.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          )}
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-cyan-200">Walk: distance from the foot</span>
              <span className="tabular-nums text-white">{d} m</span>
            </div>
            <input type="range" className="range mt-1 w-full" min={DIST.min} max={DIST.max} step={DIST.step} value={d} onChange={(e) => setD(Number(e.target.value))} />
            <div className="mt-1 flex justify-between gap-2">
              {[-1, -0.5, 0.5, 1].map((s) => (
                <button
                  key={s}
                  onClick={() => setD((v) => Math.min(DIST.max, Math.max(DIST.min, v + s)))}
                  className="h-8 flex-1 rounded-lg border border-white/10 text-xs text-white/70 tabular-nums"
                >
                  {s > 0 ? "+" : "−"}
                  {Math.abs(s)} m
                </button>
              ))}
            </div>
          </label>
          {mystery ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm text-white/70">
                Height of the {mystery.label.toLowerCase()} = (d × tan θ) + {EYE} m eye height
              </div>
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
                  {checked ? `Spot on! It is ${mystery.H} m tall.` : "Not within 1 m. Check your multiplication, and remember to add your eye height."}
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-white/40">
              {tower.label}: {tower.H} m tall. Your eye is {EYE} m above the ground, so the top is {tower.H - EYE} m above your eye.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Lamp height" value={`${LAMP_H} m`} colour="text-pink-200" />
            <Readout label="Boat distance" value={`${boat} m`} colour="text-cyan-200" />
            <Readout label="Depression" value={`${shownDep}°`} colour="text-yellow-200" />
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-cyan-200">Sail the boat</span>
              <span className="tabular-nums text-white">{boat} m from the foot</span>
            </div>
            <input type="range" className="range mt-1 w-full" min={SEA.min} max={SEA.max} step={SEA.step} value={boat} onChange={(e) => setBoat(Number(e.target.value))} />
          </label>
          <p className="text-center text-xs text-white/40">The keeper looks down at {shownDep}°. From the boat, the lamp is up at the same {shownDep}°.</p>
        </>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-lg tabular-nums ${colour}`}>{value}</div>
    </div>
  );
}

function angleArc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, from: number, to: number, label: string, labelSide: 1 | -1) {
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.min(from, to), Math.max(from, to));
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  const mid = (from + to) / 2;
  ctx.fillText(label, x + Math.cos(mid) * (r + 6) + (labelSide > 0 ? 2 : -40), y + Math.sin(mid) * (r + 6) + 4);
}

function person(ctx: CanvasRenderingContext2D, x: number, groundY: number, eyeY: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  const hgt = groundY - eyeY;
  ctx.beginPath();
  ctx.arc(x, eyeY, Math.max(3, hgt * 0.1), 0, Math.PI * 2);
  ctx.moveTo(x, eyeY + hgt * 0.12);
  ctx.lineTo(x, groundY - hgt * 0.45);
  ctx.lineTo(x - hgt * 0.15, groundY);
  ctx.moveTo(x, groundY - hgt * 0.45);
  ctx.lineTo(x + hgt * 0.15, groundY);
  ctx.stroke();
}

function drawTower(ctx: CanvasRenderingContext2D, w: number, h: number, t: Tower, d: number, theta: number, checked: boolean | null) {
  const groundY = h - 26;
  const towerX = w - 60;
  // Scale so the full walk and the tower fit, keeping the person visible.
  const k = Math.min((h - 50) / t.H, (w - 110) / d);
  const X = (m: number) => towerX - m * k;
  const Y = (m: number) => groundY - m * k;
  const px = X(d);
  // An eye 1.5 m up is tiny on a 72 m scale; draw the person at least 18 px tall so they stay visible.
  const eyePx = Math.max(EYE * k, 18);
  const eyeY = groundY - eyePx;

  // Ground and the object.
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();
  const topY = Y(t.H);
  const g = ctx.createLinearGradient(0, topY, 0, groundY);
  g.addColorStop(0, "rgba(167,139,250,0.55)");
  g.addColorStop(1, "rgba(34,211,238,0.25)");
  ctx.fillStyle = g;
  const half = Math.max(6, Math.min(20, t.H * k * 0.08));
  ctx.beginPath();
  ctx.moveTo(towerX - half, groundY);
  ctx.lineTo(towerX - half * 0.55, topY);
  ctx.lineTo(towerX + half * 0.55, topY);
  ctx.lineTo(towerX + half, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.emoji, towerX, topY - 6);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const known = !t.mystery || checked;
  ctx.fillText(known ? `${t.H} m` : "? m", towerX + 32, (topY + groundY) / 2);

  // The person, the level line from the eye and the line of sight.
  person(ctx, px, groundY, eyeY);
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, eyeY);
  ctx.lineTo(towerX, eyeY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(px, eyeY);
  ctx.lineTo(towerX, topY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // The drawn sight line runs from the drawn eye, which may sit a little above the true eye.
  const drawnAngle = Math.atan2(eyeY - topY, towerX - px);
  angleArc(ctx, px, eyeY, 34, -drawnAngle, 0, `θ = ${theta}°`, 1);

  // Distance label.
  ctx.fillStyle = "#67e8f9";
  ctx.textAlign = "center";
  ctx.fillText(`d = ${d} m`, (px + towerX) / 2, groundY + 16);
  ctx.textAlign = "left";
}

function drawSea(ctx: CanvasRenderingContext2D, w: number, h: number, boat: number, dep: number) {
  const seaY = h - 30;
  const lhX = 50;
  const k = Math.min((h - 60) / LAMP_H, (w - 110) / boat);
  const X = (m: number) => lhX + m * k;
  const lampY = seaY - LAMP_H * k;

  // Sea.
  ctx.fillStyle = "rgba(56,189,248,0.15)";
  ctx.fillRect(0, seaY, w, h - seaY);
  ctx.strokeStyle = "rgba(56,189,248,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, seaY);
  ctx.lineTo(w, seaY);
  ctx.stroke();

  // Lighthouse with red and white bands.
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.75)" : "rgba(244,63,94,0.75)";
    const y1 = seaY - ((i + 1) * (seaY - lampY)) / bands;
    const y0 = seaY - (i * (seaY - lampY)) / bands;
    ctx.fillRect(lhX - 10, y1, 20, y0 - y1);
  }
  ctx.fillStyle = "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(lhX, lampY - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Boat.
  const bx = X(boat);
  ctx.fillStyle = "#fb923c";
  ctx.beginPath();
  ctx.moveTo(bx - 14, seaY - 8);
  ctx.lineTo(bx + 14, seaY - 8);
  ctx.lineTo(bx + 9, seaY);
  ctx.lineTo(bx - 9, seaY);
  ctx.closePath();
  ctx.fill();

  // Horizontal from the lamp, line of sight, and both angles.
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lhX, lampY);
  ctx.lineTo(w - 10, lampY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#fde047";
  ctx.beginPath();
  ctx.moveTo(lhX, lampY);
  ctx.lineTo(bx, seaY - 8);
  ctx.stroke();
  const a = Math.atan2(seaY - 8 - lampY, bx - lhX);
  angleArc(ctx, lhX, lampY, 40, 0, a, `${dep}°`, 1);
  angleArc(ctx, bx, seaY - 8, 30, Math.PI + a, Math.PI, `${dep}°`, -1);

  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`${LAMP_H} m`, lhX + 14, (lampY + seaY) / 2);
  ctx.fillStyle = "#67e8f9";
  ctx.textAlign = "center";
  ctx.fillText(`${boat} m`, (lhX + bx) / 2, seaY + 18);
  ctx.textAlign = "left";
}
