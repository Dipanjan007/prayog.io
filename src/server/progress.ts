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
  const week = tx`date_trunc('week', now() at time zone 'Asia/Kolkata')::date`;
  const [row] = await tx<{ data: Progress; xp: number; new_week: boolean }[]>`select data, xp, week_start <> ${week} as new_week
    from progress where child_id = ${childId} for update`;
  const merged = mergeProgress(row?.data ?? EMPTY_PROGRESS, incoming);
  // First save of a new week: keep Monday's starting point for the parent report.
  if (row?.new_week) await keepMonday(tx, childId, row.data, row.xp, week);
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

/** Saved before migration 006 runs too: without the table, it quietly skips. */
async function keepMonday(tx: postgres.TransactionSql, childId: string, data: Progress, xp: number, week: postgres.PendingQuery<postgres.Row[]>) {
  await tx`savepoint keep_monday`;
  try {
    await tx`insert into progress_weeks (child_id, week_start, data, xp)
      values (${childId}, ${week}, ${tx.json(data as unknown as postgres.JSONValue)}, ${xp}) on conflict do nothing`;
    await tx`release savepoint keep_monday`;
  } catch {
    await tx`rollback to savepoint keep_monday`;
  }
}
