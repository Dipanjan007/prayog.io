import { headers } from "next/headers";
import { body, fail, ok } from "@/server/http";
import { canTakeSuggestions, saveSuggestion } from "@/server/suggestions";
import { parseSuggestion } from "@/lib/suggestion";

const WINDOW_MS = 10 * 60_000;
const PER_WINDOW = 5;
// Best effort per server instance; enough to stop a stuck button or a bored afternoon.
const recent = new Map<string, number[]>();

function tooMany(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > PER_WINDOW;
}

/** Whether the suggestion box can send right now (the form keeps ideas on the device if not). */
export async function GET() {
  return ok({ open: canTakeSuggestions() });
}

export async function POST(req: Request) {
  if (!canTakeSuggestions()) return fail("The suggestion box isn't switched on yet.", 503);
  const data = await body(req);
  // A hidden field people never see; bots fill it in.
  if (typeof data.website === "string" && data.website) return ok({ sent: true });
  const parsed = parseSuggestion(data);
  if ("error" in parsed) return fail(parsed.error);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(ip)) return fail("Thanks! That's a lot of ideas at once. Try again in a few minutes.", 429);
  if (!(await saveSuggestion(parsed))) return fail("We couldn't send that just now. It's kept on this device.", 502);
  return ok({ sent: true });
}
