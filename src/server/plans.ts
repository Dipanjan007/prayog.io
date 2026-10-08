import "server-only";
import { bestTier, type Tier } from "@/lib/access";
import { db } from "./db";
import type { Account, Child } from "./session";

/** The family plan end date for a parent, or null when they aren't paying. */
export async function familyUntil(accountId: string): Promise<Date | null> {
  try {
    const rows = await db()<{ ends_at: Date }[]>`select max(ends_at) as ends_at from subscriptions
      where account_id = ${accountId} and status = 'paid' and ends_at > now()`;
    return rows[0]?.ends_at ?? null;
  } catch {
    // Before migration 005 runs there is no subscriptions table: nobody has paid.
    return null;
  }
}

/**
 * What this device can open. Teachers and school-enrolled children get
 * everything (the school plan). A child a parent signed up shares the
 * parent's plan.
 */
export async function tierFor(account: Account | null, child: Child | null): Promise<Tier> {
  const forAccount = async (): Promise<Tier> => {
    if (!account) return "visitor";
    if (account.role === "teacher") return "school";
    return (await familyUntil(account.id)) ? "family" : "free";
  };
  const forChild = async (): Promise<Tier> => {
    if (!child) return "visitor";
    if (child.parent_id === null) return "school";
    return (await familyUntil(child.parent_id)) ? "family" : "free";
  };
  const [a, c] = await Promise.all([forAccount(), forChild()]);
  return bestTier(a, c);
}
