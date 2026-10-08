"use client";

import Link from "next/link";
import { FAMILY_PRICE, rupees } from "@/lib/access";

/** What to do about a locked lab: sign up free, or see the Family plan. */
export function LockPanel({ need, title, onClose }: { need: "register" | "upgrade"; title?: string; onClose?: () => void }) {
  return (
    <div className="glass mx-auto max-w-md rounded-3xl p-6 text-center" data-testid={`lock-${need}`}>
      <div className="text-4xl">{need === "register" ? "🔓" : "🔒"}</div>
      {title && <div className="mt-2 text-sm text-white/50">{title}</div>}
      {need === "register" ? (
        <>
          <h2 className="font-display mt-1 text-2xl font-bold">Sign up free to open this lab</h2>
          <p className="mt-2 text-sm text-white/65">
            A free account opens every NCERT lesson for Classes 7 to 10 and keeps your XP safe on any device. A parent signs up with their email in a minute.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/join" className="btn-primary" onClick={onClose}>
              Sign up free
            </Link>
            <Link href="/signin" className="btn-ghost" onClick={onClose}>
              I have an account
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="font-display mt-1 text-2xl font-bold">This is in the Family plan</h2>
          <p className="mt-2 text-sm text-white/65">
            The full Olympiad track and every Outliers lab, for {rupees(FAMILY_PRICE.month)} a month or {rupees(FAMILY_PRICE.year)} a year. NCERT lessons stay free, and
            schools get everything through their teacher.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/plans" className="btn-primary" onClick={onClose}>
              See plans
            </Link>
          </div>
        </>
      )}
      {onClose && (
        <button type="button" onClick={onClose} className="mt-4 text-sm text-white/45 hover:text-white">
          Not now
        </button>
      )}
    </div>
  );
}
