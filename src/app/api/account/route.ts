import { fail, noDb, ok } from "@/server/http";
import { deleteAccount } from "@/server/accounts";
import { ADULT_COOKIE, CHILD_COOKIE, currentAccount, endSession } from "@/server/session";

/**
 * Delete the signed-in account and everything that hangs off it: a parent's
 * children and their progress, or a teacher's classes and the children the
 * school enrolled.
 */
export async function DELETE() {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (!account) return fail("Please sign in.", 401);
  await deleteAccount(account.id);
  await endSession(ADULT_COOKIE);
  await endSession(CHILD_COOKIE);
  return ok({ deleted: true });
}
