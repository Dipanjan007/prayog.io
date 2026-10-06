"use client";

import { useState } from "react";
import { api, ApiError, type AccountInfo } from "@/lib/account";

export type Verified = { account: AccountInfo } | { needsSignup: true };

/**
 * Email, then a 6-digit code. `signup` is sent with the code so a new
 * account is only created once the email is proven.
 */
export default function EmailCode({
  email,
  onEmail,
  signup,
  ready = true,
  onVerified,
  sendLabel = "Email me a code",
  children,
}: {
  email: string;
  onEmail: (v: string) => void;
  signup?: Record<string, unknown>;
  /** Other fields on the form are filled in. */
  ready?: boolean;
  onVerified: (r: Verified) => void;
  sendLabel?: string;
  children?: React.ReactNode;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const send = () =>
    run(async () => {
      const r = await api<{ devCode?: string }>("/api/auth/code", "POST", { email: email.trim() });
      setSent(true);
      setHint(r.devCode ? `Development mode: your code is ${r.devCode}` : "");
    });

  const verify = () => run(async () => onVerified(await api<Verified>("/api/auth/verify", "POST", { email: email.trim(), code, signup })));

  if (!sent) {
    return (
      <>
        <label className="mt-4 grid gap-1 text-sm">
          <span className="text-white/60">Your email</span>
          <input className="field" type="email" value={email} onChange={(e) => onEmail(e.target.value)} autoComplete="email" />
        </label>
        {children}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={!emailOk || !ready || busy} onClick={send}>
          {busy ? "Sending…" : sendLabel}
        </button>
      </>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm text-white/70">
        We sent a 6-digit code to <strong>{email.trim()}</strong>. It works for 10 minutes.
      </p>
      {hint && <p className="mt-2 text-xs text-amber-200">{hint}</p>}
      <input
        className="field mt-3 text-center font-mono text-2xl tracking-[0.5em]"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        aria-label="6-digit code"
      />
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      <button className="btn-primary mt-4 w-full" disabled={code.length !== 6 || busy} onClick={verify}>
        {busy ? "Checking…" : "Continue"}
      </button>
      <button className="mt-3 w-full text-sm text-white/50 underline" disabled={busy} onClick={() => setSent(false)}>
        Use a different email or send again
      </button>
    </>
  );
}
