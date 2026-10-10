import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Fold to the Moon",
  description:
    "Class 8 NCERT Maths (Ganita Prakash): fold a paper until it reaches the Moon, discover the laws of exponents with chips, and write big Indian numbers in scientific notation.",
};

export default function Page() {
  return <LessonPlayer />;
}
