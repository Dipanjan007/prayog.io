import { db } from "@/server/db";
import { body, fail, isClassNum, noDb, ok, str } from "@/server/http";
import { currentAccount, startChildSession, type Child } from "@/server/session";
import { childView } from "@/server/views";
import { saveProgress } from "@/server/progress";
import { parseProgress } from "@/lib/progress-merge";
import { AVATARS, CONSENT_VERSION, NICKNAME_RULE } from "@/lib/shared";

const MAX_CHILDREN = 6;

/**
 * A parent adds a child. Records the parent's consent, makes this device the
 * child's, and saves any progress the child already made on this device.
 */
export async function POST(req: Request) {
  const off = noDb();
  if (off) return off;
  const account = await currentAccount();
  if (account?.role !== "parent") return fail("Please sign in as a parent.", 401);

  const input = await body(req);
  const nickname = str(input.nickname, 16);
  if (!NICKNAME_RULE.test(nickname)) return fail("Nickname: 3 to 16 letters, numbers or spaces.");
  if (!isClassNum(input.classNum)) return fail("Pick a class from 7 to 10.");
  const avatar = AVATARS.includes(str(input.avatar)) ? str(input.avatar) : AVATARS[0];
  const progress = input.progress === undefined ? null : parseProgress(input.progress);

  const child = await db().begin(async (tx) => {
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from children where parent_id = ${account.id}`;
    if (n >= MAX_CHILDREN) return null;
    const [c] = await tx<Child[]>`insert into children (parent_id, nickname, class_num, avatar, show_on_leaderboard)
      values (${account.id}, ${nickname}, ${input.classNum as number}, ${avatar}, ${input.showOnLeaderboard === true})
      returning id, parent_id, nickname, class_num, avatar, show_on_leaderboard`;
    await tx`insert into consents (child_id, given_by, method, version)
      values (${c.id}, ${account.id}, 'parent_email_otp', ${CONSENT_VERSION})`;
    if (progress) await saveProgress(tx, c.id, progress);
    return c;
  });
  if (!child) return fail(`A family account can have up to ${MAX_CHILDREN} children.`);

  await startChildSession(child.id);
  return ok({ child: childView(child) }, 201);
}
