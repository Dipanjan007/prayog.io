import { cronRefused, noDb, ok } from "@/server/http";
import { runRetention } from "@/server/retention";

/**
 * Daily clean-up, called by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without that secret set, it refuses.
 */
export async function GET(req: Request) {
  const off = noDb();
  if (off) return off;
  const refused = cronRefused(req);
  if (refused) return refused;
  return ok(await runRetention());
}
