import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { sha256 } from "@/server/crypto";
import { body, fail, noDb, ok, str } from "@/server/http";
import { teacherAllowed } from "@/server/accounts";
import { startAdultSession, type Account } from "@/server/session";

const MAX_ATTEMPTS = 5;

/**
 * Check a sign-in code. Signs in an existing account, or creates one when
 * `signup` is sent. A parent's account is only created after they prove the
 * email is theirs, which is what makes their consent verifiable.
 */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const input = await body(req);
  const email = str(input.email, 254).toLowerCase();
  const code = str(input.code, 6);
  if (!/^\d{6}$/.test(code)) return fail("The code is 6 digits.");

  const sql = db();
  const [row] = await sql<{ id: string; code_hash: string; attempts: number }[]>`
    select id, code_hash, attempts from login_codes
    where email = ${email} and expires_at > now() order by created_at desc limit 1`;
  if (!row || row.attempts >= MAX_ATTEMPTS) return fail("That code has expired. Ask for a new one.");

  const given = Buffer.from(sha256(`${email}:${code}`));
  if (!timingSafeEqual(given, Buffer.from(row.code_hash))) {
    await sql`update login_codes set attempts = attempts + 1 where id = ${row.id}`;
    return fail("That code isn't right. Check the latest email.");
  }

  let [account] = await sql<Account[]>`select id, role, name, email, school_name from accounts where email = ${email}`;

  if (!account) {
    const signup = (input.signup ?? null) as Record<string, unknown> | null;
    // Keep the code usable so the person can finish signing up.
    if (!signup) return ok({ needsSignup: true });

    const role = signup.role === "teacher" ? "teacher" : signup.role === "parent" ? "parent" : null;
    const name = str(signup.name, 80);
    const school = str(signup.schoolName, 120);
    if (!role || name.length < 2) return fail("Please add your name.");
    if (role === "parent" && (signup.isAdult !== true || signup.consent !== true)) {
      return fail("Please confirm you are the parent or guardian and give consent.");
    }
    if (role === "teacher") {
      if (school.length < 2) return fail("Please add your school's name.");
      if (signup.schoolConsent !== true) return fail("Please confirm your school has agreed to use Prayog.");
      if (!teacherAllowed(email)) {
        return fail("Teacher sign-up is invite-only during the pilot. Write to us to add your school.", 403);
      }
    }
    [account] = await sql<Account[]>`insert into accounts (role, name, email, school_name)
      values (${role}, ${name}, ${email}, ${role === "teacher" ? school : null})
      returning id, role, name, email, school_name`;
  }

  await sql`delete from login_codes where email = ${email}`;
  await startAdultSession(account.id);
  return ok({ account });
}
