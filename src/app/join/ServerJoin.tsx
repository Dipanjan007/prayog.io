"use client";

import Link from "next/link";
import { useState } from "react";
import EmailCode from "@/components/account/EmailCode";
import Family from "@/components/account/Family";
import { refreshMe, useMe } from "@/lib/account";

const PROMISES = [
  "We store only your name and email, and your child's nickname, class, avatar and progress.",
  "Data is kept on servers in India. We never show ads, track your child's behaviour, or sell or share data.",
  "You can delete everything at any time.",
];

/** Parent sign-up with a verified email, then the child's profile. */
export default function ServerJoin() {
  const me = useMe();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  if (me?.account?.role === "teacher") {
    return (
      <section className="glass rounded-3xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">You&apos;re signed in as a teacher</h1>
        <Link href="/teach" className="btn-primary mt-5">
          Go to your classes
        </Link>
      </section>
    );
  }
  if (me?.account?.role === "parent") return <Family />;

  return (
    <section className="glass rounded-3xl p-6">
      <div className="text-sm text-saffron-300">For the parent or guardian</div>
      <h1 className="font-display mt-2 text-3xl font-bold">Your consent comes first</h1>
      <p className="mt-2 text-muted">
        India&apos;s data protection law treats every student as a child, so we need a parent&apos;s permission before a
        profile is made. We check your email with a one-time code.
      </p>
      <label className="mt-5 grid gap-1 text-sm">
        <span className="text-muted">Your name</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <EmailCode
        email={email}
        onEmail={setEmail}
        ready={name.trim().length > 1 && isAdult && consent}
        signup={{ role: "parent", name: name.trim(), isAdult, consent }}
        onVerified={async (r) => {
          if ("account" in r && r.account.role === "teacher") {
            setError("That email belongs to a teacher account. Please use a different email.");
            return;
          }
          await refreshMe();
        }}
      >
        <ul className="mt-5 space-y-2 rounded-2xl bg-ink/20 p-4 text-sm text-muted">
          {PROMISES.map((p) => (
            <li key={p}>✓ {p}</li>
          ))}
        </ul>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-saffron-400" checked={isAdult} onChange={(e) => setIsAdult(e.target.checked)} />
          <span>I am the parent or legal guardian of this child, and I am 18 or older.</span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-saffron-400" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I give consent for my child to use Prayog as described in the{" "}
            <Link href="/privacy" className="underline">
              privacy notice
            </Link>
            .
          </span>
        </label>
      </EmailCode>
      {error && <p className="mt-3 text-sm text-brick-300">{error}</p>}
      <p className="mt-4 text-center text-sm text-faint">
        Already have an account?{" "}
        <Link href="/signin" className="underline">
          Sign in
        </Link>{" "}
        · Joining with a class code?{" "}
        <Link href="/join/class" className="underline">
          Join a class
        </Link>
      </p>
    </section>
  );
}
