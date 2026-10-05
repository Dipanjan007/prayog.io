"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, refreshMe, useMe } from "@/lib/account";
import { progressStore } from "@/lib/progress";
import { profileStore } from "@/lib/profile";
import { AVATARS, NICKNAME_RULE, PICTURE_COUNT, PICTURES } from "@/lib/shared";

/** Students join a class with its code, or sign back in on another device. */
export default function JoinClassPage() {
  const me = useMe();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"new" | "returning">("new");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [picture, setPicture] = useState<string[]>([]);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!me) return <div className="mx-auto mt-16 max-w-xl text-center text-white/50">Loading…</div>;
  if (!me.server) {
    return (
      <div className="glass mx-auto mt-8 max-w-md rounded-3xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Classes are coming soon</h1>
        <p className="mt-2 text-white/60">Your teacher will share a code when they are ready.</p>
      </div>
    );
  }

  // A child whose parent made their profile only needs the code.
  const familyChild = me.child && !me.child.viaSchool ? me.child : null;
  const codeOk = /^[A-Z0-9]{6}$/.test(code);
  const ready = codeOk && (familyChild || (NICKNAME_RULE.test(nickname.trim()) && picture.length === PICTURE_COUNT));

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      // Progress made here as a guest moves into a brand-new profile.
      const guest = !profileStore.get().child?.id;
      const r = await api<{ child: { id: string; nickname: string; classNum: 7 | 8 | 9 | 10; avatar: string; showOnLeaderboard: boolean } }>(
        "/api/classes/join",
        "POST",
        { code, mode, nickname: nickname.trim(), avatar, picture, showOnLeaderboard, progress: guest && mode === "new" ? progressStore.get() : undefined },
      );
      const prev = profileStore.get().child?.id;
      if (prev && prev !== r.child.id) progressStore.clear();
      const { id, nickname: n, classNum, avatar: a, showOnLeaderboard: s } = r.child;
      profileStore.set({ parent: null, child: { id, nickname: n, classNum, avatar: a, showOnLeaderboard: s } });
      await refreshMe();
      router.push("/me");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      if (e instanceof ApiError && e.status === 401) setPicture([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-4">
      <section className="glass rounded-3xl p-6">
        <div className="text-sm text-cyan-300">For students</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Join your class</h1>
        <label className="mt-5 grid gap-1 text-sm">
          <span className="text-white/60">Class code from your teacher</span>
          <input
            className="field text-center font-mono text-2xl uppercase tracking-[0.4em]"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>

        {familyChild ? (
          <p className="mt-4 text-sm text-white/60">
            You&apos;ll join as {familyChild.avatar} {familyChild.nickname}.
          </p>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
              {(["new", "returning"] as const).map((m) => (
                <button
                  key={m}
                  className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                >
                  {m === "new" ? "I'm new here" : "I've joined before"}
                </button>
              ))}
            </div>
            <label className="mt-4 grid gap-1 text-sm">
              <span className="text-white/60">Nickname (not your real name)</span>
              <input className="field" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. StormRider" />
            </label>

            <div className="mt-4 text-sm text-white/60">
              {mode === "new" ? "Pick 3 pictures as your secret password. Remember the order!" : "Tap your 3 secret pictures in order"}
            </div>
            <div className="mt-2 flex h-12 items-center justify-center gap-3 rounded-2xl bg-black/20 text-3xl" aria-live="polite">
              {Array.from({ length: PICTURE_COUNT }, (_, i) => (
                <span key={i} className={picture[i] ? "" : "opacity-30"}>
                  {picture[i] ? PICTURES.find((p) => p.id === picture[i])?.emoji : "•"}
                </span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PICTURES.map((p) => (
                <button
                  key={p.id}
                  className="rounded-xl border border-white/10 py-2 text-3xl disabled:opacity-40"
                  disabled={picture.length >= PICTURE_COUNT}
                  onClick={() => setPicture([...picture, p.id])}
                  aria-label={p.id}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
            {picture.length > 0 && (
              <button className="mt-2 text-xs text-white/50 underline" onClick={() => setPicture([])}>
                Clear pictures
              </button>
            )}

            {mode === "new" && (
              <>
                <div className="mt-4 text-sm text-white/60">Avatar</div>
                <div className="mt-1 grid grid-cols-6 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`rounded-xl border py-2 text-2xl ${avatar === a ? "border-violet-300 bg-violet-300/15" : "border-white/10"}`}
                      aria-label={`Avatar ${a}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-cyan-400"
                    checked={showOnLeaderboard}
                    onChange={(e) => setShowOnLeaderboard(e.target.checked)}
                  />
                  <span>Show my nickname on my class leaderboard (you can change this later).</span>
                </label>
                <p className="mt-3 text-xs text-white/40">
                  Your school signed up for Prayog. We only keep your nickname, avatar and progress. Your teacher sees your
                  progress; classmates see your nickname only if you say yes above.
                </p>
              </>
            )}
          </>
        )}

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={!ready || busy} onClick={submit}>
          {busy ? "Joining…" : mode === "returning" && !familyChild ? "Sign in" : "Join class"}
        </button>
      </section>
    </div>
  );
}
