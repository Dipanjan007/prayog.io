import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "The auto fare line",
  description:
    "Class 9 NCERT Maths (Ganita Manjari): linear polynomials ax + b as an auto fare meter, their straight-line graphs, and the zero −b ÷ a where the line crosses the x-axis.",
};

export default function Page() {
  return <LessonPlayer />;
}
