import { db } from "@/server/db";
import { fail, isUuid, noDb, ok } from "@/server/http";
import { currentAccount, startChildSession } from "@/server/session";

/** A signed-in parent hands this device to one of their children. */
export async function POST(_req: Request, ctx: RouteContext<"/api/children/[id]/use">) {
  const off = noDb();
  if (off) return off;
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("Child not found.", 404);
  const account = await currentAccount();
  if (account?.role !== "parent") return fail("Please sign in as a parent.", 401);
  const [child] = await db()`select id from children where id = ${id} and parent_id = ${account.id}`;
  if (!child) return fail("Child not found.", 404);
  await startChildSession(id);
  return ok({ using: id });
}
