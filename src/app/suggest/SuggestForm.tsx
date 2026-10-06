"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, useMe } from "@/lib/account";
import { useProfile } from "@/lib/profile";
import { AREAS, MAX_LENGTH, MIN_LENGTH, ROLES, type Suggestion, type SuggestionArea, type SuggestionRole } from "@/lib/suggestion";
import { pendingSuggestions } from "@/lib/suggestion-queue";

const ROLE_LABEL: Record<SuggestionRole, string> = { student: "🎒 Student", parent: "🏠 Parent", teacher: "🍎 Teacher" };
const CLASSES = [7, 8, 9, 10] as const;

const chip = (on: boolean) =>
  `rounded-full px-3.5 py-2 text-sm transition ${on ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/50" : "bg-white/5 text-white/70 hover:bg-white/10"}`;

/** The suggestion box: anyone can send an idea; it goes to the team's weekly review. */
export default function SuggestForm() {
  const me = useMe();
  const profile = useProfile();
  // A child using this device is most likely the one writing; otherwise the signed-in grown-up.
  const guessedRole: SuggestionRole = profile.child ? "student" : (me?.account?.role ?? "student");
  const [role, setRole] = useState<SuggestionRole | null>(null);
  const [area, setArea] = useState<SuggestionArea | null>(null);
  const [classNum, setClassNum] = useState<(typeof CLASSES)[number] | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"sent" | "saved" | null>(null);

  const who = role ?? guessedRole;
  const cls = classNum === undefined ? (profile.child?.classNum ?? null) : classNum;
  const length = text.trim().length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!area) return setError("Pick what your idea is about.");
    if (length < MIN_LENGTH) return setError("Tell us a little more, at least a sentence.");
    const from = new URLSearchParams(window.location.search).get("from");
    const idea: Suggestion = { role: who, area, classNum: cls, page: from, text: text.trim() };
    setBusy(true);
    setError("");
    try {
      await api("/api/suggestions", "POST", { ...idea, website });
      setDone("sent");
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 400 || status === 429) {
        setError((err as Error).message);
      } else {
        // Offline or the box isn't switched on yet: keep it and send it later.
        pendingSuggestions.update((q) => ({ items: [...q.items, idea] }));
        setDone("saved");
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="glass rounded-3xl p-6 text-center">
        <div className="text-5xl">{done === "sent" ? "🚀" : "📮"}</div>
        <h1 className="font-display mt-3 text-2xl font-bold">Thanks, idea received!</h1>
        <p className="mt-2 text-white/60">
          {done === "sent"
            ? "The Prayog team reads every idea in a weekly review, and the best ones get built into the app."
            : "It's saved on this device and sends itself as soon as it can, so you don't need to do anything."}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            onClick={() => {
              setDone(null);
              setText("");
              setArea(null);
            }}
          >
            Send another
          </button>
          <Link href="/learn" className="rounded-full bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-black">
            Back to learning
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="glass rounded-3xl p-6">
      <div className="text-sm text-cyan-300">Help build Prayog</div>
      <h1 className="font-display mt-2 text-3xl font-bold">Suggest an idea</h1>
      <p className="mt-2 text-white/60">
        A chapter you want, a simulation you&apos;d love to play, or something that&apos;s broken. We read every idea
        each week and build the best ones.
      </p>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-white/80">I am a</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button type="button" key={r} className={chip(who === r)} onClick={() => setRole(r)} aria-pressed={who === r}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-white/80">My idea is about</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {AREAS.map((a) => (
            <button
              type="button"
              key={a.id}
              className={`${chip(area === a.id)} rounded-2xl text-left`}
              onClick={() => setArea(a.id)}
              aria-pressed={area === a.id}
            >
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-white/80">
          Class <span className="text-white/40">(optional)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLASSES.map((c) => (
            <button type="button" key={c} className={chip(cls === c)} onClick={() => setClassNum(cls === c ? null : c)} aria-pressed={cls === c}>
              Class {c}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-white/80">Your idea</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          rows={5}
          placeholder="I wish I could race two cars down a ramp and see which one wins…"
          className="mt-2 w-full rounded-2xl bg-white/5 p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        />
        <span className="mt-1 flex justify-between text-xs text-white/40">
          <span>Please don&apos;t write your name, phone, email or school. We remove them anyway.</span>
          <span>
            {length}/{MAX_LENGTH}
          </span>
        </span>
      </label>

      {/* Hidden from people; bots fill it in. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="mt-3 text-sm text-amber-200">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 px-5 py-3 font-semibold text-black disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send my idea"}
      </button>
    </form>
  );
}
