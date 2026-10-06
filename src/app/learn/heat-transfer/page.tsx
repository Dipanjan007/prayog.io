import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Heat Transfer in Nature",
  description: "Class 7 NCERT Curiosity: conduction along copper, steel, glass and wooden rods, convection currents in water, sea and land breezes, and radiation from the Sun.",
};

export default function Page() {
  return <LessonPlayer />;
}
