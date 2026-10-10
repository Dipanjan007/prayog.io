import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Slides, ramps and sin θ",
  description:
    "Class 10 NCERT Maths: introduction to trigonometry. Tilt and stretch a slide to see sin θ, cos θ and tan θ, learn the 30°, 45° and 60° values, check sin²θ + cos²θ = 1 and build a wheelchair ramp.",
};

export default function Page() {
  return <LessonPlayer />;
}
