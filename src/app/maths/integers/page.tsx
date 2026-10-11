import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Lifts, Leh and zero pairs",
  description:
    "Class 7 NCERT Maths (Ganita Prakash Part 2): add and subtract negative numbers with a lift and Leh's thermometer, cancel + and − tokens in zero pairs, and see why a negative times a negative is positive.",
};

export default function Page() {
  return <LessonPlayer />;
}
