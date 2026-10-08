import { db } from "@/server/db";
import { joinCode } from "@/server/crypto";
import { body, fail, isClassNum, noDb, ok, str } from "@/server/http";
import { currentAccount } from "@/server/session";
import { WEEK_XP } from "@/server/views";
import type { Progress } from "@/lib/progress";

const MAX_CLASSES = 20;

interface MemberRow {
  class_id: string;
  child_id: string;
  nickname: string;
  avatar: string;
  xp: number | null;
  week_xp: number | null;
  lessons: Progress["lessons"] | null;
  locked: boolean;
}

/** A teacher's classes, each with its students' progress per lesson. */
export async function GET() {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (account?.role !== "teacher") return fail("Please sign in as a teacher.", 401);
  const sql = db();
  const classes = await sql<{ id: string; name: string; class_num: number; join_code: string }[]>`
    select id, name, class_num, join_code from classes where teacher_id = ${account.id} order by created_at`;
  const members = await sql<MemberRow[]>`
    select m.class_id, c.id as child_id, c.nickname, c.avatar, p.xp,
      ${sql.unsafe(WEEK_XP)} as week_xp, p.data->'lessons' as lessons,
      coalesce(c.locked_until > now(), false) as locked
    from class_members m
    join classes k on k.id = m.class_id and k.teacher_id = ${account.id}
    join children c on c.id = m.child_id
    left join progress p on p.child_id = c.id
    order by lower(c.nickname)`;
  return ok({
    classes: classes.map((k) => ({
      id: k.id,
      name: k.name,
      classNum: k.class_num,
      joinCode: k.join_code,
      students: members
        .filter((m) => m.class_id === k.id)
        .map((m) => ({ id: m.child_id, nickname: m.nickname, avatar: m.avatar, xp: m.xp ?? 0, weekXp: m.week_xp ?? 0, lessons: m.lessons ?? {}, locked: m.locked })),
    })),
  });
}

/** Create a class with a fresh join code. */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (account?.role !== "teacher") return fail("Please sign in as a teacher.", 401);
  const input = await body(req);
  const name = str(input.name, 60);
  if (name.length < 2) return fail("Give the class a name, like 8B Science.");
  if (!isClassNum(input.classNum)) return fail("Pick a class from 7 to 10.");

  const sql = db();
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from classes where teacher_id = ${account.id}`;
  if (n >= MAX_CLASSES) return fail(`You can have up to ${MAX_CLASSES} classes.`);

  for (let i = 0; i < 5; i++) {
    const code = joinCode();
    const rows = await sql<{ id: string }[]>`insert into classes (teacher_id, name, class_num, join_code)
      values (${account.id}, ${name}, ${input.classNum as number}, ${code})
      on conflict (join_code) do nothing returning id`;
    if (rows.length) return ok({ id: rows[0].id, joinCode: code }, 201);
  }
  return fail("Couldn't make a join code. Please try again.", 500);
}
