import "server-only";
import { db } from "./db";
import type { Child } from "./session";

export function childView(c: Child) {
  return {
    id: c.id,
    nickname: c.nickname,
    classNum: c.class_num,
    avatar: c.avatar,
    showOnLeaderboard: c.show_on_leaderboard,
    viaSchool: c.parent_id === null,
  };
}

export async function childrenOf(parentId: string) {
  const rows = await db()<Child[]>`select id, parent_id, nickname, class_num, avatar, show_on_leaderboard
    from children where parent_id = ${parentId} order by created_at`;
  return rows.map(childView);
}

export async function classesOfChild(childId: string) {
  return db()<{ id: string; name: string }[]>`select k.id, k.name from class_members m
    join classes k on k.id = m.class_id where m.child_id = ${childId} order by k.created_at`;
}

/** This week's XP, counted from Monday in India. */
export const WEEK_XP = `case when p.week_start = date_trunc('week', now() at time zone 'Asia/Kolkata')::date
  then p.xp - p.week_base_xp else 0 end`;
