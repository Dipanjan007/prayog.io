"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  FLOORS,
  SHAPES,
  SHAPE_NAME,
  angleSum,
  canAdd,
  floorTiles,
  gapLeft,
  interiorAngle,
  nearestCorner,
  roundSolved,
  vertexFit,
  type Fit,
  type FloorId,
  type Pt,
  type Sides,
  type TileRound,
} from "@/lib/sim/tiling";

export type TilingMode = "corner" | "floor";

export type TilingReading =
  | { mode: "corner"; tiles: number[]; fit: Fit }
  | { mode: "floor"; floor: FloorId; mixed: boolean }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: TilingReading) => void;
  /** Challenge: some tiles are already laid round the corner; the student finishes it. */
  round?: TileRound | null;
}

export const TILE_COL: Record<number, string> = {
  3: "#22d3ee",
  4: "#f472b6",
  5: "#facc15",
  6: "#a3e635",
  8: "#a78bfa",
  10: "#fb923c",
  12: "#2dd4bf",
};
const RAD = Math.PI / 180;
const MAX_TILES = 8;

export default function TilingLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<TilingMode>("corner");
  const [tiles, setTiles] = useState<number[]>([]);
  const [floor, setFloor] = useState<FloorId>("squares");
  const [laid, setLaid] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: TilingMode = round ? "corner" : mode;
  const fixed = round ? round.fixed : [];
  const all = [...fixed, ...tiles];
  const fit = all.length ? vertexFit(all) : "gap";
  const sum = angleSum(all);
  const left = gapLeft(all);
  const floorDef = FLOORS.find((f) => f.id === floor)!;

  const tilesKey = tiles.join(".");
  useEffect(() => {
    if (round) return;
    if (activeMode === "corner") onReadingRef.current?.({ mode: "corner", tiles: tilesKey ? tilesKey.split(".").map(Number) : [], fit });
    else onReadingRef.current?.({ mode: "floor", floor, mixed: new Set(FLOORS.find((f) => f.id === floor)!.vertex).size > 1 });
  }, [round, activeMode, tilesKey, fit, floor]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const allKey = all.join(".");
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "corner") drawCorner(ctx, size.w, size.h, allKey ? allKey.split(".").map(Number) : [], fixed.length);
    else drawFloor(ctx, size.w, size.h, floor);
  }, [size, activeMode, allKey, fixed.length, floor]);

  const add = (n: number) => {
    if (!canAdd(all) || all.length >= MAX_TILES) return;
    setTiles((t) => [...t, n]);
    setLaid(null);
  };
  const removeLast = () => {
    setTiles((t) => t.slice(0, -1));
    setLaid(null);
  };
  const clear = () => {
    setTiles([]);
    setLaid(null);
  };
  const lay = () => {
    if (!round) return;
    const ok = roundSolved(round, tiles);
    setLaid(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const sumText = all.length ? `${all.map((n) => `${interiorAngle(n)}°`).join(" + ")} = ${sum}°` : "No tiles yet: 360° to fill";
  const fitText = !all.length ? "" : fit === "fits" ? "fills the point exactly" : fit === "gap" ? `${left}° gap left` : `overlaps by ${-left}°`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["corner", "floor"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={activeMode === m} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "corner" ? "Corner" : "Floor"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "corner"
            ? `Tiles round one point: ${all.length ? all.map((n) => SHAPE_NAME[n as Sides]).join(", ") : "none yet"}. ${sumText}${fitText ? `, ${fitText}` : ""}.`
            : `A floor of ${floorDef.name.toLowerCase()}. At the marked corner: ${floorDef.vertex.map((n) => `${interiorAngle(n)}°`).join(" + ")} = 360°.`
        }
      />

      {activeMode === "corner" ? (
        <>
          <div
            className={`rounded-2xl border px-3 py-2 text-center text-sm ${
              fit === "fits" && all.length ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : fit === "overlap" ? "border-rose-300/40 bg-rose-300/10 text-rose-100" : "border-white/10 bg-white/[0.03] text-white/80"
            }`}
            aria-live="polite"
          >
            <div className="tabular-nums">{sumText}</div>
            {fitText && <div className="mt-0.5 text-xs">{fitText}</div>}
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {SHAPES.map((n) => (
              <button
                key={n}
                onClick={() => add(n)}
                disabled={!canAdd(all) || all.length >= MAX_TILES}
                aria-label={`Add a ${SHAPE_NAME[n].toLowerCase()}`}
                className="rounded-xl border border-white/10 px-1 py-1.5 text-center text-xs disabled:opacity-30"
                style={{ color: TILE_COL[n] }}
              >
                <div>{SHAPE_NAME[n]}</div>
                <div className="tabular-nums text-white/70">{interiorAngle(n)}°</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !px-2 !py-1.5 text-sm" onClick={removeLast} disabled={!tiles.length}>
              Remove last tile
            </button>
            <button className="btn-ghost !px-2 !py-1.5 text-sm" onClick={clear} disabled={!tiles.length}>
              {round ? "Lift my tiles" : "Clear the corner"}
            </button>
          </div>
          {round ? (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={lay} disabled={!tiles.length}>
                Lay the tiles
              </button>
              {laid !== null && (
                <p className={`text-center text-sm ${laid ? "text-lime-300" : "text-amber-200"}`}>
                  {laid
                    ? `Perfect fit: ${sumText}.`
                    : fit === "gap"
                      ? `A ${left}° gap is left. Add a tile whose angle fills it.`
                      : `The tiles overlap by ${-left}°. Lift a tile and try a smaller one.`}
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-xs text-white/40">Tiles go round the point anticlockwise. You can add a tile while there is still a gap.</p>
          )}
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-lime-300/40 bg-lime-300/10 px-3 py-2 text-center text-sm text-lime-100">
            At the marked corner: {floorDef.vertex.map((n) => `${interiorAngle(n)}°`).join(" + ")} = 360°
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {FLOORS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFloor(f.id)}
                aria-pressed={floor === f.id}
                className={`rounded-xl border px-2 py-2 text-sm ${floor === f.id ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-white/10 text-white/70"}`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-white/40">Every corner of these floors has the same tiles round it.</p>
        </>
      )}
    </div>
  );
}

/** Corners of a regular n-gon (side 1) with one corner at the origin, starting along direction `start` (degrees). */
function tileAt(n: number, start: number): Pt[] {
  const ext = 360 / n;
  const pts: Pt[] = [{ x: 0, y: 0 }];
  let p = { x: 0, y: 0 };
  for (let k = 0; k < n - 1; k++) {
    const d = (start + k * ext) * RAD;
    p = { x: p.x + Math.cos(d), y: p.y + Math.sin(d) };
    pts.push(p);
  }
  return pts;
}

function drawCorner(ctx: CanvasRenderingContext2D, w: number, h: number, tiles: number[], fixedCount: number) {
  // Lay tiles round the origin anticlockwise, starting pointing right.
  let start = 0;
  const polys = tiles.map((n) => {
    const pts = tileAt(n, start);
    const from = start;
    start += interiorAngle(n);
    return { n, pts, from, to: start };
  });
  const all = [{ x: -1.1, y: -1.1 }, { x: 1.1, y: 1.1 }, ...polys.flatMap((p) => p.pts)];
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  const k = Math.min((w - 28) / (maxX - minX), (h - 28) / (maxY - minY), 110);
  const ox = w / 2 - ((minX + maxX) / 2) * k;
  const oy = h / 2 + ((minY + maxY) / 2) * k;
  const P = (p: Pt) => ({ x: ox + p.x * k, y: oy - p.y * k });

  const used = angleSum(tiles);
  // The gap still to fill.
  if (used < 360 - 1e-9) {
    ctx.fillStyle = "rgba(250,204,21,0.12)";
    ctx.strokeStyle = "rgba(250,204,21,0.6)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, 0.75 * k, -used * RAD, -360 * RAD, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  polys.forEach((poly, i) => {
    const overlaps = poly.to > 360 + 1e-9;
    const col = overlaps ? "#fb7185" : TILE_COL[poly.n];
    const s = poly.pts.map(P);
    ctx.fillStyle = col + (overlaps ? "40" : i < fixedCount ? "22" : "33");
    ctx.strokeStyle = i < fixedCount ? "rgba(255,255,255,0.75)" : col;
    ctx.lineWidth = 2;
    ctx.setLineDash(overlaps ? [6, 4] : []);
    ctx.beginPath();
    s.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    // The tile's angle at the point, written inside the tile.
    const cx = s.reduce((a, p) => a + p.x, 0) / s.length;
    const cy = s.reduce((a, p) => a + p.y, 0) / s.length;
    ctx.fillStyle = col;
    ctx.font = `bold ${k < 40 ? 10 : 12}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${interiorAngle(poly.n)}°`, cx, cy + 4);
  });

  // The point itself.
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  if (used < 360 - 1e-9) {
    // Label the gap along its middle direction, clear of the tiles.
    const mid = ((used + 360) / 2) * RAD;
    const r = (360 - used < 90 ? 1 : 0.45) * k;
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    const tx = Math.max(30, Math.min(w - 30, ox + Math.cos(mid) * r));
    const ty = Math.max(14, Math.min(h - 8, oy - Math.sin(mid) * r));
    ctx.fillText(tiles.length ? `${Math.round((360 - used) * 1e6) / 1e6}° gap` : "360° to fill", tx, ty + 4);
  }
  ctx.textAlign = "left";
}

function drawFloor(ctx: CanvasRenderingContext2D, w: number, h: number, id: FloorId) {
  const side = Math.max(28, Math.min(40, w / 10));
  const tiles = floorTiles(id, w / side / 2 + 2, h / side / 2 + 2);
  // Put a corner of the pattern at the middle of the canvas.
  const c = nearestCorner(tiles, { x: 0, y: 0 });
  const P = (p: Pt) => ({ x: w / 2 + (p.x - c.x) * side, y: h / 2 - (p.y - c.y) * side });
  for (const t of tiles) {
    const col = TILE_COL[t.n];
    const s = t.pts.map(P);
    ctx.fillStyle = col + "2a";
    ctx.strokeStyle = col + "cc";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    s.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Mark the corner and the angle each tile makes there.
  const at = tiles.filter((t) => t.pts.some((q) => Math.hypot(q.x - c.x, q.y - c.y) < 1e-6));
  for (const t of at) {
    const i = t.pts.findIndex((q) => Math.hypot(q.x - c.x, q.y - c.y) < 1e-6);
    const prev = t.pts[(i - 1 + t.n) % t.n];
    const next = t.pts[(i + 1) % t.n];
    // Sweep anticlockwise across the inside of the tile, whichever way its corners are listed.
    let a1 = Math.atan2(next.y - c.y, next.x - c.x);
    let a2 = Math.atan2(prev.y - c.y, prev.x - c.x);
    const sweep = (((a2 - a1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (Math.abs(sweep - interiorAngle(t.n) * RAD) > 1e-6) [a1, a2] = [a2, a1];
    if (a2 < a1) a2 += Math.PI * 2;
    ctx.strokeStyle = TILE_COL[t.n];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 0.32 * side, -a1, -a2, true);
    ctx.stroke();
  }
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#0a0d1c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
