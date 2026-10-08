import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Float or sink?",
  description:
    "Class 8 NCERT Curiosity, Exploring Forces: lower objects into water on a spring balance, weigh the overflow to find Archimedes' principle, float an egg in salt water, and make ring magnets and balloons repel.",
};

export default function Page() {
  return <LessonPlayer />;
}
