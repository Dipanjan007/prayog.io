import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Circular Motion: Centripetal and Centrifugal Force",
  description:
    "Class 9 physics lab: whirl a ball and cut the string, ride along to feel centrifugal force, see why you weigh less at the equator, and launch satellites into orbit with F = m v² ÷ r.",
};

export default function Page() {
  return <LessonPlayer />;
}
