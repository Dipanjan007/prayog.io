/**
 * Who can open which lab. Visitors get a taste. A free account opens every
 * NCERT lesson (Physics and Maths), because the syllabus itself is free everywhere and children
 * only build the habit if tonight's chapter is open. The Family plan (or a
 * school) adds the full Olympiad track and Outliers. Paying never buys a
 * game advantage: XP, stars and the leaderboard work the same.
 *
 * This is checked in the browser, so it is a nudge, not a lock: lessons
 * are static pages that also work offline.
 */
import { STRANDS } from "@/content/curriculum";

export type Tier = "visitor" | "free" | "family" | "school";

export const TIERS: Tier[] = ["visitor", "free", "family", "school"];
export const isTier = (v: unknown): v is Tier => TIERS.includes(v as Tier);

/** Open to everyone, no sign-up: four Class 7 and 8 lessons, one Olympiad set, one Outliers lab. */
export const VISITOR_OPEN = [
  "/learn/earth-moon-sun",
  "/learn/circuits",
  "/learn/pressure-winds",
  "/learn/forces",
  "/olympiad/projectiles",
  "/outliers/gravity",
];

/** Beyond every NCERT lesson, a free account adds a second Olympiad set and a second Outliers lab. */
export const FREE_OPEN = [...VISITOR_OPEN, "/olympiad/newton", "/outliers/black-holes"];

const countOf = (list: string[], hub: string) => list.filter((k) => k.startsWith(`/${hub}/`)).length;

/** What each tier opens beyond the one below it, for the copy that explains the plans. */
export const OPENS = {
  visitor: { lessons: countOf(VISITOR_OPEN, "learn"), sets: countOf(VISITOR_OPEN, "olympiad"), outliers: countOf(VISITOR_OPEN, "outliers") },
  free: { sets: countOf(FREE_OPEN, "olympiad"), outliers: countOf(FREE_OPEN, "outliers") },
};

/** "1 Olympiad set", "2 Olympiad sets". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const freeWithAccount = (key: string) => key.startsWith("/learn/") || key.startsWith("/maths/") || FREE_OPEN.includes(key);

// A second lab opens with the chapter it belongs to.
const LAB_CHAPTER = new Map(
  STRANDS.flatMap((s) => s.chapters.flatMap((c) => (c.href ? (c.labs ?? []).map((l) => [l.href, c.href!] as const) : []))),
);

/** The lesson, lab or Olympiad set a path belongs to, or null when the page is open to all. */
export function contentKey(path: string): string | null {
  const m = path.match(/^\/(learn|maths|outliers|olympiad)\/([^/?#]+)/);
  if (!m) return null;
  const key = `/${m[1]}/${m[2]}`;
  return LAB_CHAPTER.get(key) ?? key;
}

/** What stands between this tier and the page: nothing, a free sign-up, or a paid plan. */
export function needs(tier: Tier, path: string): "register" | "upgrade" | null {
  const key = contentKey(path);
  if (!key || tier === "family" || tier === "school") return null;
  if (VISITOR_OPEN.includes(key)) return null;
  if (tier === "free") return freeWithAccount(key) ? null : "upgrade";
  return freeWithAccount(key) ? "register" : "upgrade";
}

const RANK: Record<Tier, number> = { visitor: 0, free: 1, family: 2, school: 2 };
/** The better of two tiers, for a device with both a grown-up and a child signed in. */
export const bestTier = (a: Tier, b: Tier) => (RANK[b] > RANK[a] ? b : a);

/** Prices in paise, GST included. */
export const FAMILY_PRICE = { month: 14900, year: 99900 } as const;

/** "₹999", from paise. */
export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
export type Period = keyof typeof FAMILY_PRICE;
export const isPeriod = (v: unknown): v is Period => v === "month" || v === "year";
