"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MATERIALS, solve, type CircuitState, type MaterialId, type Part } from "@/lib/sim/circuit";

export interface CircuitReading {
  slots: Part[];
  state: CircuitState;
  /** Switch went off then on again while the rest of the loop was complete. */
  switchCycled: boolean;
  /** Materials tested with the rest of the loop complete: id → conducts. */
  tested: Partial<Record<MaterialId, boolean>>;
  /** Counted changes since the last preset was loaded (for the repair challenge). */
  moves: number;
  preset: string | null;
}

interface Props {
  onReading?: (r: CircuitReading) => void;
  /** Change this object to load a new starting circuit. */
  preset?: { name: string; slots: Part[] } | null;
}

const EMPTY: Part[] = [{ kind: "empty" }, { kind: "empty" }, { kind: "empty" }, { kind: "empty" }];

// Loop geometry in a 400 × 260 view box. Slots sit on the top, right and bottom sides.
const SLOT_POS: { x: number; y: number; vertical: boolean }[] = [
  { x: 135, y: 40, vertical: false },
  { x: 265, y: 40, vertical: false },
  { x: 360, y: 130, vertical: true },
  { x: 200, y: 220, vertical: false },
];
const LOOP = "M40 40 H360 V220 H40 Z";

type Choice = { label: string; part: Part; icon: string };
const CHOICES: Choice[] = [
  { label: "Cell", part: { kind: "cell" }, icon: "🔋" },
  { label: "Bulb", part: { kind: "bulb", fused: false }, icon: "💡" },
  { label: "Switch", part: { kind: "switch", on: true }, icon: "🔘" },
  { label: "Wire", part: { kind: "wire" }, icon: "〰️" },
  { label: "Remove", part: { kind: "empty" }, icon: "✖️" },
];

