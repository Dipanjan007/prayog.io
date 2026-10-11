import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Squares on a right triangle",
  description:
    "Class 8 NCERT Maths (Ganita Prakash Part 2): the Baudhayana-Pythagoras theorem c² = a² + b², whole-number triples, and how long a fire ladder must be.",
};

export default function Page() {
  return <LessonPlayer />;
}
