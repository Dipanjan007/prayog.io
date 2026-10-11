import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Sunflowers and the golden ratio",
  description:
    "Maths Outliers lab: build the Virahanka-Fibonacci numbers, count rhythms like Indian poets did, watch neighbour ratios settle on φ ≈ 1.618, and grow a sunflower with the golden angle of 137.5°.",
};

export default function Page() {
  return <LessonPlayer />;
}
