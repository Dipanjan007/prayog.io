import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Measure the Qutub Minar",
  description:
    "Class 10 NCERT Maths: heights and distances with a clinometer. Angle of elevation, angle of depression, tan 30°, 45° and 60°, and h = (d × tan θ) + eye height.",
};

export default function Page() {
  return <LessonPlayer />;
}
