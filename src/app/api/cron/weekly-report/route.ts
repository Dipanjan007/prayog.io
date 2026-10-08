import { timingSafeEqual } from "node:crypto";
import { reportText } from "@/lib/report";
import { db } from "@/server/db";
import { sendWeeklyReport } from "@/server/email";
import { fail, noDb, ok } from "@/server/http";
import { weekFor } from "@/server/report";

/**
 * Sunday evening email to Family plan parents (see vercel.json). Same
 * CRON_SECRET check as the retention job.
 */
export async function GET(req: Request) {
  const off = noDb();
  if (off) return off;
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail("CRON_SECRET isn't set.", 503);
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return fail("Not allowed.", 401);

  const parents = await db()<{ id: string; email: string; name: string }[]>`select a.id, a.email, a.name from accounts a
    where a.role = 'parent' and a.report_emails
      and exists (select 1 from subscriptions s where s.account_id = a.id and s.status = 'paid' and s.ends_at > now())
      and exists (select 1 from children c where c.parent_id = a.id)`;
  let sent = 0;
  for (const p of parents) {
    const kids = await weekFor(p.id);
    const text = kids.map((k) => reportText(k.nickname, k.report)).join("\n\n");
    if (await sendWeeklyReport(p.email, p.name, text)) sent++;
  }
  return ok({ parents: parents.length, sent });
}
