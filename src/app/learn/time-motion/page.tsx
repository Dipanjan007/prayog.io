import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Measurement of Time and Motion",
  description: "Class 7 NCERT Curiosity: time a simple pendulum to find what sets its time period, then race a cycle, an auto-rickshaw and a cheetah to measure speed.",
};

export default function Page() {
  return <LessonPlayer />;
}
