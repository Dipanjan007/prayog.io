"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { PRACTICE } from "@/content/lessons/ciphers";
import { ALPHABET, PRIMES, clockAdd, decode, decodes, encode, letterCounts, mostCommon, mod, secretOf, trialSplit, wrapsRound, type SecretRound } from "@/lib/sim/ciphers";

export type CipherMode = "wheel" | "clock" | "crack" | "primes";

export type CipherReading =
  | { mode: "wheel"; k: number; wraps: boolean }
  | { mode: "clock"; n: number; start: number; add: number; result: number }
  | { mode: "crack"; k: number; ok: boolean }
  | { mode: "primes"; p: number; q: number; n: number; split: boolean; tries: number }
  | { mode: "secret"; ok: boolean };

interface Props {
  onReading?: (r: CipherReading) => void;
  /** Challenge: a secret message to decode with an unknown shift. */
  secret?: SecretRound | null;
}

const MODES: { id: CipherMode; label: string }[] = [
  { id: "wheel", label: "Wheel" },
  { id: "clock", label: "Clock" },
  { id: "crack", label: "Crack" },
  { id: "primes", label: "Primes" },
];

const COL = { cyan: "#22d3ee", pink: "#f472b6", lime: "#a3e635", violet: "#a78bfa", amber: "#facc15" };

