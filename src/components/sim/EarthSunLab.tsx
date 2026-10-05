"use client";

import { useEffect, useRef, useState } from "react";
import {
  AXIAL_TILT,
  CITIES,
  ECLIPSE_NAMES,
  MONTHS,
  NODE_LON,
  clock,
  dateOf,
  dayOf,
  dayLength,
  earthShadowAtMoon,
  eclipse,
  hoursText,
  isLunar,
  isSolar,
  noonAltitude,
  sunAltAz,
  sunDeclination,
  sunLongitude,
  type CityId,
  type EclipseKind,
} from "@/lib/sim/earthsun";

export type EarthSunMode = "seasons" | "eclipse";

export interface EarthSunReading {
  mode: EarthSunMode;
  day: number;
  month: number;
  hour: number;
  city: CityId;
  /** Hours of daylight in the chosen city on this day. */
  dayLength: number;
  /** Height of the noon Sun, in degrees: the sunlight angle. */
  noonAlt: number;
  sunAlt: number;
  sunAz: number;
  /** The Moon's place in its orbit, degrees east of the Sun (0 new moon, 180 full moon). */
  elong: number;
  tilt: boolean;
  /** The Moon's height above Earth's orbit plane, in degrees. */
  beta: number;
  eclipse: EclipseKind;
}

interface Props {
  onReading?: (r: EarthSunReading) => void;
  initialMode?: EarthSunMode;
  initialTilt?: boolean;
}

const SHORT: Record<EclipseKind, string> = {
  none: "None",
  "partial-solar": "Partial solar",
  "total-solar": "Total solar",
  "annular-solar": "Ring solar",
  "penumbral-lunar": "Faint lunar",
  "partial-lunar": "Partial lunar",
  "total-lunar": "Total lunar",
};

const CITY_IDS: CityId[] = ["chennai", "delhi", "leh"];
const mod = (a: number, n: number) => ((a % n) + n) % n;

