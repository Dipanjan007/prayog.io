import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Twin triangles",
  description:
    "Class 7 NCERT Maths (Ganita Prakash): congruent triangles. Send a friend clues and see which ones (SSS, SAS, ASA, RHS) always give an exact twin, and why SSA and AAA do not.",
};

export default function Page() {
  return <LessonPlayer />;
}
