"use client";

import { useEffect, useRef, useState } from "react";
import {
  JUPITER_ARCSEC,
  MUMBAI_LAT,
  RED_BOW_DEG,
  SIRIUS_ARCSEC,
  SPECTRUM,
  SUN_DIAMETER_DEG,
  VIOLET_BOW_DEG,
  airPathKm,
  apparentAltitude,
  colourExponent,
  flickerAmplitude,
  hueOf,
  normalise,
  rainbowView,
  skyLight,
  sunClimbRate,
  sunLight,
  sunriseAdvanceMinutes,
  tankEndLight,
  tankSideLight,
  traceDrop,
  waterIndex,
  type Hue,
  type RGB,
  type RainbowReason,
} from "@/lib/sim/sky-optics";
import { fitCanvas } from "./canvas";

export type SkyMode = "tank" | "sky" | "twinkle" | "rainbow";
export type SkyRound = "rainbow" | "cloud" | "sunrise";
type City = "mumbai" | "kolkata";

export interface SkyReading {
  mode: SkyMode;
  tank: { size: number; length: number; sideHue: Hue; endHue: Hue };
  sky: { alt: number; air: boolean; city: City; sunHue: Hue; skyHue: Hue };
  twinkle: { view: "stars" | "sunrise"; turbulence: number; starFlicker: number; planetFlicker: number; t: number; air: boolean; sunVisible: boolean };
  rainbow: { view: "drop" | "sky"; sunAlt: number; sunOnLeft: boolean; observerX: number; visible: boolean; reason: RainbowReason };
}

interface Props {
  onReading?: (r: SkyReading) => void;
  /** Challenge round: locks the lab to one setup. */
  round?: SkyRound | null;
}

const LAT = MUMBAI_LAT;
const ADVANCE = sunriseAdvanceMinutes(LAT);
const CLIMB = sunClimbRate(LAT);
/** The rain shower in the rainbow scene (world units, ground at 0). */
const RAIN = { x0: 58, x1: 80, top: 30 };
const SUN_ARC = 44;
/** The challenge Sun: low in the east (left), fixed. */
const CHALLENGE_SUN = 25;

const STARS = (() => {
  let s = 777;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.1, p: rnd() * 6.28 }));
})();
const DOTS = (() => {
  let s = 4242;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), p: rnd() * 6.28 }));
})();

const MODES: { id: SkyMode; label: string }[] = [
  { id: "tank", label: "Scatter tank" },
  { id: "sky", label: "Sky" },
  { id: "twinkle", label: "Twinkle" },
  { id: "rainbow", label: "Rainbow" },
];

