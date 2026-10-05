import { db } from "@/server/db";
import { sha256, sixDigitCode } from "@/server/crypto";
import { sendLoginCode } from "@/server/email";
import { body, fail, noDb, ok, str } from "@/server/http";

const MAX_CODES_PER_15_MIN = 3;

/** Email a 6-digit sign-in code. Used for both sign-up and sign-in. */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const email = str((await body(req)).email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email.");

  const sql = db();
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from login_codes
    where email = ${email} and created_at > now() - interval '15 minutes'`;
  if (n >= MAX_CODES_PER_15_MIN) return fail("Too many codes asked for. Please wait 15 minutes.", 429);

  const code = sixDigitCode();
  await sql`delete from login_codes where expires_at < now()`;
  await sql`insert into login_codes (email, code_hash, expires_at)
    values (${email}, ${sha256(`${email}:${code}`)}, now() + interval '10 minutes')`;

  if (!(await sendLoginCode(email, code))) return fail("Email isn't set up on the server yet.", 503);
  const devCode = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY ? code : undefined;
  return ok({ sent: true, devCode });
}
