import { audit } from "@/server/audit";
import { createOrder, paymentsOn } from "@/server/billing";
import { body, fail, noDb, ok } from "@/server/http";
import { currentAccount } from "@/server/session";
import { isPeriod } from "@/lib/access";

/** Opens a Family plan checkout. Only a signed-in parent can pay. */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  if (!paymentsOn()) return fail("Payments open soon. Everything free stays free until then.", 503);
  const account = await currentAccount();
  if (!account) return fail("Please sign in as a parent first.", 401);
  if (account.role !== "parent") return fail("Teachers get every lab free with their school.", 400);
  const { period } = await body(req);
  if (!isPeriod(period)) return fail("Pick monthly or yearly.");
  try {
    const order = await createOrder(account.id, period);
    await audit("payment_started", { account: account.id, detail: { period } });
    return ok({ ...order, name: account.name, email: account.email });
  } catch (e) {
    console.error(e);
    return fail("We couldn't reach the payment service. Please try again.", 502);
  }
}
