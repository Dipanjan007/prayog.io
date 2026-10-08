"use client";

import { useEffect, useRef, useState } from "react";
import {
  APPLIANCES,
  APPLIANCE_IDS,
  CIRCUITS,
  DAYS_IN_MONTH,
  FAULT_OHMS,
  MAINS,
  TARIFF_RS,
  bodyCurrent,
  budgetResult,
  circuitCurrent,
  currentDrawn,
  defaultHours,
  earthFaultCurrent,
  monthReport,
  overloaded,
  shortCircuitCurrent,
  type ApplianceId,
  type BudgetRound,
  type CircuitId,
  type Hours,
} from "@/lib/sim/wiring";

export type WiringMode = "house" | "faults" | "bill";
export type FaultScene = "short" | "earth";

export interface WiringReading {
  mode: WiringMode;
  /** Current now flowing in each circuit (0 when its MCB is off). */
  amps: Record<CircuitId, number>;
  tripped: Record<CircuitId, boolean>;
  /** How many times each MCB has tripped. */
  trips: Record<CircuitId, number>;
  scene: FaultScene;
  short: { happened: boolean; cordOk: boolean; fuseOk: boolean; lampOn: boolean };
  earth: { connected: boolean; faulty: boolean; fuseOk: boolean; shocks: number; savedByEarth: number };
  /** The last finished month on the bill. */
  month: { id: number; total: number; bill: number; top: ApplianceId[]; budget: { ok: boolean; needsMet: boolean; underBudget: boolean } | null } | null;
  /** The student's tap on "which used the most units?". */
  pick: { id: number; appliance: ApplianceId; correct: boolean } | null;
}

interface Props {
  onReading?: (r: WiringReading) => void;
  /** Challenge: bill only, with needs and a budget. */
  budget?: BudgetRound | null;
}

const SOCKETS: { room: string; circuit: CircuitId }[] = [
  { room: "Bedroom", circuit: "light" },
  { room: "Living", circuit: "light" },
  { room: "Living", circuit: "light" },
  { room: "Bedroom", circuit: "power" },
  { room: "Kitchen", circuit: "power" },
  { room: "Bathroom", circuit: "power" },
];
const START_PLUGS: (ApplianceId | null)[] = ["led", "fan", "tv", null, "fridge", null];
/** The fault bench: the lamp is on the 5 A circuit, the iron on the 15 A circuit. */
const LAMP_W = APPLIANCES.led.watts;
const IRON_W = APPLIANCES.iron.watts;
/** How long a run of the month takes on screen (s). */
const MONTH_ANIM_S = 3.2;
/** How long a fuse takes to glow and melt on screen (s). In real life it is a split second. */
const BLOW_ANIM_S = 0.9;
const SHOCK_ANIM_S = 1.8;

const COL = {
  live: "#ef4444",
  neutral: "#0f172a",
  neutralEdge: "#94a3b8",
  earth: "#22c55e",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  pink: "#f472b6",
  amber: "#fbbf24",
  copper: "#fb923c",
};

/** Time stamp for animations, read only in event handlers. */
const clock = () => performance.now();
const fmtA = (a: number) => (a >= 100 ? `${Math.round(a)} A` : a >= 10 ? `${a.toFixed(1)} A` : `${a.toFixed(2)} A`);
const fmtRs = (rs: number) => `₹${Math.round(rs).toLocaleString("en-IN")}`;

