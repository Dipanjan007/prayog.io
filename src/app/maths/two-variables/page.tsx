import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Pens, notebooks and one line",
  description:
    "Class 9 NCERT Maths (Ganita Manjari Part 2): linear equations in two variables like 2x + 3y = 12, why every solution lies on one line, intercepts, and two lines that cross at the answer.",
};

export default function Page() {
  return <LessonPlayer />;
}
