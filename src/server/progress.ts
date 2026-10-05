import "server-only";
import type postgres from "postgres";
import type { Progress } from "@/lib/progress";
import { EMPTY_PROGRESS, mergeProgress } from "@/lib/progress-merge";

/**
 * Merge a device's progress into the saved copy and return the result.
 * The week columns keep the class leaderboard counting from Monday; a
 * child's first save counts in full for the week it happens in.
 */
export async function saveProgress(tx: postgres.TransactionSql, childId: string, incoming: Progress) {
  const [row] = await tx<{ data: Progress }[]>`select data from progress where child_id = ${childId} for update`;
  const merged = mergeProgress(row?.data ?? EMPTY_PROGRESS, incoming);
  const week = tx`date_trunc('week', now() at time zone 'Asia/Kolkata')::date`;
  await tx`insert into progress (child_id, data, xp, week_start, week_base_xp)
    values (${childId}, ${tx.json(merged as unknown as postgres.JSONValue)}, ${merged.xp}, ${week}, 0)
    on conflict (child_id) do update set
      data = excluded.data,
      xp = excluded.xp,
      week_base_xp = case when progress.week_start = excluded.week_start then progress.week_base_xp else progress.xp end,
      week_start = excluded.week_start,
      updated_at = now()`;
  return merged;
}
