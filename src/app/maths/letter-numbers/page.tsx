import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Matchstick rules",
  description:
    "Class 7 NCERT Maths (Ganita Prakash): find rules like 3n + 1 for growing matchstick and tile patterns, use them for step 100, and see why 4n + 4 = 4(n + 1).",
};

export default function Page() {
  return <LessonPlayer />;
}
