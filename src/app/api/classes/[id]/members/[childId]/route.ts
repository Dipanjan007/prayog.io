import { db } from "@/server/db";
import { fail, isUuid, noDb, ok } from "@/server/http";
import { currentAccount } from "@/server/session";

/**
 * Remove a student from a class. A profile the school created is deleted
 * outright when it is in no other class; a parent's child just leaves.
 */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/classes/[id]/members/[childId]">) {
  const off = noDb();
  if (off) return off;
  const { id, childId } = await ctx.params;
  const account = await currentAccount();
  if (account?.role !== "teacher") return fail("Please sign in as a teacher.", 401);
  if (!isUuid(id) || !isUuid(childId)) return fail("Student not found.", 404);
  const removed = await db().begin(async (tx) => {
    const rows = await tx`delete from class_members m using classes k
      where m.class_id = ${id} and m.child_id = ${childId} and k.id = m.class_id and k.teacher_id = ${account.id}
      returning m.child_id`;
    if (!rows.length) return false;
    await tx`delete from children c where c.id = ${childId} and c.parent_id is null
      and not exists (select 1 from class_members o where o.child_id = c.id)`;
    return true;
  });
  return removed ? ok({ removed: childId }) : fail("Student not found.", 404);
}
