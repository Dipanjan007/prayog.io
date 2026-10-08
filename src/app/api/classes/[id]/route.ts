import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { fail, isUuid, noDb, ok } from "@/server/http";
import { currentAccount } from "@/server/session";
import { deleteClass } from "@/server/accounts";

/** Delete a class and the student profiles the school created for it. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/classes/[id]">) {
  const off = noDb();
  if (off) return off;
  const { id } = await ctx.params;
  const account = await currentAccount();
  if (account?.role !== "teacher") return fail("Please sign in as a teacher.", 401);
  if (!isUuid(id)) return fail("Class not found.", 404);
  const found = await db().begin(async (tx) => {
    const [k] = await tx`select id from classes where id = ${id} and teacher_id = ${account.id} for update`;
    if (!k) return false;
    await deleteClass(tx, id);
    await audit("class_deleted", { account: account.id, subject: id }, tx);
    return true;
  });
  return found ? ok({ deleted: id }) : fail("Class not found.", 404);
}
