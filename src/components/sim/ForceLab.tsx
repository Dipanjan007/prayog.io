"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BALANCE_MAX,
  CRATE_WIDTH,
  G_EARTH,
  G_MOON,
  ITEMS,
  MAX_PUSH,
  PIECES,
  SOURCES,
  SURFACES,
  TRACK_LENGTH,
  frictionOn,
  lifts,
  maxStatic,
  pullRatio,
  springStretch,
  stepCrate,
  weight,
  type FrictionKind,
  type ItemId,
  type PieceId,
  type SourceId,
  type SurfaceId,
} from "@/lib/sim/forces";

export type ForceMode = "push" | "spring" | "field";
export type Place = "earth" | "moon";

export type ForceReading =
  | {
      mode: "push";
      surface: SurfaceId;
      push: number;
      pushing: boolean;
      friction: number;
      kind: FrictionKind;
      x: number;
      v: number;
      /** Pushing, but static friction is holding the crate still. */
      heldStill: boolean;
      /** Set when the crate has come to rest after moving. `id` grows with every stop. */
      stop: { id: number; x: number; coasted: boolean; hitWall: boolean } | null;
    }
  | { mode: "spring"; item: ItemId; place: Place; weight: number }
  | { mode: "field"; source: SourceId; piece: PieceId; gap: number; lifted: boolean };

interface Props {
  onReading?: (r: ForceReading) => void;
  /** Challenge: the floor is fixed, a target zone is shown, and you get one push per try. */
  challenge?: { surface: SurfaceId; zone: [number, number]; push: number } | null;
}

const LEFT = 46; // px kept free at the left of the floor for the person pushing
const RIGHT = 14;

