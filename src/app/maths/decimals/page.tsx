import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Zoom beyond the point",
  description:
    "Class 7 NCERT Maths (Ganita Prakash Part 2): zoom into a number line to place tenths, hundredths and thousandths, compare race times, add and subtract rupees and paise, and multiply and divide by 10 and 100.",
};

export default function Page() {
  return <LessonPlayer />;
}
