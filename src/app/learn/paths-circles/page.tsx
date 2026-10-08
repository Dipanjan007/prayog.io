import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Distance, displacement and going round",
  description:
    "Class 9 NCERT Physics: walk a city map to compare distance and displacement, find average speed and average velocity, throw a ball up and catch it, and roll a marble round a ring to see uniform circular motion.",
};

export default function Page() {
  return <LessonPlayer />;
}
