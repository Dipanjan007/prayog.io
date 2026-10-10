import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Same ratio, same taste",
  description:
    "Class 8 NCERT Maths (Ganita Prakash): proportional reasoning. Mix paint in a ratio, scale a nimbu-paani recipe, read a map scale, and see equal ratios on a straight line through (0, 0).",
};

export default function Page() {
  return <LessonPlayer />;
}
