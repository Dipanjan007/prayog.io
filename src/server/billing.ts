import "server-only";
import { createHmac } from "node:crypto";
import { FAMILY_PRICE, type Period } from "@/lib/access";
import { sameText } from "./crypto";
import { db } from "./db";

/** Payments switch on once both Razorpay keys are set in Vercel. */
export const paymentsOn = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/** Starts a Razorpay order for the Family plan and remembers it against the parent. */
export async function createOrder(accountId: string, period: Period) {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const amount = FAMILY_PRICE[period];
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    // Razorpay sees only the plan and our account id, never a child's details.
    body: JSON.stringify({ amount, currency: "INR", receipt: `fam-${Date.now()}`, notes: { plan: "family", period, account: accountId } }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  const order = (await res.json()) as { id: string };
  await db()`insert into subscriptions (account_id, plan, period, amount_paise, razorpay_order_id)
    values (${accountId}, 'family', ${period}, ${amount}, ${order.id})`;
  return { orderId: order.id, keyId, amount };
}

/** Razorpay signs `order_id|payment_id` with the key secret. */
export function signatureOk(orderId: string, paymentId: string, signature: string) {
  return sameText(signature, createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex"));
}

/**
 * Marks an order paid, from the browser after checkout or from Razorpay's
 * webhook, whichever comes first. The new period starts when any plan
 * already running ends, so paying early never loses days. Returns the end
 * date, or null when the order is unknown, not this parent's, or already
 * counted.
 */
export async function markPaid(orderId: string, paymentId: string, accountId?: string): Promise<Date | null> {
  return db().begin(async (sql) => {
    const [row] = await sql<{ id: string; account_id: string; period: Period }[]>`select id, account_id, period from subscriptions
      where razorpay_order_id = ${orderId} and status = 'created' for update`;
    if (!row || (accountId && row.account_id !== accountId)) return null;
    // One payment at a time per parent, so two quick payments both add their days.
    await sql`select 1 from accounts where id = ${row.account_id} for update`;
    const [{ start_at }] = await sql<{ start_at: Date }[]>`select greatest(now(), coalesce(max(ends_at), now())) as start_at
      from subscriptions where account_id = ${row.account_id} and status = 'paid'`;
    const step = row.period === "year" ? "1 year" : "1 month";
    const [done] = await sql<{ ends_at: Date }[]>`update subscriptions set status = 'paid', razorpay_payment_id = ${paymentId},
        starts_at = ${start_at}, ends_at = ${start_at}::timestamptz + ${step}::interval
      where id = ${row.id} returning ends_at`;
    return done.ends_at;
  });
}

/** Razorpay webhooks are signed with their own secret over the raw body. */
export function webhookOk(raw: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return sameText(signature, createHmac("sha256", secret).update(raw).digest("hex"));
}
