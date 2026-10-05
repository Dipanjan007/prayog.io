import { db } from "@/server/db";
import { body, fail, noDb, ok } from "@/server/http";
import { currentChild } from "@/server/session";

/** The child on this device changes their own leaderboard choice. */
export async function PATCH(req: Request) {
  const off = noDb();
  if (off) return off;
  const child = await currentChild();
  if (!child) return fail("No profile on this device.", 401);
  const show = (await body(req)).showOnLeaderboard;
  if (typeof show !== "boolean") return fail("Nothing to change.");
  await db()`update children set show_on_leaderboard = ${show} where id = ${child.id}`;
  return ok({ showOnLeaderboard: show });
}
