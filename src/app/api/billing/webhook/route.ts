import { audit } from "@/server/audit";
import { markPaid, webhookOk } from "@/server/billing";
import { fail, noDb, ok } from "@/server/http";
import { db } from "@/server/db";

/**
 * Razorpay's `order.paid` webhook, so a payment still counts when the
 * parent closes the tab before the page hears back. Set it up in the
 * Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const raw = await req.text();
  if (!webhookOk(raw, req.headers.get("x-razorpay-signature") ?? "")) return fail("Not allowed.", 401);
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return fail("Bad body.");
  }
  const payment = event.payload?.payment?.entity;
  if (event.event === "order.paid" && payment?.id && payment.order_id) {
    if (await markPaid(payment.order_id, payment.id)) {
      const [row] = await db()<{ account_id: string }[]>`select account_id from subscriptions where razorpay_order_id = ${payment.order_id}`;
      await audit("payment_completed", { account: row?.account_id, detail: { via: "webhook" } });
    }
  }
  return ok({ ok: true });
}
