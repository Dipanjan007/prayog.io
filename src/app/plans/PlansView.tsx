"use client";

import Link from "next/link";
import { useState } from "react";
import { FAMILY_PRICE, type Period } from "@/lib/access";
import { api, ApiError, refreshMe, useMe } from "@/lib/account";
import { useTier } from "@/lib/useTier";

interface Counts {
  lessons: number;
  labs: number;
  sets: number;
  outliers: number;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void };
  }
}

/** Razorpay's checkout script, fetched only when a parent presses Pay. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new ApiError("Couldn't load the payment page. Check your connection and try again.", 0));
    document.body.appendChild(s);
  });
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function PlansView({ counts, contact }: { counts: Counts; contact: string | null }) {
  const me = useMe();
  const tier = useTier();
  const [period, setPeriod] = useState<Period>("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  async function pay() {
    setError("");
    setBusy(true);
    try {
      const order = await api<{ orderId: string; keyId: string; amount: number; name: string; email: string }>("/api/billing/order", "POST", { period });
      await loadCheckout();
      const rzp = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: "INR",
        name: "Prayog",
        description: period === "year" ? "Family plan, 1 year" : "Family plan, 1 month",
        prefill: { name: order.name, email: order.email },
        theme: { color: "#22d3ee" },
        handler: async (r: RazorpayResponse) => {
          try {
            await api("/api/billing/verify", "POST", { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
            await refreshMe();
            setPaid(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "We couldn't confirm the payment. If money left your account, write to us.");
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const parent = me?.account?.role === "parent";
  const familyAction = () => {
    if (paid) return <p className="text-sm text-lime-300">🎉 Paid. Every lab is open for your family now.</p>;
    if (tier === "school" && !parent)
      return <p className="text-sm text-white/60">{me?.account ? "Teachers and their classes get every lab free." : "Your school already opens every lab for you."}</p>;
    if (me?.child && !me.account)
      return <p className="text-sm text-white/60">Ask a parent to sign in on their phone and upgrade from this page. Your progress stays the same.</p>;
    if (!parent)
      return (
        <div className="flex flex-wrap gap-2">
          <Link href="/join" className="btn-primary">
            Sign up free first
          </Link>
          <Link href="/signin" className="btn-ghost">
            Sign in
          </Link>
        </div>
      );
    return (
      <div className="flex flex-col gap-3">
        {me?.familyUntil && <p className="text-sm text-lime-300">Your Family plan runs until {date(me.familyUntil)}. Paying now adds to the end.</p>}
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-sm" role="radiogroup" aria-label="How long">
          {(["month", "year"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${period === p ? "bg-white/15 text-white" : "text-white/60 hover:text-white"}`}
            >
              {p === "month" ? `${rupees(FAMILY_PRICE.month)} a month` : `${rupees(FAMILY_PRICE.year)} a year`}
            </button>
          ))}
        </div>
        {me?.payments ? (
          <button type="button" className="btn-primary" onClick={pay} disabled={busy} data-testid="pay">
            {busy ? "Opening payment…" : `Pay ${rupees(FAMILY_PRICE[period])} with UPI or card`}
          </button>
        ) : (
          <button type="button" className="btn-primary" disabled data-testid="pay">
            Payments open soon
          </button>
        )}
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>
    );
  };

  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">
        Pick a <span className="text-gradient">plan</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Every plan has the same XP, stars and class leaderboard. Paying opens more labs, never a head start. No ads, ever.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <section className="glass flex flex-col rounded-3xl p-6" data-testid="plan-free">
          <div className="text-sm text-cyan-300">Free</div>
          <div className="font-display mt-1 text-3xl font-bold">₹0</div>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-white/70">
            <li>✓ Try now, no sign-up: 4 Class 7 and 8 lessons, 1 Olympiad set and 1 Outliers lab</li>
            <li>✓ With a free account: 6 lessons, 2 Olympiad sets and 2 Outliers labs</li>
            <li>✓ XP saved across devices, and your class leaderboard</li>
          </ul>
          <div className="mt-5">
            {tier === "visitor" ? (
              <Link href="/join" className="btn-ghost">
                Sign up free
              </Link>
            ) : (
              <p className="text-sm text-white/45">{tier === "free" ? "You're on this plan." : "Included."}</p>
            )}
          </div>
        </section>

        <section className="glass flex flex-col rounded-3xl p-6 ring-1 ring-cyan-300/40" data-testid="plan-family">
          <div className="text-sm text-cyan-300">Family · most popular</div>
          <div className="font-display mt-1 text-3xl font-bold">
            {rupees(FAMILY_PRICE.year)}
            <span className="text-base font-normal text-white/50"> a year</span>
          </div>
          <div className="text-sm text-white/50">or {rupees(FAMILY_PRICE.month)} a month. GST included.</div>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-white/70">
            <li>✓ All {counts.lessons} NCERT lessons for Classes 7 to 10, plus {counts.labs} second labs</li>
            <li>✓ All {counts.sets} Olympiad sets, for NSEJS and IJSO</li>
            <li>✓ All {counts.outliers} Outliers labs: black holes, relativity and more</li>
            <li>✓ Every child on your account</li>
            <li>✓ No auto-renew. Pay again only if you want to</li>
          </ul>
          <div className="mt-5">{familyAction()}</div>
        </section>

        <section className="glass flex flex-col rounded-3xl p-6" data-testid="plan-school">
          <div className="text-sm text-lime-300">School</div>
          <div className="font-display mt-1 text-3xl font-bold">
            ₹500<span className="text-base font-normal text-white/50"> a student a year</span>
          </div>
          <div className="text-sm text-white/50">Pilot price for our first schools.</div>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-white/70">
            <li>✓ Every lab for every student in the class</li>
            <li>✓ Teachers are always free</li>
            <li>✓ Class codes and picture passwords, no student emails</li>
            <li>✓ Class progress and leaderboard for the teacher</li>
          </ul>
          <div className="mt-5">
            {contact ? (
              <a href={`mailto:${contact}?subject=Prayog%20for%20our%20school`} className="btn-ghost">
                Write to us
              </a>
            ) : (
              <Link href="/teach" className="btn-ghost">
                For teachers
              </Link>
            )}
          </div>
        </section>
      </div>

      <p className="mt-6 max-w-2xl text-xs text-white/40">
        Payments go through Razorpay. We never see or store card or UPI details, and Razorpay never gets your child&apos;s details.
      </p>
    </div>
  );
}
