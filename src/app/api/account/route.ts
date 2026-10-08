import { audit } from "@/server/audit";
import { db } from "@/server/db";
import { body, fail, noDb, ok, str } from "@/server/http";
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
  await audit("account_deleted", { account: account.id, detail: { role: account.role } });
  await endSession(ADULT_COOKIE);
  await endSession(CHILD_COOKIE);
  return ok({ deleted: true });
}

/** Correct the grown-up's own details (their name, a teacher's school) and the weekly email choice. */
export async function PATCH(req: Request) {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (!account) return fail("Please sign in.", 401);
  const input = await body(req);
  const name = input.name === undefined ? account.name : str(input.name, 80);
  const school = input.schoolName === undefined || account.role !== "teacher" ? account.school_name : str(input.schoolName, 120);
  if (input.reportEmails !== undefined) {
    if (typeof input.reportEmails !== "boolean") return fail("Pick on or off.");
    await db()`update accounts set report_emails = ${input.reportEmails} where id = ${account.id}`;
  }
  if (name.length < 2) return fail("Please add your name.");
  if (account.role === "teacher" && (school ?? "").length < 2) return fail("Please add your school's name.");
  const [updated] = await db()`update accounts set name = ${name}, school_name = ${school}
    where id = ${account.id} returning id, role, name, email, school_name`;
  await audit("account_updated", { account: account.id });
  return ok({ account: updated });
}
