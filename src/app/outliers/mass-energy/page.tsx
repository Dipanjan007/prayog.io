import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "E = mc²: mass is frozen energy",
  description:
    "Outliers lab, Class 10 level: turn mass into energy with E = mc², see how the Sun and India's nuclear reactors do it, and watch mass curve space-time so light bends and clocks slow down.",
};

export default function Page() {
  return <LessonPlayer />;
}
