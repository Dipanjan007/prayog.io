import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "The Human Eye and the Colourful World",
  description: "Class 10 NCERT Physics: accommodation, myopia and hypermetropia with spectacles, and dispersion through a prism.",
};

export default function Page() {
  return <LessonPlayer />;
}
