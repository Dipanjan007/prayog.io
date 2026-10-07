import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Relativity: Moving Clocks Run Slow",
  description:
    "Outliers lab, Class 10 level: see that light has the same speed for everyone, watch a moving light clock tick slower, and meet time dilation in muons, GPS and the twin paradox.",
};

export default function Page() {
  return <LessonPlayer />;
}
