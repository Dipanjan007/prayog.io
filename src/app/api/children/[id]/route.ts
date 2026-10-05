import { db } from "@/server/db";
import { fail, isUuid, noDb, ok } from "@/server/http";
import { currentAccount } from "@/server/session";

/** A parent deletes a child's profile, progress and consent records. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/children/[id]">) {
  const off = noDb();
  if (off) return off;
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("Child not found.", 404);
  const account = await currentAccount();
  if (account?.role !== "parent") return fail("Please sign in as a parent.", 401);
  const rows = await db()`delete from children where id = ${id} and parent_id = ${account.id} returning id`;
  if (!rows.length) return fail("Child not found.", 404);
  return ok({ deleted: id });
}
