import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Push it over, keep the land",
  description:
    "Class 8 NCERT Maths (Ganita Prakash Part 2): area. On a geoboard, push a rectangle into a parallelogram, see a triangle as half a parallelogram, build a trapezium from two copies, and mark out land plots.",
};

export default function Page() {
  return <LessonPlayer />;
}
