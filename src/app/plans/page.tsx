import type { Metadata } from "next";
import { NCERT_STRANDS, OUTLIER_STRANDS } from "@/content/curriculum";
import { OLY_SETS } from "@/content/olympiad";
import PlansView from "./PlansView";

export const metadata: Metadata = {
  title: "Plans",
  description: "Try Prayog free, open more with a free account, or get every physics lab for Classes 7 to 10 with the Family plan.",
};

export default function PlansPage() {
  const chapters = NCERT_STRANDS.flatMap((s) => s.chapters);
  const counts = {
    lessons: chapters.filter((c) => c.href).length,
    labs: chapters.reduce((n, c) => n + (c.labs?.length ?? 0), 0),
    sets: OLY_SETS.length,
    outliers: OUTLIER_STRANDS.reduce((n, s) => n + s.chapters.filter((c) => c.href).length, 0),
  };
  return <PlansView counts={counts} contact={process.env.PRIVACY_CONTACT_EMAIL || null} />;
}
