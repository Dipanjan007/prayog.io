import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Sound Waves: Characteristics and Applications",
  description: "Class 9 NCERT Physics: see sound as a longitudinal wave, change pitch and loudness, use v = fλ, hear echoes and find the depth of the sea with SONAR.",
};

export default function Page() {
  return <LessonPlayer />;
}
