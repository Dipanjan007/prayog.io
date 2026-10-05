import { db } from "@/server/db";
import { body, fail, noDb, ok } from "@/server/http";
import { currentChild } from "@/server/session";
import { saveProgress } from "@/server/progress";
import { EMPTY_PROGRESS, parseProgress } from "@/lib/progress-merge";
import type { Progress } from "@/lib/progress";

export async function GET() {
  const off = noDb();
  if (off) return off;
  const child = await currentChild();
  if (!child) return fail("No profile on this device.", 401);
  const [row] = await db()<{ data: Progress }[]>`select data from progress where child_id = ${child.id}`;
  return ok({ progress: row?.data ?? EMPTY_PROGRESS });
}

/** Send this device's progress; get back the merge of every device. */
export async function PUT(req: Request) {
  const off = noDb();
  if (off) return off;
  const child = await currentChild();
  if (!child) return fail("No profile on this device.", 401);
  const progress = parseProgress((await body(req)).progress);
  if (!progress) return fail("Progress data isn't valid.");
  const merged = await db().begin((tx) => saveProgress(tx, child.id, progress));
  return ok({ progress: merged });
}
