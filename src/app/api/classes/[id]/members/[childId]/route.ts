import { db } from "@/server/db";
import { audit } from "@/server/audit";
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
    await audit("member_removed", { account: account.id, subject: childId, detail: { class: id } }, tx);
    return true;
  });
  return removed ? ok({ removed: childId }) : fail("Student not found.", 404);
}

/** Unlock a student's picture-password sign-in after too many wrong tries. */
export async function PATCH(_req: Request, ctx: RouteContext<"/api/classes/[id]/members/[childId]">) {
  const off = noDb();
  if (off) return off;
  const { id, childId } = await ctx.params;
  const account = await currentAccount();
  if (account?.role !== "teacher") return fail("Please sign in as a teacher.", 401);
  if (!isUuid(id) || !isUuid(childId)) return fail("Student not found.", 404);
  const rows = await db()`update children c set failed_attempts = 0, locked_until = null
    from class_members m join classes k on k.id = m.class_id
    where c.id = ${childId} and m.child_id = c.id and m.class_id = ${id} and k.teacher_id = ${account.id}
    returning c.id`;
  if (!rows.length) return fail("Student not found.", 404);
  await audit("member_unlocked", { account: account.id, subject: childId });
  return ok({ unlocked: childId });
}
