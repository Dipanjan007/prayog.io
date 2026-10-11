import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "The mandi balance",
  description:
    "Class 7 NCERT Maths (Ganita Prakash Part 2): find the unknown on a balance scale by doing the same thing to both sides, then write and solve equations like 3x + 2 = 14.",
};

export default function Page() {
  return <LessonPlayer />;
}
