import type { Metadata } from "next";
import { FreeNote } from "@/components/access/FreeNote";
import StrandMap from "@/components/learn/StrandMap";
import { CATALOGUE, MATHS_BOOKS, MATHS_STRANDS } from "@/content/curriculum";

export const metadata: Metadata = {
  title: "Maths",
  description: "NCERT Maths for Classes 7 to 10 as live labs: triangles, the Baudhayana-Pythagoras theorem, coordinates, and heights and distances.",
};

export default function MathsPage() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">Your maths map</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        NCERT Maths you can play with: {CATALOGUE.maths} chapters so far, one for each class from 7 to 10. Drag, stretch and measure, and
        the numbers change in front of you.
      </p>
      <FreeNote />
      <StrandMap strands={MATHS_STRANDS} books={MATHS_BOOKS} />
    </div>
  );
}
