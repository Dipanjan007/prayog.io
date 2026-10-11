import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Pizza slices and sprinklers",
  description:
    "Class 10 NCERT Maths: areas related to circles. Cut pizza slices to find arc length (θ ÷ 360) × 2πr and sector area (θ ÷ 360) × πr², find a segment as sector − triangle, and set a lawn sprinkler.",
};

export default function Page() {
  return <LessonPlayer />;
}