export default function EarthSunLab({ onReading, initialMode = "seasons", initialTilt = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<EarthSunMode>(initialMode);
  const [day, setDay] = useState(79);
  const [hour, setHour] = useState(9);
  const [city, setCity] = useState<CityId>("delhi");
  const [elong, setElong] = useState(60);
  const [tilt, setTilt] = useState(initialTilt);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const { month, label: dateLabel } = dateOf(day);
  const lat = CITIES[city].lat;
  const decl = sunDeclination(day);
  const len = dayLength(lat, decl);
  const noonAlt = noonAltitude(lat, decl);
  const sun = sunAltAz(lat, decl, hour);
  const ecl = eclipse(day, elong, tilt);

  useEffect(() => {
    onReadingRef.current?.({
      mode,
      day,
      month,
      hour,
      city,
      dayLength: len,
      noonAlt,
      sunAlt: sun.alt,
      sunAz: sun.az,
      elong,
      tilt,
      beta: ecl.beta,
      eclipse: ecl.kind,
    });
  }, [mode, day, month, hour, city, len, noonAlt, sun.alt, sun.az, elong, tilt, ecl.beta, ecl.kind]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (mode === "seasons") drawSeasons(ctx, size.w, size.h, day, hour, city);
    else drawEclipse(ctx, size.w, size.h, day, elong, tilt);
  }, [size, mode, day, hour, city, elong, tilt]);

  const nudgeDay = (d: number) => setDay((x) => mod(x + d, 365));
  const above = ecl.beta >= 0;
  const atSyzygy = Math.min(Math.abs(mod(elong + 180, 360) - 180), Math.abs(elong - 180)) <= 1.5;
  const moonName = elong <= 1 || elong >= 359 ? "Amavasya" : Math.abs(elong - 180) <= 1 ? "Purnima" : elong < 180 ? "Waxing" : "Waning";

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-ink/20 p-1 text-sm">
        {(["seasons", "eclipse"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-cream/10 text-cream" : "text-faint"}`}>
            {m === "seasons" ? "Seasons" : "Eclipses"}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="h-[21rem] w-full rounded-2xl border border-line bg-well sm:h-96"
        role="img"
        aria-label={
          mode === "seasons"
            ? `The Earth on ${dateLabel} in its orbit round the Sun, with its axis tilted ${AXIAL_TILT} degrees. A close-up shows ${CITIES[city].name}'s path through day and night, and the sky over ${CITIES[city].name} shows the Sun's path from east to west. Day length ${hoursText(len)}, noon Sun ${Math.round(noonAlt)} degrees high. At ${clock(hour)} the Sun is ${sun.alt > 0 ? `${Math.round(sun.alt)} degrees high` : "below the horizon"}.`
            : `Top view and side view of the Sun, Earth and Moon on ${dateLabel}, with the Moon ${Math.round(elong)} degrees east of the Sun. The Moon's orbit is ${tilt ? "tilted 5 degrees" : "flat"} and the Moon is ${Math.abs(ecl.beta).toFixed(1)} degrees ${above ? "above" : "below"} the plane of Earth's orbit. Umbra and penumbra shadows are drawn. Result: ${ECLIPSE_NAMES[ecl.kind]}.`
        }
      />

      {mode === "seasons" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Day length" value={hoursText(len)} />
            <Stat label="Noon Sun" value={`${Math.round(noonAlt)}° high`} />
            <Stat label="Sun now" value={sun.alt > -0.833 ? `${Math.max(0, Math.round(sun.alt))}° high` : "Set"} />
          </div>
          <Choice options={CITY_IDS.map((id) => ({ id, label: CITIES[id].name }))} value={city} onChange={setCity} />
          <DateSlider day={day} setDay={setDay} nudge={nudgeDay} label={dateLabel} />
          <label className="block rounded-2xl panel px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Time of day (Sun time)</span>
              <span className="tabular-nums text-cream">{clock(hour)}</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0} max={24} step={0.25} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
          </label>
          <p className="text-center text-xs text-faint">
            On {dateLabel} the noon Sun is overhead at {Math.abs(decl).toFixed(1)}° {decl >= 0 ? "N" : "S"}. {CITIES[city].name} is at {lat.toFixed(1)}° N.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Moon" value={moonName} />
            <Stat label="Moon height" value={`${Math.abs(ecl.beta).toFixed(1)}° ${Math.abs(ecl.beta) < 0.05 ? "" : above ? "up" : "down"}`} />
            <Stat label="Eclipse" value={SHORT[ecl.kind]} highlight={ecl.kind !== "none"} />
          </div>
          <Choice
            options={[
              { id: "flat", label: "Moon orbit flat" },
              { id: "tilt", label: "Real tilt (5°)" },
            ]}
            value={tilt ? "tilt" : "flat"}
            onChange={(v) => setTilt(v === "tilt")}
          />
          <DateSlider day={day} setDay={setDay} nudge={nudgeDay} label={dateLabel} />
          <label className="block rounded-2xl panel px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Moon in its orbit</span>
              <span className="tabular-nums text-cream">{Math.round(elong)}° from the Sun</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0} max={359} step={1} value={elong} onChange={(e) => setElong(Number(e.target.value))} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className={`rounded-xl border px-2 py-1.5 text-sm ${elong === 0 ? "chip-on" : "border-line text-muted"}`} onClick={() => setElong(0)}>
                Amavasya (new moon)
              </button>
              <button className={`rounded-xl border px-2 py-1.5 text-sm ${elong === 180 ? "chip-on" : "border-line text-muted"}`} onClick={() => setElong(180)}>
                Purnima (full moon)
              </button>
            </div>
          </label>
          <p className={`text-center text-xs ${isSolar(ecl.kind) ? "text-ochre-200" : "text-faint"}`} aria-live="polite">
            {isSolar(ecl.kind)
              ? `${ECLIPSE_NAMES[ecl.kind]}! Never look at the Sun directly, even now. Use eclipse glasses or a pinhole projector.`
              : isLunar(ecl.kind)
                ? `${ECLIPSE_NAMES[ecl.kind]}. This one is safe to watch with bare eyes.`
                : atSyzygy && tilt
                  ? `The Moon is ${Math.abs(ecl.beta).toFixed(1)}° ${above ? "above" : "below"} the line, so the shadow misses. No eclipse this month.`
                  : "Line up the Sun, Earth and Moon to make an eclipse."}
          </p>
        </>
      )}
    </div>
  );
}