export default function CipherLab({ onReading, secret = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<CipherMode>("wheel");
  const [k, setK] = useState(1);
  const [text, setText] = useState("CHAI AT FOUR");
  const [clockN, setClockN] = useState<12 | 26>(12);
  const [start, setStart] = useState(9);
  const [add, setAdd] = useState(5);
  const [crackK, setCrackK] = useState(0);
  const [pi, setPi] = useState(10);
  const [qi, setQi] = useState(12);
  const [split, setSplit] = useState(false);
  const [sent, setSent] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const p = PRIMES[pi];
  const q = PRIMES[qi];
  const n = p * q;
  const splitInfo = trialSplit(n);
  const result = clockAdd(start, add, clockN);
  const crackSecret = secret ? secretOf(secret) : secretOf(PRACTICE);
  const crackOk = decodes(PRACTICE, crackK);
  const wraps = wrapsRound(text, k);

  useEffect(() => {
    if (secret) return;
    if (mode === "wheel") onReadingRef.current?.({ mode, k, wraps });
    else if (mode === "clock") onReadingRef.current?.({ mode, n: clockN, start, add, result });
    else if (mode === "crack") onReadingRef.current?.({ mode, k: crackK, ok: crackOk });
    else onReadingRef.current?.({ mode, p, q, n, split, tries: splitInfo.tries });
  }, [secret, mode, k, wraps, clockN, start, add, result, crackK, crackOk, p, q, n, split, splitInfo.tries]);

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
    if (secret || mode === "crack") drawBars(ctx, size.w, size.h, crackSecret, crackK);
    else if (mode === "wheel") drawWheel(ctx, size.w, size.h, k, text);
    else if (mode === "clock") drawClock(ctx, size.w, size.h, clockN, start, add);
    else drawPrimes(ctx, size.w, size.h, p, q, split);
  }, [size, secret, mode, k, text, clockN, start, add, crackK, crackSecret, p, q, split]);

  const setClock = (m: 12 | 26) => {
    setClockN(m);
    setStart(m === 12 ? 9 : 23);
  };

  const canvas = (
    <canvas
      ref={canvasRef}
      className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={
        secret || mode === "crack"
          ? `Bar chart of how often each letter appears in the secret message; the tallest is ${ALPHABET[mostCommon(crackSecret)]}`
          : mode === "wheel"
            ? `Cipher wheel with shift ${k}: A becomes ${encode("A", k)}`
            : mode === "clock"
              ? `A ${clockN}-place clock: start at ${label12(start, clockN)}, add ${add}, land on ${label12(result, clockN)}`
              : `${p} × ${q} = ${n}`
      }
    />
  );

  if (secret) {
    const s = secretOf(secret);
    return (
      <div className="flex flex-col gap-3 select-none">
        <Message label="Secret message" text={s} colour="text-pink-200" />
        {canvas}
        <Dial k={crackK} setK={setCrackK} onChange={() => setSent(null)} />
        <Message label={`Decoded with shift ${crackK}`} text={decode(s, crackK)} colour="text-lime-200" />
        <button
          className="btn-primary !py-2 text-sm"
          onClick={() => {
            const ok = decodes(secret, crackK);
            setSent(ok);
            onReadingRef.current?.({ mode: "secret", ok });
          }}
        >
          Send my answer
        </button>
        {sent !== null && (
          <p className={`text-center text-sm ${sent ? "text-lime-300" : "text-amber-200"}`}>
            {sent ? `Cracked! The shift was ${secret.k}.` : "That is not English yet. Find the tallest bar and count how far it is from E."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${mode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {canvas}

      {mode === "wheel" && (
        <>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <div className="text-sm text-cyan-200">Your message</div>
            <input
              value={text}
              maxLength={40}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              aria-label="Your message"
              className="mt-1 w-full min-w-0 rounded-xl border border-white/15 bg-black/30 px-3 py-2 font-mono text-white"
            />
          </label>
          <Message label={`Secret, shift ${k}`} text={encode(text, k) || " "} colour="text-pink-200" />
          <Dial k={k} setK={setK} />
          <p className="text-center text-xs text-white/40">
            secret = (plain + {k}) mod 26.{" "}
            {wraps ? "Some letters ran past Z and went round to the start." : "Try a word with X, Y or Z to see letters go round."}
          </p>
        </>
      )}

      {mode === "clock" && (
        <>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
            {([12, 26] as const).map((m) => (
              <button key={m} onClick={() => setClock(m)} className={`rounded-xl py-2 ${clockN === m ? "bg-white/10 text-white" : "text-white/50"}`}>
                {m === 12 ? "12-hour clock" : "26-letter clock"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Start" value={label12(start, clockN)} colour="text-cyan-200" />
            <Readout label="Add" value={`${add}`} colour="text-pink-200" />
            <Readout label="Land on" value={label12(result, clockN)} colour="text-lime-200" />
          </div>
          <Slider label="Start" colour={COL.cyan} value={start} min={clockN === 12 ? 1 : 0} max={clockN === 12 ? 12 : 25} onChange={setStart} shown={label12(start, clockN)} />
          <Slider label="Add" colour={COL.pink} value={add} min={0} max={60} onChange={setAdd} shown={`${add}`} />
          <p className="text-center text-xs text-white/40">
            ({start} + {add}) mod {clockN} = {mod(start + add, clockN)}
            {clockN === 12 && mod(start + add, 12) === 0 ? ", which a clock shows as 12" : ""}
            {add >= clockN ? `. ${add} = (${Math.floor(add / clockN)} × ${clockN}) + ${add % clockN}: each full turn changes nothing.` : "."}
          </p>
        </>
      )}

      {mode === "crack" && (
        <>
          <Message label="Secret message" text={crackSecret} colour="text-pink-200" />
          <Dial k={crackK} setK={setCrackK} />
          <Message label={`Decoded with shift ${crackK}`} text={decode(crackSecret, crackK)} colour={crackOk ? "text-lime-200" : "text-white/70"} />
          <p className="text-center text-xs text-white/40">
            {crackOk
              ? "Cracked! The tallest bar really was E."
              : `The tallest bar is ${ALPHABET[mostCommon(crackSecret)]}. With shift ${crackK} it turns into ${ALPHABET[mod(mostCommon(crackSecret) - crackK, 26)]}.`}
          </p>
        </>
      )}

      {mode === "primes" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="p" value={`${p}`} colour="text-cyan-200" />
            <Readout label="q" value={`${q}`} colour="text-pink-200" />
            <Readout label="n = p × q" value={`${n}`} colour="text-lime-200" />
          </div>
          <Slider
            label="Prime p"
            colour={COL.cyan}
            value={pi}
            min={0}
            max={PRIMES.length - 1}
            onChange={(v) => {
              setPi(v);
              setSplit(false);
            }}
            shown={`${p}`}
          />
          <Slider
            label="Prime q"
            colour={COL.pink}
            value={qi}
            min={0}
            max={PRIMES.length - 1}
            onChange={(v) => {
              setQi(v);
              setSplit(false);
            }}
            shown={`${q}`}
          />
          <button className="btn-primary !py-2 text-sm" onClick={() => setSplit(true)} disabled={split}>
            Split n the slow way
          </button>
          <p className="text-center text-xs text-white/40">
            {split
              ? `Tried ${splitInfo.tries} divisor${splitInfo.tries === 1 ? "" : "s"} (2, 3, 4, ...) before ${splitInfo.factor} divided ${n}. Multiplying took 1 step.`
              : "Multiplying is one step. Now pretend you only know n: how long to find p and q?"}
          </p>
        </>
      )}
    </div>
  );
}

const label12 = (v: number, n: number) => (n === 12 ? `${v}` : ALPHABET[v]);

function Message({ label, text, colour }: { label: string; text: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`mt-0.5 break-words font-mono text-sm tracking-wider ${colour}`}>{text}</div>
    </div>
  );
}

/** The shift dial: − and + buttons and a slider, going round from 25 back to 0. */
function Dial({ k, setK, onChange }: { k: number; setK: (k: number) => void; onChange?: () => void }) {
  const set = (v: number) => {
    setK(mod(v, 26));
    onChange?.();
  };
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2">
      <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Shift down" onClick={() => set(k - 1)}>
        −
      </button>
      <label className="block">
        <div className="flex justify-between text-sm">
          <span className="text-violet-200">Shift k</span>
          <span className="tabular-nums text-white">
            {k} · A → {ALPHABET[k]}
          </span>
        </div>
        <input type="range" aria-label="Shift k" className="range mt-1 w-full" min={0} max={25} step={1} value={k} onChange={(e) => set(Number(e.target.value))} />
      </label>
      <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Shift up" onClick={() => set(k + 1)}>
        +
      </button>
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

function Slider(p: { label: string; colour: string; value: number; min: number; max: number; shown: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">{p.shown}</span>
      </div>
      <input type="range" className="range mt-1 w-full" min={p.min} max={p.max} step={1} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
    </label>
  );
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, colour: string, align: CanvasTextAlign = "center", font = "12px system-ui, sans-serif") {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = "left";
}

/** Two rings: plain letters outside, the secret letter for each one just inside it. */
function drawWheel(ctx: CanvasRenderingContext2D, w: number, h: number, k: number, msg: string) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2 - 6;
  const rOut = R - 12;
  const rIn = R - 38;
  const used = new Set([...msg.toUpperCase()]);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (const rr of [R, R - 25, R - 51]) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(167,139,250,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, R - 25, 0, Math.PI * 2);
  ctx.fill();
  const font = R > 110 ? "bold 14px system-ui, sans-serif" : "bold 11px system-ui, sans-serif";
  for (let i = 0; i < 26; i++) {
    const t = -Math.PI / 2 + (i * Math.PI * 2) / 26;
    const plain = ALPHABET[i];
    const hot = used.has(plain);
    text(ctx, plain, cx + rOut * Math.cos(t), cy + rOut * Math.sin(t) + 5, hot ? COL.cyan : "rgba(255,255,255,0.55)", "center", font);
    text(ctx, ALPHABET[mod(i + k, 26)], cx + rIn * Math.cos(t), cy + rIn * Math.sin(t) + 5, hot ? COL.pink : "rgba(244,114,182,0.45)", "center", font);
  }
  // Arrow from plain A to its secret letter.
  text(ctx, `shift ${k}`, cx, cy - 2, COL.violet, "center", "bold 16px system-ui, sans-serif");
  text(ctx, `A → ${ALPHABET[k]}`, cx, cy + 18, "rgba(255,255,255,0.6)", "center");
  text(ctx, "outside: plain", cx, cy + 36, COL.cyan, "center", "11px system-ui, sans-serif");
  text(ctx, "inside: secret", cx, cy + 50, COL.pink, "center", "11px system-ui, sans-serif");
}

/** A clock with n places; the hand walks `add` steps from `start`, going round as often as it needs. */
function drawClock(ctx: CanvasRenderingContext2D, w: number, h: number, n: 12 | 26, start: number, add: number) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2 - 18;
  const angle = (v: number) => -Math.PI / 2 + ((n === 12 ? mod(v, 12) : v) * Math.PI * 2) / n;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  const end = clockAdd(start, add, n);
  for (let i = 0; i < n; i++) {
    const v = n === 12 ? (i === 0 ? 12 : i) : i;
    const t = angle(v);
    const isStart = v === start;
    const isEnd = v === end;
    text(
      ctx,
      n === 12 ? `${v}` : ALPHABET[v],
      cx + (R - 14) * Math.cos(t),
      cy + (R - 14) * Math.sin(t) + 4,
      isEnd ? COL.lime : isStart ? COL.cyan : "rgba(255,255,255,0.55)",
      "center",
      isEnd || isStart ? "bold 13px system-ui, sans-serif" : "11px system-ui, sans-serif",
    );
  }
  // The path walked: a spiral that moves outward a little on each full turn.
  const turns = add / n;
  const steps = Math.max(2, Math.ceil(add * 6));
  ctx.strokeStyle = COL.pink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let s = 0; s <= steps; s++) {
    const f = s / steps;
    const t = angle(start) + f * turns * Math.PI * 2;
    const rr = R * 0.32 + R * 0.3 * (turns > 0 ? (f * turns) / Math.max(1, Math.ceil(turns)) : 0);
    if (s) ctx.lineTo(cx + rr * Math.cos(t), cy + rr * Math.sin(t));
    else ctx.moveTo(cx + rr * Math.cos(t), cy + rr * Math.sin(t));
  }
  if (add > 0) ctx.stroke();
  // Hand pointing to where we land.
  const te = angle(end);
  ctx.strokeStyle = COL.lime;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + (R - 32) * Math.cos(te), cy + (R - 32) * Math.sin(te));
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** How often each letter appears in the secret message, and what each turns into with the current shift. */
function drawBars(ctx: CanvasRenderingContext2D, w: number, h: number, secret: string, k: number) {
  const counts = letterCounts(secret);
  const top = mostCommon(secret);
  const max = Math.max(...counts);
  const left = 8;
  const right = w - 8;
  const bw = (right - left) / 26;
  const base = h - 42;
  const topY = 24;
  text(ctx, "How often each secret letter appears", left, 14, "rgba(255,255,255,0.5)", "left", "11px system-ui, sans-serif");
  for (let i = 0; i < 26; i++) {
    const x = left + i * bw;
    const bh = max ? ((base - topY) * counts[i]) / max : 0;
    const plain = ALPHABET[mod(i - k, 26)];
    const isTop = i === top;
    ctx.fillStyle = isTop ? COL.amber : COL.pink + "88";
    ctx.fillRect(x + 1.5, base - bh, bw - 3, bh);
    if (counts[i] && bw >= 11) text(ctx, `${counts[i]}`, x + bw / 2, base - bh - 3, "rgba(255,255,255,0.6)", "center", "9px system-ui, sans-serif");
    const f = bw >= 13 ? "11px system-ui, sans-serif" : "9px system-ui, sans-serif";
    text(ctx, ALPHABET[i], x + bw / 2, base + 13, isTop ? COL.amber : COL.pink, "center", f);
    text(ctx, plain, x + bw / 2, base + 30, plain === "E" && isTop ? COL.lime : "rgba(163,230,53,0.55)", "center", f);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, base + 18);
  ctx.lineTo(right, base + 18);
  ctx.stroke();
}

/** p × q, and after a split, every divisor tried on the way to finding a factor. */
function drawPrimes(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, q: number, split: boolean) {
  const n = p * q;
  text(ctx, `${p} × ${q} = ${n}`, w / 2, 30, "#fff", "center", "bold 20px system-ui, sans-serif");
  if (!split) {
    text(ctx, "Multiplying: 1 step", w / 2, 54, COL.lime, "center");
    text(ctx, "Splitting n back into p and q: press the button", w / 2, h / 2 + 20, "rgba(255,255,255,0.45)", "center");
    return;
  }
  const { factor, tries } = trialSplit(n);
  text(ctx, `Splitting: ${tries} tries`, w / 2, 54, COL.amber, "center");
  const top = 68;
  const area = { w: w - 16, h: h - top - 8 };
  // Fit `tries` cells into the area.
  let cols = Math.ceil(Math.sqrt((tries * area.w) / area.h));
  let rows = Math.ceil(tries / cols);
  while (rows * (area.w / cols) > area.h) {
    cols++;
    rows = Math.ceil(tries / cols);
  }
  const cell = Math.min(area.w / cols, 34);
  const ox = (w - cols * cell) / 2;
  for (let i = 0; i < tries; i++) {
    const d = i + 2;
    const x = ox + (i % cols) * cell;
    const y = top + Math.floor(i / cols) * cell;
    const hit = d === factor && factor !== n;
    ctx.fillStyle = hit ? COL.lime : "rgba(244,114,182,0.18)";
    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    if (cell >= 16) text(ctx, `${d}`, x + cell / 2, y + cell / 2 + 4, hit ? "#0a0d1c" : "rgba(255,255,255,0.6)", "center", cell >= 26 ? "11px system-ui, sans-serif" : "8px system-ui, sans-serif");
  }
}