export default function SkyLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SkyMode>(round === "cloud" ? "tank" : round === "sunrise" ? "twinkle" : round === "rainbow" ? "rainbow" : "tank");
  const [sizeLog, setSizeLog] = useState(round === "cloud" ? 1.5 : 1.6);
  const [length, setLength] = useState(0.4);
  const [alt, setAlt] = useState(70);
  const [air, setAir] = useState(true);
  const [city, setCity] = useState<City>("mumbai");
  const [twView, setTwView] = useState<"stars" | "sunrise">(round === "sunrise" ? "sunrise" : "stars");
  const [turbulence, setTurbulence] = useState(0.2);
  const [t, setT] = useState(-5);
  const [sunAir, setSunAir] = useState(true);
  const [rbView, setRbView] = useState<"drop" | "sky">(round === "rainbow" ? "sky" : "drop");
  const [b, setB] = useState(0.5);
  const [sunAngle, setSunAngle] = useState(round === "rainbow" ? CHALLENGE_SUN : 150);
  const [observerX, setObserverX] = useState(round === "rainbow" ? 88 : 22);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SkyMode = round === "cloud" ? "tank" : round === "sunrise" ? "twinkle" : round === "rainbow" ? "rainbow" : mode;
  const activeTwView = round === "sunrise" ? "sunrise" : twView;
  const activeRbView = round === "rainbow" ? "sky" : rbView;
  const activeSunAir = round === "sunrise" ? true : sunAir;

  const size = Math.round(10 ** sizeLog);
  const side = tankSideLight(size, 0);
  const end = tankEndLight(size, length);
  const sideHue = hueOf(side);
  const endHue = hueOf(end);

  const sunHue = hueOf(sunLight(alt, air ? 1 : 0));
  const skyHue = hueOf(skyLight(alt, 90, air ? 1 : 0));

  const starFlicker = turbulence * flickerAmplitude(SIRIUS_ARCSEC);
  const planetFlicker = turbulence * flickerAmplitude(JUPITER_ARCSEC);
  // t is minutes from the moment the Sun's top edge would reach the horizon if there were no air.
  const topTrue = CLIMB * t;
  const sunVisible = apparentAltitude(topTrue, activeSunAir ? 1 : 0) >= 0;

  const sunOnLeft = sunAngle < 90;
  const rbAlt = sunOnLeft ? sunAngle : 180 - sunAngle;
  const bow = rainbowView({ sunAlt: rbAlt, sunOnLeft, observerX, rain: RAIN });

  // Everything the animation loop reads, kept fresh without restarting the loop.
  const params = useRef({ activeMode, size, length, alt, air, city, activeTwView, turbulence, t, activeSunAir, activeRbView, b, sunAngle, observerX, round });
  useEffect(() => {
    params.current = { activeMode, size, length, alt, air, city, activeTwView, turbulence, t, activeSunAir, activeRbView, b, sunAngle, observerX, round };
  });

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      tank: { size, length, sideHue, endHue },
      sky: { alt, air, city, sunHue, skyHue },
      twinkle: { view: activeTwView, turbulence, starFlicker, planetFlicker, t, air: activeSunAir, sunVisible },
      rainbow: { view: activeRbView, sunAlt: rbAlt, sunOnLeft, observerX, visible: bow.visible, reason: bow.reason },
    });
  }, [activeMode, size, length, sideHue, endHue, alt, air, city, sunHue, skyHue, activeTwView, turbulence, starFlicker, planetFlicker, t, activeSunAir, sunVisible, activeRbView, rbAlt, sunOnLeft, observerX, bow.visible, bow.reason]);

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let clock = 0;
    let last = performance.now();
    const hist: { s: number; p: number }[] = [];
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt;
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;
      if (P.activeMode === "tank") drawTank(ctx, w, h, P.size, P.length, clock);
      else if (P.activeMode === "sky") drawSky(ctx, w, h, P.alt, P.air, P.city);
      else if (P.activeMode === "twinkle") {
        if (P.activeTwView === "stars") drawTwinkle(ctx, w, h, P.turbulence, clock, hist);
        else drawSunrise(ctx, w, h, P.t, P.activeSunAir, P.round === "sunrise");
      } else if (P.activeRbView === "drop") drawDrop(ctx, w, h, P.b);
      else drawRainScene(ctx, w, h, P.sunAngle, P.observerX, clock, P.round === "rainbow");
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------- Dragging in the rainbow scene ----------
  const drag = useRef<"sun" | "observer" | null>(null);
  const dragging = activeMode === "rainbow" && activeRbView === "sky";
  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const v = rainView(r.width, r.height);
    const px = ev.clientX - r.left;
    const py = ev.clientY - r.top;
    const sun = sunPos(v, sunAngle);
    const obs = { x: v.X(observerX), y: v.gy - 14 };
    const dSun = round === "rainbow" ? Infinity : Math.hypot(px - sun.x, py - sun.y);
    const dObs = Math.hypot(px - obs.x, py - obs.y);
    const best = dSun < dObs ? "sun" : "observer";
    if (Math.min(dSun, dObs) > 40) return;
    drag.current = best;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    move(px, py, r.width, r.height);
  };
  const move = (px: number, py: number, w: number, h: number) => {
    const v = rainView(w, h);
    if (drag.current === "observer") setObserverX(Math.round(Math.max(3, Math.min(97, (px - v.ox) / v.s))));
    else if (drag.current === "sun") {
      const a = (Math.atan2(v.gy - py, px - v.X(50)) * 180) / Math.PI;
      setSunAngle(Math.round(Math.max(2, Math.min(178, 180 - a))));
    }
  };
  const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const r = ev.currentTarget.getBoundingClientRect();
    move(ev.clientX - r.left, ev.clientY - r.top, r.width, r.height);
  };
  const endDrag = () => {
    drag.current = null;
  };

  const drop = (n: number) => traceDrop(b, waterIndex(n)).elevation;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-xs sm:text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl px-1 py-2 ${activeMode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80 ${dragging ? "touch-none" : ""}`}
        role="img"
        aria-label={ariaLabel()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {activeMode === "tank" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Side glow" value={colourWord(side)} swatch={side} />
            <Stat label="Far end" value={colourWord(end)} swatch={end} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            Scattering ∝ 1 ÷ λ^{colourExponent(size).toFixed(1)} for these particles
            {colourExponent(size) > 3.5 ? " (Rayleigh: 1 ÷ λ⁴)" : colourExponent(size) < 0.5 ? " (all colours alike)" : ""}
          </p>
          <Slider
            label="Particle size (radius)"
            value={size >= 1000 ? `${(size / 1000).toFixed(1)} µm` : `${size} nm`}
            min={1}
            max={3.7}
            step={0.01}
            v={sizeLog}
            onChange={setSizeLog}
          />
          <p className="-mt-2 px-1 text-xs text-white/40">
            {size < 70 ? "Tiny: much smaller than the wavelength of light (400 to 700 nm)." : size < 300 ? "Medium: about the size of a light wave." : "Big, like water droplets in a cloud."}
          </p>
          {round !== "cloud" && <Slider label="Length of the tank (light path)" value={`${length.toFixed(2)} m`} min={0.2} max={1.5} step={0.05} v={length} onChange={setLength} />}
        </>
      )}

      {activeMode === "sky" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Sun height" value={`${alt}°`} />
            <Stat label="Sky" value={air ? colourWord(skyLight(alt, 90)) : "black"} swatch={air ? skyLight(alt, 90) : [0, 0, 0]} />
            <Stat label="Air crossed" value={air ? `${Math.round(airPathKm(alt))} km` : "none"} />
          </div>
          <Slider label="Height of the Sun" value={`${alt}°`} min={0} max={90} step={1} v={alt} onChange={setAlt} />
          <Choice
            options={[
              { id: "mumbai", label: "Mumbai" },
              { id: "kolkata", label: "Kolkata" },
            ]}
            value={city}
            onChange={setCity}
          />
          <Toggle on={!air} onClick={() => setAir(!air)} label={air ? "Remove the atmosphere (go to the Moon)" : "No atmosphere: tap to bring the air back"} />
        </>
      )}

      {activeMode === "twinkle" && (
        <>
          {!round && (
            <Choice
              options={[
                { id: "stars", label: "Star and planet" },
                { id: "sunrise", label: "Sunrise" },
              ]}
              value={twView}
              onChange={setTwView}
            />
          )}
          {activeTwView === "stars" ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="Star flicker" value={`${Math.round(starFlicker * 100)}%`} />
                <Stat label="Planet flicker" value={`${Math.round(planetFlicker * 100)}%`} />
              </div>
              <Slider label="Air turbulence" value={turbulence < 0.05 ? "still air" : turbulence < 0.5 ? "gentle" : "hot and windy"} min={0} max={1} step={0.05} v={turbulence} onChange={setTurbulence} />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="Clock" value={`${t > 0 ? "+" : t < 0 ? "−" : ""}${Math.abs(t).toFixed(1)} min`} />
                <Stat label="Sun seen?" value={round === "sunrise" ? "Look!" : sunVisible ? "Yes" : "Not yet"} />
              </div>
              <Slider label="Time (0 = sunrise if Earth had no air)" value={`${t.toFixed(1)} min`} min={-5} max={2} step={0.1} v={t} onChange={setT} />
              {round !== "sunrise" && (
                <>
                  <Toggle on={!sunAir} onClick={() => setSunAir(!sunAir)} label={sunAir ? "Remove the atmosphere" : "No atmosphere: tap to bring the air back"} />
                  <p className="text-center text-xs text-white/40">In Mumbai the air shows you the Sun about {ADVANCE.toFixed(1)} minutes before it really rises.</p>
                </>
              )}
            </>
          )}
        </>
      )}

      {activeMode === "rainbow" && (
        <>
          {!round && (
            <Choice
              options={[
                { id: "drop", label: "One raindrop" },
                { id: "sky", label: "Sun, rain and you" },
              ]}
              value={rbView}
              onChange={setRbView}
            />
          )}
          {activeRbView === "drop" ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="Red comes out at" value={`${drop(700).toFixed(1)}°`} />
                <Stat label="Violet comes out at" value={`${drop(400).toFixed(1)}°`} />
              </div>
              <Slider label="Where the sunbeam hits the drop" value={`${Math.round(b * 100)}% up`} min={0.05} max={0.99} step={0.01} v={b} onChange={setB} />
              <p className="text-center text-xs text-white/40">
                No ray comes out steeper than about {RED_BOW_DEG.toFixed(0)}° (red) or {VIOLET_BOW_DEG.toFixed(0)}° (violet), and many rays crowd near that angle. That is where the bright bow is.
              </p>
            </>
          ) : (
            <>
              <p className={`rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm ${bow.visible ? "text-lime-300" : "text-amber-200"}`}>
                {REASONS[bow.reason]}
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="Sun height" value={`${rbAlt}°`} />
                <Stat label="Top of the bow" value={bow.elevation > 0 ? `${bow.elevation.toFixed(0)}° up` : "below horizon"} />
              </div>
              <p className="text-center text-xs text-white/40">{round === "rainbow" ? "Drag the person." : "Drag the Sun and the person."} The shower is fixed.</p>
            </>
          )}
        </>
      )}
    </div>
  );

  function ariaLabel() {
    if (activeMode === "tank")
      return `A white light beam passes through a ${length.toFixed(2)} metre tank of water with particles of radius ${size} nanometres. From the side the beam looks ${colourWord(side)}. The light reaching the far end looks ${colourWord(end)}.`;
    if (activeMode === "sky")
      return air
        ? `${city === "mumbai" ? "Mumbai" : "Kolkata"} skyline with the Sun ${alt} degrees high. The sky looks ${colourWord(skyLight(alt, 90))} and the Sun looks ${colourWord(sunLight(alt))}.`
        : `${city === "mumbai" ? "Mumbai" : "Kolkata"} skyline with no atmosphere: the sky is black with stars even though the Sun is up.`;
    if (activeMode === "twinkle")
      return activeTwView === "stars"
        ? `Layers of warm and cool air between you and the night sky. A star flickers by ${Math.round(starFlicker * 100)} percent while a planet stays steady.`
        : `Sea horizon at dawn, ${t.toFixed(1)} minutes from sunrise without air. ${round === "sunrise" ? "" : sunVisible ? "The Sun is visible." : "The Sun is not yet visible."}`;
    return activeRbView === "drop"
      ? "A sunbeam enters a round raindrop, splits into colours, reflects off the back and comes out. Red leaves at about 42 degrees and violet at about 40 degrees."
      : `The Sun is ${rbAlt} degrees up on the ${sunOnLeft ? "left" : "right"}. A person stands near a rain shower. ${REASONS[bow.reason]}`;
  }
}

const REASONS: Record<RainbowReason, string> = {
  ok: "Rainbow! The Sun is behind you and the rain is in front of you.",
  "sun-in-front": "You are facing the Sun. A rainbow is only seen with the Sun behind you and the rain in front.",
  "no-rain-behind": "There is no rain on the side away from the Sun.",
  "sun-too-high": "The Sun is higher than 42°, so the bow would be below the horizon. Try a lower Sun (morning or evening).",
  "above-cloud": "The 42° line passes over the shower. Move closer to the rain or lower the Sun.",
};

function colourWord(c: RGB) {
  const hue = hueOf(c);
  if (hue === "blue") return "blue";
  if (hue === "red") return "orange-red";
  if (hue === "white") return "white";
  const [r, g, bb] = normalise(c);
  if (r === 0 && g === 0 && bb === 0) return "black";
  if (bb === 1) return "pale blue";
  if (bb < 0.6) return "yellow-orange";
  return "creamy white";
}

function Stat({ label, value, swatch }: { label: string; value: string; swatch?: RGB }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="flex items-center justify-center gap-1.5 font-display text-base tabular-nums sm:text-lg">
        {swatch && <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-white/20" style={{ background: css(normalise(swatch)) }} />}
        {value}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="shrink-0 tabular-nums text-white">{value}</span>
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
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`rounded-xl border px-3 py-2 text-sm ${on ? "border-violet-300 bg-violet-300/15" : "border-white/10 text-white/70"}`} onClick={onClick}>
      {label}
    </button>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";

function css(c: RGB, a = 1) {
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
}

/** Turn scattered light into a screen colour: bright light saturates gently instead of clipping. */
function expose(c: RGB, k: number): RGB {
  return c.map((v) => 1 - Math.exp(-k * v)) as RGB;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour = "rgba(255,255,255,0.8)", align: CanvasTextAlign = "left") {
  if (!text) return;
  ctx.font = FONT;
  ctx.textAlign = align;
  const tw = ctx.measureText(text).width;
  const lx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
  ctx.fillStyle = "rgba(10,13,28,0.7)";
  ctx.fillRect(lx - 3, y - 11, tw + 6, 15);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function smoothNoise(t: number, seed: number) {
  return (Math.sin(1.7 * t + seed) + 0.6 * Math.sin(2.9 * t + 2.1 * seed) + 0.4 * Math.sin(5.3 * t + 3.7 * seed)) / 2;
}

function drawTank(ctx: CanvasRenderingContext2D, w: number, h: number, size: number, length: number, clock: number) {
  const torchX = 8;
  const x0 = 46;
  const maxLen = w - x0 - 52;
  const x1 = x0 + (maxLen * length) / 1.5;
  const top = h * 0.16;
  const bot = h * 0.72;
  const by = (top + bot) / 2;
  const screenX = Math.min(w - 16, x1 + 26);

  // Water in the tank.
  ctx.fillStyle = "rgba(186,230,253,0.06)";
  ctx.fillRect(x0, top, x1 - x0, bot - top);
  ctx.strokeStyle = "rgba(186,230,253,0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, top, x1 - x0, bot - top);

  // Torch and the white beam going in.
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(torchX, by - 8, 22, 16);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(torchX + 22, by - 10, 4, 20);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(torchX + 26, by);
  ctx.lineTo(x0, by);
  ctx.stroke();

  // Side glow along the beam: the light scattered sideways toward you at each point.
  const ref = Math.max(...tankSideLight(size, 0));
  const N = 60;
  const step = (x1 - x0) / N;
  for (let i = 0; i < N; i++) {
    const z = ((i + 0.5) / N) * length;
    const c = tankSideLight(size, z).map((v) => v / ref) as RGB;
    const bright = Math.max(c[0], c[1], c[2]);
    const col = normalise(c);
    const x = x0 + i * step;
    const g = ctx.createLinearGradient(0, by - 26, 0, by + 26);
    g.addColorStop(0, css(col, 0));
    g.addColorStop(0.5, css(col, 0.55 * bright));
    g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, by - 26, step + 0.5, 52);
    ctx.fillStyle = css(col, Math.min(1, 0.4 + 0.6 * bright));
    ctx.fillRect(x, by - 2.5, step + 0.5, 5);
  }

  // Particles lit by the beam.
  const pr = size < 70 ? 1 : size < 300 ? 1.6 : 2.4;
  for (const d of DOTS) {
    const x = x0 + 3 + d.x * (x1 - x0 - 6);
    const y = top + 3 + d.y * (bot - top - 6);
    const z = ((x - x0) / (x1 - x0)) * length;
    const near = Math.exp(-(((y - by) / 22) ** 2));
    const c = normalise(tankSideLight(size, z));
    ctx.fillStyle = near > 0.05 ? css(c, 0.25 + 0.6 * near * (0.7 + 0.3 * Math.sin(clock * 3 + d.p))) : "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(x, y, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // What gets through: on to the screen.
  const end = tankEndLight(size, length);
  const endCol = normalise(end);
  const endBright = Math.max(...end);
  ctx.strokeStyle = css(endCol, 0.4 + 0.6 * endBright);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, by);
  ctx.lineTo(screenX, by);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(screenX, top + 10, 6, bot - top - 20);
  const g = ctx.createRadialGradient(screenX, by, 1, screenX, by, 18);
  g.addColorStop(0, css(endCol, 0.95));
  g.addColorStop(1, css(endCol, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(screenX, by, 18, 0, Math.PI * 2);
  ctx.fill();

  label(ctx, `From the side: ${colourWord(tankSideLight(size, 0))}`, x0, top - 8, css(normalise(tankSideLight(size, 0))));
  label(ctx, `Far end (screen): ${colourWord(end)}`, x0, bot + 36, css(endCol));
  label(ctx, `${length.toFixed(2)} m of milky water`, x0, bot + 18, "rgba(255,255,255,0.6)");
}

function cityPath(ctx: CanvasRenderingContext2D, w: number, gy: number, city: City) {
  ctx.beginPath();
  ctx.moveTo(0, gy);
  if (city === "mumbai") {
    // Marine Drive towers on the left, the Gateway of India arch near the middle.
    const towers = [
      [0.02, 46],
      [0.07, 70],
      [0.12, 38],
      [0.16, 92],
      [0.21, 58],
      [0.26, 76],
      [0.31, 34],
    ];
    for (const [fx, ht] of towers) {
      const x = fx * w;
      ctx.lineTo(x, gy);
      ctx.lineTo(x, gy - ht);
      ctx.lineTo(x + w * 0.04, gy - ht);
      ctx.lineTo(x + w * 0.04, gy);
    }
    const gx = w * 0.42;
    const gw = Math.min(70, w * 0.16);
    ctx.lineTo(gx, gy);
    ctx.lineTo(gx, gy - 34);
    ctx.lineTo(gx + gw * 0.12, gy - 40);
    ctx.lineTo(gx + gw * 0.88, gy - 40);
    ctx.lineTo(gx + gw, gy - 34);
    ctx.lineTo(gx + gw, gy);
    ctx.lineTo(gx + gw * 0.68, gy);
    ctx.arc(gx + gw / 2, gy - 14, gw * 0.18, 0, Math.PI, true);
    ctx.lineTo(gx + gw * 0.32, gy);
  } else {
    // Howrah Bridge: two tall towers with a cantilever truss.
    const a = w * 0.08;
    const bx = w * 0.62;
    ctx.lineTo(a, gy);
    ctx.lineTo(a + 6, gy - 62);
    ctx.lineTo(a + 14, gy - 62);
    ctx.quadraticCurveTo((a + bx) / 2, gy - 22, bx - 14, gy - 62);
    ctx.lineTo(bx - 6, gy - 62);
    ctx.lineTo(bx, gy);
    ctx.lineTo(bx - 8, gy);
    ctx.lineTo(bx - 10, gy - 50);
    ctx.quadraticCurveTo((a + bx) / 2, gy - 12, a + 10, gy - 50);
    ctx.lineTo(a + 8, gy);
    for (const [fx, ht] of [
      [0.7, 30],
      [0.77, 44],
      [0.85, 26],
      [0.91, 38],
    ]) {
      const x = fx * w;
      ctx.lineTo(x, gy);
      ctx.lineTo(x, gy - ht);
      ctx.lineTo(x + w * 0.05, gy - ht);
      ctx.lineTo(x + w * 0.05, gy);
    }
  }
  ctx.lineTo(w, gy);
  ctx.lineTo(w, gy + 2);
  ctx.lineTo(0, gy + 2);
  ctx.closePath();
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, alt: number, air: boolean, city: City) {
  const gy = h * 0.74;
  const a = air ? 1 : 0;
  const K = 9;
  // Sky: from about 70° up at the top of the picture down to the horizon.
  const g = ctx.createLinearGradient(0, 0, 0, gy);
  for (const [stop, elev] of [
    [0, 70],
    [0.35, 30],
    [0.65, 14],
    [0.85, 7],
    [1, 3],
  ]) {
    g.addColorStop(stop, css(expose(skyLight(alt, elev, a), K)));
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, gy);

  if (!air) {
    for (const s of STARS) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * s.r})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * gy * 0.95, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The Sun.
  const sx = w * (0.52 + 0.3 * (1 - alt / 90));
  const sy = gy - 6 - (alt / 90) * (gy - 30);
  const sl = sunLight(alt, a);
  const sc = normalise(sl);
  const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, 60);
  glow.addColorStop(0, css(sc, air ? 0.55 : 0.1));
  glow.addColorStop(1, css(sc, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = css(sc);
  ctx.beginPath();
  ctx.arc(sx, sy, 13, 0, Math.PI * 2);
  ctx.fill();

  // Sea or river, with the Sun's reflection.
  const water = ctx.createLinearGradient(0, gy, 0, h);
  const wc = expose(skyLight(alt, 20, a), K * 0.6);
  water.addColorStop(0, css(wc, 0.9));
  water.addColorStop(1, "#0a0d1c");
  ctx.fillStyle = water;
  ctx.fillRect(0, gy, w, h - gy);
  for (let i = 0; i < 7; i++) {
    const y = gy + 6 + i * ((h - gy - 8) / 7);
    const half = 18 - i * 1.6;
    ctx.fillStyle = css(sc, 0.45 - i * 0.05);
    ctx.fillRect(sx - half, y, half * 2, 2);
  }

  // Skyline.
  cityPath(ctx, w, gy, city);
  ctx.fillStyle = "#05070f";
  ctx.fill();

  // The path of sunlight through the air.
  if (air) {
    label(ctx, `Sunlight crosses about ${Math.round(airPathKm(alt))} km of air`, 8, 18, "rgba(255,255,255,0.85)");
    label(ctx, alt < 4 ? "Long path: blue scattered away, red gets through" : alt > 45 ? "Short path: blue scattered all over the sky" : "", 8, 36, "rgba(255,255,255,0.65)");
  } else label(ctx, "No air: nothing to scatter the light", 8, 18, "rgba(255,255,255,0.85)");
}

function drawTwinkle(ctx: CanvasRenderingContext2D, w: number, h: number, turb: number, clock: number, hist: { s: number; p: number }[]) {
  const layerTop = h * 0.2;
  const layerBot = h * 0.56;
  const eye = { x: w * 0.5, y: h * 0.63 };
  const star = { x: w * 0.25, y: h * 0.1 };
  const planet = { x: w * 0.75, y: h * 0.1 };
  const fs = flickerAmplitude(SIRIUS_ARCSEC);
  const fp = flickerAmplitude(JUPITER_ARCSEC);

  // Night sky with faint stars.
  ctx.fillStyle = "#070a18";
  ctx.fillRect(0, 0, w, h);
  for (const s of STARS.slice(0, 30)) {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(s.x * w, s.y * layerTop, 1, 1);
  }

  // Layers of warm and cool air with drifting pockets.
  const layers = 5;
  const lh = (layerBot - layerTop) / layers;
  for (let i = 0; i < layers; i++) {
    const y = layerTop + i * lh;
    ctx.fillStyle = i % 2 ? "rgba(34,211,238,0.06)" : "rgba(251,113,133,0.06)";
    ctx.fillRect(0, y, w, lh);
    for (let k = 0; k < 4; k++) {
      const speed = (10 + 25 * turb) * (i % 2 ? 1 : -1) * (0.7 + 0.15 * k);
      const px = ((((k * 0.31 + i * 0.17) * w + speed * clock) % (w + 80)) + w + 80) % (w + 80) - 40;
      const r = lh * (0.35 + 0.2 * ((k + i) % 3));
      const pocket = ctx.createRadialGradient(px, y + lh / 2, 1, px, y + lh / 2, r * 1.6);
      const warm = (i + k) % 2 === 0;
      pocket.addColorStop(0, warm ? `rgba(251,146,60,${0.05 + 0.25 * turb})` : `rgba(103,232,249,${0.05 + 0.25 * turb})`);
      pocket.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pocket;
      ctx.fillRect(px - r * 1.6, y, r * 3.2, lh);
    }
  }
  label(ctx, "warm and cool air", 6, layerTop + 12, "rgba(255,255,255,0.55)");

  // A light path that wobbles a little in each layer.
  const path = (from: { x: number; y: number }, seed: number, amp: number) => {
    const pts = [from];
    for (let i = 0; i <= layers; i++) {
      const y = layerTop + i * lh;
      const f = (y - from.y) / (eye.y - from.y);
      const x = from.x + (eye.x - from.x) * f + amp * 10 * turb * smoothNoise(clock * (1 + 3 * turb), seed + i * 1.3);
      pts.push({ x, y });
    }
    pts.push(eye);
    return pts;
  };
  const drawPath = (pts: { x: number; y: number }[], colour: string) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  };
  drawPath(path(star, 1, 1), "rgba(255,255,255,0.45)");
  for (let k = 0; k < 5; k++) drawPath(path({ x: planet.x - 5 + k * 2.5, y: planet.y }, 3 + k * 2.2, 1), "rgba(253,186,116,0.22)");

  // Brightness now.
  const sNow = 1 + turb * fs * smoothNoise(clock * (3 + 6 * turb), 0.4);
  const pNow = 1 + turb * fp * smoothNoise(clock * (3 + 6 * turb), 2.2);
  const wob = 3 * turb * fs * smoothNoise(clock * 4, 5);

  // The star: a point, so its one light path wobbles and it flickers.
  const sr = Math.max(0.5, 3 * sNow);
  const sg = ctx.createRadialGradient(star.x + wob, star.y, 0.5, star.x + wob, star.y, 10 * sNow);
  sg.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.9 * sNow)})`);
  sg.addColorStop(1, "rgba(165,243,252,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(star.x + wob, star.y, 10 * sNow, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(star.x + wob, star.y, sr, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, "Star (a point)", star.x, star.y + 24, "rgba(255,255,255,0.8)", "center");

  // The planet: a small disc, many paths that average out.
  ctx.fillStyle = `rgba(253,230,138,${0.85 * pNow})`;
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(180,83,9,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(planet.x - 5, planet.y - 1.5);
  ctx.lineTo(planet.x + 5, planet.y - 1.5);
  ctx.moveTo(planet.x - 5, planet.y + 2);
  ctx.lineTo(planet.x + 5, planet.y + 2);
  ctx.stroke();
  label(ctx, "Planet (a disc)", planet.x, planet.y + 24, "rgba(253,230,138,0.9)", "center");

  // Eye.
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(eye.x, eye.y + 4, 10, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  ctx.arc(eye.x, eye.y + 4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Brightness traces over the last few seconds.
  hist.push({ s: sNow, p: pNow });
  if (hist.length > 240) hist.shift();
  const gTop = h * 0.72;
  const gBot = h - 8;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(4, gTop, w - 8, gBot - gTop);
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("Brightness you see", 8, gTop + 12);
  const trace = (key: "s" | "p", colour: string, mid: number) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = 8 + ((w - 16) * i) / 239;
      const y = mid - (v[key] - 1) * (gBot - gTop) * 0.3;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
  };
  trace("s", "#ffffff", gTop + (gBot - gTop) * 0.45);
  trace("p", "#fde68a", gTop + (gBot - gTop) * 0.8);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "right";
  ctx.fillText("star", w - 8, gTop + (gBot - gTop) * 0.45 - 6);
  ctx.fillStyle = "#fde68a";
  ctx.fillText("planet", w - 8, gTop + (gBot - gTop) * 0.8 - 6);
  ctx.textAlign = "left";
}

function drawSunrise(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, air: boolean, hideStatus: boolean) {
  const gy = h * 0.52;
  const ppd = (h * 0.42) / 1.9;
  const sx = w * 0.62;
  const Y = (deg: number) => gy - deg * ppd;
  const r = SUN_DIAMETER_DEG / 2;
  const topTrue = CLIMB * t;
  const cTrue = topTrue - r;
  const a = air ? 1 : 0;
  const top = apparentAltitude(cTrue + r, a);
  const bot = apparentAltitude(cTrue - r, a);
  const visible = top >= 0;

  // Dawn sky, brightening as the Sun nears the horizon.
  const dawn = Math.max(0, Math.min(1, (t + 6) / 8));
  const g = ctx.createLinearGradient(0, 0, 0, gy);
  g.addColorStop(0, `rgba(${Math.round(15 + 40 * dawn)},${Math.round(23 + 70 * dawn)},${Math.round(60 + 90 * dawn)},1)`);
  g.addColorStop(1, air ? `rgba(${Math.round(120 + 120 * dawn)},${Math.round(60 + 80 * dawn)},${Math.round(40 + 30 * dawn)},1)` : "rgba(20,24,40,1)");
  ctx.fillStyle = air ? g : "#05070f";
  ctx.fillRect(0, 0, w, gy);

  // Air layer above the sea: denser near the ground.
  if (air) {
    const ag = ctx.createLinearGradient(0, gy - h * 0.35, 0, gy);
    ag.addColorStop(0, "rgba(103,232,249,0)");
    ag.addColorStop(1, "rgba(103,232,249,0.12)");
    ctx.fillStyle = ag;
    ctx.fillRect(0, gy - h * 0.35, w, h * 0.35);
  }

  // The Sun as you see it (squashed by refraction), only the part above the horizon.
  const cy = Y((top + bot) / 2);
  const ry = ((top - bot) / 2) * ppd;
  const rx = r * ppd;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, gy);
  ctx.clip();
  const sun = ctx.createRadialGradient(sx, cy, 2, sx, cy, rx * 2.4);
  sun.addColorStop(0, "rgba(251,146,60,0.6)");
  sun.addColorStop(1, "rgba(251,146,60,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(sx - rx * 2.4, cy - rx * 2.4, rx * 4.8, rx * 4.8);
  ctx.fillStyle = "#fb7a3c";
  ctx.beginPath();
  ctx.ellipse(sx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sea.
  ctx.fillStyle = "#0b1730";
  ctx.fillRect(0, gy, w, h - gy);
  ctx.strokeStyle = "rgba(125,211,252,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(w, gy);
  ctx.stroke();

  // Where the Sun really is: a dashed outline.
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(sx, Y(cTrue), rx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = FONT;
  const fits = sx + rx + 10 + ctx.measureText("where the Sun really is").width < w;
  label(ctx, "where the Sun really is", fits ? sx + rx + 6 : sx - rx - 6, Y(cTrue) + 4, "rgba(255,255,255,0.75)", fits ? "left" : "right");

  // Observer on the shore and the bent light path.
  const ox = 26;
  const oy = gy - 10;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox, oy - 14, 4, 0, Math.PI * 2);
  ctx.moveTo(ox, oy - 10);
  ctx.lineTo(ox, oy + 6);
  ctx.stroke();
  if (air && visible) {
    // Light from the hidden Sun curves over the horizon (drawn only above the sea).
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, gy);
    ctx.clip();
    ctx.strokeStyle = "rgba(253,224,71,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, Y(cTrue + r * 0.9));
    ctx.quadraticCurveTo((sx + ox) / 2 + 20, gy - 46, ox + 4, oy - 14);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(ox + 4, oy - 14);
    ctx.lineTo(sx, Y(top) + 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  label(ctx, "Mumbai, sea horizon at dawn", 8, 18, "rgba(255,255,255,0.8)");
  if (!hideStatus)
    label(
      ctx,
      visible ? (t < 0 ? "You see the Sun, though it has not really risen!" : "The Sun is up") : "Sun hidden below the horizon",
      8,
      36,
      visible ? (t < 0 ? "#bef264" : "rgba(255,255,255,0.8)") : "#fcd34d",
    );
  label(ctx, air ? "air bends the light over the horizon" : "no air: light goes straight", 8, 54, "rgba(255,255,255,0.6)");
}

function drawDrop(ctx: CanvasRenderingContext2D, w: number, h: number, b: number) {
  const R = Math.min(h * 0.36, w * 0.28);
  const cx = w * 0.6;
  const cy = h * 0.46;
  const P = (p: { x: number; y: number }) => ({ x: cx + p.x * R, y: cy - p.y * R });

  ctx.fillStyle = "rgba(125,211,252,0.1)";
  ctx.strokeStyle = "rgba(125,211,252,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // A fan of red rays for many entry heights: they bunch near the rainbow angle.
  const nRed = waterIndex(700);
  for (let k = 1; k < 30; k++) {
    const tr = traceDrop(k / 30, nRed);
    const p3 = P(tr.p3);
    const L = R * 2.6;
    ctx.strokeStyle = "rgba(248,113,113,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p3.x + tr.exit.x * L, p3.y - tr.exit.y * L);
    ctx.stroke();
  }

  // The chosen sunbeam, in white, entering from the left.
  const entry = traceDrop(b, nRed);
  const e1 = P(entry.p1);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, e1.y);
  ctx.lineTo(e1.x, e1.y);
  ctx.stroke();
  label(ctx, "sunlight", 6, e1.y - 6, "rgba(255,255,255,0.8)");

  // Each colour inside the drop and out again.
  for (const s of SPECTRUM) {
    const tr = traceDrop(b, waterIndex(s.nm));
    const p1 = P(tr.p1);
    const p2 = P(tr.p2);
    const p3 = P(tr.p3);
    const L = R * 2.8;
    ctx.strokeStyle = s.css;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p3.x + tr.exit.x * L, p3.y - tr.exit.y * L);
    ctx.stroke();
  }

  // Angle between the light going back and the incoming sunlight direction (reversed).
  const red = traceDrop(b, nRed);
  const vio = traceDrop(b, waterIndex(400));
  const p3 = P(red.p3);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p3.x, p3.y);
  ctx.lineTo(p3.x - R * 2.2, p3.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const ar = R * 0.9;
  ctx.strokeStyle = "rgba(248,113,113,0.9)";
  ctx.beginPath();
  ctx.arc(p3.x, p3.y, ar, Math.PI - (Math.max(0, red.elevation) * Math.PI) / 180, Math.PI);
  ctx.stroke();
  label(ctx, `red ${red.elevation.toFixed(1)}°, violet ${vio.elevation.toFixed(1)}°`, 6, h - 12, "rgba(255,255,255,0.85)");
  label(ctx, "1 refraction in, 1 reflection, 1 refraction out", 6, 18, "rgba(255,255,255,0.6)");
}

function rainView(w: number, h: number) {
  const gy = h - 26;
  const s = Math.min(w / 100, (gy - 12) / (SUN_ARC + 4));
  const ox = (w - 100 * s) / 2;
  return { gy, s, ox, X: (x: number) => ox + x * s, Y: (y: number) => gy - y * s };
}

function sunPos(v: ReturnType<typeof rainView>, angle: number) {
  const a = ((180 - angle) * Math.PI) / 180;
  return { x: v.X(50 + SUN_ARC * Math.cos(a)), y: v.Y(SUN_ARC * Math.sin(a)) };
}

function drawRainScene(ctx: CanvasRenderingContext2D, w: number, h: number, angle: number, ox: number, clock: number, lockedSun: boolean) {
  const v = rainView(w, h);
  const sunOnLeft = angle < 90;
  const alt = sunOnLeft ? angle : 180 - angle;
  const bow = rainbowView({ sunAlt: alt, sunOnLeft, observerX: ox, rain: RAIN });

  // Daytime sky.
  const g = ctx.createLinearGradient(0, 0, 0, v.gy);
  g.addColorStop(0, "#1e3a8a");
  g.addColorStop(1, "#3b82f6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, v.gy);
  ctx.fillStyle = "#14532d";
  ctx.fillRect(0, v.gy, w, h - v.gy);

  // Sun's arc (a handle: the real Sun is very far away).
  ctx.setLineDash([2, 5]);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(v.X(50), v.gy, SUN_ARC * v.s, Math.PI, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  // Parallel sunbeams, travelling away from the Sun.
  const rad = (alt * Math.PI) / 180;
  const look = sunOnLeft ? 1 : -1;
  const dx = Math.cos(rad) * look;
  const dy = Math.sin(rad);
  ctx.strokeStyle = "rgba(253,224,71,0.18)";
  ctx.lineWidth = 1;
  for (let k = -3; k <= 3; k++) {
    const ax = v.X(50 + k * 16);
    const ay = v.Y(SUN_ARC * 0.4);
    ctx.beginPath();
    ctx.moveTo(ax - dx * 2000, ay - dy * 2000);
    ctx.lineTo(ax + dx * 2000, ay + dy * 2000);
    ctx.stroke();
  }

  // Rain shower and its cloud.
  ctx.strokeStyle = "rgba(186,230,253,0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const x = v.X(RAIN.x0 + ((i + 0.5) / 26) * (RAIN.x1 - RAIN.x0));
    const fall = ((clock * 120 + i * 37) % (RAIN.top * v.s)) + v.Y(RAIN.top);
    ctx.beginPath();
    ctx.moveTo(x, fall);
    ctx.lineTo(x - 1.5, fall + 7);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(148,163,184,0.95)";
  for (const [fx, fy, fr] of [
    [0.1, 0, 5],
    [0.35, 2.5, 7],
    [0.65, 2, 6.5],
    [0.9, 0, 5],
  ]) {
    ctx.beginPath();
    ctx.arc(v.X(RAIN.x0 + fx * (RAIN.x1 - RAIN.x0)), v.Y(RAIN.top + fy), fr * v.s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Observer.
  const px = v.X(ox);
  const eyeY = v.gy - 22;
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, v.gy - 26, 4.5, 0, Math.PI * 2);
  ctx.moveTo(px, v.gy - 21);
  ctx.lineTo(px, v.gy - 8);
  ctx.lineTo(px - 4, v.gy);
  ctx.moveTo(px, v.gy - 8);
  ctx.lineTo(px + 4, v.gy);
  ctx.stroke();
  ctx.strokeStyle = "rgba(103,232,249,0.6)";
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(px, v.gy - 14, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Look away from the Sun: the anti-solar line and the 42° sight lines.
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, eyeY);
  ctx.lineTo(px + look * 1000 * Math.cos(rad), eyeY + 1000 * Math.sin(rad));
  ctx.stroke();
  ctx.setLineDash([]);
  if (bow.elevation > 0) {
    for (const [deg, colour] of [
      [RED_BOW_DEG - alt, "rgba(248,113,113,0.9)"],
      [VIOLET_BOW_DEG - alt, "rgba(167,139,250,0.9)"],
    ] as const) {
      if (deg <= 0) continue;
      const e = (deg * Math.PI) / 180;
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(px, eyeY);
      ctx.lineTo(px + look * 1000 * Math.cos(e), eyeY - 1000 * Math.sin(e));
      ctx.stroke();
    }
    // The angle between the anti-solar line and the red line.
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    const a0 = look > 0 ? -((RED_BOW_DEG - alt) * Math.PI) / 180 : Math.PI + ((RED_BOW_DEG - alt) * Math.PI) / 180;
    const a1 = look > 0 ? rad : Math.PI - rad;
    ctx.arc(px, eyeY, 30, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
    label(ctx, "42°", px + look * 36 - (look < 0 ? 18 : 0), eyeY + 4, "rgba(255,255,255,0.9)");
  }

  // The bow, where the sight lines meet the rain.
  if (bow.visible && bow.hitX !== null) {
    const far = look > 0 ? RAIN.x1 : RAIN.x0;
    for (let i = 0; i < SPECTRUM.length; i++) {
      const s = SPECTRUM[i];
      const deg = VIOLET_BOW_DEG + ((RED_BOW_DEG - VIOLET_BOW_DEG) * i) / (SPECTRUM.length - 1) - alt;
      if (deg <= 0) continue;
      const tn = Math.tan((deg * Math.PI) / 180);
      ctx.strokeStyle = s.css;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const xa = bow.hitX;
      const cap = RAIN.top - 22 / v.s;
      const ya = Math.min(cap, Math.abs(xa - ox) * tn);
      const xb = far;
      const yb = Math.min(cap, Math.abs(xb - ox) * tn);
      ctx.moveTo(v.X(xa), eyeY - ya * v.s);
      ctx.lineTo(v.X(xb), eyeY - yb * v.s);
      ctx.stroke();
    }
    drawBowInset(ctx, w, alt);
  }

  // The Sun.
  const sp = sunPos(v, angle);
  const sg = ctx.createRadialGradient(sp.x, sp.y, 3, sp.x, sp.y, 26);
  sg.addColorStop(0, "rgba(253,224,71,0.9)");
  sg.addColorStop(1, "rgba(253,224,71,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
  ctx.fill();
  if (!lockedSun) {
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  label(ctx, `Sun ${alt}° up`, Math.max(6, Math.min(w - 70, sp.x - 30)), Math.max(14, sp.y - 20), "#fde047");
}

/** What the observer sees: a circle of 42° around the anti-solar point, cut off by the horizon. */
function drawBowInset(ctx: CanvasRenderingContext2D, w: number, alt: number) {
  const bw = Math.min(130, w * 0.36);
  const bh = 64;
  const x = 6;
  const y = 6;
  const k = bh / 56;
  const hy = y + bh - 8;
  ctx.fillStyle = "rgba(10,13,28,0.75)";
  ctx.fillRect(x, y, bw, bh);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.strokeRect(x, y, bw, bh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, bw, hy - y);
  ctx.clip();
  const cx = x + bw / 2;
  const cy = hy + alt * k;
  SPECTRUM.forEach((s, i) => {
    const deg = VIOLET_BOW_DEG + ((RED_BOW_DEG - VIOLET_BOW_DEG) * i) / (SPECTRUM.length - 1);
    ctx.strokeStyle = s.css;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, deg * k, Math.PI, 2 * Math.PI);
    ctx.stroke();
  });
  ctx.restore();
  ctx.strokeStyle = "#4ade80";
  ctx.beginPath();
  ctx.moveTo(x, hy);
  ctx.lineTo(x + bw, hy);
  ctx.stroke();
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("what you see", x + 4, y + bh - 1);
}
