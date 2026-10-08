import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { checkSecret, hashSecret } from "@/server/crypto";
import { body, fail, noDb, ok, str } from "@/server/http";
import { currentChild, startChildSession, type Child } from "@/server/session";
import { childView } from "@/server/views";
import { saveProgress } from "@/server/progress";
import { parseProgress } from "@/lib/progress-merge";
import { AVATARS, CONSENT_VERSION, NICKNAME_RULE, isPicturePassword } from "@/lib/shared";

const MAX_STUDENTS = 80;
const MAX_TRIES = 5;

interface ClassRow {
  id: string;
  teacher_id: string;
  class_num: number;
}

interface Member extends Child {
  picture_hash: string | null;
  locked_until: Date | null;
}

/**
 * A student joins a class with its code, or signs back in on another device.
 *
 * - A child whose parent already made a profile just joins (parent consent
 *   already covers them).
 * - A new student picks a nickname and a 3-picture password. The school acts
 *   as the consenting party, as the teacher agreed when signing up.
 * - A returning student types the same nickname and pictures.
 */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const input = await body(req);
  const code = str(input.code, 10).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const sql = db();
  const [klass] = await sql<ClassRow[]>`select id, teacher_id, class_num from classes where join_code = ${code}`;
  if (!klass) return fail("No class has that code. Check it with your teacher.", 404);

  const here = await currentChild();
  if (here?.parent_id) {
    await sql`insert into class_members (class_id, child_id) values (${klass.id}, ${here.id}) on conflict do nothing`;
    await audit("class_joined", { child: here.id, subject: klass.id }, sql);
    return ok({ child: childView(here), joined: true });
  }

  const nickname = str(input.nickname, 16);
  if (!NICKNAME_RULE.test(nickname)) return fail("Nickname: 3 to 16 letters, numbers or spaces.");
  if (!isPicturePassword(input.picture)) return fail("Pick 3 pictures for your password.");
  const picture = input.picture.join(" ");
  const returning = input.mode === "returning";

  const [existing] = await sql<Member[]>`
    select c.id, c.parent_id, c.nickname, c.class_num, c.avatar, c.show_on_leaderboard, c.picture_hash, c.locked_until
    from class_members m join children c on c.id = m.child_id
    where m.class_id = ${klass.id} and lower(c.nickname) = lower(${nickname})`;

  if (returning) {
    if (!existing || !existing.picture_hash) return fail("No one in this class has that nickname.", 404);
    if (existing.locked_until && existing.locked_until > new Date()) {
      return fail("Too many wrong tries. Ask your teacher to unlock you, or try again later.", 429);
    }
    if (!(await checkSecret(picture, existing.picture_hash))) {
      // Every 5th wrong try locks sign-in, for longer each time: 15 minutes,
      // then 1 hour, then a day. A classmate can't work through the few
      // hundred picture combinations; the teacher can unlock a real student.
      await sql`update children set
        failed_attempts = failed_attempts + 1,
        locked_until = case
          when (failed_attempts + 1) % ${MAX_TRIES} <> 0 then locked_until
          when failed_attempts + 1 = ${MAX_TRIES} then now() + interval '15 minutes'
          when failed_attempts + 1 = ${MAX_TRIES * 2} then now() + interval '1 hour'
          else now() + interval '1 day' end
        where id = ${existing.id}`;
      await audit("child_sign_in_failed", { subject: existing.id }, sql);
      return fail("Those pictures don't match. Try again.", 401);
    }
    await sql`update children set failed_attempts = 0, locked_until = null where id = ${existing.id}`;
    await startChildSession(existing.id, existing.parent_id === null);
    await audit("child_sign_in", { child: existing.id }, sql);
    return ok({ child: childView(existing) });
  }

  if (existing) return fail("Someone in this class already has that nickname. Pick another, or sign in.", 409);
  const avatar = AVATARS.includes(str(input.avatar)) ? str(input.avatar) : AVATARS[0];
  const progress = input.progress === undefined ? null : parseProgress(input.progress);
  const pictureHash = await hashSecret(picture);

  const child = await sql.begin(async (tx) => {
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from class_members where class_id = ${klass.id}`;
    if (n >= MAX_STUDENTS) return null;
    const [c] = await tx<Child[]>`insert into children (nickname, class_num, avatar, picture_hash, show_on_leaderboard)
      values (${nickname}, ${klass.class_num}, ${avatar}, ${pictureHash}, ${input.showOnLeaderboard === true})
      returning id, parent_id, nickname, class_num, avatar, show_on_leaderboard`;
    await tx`insert into consents (child_id, given_by, method, version) values (${c.id}, ${klass.teacher_id}, 'school', ${CONSENT_VERSION})`;
    await tx`insert into class_members (class_id, child_id) values (${klass.id}, ${c.id})`;
    if (progress) await saveProgress(tx, c.id, progress);
    await audit("child_created", { child: c.id, subject: klass.id }, tx);
    await audit("consent_given", { account: klass.teacher_id, subject: c.id, detail: { method: "school", version: CONSENT_VERSION } }, tx);
    return c;
  });
  if (!child) return fail("This class is full.", 409);
  await startChildSession(child.id, true);
  return ok({ child: childView(child), joined: true }, 201);
}
