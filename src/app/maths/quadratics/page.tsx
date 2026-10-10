import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Where the curve meets the ground",
  description:
    "Class 10 NCERT Maths: quadratic equations. Graph y = ax² + bx + c, find its roots, use the discriminant b² − 4ac and Sridharacharya's formula, and fence a garden with 40 m of wire.",
};

export default function Page() {
  return <LessonPlayer />;
}
