import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "The water cycle",
  description:
    "Class 7 NCERT Curiosity: turn up the Sun and the monsoon wind, watch clouds and rain build on the Western Ghats, soak rain into soil or concrete, dry clothes and chill a sweating steel tumbler.",
};

export default function Page() {
  return <LessonPlayer />;
}
