import { teaser } from "@/lib/report";
import { db } from "@/server/db";
import { fail, noDb, ok } from "@/server/http";
import { tierFor } from "@/server/plans";
import { weekFor } from "@/server/report";
import { currentAccount } from "@/server/session";

/**
 * A parent's weekly report. The Family plan sees all of it; a free account
 * sees the headline numbers, so they know what the full report holds.
 */
export async function GET() {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (!account) return fail("Please sign in.", 401);
  if (account.role !== "parent") return fail("Weekly reports are for parents. Teachers see their class on the Teach page.", 400);
  const full = (await tierFor(account, null)) === "family";
  let children;
  try {
    children = await weekFor(account.id);
  } catch (e) {
    console.error(e);
    return fail("Weekly reports aren't switched on yet.", 503);
  }
  const [{ report_emails }] = await db()<{ report_emails: boolean }[]>`select report_emails from accounts where id = ${account.id}`;
  return ok({
    full,
    emails: report_emails,
    children: children.map((c) => (full ? c : { ...c, report: undefined, summary: teaser(c.report) })),
  });
}
