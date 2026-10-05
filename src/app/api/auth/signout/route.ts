import { body, noDb, ok } from "@/server/http";
import { ADULT_COOKIE, CHILD_COOKIE, endSession } from "@/server/session";

/** Sign out the grown-up, or take this device away from the child profile. */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const who = (await body(req)).who;
  await endSession(who === "child" ? CHILD_COOKIE : ADULT_COOKIE);
  return ok({ signedOut: true });
}
