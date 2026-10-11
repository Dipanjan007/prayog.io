import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Tiles, corners and 360°",
  description:
    "Class 7 NCERT Maths (Ganita Prakash Part 2): fit regular polygon tiles round a corner, find why only triangles, squares and hexagons tile alone, and mix shapes into new floors.",
};

export default function Page() {
  return <LessonPlayer />;
}
