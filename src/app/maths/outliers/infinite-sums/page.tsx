import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Sums that never end",
  description:
    "Maths Outliers lab: eat half the laddoo again and again (1/2 + 1/4 + 1/8 + ... = 1), solve Zeno's race, watch the harmonic sum grow forever and find where a + ar + ar² + ... settles with a ÷ (1 − r).",
};

export default function Page() {
  return <LessonPlayer />;
}
