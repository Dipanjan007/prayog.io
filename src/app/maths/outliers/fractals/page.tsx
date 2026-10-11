import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Shapes that never end",
  description:
    "Maths Outliers lab: grow the Sierpinski triangle and the Koch snowflake step by step, count their pieces, and see a perimeter grow without limit while the area stays finite.",
};

export default function Page() {
  return <LessonPlayer />;
}
