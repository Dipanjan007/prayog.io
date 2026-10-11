import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Toss, roll, spin and draw",
  description:
    "Class 9 NCERT Maths (Ganita Manjari): toss coins, roll dice, spin a spinner and draw marbles thousands of times, and watch experimental probability settle on the theoretical probability.",
};

export default function Page() {
  return <LessonPlayer />;
}
