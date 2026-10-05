"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CLASSES, type ClassNum } from "@/content/curriculum";
import { AVATARS, CONSENT_VERSION, profileStore, useProfile } from "@/lib/profile";

const PROMISES = [
  "We store only your name and email, and your child's nickname, class, avatar and progress.",
  "We never show ads, track your child's behaviour, or sell or share data.",
  "You can delete everything at any time from the Me page.",
];

/** Sign-up when the server has no database: everything stays on this device. */
export default function LocalJoin() {
  const router = useRouter();
  const existing = useProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [agree, setAgree] = useState(false);
  const [nickname, setNickname] = useState("");
  const [classNum, setClassNum] = useState<ClassNum>(8);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const parentOk = parentName.trim().length > 1 && emailOk && isAdult && agree;
  const nicknameOk = /^[A-Za-z0-9_ ]{3,16}$/.test(nickname.trim());

  if (existing.child && step === 1 && !parentName) {
    return (
      <div className="glass mx-auto mt-8 max-w-md rounded-3xl p-6 text-center">
        <div className="text-5xl">{existing.child.avatar}</div>
        <h1 className="font-display mt-3 text-2xl font-bold">{existing.child.nickname} is all set</h1>
        <p className="mt-2 text-white/60">This device already has a profile.</p>
        <Link href="/learn" className="btn-primary mt-5">
          Go learn
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pt-4">
      <div className="mb-6 flex gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-cyan-300" : "bg-white/10"}`} />
        ))}
      </div>

      {step === 1 ? (
        <section className="glass rounded-3xl p-6">
          <div className="text-sm text-cyan-300">Step 1 of 2 · For the parent or guardian</div>
          <h1 className="font-display mt-2 text-3xl font-bold">Your consent comes first</h1>
          <p className="mt-2 text-white/60">
            India&apos;s data protection law treats every student as a child, so we need a parent&apos;s permission
            before a profile is made.
          </p>
          <div className="mt-5 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-white/60">Your name</span>
              <input className="field" value={parentName} onChange={(e) => setParentName(e.target.value)} autoComplete="name" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-white/60">Your email</span>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          </div>
          <ul className="mt-5 space-y-2 rounded-2xl bg-black/20 p-4 text-sm text-white/70">
            {PROMISES.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-cyan-400" checked={isAdult} onChange={(e) => setIsAdult(e.target.checked)} />
            <span>I am the parent or legal guardian of this child, and I am 18 or older.</span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-cyan-400" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              I give consent for my child to use Prayog as described in the{" "}
              <Link href="/privacy" className="underline">
                privacy notice
              </Link>
              .
            </span>
          </label>
          <button className="btn-primary mt-6 w-full" disabled={!parentOk} onClick={() => setStep(2)}>
            Continue
          </button>
          <p className="mt-3 text-center text-xs text-white/40">
            In this early version your details stay on this device. Email verification comes with accounts.
          </p>
        </section>
      ) : (
        <section className="glass rounded-3xl p-6">
          <div className="text-sm text-violet-300">Step 2 of 2 · Hand the device to your child</div>
          <h1 className="font-display mt-2 text-3xl font-bold">Make your explorer</h1>
          <label className="mt-5 grid gap-1 text-sm">
            <span className="text-white/60">Nickname (not your real name)</span>
            <input className="field" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. StormRider" />
            {nickname && !nicknameOk && <span className="text-xs text-rose-300">3 to 16 letters, numbers or spaces.</span>}
          </label>
          <div className="mt-4 text-sm text-white/60">Class</div>
          <div className="mt-1 flex gap-2">
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setClassNum(c)}
                className={`flex-1 rounded-xl border py-2 ${classNum === c ? "border-cyan-300 bg-cyan-300/15" : "border-white/10"}`}
              >
                {c}
              </button>
            ))}
          </div>
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
          <label className="mt-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-cyan-400"
              checked={showOnLeaderboard}
              onChange={(e) => setShowOnLeaderboard(e.target.checked)}
            />
            <span>Show my nickname on my class leaderboard (you can change this later).</span>
          </label>
          <div className="mt-6 flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="btn-primary flex-1"
              disabled={!nicknameOk}
              onClick={() => {
                profileStore.set({
                  parent: { name: parentName.trim(), email: email.trim(), consentVersion: CONSENT_VERSION, consentAt: new Date().toISOString() },
                  child: { nickname: nickname.trim(), classNum, avatar, showOnLeaderboard },
                });
                router.push("/learn");
              }}
            >
              Start exploring
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
