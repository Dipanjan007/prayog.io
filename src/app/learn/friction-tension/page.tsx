import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Grip, slip and pull",
  description:
    "Class 9 NCERT Exploration, How Forces Affect Motion: pull a block with a spring balance to measure static and sliding friction on glass, wood and sandpaper, compare rolling, and find the acceleration and string tension of connected blocks.",
};

export default function Page() {
  return <LessonPlayer />;
}
