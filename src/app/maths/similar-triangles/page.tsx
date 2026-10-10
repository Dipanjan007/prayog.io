import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Similar triangles and the pyramid's shadow",
  description:
    "Class 10 NCERT Maths: similar triangles. Scale a triangle and keep its angles, test the Basic Proportionality Theorem AD ÷ DB = AE ÷ EC and its converse, and measure heights with shadows like Thales.",
};

export default function Page() {
  return <LessonPlayer />;
}
