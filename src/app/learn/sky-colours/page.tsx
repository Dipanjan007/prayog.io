import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Why the sky is blue",
  description:
    "Class 10 NCERT Science: scatter light in a milky tank, turn a noon sky into a sunset, see why stars twinkle and the Sun rises early, and catch a rainbow at 42°.",
};

export default function Page() {
  return <LessonPlayer />;
}
