import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Stadium rows and savings jars",
  description:
    "Class 9 NCERT Maths (Ganita Manjari): build arithmetic progressions from stadium rows and savings, find term n with a + (n − 1) × d, add a whole AP by pairing, and watch doubling race past adding.",
};

export default function Page() {
  return <LessonPlayer />;
}
