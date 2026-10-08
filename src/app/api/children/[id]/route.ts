import { audit } from "@/server/audit";
import { db } from "@/server/db";
import { body, fail, isClassNum, isUuid, noDb, ok, str } from "@/server/http";
import { currentAccount, type Child } from "@/server/session";
import { childView } from "@/server/views";
import { AVATARS, NICKNAME_RULE } from "@/lib/shared";

/** A parent deletes a child's profile, progress and consent records. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/children/[id]">) {
  const off = noDb();
  if (off) return off;
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("Child not found.", 404);
  const account = await currentAccount();
  if (account?.role !== "parent") return fail("Please sign in as a parent.", 401);
  const rows = await db()`delete from children where id = ${id} and parent_id = ${account.id} returning id`;
  if (!rows.length) return fail("Child not found.", 404);
  await audit("child_deleted", { account: account.id, subject: id });
  return ok({ deleted: id });
}

/** A parent corrects a child's nickname, class, avatar or leaderboard choice. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/children/[id]">) {
  const off = noDb();
  if (off) return off;
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("Child not found.", 404);
  const account = await currentAccount();
  if (account?.role !== "parent") return fail("Please sign in as a parent.", 401);
  const sql = db();
  const [child] = await sql<Child[]>`select id, parent_id, nickname, class_num, avatar, show_on_leaderboard
    from children where id = ${id} and parent_id = ${account.id}`;
  if (!child) return fail("Child not found.", 404);

  const input = await body(req);
  const nickname = input.nickname === undefined ? child.nickname : str(input.nickname, 16);
  if (!NICKNAME_RULE.test(nickname)) return fail("Nickname: 3 to 16 letters, numbers or spaces.");
  if (input.classNum !== undefined && !isClassNum(input.classNum)) return fail("Pick a class from 7 to 10.");
  const classNum = (input.classNum as number | undefined) ?? child.class_num;
  const avatar = AVATARS.includes(str(input.avatar)) ? str(input.avatar) : child.avatar;
  const show = typeof input.showOnLeaderboard === "boolean" ? input.showOnLeaderboard : child.show_on_leaderboard;

  const [updated] = await sql<Child[]>`update children
    set nickname = ${nickname}, class_num = ${classNum}, avatar = ${avatar}, show_on_leaderboard = ${show}
    where id = ${id} returning id, parent_id, nickname, class_num, avatar, show_on_leaderboard`;
  await audit("child_updated", { account: account.id, subject: id });
  return ok({ child: childView(updated) });
}