export default function HouseWiring({ onReading, budget = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeSel, setMode] = useState<WiringMode>("house");
  const mode: WiringMode = budget ? "bill" : modeSel;

  // ---------- House ----------
  const [plugs, setPlugs] = useState<(ApplianceId | null)[]>(START_PLUGS);
  const [selected, setSelected] = useState(0);
  const [tripped, setTripped] = useState<Record<CircuitId, boolean>>({ light: false, power: false });
  const [trips, setTrips] = useState<Record<CircuitId, number>>({ light: 0, power: 0 });
  const [houseMsg, setHouseMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const tripAt = useRef<Record<CircuitId, number>>({ light: -1e9, power: -1e9 });

  const loadOf = (c: CircuitId, p = plugs) => circuitCurrent(SOCKETS.flatMap((s, i) => (s.circuit === c && p[i] ? [APPLIANCES[p[i]!].watts] : [])));
  const load = { light: loadOf("light"), power: loadOf("power") };
  const amps = { light: tripped.light ? 0 : load.light, power: tripped.power ? 0 : load.power };
  const lightA = amps.light;
  const powerA = amps.power;

  const trip = (c: CircuitId, a: number, again: boolean) => {
    tripAt.current[c] = clock();
    setTripped((t) => ({ ...t, [c]: true }));
    setTrips((t) => ({ ...t, [c]: t[c] + 1 }));
    const rating = CIRCUITS[c].rating;
    setHouseMsg({
      text: again
        ? `It tripped again: the ${rating} A circuit would still carry ${fmtA(a)}. Unplug something first.`
        : `Click! The ${rating} A MCB tripped. The appliances would need ${fmtA(a)}, more than ${rating} A. This is overloading.`,
      bad: true,
    });
  };

  const plug = (id: ApplianceId | null) => {
    const next = plugs.slice();
    next[selected] = id;
    setPlugs(next);
    const c = SOCKETS[selected].circuit;
    const a = loadOf(c, next);
    if (!tripped[c] && overloaded(a, CIRCUITS[c].rating)) trip(c, a, false);
    else if (id) {
      const ap = APPLIANCES[id];
      setHouseMsg({ text: `${ap.name}: I = P ÷ V = ${ap.watts} W ÷ ${MAINS.V} V = ${fmtA(currentDrawn(ap.watts))}.`, bad: false });
    } else setHouseMsg(null);
  };

  const resetMcb = (c: CircuitId) => {
    const a = load[c];
    if (overloaded(a, CIRCUITS[c].rating)) trip(c, a, true);
    else {
      setTripped((t) => ({ ...t, [c]: false }));
      setHouseMsg({ text: `MCB back on. The ${CIRCUITS[c].rating} A circuit now carries ${fmtA(a)}.`, bad: false });
    }
  };

  // ---------- Faults ----------
  const [scene, setScene] = useState<FaultScene>("short");
  const [shortS, setShortS] = useState({ cordOk: true, fuseOk: true, happened: false });
  const [earthS, setEarthS] = useState({ connected: false, faulty: true, fuseOk: true, shocks: 0, savedByEarth: 0 });
  const [faultMsg, setFaultMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const blowAt = useRef<Record<FaultScene, number>>({ short: -1e9, earth: -1e9 });
  const touchAt = useRef<{ t: number; shock: boolean }>({ t: -1e9, shock: false });
  const lampOn = shortS.fuseOk && shortS.cordOk;

  const damageCord = () => {
    if (!shortS.fuseOk) {
      setShortS((x) => ({ ...x, cordOk: false }));
      setFaultMsg({ text: "The cord is damaged, but the fuse is already blown, so no current flows.", bad: true });
      return;
    }
    blowAt.current.short = performance.now();
    setShortS({ cordOk: false, fuseOk: false, happened: true });
    setFaultMsg({
      text: `Short circuit! Live touches neutral, so I = V ÷ R = ${MAINS.V} V ÷ ${FAULT_OHMS.wiringLoop} Ω = ${Math.round(shortCircuitCurrent())} A. The fuse melts and cuts the supply.`,
      bad: true,
    });
  };
  const replaceCord = () => {
    setShortS((s) => ({ ...s, cordOk: true }));
    setFaultMsg({ text: shortS.fuseOk ? "New cord fitted." : "New cord fitted. The fuse is still blown, so put in a new one.", bad: false });
  };
  const newShortFuse = () => {
    if (!shortS.cordOk) {
      blowAt.current.short = performance.now();
      setFaultMsg({ text: "It blew again! Live is still touching neutral. Replace the damaged cord first.", bad: true });
      return;
    }
    setShortS((s) => ({ ...s, fuseOk: true }));
    setFaultMsg({ text: `The lamp glows again and takes just ${fmtA(currentDrawn(LAMP_W))}. Fault fixed.`, bad: false });
  };

  const blowEarth = (msg: string) => {
    blowAt.current.earth = performance.now();
    setFaultMsg({ text: msg, bad: false });
  };
  const earthMsg = `With earth, the leak rushes down the earth wire: I = ${MAINS.V} V ÷ ${FAULT_OHMS.earthPath} Ω = ${Math.round(earthFaultCurrent())} A. The 15 A fuse blows and the iron is safely off.`;
  const toggleEarth = () => {
    const connected = !earthS.connected;
    if (connected && earthS.faulty && earthS.fuseOk) {
      setEarthS((s) => ({ ...s, connected, fuseOk: false, savedByEarth: s.savedByEarth + 1 }));
      blowEarth(earthMsg);
    } else {
      setEarthS((s) => ({ ...s, connected }));
      setFaultMsg({ text: connected ? "Earth wire connected to the metal body." : "Earth wire removed. The metal body is no longer earthed.", bad: !connected });
    }
  };
  const toggleFault = () => {
    const faulty = !earthS.faulty;
    if (faulty && earthS.connected && earthS.fuseOk) {
      setEarthS((s) => ({ ...s, faulty, fuseOk: false, savedByEarth: s.savedByEarth + 1 }));
      blowEarth(earthMsg);
    } else {
      setEarthS((s) => ({ ...s, faulty }));
      setFaultMsg({ text: faulty ? "The live wire now touches the metal body again." : "Iron repaired: the live wire no longer touches the body.", bad: false });
    }
  };
  const newEarthFuse = () => {
    if (earthS.faulty && earthS.connected) {
      setEarthS((s) => ({ ...s, savedByEarth: s.savedByEarth + 1 }));
      blowEarth("It blew again, because the iron is still faulty. Repair the iron first.");
      return;
    }
    setEarthS((s) => ({ ...s, fuseOk: true }));
    setFaultMsg({ text: "New fuse in. The iron is heating.", bad: false });
  };
  const touch = () => {
    const shock = earthS.fuseOk && earthS.faulty && !earthS.connected;
    touchAt.current = { t: performance.now(), shock };
    if (shock) {
      setEarthS((s) => ({ ...s, shocks: s.shocks + 1 }));
      setFaultMsg({
        text: `Ouch! The current goes through the person: I = ${MAINS.V} V ÷ ${FAULT_OHMS.body} Ω = ${bodyCurrent().toFixed(2)} A. That is far below 15 A, so the fuse does not blow, but it is very dangerous.`,
        bad: true,
      });
    } else if (!earthS.fuseOk) setFaultMsg({ text: "Safe. The fuse has blown, so the iron is dead. Repair it before using it again.", bad: false });
    else setFaultMsg({ text: "Safe. The metal body is not live.", bad: false });
  };

  // ---------- Bill ----------
  const [hours, setHours] = useState<Hours>(defaultHours);
  const [running, setRunning] = useState(false);
  const [month, setMonth] = useState<WiringReading["month"]>(null);
  const [pick, setPick] = useState<WiringReading["pick"]>(null);
  const runRef = useRef<{ start: number; hours: Hours } | null>(null);
  const monthId = useRef(0);
  const pickId = useRef(0);
  const shownMonth = useRef<{ hours: Hours; done: boolean } | null>(null);

  const setHour = (id: ApplianceId, h: number) => {
    setHours((x) => ({ ...x, [id]: h }));
    setMonth(null);
    setPick(null);
    shownMonth.current = null;
  };
  const runMonth = () => {
    runRef.current = { start: performance.now(), hours: { ...hours } };
    shownMonth.current = { hours: { ...hours }, done: false };
    setMonth(null);
    setPick(null);
    setRunning(true);
  };
  const finishMonth = useRef<() => void>(() => {});
  useEffect(() => {
    finishMonth.current = () => {
      const run = runRef.current;
      if (!run) return;
      runRef.current = null;
      const r = monthReport(run.hours);
      const b = budget ? budgetResult(budget, run.hours) : null;
      monthId.current++;
      setMonth({ id: monthId.current, total: r.total, bill: r.bill, top: r.top, budget: b && { ok: b.ok, needsMet: b.needsMet, underBudget: b.underBudget } });
      if (shownMonth.current) shownMonth.current.done = true;
      setRunning(false);
    };
  });
  const choose = (id: ApplianceId) => {
    if (!month) return;
    pickId.current++;
    setPick({ id: pickId.current, appliance: id, correct: month.top.includes(id) });
  };

  // ---------- Animation ----------
  const params = useRef({ mode, plugs, tripped, load, scene, shortS, earthS, lampOn, selected });
  useEffect(() => {
    params.current = { mode, plugs, tripped, load, scene, shortS, earthS, lampOn, selected };
  });

  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    const phase = { live: [0, 0], drop: [0, 0, 0, 0, 0, 0], fault: 0 };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (P.mode === "house") {
        (["light", "power"] as const).forEach((cid, r) => {
          const a = P.tripped[cid] ? 0 : P.load[cid];
          phase.live[r] += dt * flowSpeed(a);
        });
        SOCKETS.forEach((s, i) => {
          const id = P.plugs[i];
          const a = id && !P.tripped[s.circuit] ? currentDrawn(APPLIANCES[id].watts) : 0;
          phase.drop[i] += dt * flowSpeed(a);
        });
        drawHouse(ctx, w, h, now, P.plugs, P.tripped, P.load, phase, tripAt.current, P.selected);
      } else if (P.mode === "faults") {
        const blowing = (now - blowAt.current[P.scene]) / 1000 < BLOW_ANIM_S;
        let a = 0;
        if (P.scene === "short") a = blowing ? shortCircuitCurrent() : P.lampOn ? currentDrawn(LAMP_W) : 0;
        else a = blowing ? earthFaultCurrent() : P.earthS.fuseOk ? currentDrawn(IRON_W) : 0;
        phase.fault += dt * flowSpeed(a);
        if (P.scene === "short") drawShort(ctx, w, h, now, P.shortS, P.lampOn, phase.fault, blowAt.current.short, a);
        else drawEarth(ctx, w, h, now, P.earthS, phase.fault, blowAt.current.earth, touchAt.current, a);
      } else {
        const run = runRef.current;
        let prog = 1;
        let hrs: Hours | null = shownMonth.current?.hours ?? null;
        if (run) {
          prog = Math.min(1, (now - run.start) / 1000 / MONTH_ANIM_S);
          hrs = run.hours;
          if (prog >= 1) finishMonth.current();
        }
        drawBill(ctx, w, h, now, hrs, prog);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------- Reading ----------
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });
  useEffect(() => {
    onReadingRef.current?.({
      mode,
      amps: { light: lightA, power: powerA },
      tripped,
      trips,
      scene,
      short: { ...shortS, lampOn: shortS.fuseOk && shortS.cordOk },
      earth: earthS,
      month,
      pick,
    });
  }, [mode, lightA, powerA, tripped, trips, scene, shortS, earthS, month, pick]);

  const sel = SOCKETS[selected];
  const report = monthReport(hours);
  const budgetNow = budget ? budgetResult(budget, hours) : null;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!budget && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["house", "faults", "bill"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "house" ? "House" : m === "faults" ? "Faults" : "Bill"}
            </button>
          ))}
        </div>
      )}

      {mode === "faults" && (
        <Choice
          options={[
            { id: "short", label: "Short circuit" },
            { id: "earth", label: "Faulty iron" },
          ]}
          value={scene}
          onChange={(s) => {
            setScene(s);
            setFaultMsg(null);
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          mode === "house"
            ? `House wiring: a 5 A lighting circuit and a 15 A power circuit, each with three sockets in parallel between the red live wire and the black neutral wire. The lighting circuit carries ${fmtA(amps.light)}${tripped.light ? " and its MCB has tripped" : ""}. The power circuit carries ${fmtA(amps.power)}${tripped.power ? " and its MCB has tripped" : ""}.`
            : mode === "faults"
              ? scene === "short"
                ? `A lamp on a cord with a fuse. ${shortS.cordOk ? "The cord is fine." : "The cord is damaged and live touches neutral."} The fuse is ${shortS.fuseOk ? "fine" : "blown"}.`
                : `A faulty iron whose live wire touches its metal body. The earth wire is ${earthS.connected ? "connected" : "not connected"} and the fuse is ${earthS.fuseOk ? "fine" : "blown"}. A cartoon person stands next to it.`
              : `An electricity meter and a bar for each appliance showing the units it uses in a 30-day month.`
        }
      />

      {mode === "house" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="5 A circuit" value={tripped.light ? "Tripped" : fmtA(amps.light)} bad={tripped.light} />
            <Stat label="15 A circuit" value={tripped.power ? "Tripped" : fmtA(amps.power)} bad={tripped.power} />
            <Stat label="Total" value={`${Math.round((amps.light + amps.power) * MAINS.V)} W`} />
          </div>
          {houseMsg && <p className={`text-center text-sm ${houseMsg.bad ? "text-amber-200" : "text-white/60"}`}>{houseMsg.text}</p>}
          {(["light", "power"] as const).map((cid) => (
            <div key={cid} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-white/60">
                  {CIRCUITS[cid].rating} A {cid === "light" ? "lighting" : "power"} circuit
                </span>
                {tripped[cid] ? (
                  <button className="rounded-lg border border-pink-300/60 bg-pink-300/15 px-2 py-1 text-xs text-pink-100" onClick={() => resetMcb(cid)}>
                    ↑ Reset MCB
                  </button>
                ) : (
                  <span className="text-xs text-white/40">MCB on</span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SOCKETS.map((s, i) =>
                  s.circuit !== cid ? null : (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      aria-pressed={selected === i}
                      className={`rounded-xl border px-1 py-1.5 text-center text-xs ${selected === i ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                    >
                      <div className="text-lg leading-6">{plugs[i] ? APPLIANCES[plugs[i]!].emoji : "🔌"}</div>
                      <div className="truncate">{s.room}</div>
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-sm text-white/60">
              Plug into the {sel.room.toLowerCase()} socket ({CIRCUITS[sel.circuit].rating} A circuit):
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {APPLIANCE_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => plug(id)}
                  className={`rounded-xl border px-1 py-1.5 text-xs ${plugs[selected] === id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                >
                  <div className="text-base leading-5">{APPLIANCES[id].emoji}</div>
                  <div className="truncate">{APPLIANCES[id].name}</div>
                  <div className="tabular-nums text-white/45">{APPLIANCES[id].watts} W</div>
                </button>
              ))}
              <button onClick={() => plug(null)} className="rounded-xl border border-white/10 px-1 py-1.5 text-xs text-white/70">
                <div className="text-base leading-5">✋</div>
                <div>Unplug</div>
              </button>
            </div>
          </div>
        </>
      )}

      {mode === "faults" && scene === "short" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Cord" value={shortS.cordOk ? "OK" : "Damaged"} bad={!shortS.cordOk} />
            <Stat label="5 A fuse" value={shortS.fuseOk ? "OK" : "Blown"} bad={!shortS.fuseOk} />
            <Stat label="Lamp" value={lampOn ? "On" : "Off"} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={damageCord} disabled={!shortS.cordOk}>
              ⚡ Fray the cord
            </button>
            <button className="btn-ghost !py-2 text-sm disabled:opacity-40" onClick={replaceCord} disabled={shortS.cordOk}>
              🔧 Replace the cord
            </button>
            <button className="btn-ghost !py-2 text-sm disabled:opacity-40" onClick={newShortFuse} disabled={shortS.fuseOk}>
              🧯 Put in a new fuse
            </button>
          </div>
        </>
      )}

      {mode === "faults" && scene === "earth" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Earth wire" value={earthS.connected ? "On" : "Off"} bad={!earthS.connected} />
            <Stat label="15 A fuse" value={earthS.fuseOk ? "OK" : "Blown"} bad={!earthS.fuseOk} />
            <Stat label="Iron" value={earthS.faulty ? "Faulty" : "Repaired"} bad={earthS.faulty} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={touch}>
              👆 Touch the iron
            </button>
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${earthS.connected ? "border-lime-300 bg-lime-300/15" : "border-white/10 text-white/70"}`}
              onClick={toggleEarth}
            >
              {earthS.connected ? "⏚ Earth connected" : "⏚ Connect earth"}
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={toggleFault}>
              {earthS.faulty ? "🔧 Repair the iron" : "⚠️ Make it faulty"}
            </button>
            <button className="btn-ghost !py-2 text-sm disabled:opacity-40" onClick={newEarthFuse} disabled={earthS.fuseOk}>
              🧯 New fuse
            </button>
          </div>
        </>
      )}

      {mode === "faults" && faultMsg && <p className={`text-center text-sm ${faultMsg.bad ? "text-amber-200" : "text-lime-300"}`}>{faultMsg.text}</p>}
      {mode === "faults" && <p className="text-center text-xs text-white/40">Cartoon only. Never touch a faulty appliance or open a plug or switch board. Tell an adult and call an electrician.</p>}

      {mode === "bill" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Units" value={month ? month.total.toFixed(1) : "–"} />
            <Stat label="Bill" value={month ? fmtRs(month.bill) : "–"} />
            <Stat label="Tariff" value={`₹${TARIFF_RS}/unit`} />
          </div>
          {budget && budgetNow && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">{budget.name}: budget</span>
                <span className="tabular-nums text-white">{fmtRs(budget.budget)}</span>
              </div>
              <div className={`mt-1 text-xs ${budgetNow.needsMet ? "text-lime-300" : "text-amber-200"}`}>
                {budgetNow.needsMet ? "✓ Every need is met" : "○ Some appliances are below the hours the family needs"}
              </div>
              {month?.budget && (
                <div className={`mt-1 text-xs ${month.budget.ok ? "text-lime-300" : "text-amber-200"}`}>
                  {month.budget.ok
                    ? `Bill ${fmtRs(month.bill)}, within budget!`
                    : !month.budget.needsMet
                      ? "The family's needs were not met. Raise those hours."
                      : `Bill ${fmtRs(month.bill)} is ${fmtRs(month.bill - budget.budget)} over budget. Cut some hours.`}
                </div>
              )}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {APPLIANCE_IDS.map((id) => {
              const need = budget?.needs[id];
              const short = need !== undefined && hours[id] < need;
              return (
                <label key={id} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-white/70">
                      {APPLIANCES[id].emoji} {APPLIANCES[id].name} <span className="text-white/40">{APPLIANCES[id].watts} W</span>
                    </span>
                    <span className={`shrink-0 tabular-nums ${short ? "text-amber-200" : "text-white"}`}>
                      {hours[id]} h/day{need !== undefined && <span className="text-white/40"> (≥ {need})</span>}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="range mt-2 w-full"
                    min={0}
                    max={24}
                    step={0.5}
                    value={hours[id]}
                    disabled={running}
                    aria-label={`${APPLIANCES[id].name} hours per day`}
                    onChange={(e) => setHour(id, Number(e.target.value))}
                  />
                </label>
              );
            })}
          </div>
          <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={runMonth} disabled={running}>
            {running ? "Running the month…" : `📅 Run a ${DAYS_IN_MONTH}-day month`}
          </button>
          <p className="text-center text-xs text-white/50 tabular-nums">
            Units = kW × hours. This plan: {report.total.toFixed(1)} units a month.
          </p>
          {month && !budget && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="text-sm text-white/70">Which appliance used the most units this month? Tap it.</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {APPLIANCE_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => choose(id)}
                    aria-label={APPLIANCES[id].name}
                    className={`rounded-xl border py-1.5 text-lg ${
                      pick?.appliance === id ? (pick.correct ? "border-lime-300 bg-lime-300/15" : "border-amber-300 bg-amber-300/10") : "border-white/10"
                    }`}
                  >
                    {APPLIANCES[id].emoji}
                  </button>
                ))}
              </div>
              {pick && (
                <p className={`mt-2 text-xs ${pick.correct ? "text-lime-300" : "text-amber-200"}`}>
                  {pick.correct
                    ? `Yes! The ${APPLIANCES[pick.appliance].name.toLowerCase()} used ${report.units[pick.appliance].toFixed(1)} units: ${APPLIANCES[pick.appliance].watts / 1000} kW × ${hours[pick.appliance]} h × ${DAYS_IN_MONTH} days.`
                    : `Not this one: ${report.units[pick.appliance].toFixed(1)} units. Look at the bars again. Power and hours both count.`}
                </p>
              )}
            </div>
          )}
          <p className="text-center text-xs text-white/40">₹{TARIFF_RS} per unit is only an example. Real tariffs vary from state to state and often rise as you use more units.</p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-lg tabular-nums ${bad ? "text-pink-300" : ""}`}>{value}</div>
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
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";
const EMOJI = (px: number) => `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;

/** Speed of the drawn charge dots (px/s). Real drift speeds are far slower; this only shows more or less current. */
function flowSpeed(amps: number) {
  if (amps <= 0) return 0;
  return Math.min(400, 14 + 34 * Math.sqrt(amps));
}

function wire(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 3, edge?: string) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 2;
    path(ctx, pts);
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  path(ctx, pts);
  ctx.stroke();
}

function path(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
}

/** Dots spaced along a polyline, shifted by phase (px). */
function dots(ctx: CanvasRenderingContext2D, pts: [number, number][], phase: number, color: string, gap = 14, r = 1.8) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(l);
    total += l;
  }
  if (total <= 0) return;
  ctx.fillStyle = color;
  for (let d = ((phase % gap) + gap) % gap; d < total; d += gap) {
    let rest = d;
    let i = 0;
    while (i < segs.length - 1 && rest > segs[i]) rest -= segs[i++];
    const f = segs[i] ? rest / segs[i] : 0;
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
    const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = "rgba(255,255,255,0.6)", align: CanvasTextAlign = "left", font = FONT) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHouse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  plugs: (ApplianceId | null)[],
  tripped: Record<CircuitId, boolean>,
  load: Record<CircuitId, number>,
  phase: { live: number[]; drop: number[] },
  tripAt: Record<CircuitId, number>,
  selected: number,
) {
  const L = Math.max(68, Math.min(84, w * 0.17));
  // Supply column: mains, meter, main fuse.
  label(ctx, "Mains", 6, 16, "rgba(255,255,255,0.8)", "left", "bold 11px system-ui, sans-serif");
  label(ctx, "220 V AC", 6, 30);
  label(ctx, "50 Hz", 6, 43);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 54, L - 16, 26);
  label(ctx, "Meter", 6 + (L - 16) / 2, 71, "rgba(255,255,255,0.75)", "center");
  ctx.strokeRect(6, 90, L - 16, 18);
  label(ctx, "Main fuse", 6 + (L - 16) / 2, 103, "rgba(255,255,255,0.6)", "center", "10px system-ui, sans-serif");
  // Earth pit.
  const pitY = h - 14;
  wire(ctx, [[18, 108], [18, pitY]], COL.earth, 1.5);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = COL.earth;
    ctx.beginPath();
    ctx.moveTo(18 - 9 + i * 3, pitY + i * 4);
    ctx.lineTo(18 + 9 - i * 3, pitY + i * 4);
    ctx.stroke();
  }
  label(ctx, "Earth", 30, pitY + 4, "rgba(134,239,172,0.8)");

  const busX = L - 4;
  const rowH = (h - 8) / 2;
  (["light", "power"] as const).forEach((cid, r) => {
    const top = 4 + r * rowH;
    const yL = top + 26;
    const yN = top + rowH - 30;
    const yE = yN + 7;
    const yMid = (yL + yN) / 2 + 2;
    const off = tripped[cid];
    const flash = (now - tripAt[cid]) / 1000 < 0.8;
    const rating = CIRCUITS[cid].rating;
    const over = load[cid] > rating;

    // Feed from the board.
    wire(ctx, [[busX - 12, yL], [busX, yL]], COL.live, 2.5);
    wire(ctx, [[busX - 12, yN], [busX + 6, yN]], COL.neutral, 2.5, COL.neutralEdge);
    // MCB.
    const mx = busX;
    ctx.fillStyle = off ? (flash && Math.floor(now / 100) % 2 ? "rgba(244,114,182,0.6)" : "rgba(244,114,182,0.2)") : "rgba(255,255,255,0.08)";
    ctx.strokeStyle = off ? COL.pink : "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.2;
    ctx.fillRect(mx, yL - 11, 30, 22);
    ctx.strokeRect(mx, yL - 11, 30, 22);
    // Lever.
    ctx.fillStyle = off ? COL.pink : "#e2e8f0";
    ctx.fillRect(mx + 11, off ? yL + 1 : yL - 8, 8, 7);
    label(ctx, "MCB", mx + 15, yL + 23, off ? COL.pink : "rgba(255,255,255,0.75)", "center", "bold 10px system-ui, sans-serif");

    const x0 = mx + 30;
    const x1 = w - 8;
    const xs = [0, 1, 2].map((k) => x0 + 14 + ((k + 0.5) * (x1 - x0 - 14)) / 3);
    const liveCol = off ? "rgba(239,68,68,0.35)" : COL.live;
    wire(ctx, [[x0, yL], [x1, yL]], liveCol, 2.5);
    wire(ctx, [[busX + 6, yN], [x1, yN]], COL.neutral, 2.5, off ? "rgba(148,163,184,0.4)" : COL.neutralEdge);
    ctx.setLineDash([4, 3]);
    wire(ctx, [[busX + 6, yE], [x1, yE]], "rgba(34,197,94,0.6)", 1.2);
    ctx.setLineDash([]);
    if (!off && load[cid] > 0) {
      dots(ctx, [[x0, yL], [xs[2], yL]], phase.live[r], "rgba(254,202,202,0.9)");
      dots(ctx, [[xs[2], yN], [busX + 6, yN]], phase.live[r], "rgba(203,213,225,0.8)");
    }

    // Header.
    const head = off ? `${rating} A ${cid === "light" ? "lighting" : "power"} circuit · MCB TRIPPED` : `${rating} A ${cid === "light" ? "lighting" : "power"} circuit · ${fmtA(load[cid])}`;
    label(ctx, head, x0 + 4, top + 11, off ? COL.pink : over ? COL.amber : "rgba(255,255,255,0.7)", "left", "bold 11px system-ui, sans-serif");

    SOCKETS.forEach((s, i) => {
      if (s.circuit !== cid) return;
      const k = SOCKETS.filter((t, j) => t.circuit === cid && j < i).length;
      const x = xs[k];
      const id = plugs[i];
      if (i === selected) {
        ctx.strokeStyle = "rgba(34,211,238,0.5)";
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x - 26, yL + 4, 52, yN - yL - 8);
        ctx.setLineDash([]);
      }
      label(ctx, s.room, x, yE + 13, "rgba(255,255,255,0.45)", "center", "10px system-ui, sans-serif");
      if (!id) {
        // Empty socket: three holes.
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 9, yMid - 9, 18, 18);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (const [dx, dy, rr] of [[0, -4, 1.8], [-4, 3, 1.4], [4, 3, 1.4]]) {
          ctx.beginPath();
          ctx.arc(x + dx, yMid + dy, rr, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      const ap = APPLIANCES[id];
      const on = !off;
      const a = currentDrawn(ap.watts);
      wire(ctx, [[x, yL], [x, yMid - 13]], liveCol, 2);
      wire(ctx, [[x, yMid + 13], [x, yN]], COL.neutral, 2, off ? "rgba(148,163,184,0.4)" : COL.neutralEdge);
      if (on) {
        dots(ctx, [[x, yL], [x, yMid - 13]], phase.drop[i], "rgba(254,202,202,0.9)", 9);
        dots(ctx, [[x, yMid + 13], [x, yN]], phase.drop[i], "rgba(203,213,225,0.8)", 9);
        const glow = Math.min(1, 0.25 + Math.log10(1 + ap.watts) / 4);
        const g = ctx.createRadialGradient(x, yMid, 2, x, yMid, 20);
        g.addColorStop(0, id === "led" ? `rgba(253,224,71,${glow})` : `rgba(34,211,238,${glow * 0.6})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, yMid, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = on ? 1 : 0.35;
      ctx.font = EMOJI(20);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ap.emoji, x, yMid);
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
      label(ctx, on ? fmtA(a) : "0 A", x + 15, yMid - 9, on ? "rgba(165,243,252,0.9)" : "rgba(255,255,255,0.35)", "left", "10px system-ui, sans-serif");
    });
  });
}

function fuseBox(ctx: CanvasRenderingContext2D, x: number, y: number, ok: boolean, glow: number, rating: number) {
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.2;
  ctx.fillRect(x - 22, y - 10, 44, 20);
  ctx.strokeRect(x - 22, y - 10, 44, 20);
  if (glow > 0) {
    ctx.shadowColor = COL.amber;
    ctx.shadowBlur = 16 * glow;
  }
  ctx.strokeStyle = glow > 0 ? `rgba(255,${Math.round(240 - 120 * glow)},${Math.round(120 - 100 * glow)},1)` : ok ? "#cbd5e1" : "#94a3b8";
  ctx.lineWidth = 1.5 + glow;
  ctx.beginPath();
  if (ok || glow > 0) {
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x + 18, y);
  } else {
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x - 5, y + 3);
    ctx.moveTo(x + 18, y);
    ctx.lineTo(x + 6, y + 3);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(x - 3, y + 4, 6, 3);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  const blown = !ok && glow === 0;
  label(ctx, blown ? `Fuse ${rating} A · BLOWN` : `Fuse ${rating} A`, x - 22, y + 22, blown ? COL.pink : "rgba(255,255,255,0.7)", "left", blown ? "bold 10px system-ui, sans-serif" : "10px system-ui, sans-serif");
}

