import type { Metadata } from "next";
import { CATALOGUE } from "@/content/curriculum";
import { OLY_SETS } from "@/content/olympiad";
import PlansView from "./PlansView";

export const metadata: Metadata = {
  title: "Plans",
  description: "Try Prayog free, open more with a free account, or get every physics lab for Classes 7 to 10 with the Family plan.",
};

export default function PlansPage() {
  const counts = { lessons: CATALOGUE.lessons, labs: CATALOGUE.labs, sets: OLY_SETS.length, outliers: CATALOGUE.outliers };
  return <PlansView counts={counts} contact={process.env.PRIVACY_CONTACT_EMAIL || null} />;
}