export default function CircuitBoard({ onReading, preset }: Props) {
  const [slots, setSlots] = useState<Part[]>(EMPTY);
  const [selected, setSelected] = useState<number | null>(0);
  const [symbols, setSymbols] = useState(false);
  const [moves, setMoves] = useState(0);
  const [tested, setTested] = useState<Partial<Record<MaterialId, boolean>>>({});
  const [switchCycled, setSwitchCycled] = useState(false);
  const [popped, setPopped] = useState(false);
  const sawOffWhileComplete = useRef(false);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [lastPreset, setLastPreset] = useState(preset);

  // Load a preset when the prop changes (adjusting state during render, per React docs).
  if (preset !== lastPreset) {
    setLastPreset(preset);
    if (preset) {
      setSlots(preset.slots.map((p) => ({ ...p })));
      setMoves(0);
      setPresetName(preset.name);
      setSelected(null);
    }
  }

  const state = useMemo(() => solve(slots), [slots]);

  // Bulbs given too much voltage glow brightly for a moment, then fuse.
  const overloadedKey = state.overloaded.join(",");
  useEffect(() => {
    if (!overloadedKey) return;
    const which = overloadedKey.split(",").map(Number);
    const t = setTimeout(() => {
      setSlots((s) => s.map((p, i) => (which.includes(i) && p.kind === "bulb" ? { ...p, fused: true } : p)));
      setPopped(true);
      setTimeout(() => setPopped(false), 2500);
    }, 700);
    return () => clearTimeout(t);
  }, [overloadedKey]);

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });
  useEffect(() => {
    onReadingRef.current?.({ slots, state, switchCycled, tested, moves, preset: presetName });
  }, [slots, state, switchCycled, tested, moves, presetName]);

  const place = (i: number, part: Part) => {
    setSlots((s) => {
      const next = s.slice();
      next[i] = part;
      recordMaterialTest(next);
      return next;
    });
    setMoves((m) => m + 1);
  };

  /** A material counts as tested when everything else in the loop would carry current. */
  const recordMaterialTest = (next: Part[]) => {
    const mats = next.flatMap((p, i) => (p.kind === "material" ? [{ p, i }] : []));
    if (mats.length !== 1) return;
    const { p, i } = mats[0];
    if (p.kind !== "material") return;
    const withWire = next.slice();
    withWire[i] = { kind: "wire" };
    const s = solve(withWire);
    if (s.closed && s.bulbs > 0) setTested((t) => ({ ...t, [p.id]: MATERIALS[p.id].conducts }));
  };

  const toggleSwitch = (i: number) => {
    setSlots((s) => {
      const p = s[i];
      if (p.kind !== "switch") return s;
      const next = s.slice();
      next[i] = { kind: "switch", on: !p.on };
      const othersComplete = solve(next.map((q, j) => (j === i ? { kind: "switch", on: true } : q))).closed;
      if (othersComplete && solve(next.map((q, j) => (j === i ? { kind: "switch", on: true } : q))).bulbs > 0) {
        if (p.on) sawOffWhileComplete.current = true;
        else if (sawOffWhileComplete.current) setSwitchCycled(true);
      }
      recordMaterialTest(next);
      return next;
    });
    setMoves((m) => m + 1);
  };

  const sel = selected !== null ? slots[selected] : null;

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-well">
        <svg viewBox="0 0 400 260" className="block w-full" role="img" aria-label={describe(slots, state)}>
          <defs>
            <radialGradient id="glow">
              <stop offset="0" stopColor="#fde68a" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={LOOP} fill="none" stroke={state.closed ? "#f59e0b" : "#475569"} strokeWidth="5" strokeLinejoin="round" />
          {state.closed && (
            <path
              d={LOOP}
              fill="none"
              stroke="#fef3c7"
              strokeWidth="3"
              strokeDasharray="4 16"
              strokeLinecap="round"
              style={{
                // More cells push the charges round faster.
                animation: `flow ${(0.9 / Math.max(1, state.cells)).toFixed(2)}s linear infinite`,
              }}
            />
          )}
          {slots.map((p, i) => (
            <Slot
              key={i}
              index={i}
              part={p}
              pos={SLOT_POS[i]}
              selected={selected === i}
              brightness={state.brightness}
              symbols={symbols}
              onSelect={() => setSelected(i)}
              onToggle={() => toggleSwitch(i)}
            />
          ))}
        </svg>
        <div className="pointer-events-none border-t border-line px-3 py-2 text-xs sm:absolute sm:left-3 sm:top-3 sm:rounded-full sm:border-0 sm:bg-ink/40 sm:py-1 sm:backdrop-blur">
          {state.shortCircuit ? (
            <span className="text-brick-300">⚠️ Short circuit! No bulb, so the cell drains fast and heats up.</span>
          ) : state.closed ? (
            <span className="text-ochre-200">Circuit closed: current flows</span>
          ) : (
            <span className="text-muted">Open circuit: {state.reason}</span>
          )}
        </div>
        {popped && (
          <div className="animate-pop pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-brick-500/90 px-4 py-1.5 text-sm font-semibold">
            Pop! Too many cells: the bulb&apos;s filament broke (fused).
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-faint">{selected === null ? "Tap a slot to change it" : `Slot ${selected + 1}:`}</span>
        {selected !== null &&
          CHOICES.map((c) => (
            <button
              key={c.label}
              onClick={() => place(selected, c.part)}
              className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-line-strong"
            >
              {c.icon} {c.label}
            </button>
          ))}
        {sel?.kind === "switch" && selected !== null && (
          <button onClick={() => toggleSwitch(selected)} className="rounded-full bg-cream px-3 py-1.5 text-sm text-ink">
            Turn {sel.on ? "off" : "on"}
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="h-4 w-4 accent-saffron-400" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />
          Circuit symbols
        </label>
      </div>

      {selected !== null && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-faint">Test a material in this slot</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MATERIALS) as MaterialId[]).map((id) => {
              const result = tested[id];
              return (
                <button
                  key={id}
                  onClick={() => place(selected, { kind: "material", id })}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    result === undefined ? "border-line" : result ? "border-sage-300/50 bg-sage-300/10" : "border-brick-300/50 bg-brick-300/10"
                  }`}
                >
                  {MATERIALS[id].emoji} {MATERIALS[id].label}
                  {result !== undefined && <span className="ml-1">{result ? "✓" : "✗"}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function describe(slots: Part[], s: CircuitState) {
  const names = slots.map((p) => (p.kind === "material" ? MATERIALS[p.id].label : p.kind === "bulb" && p.fused ? "fused bulb" : p.kind)).join(", ");
  return `Circuit with ${names}. ${s.closed ? `Closed, bulb brightness ${Math.round(s.brightness * 100)}%.` : `Open: ${s.reason}`}`;
}

function Slot(props: {
  index: number;
  part: Part;
  pos: { x: number; y: number; vertical: boolean };
  selected: boolean;
  brightness: number;
  symbols: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { part, pos, selected, brightness, symbols } = props;
  return (
    <g
      transform={`translate(${pos.x} ${pos.y}) rotate(${pos.vertical ? 90 : 0})`}
      onClick={props.onSelect}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={`Slot ${props.index + 1}`}
    >
      {/* Cover the wire under the slot. */}
      <rect x="-42" y="-26" width="84" height="52" rx="12" fill="#13110f" />
      <rect
        x="-42"
        y="-26"
        width="84"
        height="52"
        rx="12"
        fill={selected ? "rgba(34,211,238,0.12)" : "rgba(240,233,221,0.03)"}
        stroke={selected ? "#22d3ee" : part.kind === "empty" ? "rgba(240,233,221,0.25)" : "rgba(240,233,221,0.08)"}
        strokeDasharray={part.kind === "empty" ? "5 4" : undefined}
      />
      <g transform={pos.vertical ? "rotate(-90)" : undefined}>
        <PartArt part={part} brightness={brightness} symbols={symbols} onToggle={props.onToggle} />
      </g>
    </g>
  );
}

function PartArt({ part, brightness, symbols, onToggle }: { part: Part; brightness: number; symbols: boolean; onToggle: () => void }) {
  const lead = (x1: number, x2: number) => <line x1={x1} y1="0" x2={x2} y2="0" stroke="#f59e0b" strokeWidth="4" />;
  switch (part.kind) {
    case "empty":
      return (
        <text textAnchor="middle" y="5" fontSize="12" fill="rgba(240,233,221,0.45)">
          + add
        </text>
      );
    case "wire":
      return lead(-42, 42);
    case "cell":
      return symbols ? (
        <g>
          {lead(-42, -4)}
          {lead(6, 42)}
          <line x1="-4" y1="-16" x2="-4" y2="16" stroke="white" strokeWidth="3" />
          <line x1="6" y1="-8" x2="6" y2="8" stroke="white" strokeWidth="6" />
          <text x="-14" y="-18" fontSize="11" fill="white">+</text>
        </g>
      ) : (
        <g>
          {lead(-42, -30)}
          {lead(30, 42)}
          <rect x="-30" y="-12" width="56" height="24" rx="5" fill="#16a34a" />
          <rect x="-30" y="-12" width="14" height="24" rx="4" fill="#d4d4d8" />
          <rect x="26" y="-5" width="5" height="10" rx="1" fill="#d4d4d8" />
          <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">1.5V</text>
        </g>
      );
    case "bulb": {
      const on = !part.fused && brightness > 0;
      return symbols ? (
        <g>
          {lead(-42, -12)}
          {lead(12, 42)}
          <circle r="12" fill={on ? `rgba(253,230,138,${0.3 + 0.7 * brightness})` : "none"} stroke="white" strokeWidth="2" />
          {part.fused ? (
            <path d="M-8 -2 L-2 2 M2 -2 L8 2" stroke="white" strokeWidth="2" />
          ) : (
            <path d="M-8 -8 L8 8 M-8 8 L8 -8" stroke="white" strokeWidth="2" />
          )}
        </g>
      ) : (
        <g>
          {lead(-42, -10)}
          {lead(10, 42)}
          {on && <circle r={18 + 22 * brightness} fill="url(#glow)" opacity={brightness} />}
          <circle cy="-6" r="13" fill={on ? `rgba(254,240,138,${0.35 + 0.65 * brightness})` : "rgba(240,233,221,0.12)"} stroke="rgba(240,233,221,0.6)" />
          {part.fused ? (
            <path d="M-6 -4 L-1 -9 M1 -3 L6 -8" stroke="#94a3b8" strokeWidth="1.5" />
          ) : (
            <path d="M-6 0 Q-3 -12 0 -4 Q3 -12 6 0" fill="none" stroke={on ? "#fff7ed" : "#94a3b8"} strokeWidth="1.5" />
          )}
          <rect x="-8" y="6" width="16" height="9" rx="2" fill="#a1a1aa" />
          {part.fused && (
            <text y="24" textAnchor="middle" fontSize="9" fill="#fda4af">fused</text>
          )}
        </g>
      );
    }
    case "switch": {
      const angle = part.on ? 0 : -30;
      return (
        <g onClick={onToggle}>
          {/* Hit area: when the lever is up there is nothing under the middle of the slot to tap. */}
          <rect x="-42" y="-26" width="84" height="52" fill="transparent" />
          {lead(-42, -16)}
          {lead(16, 42)}
          <circle cx="-16" r="4" fill="white" />
          <circle cx="16" r="4" fill="white" />
          <line x1="-16" y1="0" x2="16" y2="0" stroke="white" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle} -16 0)`} />
          <text y="22" textAnchor="middle" fontSize="9" fill={part.on ? "#bef264" : "#fda4af"}>
            {part.on ? "ON" : "OFF"} · tap
          </text>
        </g>
      );
    }
    case "material": {
      const m = MATERIALS[part.id];
      return (
        <g>
          {lead(-42, -24)}
          {lead(24, 42)}
          <circle cx="-24" r="4" fill="#ef4444" />
          <circle cx="24" r="4" fill="#ef4444" />
          <text y="6" textAnchor="middle" fontSize="18">{m.emoji}</text>
          <text y="22" textAnchor="middle" fontSize="8" fill="rgba(240,233,221,0.6)">{m.label.split(" (")[0]}</text>
        </g>
      );
    }
  }
}
