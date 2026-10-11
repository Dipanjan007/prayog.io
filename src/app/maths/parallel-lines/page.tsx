import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Rails, roads and parallel lines",
  description:
    "Class 7 NCERT Maths (Ganita Prakash): turn a road across two railway rails to find corresponding, alternate and co-interior angles, and test whether lines are parallel.",
};

export default function Page() {
  return <LessonPlayer />;
}
