/**
 * Subjects shown in the left panel, and the tabs each one has along the top.
 * A subject is listed only once it has playable labs; add Chemistry and
 * Biology here when their first labs ship.
 */
import { CATALOGUE } from "@/content/curriculum";

export interface Subject {
  id: "physics" | "maths";
  label: string;
  icon: string;
  /** The subject's tabs; the first one is where the subject opens. */
  tabs: { href: string; label: string }[];
}

export const SUBJECTS: Subject[] = [
  {
    id: "physics",
    label: "Physics",
    icon: "⚛️",
    tabs: [
      { href: "/learn", label: "Lab" },
      { href: "/outliers", label: "Outliers" },
      { href: "/olympiad", label: "Olympiad" },
    ],
  },
  {
    id: "maths",
    label: "Maths",
    icon: "📐",
    // The Outliers tab appears once its first labs ship.
    tabs: [
      { href: "/maths", label: "Lab" },
      ...(CATALOGUE.mathsOutliers ? [{ href: "/maths/outliers", label: "Outliers" }] : []),
      { href: "/maths/olympiad", label: "Olympiad" },
    ],
  },
];

const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** The subject a page belongs to, or null for pages like Home, Me and Plans. */
export function subjectFor(path: string): Subject | null {
  return SUBJECTS.find((s) => s.tabs.some((t) => under(path, t.href))) ?? null;
}

/** True when the tab is the one this page sits under: the deepest tab that matches wins, so /maths/outliers is not also Lab. */
export function tabActive(path: string, href: string) {
  if (!under(path, href)) return false;
  const tabs = subjectFor(path)?.tabs ?? [];
  return !tabs.some((t) => t.href.length > href.length && t.href.startsWith(`${href}/`) && under(path, t.href));
}
