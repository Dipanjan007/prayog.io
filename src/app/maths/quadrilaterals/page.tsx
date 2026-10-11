import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Four corners, many names",
  description:
    "Class 8 NCERT Maths (Ganita Prakash): quadrilaterals. Drag four corners and watch sides, angles and diagonals live, find the 360° angle sum, and name squares, rectangles, rhombuses, parallelograms, kites and trapeziums by their properties.",
};

export default function Page() {
  return <LessonPlayer />;
}
