import { db } from "@/server/db";
import { fail, noDb, ok } from "@/server/http";
import { currentChild } from "@/server/session";
import { WEEK_XP } from "@/server/views";

/**
 * This week's leaderboard for each of the child's classes. Only children who
 * opted in are listed; the child always sees their own week's XP.
 */
export async function GET() {
  const off = noDb();
  if (off) return off;
  const child = await currentChild();
  if (!child) return fail("No profile on this device.", 401);
  const sql = db();
  const rows = await sql<{ class_id: string; class_name: string; child_id: string; nickname: string; avatar: string; week_xp: number; shown: boolean }[]>`
    select k.id as class_id, k.name as class_name, c.id as child_id, c.nickname, c.avatar,
      coalesce(${sql.unsafe(WEEK_XP)}, 0)::int as week_xp, c.show_on_leaderboard as shown
    from class_members mine
    join classes k on k.id = mine.class_id
    join class_members m on m.class_id = k.id
    join children c on c.id = m.child_id
    left join progress p on p.child_id = c.id
    where mine.child_id = ${child.id} and (c.show_on_leaderboard or c.id = ${child.id})
    order by k.created_at, week_xp desc, lower(c.nickname)`;

  const classes = new Map<string, { id: string; name: string; you: number; rows: { nickname: string; avatar: string; weekXp: number; you: boolean }[] }>();
  for (const r of rows) {
    const k = classes.get(r.class_id) ?? { id: r.class_id, name: r.class_name, you: 0, rows: [] };
    if (r.child_id === child.id) k.you = r.week_xp;
    if (r.shown && k.rows.length < 50) k.rows.push({ nickname: r.nickname, avatar: r.avatar, weekXp: r.week_xp, you: r.child_id === child.id });
    classes.set(r.class_id, k);
  }
  return ok({ classes: [...classes.values()] });
}
