import "server-only";
import type { Progress } from "@/lib/progress";
import { EMPTY_PROGRESS } from "@/lib/progress-merge";
import { buildReport, type ChildReport } from "@/lib/report";
import { db } from "./db";

export interface ChildWeek {
  id: string;
  nickname: string;
  avatar: string;
  classNum: number;
  report: ChildReport;
}

/** This week's report for each of a parent's children. Needs migration 006. */
export async function weekFor(parentId: string): Promise<ChildWeek[]> {
  const rows = await db()<
    { id: string; nickname: string; avatar: string; class_num: number; data: Progress | null; this_week: boolean | null; monday: Progress | null }[]
  >`select c.id, c.nickname, c.avatar, c.class_num, p.data,
      p.week_start = date_trunc('week', now() at time zone 'Asia/Kolkata')::date as this_week,
      w.data as monday
    from children c
    left join progress p on p.child_id = c.id
    left join progress_weeks w on w.child_id = c.id and w.week_start = date_trunc('week', now() at time zone 'Asia/Kolkata')::date
    where c.parent_id = ${parentId} order by c.created_at`;
  return rows.map((r) => {
    const now = r.data ?? EMPTY_PROGRESS;
    // Nothing saved since Monday: the week starts where they are. Saved this
    // week with no Monday copy: their first week, so it all counts.
    const monday = !r.this_week ? now : (r.monday ?? EMPTY_PROGRESS);
    return { id: r.id, nickname: r.nickname, avatar: r.avatar, classNum: r.class_num, report: buildReport(now, monday, r.class_num) };
  });
}