function DateSlider({ day, setDay, nudge, label }: { day: number; setDay: (d: number) => void; nudge: (d: number) => void; label: string }) {
  return (
    <label className="block rounded-2xl panel px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted">Date</span>
        <span className="flex items-center gap-2">
          <button type="button" aria-label="One day earlier" className="rounded-lg border border-line px-2 text-muted" onClick={() => nudge(-1)}>
            −
          </button>
          <span className="w-14 text-center tabular-nums text-cream">{label}</span>
          <button type="button" aria-label="One day later" className="rounded-lg border border-line px-2 text-muted" onClick={() => nudge(1)}>
            +
          </button>
        </span>
      </div>
      <input type="range" className="range mt-2 w-full" min={0} max={364} step={1} value={day} onChange={(e) => setDay(Number(e.target.value))} />
      <div className="relative mt-1 h-3 text-[10px] text-faint">
        {MONTHS.map((m, i) =>
          i % 2 === 0 ? (
            <span key={m} className="absolute top-0 -translate-x-1/2" style={{ left: `calc(${dayOf(i, 15) / 364} * (100% - 20px) + 10px)` }}>
              {m}
            </span>
          ) : null,
        )}
      </div>
    </label>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border px-1 py-2 ${highlight ? "border-saffron-300/60 bg-saffron-300/10" : "border-line bg-cream/[0.03]"}`}>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className="font-display text-sm tabular-nums sm:text-lg">{value}</div>
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
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "chip-on" : "border-line text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";

/** Background stars at fixed spots so they do not flicker between frames. */
function drawStars(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, n = 50) {
  let s = 11;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.fillStyle = "rgba(240,233,221,0.25)";
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(x0 + rnd() * w, y0 + rnd() * h, rnd() * 0.9 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, "#fff7c2");
  g.addColorStop(0.55, "#fbbf24");
  g.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A ball with its lit half facing canvas angle sunAng (radians, canvas y down). */
function litBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, sunAng: number, dark: string, light: string) {
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, r, sunAng - Math.PI / 2, sunAng + Math.PI / 2);
  ctx.closePath();
  ctx.fill();
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = "rgba(240,233,221,0.55)", align: CanvasTextAlign = "left") {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

function drawSeasons(ctx: CanvasRenderingContext2D, w: number, h: number, day: number, hour: number, city: CityId) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const topH = Math.round(h * 0.56);
  const ow = Math.round(w * 0.56);
  const lat = CITIES[city].lat;
  const cityName = CITIES[city].name;
  const decl = sunDeclination(day);
  ctx.font = FONT;
  drawStars(ctx, 0, 0, w, topH);

  // --- Orbit, seen from slightly above. Not to scale: the real Sun would be a dot and the orbit far wider.
  const cx = ow / 2;
  const cy = topH / 2 + 8;
  const rx = ow / 2 - 30;
  const ry = rx * 0.45;
  text(ctx, "Earth's orbit", 8, 16);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(240,233,221,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "10px system-ui, sans-serif";
  // Month labels sit beside the orbit, clear of where the Earth and its axis are drawn.
  text(ctx, "Jun", cx - rx - 11, cy + 4, "rgba(240,233,221,0.4)", "right");
  text(ctx, "Dec", cx + rx + 11, cy + 4, "rgba(240,233,221,0.4)");
  text(ctx, "Mar", cx - 12, cy - ry - 4, "rgba(240,233,221,0.4)", "right");
  text(ctx, "Sep", cx - 12, cy + ry + 12, "rgba(240,233,221,0.4)", "right");
  ctx.font = FONT;

  // Ecliptic (x, y) to screen: ecliptic y runs across the screen so the axis tilt shows sideways.
  const lam = toRad(sunLongitude(day) + 180);
  const Ex = Math.cos(lam);
  const Ey = Math.sin(lam);
  const sx = cx + rx * Ey;
  const sy = cy + ry * Ex;
  const er = 7 + 1.5 * Ex;
  const drawEarth = () => {
    litBall(ctx, sx, sy, er, Math.atan2(cy - sy, cx - sx), "#1e293b", "#60a5fa");
    // The axis keeps pointing the same way in space (towards the Pole Star) all year.
    const ax = Math.sin(toRad(AXIAL_TILT));
    const ay = -Math.cos(toRad(AXIAL_TILT));
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - ax * (er + 5), sy - ay * (er + 5));
    ctx.lineTo(sx + ax * (er + 7), sy + ay * (er + 7));
    ctx.stroke();
    ctx.font = "10px system-ui, sans-serif";
    text(ctx, "N", sx + ax * (er + 9), sy + ay * (er + 9) - 2, "#e2e8f0", "center");
    ctx.font = FONT;
  };
  if (sy < cy) drawEarth();
  drawSun(ctx, cx, cy, 16);
  if (sy >= cy) drawEarth();

  // --- Close-up of Earth, seen side-on with the Sun to the left.
  const px0 = ow;
  const pw = w - ow;
  ctx.strokeStyle = "rgba(240,233,221,0.08)";
  ctx.beginPath();
  ctx.moveTo(px0, 8);
  ctx.lineTo(px0, topH - 8);
  ctx.stroke();
  text(ctx, "Close-up", px0 + 8, 16);
  const R = Math.min(pw * 0.32, topH * 0.3);
  const ex = px0 + pw * 0.58;
  const ey = topH * 0.5 + 2;
  // Sunlight arrows.
  ctx.strokeStyle = "rgba(251,191,36,0.6)";
  ctx.fillStyle = "rgba(251,191,36,0.6)";
  ctx.lineWidth = 1;
  for (const dy of [-0.6, 0, 0.6]) {
    const yy = ey + dy * R;
    const x1 = ex - R - 6;
    ctx.beginPath();
    ctx.moveTo(px0 + 6, yy);
    ctx.lineTo(x1, yy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, yy);
    ctx.lineTo(x1 - 5, yy - 3);
    ctx.lineTo(x1 - 5, yy + 3);
    ctx.fill();
  }
  litBall(ctx, ex, ey, R, Math.PI, "#1e293b", "#2563eb");
  const d = toRad(decl);
  // North pole direction: tilted towards the Sun (left) by the Sun's declination.
  const ux = -Math.sin(d);
  const uy = -Math.cos(d);
  const qx = Math.cos(d);
  const qy = -Math.sin(d);
  ctx.strokeStyle = "rgba(240,233,221,0.25)";
  ctx.beginPath();
  ctx.moveTo(ex - qx * R, ey - qy * R);
  ctx.lineTo(ex + qx * R, ey + qy * R);
  ctx.stroke();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ex - ux * (R + 6), ey - uy * (R + 6));
  ctx.lineTo(ex + ux * (R + 8), ey + uy * (R + 8));
  ctx.stroke();
  text(ctx, "N", ex + ux * (R + 10), ey + uy * (R + 10) - 2, "#e2e8f0", "center");
  // The city's circle of latitude, seen edge-on as a line. Left of the middle is daytime.
  const phi = toRad(lat);
  const ccx = ex + ux * R * Math.sin(phi);
  const ccy = ey + uy * R * Math.sin(phi);
  const half = R * Math.cos(phi);
  const kSplit = Math.max(-1, Math.min(1, Math.tan(d) * Math.tan(phi)));
  const pt = (k: number) => ({ x: ccx + qx * half * k, y: ccy + qy * half * k });
  const a = pt(-1);
  const m = pt(kSplit);
  const b = pt(1);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fde047";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(m.x, m.y);
  ctx.stroke();
  ctx.strokeStyle = "#475569";
  ctx.beginPath();
  ctx.moveTo(m.x, m.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  // The city itself: at noon it faces the Sun (left end), at midnight it is at the right end.
  const c = pt(-Math.cos(toRad(15 * (hour - 12))));
  ctx.fillStyle = "#f97316";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = "10px system-ui, sans-serif";
  text(ctx, `${cityName}: yellow is day`, px0 + pw / 2, topH - 6, "rgba(240,233,221,0.5)", "center");
  ctx.font = FONT;

  // --- The sky over the city, looking south: east on the left, west on the right.
  const y0 = topH;
  const yg = h - 20;
  const yt = y0 + 26;
  ctx.fillStyle = "#0f1a33";
  ctx.fillRect(0, y0, w, yg - y0);
  const sun = sunAltAz(lat, decl, hour);
  const isDay = sun.alt > -0.833;
  if (!isDay) drawStars(ctx, 0, y0, w, yg - y0, 30);
  ctx.fillStyle = "#1c2b1f";
  ctx.fillRect(0, yg, w, h - yg);
  ctx.strokeStyle = "rgba(240,233,221,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, yg);
  ctx.lineTo(w, yg);
  ctx.stroke();
  const half2 = w / 2 - 22;
  const P = (alt: number, az: number) => ({
    x: w / 2 - Math.cos(toRad(alt)) * Math.sin(toRad(az)) * half2,
    y: yg - (Math.max(0, alt) / 90) * (yg - yt),
  });
  text(ctx, `Sky over ${cityName}, looking south`, 8, y0 + 15);
  text(ctx, "East", 8, yg + 14, "rgba(240,233,221,0.6)");
  text(ctx, "West", w - 8, yg + 14, "rgba(240,233,221,0.6)", "right");
  text(ctx, "South", w / 2, yg + 14, "rgba(240,233,221,0.4)", "center");
  // Today's path of the Sun.
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(251,191,36,0.5)";
  ctx.beginPath();
  let started = false;
  for (let t = 0; t <= 24.001; t += 0.1) {
    const s = sunAltAz(lat, decl, t);
    if (s.alt < 0) {
      started = false;
      continue;
    }
    const p = P(s.alt, s.az);
    if (started) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
    started = true;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // Noon height label.
  const noon = sunAltAz(lat, decl, 12);
  const np = P(noon.alt, noon.az);
  ctx.strokeStyle = "rgba(240,233,221,0.2)";
  ctx.beginPath();
  ctx.moveTo(np.x, yg);
  ctx.lineTo(np.x, np.y);
  ctx.stroke();
  text(ctx, `Noon: ${Math.round(noon.alt)}°`, np.x + 6, Math.max(yt + 4, np.y + 12), "rgba(240,233,221,0.7)");
  if (isDay) {
    const sp = P(sun.alt, sun.az);
    drawSun(ctx, sp.x, sp.y, 12);
  } else {
    text(ctx, `Night in ${cityName}`, w - 8, y0 + 15, "#a5b4fc", "right");
  }
}

function drawEclipse(ctx: CanvasRenderingContext2D, w: number, h: number, day: number, elong: number, tilt: boolean) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const topH = Math.round(h * 0.58);
  const ecl = eclipse(day, elong, tilt);
  const shadow = earthShadowAtMoon();
  // Drawn sizes: Earth, Moon and shadow widths keep their real ratios (the Moon is drawn a little larger);
  // distances are squeezed so everything fits.
  const ex = Math.round(w * 0.6);
  const ey = topH / 2 + 4;
  const er = 11;
  const mr = 4.5;
  const ro = Math.min(w * 0.27, topH * 0.38);
  const ang = Math.PI + toRad(elong); // maths angle, y up; 0° elongation points at the Sun (left)
  const mx = ex + ro * Math.cos(ang);
  const my = ey - ro * Math.sin(ang);
  ctx.font = FONT;
  drawStars(ctx, 0, 0, w, h, 60);
  text(ctx, "Top view", 8, 16);

  // Sun at the far left, partly off the canvas.
  drawSun(ctx, -topH * 0.12, ey, topH * 0.42);
  text(ctx, "Sun", 6, topH - 8, "#fde68a");

  // Earth's penumbra and umbra, stretching away from the Sun.
  const far = w + 10;
  const pSlope = ((shadow.penumbra - 1) * er) / ro;
  const uSlope = ((1 - shadow.umbra) * er) / ro;
  ctx.fillStyle = "rgba(148,163,184,0.16)";
  ctx.beginPath();
  ctx.moveTo(ex, ey - er);
  ctx.lineTo(far, ey - er - pSlope * (far - ex));
  ctx.lineTo(far, ey + er + pSlope * (far - ex));
  ctx.lineTo(ex, ey + er);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ex, ey - er);
  ctx.lineTo(far, ey - Math.max(0, er - uSlope * (far - ex)));
  ctx.lineTo(far, ey + Math.max(0, er - uSlope * (far - ex)));
  ctx.lineTo(ex, ey + er);
  ctx.fill();
  ctx.stroke();

  // The Moon's orbit, with the half above Earth's orbit plane solid and the half below dashed.
  ctx.lineWidth = 1.2;
  if (tilt) {
    const rel = toRad(NODE_LON - sunLongitude(day));
    const a0 = Math.PI + rel;
    ctx.strokeStyle = "rgba(103,232,249,0.7)";
    ctx.beginPath();
    ctx.arc(ex, ey, ro, -a0, -(a0 + Math.PI), true);
    ctx.stroke();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(103,232,249,0.35)";
    ctx.beginPath();
    ctx.arc(ex, ey, ro, -(a0 + Math.PI), -(a0 + 2 * Math.PI), true);
    ctx.stroke();
    // Node line: where the Moon crosses Earth's orbit plane.
    ctx.strokeStyle = "rgba(244,114,182,0.6)";
    ctx.beginPath();
    ctx.moveTo(ex + (ro + 8) * Math.cos(a0), ey - (ro + 8) * Math.sin(a0));
    ctx.lineTo(ex - (ro + 8) * Math.cos(a0), ey + (ro + 8) * Math.sin(a0));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "10px system-ui, sans-serif";
    const lab = (a: number, s: string, col: string) => {
      const lx = Math.min(w - 4, Math.max(4, ex + (ro + 12) * Math.cos(a)));
      const ly = Math.min(topH - 4, Math.max(12, ey - (ro + 12) * Math.sin(a) + 3));
      text(ctx, s, lx, ly, col, Math.cos(a) > 0.3 ? "left" : Math.cos(a) < -0.3 ? "right" : "center");
    };
    lab(a0 + Math.PI / 2, "above", "rgba(103,232,249,0.9)");
    lab(a0 + (3 * Math.PI) / 2, "below", "rgba(103,232,249,0.6)");
    ctx.font = FONT;
  } else {
    ctx.strokeStyle = "rgba(103,232,249,0.55)";
    ctx.beginPath();
    ctx.arc(ex, ey, ro, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The Moon's shadow, pointing away from the Sun.
  drawMoonShadow(ctx, mx, my, mr, w, (er * (0.538 - 0.2727)) / ro, mr / (ro * 1.03));

  // Earth.
  litBall(ctx, ex, ey, er, Math.PI, "#1e293b", "#3b82f6");
  if (isSolar(ecl.kind)) {
    // The dark spot of the Moon's umbra on the day side.
    ctx.fillStyle = "rgba(2,6,23,0.9)";
    ctx.beginPath();
    ctx.arc(ex - er * 0.8, ey + (my - ey) * 0.15, ecl.kind === "partial-solar" ? 0 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, "Earth", ex, ey + er + 13, "rgba(240,233,221,0.6)", "center");

  // Moon.
  drawMoon(ctx, mx, my, mr, ecl.kind);

  // --- Side view: heights above Earth's orbit plane, in true proportion to the Earth's size.
  const y0 = topH;
  ctx.strokeStyle = "rgba(240,233,221,0.1)";
  ctx.beginPath();
  ctx.moveTo(8, y0);
  ctx.lineTo(w - 8, y0);
  ctx.stroke();
  const k = 8; // pixels per Earth radius
  const yc = y0 + (h - y0) / 2 + 6;
  text(ctx, "Side view: how high is the Moon?", 8, y0 + 15);
  shadowKey(ctx, w - 8, y0 + 15);
  drawSun(ctx, -topH * 0.12, yc, Math.min(topH * 0.3, (h - y0) * 0.45));
  ctx.setLineDash([2, 5]);
  ctx.strokeStyle = "rgba(240,233,221,0.25)";
  ctx.beginPath();
  ctx.moveTo(0, yc);
  ctx.lineTo(w, yc);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "10px system-ui, sans-serif";
  text(ctx, "Earth's orbit plane", w - 6, yc + 28, "rgba(240,233,221,0.4)", "right");
  ctx.font = FONT;
  // Earth's shadow, side-on.
  ctx.fillStyle = "rgba(148,163,184,0.16)";
  ctx.beginPath();
  ctx.moveTo(ex, yc - k);
  ctx.lineTo(far, yc - k - ((shadow.penumbra - 1) * k * (far - ex)) / ro);
  ctx.lineTo(far, yc + k + ((shadow.penumbra - 1) * k * (far - ex)) / ro);
  ctx.lineTo(ex, yc + k);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 1;
  const uw = (x: number) => Math.max(0, k - ((1 - shadow.umbra) * k * (x - ex)) / ro);
  ctx.beginPath();
  ctx.moveTo(ex, yc - k);
  ctx.lineTo(far, yc - uw(far));
  ctx.lineTo(far, yc + uw(far));
  ctx.lineTo(ex, yc + k);
  ctx.fill();
  ctx.stroke();
  const mz = yc - (ecl.moon[2] * k);
  const smr = Math.max(3, 0.2727 * k);
  // The Moon's shadow, side-on, only matters when the Moon is between the Sun and Earth.
  if (Math.cos(toRad(elong)) > 0) drawMoonShadow(ctx, mx, mz, smr, w, (k * (0.538 - 0.2727)) / Math.max(1, ex - mx), smr / Math.max(1, (ex - mx) * 1.03));
  litBall(ctx, ex, yc, k, Math.PI, "#1e293b", "#3b82f6");
  drawMoon(ctx, mx, mz, smr, ecl.kind);
  // Height marker.
  if (Math.abs(mz - yc) > 4) {
    ctx.strokeStyle = "rgba(103,232,249,0.5)";
    ctx.beginPath();
    ctx.moveTo(mx, yc);
    ctx.lineTo(mx, mz + (mz < yc ? smr : -smr));
    ctx.stroke();
  }
  const labelX = Math.max(30, Math.min(w - 30, mx));
  const labelY = mz <= yc + 2 ? Math.max(y0 + 30, mz - 7) : Math.min(h - 4, mz + 15);
  text(ctx, "Moon", labelX, labelY, "#e2e8f0", "center");
}

/** A small key for the two parts of a shadow, right-aligned at (x, y). */
function shadowKey(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  const pw = ctx.measureText("penumbra").width;
  text(ctx, "penumbra", x, y, "rgba(240,233,221,0.6)", "right");
  ctx.fillStyle = "rgba(148,163,184,0.35)";
  ctx.fillRect(x - pw - 14, y - 8, 9, 9);
  const left = x - pw - 22;
  text(ctx, "umbra", left, y, "rgba(240,233,221,0.6)", "right");
  const uw = ctx.measureText("umbra").width;
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "rgba(148,163,184,0.6)";
  ctx.fillRect(left - uw - 14, y - 8, 9, 9);
  ctx.strokeRect(left - uw - 14, y - 8, 9, 9);
  ctx.font = FONT;
}

/** Penumbra (widening) and umbra (narrowing) behind the Moon, pointing right, away from the Sun. */
function drawMoonShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, w: number, pSlope: number, uSlope: number) {
  const far = w + 10;
  ctx.fillStyle = "rgba(148,163,184,0.14)";
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(far, y - r - pSlope * (far - x));
  ctx.lineTo(far, y + r + pSlope * (far - x));
  ctx.lineTo(x, y + r);
  ctx.fill();
  const tip = r / uSlope;
  ctx.fillStyle = "rgba(2,6,23,0.85)";
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + tip, y);
  ctx.lineTo(x, y + r);
  ctx.fill();
}

function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, kind: EclipseKind) {
  const color = kind === "total-lunar" ? "#c2410c" : kind === "partial-lunar" ? "#9a5b3c" : kind === "penumbral-lunar" ? "#a8a29e" : null;
  if (color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  } else litBall(ctx, x, y, r, Math.PI, "#334155", "#f4f1de");
}
