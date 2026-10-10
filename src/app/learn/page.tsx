import type { Metadata } from "next";
import Link from "next/link";
import { FreeNote } from "@/components/access/FreeNote";
import StrandMap from "@/components/learn/StrandMap";
import SubjectTabs from "@/components/learn/SubjectTabs";
import { BOOKS, CATALOGUE, NCERT_STRANDS } from "@/content/curriculum";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="pt-4">
      <SubjectTabs current="physics" />
      <h1 className="mt-4 font-display text-4xl font-bold">Your physics map</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Every NCERT Physics chapter from Class 7 to 10, grouped by topic: {CATALOGUE.lessons} playable chapters
        {CATALOGUE.planned ? ` (${CATALOGUE.planned} more coming)` : ""} and {CATALOGUE.labs} second labs. Curious about black
        holes and Einstein? Try the{" "}
        <Link href="/outliers" className="text-cyan-300 hover:underline">
          Outliers
        </Link>
        .
      </p>
      <FreeNote />
      <StrandMap strands={NCERT_STRANDS} books={BOOKS} />
    </div>
  );
}
