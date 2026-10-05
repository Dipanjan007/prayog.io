import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Earth, Moon, and the Sun",
  description: "Class 7 NCERT Curiosity: rotation and day and night, revolution and the year, the tilted axis and seasons, and solar and lunar eclipses.",
};

export default function Page() {
  return <LessonPlayer />;
}
