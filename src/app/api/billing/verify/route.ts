import { audit } from "@/server/audit";
import { markPaid, paymentsOn, signatureOk } from "@/server/billing";
import { body, fail, noDb, ok, str } from "@/server/http";
import { currentAccount } from "@/server/session";

/** Called by the page after Razorpay checkout succeeds. */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  if (!paymentsOn()) return fail("Payments aren't switched on.", 503);
  const account = await currentAccount();
  if (!account) return fail("Please sign in.", 401);
  const b = await body(req);
  const orderId = str(b.orderId, 100);
  const paymentId = str(b.paymentId, 100);
  const signature = str(b.signature, 200);
  if (!orderId || !paymentId || !signatureOk(orderId, paymentId, signature)) return fail("That payment didn't check out.", 400);
  const until = await markPaid(orderId, paymentId, account.id);
  if (until) await audit("payment_completed", { account: account.id, detail: { via: "checkout" } });
  // Null here usually means the webhook got there first, which is fine.
  return ok({ ok: true });
}
