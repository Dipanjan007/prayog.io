import "server-only";
import { audit } from "./audit";
import { deleteAccount } from "./accounts";
import { db } from "./db";
import { sendInactivityWarning } from "./email";

/**
 * How long we keep things. An account is "inactive" when nobody has signed in
 * to it, and none of its children has made progress, for two years.
 */
export const INACTIVE = "2 years";
export const WARNING_DAYS = 7;
/** Students a school enrolled have no parent to warn; a year unused, they go. */
export const SCHOOL_CHILD_INACTIVE = "1 year";
/** Rule 6 asks for at least a year of logs; keep a little over. */
export const AUDIT_KEEP = "400 days";

export async function runRetention() {
  const sql = db();
  const result = { warned: 0, deletedAccounts: 0, deletedSchoolChildren: 0, purgedLogs: 0 };

  await sql`delete from login_codes where expires_at < now()`;
  await sql`delete from sessions where expires_at < now()`;

  // Last sign of life for each account: its own sign-in, or any progress by
  // its children (parents) or its classes' students (teachers).
  const rows = await sql<{ id: string; email: string; role: string; deletion_warned_at: Date | null }[]>`
    select a.id, a.email, a.role, a.deletion_warned_at from accounts a
    where a.last_active_at < now() - ${INACTIVE}::interval
      and not exists (select 1 from children c join progress p on p.child_id = c.id
        where c.parent_id = a.id and p.updated_at > now() - ${INACTIVE}::interval)
      and not exists (select 1 from classes k join class_members m on m.class_id = k.id
        join progress p on p.child_id = m.child_id
        where k.teacher_id = a.id and p.updated_at > now() - ${INACTIVE}::interval)`;

  for (const a of rows) {
    if (!a.deletion_warned_at) {
      // Only start the clock once the warning has actually gone out.
      if (await sendInactivityWarning(a.email, WARNING_DAYS)) {
        await sql`update accounts set deletion_warned_at = now() where id = ${a.id}`;
        await audit("inactivity_warned", { subject: a.id }, sql);
        result.warned++;
      }
    } else if (a.deletion_warned_at < new Date(Date.now() - WARNING_DAYS * 86_400_000)) {
      await deleteAccount(a.id);
      await audit("inactive_deleted", { subject: a.id, detail: { role: a.role } }, sql);
      result.deletedAccounts++;
    }
  }

  const gone = await sql<{ id: string }[]>`delete from children c
    where c.parent_id is null and c.created_at < now() - ${SCHOOL_CHILD_INACTIVE}::interval
      and not exists (select 1 from progress p where p.child_id = c.id and p.updated_at > now() - ${SCHOOL_CHILD_INACTIVE}::interval)
    returning c.id`;
  for (const c of gone) await audit("inactive_deleted", { subject: c.id, detail: { role: "school_child" } }, sql);
  result.deletedSchoolChildren = gone.length;

  const purged = await sql`delete from audit_log where at < now() - ${AUDIT_KEEP}::interval`;
  result.purgedLogs = purged.count;
  return result;
}
