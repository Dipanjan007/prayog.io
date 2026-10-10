import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Mean, median and the century",
  description:
    "Class 9 NCERT Maths (Ganita Manjari Part 2): drag a cricketer's scores and class heights on a dot plot and watch the mean, median, mode and range move, and see why a century pulls the mean more than the median.",
};

export default function Page() {
  return <LessonPlayer />;
}