function sparks(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, size = 12) {
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 10;
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + now / 60;
    const r = size * (0.5 + 0.5 * Math.abs(Math.sin(now / 40 + i)));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function ammeter(ctx: CanvasRenderingContext2D, w: number, a: number, alarm: boolean) {
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = alarm ? "#fda4af" : "#fde047";
  ctx.fillText(`I = ${fmtA(a)}`, w - 8, 18);
}

function drawShort(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  s: { cordOk: boolean; fuseOk: boolean },
  lampOn: boolean,
  phase: number,
  blowAt: number,
  amps: number,
) {
  const t = (now - blowAt) / 1000;
  const blowing = t < BLOW_ANIM_S;
  const glow = blowing ? Math.min(1, t / (BLOW_ANIM_S * 0.6)) : 0;
  const y1 = h * 0.36;
  const y2 = h * 0.64;
  const fx = 44;
  const lx = w - 46;
  const cut = w * 0.52;
  label(ctx, "Live", 6, y1 - 8, "rgba(252,165,165,0.8)");
  label(ctx, "Neutral", 6, y2 + 16, "rgba(203,213,225,0.7)");
  label(ctx, "220 V", 6, h / 2 + 4, "rgba(255,255,255,0.5)");
  ammeter(ctx, w, amps, blowing);
  wire(ctx, [[4, y1], [fx - 22, y1]], COL.live, 3);
  fuseBox(ctx, fx, y1, s.fuseOk, glow, CIRCUITS.light.rating);
  const live: [number, number][] = [[fx + 22, y1], [lx, y1], [lx, h / 2 - 16]];
  const neutral: [number, number][] = [[lx, h / 2 + 16], [lx, y2], [4, y2]];
  wire(ctx, live, COL.live, 3);
  wire(ctx, neutral, COL.neutral, 3, COL.neutralEdge);

  // Damaged section of the cord.
  if (!s.cordOk) {
    ctx.fillStyle = "#0a0d1c";
    ctx.fillRect(cut - 14, y1 - 4, 28, 8);
    ctx.fillRect(cut - 14, y2 - 4, 28, 8);
    wire(ctx, [[cut - 14, y1], [cut - 4, y1], [cut, h / 2], [cut + 4, y1], [cut + 14, y1]], COL.copper, 1.6);
    wire(ctx, [[cut - 14, y2], [cut - 4, y2], [cut, h / 2], [cut + 4, y2], [cut + 14, y2]], COL.copper, 1.6);
    label(ctx, "bare wires touching", cut, y2 + 18, COL.amber, "center", "10px system-ui, sans-serif");
    if (blowing) sparks(ctx, cut, h / 2, now, 16);
  }

  // Lamp.
  if (lampOn) {
    const g = ctx.createRadialGradient(lx, h / 2, 3, lx, h / 2, 40);
    g.addColorStop(0, "rgba(253,224,71,0.8)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx, h / 2, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = lampOn ? "#fef9c3" : "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(lx, h / 2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(ctx, `Lamp ${LAMP_W} W`, lx, h / 2 + 34, "rgba(255,255,255,0.6)", "center");

  if (blowing) {
    // Huge current takes the short path, not the lamp.
    dots(ctx, [[fx - 22, y1], [cut, y1], [cut, y2], [4, y2]], phase, "#fef08a", 10, 2.4);
  } else if (lampOn) {
    dots(ctx, [[fx + 22, y1], ...live.slice(1)], phase, "rgba(254,202,202,0.9)");
    dots(ctx, neutral, phase, "rgba(203,213,225,0.8)");
  }
  label(ctx, blowing ? "Short circuit!" : !s.fuseOk ? "No current: the fuse has broken the circuit" : "", w / 2, h - 10, blowing ? COL.amber : "rgba(255,255,255,0.55)", "center", "bold 12px system-ui, sans-serif");
}

function drawEarth(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  s: { connected: boolean; faulty: boolean; fuseOk: boolean },
  phase: number,
  blowAt: number,
  touchAt: { t: number; shock: boolean },
  amps: number,
) {
  const tb = (now - blowAt) / 1000;
  const blowing = tb < BLOW_ANIM_S;
  const glow = blowing ? Math.min(1, tb / (BLOW_ANIM_S * 0.6)) : 0;
  const tt = (now - touchAt.t) / 1000;
  const touching = tt < SHOCK_ANIM_S;
  const shocking = touching && touchAt.shock;
  const ground = h - 26;
  const yL = 34;
  const fx = 44;
  const ix = w * 0.5;
  const iy = ground - 58;
  const px = Math.min(w - 26, ix + 92);

  // Ground.
  ctx.fillStyle = "rgba(132,204,22,0.1)";
  ctx.fillRect(0, ground, w, h - ground);
  ctx.strokeStyle = "rgba(132,204,22,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(w, ground);
  ctx.stroke();

  ammeter(ctx, w, shocking ? bodyCurrent() : amps, blowing || shocking);
  label(ctx, "Live 220 V", 6, yL - 8, "rgba(252,165,165,0.8)");
  wire(ctx, [[4, yL], [fx - 22, yL]], COL.live, 3);
  fuseBox(ctx, fx, yL, s.fuseOk, glow, CIRCUITS.power.rating);
  const live: [number, number][] = [[fx + 22, yL], [ix - 30, yL], [ix - 30, iy - 6]];
  wire(ctx, live, COL.live, 3);
  wire(ctx, [[ix - 22, iy - 6], [ix - 22, yL + 34], [4, yL + 34]], COL.neutral, 3, COL.neutralEdge);
  label(ctx, "Neutral", 6, yL + 50, "rgba(203,213,225,0.7)");

  // Iron: soleplate and metal body.
  const hot = s.fuseOk;
  ctx.fillStyle = hot ? "rgba(251,146,60,0.9)" : "#475569";
  ctx.beginPath();
  ctx.moveTo(ix - 44, iy + 22);
  ctx.lineTo(ix + 40, iy + 22);
  ctx.lineTo(ix + 52, iy + 14);
  ctx.lineTo(ix - 44, iy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#94a3b8";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ix - 44, iy + 14);
  ctx.lineTo(ix + 52, iy + 14);
  ctx.quadraticCurveTo(ix + 30, iy - 12, ix - 10, iy - 12);
  ctx.lineTo(ix - 44, iy - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Handle.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(ix - 34, iy - 12);
  ctx.lineTo(ix - 30, iy - 30);
  ctx.lineTo(ix + 10, iy - 30);
  ctx.lineTo(ix + 14, iy - 12);
  ctx.stroke();
  label(ctx, "metal body", ix + 4, iy + 6, "#1e293b", "center", "bold 10px system-ui, sans-serif");
  if (s.faulty) {
    wire(ctx, [[ix - 30, iy - 6], [ix - 18, iy + 2]], COL.live, 2);
    label(ctx, "⚠ live touches body", ix - 44, iy + 38, COL.amber, "left", "10px system-ui, sans-serif");
  }

  // Earth wire from the body to a plate in the ground.
  const ex = ix - 40;
  if (s.connected) {
    wire(ctx, [[ex, iy + 4], [ex - 22, iy + 4], [ex - 22, ground + 12]], COL.earth, 2.5);
    ctx.fillStyle = COL.earth;
    ctx.fillRect(ex - 32, ground + 12, 20, 4);
    label(ctx, "earth", ex - 26, iy - 2, "rgba(134,239,172,0.9)", "right", "10px system-ui, sans-serif");
  } else {
    wire(ctx, [[ex - 22, ground - 18], [ex - 22, ground + 12]], "rgba(34,197,94,0.6)", 2.5);
    ctx.fillStyle = "rgba(34,197,94,0.6)";
    ctx.fillRect(ex - 32, ground + 12, 20, 4);
    label(ctx, "earth not joined", ex - 8, ground + 17, "rgba(134,239,172,0.7)", "left", "10px system-ui, sans-serif");
  }

  // Flow.
  if (blowing) {
    dots(ctx, [[fx - 22, yL], ...live.slice(1), [ex, iy + 4], [ex - 22, iy + 4], [ex - 22, ground + 12]], phase, "#fef08a", 10, 2.4);
  } else if (s.fuseOk) {
    dots(ctx, [[fx + 22, yL], ...live.slice(1)], phase, "rgba(254,202,202,0.9)");
  }

  // Cartoon person.
  const headY = ground - 70;
  const reach = touching ? Math.min(1, tt / 0.25) * (tt < SHOCK_ANIM_S - 0.3 ? 1 : (SHOCK_ANIM_S - tt) / 0.3) : 0;
  const jitter = shocking ? Math.sin(now / 25) * 2 : 0;
  const bx = px + jitter;
  ctx.strokeStyle = shocking ? "#fde047" : "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(bx, headY, 9, 0, Math.PI * 2);
  ctx.moveTo(bx, headY + 9);
  ctx.lineTo(bx, ground - 26);
  ctx.lineTo(bx - 9, ground);
  ctx.moveTo(bx, ground - 26);
  ctx.lineTo(bx + 9, ground);
  // Arms: one reaches for the iron.
  const handX = bx - 8 - reach * (bx - 8 - (ix + 46));
  ctx.moveTo(bx, headY + 20);
  ctx.lineTo(handX, headY + 26 + reach * (iy - headY - 22));
  ctx.moveTo(bx, headY + 20);
  ctx.lineTo(bx + 12, headY + 36);
  ctx.stroke();
  // Face.
  ctx.fillStyle = shocking ? "#fde047" : "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(bx - 3, headY - 2, 1.4, 0, Math.PI * 2);
  ctx.arc(bx + 3, headY - 2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  if (shocking) {
    // Spiky hair and zigzags.
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + i * 4, headY - 9);
      ctx.lineTo(bx + i * 6, headY - 18);
      ctx.stroke();
    }
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(bx + side * 16, headY - 6);
      ctx.lineTo(bx + side * 22, headY + 4);
      ctx.lineTo(bx + side * 16, headY + 12);
      ctx.lineTo(bx + side * 22, headY + 22);
      ctx.stroke();
    }
    dots(ctx, [[handX, iy + 4], [bx, headY + 20], [bx, ground - 26], [bx - 9, ground]], now / 6, "#fda4af", 8, 2);
    label(ctx, "Ouch!", bx, headY - 24, "#fde047", "center", "bold 13px system-ui, sans-serif");
  } else if (touching) {
    label(ctx, "Safe", bx, headY - 16, "#bef264", "center", "bold 12px system-ui, sans-serif");
  }
  label(ctx, blowing ? "Fuse blows: iron switched off" : "", w / 2, h - 8, COL.amber, "center", "bold 12px system-ui, sans-serif");
}

function drawBill(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, hours: Hours | null, prog: number) {
  const r = hours ? monthReport(hours) : null;
  const units = r ? r.total * prog : 0;
  const day = r ? Math.min(DAYS_IN_MONTH, Math.floor(prog * DAYS_IN_MONTH) + (prog >= 1 ? 0 : 1)) : 0;
  // Meter.
  const mw = Math.min(170, w * 0.48);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.2;
  ctx.fillRect(8, 8, mw, 58);
  ctx.strokeRect(8, 8, mw, 58);
  label(ctx, "Energy meter · kWh", 14, 22, "rgba(255,255,255,0.6)", "left", "10px system-ui, sans-serif");
  ctx.fillStyle = "#020617";
  ctx.fillRect(14, 28, mw - 12, 26);
  label(ctx, units.toFixed(1).padStart(7, "0"), 14 + (mw - 12) / 2, 48, "#67e8f9", "center", "bold 18px ui-monospace, monospace");
  // Pulse LED blinks faster with more power.
  const blink = r && prog < 1 ? Math.floor(now / 120) % 2 === 0 : false;
  ctx.fillStyle = blink ? "#f87171" : "rgba(248,113,113,0.25)";
  ctx.beginPath();
  ctx.arc(8 + mw - 8, 16, 3, 0, Math.PI * 2);
  ctx.fill();

  const rx = mw + 18;
  if (r) {
    label(ctx, `Day ${day} of ${DAYS_IN_MONTH}`, rx, 24, "rgba(255,255,255,0.8)", "left", "bold 12px system-ui, sans-serif");
    label(ctx, `${units.toFixed(1)} units × ₹${TARIFF_RS}`, rx, 42, "rgba(255,255,255,0.6)");
    label(ctx, `= ${fmtRs(units * TARIFF_RS)}`, rx, 60, prog >= 1 ? "#bef264" : "rgba(255,255,255,0.75)", "left", "bold 14px system-ui, sans-serif");
  } else {
    label(ctx, "Set the hours,", rx, 30, "rgba(255,255,255,0.6)");
    label(ctx, "then run a month.", rx, 46, "rgba(255,255,255,0.6)");
  }

  // Bars.
  const top = 80;
  const rowH = (h - top - 6) / APPLIANCE_IDS.length;
  const max = r ? Math.max(1, ...APPLIANCE_IDS.map((id) => r.units[id])) : 1;
  const bx = 34;
  const bw = w - bx - 70;
  APPLIANCE_IDS.forEach((id, i) => {
    const y = top + i * rowH;
    ctx.font = EMOJI(Math.min(15, rowH - 4));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(APPLIANCES[id].emoji, 17, y + rowH / 2);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(bx, y + 3, bw, rowH - 6);
    if (!r) return;
    const u = r.units[id] * prog;
    ctx.fillStyle = i % 2 ? COL.violet : COL.cyan;
    ctx.fillRect(bx, y + 3, (bw * u) / max, rowH - 6);
    label(ctx, `${u.toFixed(1)}`, bx + bw + 6, y + rowH / 2 + 4, "rgba(255,255,255,0.75)", "left", "10px system-ui, sans-serif");
  });
}
