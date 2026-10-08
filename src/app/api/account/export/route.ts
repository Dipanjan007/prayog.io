import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { db } from "@/server/db";
import { fail, noDb } from "@/server/http";
import { currentAccount } from "@/server/session";

/**
 * Everything we hold about the signed-in grown-up and the children they are
 * responsible for, as a JSON file (the right to access, DPDP Section 11).
 */
export async function GET() {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (!account) return fail("Please sign in.", 401);
  const sql = db();
  const [me] = await sql`select id, role, name, email, school_name, created_at, last_active_at from accounts where id = ${account.id}`;

  const children =
    account.role === "parent"
      ? await sql`select c.id, c.nickname, c.class_num, c.avatar, c.show_on_leaderboard, c.created_at,
            p.xp, p.updated_at as progress_updated_at, p.data as progress,
            coalesce((select json_agg(json_build_object('method', s.method, 'version', s.version, 'given_at', s.given_at))
              from consents s where s.child_id = c.id), '[]') as consents,
            coalesce((select json_agg(json_build_object('class', k.name, 'joined_at', m.joined_at))
              from class_members m join classes k on k.id = m.class_id where m.child_id = c.id), '[]') as classes
          from children c left join progress p on p.child_id = c.id
          where c.parent_id = ${account.id} order by c.created_at`
      : undefined;

  const classes =
    account.role === "teacher"
      ? await sql`select k.id, k.name, k.class_num, k.join_code, k.created_at,
            coalesce((select json_agg(json_build_object('nickname', c.nickname, 'avatar', c.avatar,
                'enrolled_by_school', c.parent_id is null, 'joined_at', m.joined_at, 'xp', p.xp, 'progress', p.data)
                order by lower(c.nickname))
              from class_members m join children c on c.id = m.child_id left join progress p on p.child_id = c.id
              where m.class_id = k.id), '[]') as students
          from classes k where k.teacher_id = ${account.id} order by k.created_at`
      : undefined;

  await audit("data_exported", { account: account.id });
  const file = { exported_at: new Date().toISOString(), account: me, children, classes };
  return new NextResponse(JSON.stringify(file, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="prayog-my-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
