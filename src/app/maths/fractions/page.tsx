import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Cut, share and fit fractions",
  description:
    "Class 7 NCERT Maths (Ganita Prakash): multiply fractions with the area model, find a fraction of a quantity, and divide by a fraction by counting how many pieces fit.",
};

export default function Page() {
  return <LessonPlayer />;
}
