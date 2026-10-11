import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Three sticks make a triangle",
  description:
    "Class 7 NCERT Maths (Ganita Prakash): which three lengths make a triangle, the angle sum property ∠A + ∠B + ∠C = 180°, and naming triangles by their sides and angles.",
};

export default function Page() {
  return <LessonPlayer />;
}
