import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { newToken, sha256 } from "./crypto";

/** Grown-up (parent or teacher) sign-in, and the child using this device. */
export const ADULT_COOKIE = "prayog_session";
export const CHILD_COOKIE = "prayog_child";
const ADULT_DAYS = 30;
const CHILD_DAYS = 365;

export interface Account {
  id: string;
  role: "parent" | "teacher";
  name: string;
  email: string;
  school_name: string | null;
}

export interface Child {
  id: string;
  parent_id: string | null;
  nickname: string;
  class_num: number;
  avatar: string;
  show_on_leaderboard: boolean;
}

async function start(cookie: string, days: number, owner: { accountId?: string; childId?: string }) {
  const token = newToken();
  const expires = new Date(Date.now() + days * 86_400_000);
  await db()`insert into sessions (token_hash, account_id, child_id, expires_at)
    values (${sha256(token)}, ${owner.accountId ?? null}, ${owner.childId ?? null}, ${expires})`;
  (await cookies()).set(cookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export const startAdultSession = (accountId: string) => start(ADULT_COOKIE, ADULT_DAYS, { accountId });
export const startChildSession = (childId: string) => start(CHILD_COOKIE, CHILD_DAYS, { childId });

async function tokenHash(cookie: string) {
  const token = (await cookies()).get(cookie)?.value;
  return token ? sha256(token) : null;
}

export async function currentAccount(): Promise<Account | null> {
  const hash = await tokenHash(ADULT_COOKIE);
  if (!hash) return null;
  const rows = await db()<Account[]>`select a.id, a.role, a.name, a.email, a.school_name
    from sessions s join accounts a on a.id = s.account_id
    where s.token_hash = ${hash} and s.expires_at > now()`;
  return rows[0] ?? null;
}

export async function currentChild(): Promise<Child | null> {
  const hash = await tokenHash(CHILD_COOKIE);
  if (!hash) return null;
  const rows = await db()<Child[]>`select c.id, c.parent_id, c.nickname, c.class_num, c.avatar, c.show_on_leaderboard
    from sessions s join children c on c.id = s.child_id
    where s.token_hash = ${hash} and s.expires_at > now()`;
  return rows[0] ?? null;
}

export async function endSession(cookie: typeof ADULT_COOKIE | typeof CHILD_COOKIE) {
  const store = await cookies();
  const token = store.get(cookie)?.value;
  if (token) await db()`delete from sessions where token_hash = ${sha256(token)}`;
  store.delete(cookie);
}
