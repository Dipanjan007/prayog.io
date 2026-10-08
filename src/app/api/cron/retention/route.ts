import { timingSafeEqual } from "node:crypto";
import { fail, noDb, ok } from "@/server/http";
import { runRetention } from "@/server/retention";

/**
 * Daily clean-up, called by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without that secret set, it refuses.
 */
export async function GET(req: Request) {
  const off = noDb();
  if (off) return off;
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail("CRON_SECRET isn't set.", 503);
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return fail("Not allowed.", 401);
  return ok(await runRetention());
}
