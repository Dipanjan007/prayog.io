import { isPeriod } from "@/lib/access";
import { audit, clientIp } from "@/server/audit";
import { db } from "@/server/db";
import { body, fail, noDb, ok, str } from "@/server/http";
import { currentAccount, currentChild } from "@/server/session";

const MAX_PER_IP_HOUR = 10;

/**
 * Join the Family plan waitlist while payments are off. Only a grown-up's
 * email: a signed-in parent's own, or one typed by someone who says they
 * are a parent or guardian. Children signed in on this device can't join.
 */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const [account, child] = await Promise.all([currentAccount(), currentChild()]);
  const input = await body(req);
  const period = isPeriod(input.period) ? input.period : "year";

  let email: string;
  if (account) {
    email = account.email;
  } else {
    if (child) return fail("Ask a parent to join the waitlist from their phone.", 403);
    if (input.adult !== true) return fail("Please confirm you're a parent or guardian.");
    email = str(input.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email.");
  }

  const sql = db();
  const ip = await clientIp();
  if (ip) {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from audit_log
      where ip = ${ip} and action = 'waitlist_joined' and at > now() - interval '1 hour'`;
    if (n >= MAX_PER_IP_HOUR) return fail("Too many sign-ups from this network. Please try again later.", 429);
  }
  await sql`insert into waitlist (email, period, account_id) values (${email}, ${period}, ${account?.id ?? null})
    on conflict (email) do update set period = excluded.period, account_id = coalesce(excluded.account_id, waitlist.account_id)`;
  await audit("waitlist_joined", { account: account?.id ?? null, detail: { period } });
  return ok({ joined: true });
}