export default function ForceLab({ onReading, challenge = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ForceMode>("push");
  const [surfacePick, setSurface] = useState<SurfaceId>("wood");
  const [pushPick, setPush] = useState(60);
  const [pushing, setPushing] = useState(false);
  const [item, setItem] = useState<ItemId>("bottle");
  const [place, setPlace] = useState<Place>("earth");
  const [source, setSource] = useState<SourceId>("magnet");
  const [piece, setPiece] = useState<PieceId>("pins");
  const [gap, setGap] = useState(6);
  const [locked, setLocked] = useState(false);
  const [display, setDisplay] = useState({ x: 0, v: 0, friction: 0, kind: "none" as FrictionKind });

  const activeMode: ForceMode = challenge ? "push" : mode;
  const surface = challenge?.surface ?? surfacePick;
  const push = challenge?.push ?? pushPick;

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  // Everything the animation loop needs, kept in a ref so the loop never restarts.
  const live = useRef({ mode: activeMode, surface, push, pushing, item, place, source, piece, gap, challenge, locked });
  useEffect(() => {
    live.current = { mode: activeMode, surface, push, pushing, item, place, source, piece, gap, challenge, locked };
  });

  const crate = useRef({
    x: 0,
    v: 0,
    personX: 0,
    stopId: 0,
    stop: null as null | { id: number; x: number; coasted: boolean; hitWall: boolean },
    triedThisRun: false,
    result: null as null | { x: number; inZone: boolean; hitWall: boolean },
  });

  const reset = useCallback(() => {
    Object.assign(crate.current, { x: 0, v: 0, personX: 0, stop: null, triedThisRun: false, result: null });
    setLocked(false);
    setDisplay({ x: 0, v: 0, friction: 0, kind: "none" });
  }, []);

  const press = useCallback((on: boolean) => {
    if (on && live.current.locked) return;
    setPushing(on);
    live.current.pushing = on;
  }, []);

  // Keyboard: hold → or Space to push.
  useEffect(() => {
    if (activeMode !== "push") return;
    const down = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== "ArrowRight" && e.key !== " ")) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" && e.key === "ArrowRight") return;
      e.preventDefault();
      press(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") press(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [activeMode, press]);

  // Report the static modes whenever they change.
  useEffect(() => {
    if (activeMode === "spring") onReadingRef.current?.({ mode: "spring", item, place, weight: weight(itemMass(item), place === "moon" ? G_MOON : G_EARTH) });
    if (activeMode === "field") onReadingRef.current?.({ mode: "field", source, piece, gap, lifted: lifts(source, piece, gap) });
  }, [activeMode, item, place, source, piece, gap]);

  // One animation loop draws every mode and runs the crate physics.
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    let lastReport = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const L = live.current;
      const s = crate.current;

      if (L.mode === "push") {
        const applied = L.pushing ? L.push : 0;
        const wasMoving = s.v > 0;
        const next = stepCrate({ x: s.x, v: s.v }, applied, L.surface, dt);
        s.x = next.x;
        s.v = next.v;
        if (L.pushing) s.personX = s.x;
        if (s.v > 0) s.triedThisRun = true;
        // Challenge: one push per try. Once the crate is moving and you let go, the push is locked.
        if (L.challenge && s.triedThisRun && !L.pushing && !L.locked) {
          L.locked = true;
          setLocked(true);
        }
        if (wasMoving && s.v === 0) {
          s.stopId += 1;
          s.stop = { id: s.stopId, x: s.x, coasted: !L.pushing, hitWall: next.hitWall };
          if (L.challenge) {
            const [a, b] = L.challenge.zone;
            s.result = { x: s.x, inZone: !next.hitWall && s.x >= a && s.x + CRATE_WIDTH <= b, hitWall: next.hitWall };
            if (!L.locked) {
              L.locked = true;
              setLocked(true);
            }
          }
        }
        const f = frictionOn(applied, s.v, L.surface);
        if (now - lastReport > 100) {
          lastReport = now;
          setDisplay({ x: s.x, v: s.v, friction: f.friction, kind: f.kind });
          onReadingRef.current?.({
            mode: "push",
            surface: L.surface,
            push: L.push,
            pushing: L.pushing,
            friction: f.friction,
            kind: f.kind,
            x: s.x,
            v: s.v,
            heldStill: L.pushing && L.push > 0 && s.v === 0,
            stop: s.v === 0 ? s.stop : null,
          });
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (L.mode === "push") {
        const applied = L.pushing ? L.push : 0;
        const f = frictionOn(applied, s.v, L.surface);
        drawPush(ctx, w, h, { ...s, surface: L.surface, push: applied, friction: f.friction, kind: f.kind, zone: L.challenge?.zone ?? null });
      } else if (L.mode === "spring") drawSpring(ctx, w, h, L.item, L.place);
      else drawField(ctx, w, h, L.source, L.piece, L.gap);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const g = place === "moon" ? G_MOON : G_EARTH;
  const it = ITEMS.find((x) => x.id === item)!;
  const W = weight(it.mass, g);
  const ratio = pullRatio(source, piece, gap);
  const lifted = ratio >= 1;
  const limit = maxStatic(surface);

  const ariaLabel =
    activeMode === "push"
      ? `A crate on ${SURFACES[surface].label.toLowerCase()} at ${display.x.toFixed(1)} metres. Push ${pushing ? push : 0} newtons to the right, friction ${display.friction.toFixed(0)} newtons to the left, speed ${display.v.toFixed(1)} metres per second.`
      : activeMode === "spring"
        ? `A spring balance holding a ${it.label.toLowerCase()} of mass ${it.mass} kilograms on the ${place === "moon" ? "Moon" : "Earth"}. It reads ${W.toFixed(1)} newtons.`
        : `A ${SOURCES[source].label.toLowerCase()} held ${gap} centimetres above ${PIECES[piece].label.toLowerCase()}. ${lifted ? "The pieces jump up to it." : "The pieces stay on the table."}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!challenge && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(
            [
              ["push", "Push a crate"],
              ["spring", "Spring balance"],
              ["field", "No touch"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                press(false);
                setMode(m);
              }}
              className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-56 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72" role="img" aria-label={ariaLabel} />

      {activeMode === "push" && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Readout label="Push" value={(pushing ? push : 0).toFixed(0)} unit="N" />
            <Readout label="Friction" value={display.friction.toFixed(0)} unit="N" sub={display.kind === "none" ? "—" : display.kind === "static" ? "static" : "sliding"} />
            <Readout label="Speed" value={display.v.toFixed(2)} unit="m/s" />
            <Readout label="Distance" value={display.x.toFixed(2)} unit="m" />
          </div>
          {!challenge && (
            <Choice
              options={(Object.keys(SURFACES) as SurfaceId[]).map((id) => ({ id, label: SURFACES[id].label }))}
              value={surfacePick}
              onChange={setSurface}
            />
          )}
          {challenge ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <span className="text-white/60">Push force on this floor: </span>
              <span className="tabular-nums text-white">{push} N</span>
            </div>
          ) : (
            <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Push force</span>
                <span className="tabular-nums text-white">{push} N</span>
              </div>
              <input type="range" className="range mt-2 w-full" min={0} max={MAX_PUSH} step={5} value={push} onChange={(e) => setPush(Number(e.target.value))} />
            </label>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              disabled={locked}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                press(true);
              }}
              onPointerUp={() => press(false)}
              onPointerCancel={() => press(false)}
              onContextMenu={(e) => e.preventDefault()}
              className={`touch-none rounded-2xl border py-4 font-semibold transition disabled:opacity-40 ${
                pushing ? "border-lime-300 bg-lime-400/30" : "border-lime-300/30 bg-lime-400/10"
              }`}
            >
              {locked ? "Push used: press Reset" : "Hold to push ▶"}
            </button>
            <button onClick={reset} className="rounded-2xl border border-white/10 px-4 text-sm text-white/70 hover:bg-white/10">
              Reset
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            Crate mass 20 kg. On {SURFACES[surface].label.toLowerCase()}, static friction can hold up to {limit.toFixed(0)} N.
            {challenge ? " One push per try: hold, then let go." : " Keyboard: hold → or Space to push."}
          </p>
        </>
      )}

      {activeMode === "spring" && (
        <>
          <Choice options={ITEMS.map((x) => ({ id: x.id, label: `${x.emoji} ${x.label}` }))} value={item} onChange={setItem} />
          <Choice
            options={[
              { id: "earth" as Place, label: "On the Earth (g = 9.8)" },
              { id: "moon" as Place, label: "On the Moon (g = 1.6)" },
            ]}
            value={place}
            onChange={setPlace}
          />
          <p className="text-center text-xs text-white/40">
            W = m × g = {it.mass} kg × {g} m/s² = {W.toFixed(2)} N. The mass is the same everywhere; the weight is not.
          </p>
        </>
      )}

      {activeMode === "field" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Gap" value={gap.toFixed(1)} unit="cm" />
            <Readout label="Pull vs weight" value={ratio === 0 ? "none" : ratio >= 10 ? ">10×" : `${ratio.toFixed(1)}×`} unit="" sub={lifted ? "pull wins" : "gravity wins"} />
          </div>
          <Choice options={(Object.keys(SOURCES) as SourceId[]).map((id) => ({ id, label: SOURCES[id].label }))} value={source} onChange={setSource} />
          <Choice options={(Object.keys(PIECES) as PieceId[]).map((id) => ({ id, label: PIECES[id].label }))} value={piece} onChange={setPiece} />
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Gap above the pieces</span>
              <span className="tabular-nums text-white">{gap.toFixed(1)} cm</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0.5} max={8} step={0.5} value={gap} onChange={(e) => setGap(Number(e.target.value))} />
          </label>
          <p className="text-center text-xs text-white/40">Rub the comb in dry hair to charge it. The pull sizes here are for showing the idea, not measured.</p>
        </>
      )}
    </div>
  );
}

function itemMass(id: ItemId) {
  return ITEMS.find((x) => x.id === id)!.mass;
}

function Readout({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-lg tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs text-white/50">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-white/40">{sub}</div>}
    </div>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Drawing ---------- */

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 4) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = Math.min(10, len * 0.6);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * head * 0.55, y2 - uy * head + ux * head * 0.55);
  ctx.lineTo(x2 - ux * head + uy * head * 0.55, y2 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}

interface PushScene {
  x: number;
  v: number;
  personX: number;
  surface: SurfaceId;
  push: number;
  friction: number;
  kind: FrictionKind;
  zone: [number, number] | null;
  result: null | { x: number; inZone: boolean; hitWall: boolean };
}

function drawPush(ctx: CanvasRenderingContext2D, w: number, h: number, s: PushScene) {
  const floorY = Math.round(h * 0.7);
  const ppm = (w - LEFT - RIGHT) / TRACK_LENGTH;
  const X = (m: number) => LEFT + m * ppm;
  const surf = SURFACES[s.surface];

  // Back wall glow and floor.
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(0, 0, w, floorY);
  ctx.fillStyle = surf.color;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(0, floorY, w, h - floorY);
  ctx.globalAlpha = 1;
  ctx.fillStyle = surf.color;
  ctx.fillRect(0, floorY, w, 3);
  // Floor texture: speckles for rough floors, streaks for ice.
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  const grain = s.surface === "ice" ? 0 : s.surface === "wood" ? 14 : s.surface === "carpet" ? 6 : 3;
  if (grain) for (let px = 4; px < w; px += grain) ctx.fillRect(px, floorY + 6 + ((px * 7) % 9), s.surface === "wood" ? 8 : 1.5, 1.5);
  else for (let px = 10; px < w; px += 60) ctx.fillRect(px, floorY + 10, 30, 1);

  // Target zone.
  if (s.zone) {
    const [a, b] = s.zone;
    ctx.fillStyle = "rgba(163,230,53,0.22)";
    ctx.fillRect(X(a), floorY - 4, (b - a) * ppm, h - floorY + 4);
    ctx.fillStyle = "#a3e635";
    ctx.fillRect(X(a) - 1, floorY - 4, 2, h - floorY + 4);
    ctx.fillRect(X(b) - 1, floorY - 4, 2, h - floorY + 4);
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TARGET", X((a + b) / 2), h - 6);
  }

  // Metre marks.
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let m = 0; m <= TRACK_LENGTH - 1; m++) {
    ctx.fillStyle = m === 0 ? "#f472b6" : "rgba(255,255,255,0.45)";
    ctx.fillRect(X(m) - 0.75, floorY + 3, 1.5, 6);
    if (!(s.zone && m > s.zone[0] - 0.4 && m < s.zone[1] + 0.4)) ctx.fillText(m === 0 ? "start" : `${m} m`, X(m), floorY + 22);
  }

  // Wall.
  ctx.fillStyle = "#334155";
  ctx.fillRect(X(TRACK_LENGTH), floorY - h * 0.5, RIGHT, h * 0.5);

  // Crate (drawn to scale: 0.6 m wide).
  const cw = CRATE_WIDTH * ppm;
  const ch = Math.min(cw, h * 0.32);
  const cx = X(s.x);
  const cy = floorY - ch;
  ctx.fillStyle = "#a16207";
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = 2;
  ctx.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 2);
  ctx.lineTo(cx + cw - 2, cy + ch - 2);
  ctx.moveTo(cx + cw - 2, cy + 2);
  ctx.lineTo(cx + 2, cy + ch - 2);
  ctx.stroke();

  // Person: hands on the crate while pushing; left behind when you let go.
  const pushingNow = s.push > 0;
  const px = X(s.personX) - 4;
  const lean = pushingNow ? 10 : 0;
  const ph = Math.min(64, floorY - 20);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const hip = { x: px - 14, y: floorY - ph * 0.45 };
  const neck = { x: hip.x + lean, y: floorY - ph * 0.85 };
  ctx.beginPath();
  ctx.moveTo(hip.x - 8, floorY);
  ctx.lineTo(hip.x, hip.y);
  ctx.lineTo(hip.x + 4, floorY);
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(neck.x, neck.y);
  ctx.moveTo(neck.x, neck.y + 4);
  ctx.lineTo(pushingNow ? px : neck.x + 6, pushingNow ? Math.max(cy + ch * 0.4, neck.y + 4) : neck.y + 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(neck.x + 2, neck.y - 7, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Force arrows. Scale: the full 300 N push is up to 40% of the canvas width.
  const scale = Math.min(170, w * 0.4) / 300;
  const midY = cy + ch / 2;
  const centre = cx + cw / 2;
  if (s.push > 0) arrow(ctx, centre, midY, centre + s.push * scale, midY, "#a3e635");
  if (s.friction > 0) arrow(ctx, centre, floorY - 3, Math.max(4, centre - s.friction * scale), floorY - 3, "#fb7185");

  // Legend with values.
  const net = s.push - s.friction;
  ctx.textAlign = "left";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "#a3e635";
  ctx.fillText(`→ Push ${s.push.toFixed(0)} N`, 10, 18);
  ctx.fillStyle = "#fb7185";
  ctx.fillText(`← Friction ${s.friction.toFixed(0)} N${s.kind === "static" ? " (static)" : s.kind === "kinetic" ? " (sliding)" : ""}`, 10, 35);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const status =
    s.result
      ? s.result.inZone
        ? "Stopped inside the target!"
        : s.result.hitWall
          ? "Crash! It hit the wall."
          : `Stopped at ${s.result.x.toFixed(2)} m: missed.`
      : s.v > 0
        ? s.push > 0
          ? net > 0
            ? `Net force ${net.toFixed(0)} N forward: speeding up`
            : `Net force ${(-net).toFixed(0)} N backward: slowing`
          : "No push: friction slows it down"
        : s.push > 0
          ? "Balanced: friction holds it still"
          : "At rest";
  ctx.fillStyle = s.result ? (s.result.inZone ? "#a3e635" : "#fda4af") : "rgba(255,255,255,0.75)";
  ctx.fillText(status, 10, 52);
}

function drawSpring(ctx: CanvasRenderingContext2D, w: number, h: number, itemId: ItemId, place: Place) {
  const item = ITEMS.find((x) => x.id === itemId)!;
  const g = place === "moon" ? G_MOON : G_EARTH;
  const W = weight(item.mass, g);
  const stretch = springStretch(W);

  const bx = Math.round(Math.max(76, w * 0.24));
  const top = 12;
  const caseH = Math.round(h * 0.52);
  const zeroY = top + 26; // the spring has its own length even with nothing hanging
  const span = caseH - 34;
  const pointerY = zeroY + stretch * span;

  // Ceiling hook.
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(bx - 40, 0, 80, 4);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, 4);
  ctx.lineTo(bx, top);
  ctx.stroke();

  // Casing.
  const cwid = 54;
  ctx.fillStyle = "rgba(125,211,252,0.1)";
  ctx.strokeStyle = "rgba(125,211,252,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx - cwid / 2, top, cwid, caseH, 8);
  ctx.fill();
  ctx.stroke();

  // Scale: 0 to 50 N, labels every 10 N on the left.
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  for (let n = 0; n <= BALANCE_MAX; n += 5) {
    const y = zeroY + (n / BALANCE_MAX) * span;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(bx - cwid / 2 + 4, y - 0.5, n % 10 === 0 ? 10 : 5, 1);
    if (n % 10 === 0) ctx.fillText(`${n}`, bx - cwid / 2 - 4, y + 3);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("N", bx - cwid / 2 - 14, top + caseH + 12);

  // Spring zigzag from the top of the casing down to the pointer.
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const turns = 9;
  const sTop = top + 4;
  ctx.moveTo(bx + 6, sTop);
  for (let i = 1; i <= turns * 2; i++) {
    const y = sTop + ((pointerY - sTop) * i) / (turns * 2);
    ctx.lineTo(bx + 6 + (i % 2 ? 8 : -8), y);
  }
  ctx.lineTo(bx + 6, pointerY);
  ctx.stroke();

  // Pointer.
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(bx - cwid / 2 + 3, pointerY);
  ctx.lineTo(bx - cwid / 2 + 14, pointerY - 4);
  ctx.lineTo(bx + 6, pointerY - 1.5);
  ctx.lineTo(bx + 6, pointerY + 1.5);
  ctx.lineTo(bx - cwid / 2 + 14, pointerY + 4);
  ctx.closePath();
  ctx.fill();

  // Rod and hook, sliding out as the spring stretches.
  const rodEnd = top + caseH + 10 + stretch * span * 0.15;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + 6, pointerY);
  ctx.lineTo(bx + 6, rodEnd);
  ctx.arc(bx + 6, rodEnd + 5, 5, -Math.PI / 2, Math.PI * 0.9);
  ctx.stroke();

  // The object.
  const iy = rodEnd + 12;
  const room = h - iy - 6;
  drawItem(ctx, itemId, bx + 6, iy, room);

  // Weight arrow and reading on the right.
  const rx = Math.round(Math.min(w * 0.5, bx + 92));
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("Spring balance reads", rx, 30);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText(`${W.toFixed(W < 10 ? 2 : 1)} N`, rx, 62);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`${item.label}: mass ${item.mass} kg`, rx, 86);
  ctx.fillText(place === "moon" ? "On the Moon, g = 1.6 m/s²" : "On the Earth, g = 9.8 m/s²", rx, 104);
  // Gravity arrow beside the object.
  const ax = Math.min(w - 16, bx + 6 + 44);
  const len = 14 + 40 * Math.min(1, W / BALANCE_MAX);
  arrow(ctx, ax, iy + 2, ax, Math.min(h - 4, iy + 2 + len), "#fb7185", 3);
  ctx.fillStyle = "#fb7185";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("weight", Math.min(ax + 6, w - 44), iy + 14);
}

function drawItem(ctx: CanvasRenderingContext2D, id: ItemId, x: number, y: number, room: number) {
  const s = Math.max(16, Math.min(room, 50));
  ctx.lineWidth = 1.5;
  if (id === "apple" || id === "ball") {
    const r = id === "apple" ? s * 0.32 : s * 0.24;
    ctx.fillStyle = id === "apple" ? "#ef4444" : "#b91c1c";
    ctx.beginPath();
    ctx.arc(x, y + r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = id === "apple" ? "#4ade80" : "rgba(255,255,255,0.8)";
    ctx.beginPath();
    if (id === "apple") {
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + 4, y - 3);
    } else {
      ctx.arc(x - r * 1.6, y + r, r * 1.4, -0.6, 0.6);
    }
    ctx.stroke();
  } else if (id === "bottle") {
    ctx.fillStyle = "rgba(56,189,248,0.6)";
    ctx.fillRect(x - s * 0.17, y + s * 0.2, s * 0.34, s * 0.8);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x - s * 0.08, y, s * 0.16, s * 0.22);
  } else if (id === "bag") {
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath();
    ctx.roundRect(x - s * 0.4, y + 4, s * 0.8, s * 0.9, 8);
    ctx.fill();
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(x - s * 0.25, y + s * 0.5, s * 0.5, s * 0.25);
  } else {
    ctx.fillStyle = "#e7d3a8";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y);
    ctx.lineTo(x + s * 0.2, y);
    ctx.lineTo(x + s * 0.5, y + s);
    ctx.lineTo(x - s * 0.5, y + s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RICE", x, y + s * 0.7);
    ctx.textAlign = "left";
  }
}

function drawField(ctx: CanvasRenderingContext2D, w: number, h: number, source: SourceId, piece: PieceId, gap: number) {
  const tableY = h - 26;
  const pxPerCm = (tableY - 64) / 8;
  const cx = Math.round(w * 0.55);
  const ratio = pullRatio(source, piece, gap);
  const up = ratio >= 1;
  const srcBottom = tableY - gap * pxPerCm;
  const srcW = Math.min(170, w * 0.45);

  // Table.
  ctx.fillStyle = "rgba(180,83,9,0.35)";
  ctx.fillRect(0, tableY, w, h - tableY);
  ctx.fillStyle = "#b45309";
  ctx.fillRect(0, tableY, w, 2);

  // Gap measure on the left of the source.
  const mx = cx - srcW / 2 - 18;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(mx - 6, srcBottom);
  ctx.lineTo(cx - srcW / 2, srcBottom);
  ctx.stroke();
  ctx.setLineDash([]);
  if (tableY - srcBottom > 14) {
    arrow(ctx, mx, (srcBottom + tableY) / 2, mx, srcBottom + 1, "rgba(255,255,255,0.6)", 1.5);
    arrow(ctx, mx, (srcBottom + tableY) / 2, mx, tableY - 1, "rgba(255,255,255,0.6)", 1.5);
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${gap.toFixed(1)} cm`, mx - 5, Math.min(tableY - 4, (srcBottom + tableY) / 2 + 4));
  ctx.textAlign = "left";

  // Pull lines: brighter when the pull is stronger.
  if (ratio > 0 && !up) {
    ctx.strokeStyle = `rgba(103,232,249,${Math.min(0.8, 0.15 + ratio * 0.5)})`;
    ctx.setLineDash([2, 4]);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * srcW * 0.18, srcBottom + 2);
      ctx.lineTo(cx + i * 10, tableY - 4);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Pieces: on the table, or stuck to the source.
  const py = up ? srcBottom + 3 : tableY - 3;
  for (let i = 0; i < 7; i++) {
    const ox = cx + (i - 3) * Math.min(14, srcW / 8);
    const tilt = ((i * 37) % 7) / 7 - 0.5;
    if (piece === "pins") {
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (up) {
        ctx.moveTo(ox, py);
        ctx.lineTo(ox + tilt * 6, py + 16);
      } else {
        ctx.moveTo(ox - 7, py - tilt * 2);
        ctx.lineTo(ox + 7, py + tilt * 2);
      }
      ctx.stroke();
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(up ? ox : ox - 7, up ? py : py - tilt * 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.save();
      ctx.translate(ox, up ? py + 4 : py - 2);
      ctx.rotate(tilt);
      ctx.fillRect(-4, -3, 8, 6);
      ctx.restore();
    }
  }

  // The source.
  const sh = 22;
  const sy = srcBottom - sh;
  if (source === "magnet") {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(cx - srcW / 2, sy, srcW / 2, sh);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(cx, sy, srcW / 2, sh);
    ctx.fillStyle = "#fff";
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", cx - srcW / 4, sy + 16);
    ctx.fillText("S", cx + srcW / 4, sy + 16);
  } else {
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cx - srcW / 2, sy, srcW, sh * 0.5);
    for (let t = cx - srcW / 2 + 3; t < cx + srcW / 2 - 2; t += 5) ctx.fillRect(t, sy + sh * 0.5, 2.5, sh * 0.5);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - srcW / 2, sy, srcW, sh * 0.5);
    if (source === "rubbed") {
      ctx.fillStyle = "#fde047";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      for (let i = -2; i <= 2; i++) ctx.fillText("−", cx + i * srcW * 0.2, sy - 3);
    }
  }
  ctx.textAlign = "left";

  // Status.
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = up ? "#a3e635" : ratio > 0 ? "#fcd34d" : "rgba(255,255,255,0.7)";
  const name = PIECES[piece].label.toLowerCase();
  const msg = up
    ? `The pull beats gravity: the ${name} jump up!`
    : ratio > 0
      ? "Some pull, but gravity wins. Come closer."
      : source === "plain"
        ? "A plain comb has no charge: no pull."
        : `No pull on ${name}.`;
  ctx.fillText(msg, 10, 18);
}
